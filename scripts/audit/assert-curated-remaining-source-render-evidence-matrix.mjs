#!/usr/bin/env node
/**
 * Read-only guard for the remaining-eligible source/render curation state.
 *
 * Dynamic-count guard. The eligible set is read from
 * docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json
 * so the guard never hardcodes a count.
 *
 * Asserts: 213 rows total, all eligible promoted, all rejected preserved,
 * no fidelityComplete, no FormFlight promotion, no FIDELITY_COMPLETE_EVIDENCED,
 * BM-006 KEEP state preserved, existing 177 evidence intact.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// === SECTION: imports, paths, constants will be appended ===

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const CANDIDATES = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json`;
const CURATION = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CURATION_APPLY.latest.json`;
const BATCH5_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH5_CURATION.latest.json`;
const BATCH6_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH6_CURATION.latest.json`;
const BATCH7_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH7_CURATION.latest.json`;
const BATCH8_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH8_CURATION.latest.json`;
const BATCH9_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH9_CURATION.latest.json`;
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

const BATCH7_CODES = [
  "BM-141", "BM-142", "BM-143", "BM-144", "BM-145", "BM-146",
  "BM-147", "BM-148", "BM-149", "BM-150", "BM-151", "BM-152",
  "BM-153", "BM-154", "BM-155", "BM-156", "BM-157", "BM-158",
  "BM-159", "BM-160",
];

const BATCH8_CODES = [
  "BM-161", "BM-162", "BM-163", "BM-164", "BM-165", "BM-166",
  "BM-167", "BM-168", "BM-169", "BM-170", "BM-172", "BM-173",
  "BM-174", "BM-175", "BM-176", "BM-177", "BM-178", "BM-179",
  "BM-180", "BM-181",
];

const BATCH9_CODES = [
  "BM-016", "BM-021", "BM-025", "BM-026", "BM-027", "BM-028",
  "BM-029", "BM-032", "BM-034", "BM-203", "BM-204", "BM-205",
  "BM-206", "BM-207", "BM-208", "BM-209", "BM-210", "BM-211",
  "BM-212", "BM-213",
];

const CANARY_HOLDOUT = new Set(["BM-024", "BM-200"]);

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
const candidates = readJson(CANDIDATES, "remaining source/render candidates");
const curation = readJson(CURATION, "remaining source/render curation apply artifact");
const batch5 = readJson(BATCH5_ARTIFACT, "Batch 5 curation artifact");
const batch6 = readJson(BATCH6_ARTIFACT, "Batch 6 curation artifact");
const batch7 = readJson(BATCH7_ARTIFACT, "Batch 7 curation artifact");
const batch8 = readJson(BATCH8_ARTIFACT, "Batch 8 curation artifact");
const batch9 = readJson(BATCH9_ARTIFACT, "Batch 9 curation artifact");
const rows = matrix.rows ?? [];
const expectedTotal = 213;
const expectedExistingPass = 177;
const expectedPass = expectedExistingPass + candidates.eligibleSelectedCodes.length;
const expectedPartial = expectedTotal - expectedPass;

if (candidates.status !== "PASS") fail(`candidates.status=${candidates.status}; expected PASS`);
if (curation.status !== "PASS") fail(`curation.status=${curation.status}; expected PASS`);
if (curation.codes?.length !== candidates.eligibleSelectedCodes.length) {
  fail(`curation.codes.length=${curation.codes?.length}; expected ${candidates.eligibleSelectedCodes.length}`);
}
if (matrix.total !== expectedTotal || rows.length !== expectedTotal) {
  fail(`matrix.total=${matrix.total}, rows.length=${rows.length}; expected ${expectedTotal}/${expectedTotal}`);
}
if (matrix.counts?.INPUT_CONNECTED_PASS !== expectedPass) {
  fail(`counts.INPUT_CONNECTED_PASS=${matrix.counts?.INPUT_CONNECTED_PASS}; expected ${expectedPass}`);
}
if (matrix.counts?.INPUT_CONNECTED_PARTIAL !== expectedPartial) {
  fail(`counts.INPUT_CONNECTED_PARTIAL=${matrix.counts?.INPUT_CONNECTED_PARTIAL}; expected ${expectedPartial}`);
}

const byCode = new Map(rows.map((row) => [row.templateCode, row]));
const remainingSet = new Set(candidates.eligibleSelectedCodes);
const rejectedSet = new Set(candidates.rejectedCodes);

for (const code of [
  ...CURATED_37,
  ...BATCH3_CODES,
  ...BATCH4_CODES,
  ...BATCH5_CODES,
  ...BATCH6_CODES,
  ...BATCH7_CODES,
  ...BATCH8_CODES,
  ...BATCH9_CODES,
]) {
  if (!byCode.has(code)) fail(`missing historical row ${code}`);
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
}

for (const code of BATCH7_CODES) {
  const row = byCode.get(code);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`batch7 ${code}: status=${row.status}`);
  assertTrue(row.sourceRenderVerified, `batch7 ${code}: sourceRenderVerified`);
  assertTrue(row.batch7SourceRenderVerified, `batch7 ${code}: batch7SourceRenderVerified`);
  assertTrue(row.browserVerified, `batch7 ${code}: browserVerified`);
  assertFalseish(row.demoClickVerified, `batch7 ${code}: demoClickVerified`);
  assertFalseish(row.previewClickVerified, `batch7 ${code}: previewClickVerified`);
  assertFalseish(row.docxDownloadVerified, `batch7 ${code}: docxDownloadVerified`);
  if (row.fidelityAuditStatus !== "NOT_RUN") fail(`batch7 ${code}: fidelityAuditStatus=${row.fidelityAuditStatus}`);
  if (row.machineCheckableFidelityStatus !== "NOT_RUN") fail(`batch7 ${code}: machineCheckableFidelityStatus=${row.machineCheckableFidelityStatus}`);
  if (row.visualPdfReviewStatus !== "NOT_RUN") fail(`batch7 ${code}: visualPdfReviewStatus=${row.visualPdfReviewStatus}`);
  if (row.humanReviewStatus !== "NOT_RUN") fail(`batch7 ${code}: humanReviewStatus=${row.humanReviewStatus}`);
  if (row.fidelityComplete !== false) fail(`batch7 ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
}

for (const code of BATCH8_CODES) {
  const row = byCode.get(code);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`batch8 ${code}: status=${row.status}`);
  assertTrue(row.sourceRenderVerified, `batch8 ${code}: sourceRenderVerified`);
  assertTrue(row.batch8SourceRenderVerified, `batch8 ${code}: batch8SourceRenderVerified`);
  assertTrue(row.browserVerified, `batch8 ${code}: browserVerified`);
  assertFalseish(row.demoClickVerified, `batch8 ${code}: demoClickVerified`);
  assertFalseish(row.previewClickVerified, `batch8 ${code}: previewClickVerified`);
  assertFalseish(row.docxDownloadVerified, `batch8 ${code}: docxDownloadVerified`);
  if (row.fidelityAuditStatus !== "NOT_RUN") fail(`batch8 ${code}: fidelityAuditStatus=${row.fidelityAuditStatus}`);
  if (row.machineCheckableFidelityStatus !== "NOT_RUN") fail(`batch8 ${code}: machineCheckableFidelityStatus=${row.machineCheckableFidelityStatus}`);
  if (row.visualPdfReviewStatus !== "NOT_RUN") fail(`batch8 ${code}: visualPdfReviewStatus=${row.visualPdfReviewStatus}`);
  if (row.humanReviewStatus !== "NOT_RUN") fail(`batch8 ${code}: humanReviewStatus=${row.humanReviewStatus}`);
  if (row.fidelityComplete !== false) fail(`batch8 ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
}

for (const code of BATCH9_CODES) {
  const row = byCode.get(code);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`batch9 ${code}: status=${row.status}`);
  assertTrue(row.sourceRenderVerified, `batch9 ${code}: sourceRenderVerified`);
  assertTrue(row.batch9SourceRenderVerified, `batch9 ${code}: batch9SourceRenderVerified`);
  assertTrue(row.browserVerified, `batch9 ${code}: browserVerified`);
  assertFalseish(row.demoClickVerified, `batch9 ${code}: demoClickVerified`);
  assertFalseish(row.previewClickVerified, `batch9 ${code}: previewClickVerified`);
  assertFalseish(row.docxDownloadVerified, `batch9 ${code}: docxDownloadVerified`);
  if (row.fidelityAuditStatus !== "NOT_RUN") fail(`batch9 ${code}: fidelityAuditStatus=${row.fidelityAuditStatus}`);
  if (row.machineCheckableFidelityStatus !== "NOT_RUN") fail(`batch9 ${code}: machineCheckableFidelityStatus=${row.machineCheckableFidelityStatus}`);
  if (row.visualPdfReviewStatus !== "NOT_RUN") fail(`batch9 ${code}: visualPdfReviewStatus=${row.visualPdfReviewStatus}`);
  if (row.humanReviewStatus !== "NOT_RUN") fail(`batch9 ${code}: humanReviewStatus=${row.humanReviewStatus}`);
  if (row.fidelityComplete !== false) fail(`batch9 ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
}

for (const code of candidates.eligibleSelectedCodes) {
  const row = byCode.get(code);
  if (!row) fail(`remaining eligible ${code}: missing row`);
  if (row.status !== "INPUT_CONNECTED_PASS") fail(`remaining eligible ${code}: status=${row.status}; expected INPUT_CONNECTED_PASS`);
  assertTrue(row.sourceRenderVerified, `remaining eligible ${code}: sourceRenderVerified`);
  assertTrue(row.remainingSourceRenderVerified, `remaining eligible ${code}: remainingSourceRenderVerified`);
  assertTrue(row.browserVerified, `remaining eligible ${code}: browserVerified`);
  assertFalseish(row.demoClickVerified, `remaining eligible ${code}: demoClickVerified`);
  assertFalseish(row.previewClickVerified, `remaining eligible ${code}: previewClickVerified`);
  assertFalseish(row.docxDownloadVerified, `remaining eligible ${code}: docxDownloadVerified`);
  if (row.fidelityAuditStatus !== "NOT_RUN") fail(`remaining eligible ${code}: fidelityAuditStatus=${row.fidelityAuditStatus}`);
  if (row.machineCheckableFidelityStatus !== "NOT_RUN") fail(`remaining eligible ${code}: machineCheckableFidelityStatus=${row.machineCheckableFidelityStatus}`);
  if (row.visualPdfReviewStatus !== "NOT_RUN") fail(`remaining eligible ${code}: visualPdfReviewStatus=${row.visualPdfReviewStatus}`);
  if (row.humanReviewStatus !== "NOT_RUN") fail(`remaining eligible ${code}: humanReviewStatus=${row.humanReviewStatus}`);
  if (row.fidelityComplete !== false) fail(`remaining eligible ${code}: fidelityComplete=${row.fidelityComplete}; expected false`);
  const leaks = lifecycleLeakKeys(row);
  if (leaks.length > 0) fail(`remaining eligible ${code}: generated/workspace lifecycle fields present: ${leaks.join(", ")}`);
}

for (const code of candidates.rejectedCodes) {
  const row = byCode.get(code);
  if (!row) fail(`remaining rejected ${code}: missing row`);
  if (row.status !== "INPUT_CONNECTED_PARTIAL") fail(`remaining rejected ${code}: status=${row.status}; expected INPUT_CONNECTED_PARTIAL`);
  if (row.remainingSourceRenderVerified === true) {
    fail(`remaining rejected ${code}: was promoted despite rejection`);
  }
}

for (const row of rows) {
  if (candidates.eligibleSelectedCodes.includes(row.templateCode)) continue;
  if (row.remainingSourceRenderVerified === true) {
    fail(`non-selected ${row.templateCode}: remainingSourceRenderVerified=true`);
  }
}

for (const code of CANARY_HOLDOUT) {
  const row = byCode.get(code);
  if (!row) continue;
  if (row.status === "INPUT_CONNECTED_PASS") {
    fail(`canary ${code} was promoted to INPUT_CONNECTED_PASS`);
  }
}

const fidelityCompleteTrue = rows.filter((row) => row.fidelityComplete === true).length;
if (fidelityCompleteTrue !== 0) fail(`fidelityComplete true count=${fidelityCompleteTrue}; expected 0`);

if (curation.fidelityCompleteEvidenced !== false) {
  fail(`remaining curation fidelityCompleteEvidenced=${curation.fidelityCompleteEvidenced}; expected false`);
}
if (matrix.remainingSourceRenderCurationEvidence?.fidelityCompleteClaimed === true) {
  fail("matrix.remainingSourceRenderCurationEvidence.fidelityCompleteClaimed=true; forbidden");
}
if (batch5.fidelityCompleteEvidenced !== false) fail(`batch5 fidelityCompleteEvidenced=${batch5.fidelityCompleteEvidenced}; expected false`);
if (batch6.fidelityCompleteEvidenced !== false) fail(`batch6 fidelityCompleteEvidenced=${batch6.fidelityCompleteEvidenced}; expected false`);
if (batch7.fidelityCompleteEvidenced !== false) fail(`batch7 fidelityCompleteEvidenced=${batch7.fidelityCompleteEvidenced}; expected false`);
if (batch8.fidelityCompleteEvidenced !== false) fail(`batch8 fidelityCompleteEvidenced=${batch8.fidelityCompleteEvidenced}; expected false`);
if (batch9.fidelityCompleteEvidenced !== false) fail(`batch9 fidelityCompleteEvidenced=${batch9.fidelityCompleteEvidenced}; expected false`);

if (matrix.batch5CurationEvidence?.fidelityCompleteClaimed === true) fail("matrix.batch5CurationEvidence.fidelityCompleteClaimed=true; forbidden");
if (matrix.batch6CurationEvidence?.fidelityCompleteClaimed === true) fail("matrix.batch6CurationEvidence.fidelityCompleteClaimed=true; forbidden");
if (matrix.batch7CurationEvidence?.fidelityCompleteClaimed === true) fail("matrix.batch7CurationEvidence.fidelityCompleteClaimed=true; forbidden");
if (matrix.batch8CurationEvidence?.fidelityCompleteClaimed === true) fail("matrix.batch8CurationEvidence.fidelityCompleteClaimed=true; forbidden");
if (matrix.batch9CurationEvidence?.fidelityCompleteClaimed === true) fail("matrix.batch9CurationEvidence.fidelityCompleteClaimed=true; forbidden");

const lifecycleSrc = readFileSync(`${ROOT}/apps/web/src/lib/form-flight/form-lifecycle.ts`, "utf8");
const allowlistMatch = lifecycleSrc.match(/RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[([\s\S]*?)\]\s*as const/u);
if (!allowlistMatch) fail("could not read RUNTIME_READY_FORM_FLIGHT_PROFILES");
const allowlistCodes = Array.from(new Set(allowlistMatch[1].match(/BM-\d{3}/g) ?? [])).sort();
if (JSON.stringify(allowlistCodes) !== JSON.stringify(["BM-001", "BM-171"])) {
  fail(`runtimeReady allowlist=${allowlistCodes.join(",")}; expected BM-001,BM-171`);
}
for (const code of candidates.eligibleSelectedCodes) {
  if (allowlistCodes.includes(code)) {
    fail(`${code}: present in FormFlight runtimeReady allowlist; forbidden.`);
  }
}

const bm006 = readJson(BM006_ARTIFACT, "BM-006 calibration artifact");
if (bm006.pilot_code !== "BM-006") fail(`BM006 pilot_code=${bm006.pilot_code}`);
if (bm006.pilot_status !== "DRAFT_FOR_USER_REVIEW") {
  fail(`BM006 pilot_status=${bm006.pilot_status}; expected DRAFT_FOR_USER_REVIEW`);
}

if (curation.sourceDocxMutated === true || curation.refusals?.sourceDocxMutated === true) {
  fail("remaining curation artifact claims source DOCX mutation");
}
if (curation.normalizedDocxMutated === true || curation.refusals?.normalizedDocxMutated === true) {
  fail("remaining curation artifact claims normalized DOCX mutation");
}
if (curation.lockedContractsMutated === true || curation.refusals?.lockedContractsMutated === true) {
  fail("remaining curation artifact claims locked contract mutation");
}
if (curation.compiledContractsMutated === true || curation.refusals?.compiledContractsMutated === true) {
  fail("remaining curation artifact claims compiled contract mutation");
}
if (curation.dbMutated === true || curation.refusals?.dbMutated === true) {
  fail("remaining curation artifact claims DB mutation");
}
if (curation.prismaSchemaMutated === true || curation.refusals?.prismaSchemaMutated === true) {
  fail("remaining curation artifact claims Prisma schema mutation");
}
if (curation.migrationsCreated === true || curation.refusals?.migrationsCreated === true) {
  fail("remaining curation artifact claims migrations created");
}
if (curation.commitCreated === true || curation.refusals?.commitCreated === true) {
  fail("remaining curation artifact claims commit created");
}
if (curation.gitPushed === true || curation.refusals?.gitPushed === true) {
  fail("remaining curation artifact claims git push");
}
if (curation.filesStaged === true || curation.refusals?.filesStaged === true) {
  fail("remaining curation artifact claims files staged");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      total: expectedTotal,
      inputConnectedPass: expectedPass,
      inputConnectedPartial: expectedPartial,
      existing177EvidencePreserved: true,
      curated37Preserved: true,
      batch3EvidencePreserved: true,
      batch4EvidencePreserved: true,
      batch5EvidencePreserved: true,
      batch6EvidencePreserved: true,
      batch7EvidencePreserved: true,
      batch8EvidencePreserved: true,
      batch9EvidencePreserved: true,
      remainingSourceRenderVerified: candidates.eligibleSelectedCodes.length,
      remainingBrowserVerified: candidates.eligibleSelectedCodes.length,
      remainingDemoClickVerified: 0,
      remainingPreviewClickVerified: 0,
      remainingDocxDownloadVerified: 0,
      remainingMachineFidelityPass: 0,
      remainingVisualPdfReviewed: 0,
      rejectedCanaryHoldout: candidates.byClass.CANARY_HOLDOUT.length,
      rejectedSpecialSkip: candidates.byClass.SPECIAL_SKIP.length,
      fidelityCompleteEvidenced: false,
      formFlightRuntimeReadyPromoted: 0,
      bm006CalibrationStateChanged: false,
    },
    null,
    2,
  ),
);