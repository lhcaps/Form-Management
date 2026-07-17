#!/usr/bin/env node
/**
 * assert-source-render-only-browser-visibility-evidence-matrix.mjs
 *
 * Read-only guard for the source/render-only browser visibility state.
 * Dynamic-count guard. The selected set is read from
 * docs/audit/unified-bm-workspace/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.json
 * so the guard never hardcodes a count.
 *
 * Asserts: 213 rows total, all 124 selected codes now have browserVerified=true,
 * failed/skipped forms not fake-promoted, no demo/preview/DOCX/fidelity/visual/human
 * evidence on selected forms, no fidelityComplete, no FormFlight promotion, no
 * FIDELITY_COMPLETE_EVIDENCED, BM-006 KEEP state preserved, existing 77 evidence intact.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = ROOT + "/docs/audit/unified-bm-workspace";
const MATRIX = OUT_DIR + "/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json";
const CANDIDATES = OUT_DIR + "/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.json";
const ARTIFACT = OUT_DIR + "/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY.latest.json";
const BM006_ARTIFACT = OUT_DIR + "/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.json";
const CURATED_37 = ["BM-001","BM-005","BM-006","BM-007","BM-008","BM-009","BM-010","BM-011","BM-012","BM-014","BM-015","BM-017","BM-018","BM-019","BM-020","BM-022","BM-023","BM-030","BM-031","BM-033","BM-035","BM-036","BM-037","BM-038","BM-040","BM-042","BM-043","BM-044","BM-045","BM-046","BM-047","BM-048","BM-052","BM-053","BM-054","BM-070","BM-171"];
const BATCH3_CODES = ["BM-055","BM-056","BM-057","BM-058","BM-059","BM-060","BM-061","BM-062","BM-063","BM-064","BM-065","BM-066","BM-067","BM-068","BM-069","BM-071","BM-072","BM-073","BM-074","BM-075"];
const BATCH4_CODES = ["BM-076","BM-078","BM-080","BM-081","BM-083","BM-084","BM-085","BM-086","BM-087","BM-088","BM-090","BM-091","BM-092","BM-093","BM-094","BM-095","BM-096","BM-097","BM-098","BM-100"];
const HOLDOUT_PARTIAL_CODES = ["BM-024","BM-039","BM-041","BM-049","BM-050","BM-051","BM-077","BM-079","BM-082","BM-089","BM-099","BM-200"];
function fail(m){ console.error("FAIL: "+m); process.exit(1); }
function readJson(p,l){ if(!existsSync(p)) fail("missing "+l+": "+p); try { return JSON.parse(readFileSync(p,"utf8")); } catch(e){ fail("invalid JSON in "+l+": "+e.message); } }
function assertTrue(v,m){ if(v!==true) fail(m+"; expected true, got "+v); }
function assertFalseish(v,m){ if(v===true||v==="PASS") fail(m+"; expected false/NOT_RUN/null, got "+v); }
const matrix = readJson(MATRIX,"status matrix");
const candidatesDoc = readJson(CANDIDATES,"source/render-only browser visibility candidates");
const artifact = readJson(ARTIFACT,"source/render-only browser visibility artifact");
const rows = matrix.rows ?? [];
const expectedTotal = 213;
const selectedCodes = candidatesDoc.selectedCodes || [];
const expectedSelected = selectedCodes.length;
if (selectedCodes.length === 0) fail("selectedCodes is empty");
if (matrix.total !== expectedTotal || rows.length !== expectedTotal) fail("matrix.total="+matrix.total+", rows.length="+rows.length+"; expected "+expectedTotal+"/"+expectedTotal);
if (matrix.counts?.INPUT_CONNECTED_PASS !== 201) fail("counts.INPUT_CONNECTED_PASS="+matrix.counts?.INPUT_CONNECTED_PASS+"; expected 201");
if (matrix.counts?.INPUT_CONNECTED_PARTIAL !== 12) fail("counts.INPUT_CONNECTED_PARTIAL="+matrix.counts?.INPUT_CONNECTED_PARTIAL+"; expected 12");
if (artifact.status !== "PASS") fail("artifact.status="+artifact.status+"; expected PASS");
if (artifact.formsVisibilityFailed !== 0) fail("artifact.formsVisibilityFailed="+artifact.formsVisibilityFailed+"; expected 0");
if (artifact.formsVisibilityPassed !== expectedSelected) fail("artifact.formsVisibilityPassed="+artifact.formsVisibilityPassed+"; expected "+expectedSelected);
if (artifact.existing201EvidencePreserved !== true) fail("artifact.existing201EvidencePreserved="+artifact.existing201EvidencePreserved+"; expected true");
const byCode = new Map(rows.map(r=>[r.templateCode, r]));
for (const code of [...CURATED_37, ...BATCH3_CODES, ...BATCH4_CODES]) {
  if (!byCode.has(code)) fail("missing historical row "+code);
}
for (const code of CURATED_37) {
  const r = byCode.get(code);
  if (r.status !== "INPUT_CONNECTED_PASS") fail("curated-37 "+code+": status="+r.status);
  assertTrue(r.sourceRenderVerified, "curated-37 "+code+": sourceRenderVerified");
  assertTrue(r.browserVerified, "curated-37 "+code+": browserVerified");
  assertTrue(r.demoClickVerified, "curated-37 "+code+": demoClickVerified");
  assertTrue(r.previewClickVerified, "curated-37 "+code+": previewClickVerified");
  assertTrue(r.docxDownloadVerified, "curated-37 "+code+": docxDownloadVerified");
  if (r.fidelityComplete !== false) fail("curated-37 "+code+": fidelityComplete="+r.fidelityComplete+"; expected false");
}
for (const code of BATCH3_CODES) {
  const r = byCode.get(code);
  if (r.status !== "INPUT_CONNECTED_PASS") fail("batch3 "+code+": status="+r.status);
  assertTrue(r.sourceRenderVerified, "batch3 "+code+": sourceRenderVerified");
  assertTrue(r.browserVerified, "batch3 "+code+": browserVerified");
  assertTrue(r.demoClickVerified, "batch3 "+code+": demoClickVerified");
  assertTrue(r.previewClickVerified, "batch3 "+code+": previewClickVerified");
  assertTrue(r.docxDownloadVerified, "batch3 "+code+": docxDownloadVerified");
  if (r.fidelityComplete !== false) fail("batch3 "+code+": fidelityComplete="+r.fidelityComplete+"; expected false");
}
for (const code of BATCH4_CODES) {
  const r = byCode.get(code);
  if (r.status !== "INPUT_CONNECTED_PASS") fail("batch4 "+code+": status="+r.status);
  assertTrue(r.sourceRenderVerified, "batch4 "+code+": sourceRenderVerified");
  assertTrue(r.browserVerified, "batch4 "+code+": browserVerified");
  assertTrue(r.demoClickVerified, "batch4 "+code+": demoClickVerified");
  assertTrue(r.previewClickVerified, "batch4 "+code+": previewClickVerified");
  assertTrue(r.docxDownloadVerified, "batch4 "+code+": docxDownloadVerified");
  if (r.fidelityComplete !== false) fail("batch4 "+code+": fidelityComplete="+r.fidelityComplete+"; expected false");
}
for (const code of selectedCodes) {
  const r = byCode.get(code);
  if (!r) fail("selected "+code+": missing row");
  if (r.status !== "INPUT_CONNECTED_PASS") fail("selected "+code+": status="+r.status+"; expected INPUT_CONNECTED_PASS");
  assertTrue(r.sourceRenderVerified, "selected "+code+": sourceRenderVerified");
  // Each selected code must have *some* source-render-only flag set true,
  // depending on which batch they came from.
  const hasSourceRenderOnly =
    r.remainingSourceRenderVerified === true ||
    r.batch5SourceRenderVerified === true ||
    r.batch6SourceRenderVerified === true ||
    r.batch7SourceRenderVerified === true ||
    r.batch8SourceRenderVerified === true ||
    r.batch9SourceRenderVerified === true;
  assertTrue(hasSourceRenderOnly, "selected "+code+": no source-render-only flag set (expected one of remainingSourceRenderVerified / batch5-9SourceRenderVerified)");
  assertTrue(r.browserVerified, "selected "+code+": browserVerified");
  if (r.browserVerifiedStatus !== "PASS") fail("selected "+code+": browserVerifiedStatus="+r.browserVerifiedStatus);
  assertFalseish(r.demoClickVerified, "selected "+code+": demoClickVerified");
  assertFalseish(r.previewClickVerified, "selected "+code+": previewClickVerified");
  assertFalseish(r.docxDownloadVerified, "selected "+code+": docxDownloadVerified");
  if (r.fidelityAuditStatus !== "NOT_RUN") fail("selected "+code+": fidelityAuditStatus="+r.fidelityAuditStatus);
  if (r.machineCheckableFidelityStatus !== "NOT_RUN") fail("selected "+code+": machineCheckableFidelityStatus="+r.machineCheckableFidelityStatus);
  if (r.visualPdfReviewStatus !== "NOT_RUN") fail("selected "+code+": visualPdfReviewStatus="+r.visualPdfReviewStatus);
  if (r.humanReviewStatus !== "NOT_RUN") fail("selected "+code+": humanReviewStatus="+r.humanReviewStatus);
  if (r.fidelityComplete !== false) fail("selected "+code+": fidelityComplete="+r.fidelityComplete+"; expected false");
  const ev = r.browserVisibilityEvidence;
  if (!ev) fail("selected "+code+": browserVisibilityEvidence missing");
  if (ev.stayedOnTemplatesRoute !== true) fail("selected "+code+": stayedOnTemplatesRoute="+ev.stayedOnTemplatesRoute);
  if (ev.routedToDocuments === true) fail("selected "+code+": routedToDocuments=true (route leak)");
  if (ev.historyUiVisible === true) fail("selected "+code+": historyUiVisible=true (workspace leak)");
  if (ev.fatalError === true) fail("selected "+code+": fatalError=true");
  for (const k of Object.keys(ev || {})) {
    if (/generatedDocument/i.test(k) && ev[k] === true) {
      fail("selected "+code+": evidence."+k+"=true (generatedDocument leak)");
    }
  }
}
for (const code of HOLDOUT_PARTIAL_CODES) {
  const r = byCode.get(code);
  if (!r) continue;
  if (r.status !== "INPUT_CONNECTED_PARTIAL") fail("holdout "+code+": status="+r.status+"; expected INPUT_CONNECTED_PARTIAL");
  if (selectedCodes.includes(code)) fail("holdout "+code+": included in selectedCodes");
}
const failedInArtifact = (artifact.perForm || []).filter(p => !p.browserVerified);
for (const f of failedInArtifact) {
  const r = byCode.get(f.code);
  if (!r) continue;
  if (r.browserVerified === true) fail("artifact reports "+f.code+" as not browserVerified, but matrix has browserVerified=true (fake promotion?)");
}
const fidelityCompleteTrue = rows.filter(r => r.fidelityComplete === true).length;
if (fidelityCompleteTrue !== 0) fail("fidelityComplete true count="+fidelityCompleteTrue+"; expected 0");
const formFlightPromoted = artifact.formFlightRuntimeReadyPromoted ?? 0;
if (formFlightPromoted !== 0) fail("artifact.formFlightRuntimeReadyPromoted="+formFlightPromoted+"; expected 0");
if (artifact.fidelityCompleteClaimed === true) fail("artifact.fidelityCompleteClaimed=true; forbidden");
if (matrix.sourceRenderOnlyBrowserVisibilityEvidence?.fidelityCompleteClaimed === true) fail("matrix.sourceRenderOnlyBrowserVisibilityEvidence.fidelityCompleteClaimed=true; forbidden");
const lifecycleSrc = readFileSync(ROOT + "/apps/web/src/lib/form-flight/form-lifecycle.ts", "utf8");
const allowlistMatch = lifecycleSrc.match(/RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[([\s\S]*?)\]\s*as const/u);
if (!allowlistMatch) fail("could not read RUNTIME_READY_FORM_FLIGHT_PROFILES");
const allowlistCodes = Array.from(new Set(allowlistMatch[1].match(/BM-\d{3}/g) ?? [])).sort();
if (JSON.stringify(allowlistCodes) !== JSON.stringify(["BM-001","BM-171"])) fail("runtimeReady allowlist="+allowlistCodes.join(",")+"; expected BM-001,BM-171");
for (const code of selectedCodes) {
  if (allowlistCodes.includes(code)) fail(code+": present in FormFlight runtimeReady allowlist; forbidden");
}
const bm006 = readJson(BM006_ARTIFACT, "BM-006 calibration artifact");
if (bm006.pilot_code !== "BM-006") fail("BM006 pilot_code="+bm006.pilot_code);
if (bm006.pilot_status !== "DRAFT_FOR_USER_REVIEW") fail("BM006 pilot_status="+bm006.pilot_status+"; expected DRAFT_FOR_USER_REVIEW");
const bm006Row = byCode.get("BM-006");
if (bm006Row.status !== "INPUT_CONNECTED_PASS") fail("BM-006 status="+bm006Row.status);
if (bm006Row.fidelityComplete !== false) fail("BM-006 fidelityComplete="+bm006Row.fidelityComplete);
const refusals = [
  "sourceDocxMutated","normalizedDocxMutated","lockedContractsMutated","compiledContractsMutated",
  "dbMutated","prismaSchemaMutated","migrationsCreated","commitCreated","gitPushed","filesStaged",
  "publicApiRoutePathsChanged","envValuesLogged","playwrightStorageStateCommitted","newFrameworkCreated",
];
for (const key of refusals) {
  if (artifact[key] === true) fail("artifact."+key+"=true; forbidden");
}
console.log(JSON.stringify({
  ok: true,
  total: expectedTotal,
  inputConnectedPass: 201,
  inputConnectedPartial: 12,
  selected: expectedSelected,
  rerunOverrides: artifact.rerunOverrides?.length ?? 0,
  existing77EvidencePreserved: true,
  holdoutsPreserved: true,
  selectedFormsBrowserVerified: expectedSelected,
  selectedFormsDemoPreviewDocxFidelityNotRun: true,
  failedFormsFakePromoted: false,
  fidelityCompleteEvidenced: false,
  formFlightRuntimeReadyPromoted: 0,
  bm006CalibrationStateChanged: false,
}, null, 2));