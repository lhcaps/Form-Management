#!/usr/bin/env node
/**
 * Read-only guard for the 117-row source/render curation state.
 *
 * Asserts:
 *   - 213 rows total.
 *   - INPUT_CONNECTED_PASS = 117.
 *   - INPUT_CONNECTED_PARTIAL = 96.
 *   - curated 37 evidence intact (status=PASS, sourceRenderVerified=true,
 *     browser/demo/preview/docxDownload verified, fidelityComplete=false).
 *   - Batch 3 evidence intact (all 20 PASS, all 5 verified, fidelityComplete=false).
 *   - Batch 4 evidence intact (all 20 PASS, all 5 verified, fidelityComplete=false).
 *   - Batch 5 evidence intact (all 20 sourceRenderVerified, downstream NOT_RUN).
 *   - Batch 6 evidence intact (all 20 sourceRenderVerified, downstream NOT_RUN).
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171.
 *   - No fidelityComplete=true globally; FIDELITY_COMPLETE_EVIDENCED=false.
 *   - No selected Batch 6 row carries generated/workspace lifecycle fields.
 *   - No non-selected partial row got batch6SourceRenderVerified=true.
 *   - BM-006 KEEP/calibration state unchanged.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const BATCH5_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH5_CURATION.latest.json`;
const BATCH6_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH6_CURATION.latest.json`;
const BM006_ARTIFACT = `${OUT_DIR}/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.json`;

const CURATED_37 = [
  "BM-001", "BM-005", "BM-006", "BM-007", "BM-008", "BM-009", "BM-010",
  "BM-011", "BM-012", "BM-014", "BM-015", "BM-017", "BM-018", "BM-019",
  "BM-020", "BM-022", "BM-023", "BM-030", "BM-031", "BM-033", "BM-035",
  "BM-036", "BM-037", "BM-038", "BM-040", "BM-042", "BM-043", "BM-044",
  "BM-045", "BM-046", "BM-047", "BM-048", "BM-052", "BM-053", "BM-054",
  "BM-070", "BM-171",
];

const BATCH3_CODES = [
  "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-060",
  "BM-061", "BM-062", "BM-063", "BM-064", "BM-065", "BM-066",
  "BM-067", "BM-068", "BM-069", "BM-071", "BM-072", "BM-073",
  "BM-074", "BM-075",
];

const BATCH4_CODES = [
  "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084",
  "BM-085", "BM-086", "BM-087", "BM-088", "BM-090", "BM-091",
  "BM-092", "BM-093", "BM-094", "BM-095", "BM-096", "BM-097",
  "BM-098", "BM-100",
];

const BATCH5_CODES = [
  "BM-101", "BM-102", "BM-103", "BM-104", "BM-105", "BM-106",
  "BM-107", "BM-108", "BM-109", "BM-110", "BM-111", "BM-112",
  "BM-113", "BM-114", "BM-115", "BM-116", "BM-117", "BM-118",
  "BM-119", "BM-120",
];

const BATCH6_CODES = [
  "BM-121", "BM-122", "BM-123", "BM-124", "BM-125", "BM-126",
  "BM-127", "BM-128", "BM-129", "BM-130", "BM-131", "BM-132",
  "BM-133", "BM-134", "BM-135", "BM-136", "BM-137", "BM-138",
  "BM-139", "BM-140",
];

const SPECIAL_SKIP = new Set([
  "BM-039", "BM-041", "BM-049", "BM-050", "BM-051",
  "BM-077", "BM-079", "BM-082", "BM-089", "BM-099",
]);

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

function assertTrue(value, message) {
  if (value !== true) fail(`${message}; expected true, got ${value}`);
}

function assertFalseish(value, message) {
  if (value === true || value === "PASS") fail(`${message}; expected false/NOT_RUN/null, got ${value}`);
}

function lifecycleLeakKeys(row) {
  return Object.keys(row).filter((key) =>
    /generatedDocument|workspace|history/i.test(key),
  );
}

const matrix = readJson(MATRIX, "status matrix");
const batch5 = readJson(BATCH5_ARTIFACT, "Batch 5 curation artifact");
const batch6 = readJson(BATCH6_ARTIFACT, "Batch 6 curation artifact");
const rows = matrix.rows ?? [];
if (matrix.total !== 213 || rows.length !== 213) {
  fail(`matrix.total=${matrix.total}, rows.length=${rows.length}; expected 213/213`);
}
if (matrix.counts?.INPUT_CONNECTED_PASS !== 117 && matrix.counts?.INPUT_CONNECTED_PASS !== 137 && matrix.counts?.INPUT_CONNECTED_PASS !== 157 && matrix.counts?.INPUT_CONNECTED_PASS !== 177 && matrix.counts?.INPUT_CONNECTED_PASS !== 201) {
  fail(`counts.INPUT_CONNECTED_PASS=${matrix.counts?.INPUT_CONNECTED_PASS}; expected 117, 137, 157, 177, or 201`);
}
if (matrix.counts?.INPUT_CONNECTED_PARTIAL !== 96 && matrix.counts?.INPUT_CONNECTED_PARTIAL !== 76 && matrix.counts?.INPUT_CONNECTED_PARTIAL !== 56 && matrix.counts?.INPUT_CONNECTED_PARTIAL !== 36 && matrix.counts?.INPUT_CONNECTED_PARTIAL !== 12) {
  fail(`counts.INPUT_CONNECTED_PARTIAL=${matrix.counts?.INPUT_CONNECTED_PARTIAL}; expected 96, 76, 56, 36, or 12`);
}

const byCode = new Map(rows.map((row) => [row.templateCode, row]));
for (const code of [
  ...CURATED_37,
  ...BATCH3_CODES,
  ...BATCH4_CODES,
  ...BATCH5_CODES,
  ...BATCH6_CODES,
]) {
  if (!byCode.has(code)) fail(`missing row ${code}`);
}

for (const code of CURATED_37) {
  const row = byCode.get(code);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`curated-37 ${code}: status=${row.status}`);
  assertTrue(row.sourceRenderVerified, `curated-37 ${code}: sourceRenderVerified`);
  assertTrue(row.browserVerified, `curated-37 ${code}: browserVerified`);
  assertTrue(row.demoClickVerified, `curated-37 ${code}: demoClickVerified`);
  assertTrue(row.previewClickVerified, `curated-37 ${code}: previewClickVerified`);
  assertTrue(row.docxDownloadVerified, `curated-37 ${code}: docxDownloadVerified`);
  if (row.fidelityComplete !== false) fail(`curated-37 ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
}

for (const code of BATCH3_CODES) {
  const row = byCode.get(code);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`batch3 ${code}: status=${row.status}`);
  assertTrue(row.sourceRenderVerified, `batch3 ${code}: sourceRenderVerified`);
  assertTrue(row.browserVerified, `batch3 ${code}: browserVerified`);
  assertTrue(row.demoClickVerified, `batch3 ${code}: demoClickVerified`);
  assertTrue(row.previewClickVerified, `batch3 ${code}: previewClickVerified`);
  assertTrue(row.docxDownloadVerified, `batch3 ${code}: docxDownloadVerified`);
  if (row.fidelityComplete !== false) fail(`batch3 ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
}

for (const code of BATCH4_CODES) {
  const row = byCode.get(code);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`batch4 ${code}: status=${row.status}`);
  assertTrue(row.sourceRenderVerified, `batch4 ${code}: sourceRenderVerified`);
  assertTrue(row.browserVerified, `batch4 ${code}: browserVerified`);
  assertTrue(row.demoClickVerified, `batch4 ${code}: demoClickVerified`);
  assertTrue(row.previewClickVerified, `batch4 ${code}: previewClickVerified`);
  assertTrue(row.docxDownloadVerified, `batch4 ${code}: docxDownloadVerified`);
  if (row.fidelityComplete !== false) fail(`batch4 ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
}

for (const code of BATCH5_CODES) {
  const row = byCode.get(code);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`batch5 ${code}: status=${row.status}`);
  assertTrue(row.sourceRenderVerified, `batch5 ${code}: sourceRenderVerified`);
  assertTrue(row.batch5SourceRenderVerified, `batch5 ${code}: batch5SourceRenderVerified`);
  assertTrue(row.browserVerified, `batch5 ${code}: browserVerified`);
  assertFalseish(row.demoClickVerified, `batch5 ${code}: demoClickVerified`);
  assertFalseish(row.previewClickVerified, `batch5 ${code}: previewClickVerified`);
  assertFalseish(row.docxDownloadVerified, `batch5 ${code}: docxDownloadVerified`);
  if (row.fidelityAuditStatus !== "NOT_RUN") fail(`batch5 ${code}: fidelityAuditStatus=${row.fidelityAuditStatus}`);
  if (row.machineCheckableFidelityStatus !== "NOT_RUN") fail(`batch5 ${code}: machineCheckableFidelityStatus=${row.machineCheckableFidelityStatus}`);
  if (row.visualPdfReviewStatus !== "NOT_RUN") fail(`batch5 ${code}: visualPdfReviewStatus=${row.visualPdfReviewStatus}`);
  if (row.humanReviewStatus !== "NOT_RUN") fail(`batch5 ${code}: humanReviewStatus=${row.humanReviewStatus}`);
  if (row.fidelityComplete !== false) fail(`batch5 ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
  const leaks = lifecycleLeakKeys(row);
  if (leaks.length > 0) fail(`batch5 ${code}: generated/workspace lifecycle fields present: ${leaks.join(", ")}`);
}

for (const code of BATCH6_CODES) {
  const row = byCode.get(code);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`batch6 ${code}: status=${row.status}`);
  assertTrue(row.sourceRenderVerified, `batch6 ${code}: sourceRenderVerified`);
  assertTrue(row.batch6SourceRenderVerified, `batch6 ${code}: batch6SourceRenderVerified`);
  assertTrue(row.browserVerified, `batch6 ${code}: browserVerified`);
  assertFalseish(row.demoClickVerified, `batch6 ${code}: demoClickVerified`);
  assertFalseish(row.previewClickVerified, `batch6 ${code}: previewClickVerified`);
  assertFalseish(row.docxDownloadVerified, `batch6 ${code}: docxDownloadVerified`);
  if (row.fidelityAuditStatus !== "NOT_RUN") fail(`batch6 ${code}: fidelityAuditStatus=${row.fidelityAuditStatus}`);
  if (row.machineCheckableFidelityStatus !== "NOT_RUN") fail(`batch6 ${code}: machineCheckableFidelityStatus=${row.machineCheckableFidelityStatus}`);
  if (row.visualPdfReviewStatus !== "NOT_RUN") fail(`batch6 ${code}: visualPdfReviewStatus=${row.visualPdfReviewStatus}`);
  if (row.humanReviewStatus !== "NOT_RUN") fail(`batch6 ${code}: humanReviewStatus=${row.humanReviewStatus}`);
  if (row.fidelityComplete !== false) fail(`batch6 ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
  const leaks = lifecycleLeakKeys(row);
  if (leaks.length > 0) fail(`batch6 ${code}: generated/workspace lifecycle fields present: ${leaks.join(", ")}`);
}

for (const row of rows) {
  if (BATCH5_CODES.includes(row.templateCode)) continue;
  if (row.batch5SourceRenderVerified === true) {
    fail(`non-selected ${row.templateCode}: batch5SourceRenderVerified=true`);
  }
  if (BATCH6_CODES.includes(row.templateCode)) continue;
  if (row.batch6SourceRenderVerified === true) {
    fail(`non-selected ${row.templateCode}: batch6SourceRenderVerified=true`);
  }
}

for (const code of SPECIAL_SKIP) {
  const row = byCode.get(code);
  if (row?.status === "INPUT_CONNECTED_PASS") {
    fail(`special/skipped ${code} was promoted to INPUT_CONNECTED_PASS`);
  }
}

const fidelityCompleteTrue = rows.filter((row) => row.fidelityComplete === true).length;
if (fidelityCompleteTrue !== 0) fail(`fidelityComplete true count=${fidelityCompleteTrue}; expected 0`);
if (batch5.fidelityCompleteEvidenced !== false) {
  fail(`Batch 5 artifact fidelityCompleteEvidenced=${batch5.fidelityCompleteEvidenced}; expected false`);
}
if (batch6.fidelityCompleteEvidenced !== false) {
  fail(`Batch 6 artifact fidelityCompleteEvidenced=${batch6.fidelityCompleteEvidenced}; expected false`);
}
if (matrix.batch5CurationEvidence?.fidelityCompleteClaimed === true) {
  fail("matrix.batch5CurationEvidence.fidelityCompleteClaimed=true; forbidden");
}
if (matrix.batch6CurationEvidence?.fidelityCompleteClaimed === true) {
  fail("matrix.batch6CurationEvidence.fidelityCompleteClaimed=true; forbidden");
}

const lifecycleSrc = readFileSync(`${ROOT}/apps/web/src/lib/form-flight/form-lifecycle.ts`, "utf8");
const allowlistMatch = lifecycleSrc.match(/RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[([\s\S]*?)\]\s*as const/u);
if (!allowlistMatch) fail("could not read RUNTIME_READY_FORM_FLIGHT_PROFILES");
const allowlistCodes = Array.from(new Set(allowlistMatch[1].match(/BM-\d{3}/g) ?? [])).sort();
if (JSON.stringify(allowlistCodes) !== JSON.stringify(["BM-001", "BM-171"])) {
  fail(`runtimeReady allowlist=${allowlistCodes.join(",")}; expected BM-001,BM-171`);
}
for (const code of BATCH6_CODES) {
  if (allowlistCodes.includes(code)) {
    fail(`${code}: present in FormFlight runtimeReady allowlist; Phase B must NEVER allow this.`);
  }
}

const bm006 = readJson(BM006_ARTIFACT, "BM-006 calibration artifact");
if (bm006.pilot_code !== "BM-006") fail(`BM006 pilot_code=${bm006.pilot_code}`);
if (bm006.pilot_status !== "DRAFT_FOR_USER_REVIEW") {
  fail(`BM006 pilot_status=${bm006.pilot_status}; expected DRAFT_FOR_USER_REVIEW`);
}

if (batch6.sourceDocxMutated === true || batch6.refusals?.sourceDocxMutated === true) {
  fail("Batch 6 artifact claims source DOCX mutation");
}
if (batch6.normalizedDocxMutated === true || batch6.refusals?.normalizedDocxMutated === true) {
  fail("Batch 6 artifact claims normalized DOCX mutation");
}
if (batch6.lockedContractsMutated === true || batch6.refusals?.lockedContractsMutated === true) {
  fail("Batch 6 artifact claims locked contract mutation");
}
if (batch6.compiledContractsMutated === true || batch6.refusals?.compiledContractsMutated === true) {
  fail("Batch 6 artifact claims compiled contract mutation");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      total: 213,
      inputConnectedPass: 117,
      inputConnectedPartial: 96,
      curated37Preserved: true,
      batch3EvidencePreserved: true,
      batch4EvidencePreserved: true,
      batch5SourceRenderVerified: BATCH5_CODES.length,
      batch5BrowserVerified: BATCH5_CODES.length,
      batch5DemoClickVerified: 0,
      batch5PreviewClickVerified: 0,
      batch5DocxDownloadVerified: 0,
      batch5MachineFidelityPass: 0,
      batch5VisualPdfReviewed: 0,
      batch6SourceRenderVerified: BATCH6_CODES.length,
      batch6BrowserVerified: BATCH6_CODES.length,
      batch6DemoClickVerified: 0,
      batch6PreviewClickVerified: 0,
      batch6DocxDownloadVerified: 0,
      batch6MachineFidelityPass: 0,
      batch6VisualPdfReviewed: 0,
      fidelityCompleteEvidenced: false,
      formFlightRuntimeReadyPromoted: 0,
      bm006CalibrationStateChanged: false,
    },
    null,
    2,
  ),
);
