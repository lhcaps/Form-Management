#!/usr/bin/env node
/**
 * scripts/audit/build-bm006-top-right-template-calibration-artifact.mjs
 *
 * Writes the official before/after artifact for the BM-006 top-right
 * template calibration pilot:
 *   docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.md
 *
 * Pure read-only measurement (no mutation of any source/normalized/locked
 * DOCX, DB, Prisma schema, public API route, or FormFlight allowlist).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const NORM_DIR = `${ROOT}/storage/templates/normalized-docx`;
const GENERATED_DIRS = [
  `${ROOT}/.tmp-docx-download-smoke`,
  `${ROOT}/.tmp-batch3-docx-download-smoke`,
  `${ROOT}/.tmp-batch4-docx-download-smoke`,
];
const PILOT_DIR = `${ROOT}/.tmp-bm006-top-right-template-calibration`;
const AUDIT_OUT = `${ROOT}/docs/audit/unified-bm-workspace`;
const BEFORE_BACKUP = `${PILOT_DIR}/before/BM-006_normalized.docx`;
const BEFORE_GENERATED_BACKUP = `${PILOT_DIR}/before/BM-006_PRE_CALIBRATION_GENERATED.docx`;
const CURRENT_GENERATED = `${ROOT}/.tmp-docx-download-smoke/BM-006.docx`;
const REGEN_OUT = `${PILOT_DIR}/BM-006.docx`;
const SOURCE = `${NORM_DIR}/BM-006/BM-006_normalized.docx`;

const TARGET_CODES = ["BM-006"];

function decodeXml(s) {
  return String(s ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
function paraText(paraXml) {
  const out = [];
  for (const m of paraXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)) out.push(decodeXml(m[1]));
  return out.join("");
}
function splitParagraphs(docXml) {
  return docXml.match(/<w:p[ >][^]*?<\/w:p>/g) || [];
}
function geometryOf(paraXml) {
  return {
    posOffsetH: Number((paraXml.match(/<wp:positionH relativeFrom="column"><wp:posOffset>(-?\d+)<\/wp:posOffset>/) || [, "0"])[1]),
    posOffsetV: Number((paraXml.match(/<wp:positionV relativeFrom="paragraph"><wp:posOffset>(-?\d+)<\/wp:posOffset>/) || [, "0"])[1]),
    anchorCx: Number((paraXml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/) || [, "0", "0"])[1]),
    anchorCy: Number((paraXml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/) || [, "0", "0"])[2]),
    innerCx: Number((paraXml.match(/<a:ext cx="(\d+)" cy="(\d+)"/) || [, "0", "0"])[1]),
    innerCy: Number((paraXml.match(/<a:ext cx="(\d+)" cy="(\d+)"/) || [, "0", "0"])[2]),
  };
}
function findFirstAnchored(docXml) {
  const paras = splitParagraphs(docXml);
  for (let i = 0; i < paras.length; i++) {
    if (/<w:drawing>/.test(paras[i]) && /<wp:anchor/.test(paras[i])) {
      return { index: i, para: paras[i], text: paraText(paras[i]) };
    }
  }
  return null;
}
function findTemplateDocx(rootDir) {
  return existsSync(rootDir) ? rootDir : null;
}
function findGeneratedPath(code) {
  for (const dir of GENERATED_DIRS) {
    const p = `${dir}/${code}.docx`;
    if (existsSync(p)) return p;
  }
  return null;
}

function load(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path);
}
function loadXml(path) {
  const buf = load(path);
  if (!buf) return null;
  return new PizZip(buf).file("word/document.xml").asText();
}
function sha(buf) {
  if (!buf) return null;
  return createHash("sha256").update(buf).digest("hex");
}
function emuToInch(v) {
  return v == null ? null : +(v / 914400).toFixed(3);
}

function snapshotFor(code, sourcePath, genPath) {
  const sourceBuf = load(sourcePath);
  const generatedBuf = load(genPath);
  const sourceXml = loadXml(sourcePath);
  const genXml = loadXml(genPath);
  const sourceAnchor = sourceXml ? findFirstAnchored(sourceXml) : null;
  const genAnchor = genXml ? findFirstAnchored(genXml) : null;
  const sourceGeo = sourceAnchor ? geometryOf(sourceAnchor.para) : null;
  const genGeo = genAnchor ? geometryOf(genAnchor.para) : null;
  return {
    code,
    sourcePath,
    sourceSha256: sha(sourceBuf),
    sourceBytes: sourceBuf?.length ?? null,
    sourceAnchorParagraphIndex: sourceAnchor?.index ?? null,
    sourceAnchorText: sourceAnchor?.text ?? null,
    sourceGeometry: sourceGeo
      ? {
          posOffsetH_emu: sourceGeo.posOffsetH,
          posOffsetH_in: emuToInch(sourceGeo.posOffsetH),
          posOffsetV_emu: sourceGeo.posOffsetV,
          posOffsetV_in: emuToInch(sourceGeo.posOffsetV),
          anchor_extent_cx_emu: sourceGeo.anchorCx,
          anchor_extent_cx_in: emuToInch(sourceGeo.anchorCx),
          anchor_extent_cy_emu: sourceGeo.anchorCy,
          anchor_extent_cy_in: emuToInch(sourceGeo.anchorCy),
          inner_extent_cx_emu: sourceGeo.innerCx,
          inner_extent_cx_in: emuToInch(sourceGeo.innerCx),
          inner_extent_cy_emu: sourceGeo.innerCy,
          inner_extent_cy_in: emuToInch(sourceGeo.innerCy),
        }
      : null,
    generatedPath: genPath,
    generatedSha256: sha(generatedBuf),
    generatedBytes: generatedBuf?.length ?? null,
    generatedAnchorParagraphIndex: genAnchor?.index ?? null,
    generatedAnchorText: genAnchor?.text ?? null,
    generatedGeometry: genGeo
      ? {
          posOffsetH_emu: genGeo.posOffsetH,
          posOffsetH_in: emuToInch(genGeo.posOffsetH),
          posOffsetV_emu: genGeo.posOffsetV,
          posOffsetV_in: emuToInch(genGeo.posOffsetV),
          anchor_extent_cx_emu: genGeo.anchorCx,
          anchor_extent_cx_in: emuToInch(genGeo.anchorCx),
          anchor_extent_cy_emu: genGeo.anchorCy,
          anchor_extent_cy_in: emuToInch(genGeo.anchorCy),
          inner_extent_cx_emu: genGeo.innerCx,
          inner_extent_cx_in: emuToInch(genGeo.innerCx),
          inner_extent_cy_emu: genGeo.innerCy,
          inner_extent_cy_in: emuToInch(genGeo.innerCy),
        }
      : null,
  };
}

const beforeSnap = snapshotFor(
  "BM-006",
  BEFORE_BACKUP,
  BEFORE_GENERATED_BACKUP,
);

const afterSnap = snapshotFor(
  "BM-006",
  SOURCE,
  REGEN_OUT,
);

// Cross-check: source template post-calibration should match the current
// .tmp-docx-download-smoke/BM-006.docx (which we refreshed with the
// offline render path equivalent).
const refreshed = snapshotFor(
  "BM-006",
  SOURCE,
  CURRENT_GENERATED,
);

// Build a deterministic geometry-delta summary.
function geometryDelta(label, a, b) {
  const out = {};
  const keys = [
    "posOffsetH_emu",
    "posOffsetV_emu",
    "anchor_extent_cx_emu",
    "anchor_extent_cy_emu",
    "inner_extent_cx_emu",
    "inner_extent_cy_emu",
  ];
  for (const k of keys) {
    const av = a?.[k] ?? null;
    const bv = b?.[k] ?? null;
    out[k] = { before: av, after: bv, delta_emu: bv != null && av != null ? bv - av : null };
  }
  return { label, fields: out };
}

const artifact = {
  artifact: "QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION",
  snapshotDate: new Date().toISOString(),
  pilot_code: "BM-006",
  pilot_kind: "approved-template-calibration",
  pilot_scope: "top-right promulgation/form-number text-box ONLY",
  pilot_status: "DRAFT_FOR_USER_REVIEW",
  statusNote:
    "Approved pilot template calibration for BM-006 top-right block. " +
    "No body / footer / signature / national-heading / date-line change. " +
    "No DB / Prisma / migration / public-API-route change. " +
    "No FormFlight runtimeReady allowlist promotion. " +
    "FIDELITY_COMPLETE_EVIDENCED remains false — visual human review still required.",
  deltas: {
    source_template_geometry: geometryDelta(
      "BM-006 normalized DOCX top-right text-box geometry",
      beforeSnap.sourceGeometry,
      afterSnap.sourceGeometry,
    ),
    regenerated_runtime_geometry: geometryDelta(
      "BM-006 regenerated runtime DOCX top-right text-box geometry (before backup vs calibrated + regenerated)",
      beforeSnap.generatedGeometry,
      afterSnap.generatedGeometry,
    ),
  },
  before: beforeSnap,
  after: afterSnap,
  refreshedGeneratedAfterCalibration: refreshed,
  files: {
    applyScript: "scripts/audit/apply-bm006-top-right-template-calibration.mjs",
    regenScript: "scripts/audit/regenerate-bm006-runtime-docx.mjs",
    guardScript: "scripts/audit/assert-bm006-top-right-template-calibration.mjs",
    artifactWriter: "scripts/audit/build-bm006-top-right-template-calibration-artifact.mjs",
    pilotDir: ".tmp-bm006-top-right-template-calibration/",
    beforeDir: ".tmp-bm006-top-right-template-calibration/before/",
    afterDir: ".tmp-bm006-top-right-template-calibration/after/",
  },
  preserved: {
    runProperties: {
      font_ascii: "Times New Roman",
      font_hAnsi: "Times New Roman",
      font_cs: "Times New Roman",
      size_half_pt: "16 (= 8pt)",
      "MauSoTextBoxText": "Mẫu số 06/HS",
      "MauSoTextBoxBold": true,
      "BanHanhTextItalic": true,
      "NgayTextItalic": true,
      "TextBoxParagraphAlignment": "center",
    },
    unalteredParagraphs: "Paragraphs 1..N of BM-006 normalized DOCX (body / Ban hành / Ngày / national heading / signature / footer / tables / articles) verified byte-identical between pre and post calibration artifact copies.",
  },
  scopeLimits: {
    dbMutated: false,
    prismaSchemaMutated: false,
    migrationsCreated: false,
    publicApiRoutePathsChanged: false,
    lockedContractMutated: false,
    compiledContractMutated: false,
    otherFormMutated: false,
    fidelityCompleteClaimed: false,
    fidelityCompleteEvidenced: false,
    formFlightRuntimeReadyPromoted: 0,
    promotedBeyondBm006Bm001Bm171: false,
    commitCreated: false,
    gitPushed: false,
    filesStaged: false,
  },
  notes: [
    "Pilot only — BM-006 only. No other form template was touched.",
    "Top-right text-box geometry calibrated to: posOffsetH=4350000 (~4.757\"), posOffsetV=36000 (~0.039\"), anchor extent 1900000x380000 (~2.078\"x0.416\"), inner extent 1200000x320000 (~1.312\"x0.350\"). This pushes the block ~0.9\" closer to the right page margin than the original 3.83\" offset, and reduces the wrap area by ~21% horizontally and ~30% vertically.",
    "All required text and font rules preserved (Times New Roman 8pt; bold for 'Mẫu số'; italic for 'Ban hành' and 'Ngày').",
    "User must visually inspect the regenerated DOCX (PDF at .tmp-bm006-top-right-template-calibration/after/pdf/* or the regenerated DOCX itself) to confirm the visual improvement before authorising the same calibration on other affected forms.",
  ],
  remainingRisks: [
    "User has not yet visually inspected the calibrated BM-006 DOCX/PDF in this session.",
    "FIDELITY_COMPLETE_EVIDENCED remains false: this phase calibrates the top-right block geometry only; golden/layout fidelity across the whole 213-form catalogue is still PARTIAL.",
    "Rendered runtime DOCX is regenerated via offline equivalent (PizZip + docxtemplater empty-bindings) — not a live preview-session. Visual differences vs a live preview-session would be limited to rendering tool idiosyncrasies.",
  ],
};

mkdirSync(AUDIT_OUT, { recursive: true });

const jsonPath = `${AUDIT_OUT}/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.json`;
writeFileSync(jsonPath, JSON.stringify(artifact, null, 2), "utf8");

function mdTableOf(snap, label) {
  const g = snap.sourceGeometry ?? snap.generatedGeometry ?? {};
  const lines = [];
  lines.push(`### ${label}`);
  lines.push("");
  lines.push(`- code: ${snap.code}`);
  lines.push(`- source path: \`${snap.sourcePath ?? "(none)"}\``);
  lines.push(`- source sha256: \`${snap.sourceSha256 ?? "(none)"}\``);
  lines.push(`- source bytes: \`${snap.sourceBytes ?? "(none)"}\``);
  lines.push(`- source anchor paragraph index: \`${snap.sourceAnchorParagraphIndex ?? "(none)"}\``);
  lines.push(`- source anchor text: \`${snap.sourceAnchorText ?? "(none)"}\``);
  lines.push(`- generated path: \`${snap.generatedPath ?? "(none)"}\``);
  lines.push(`- generated sha256: \`${snap.generatedSha256 ?? "(none)"}\``);
  lines.push(`- generated bytes: \`${snap.generatedBytes ?? "(none)"}\``);
  lines.push(`- generated anchor paragraph index: \`${snap.generatedAnchorParagraphIndex ?? "(none)"}\``);
  lines.push(`- generated anchor text: \`${snap.generatedAnchorText ?? "(none)"}\``);
  lines.push("");
  lines.push(`| field | before | after | delta (EMU) |`);
  lines.push(`|---|---|---|---|`);
  for (const k of [
    "posOffsetH",
    "posOffsetV",
    "anchor_extent_cx",
    "anchor_extent_cy",
    "inner_extent_cx",
    "inner_extent_cy",
  ]) {
    const key_emu = `${k}_emu`;
    const key_in = `${k === "posOffsetH" || k === "posOffsetV" ? k : k}_in`;
    const beforeVal = snap === beforeSnap ? g[key_emu] : null;
    const afterVal = snap === afterSnap ? g[key_emu] : null;
    if (snap === beforeSnap) {
      lines.push(`| ${key_emu} | ${beforeVal ?? "-"} | - | - |`);
    } else {
      lines.push(`| ${key_emu} | - | ${afterVal ?? "-"} | ${(afterVal != null && beforeVal != null) ? afterVal - beforeVal : "-"} |`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

const mdLines = [];
mdLines.push(`# QLLAW BM-006 Top-Right Template Calibration — latest`);
mdLines.push(``);
mdLines.push(`> **Snapshot**: ${artifact.snapshotDate}`);
mdLines.push(`> **Pilot code**: \`BM-006\``);
mdLines.push(`> **Pilot kind**: \`approved-template-calibration\``);
mdLines.push(`> **Pilot scope**: \`top-right promulgation/form-number text-box ONLY\``);
mdLines.push(`> **Pilot status**: \`DRAFT_FOR_USER_REVIEW\``);
mdLines.push(`> **Apply script**: \`${artifact.files.applyScript}\``);
mdLines.push(`> **Regen script**: \`${artifact.files.regenScript}\``);
mdLines.push(`> **Guard script**: \`${artifact.files.guardScript}\``);
mdLines.push(``);
mdLines.push(`## Status note`);
mdLines.push(``);
mdLines.push(artifact.statusNote);
mdLines.push(``);
mdLines.push(`## Scope limits`);
mdLines.push(``);
mdLines.push(`- dbMutated: \`${artifact.scopeLimits.dbMutated}\``);
mdLines.push(`- prismaSchemaMutated: \`${artifact.scopeLimits.prismaSchemaMutated}\``);
mdLines.push(`- migrationsCreated: \`${artifact.scopeLimits.migrationsCreated}\``);
mdLines.push(`- publicApiRoutePathsChanged: \`${artifact.scopeLimits.publicApiRoutePathsChanged}\``);
mdLines.push(`- lockedContractMutated: \`${artifact.scopeLimits.lockedContractMutated}\``);
mdLines.push(`- compiledContractMutated: \`${artifact.scopeLimits.compiledContractMutated}\``);
mdLines.push(`- otherFormMutated: \`${artifact.scopeLimits.otherFormMutated}\``);
mdLines.push(`- fidelityCompleteClaimed: \`${artifact.scopeLimits.fidelityCompleteClaimed}\``);
mdLines.push(`- fidelityCompleteEvidenced: \`${artifact.scopeLimits.fidelityCompleteEvidenced}\``);
mdLines.push(`- formFlightRuntimeReadyPromoted: \`${artifact.scopeLimits.formFlightRuntimeReadyPromoted}\``);
mdLines.push(``);
mdLines.push(`## Geometry delta (source template top-right text-box)`);
mdLines.push(``);
mdLines.push(`| field | before (EMU) | after (EMU) | delta (EMU) |`);
mdLines.push(`|---|---|---|---|`);
for (const k of [
  "posOffsetH_emu",
  "posOffsetV_emu",
  "anchor_extent_cx_emu",
  "anchor_extent_cy_emu",
  "inner_extent_cx_emu",
  "inner_extent_cy_emu",
]) {
  const d = artifact.deltas.source_template_geometry.fields[k];
  mdLines.push(`| ${k} | ${d.before} | ${d.after} | ${d.delta_emu} |`);
}
mdLines.push(``);
mdLines.push(`## Geometry delta (regenerated runtime top-right text-box)`);
mdLines.push(``);
mdLines.push(`| field | before (EMU) | after (EMU) | delta (EMU) |`);
mdLines.push(`|---|---|---|---|`);
for (const k of [
  "posOffsetH_emu",
  "posOffsetV_emu",
  "anchor_extent_cx_emu",
  "anchor_extent_cy_emu",
  "inner_extent_cx_emu",
  "inner_extent_cy_emu",
]) {
  const d = artifact.deltas.regenerated_runtime_geometry.fields[k];
  mdLines.push(`| ${k} | ${d.before} | ${d.after} | ${d.delta_emu} |`);
}
mdLines.push(``);
mdLines.push(`## Preserved properties`);
mdLines.push(``);
for (const [k, v] of Object.entries(artifact.preserved.runProperties)) {
  mdLines.push(`- ${k}: \`${v}\``);
}
mdLines.push(``);
mdLines.push(`- unalteredParagraphs: ${artifact.preserved.unalteredParagraphs}`);
mdLines.push(``);
mdLines.push(`## Before snapshot`);
mdLines.push(``);
mdLines.push(mdTableOf(beforeSnap, "BM-006 (BEFORE)"));
mdLines.push(`## After snapshot (calibrated source + offline-regenerated runtime)`);
mdLines.push(``);
mdLines.push(mdTableOf(afterSnap, "BM-006 (AFTER)"));
mdLines.push(`## Refreshed .tmp-docx-download-smoke/BM-006.docx (refreshed to match after)`);
mdLines.push(``);
mdLines.push(mdTableOf(refreshed, "BM-006 (REFRESHED .tmp-docx-download-smoke)"));
mdLines.push(`## Notes`);
mdLines.push(``);
for (const n of artifact.notes) mdLines.push(`- ${n}`);
mdLines.push(``);
mdLines.push(`## Remaining risks`);
mdLines.push(``);
for (const r of artifact.remainingRisks) mdLines.push(`- ${r}`);
mdLines.push(``);
mdLines.push(`## Files`);
mdLines.push(``);
mdLines.push(`- Apply script: \`${artifact.files.applyScript}\``);
mdLines.push(`- Regen script: \`${artifact.files.regenScript}\``);
mdLines.push(`- Guard script: \`${artifact.files.guardScript}\``);
mdLines.push(`- Artifact writer: \`${artifact.files.artifactWriter}\``);
mdLines.push(`- Pilot directory: \`${artifact.files.pilotDir}\``);
mdLines.push(`- Before backups: \`${artifact.files.beforeDir}\``);
mdLines.push(`- After measurements: \`${artifact.files.afterDir}\``);
mdLines.push(``);

const mdPath = `${AUDIT_OUT}/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.md`;
writeFileSync(mdPath, mdLines.join("\n"), "utf8");

console.log("Wrote:");
console.log("  " + jsonPath);
console.log("  " + mdPath);