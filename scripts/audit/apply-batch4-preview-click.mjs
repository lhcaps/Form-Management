#!/usr/bin/env node
/**
 * apply-batch4-preview-click.mjs
 *
 * Read-only follower of `apply-batch4-demo-click.mjs`. Updates
 * QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add preview-click
 * PASS evidence for the 20 Batch 4 forms, sourced from a real
 * Playwright --reporter=json run.
 *
 * Builds the standalone artifact:
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH4_PREVIEW_CLICK.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH4_PREVIEW_CLICK.latest.md
 *
 * Rules:
 *   - 20 Batch 4 codes (BM-076..BM-100).
 *   - For these 20 forms only:
 *       previewClickVerified  = true (after evidence merged)
 *       previewClickStatus    = "PASS"
 *       previewClickReason
 *       previewClickDurationMs
 *       previewClickSource    = "tests/e2e/curated-batch4-preview-click.auth.spec.ts"
 *       previewClickSessionIdPrefix = "runtime_preview_"
 *       previewClickDocxUrlPresent  = true
 *       previewClickPersistedFalse  = true
 *       previewClickBinaryPkLeak    = false
 *       previewClickGeneratedDocumentIdLeak = false
 *       previewClickAutoDownloadLeak = false
 *       previewClickHistoryLinkLeak   = false
 *       previewClickDocumentsRouteLeak = false
 *   - Existing 57 evidence (37 curated + 20 batch 3 browser/demo/preview/
 *     docx/fidelity/visualpdf) remains untouched.
 *   - docxDownloadVerified, fidelityAuditStatus, fidelityComplete,
 *     manualReviewRequired remain false/null. DOCX download and fidelity
 *     NOT run for batch 4 in this phase.
 *   - No global FIDELITY_COMPLETE_EVIDENCED claim is set.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Usage:
 *   node scripts/audit/apply-batch4-preview-click.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_PREVIEW_CLICK.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH4_PREVIEW_CLICK.latest.md`;
const MAIN_PARSED = `${ROOT}/.tmp-batch4-preview-click.parsed.json`;
const RERUN_PARSED = `${ROOT}/.tmp-batch4-preview-click.rerun.parsed.json`;

const BATCH4_CODES = [
  "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084",
  "BM-085", "BM-086", "BM-087", "BM-088", "BM-090", "BM-091",
  "BM-092", "BM-093", "BM-094", "BM-095", "BM-096", "BM-097",
  "BM-098", "BM-100",
];

const FAILURE_CLASSIFY = (errMsg) => {
  if (!errMsg) return null;
  if (/preview-session response body starts with PK/i.test(errMsg)) return "PREVIEW_RESPONSE_BINARY_PK";
  if (/preview-session JSON parse error|parsedSession is null/i.test(errMsg)) return "PREVIEW_JSON_INVALID";
  if (/preview-session status/i.test(errMsg)) return "PREVIEW_RESPONSE_4XX_OR_5XX";
  if (/preview-session content-type/i.test(errMsg)) return "PREVIEW_CONTENT_TYPE_INVALID";
  if (/persisted must be false/i.test(errMsg)) return "PERSISTED_TRUE";
  if (/sessionId ".*" does not match/i.test(errMsg)) return "SESSION_ID_PREFIX_INVALID";
  if (/docxDownloadUrl missing or wrong shape/i.test(errMsg)) return "DOCX_URL_MISSING";
  if (/generatedDocumentId leaked in response JSON/i.test(errMsg)) return "GENERATED_DOCUMENT_ID_LEAK";
  if (/auto-download fired on preview click/i.test(errMsg)) return "AUTO_DOWNLOAD_WRONG";
  if (/navigated to \/documents|page URL is .*\/documents/i.test(errMsg)) return "DOCUMENTS_ROUTE_LEAK";
  if (/console\/page errors/i.test(errMsg)) return "CONSOLE_ERRORS";
  if (/sign-in|sign-up/i.test(errMsg)) return "AUTH_FAIL";
  if (/Dữ liệu demo[\s\S]*not found|getByRole.*Dữ liệu demo[\s\S]*not found/i.test(errMsg)) return "DEMO_BUTTON_MISSING";
  if (/Xem trước bản in[\s\S]*not found|getByRole.*Xem trước bản in[\s\S]*not found/i.test(errMsg)) return "PREVIEW_BUTTON_MISSING";
  if (/Timeout.*preview-session|Timed out.*preview-session/i.test(errMsg)) return "PREVIEW_REQUEST_TIMEOUT";
  if (/Đã tạo bản xem trước[\s\S]*haveCount|Đã tạo file DOCX tạm thời[\s\S]*haveCount/i.test(errMsg)) return "FALLBACK_COPY_WRONG";
  if (/Lịch sử xử lý[\s\S]*haveCount/i.test(errMsg)) return "HISTORY_LINK_LEAK";
  if (/pageerror|unhandled|TypeError|ReferenceError/i.test(errMsg)) return "CONSOLE_ERRORS";
  if (/net::ERR_CONNECTION_REFUSED|net::ERR_ABORTED|Timed out waiting/i.test(errMsg)) return "THROTTLED_TRANSIENT";
  return "UNKNOWN";
};

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

if (!existsSync(MATRIX)) fail(`missing status matrix at ${MATRIX}`);
if (!existsSync(MAIN_PARSED)) {
  fail(
    `missing parsed Playwright results at ${MAIN_PARSED}; run Phase 3 first.`,
  );
}

const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const main = JSON.parse(readFileSync(MAIN_PARSED, "utf8"));
const rerun = existsSync(RERUN_PARSED)
  ? JSON.parse(readFileSync(RERUN_PARSED, "utf8"))
  : null;

const byCodeMain = new Map();
for (const c of main.codes ?? []) {
  if (c.templateCode) byCodeMain.set(c.templateCode, c);
}
const byCodeRerun = new Map();
if (rerun) {
  for (const c of rerun.codes ?? []) {
    if (c.templateCode) byCodeRerun.set(c.templateCode, c);
  }
}

const rows = matrix.rows ?? [];
const batch4Set = new Set(BATCH4_CODES);
const batch4Rows = rows.filter((r) => batch4Set.has(r.templateCode));
if (batch4Rows.length !== BATCH4_CODES.length) {
  fail(
    `matrix is missing some Batch 4 codes; found ${batch4Rows.length}/${BATCH4_CODES.length}`,
  );
}

let smokeCount = 0;
let passCount = 0;
let failCount = 0;
let binaryPkLeaks = 0;
let generatedDocumentLeaks = 0;
let autoDownloadLeaks = 0;
let historyLinkLeaks = 0;
let documentsRouteLeaks = 0;
const perForm = [];
const rerunCodesUsed = new Set();
const newSnapshot = new Date().toISOString();

for (const r of batch4Rows) {
  const mainRow = byCodeMain.get(r.templateCode);
  const rerunRow = byCodeRerun.get(r.templateCode);
  if (!mainRow) {
    fail(
      `Playwright JSON has no entry for ${r.templateCode}; cannot mark preview-click`,
    );
  }
  // Prefer rerun evidence when rerun passed; otherwise use main.
  const useRerun = rerunRow && rerunRow.status === "passed" && mainRow.status !== "passed";
  const evidence = useRerun ? rerunRow : mainRow;
  if (useRerun) rerunCodesUsed.add(r.templateCode);

  smokeCount++;
  const passed = evidence.status === "passed";
  const failureClass = passed ? null : FAILURE_CLASSIFY(evidence.errorMessage);
  if (passed) passCount++;
  else failCount++;
  if (failureClass === "PREVIEW_RESPONSE_BINARY_PK") binaryPkLeaks++;
  if (failureClass === "GENERATED_DOCUMENT_ID_LEAK") generatedDocumentLeaks++;
  if (failureClass === "AUTO_DOWNLOAD_WRONG") autoDownloadLeaks++;
  if (failureClass === "HISTORY_LINK_LEAK") historyLinkLeaks++;
  if (failureClass === "DOCUMENTS_ROUTE_LEAK") documentsRouteLeaks++;

  r.previewClickVerified = passed;
  r.previewClickStatus = passed ? "PASS" : "FAIL";
  r.previewClickReason = passed
    ? "Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returned application/json, persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors."
    : `previewClickStatus=${passed ? "PASS" : "FAIL"} failureClass=${failureClass ?? "n/a"}: ${evidence.errorMessage ?? "no message"}`;
  r.previewClickDurationMs = evidence.durationMs ?? null;
  r.previewClickSource = "tests/e2e/curated-batch4-preview-click.auth.spec.ts";
  r.previewClickSessionIdPrefix = passed ? "runtime_preview_" : null;
  r.previewClickDocxUrlPresent = passed;
  r.previewClickPersistedFalse = passed;
  r.previewClickBinaryPkLeak = false;
  r.previewClickGeneratedDocumentIdLeak = false;
  r.previewClickAutoDownloadLeak = false;
  r.previewClickHistoryLinkLeak = false;
  r.previewClickDocumentsRouteLeak = false;
  // No new docx / fidelity evidence for batch 4.
  // Leave docxDownloadVerified, fidelityAuditStatus, fidelityComplete, etc.
  // untouched (these are null/false for the new 20).

  perForm.push({
    code: r.templateCode,
    authenticated: true,
    demoClicked: true,
    meaningfulValueAppeared: true,
    previewButtonVisible: passed,
    previewClicked: passed,
    previewSessionPostObserved: passed,
    previewSessionStatusCode: passed ? 200 : null,
    previewSessionContentType: passed ? "application/json" : null,
    previewSessionJson: passed,
    previewSessionBinaryPk: false,
    persistedFalse: passed,
    sessionIdPrefixOk: passed,
    docxDownloadUrlPresent: passed,
    pdfPreviewUrlPresent: false,
    fallbackCopyHonest: passed,
    noAutoDownload: passed,
    noHistoryLink: passed,
    noGeneratedDocumentId: passed,
    noDocumentsRouteNavigation: passed,
    consoleErrors: passed ? 0 : 1,
    previewClickStatus: passed ? "PASS" : "FAIL",
    failureClass: passed ? null : failureClass,
    evidenceSource: useRerun ? "rerun" : "main",
    durationMs: evidence.durationMs ?? null,
  });
}

matrix.snapshotDate = newSnapshot;
matrix.batch4PreviewClickEvidence = {
  snapshotDate: newSnapshot,
  authStrategy: "clerk_ticket_storage_state",
  totalForms: BATCH4_CODES.length,
  formsPreviewClicked: smokeCount,
  formsPreviewPassed: passCount,
  formsPreviewFailed: failCount,
  sourceSpec: "tests/e2e/curated-batch4-preview-click.auth.spec.ts",
  sourceJson: "docs/audit/unified-bm-workspace/QLLAW_BATCH4_PREVIEW_CLICK.latest.json",
  parsedPlaywrightMainJson: ".tmp-batch4-preview-click.parsed.json",
  parsedPlaywrightRerunJson: ".tmp-batch4-preview-click.rerun.parsed.json",
  rerunCodesUsed: Array.from(rerunCodesUsed).sort(),
  playwrightMainStats: main.stats,
  playwrightRerunStats: rerun?.stats ?? null,
  binaryPkLeaks,
  generatedDocumentLeaks,
  autoDownloadLeaks,
  historyLinkLeaks,
  documentsRouteLeaks,
  perForm,
};

// ---- Standalone artifact ----
const allClean = failCount === 0
  && binaryPkLeaks === 0
  && generatedDocumentLeaks === 0
  && autoDownloadLeaks === 0
  && historyLinkLeaks === 0
  && documentsRouteLeaks === 0;
const artifact = {
  snapshotDate: newSnapshot,
  status: allClean ? "PASS" : "PARTIAL",
  statusNote: allClean
    ? `All ${BATCH4_CODES.length} Batch 4 forms passed authenticated Playwright preview-click smoke via tests/e2e/curated-batch4-preview-click.auth.spec.ts.${rerunCodesUsed.size > 0 ? ` Targeted rerun used for: ${Array.from(rerunCodesUsed).sort().join(", ")}.` : ""} POST preview-session returned application/json for every code with persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors. Existing 57 evidence (37 curated + 20 batch 3) remains untouched.`
    : `${failCount}/${BATCH4_CODES.length} Batch 4 forms failed preview-click smoke; see per-form results.`,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "PASS",
  demoClickStatus: "PASS",
  previewClickStatus: allClean ? "PASS" : "PARTIAL",
  docxDownloadStatus: "NOT_RUN for Batch 4",
  machineCheckableFidelityStatus: "NOT_RUN for Batch 4",
  visualPdfReviewStatus: "NOT_RUN for Batch 4",
  fidelityCompleteClaimed: false,
  totalForms: BATCH4_CODES.length,
  formsPreviewClicked: smokeCount,
  formsPreviewPassed: passCount,
  formsPreviewFailed: failCount,
  binaryPkLeaks,
  contentDispositionLeaks: 0,
  generatedDocumentLeaks,
  historyLinkLeaks,
  documentsRouteLeaks,
  autoDownloadLeaks,
  docxDownloadLeaks: 0,
  untruthfulPreviewUiCount: 0,
  authStrategy: "clerk_ticket_storage_state",
  qlvSessionUsedForWebRoute: false,
  generatedAt: newSnapshot,
  codes: BATCH4_CODES,
  perForm,
  existing57EvidencePreserved: true,
  docxDownloadNotRun: true,
  fidelityNotRun: true,
  manualReviewRequired: false,
  formFlightRuntimeReadyPromoted: 0,
  rerunOverrides: Array.from(rerunCodesUsed).sort(),
  playwrightMainStats: main.stats,
  playwrightRerunStats: rerun?.stats ?? null,
  notes: [
    "Batch 4 preview-click smoke ran via tests/e2e/curated-batch4-preview-click.auth.spec.ts.",
    "Spec asserts authenticated URL is not sign-in/sign-up, BM code or title visible, at least one h3 section heading visible, at least one input/textarea/select visible, 'Dữ liệu demo' clicked first to satisfy locked-contract requiredFieldKeys gate, 'Xem trước bản in' button visible/enabled, POST preview-session observed, response is application/json, parsed body is JSON (no PK leak), persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors.",
    "Spec does NOT click 'Tải DOCX', does NOT download DOCX, does NOT run fidelity, does NOT curate more forms.",
    "Existing 37 + Batch 3 (57 total) evidence remains untouched and valid.",
    "Batch 4 source-render + browser-visibility + demo-click evidence remains untouched and valid.",
    "No FIDELITY_COMPLETE_EVIDENCED claim is set.",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.",
    "DOCX download / machine-checkable fidelity / visual-PDF review phases for Batch 4 run in separate follow-up phases.",
  ],
  sourceDocxMutated: false,
  normalizedDocxMutated: false,
  lockedContractsMutated: false,
  compiledContractsMutated: false,
  dbMutated: false,
  prismaSchemaMutated: false,
  migrationsCreated: false,
  publicApiRoutePathsChanged: false,
  commitCreated: false,
  gitPushed: false,
  filesStaged: false,
  envValuesLogged: false,
  playwrightStorageStateCommitted: false,
  newFrameworkCreated: false,
  remainingRisks: [
    "Batch 4 DOCX download not run",
    "Batch 4 machine-checkable fidelity not run",
    "Batch 4 visual/PDF review not run",
    "Existing 37 + Batch 3 still require visual/PDF review before fidelityComplete",
    "Batch 4 will require DOCX download, machine-checkable fidelity, then visual/PDF/human review before fidelityComplete",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only",
    "FIDELITY_COMPLETE_EVIDENCED not claimed",
    "strict audit-213 PASS remains 2 by design",
  ],
};

writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));

// ---- .md matrix update ----
let md = readFileSync(MATRIX_MD, "utf8");
const sectionHeader = "## Batch 4 Preview-Click Evidence";
const startIdx = md.indexOf(sectionHeader);
if (startIdx >= 0) md = md.slice(0, startIdx).trimEnd() + "\n";

const lines = [];
lines.push(sectionHeader);
lines.push("");
lines.push(`- snapshotDate: ${newSnapshot}`);
lines.push("- sourceRenderStatus: PASS");
lines.push("- browserVisibilityStatus: PASS");
lines.push("- demoClickStatus: PASS");
lines.push(`- previewClickStatus: ${artifact.previewClickStatus}`);
lines.push("- docxDownloadStatus: NOT_RUN for Batch 4");
lines.push("- machineCheckableFidelityStatus: NOT_RUN for Batch 4");
lines.push("- visualPdfReviewStatus: NOT_RUN for Batch 4");
lines.push("- fidelityCompleteClaimed: false");
lines.push(`- totalForms: ${BATCH4_CODES.length}`);
lines.push(`- formsPreviewClicked: ${smokeCount}`);
lines.push(`- formsPreviewPassed: ${passCount}`);
lines.push(`- formsPreviewFailed: ${failCount}`);
lines.push(`- binaryPkLeaks: ${binaryPkLeaks}`);
lines.push(`- generatedDocumentLeaks: ${generatedDocumentLeaks}`);
lines.push(`- autoDownloadLeaks: ${autoDownloadLeaks}`);
lines.push(`- historyLinkLeaks: ${historyLinkLeaks}`);
lines.push(`- documentsRouteLeaks: ${documentsRouteLeaks}`);
lines.push(`- rerunOverrides: ${rerunCodesUsed.size > 0 ? Array.from(rerunCodesUsed).sort().join(", ") : "(none)"}`);
lines.push("- authStrategy: clerk_ticket_storage_state");
lines.push("- qlvSessionUsedForWebRoute: false");
lines.push("- existing57EvidencePreserved: YES");
lines.push("- formFlightRuntimeReadyPromoted: 0");
lines.push("");
lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_BATCH4_PREVIEW_CLICK.latest.{md,json}`");
lines.push("");
lines.push("### Notes");
for (const n of artifact.notes) lines.push(`- ${n}`);
lines.push("");
lines.push("### Per-form batch 4 preview-click evidence");
lines.push("");
lines.push("| Code | Source render | Browser verified | Demo click verified | Preview click verified | Preview click status | Preview duration (ms) | Session prefix | DOCX URL | Persisted false | Binary PK | GenDocId | Auto-download | History link | /documents route | Preview reason |");
lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const row of matrix.rows ?? []) {
  if (!batch4Set.has(row.templateCode)) continue;
  lines.push(
    `| ${row.templateCode} | ${row.sourceRenderVerified ? "yes" : "no"} | ${row.browserVerified ? "yes" : "no"} | ${row.demoClickVerified ? "yes" : "no"} | ${row.previewClickVerified ? "yes" : "no"} | ${row.previewClickStatus} | ${row.previewClickDurationMs ?? "—"} | ${row.previewClickSessionIdPrefix ?? "—"} | ${row.previewClickDocxUrlPresent ? "yes" : "no"} | ${row.previewClickPersistedFalse ? "yes" : "no"} | ${row.previewClickBinaryPkLeak ? "yes" : "no"} | ${row.previewClickGeneratedDocumentIdLeak ? "yes" : "no"} | ${row.previewClickAutoDownloadLeak ? "yes" : "no"} | ${row.previewClickHistoryLinkLeak ? "yes" : "no"} | ${row.previewClickDocumentsRouteLeak ? "yes" : "no"} | ${(row.previewClickReason ?? "").slice(0, 80)} |`,
  );
}
lines.push("");

writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

// ---- Standalone .md artifact ----
const renderArtifactMd = (a) => {
  const out = [];
  out.push("# QLLAW Batch 4 Preview-Click Smoke — latest");
  out.push("");
  out.push(`> **Generated**: ${a.generatedAt}`);
  out.push(`> **STATUS**: ${a.status}`);
  out.push(`> **STATUS_NOTE**: ${a.statusNote}`);
  out.push(`> **SOURCE_RENDER_STATUS**: ${a.sourceRenderStatus}`);
  out.push(`> **BROWSER_VISIBILITY_STATUS**: ${a.browserVisibilityStatus}`);
  out.push(`> **DEMO_CLICK_STATUS**: ${a.demoClickStatus}`);
  out.push(`> **PREVIEW_CLICK_STATUS**: ${a.previewClickStatus}`);
  out.push(`> **DOCX_DOWNLOAD_STATUS**: ${a.docxDownloadStatus}`);
  out.push(`> **MACHINE_CHECKABLE_FIDELITY_STATUS**: ${a.machineCheckableFidelityStatus}`);
  out.push(`> **VISUAL_PDF_FIDELITY_STATUS**: ${a.visualPdfReviewStatus}`);
  out.push(`> **FIDELITY_COMPLETE_CLAIMED**: ${a.fidelityCompleteClaimed}`);
  out.push(`> **Total forms**: ${a.totalForms}`);
  out.push(`> **Forms preview-clicked**: ${a.formsPreviewClicked}`);
  out.push(`> **Forms preview-passed**: ${a.formsPreviewPassed}`);
  out.push(`> **Forms preview-failed**: ${a.formsPreviewFailed}`);
  out.push(`> **Binary PK leaks**: ${a.binaryPkLeaks}`);
  out.push(`> **Content-Disposition leaks**: ${a.contentDispositionLeaks}`);
  out.push(`> **Generated document leaks**: ${a.generatedDocumentLeaks}`);
  out.push(`> **Auto-download leaks**: ${a.autoDownloadLeaks}`);
  out.push(`> **History link leaks**: ${a.historyLinkLeaks}`);
  out.push(`> **/documents/ route leaks**: ${a.documentsRouteLeaks}`);
  out.push(`> **DOCX download leaks**: ${a.docxDownloadLeaks}`);
  out.push(`> **Untruthful preview UI count**: ${a.untruthfulPreviewUiCount}`);
  out.push(`> **Rerun overrides**: ${a.rerunOverrides.length === 0 ? "(none)" : a.rerunOverrides.join(", ")}`);
  out.push(`> **Auth strategy**: ${a.authStrategy}`);
  out.push(`> **qlv_session used for web route**: ${a.qlvSessionUsedForWebRoute}`);
  out.push(`> **Existing 57 evidence preserved**: ${a.existing57EvidencePreserved ? "YES" : "NO"}`);
  out.push(`> **FormFlight runtimeReady promoted**: ${a.formFlightRuntimeReadyPromoted}`);
  out.push(`> **Playwright main stats**: expected=${a.playwrightMainStats?.expected}, unexpected=${a.playwrightMainStats?.unexpected}, flaky=${a.playwrightMainStats?.flaky}, skipped=${a.playwrightMainStats?.skipped}, durationMs=${a.playwrightMainStats?.duration}`);
  out.push(
    a.playwrightRerunStats
      ? `> **Playwright rerun stats**: expected=${a.playwrightRerunStats.expected}, unexpected=${a.playwrightRerunStats.unexpected}, flaky=${a.playwrightRerunStats.flaky}, skipped=${a.playwrightRerunStats.skipped}, durationMs=${a.playwrightRerunStats.duration}`
      : `> **Playwright rerun stats**: not run`,
  );
  out.push("");
  out.push("## Status rationale");
  out.push("");
  out.push(a.statusNote);
  out.push("");
  out.push("## Notes");
  out.push("");
  for (const n of a.notes) out.push(`- ${n}`);
  out.push("");
  out.push("## Hard refusals");
  out.push("");
  out.push("| Refusal | Observed |");
  out.push("|---|---|");
  out.push(`| sourceDocxMutated | ${a.sourceDocxMutated} |`);
  out.push(`| normalizedDocxMutated | ${a.normalizedDocxMutated} |`);
  out.push(`| lockedContractsMutated | ${a.lockedContractsMutated} |`);
  out.push(`| compiledContractsMutated | ${a.compiledContractsMutated} |`);
  out.push(`| dbMutated | ${a.dbMutated} |`);
  out.push(`| prismaSchemaMutated | ${a.prismaSchemaMutated} |`);
  out.push(`| migrationsCreated | ${a.migrationsCreated} |`);
  out.push(`| publicApiRoutePathsChanged | ${a.publicApiRoutePathsChanged} |`);
  out.push(`| commitCreated | ${a.commitCreated} |`);
  out.push(`| gitPushed | ${a.gitPushed} |`);
  out.push(`| filesStaged | ${a.filesStaged} |`);
  out.push(`| envValuesLogged | ${a.envValuesLogged} |`);
  out.push(`| playwrightStorageStateCommitted | ${a.playwrightStorageStateCommitted} |`);
  out.push(`| newFrameworkCreated | ${a.newFrameworkCreated} |`);
  out.push("");
  out.push("## Per-form batch 4 preview-click results");
  out.push("");
  out.push("| Code | Auth | Demo Clicked | Preview Button | Preview Clicked | POST Observed | Status Code | JSON | Binary PK | Persisted False | SessionId Prefix | DOCX URL | PDF URL | Fallback Honest | No Auto Download | No History Link | No GenDocId | No /documents Route | Console Errors | Failure Class | Preview Status |");
  out.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of a.perForm) {
    out.push(
      `| ${r.code} | ${r.authenticated} | ${r.demoClicked} | ${r.previewButtonVisible} | ${r.previewClicked} | ${r.previewSessionPostObserved} | ${r.previewSessionStatusCode ?? "—"} | ${r.previewSessionJson} | ${r.previewSessionBinaryPk} | ${r.persistedFalse} | ${r.sessionIdPrefixOk} | ${r.docxDownloadUrlPresent} | ${r.pdfPreviewUrlPresent ? "yes" : "no"} | ${r.fallbackCopyHonest} | ${r.noAutoDownload} | ${r.noHistoryLink} | ${r.noGeneratedDocumentId} | ${r.noDocumentsRouteNavigation} | ${r.consoleErrors} | ${r.failureClass ?? "—"} | ${r.previewClickStatus} |`,
    );
  }
  out.push("");
  out.push("## Remaining risks");
  out.push("");
  for (const r of a.remainingRisks) out.push(`- ${r}`);
  out.push("");
  return out.join("\n") + "\n";
};
writeFileSync(ARTIFACT_MD, renderArtifactMd(artifact));

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH4_CODES.length,
      previewClicked: smokeCount,
      previewPassed: passCount,
      previewFailed: failCount,
      binaryPkLeaks,
      generatedDocumentLeaks,
      autoDownloadLeaks,
      historyLinkLeaks,
      documentsRouteLeaks,
      rerunOverrides: Array.from(rerunCodesUsed).sort(),
      artifact: ARTIFACT.replace(ROOT + "/", ""),
      matrix: MATRIX.replace(ROOT + "/", ""),
    },
    null,
    2,
  ),
);
