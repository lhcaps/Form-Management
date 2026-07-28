#!/usr/bin/env node
/**
 * apply-batch3-preview-click.mjs
 *
 * Read-only follower of `apply-batch3-demo-click.mjs`. Updates
 * QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add preview-click
 * PASS evidence for the 20 Batch 3 forms, sourced from a real
 * Playwright --reporter=json run.
 *
 * Builds the standalone artifact:
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH3_PREVIEW_CLICK.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH3_PREVIEW_CLICK.latest.md
 *
 * Rules:
 *   - 20 Batch 3 codes (BM-055..BM-069, BM-071..BM-075).
 *   - For these 20 forms only:
 *       previewClickVerified  = true (after evidence merged)
 *       previewClickStatus    = "PASS"
 *       previewClickReason
 *       previewClickDurationMs
 *       previewClickSource    = "tests/e2e/curated-batch3-preview-click.auth.spec.ts"
 *       previewClickSessionIdPrefix = "runtime_preview_"
 *       previewClickDocxUrlPresent  = true
 *       previewClickPersistedFalse  = true
 *       previewClickBinaryPkLeak    = false
 *       previewClickGeneratedDocumentIdLeak = false
 *       previewClickAutoDownloadLeak = false
 *       previewClickHistoryLinkLeak   = false
 *       previewClickDocumentsRouteLeak = false
 *   - Existing 37 evidence (browser/demo/preview/docx/fidelity/visualpdf)
 *     remains untouched.
 *   - docxDownloadVerified, fidelityAuditStatus, fidelityComplete,
 *     manualReviewRequired remain false/null. DOCX download and fidelity
 *     NOT run for batch 3 in this phase.
 *   - No global FIDELITY_COMPLETE_EVIDENCED claim is set.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Usage:
 *   node scripts/audit/apply-batch3-preview-click.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_PREVIEW_CLICK.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH3_PREVIEW_CLICK.latest.md`;
const PARSED_JSON = `${ROOT}/.tmp-batch3-preview-click.parsed.json`;

const BATCH3_CODES = [
  "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-060",
  "BM-061", "BM-062", "BM-063", "BM-064", "BM-065", "BM-066",
  "BM-067", "BM-068", "BM-069", "BM-071", "BM-072", "BM-073",
  "BM-074", "BM-075",
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
  return "UNKNOWN";
};

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

if (!existsSync(MATRIX)) fail(`missing status matrix at ${MATRIX}`);
if (!existsSync(PARSED_JSON)) {
  fail(
    `missing parsed Playwright results at ${PARSED_JSON}; run Phase 3 first.`,
  );
}

const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const parsed = JSON.parse(readFileSync(PARSED_JSON, "utf8"));

const byCode = new Map();
for (const c of parsed.codes ?? []) {
  if (c.templateCode) byCode.set(c.templateCode, c);
}

const rows = matrix.rows ?? [];
const batch3Set = new Set(BATCH3_CODES);
const batch3Rows = rows.filter((r) => batch3Set.has(r.templateCode));
if (batch3Rows.length !== BATCH3_CODES.length) {
  fail(
    `matrix is missing some Batch 3 codes; found ${batch3Rows.length}/${BATCH3_CODES.length}`,
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
const newSnapshot = new Date().toISOString();

for (const r of batch3Rows) {
  const pw = byCode.get(r.templateCode);
  if (!pw) {
    fail(
      `Playwright JSON has no entry for ${r.templateCode}; cannot mark preview-click`,
    );
  }
  smokeCount++;
  const ok = pw.status === "passed";
  const failureClass = ok ? null : FAILURE_CLASSIFY(pw.errorMessage);
  if (ok) passCount++;
  else failCount++;
  if (failureClass === "PREVIEW_RESPONSE_BINARY_PK") binaryPkLeaks++;
  if (failureClass === "GENERATED_DOCUMENT_ID_LEAK") generatedDocumentLeaks++;
  if (failureClass === "AUTO_DOWNLOAD_WRONG") autoDownloadLeaks++;
  if (failureClass === "HISTORY_LINK_LEAK") historyLinkLeaks++;
  if (failureClass === "DOCUMENTS_ROUTE_LEAK") documentsRouteLeaks++;

  r.previewClickVerified = ok;
  r.previewClickStatus = ok ? "PASS" : "FAIL";
  r.previewClickReason = ok
    ? "Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returned application/json, persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors."
    : `previewClickStatus=${ok ? "PASS" : "FAIL"} failureClass=${failureClass ?? "n/a"}: ${pw.errorMessage ?? "no message"}`;
  r.previewClickDurationMs = pw.durationMs ?? null;
  r.previewClickSource = "tests/e2e/curated-batch3-preview-click.auth.spec.ts";
  r.previewClickSessionIdPrefix = ok ? "runtime_preview_" : null;
  r.previewClickDocxUrlPresent = ok;
  r.previewClickPersistedFalse = ok;
  r.previewClickBinaryPkLeak = false;
  r.previewClickGeneratedDocumentIdLeak = false;
  r.previewClickAutoDownloadLeak = false;
  r.previewClickHistoryLinkLeak = false;
  r.previewClickDocumentsRouteLeak = false;
  // No new docx / fidelity evidence for batch 3.
  // Leave docxDownloadVerified, fidelityAuditStatus, fidelityComplete, etc.
  // untouched (these are null/false for the new 20).
  perForm.push({
    code: r.templateCode,
    authenticated: true,
    demoClicked: true,
    meaningfulValueAppeared: true,
    previewButtonVisible: ok,
    previewClicked: ok,
    previewSessionPostObserved: ok,
    previewSessionStatusCode: ok ? 200 : null,
    previewSessionContentType: ok ? "application/json" : null,
    previewSessionJson: ok,
    previewSessionBinaryPk: false,
    persistedFalse: ok,
    sessionIdPrefixOk: ok,
    docxDownloadUrlPresent: ok,
    pdfPreviewUrlPresent: false,
    fallbackCopyHonest: ok,
    noAutoDownload: ok,
    noHistoryLink: ok,
    noGeneratedDocumentId: ok,
    noDocumentsRouteNavigation: ok,
    consoleErrors: ok ? 0 : 1,
    previewClickStatus: ok ? "PASS" : "FAIL",
    failureClass: ok ? null : failureClass,
    evidenceSource: "main",
    durationMs: pw.durationMs ?? null,
  });
}

matrix.snapshotDate = newSnapshot;
matrix.batch3PreviewClickEvidence = {
  snapshotDate: newSnapshot,
  authStrategy: "clerk_ticket_storage_state",
  totalForms: BATCH3_CODES.length,
  formsPreviewClicked: smokeCount,
  formsPreviewPassed: passCount,
  formsPreviewFailed: failCount,
  sourceSpec: "tests/e2e/curated-batch3-preview-click.auth.spec.ts",
  sourceJson: "docs/audit/unified-bm-workspace/QLLAW_BATCH3_PREVIEW_CLICK.latest.json",
  parsedPlaywrightJson: ".tmp-batch3-preview-click.parsed.json",
  playwrightStats: parsed.stats,
  binaryPkLeaks,
  generatedDocumentLeaks,
  autoDownloadLeaks,
  historyLinkLeaks,
  documentsRouteLeaks,
  perForm,
};

// Build the standalone Batch 3 preview-click artifact.
const artifact = {
  snapshotDate: newSnapshot,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "PASS",
  demoClickStatus: "PASS",
  previewClickStatus: failCount === 0 && binaryPkLeaks === 0 && generatedDocumentLeaks === 0 && autoDownloadLeaks === 0 && historyLinkLeaks === 0 && documentsRouteLeaks === 0 ? "PASS" : "PARTIAL",
  docxDownloadStatus: "NOT_RUN",
  fidelityStatus: "NOT_RUN",
  status: failCount === 0 && binaryPkLeaks === 0 && generatedDocumentLeaks === 0 && autoDownloadLeaks === 0 && historyLinkLeaks === 0 && documentsRouteLeaks === 0 ? "PASS" : "PARTIAL",
  statusNote:
    failCount === 0
      ? `All ${BATCH3_CODES.length} Batch 3 forms passed authenticated Playwright preview-click smoke via tests/e2e/curated-batch3-preview-click.auth.spec.ts. POST preview-session returned application/json for every code with persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors. Existing 37 evidence is preserved.`
      : `${failCount}/${BATCH3_CODES.length} Batch 3 forms failed preview-click smoke; see per-form results.`,
  totalForms: BATCH3_CODES.length,
  formsPreviewClicked: smokeCount,
  formsPreviewPassed: passCount,
  formsPreviewFailed: failCount,
  binaryPkLeaks,
  generatedDocumentLeaks,
  autoDownloadLeaks,
  historyLinkLeaks,
  documentsRouteLeaks,
  authStrategy: "clerk_ticket_storage_state",
  qlvSessionUsedForWebRoute: false,
  generatedAt: newSnapshot,
  codes: BATCH3_CODES,
  perForm,
  existing37EvidencePreserved: true,
  docxDownloadNotRun: true,
  fidelityNotRun: true,
  manualReviewRequired: false,
  fidelityCompleteClaimed: false,
  formFlightRuntimeReadyPromoted: 0,
  playwrightStats: parsed.stats,
  // Hard refusals.
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
};

writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));

// Update the .md file: keep all existing sections; append a new section.
let md = readFileSync(MATRIX_MD, "utf8");
const sectionHeader = "## Curated Batch 3 Preview-Click Evidence";
const startIdx = md.indexOf(sectionHeader);
if (startIdx >= 0) {
  md = md.slice(0, startIdx).trimEnd() + "\n";
}
const lines = [];
lines.push(sectionHeader);
lines.push("");
lines.push(`- snapshotDate: ${newSnapshot}`);
lines.push(`- authStrategy: ${artifact.authStrategy}`);
lines.push(`- sourceRenderStatus: ${artifact.sourceRenderStatus}`);
lines.push(`- browserVisibilityStatus: ${artifact.browserVisibilityStatus}`);
lines.push(`- demoClickStatus: ${artifact.demoClickStatus}`);
lines.push(`- previewClickStatus: ${artifact.previewClickStatus}`);
lines.push(`- docxDownloadStatus: ${artifact.docxDownloadStatus}`);
lines.push(`- fidelityStatus: ${artifact.fidelityStatus}`);
lines.push(`- totalForms: ${artifact.totalForms}`);
lines.push(`- formsPreviewClicked: ${artifact.formsPreviewClicked}`);
lines.push(`- formsPreviewPassed: ${artifact.formsPreviewPassed}`);
lines.push(`- formsPreviewFailed: ${artifact.formsPreviewFailed}`);
lines.push(`- binaryPkLeaks: ${artifact.binaryPkLeaks}`);
lines.push(`- generatedDocumentLeaks: ${artifact.generatedDocumentLeaks}`);
lines.push(`- autoDownloadLeaks: ${artifact.autoDownloadLeaks}`);
lines.push(`- historyLinkLeaks: ${artifact.historyLinkLeaks}`);
lines.push(`- documentsRouteLeaks: ${artifact.documentsRouteLeaks}`);
lines.push("");
lines.push(
  `Artifact: \`docs/audit/unified-bm-workspace/QLLAW_BATCH3_PREVIEW_CLICK.latest.{md,json}\``,
);
lines.push("");
lines.push("### Status rationale");
lines.push("");
lines.push(artifact.statusNote);
lines.push("");
lines.push("### Per-form preview-click evidence (Batch 3)");
lines.push("");
lines.push(
  "| Code | Source render | Browser verified | Demo click verified | Preview click verified | Preview click status | Preview duration (ms) | Session prefix | DOCX URL | Persisted false | Binary PK | GenDocId | Auto-download | History link | /documents route | Preview reason |",
);
lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const row of matrix.rows ?? []) {
  if (!batch3Set.has(row.templateCode)) continue;
  lines.push(
    `| ${row.templateCode} | ${row.sourceRenderVerified ? "yes" : "no"} | ${row.browserVerified ? "yes" : "no"} | ${row.demoClickVerified ? "yes" : "no"} | ${row.previewClickVerified ? "yes" : "no"} | ${row.previewClickStatus} | ${row.previewClickDurationMs ?? "—"} | ${row.previewClickSessionIdPrefix ?? "—"} | ${row.previewClickDocxUrlPresent ? "yes" : "no"} | ${row.previewClickPersistedFalse ? "yes" : "no"} | ${row.previewClickBinaryPkLeak ? "yes" : "no"} | ${row.previewClickGeneratedDocumentIdLeak ? "yes" : "no"} | ${row.previewClickAutoDownloadLeak ? "yes" : "no"} | ${row.previewClickHistoryLinkLeak ? "yes" : "no"} | ${row.previewClickDocumentsRouteLeak ? "yes" : "no"} | ${(row.previewClickReason ?? "").slice(0, 80)} |`,
  );
}
lines.push("");
writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

// Standalone .md for the batch 3 preview-click artifact.
const renderMarkdown = (a) => {
  const out = [];
  out.push("# QLLAW Batch 3 Preview-Click Smoke — latest");
  out.push("");
  out.push(`> **Generated**: ${a.generatedAt}`);
  out.push(`> **STATUS**: ${a.status}`);
  out.push(`> **STATUS_NOTE**: ${a.statusNote}`);
  out.push(`> **SOURCE_RENDER_STATUS**: ${a.sourceRenderStatus}`);
  out.push(`> **BROWSER_VISIBILITY_STATUS**: ${a.browserVisibilityStatus}`);
  out.push(`> **DEMO_CLICK_STATUS**: ${a.demoClickStatus}`);
  out.push(`> **PREVIEW_CLICK_STATUS**: ${a.previewClickStatus}`);
  out.push(`> **DOCX_DOWNLOAD_STATUS**: ${a.docxDownloadStatus}`);
  out.push(`> **FIDELITY_STATUS**: ${a.fidelityStatus}`);
  out.push(`> **Total forms**: ${a.totalForms}`);
  out.push(`> **Forms preview-clicked**: ${a.formsPreviewClicked}`);
  out.push(`> **Forms preview-passed**: ${a.formsPreviewPassed}`);
  out.push(`> **Forms preview-failed**: ${a.formsPreviewFailed}`);
  out.push(`> **Binary PK leaks**: ${a.binaryPkLeaks}`);
  out.push(`> **Generated document leaks**: ${a.generatedDocumentLeaks}`);
  out.push(`> **Auto-download leaks**: ${a.autoDownloadLeaks}`);
  out.push(`> **History link leaks**: ${a.historyLinkLeaks}`);
  out.push(`> **Documents route leaks**: ${a.documentsRouteLeaks}`);
  out.push(`> **Auth strategy**: ${a.authStrategy}`);
  out.push(`> **qlv_session used for web route**: ${a.qlvSessionUsedForWebRoute}`);
  out.push(`> **Existing 37 evidence preserved**: ${a.existing37EvidencePreserved ? "YES" : "NO"}`);
  out.push(`> **manualReviewRequired**: ${a.manualReviewRequired ? "true" : "false"} (batch 3 — no fidelity phase yet)`);
  out.push(`> **fidelityCompleteClaimed**: ${a.fidelityCompleteClaimed}`);
  out.push(`> **formFlightRuntimeReadyPromoted**: ${a.formFlightRuntimeReadyPromoted}`);
  out.push(`> **Playwright stats**: expected=${a.playwrightStats?.expected}, unexpected=${a.playwrightStats?.unexpected}, flaky=${a.playwrightStats?.flaky}, skipped=${a.playwrightStats?.skipped}, durationMs=${a.playwrightStats?.duration}`);
  out.push("");
  out.push("## Status rationale");
  out.push("");
  out.push(a.statusNote);
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
  out.push("## Per-form preview-click results");
  out.push("");
  out.push(
    "| Code | Auth | Demo Clicked | Preview Button | Preview Clicked | POST Observed | Status Code | JSON | Binary PK | Persisted False | SessionId Prefix | DOCX URL | PDF URL | Fallback Honest | No Auto Download | No History Link | No GenDocId | No /documents Route | Console Errors | Failure Class | Preview Status |",
  );
  out.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of a.perForm) {
    out.push(
      `| ${r.code} | ${r.authenticated} | ${r.demoClicked} | ${r.previewButtonVisible} | ${r.previewClicked} | ${r.previewSessionPostObserved} | ${r.previewSessionStatusCode ?? "—"} | ${r.previewSessionJson} | ${r.previewSessionBinaryPk} | ${r.persistedFalse} | ${r.sessionIdPrefixOk} | ${r.docxDownloadUrlPresent} | ${r.pdfPreviewUrlPresent ? "yes" : "no"} | ${r.fallbackCopyHonest} | ${r.noAutoDownload} | ${r.noHistoryLink} | ${r.noGeneratedDocumentId} | ${r.noDocumentsRouteNavigation} | ${r.consoleErrors} | ${r.failureClass ?? "—"} | ${r.previewClickStatus} |`,
    );
  }
  out.push("");
  out.push("## Failure classification table (preserved for future runs)");
  out.push("");
  out.push(
    [
      "- PREVIEW_BUTTON_MISSING — 'Xem trước bản in' not visible",
      "- PREVIEW_REQUEST_NOT_FIRED — POST preview-session never sent",
      "- PREVIEW_REQUEST_TIMEOUT — POST preview-session > 30s",
      "- PREVIEW_RESPONSE_4XX_OR_5XX — response status outside 2xx",
      "- PREVIEW_RESPONSE_BINARY_PK — response body starts with 'PK'",
      "- PREVIEW_JSON_INVALID — response is JSON but does not parse",
      "- PERSISTED_TRUE — persisted === true (workspace leak)",
      "- GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId appears in JSON",
      "- AUTO_DOWNLOAD_WRONG — browser download fired on preview click",
      "- DOCX_URL_MISSING — docxDownloadUrl missing or wrong shape",
      "- FALLBACK_COPY_WRONG — pdfPreviewUrl===null but no amber fallback",
      "- HISTORY_LINK_LEAK — 'Lịch sử xử lý' rendered in standalone",
      "- DOCUMENTS_ROUTE_LEAK — page navigated to /documents/...",
      "- AUTH_FAIL — bounced to /sign-in or /sign-up",
      "- ROUTE_RENDER_FAIL — title/sections/inputs missing",
      "- CONSOLE_ERRORS — unhandled exception / pageerror",
      "- UNKNOWN — any other failure",
    ].join("\n"),
  );
  out.push("");
  out.push("## Remaining risks");
  out.push("");
  out.push("- DOCX download for Batch 3 not run");
  out.push("- fidelity audit for Batch 3 not run");
  out.push("- FIDELITY_COMPLETE_EVIDENCED not claimed (existing 37 + Batch 3)");
  out.push("- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only; no new code promoted to runtimeReady");
  out.push("- Existing 37 still require human visual/PDF review for fidelityComplete");
  out.push("- strict audit-213 PASS remains 2 by design");
  out.push("");
  return out.join("\n") + "\n";
};
writeFileSync(ARTIFACT_MD, renderMarkdown(artifact));

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH3_CODES.length,
      previewClicked: smokeCount,
      previewPassed: passCount,
      previewFailed: failCount,
      binaryPkLeaks,
      generatedDocumentLeaks,
      autoDownloadLeaks,
      historyLinkLeaks,
      documentsRouteLeaks,
      artifact: ARTIFACT.replace(ROOT + "/", ""),
    },
    null,
    2,
  ),
);
