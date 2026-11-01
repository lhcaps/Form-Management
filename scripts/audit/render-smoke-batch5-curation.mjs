#!/usr/bin/env node
/**
 * Batch 5 source/render profile smoke.
 *
 * Read-only, local-file audit. It verifies the selected Batch 5 runtime UX
 * profiles have registered source/render metadata and curated demo values
 * without running browser/demo/preview/DOCX/fidelity phases.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const CANDIDATES = `${OUT_DIR}/QLLAW_BATCH5_CANDIDATES.latest.json`;
const OUT_JSON = `${OUT_DIR}/QLLAW_BATCH5_SOURCE_RENDER_SMOKE.latest.json`;
const OUT_MD = `${OUT_DIR}/QLLAW_BATCH5_SOURCE_RENDER_SMOKE.latest.md`;
const PROFILES_DIR = `${ROOT}/apps/web/src/lib/runtime-ux`;
const INDEX_FILE = `${PROFILES_DIR}/index.ts`;
const LOCKED_DIR = `${ROOT}/docs/audit/docx/contracts/locked`;
const COMPILED_DIR = `${ROOT}/docs/audit/docx/compiled-v2`;

const STALE_TOKENS = [
  "Nguyen Van A",
  "Tran Thi B",
  "Nguyễn Văn A",
  "Trần Thị B",
  "Ông cung cấp",
  "Ông  cung cấp",
  "Nguyễn Thị Hồng Hạnh",
  "1980",
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function readJson(path, label) {
  if (!existsSync(path)) fail(`missing ${label}: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`invalid JSON in ${label}: ${err.message}`);
  }
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function lockedExists(code) {
  if (!existsSync(LOCKED_DIR)) return false;
  const prefix = `${code}__`;
  return readdirSync(LOCKED_DIR).some(
    (name) => name.startsWith(prefix) && name.endsWith(".contract.locked.json"),
  );
}

function normalizedExists(code) {
  return listFiles(`${ROOT}/storage/templates/normalized-docx/${code}`).some((file) =>
    file.endsWith(".docx"),
  );
}

function demoBlock(src) {
  const match = src.match(/const BM\d{3}_DEMO_RUNTIME_UX = \{([\s\S]*?)\} as const;/u);
  return match?.[1] ?? "";
}

function fieldsBlock(src) {
  const match = src.match(/const BM\d{3}_FIELDS = \{([\s\S]*?)\} as const;/u);
  return match?.[1] ?? "";
}

function countFieldKeys(src) {
  return Array.from(fieldsBlock(src).matchAll(/"([a-zA-Z]+\.[a-zA-Z0-9]+)"\s*:/g)).length;
}

function countLabels(src) {
  return Array.from(fieldsBlock(src).matchAll(/\blabel\s*:/g)).length;
}

function countDemoKeys(src) {
  return Array.from(demoBlock(src).matchAll(/"([a-zA-Z]+\.[a-zA-Z0-9]+)"\s*:/g)).length;
}

function countSections(src) {
  return Array.from(src.matchAll(/\bsectionId\s*:/g)).length;
}

function staleHits(src) {
  const demo = demoBlock(src);
  return STALE_TOKENS.filter((token) => demo.includes(token));
}

const candidates = readJson(CANDIDATES, "Batch 5 candidates");
if (candidates.status !== "PASS") {
  fail(`candidate artifact status=${candidates.status}; expected PASS`);
}

const selectedCodes = candidates.selectedCodes ?? [];
const index = existsSync(INDEX_FILE) ? readFileSync(INDEX_FILE, "utf8") : "";

const results = selectedCodes.map((code) => {
  const profilePath = `${PROFILES_DIR}/bm${code.slice(3)}-runtime-ux-profile.ts`;
  const profileSrc = existsSync(profilePath) ? readFileSync(profilePath, "utf8") : "";
  const fieldCount = countFieldKeys(profileSrc);
  const labelCount = countLabels(profileSrc);
  const demoCount = countDemoKeys(profileSrc);
  const sections = countSections(profileSrc);
  const staleDemoTokens = staleHits(profileSrc);
  const demoContainsGeneratedPlaceholder = /\(m.u\s+BM-\d{3}\)|\(mẫu\s+BM-\d{3}\)/u.test(
    demoBlock(profileSrc),
  );
  const registered = index.includes(`./bm${code.slice(3)}-runtime-ux-profile`);
  const compiled = existsSync(`${COMPILED_DIR}/${code}.compiled.json`);
  const locked = lockedExists(code);
  const normalized = normalizedExists(code);
  const versionLabelCurated = profileSrc.includes(
    `${code} runtime-ux batch 5 curated source-render profile`,
  );
  const passes =
    normalized &&
    locked &&
    compiled &&
    registered &&
    sections > 0 &&
    fieldCount > 0 &&
    labelCount >= fieldCount &&
    demoCount >= fieldCount &&
    staleDemoTokens.length === 0 &&
    !demoContainsGeneratedPlaceholder &&
    versionLabelCurated;

  return {
    code,
    normalizedDocxAvailable: normalized,
    lockedContractAvailable: locked,
    compiledContractAvailable: compiled,
    profileRegistered: registered,
    sections,
    labels: labelCount,
    fields: fieldCount,
    demoData: demoCount,
    staleDemoTokens,
    demoContainsGeneratedPlaceholder,
    versionLabelCurated,
    sourceRender: passes ? "PASS" : "FAIL",
    passes,
  };
});

const artifact = {
  snapshotDate: new Date().toISOString(),
  status: results.every((row) => row.passes) ? "PASS" : "FAIL",
  totalForms: selectedCodes.length,
  formsSourceRenderPassed: results.filter((row) => row.passes).length,
  formsSourceRenderFailed: results.filter((row) => !row.passes).length,
  browserVisibilityStatus: "NOT_RUN for Batch 5",
  demoClickStatus: "NOT_RUN for Batch 5",
  previewClickStatus: "NOT_RUN for Batch 5",
  docxDownloadStatus: "NOT_RUN for Batch 5",
  machineCheckableFidelityStatus: "NOT_RUN for Batch 5",
  visualPdfReviewStatus: "NOT_RUN for Batch 5",
  humanReviewStatus: "NOT_RUN for Batch 5",
  results,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(artifact, null, 2));

const lines = [];
lines.push("# QLLAW Batch 5 Source/Render Smoke - latest");
lines.push("");
lines.push(`> Generated: ${artifact.snapshotDate}`);
lines.push(`> Status: ${artifact.status}`);
lines.push(`> Forms source/render passed: ${artifact.formsSourceRenderPassed}`);
lines.push("");
lines.push("| Code | Normalized | Locked | Compiled | Registered | Sections | Labels | Demo Data | Source Render |");
lines.push("|---|---|---|---|---|---|---|---|---|");
for (const row of results) {
  lines.push(
    `| ${row.code} | ${row.normalizedDocxAvailable} | ${row.lockedContractAvailable} | ${row.compiledContractAvailable} | ${row.profileRegistered} | ${row.sections} | ${row.labels} | ${row.demoData} | ${row.sourceRender} |`,
  );
}
lines.push("");
writeFileSync(OUT_MD, lines.join("\n"));

console.log(JSON.stringify(artifact, null, 2));
if (artifact.status !== "PASS") process.exit(1);
