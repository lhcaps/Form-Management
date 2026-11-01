#!/usr/bin/env node
/**
 * scripts/audit/regenerate-bm006-runtime-docx.mjs
 *
 * Phase 3 of the BM-006 top-right template calibration pilot.
 *
 * Regenerates the BM-006 runtime preview DOCX using the exact same
 * renderer the API uses (PizZip + docxtemplater with {{ }} delimiters,
 * paragraphLoop+linebreaks on). This is the offline equivalent of what
 * a /forms/runtime/BM-006/preview-session POST would produce after the
 * source template calibration.
 *
 * BM-006's locked contract declares 15 runtime slots
 * (agency.parentName, agency.name, document.documentCode,
 *  document.issuePlaceAndDateLine, official.issuerTitle,
 *  sourceRequest.reasonLine, sourceRequest.receiverName,
 *  sourceRequest.actionLine, sourceRequest.caseSummary,
 *  sourceRequest.actionResultLine, agency.bodyName,
 *  recipients.primaryLine, signature.signMode,
 *  signature.positionTitle, signature.signerName). The curated
 * BM-006 runtime-ux profile (`apps/web/src/lib/runtime-ux/bm006-
 * runtime-ux-profile.ts`) ships matching demo values in
 * `BM006_DEMO`. We use those demo values here so the regenerated
 * DOCX is structurally equivalent to what a live preview-session
 * with demo data would produce. Rendered without bindings the
 * declared slots leak `undefined` text, which trips the curated
 * 37 golden-layout fidelity audit.
 *
 * Outputs:
 *   .tmp-bm006-top-right-template-calibration/BM-006.docx
 *   .tmp-bm006-top-right-template-calibration/BM-006_regen.json
 *   .tmp-docx-download-smoke/BM-006.docx
 *      (refreshed so downstream audit scripts see the calibrated
 *       geometry, per the BM-006 calibration EXECUTOR_REPORT)
 *
 * No mutation:
 *   - DB / Prisma / migrations
 *   - public API routes
 *   - FormFlight runtimeReady allowlist
 *   - any other BM template
 *   - any other DOCX
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Resolve docxtemplater and pizzip from apps/api, the only place they are
// installed in this pnpm workspace. Anchor on apps/api/package.json so node
// can find the dependency regardless of the caller's cwd.
const API_PKG = resolve(__dirname, "..", "..", "apps", "api", "package.json");
const apiRequire = createRequire(API_PKG);
const Docxtemplater = apiRequire("docxtemplater");
const PizZip = apiRequire("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const TEMPLATE = `${ROOT}/storage/templates/normalized-docx/BM-006/BM-006_normalized.docx`;
const PROFILE = `${ROOT}/apps/web/src/lib/runtime-ux/bm006-runtime-ux-profile.ts`;
const OUT_DIR = `${ROOT}/.tmp-bm006-top-right-template-calibration`;
const OUT_REGEN = `${OUT_DIR}/BM-006.docx`;
const OUT_META = `${OUT_DIR}/BM-006_regen.json`;
const DOWNLOAD_SMOKE_DIR = `${ROOT}/.tmp-docx-download-smoke`;
const DOWNLOAD_SMOKE_OUT = `${DOWNLOAD_SMOKE_DIR}/BM-006.docx`;

if (!existsSync(TEMPLATE)) {
  console.error(`FATAL: calibrated template missing: ${TEMPLATE}`);
  process.exit(1);
}
if (!existsSync(PROFILE)) {
  console.error(`FATAL: BM-006 runtime-ux profile missing: ${PROFILE}`);
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(DOWNLOAD_SMOKE_DIR, { recursive: true });

// Pull BM006_DEMO out of the curated runtime-ux profile. The file declares
// a const BM006_DEMO = { "agency.parentName": "...", ... } block; we parse
// it with the same regex pattern used by render-smoke-batch5-curation.mjs
// and others. This is a static read; no runtime import. Any drift between
// the profile and the locked contract stays visible in the diff — we don't
// silently reconcile.
function loadBm006Demo() {
  const src = readFileSync(PROFILE, "utf8");
  const match = src.match(
    /const BM006_DEMO\s*=\s*\{([\s\S]*?)\}\s*as const;/u,
  );
  if (!match) {
    throw new Error(
      "BM006_DEMO block not found in profile; cannot regenerate with bindings",
    );
  }
  const body = match[1];
  const entries = [];
  const kvRe = /"([^"]+)"\s*:\s*"((?:\\.|[^"\\])*)"/gu;
  for (const m of body.matchAll(kvRe)) {
    entries.push([m[1], m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\")]);
  }
  if (entries.length === 0) {
    throw new Error("BM006_DEMO parsed but no entries found");
  }
  return Object.fromEntries(entries);
}

const beforeBuf = readFileSync(TEMPLATE);
const beforeSha = createHash("sha256").update(beforeBuf).digest("hex");

const bindings = loadBm006Demo();

const zip = new PizZip(beforeBuf);
const document = new Docxtemplater(zip, {
  delimiters: { start: "{{", end: "}}" },
  linebreaks: true,
  paragraphLoop: true,
});

document.render(bindings);
const out = document.getZip().generate({ type: "nodebuffer" });

writeFileSync(OUT_REGEN, out);
writeFileSync(DOWNLOAD_SMOKE_OUT, out);

const afterSha = createHash("sha256").update(out).digest("hex");
const bindingsKeyList = Object.keys(bindings);
const bindingsValueLengths = Object.fromEntries(
  Object.entries(bindings).map(([k, v]) => [k, String(v).length]),
);

const meta = {
  regeneratedAt: new Date().toISOString(),
  script: "scripts/audit/regenerate-bm006-runtime-docx.mjs",
  templatePath: TEMPLATE,
  templateSha256: beforeSha,
  templateBytes: beforeBuf.length,
  outputs: {
    regenPilotPath: OUT_REGEN,
    downloadSmokePath: DOWNLOAD_SMOKE_OUT,
    sharedSha256: afterSha,
    sharedBytes: out.length,
  },
  renderer: "docxtemplater@apps/api/node_modules/pizzip",
  delimiters: ["{{", "}}"],
  paragraphLoop: true,
  linebreaks: true,
  bindingsSource:
    "apps/web/src/lib/runtime-ux/bm006-runtime-ux-profile.ts:BM006_DEMO",
  bindingsKeys: bindingsKeyList,
  bindingsKeyCount: bindingsKeyList.length,
  bindingsValueLengths,
  bindingsReason:
    "BM-006 locked contract declares 15 runtime slots (agency.*, document.documentCode, document.issuePlaceAndDateLine, official.issuerTitle, sourceRequest.*, recipients.primaryLine, signature.*). The curated runtime-ux profile ships matching demo values in BM006_DEMO; binding them here so the regenerated DOCX is structurally equivalent to the live /forms/runtime/BM-006/preview-session with demo data, and so downstream audit scripts (curated 37 golden-layout fidelity) do not see 'undefined' placeholder leaks.",
  notes: [
    "Offline equivalent of /forms/runtime/BM-006/preview-session render path.",
    "No DB / Prisma / API / FormFlight mutation.",
    "Pilot only — BM-006 only; no other form template was touched.",
    "FIDELITY_COMPLETE_EVIDENCED remains false; this is a structural regeneration test, not a visual fidelity test.",
  ],
};
writeFileSync(OUT_META, JSON.stringify(meta, null, 2));

console.log("Regenerated BM-006 runtime preview DOCX (offline render path).");
console.log(`  template:         ${TEMPLATE}`);
console.log(`  template sha256:  ${beforeSha}`);
console.log(`  output (pilot):   ${OUT_REGEN}`);
console.log(`  output (download): ${DOWNLOAD_SMOKE_OUT}`);
console.log(`  output sha256:    ${afterSha}`);
console.log(`  bytes: ${beforeBuf.length} -> ${out.length}`);
console.log(`  bindings applied: ${bindingsKeyList.length}`);
console.log(
  `  bindings keys: ${bindingsKeyList.join(", ")}`,
);