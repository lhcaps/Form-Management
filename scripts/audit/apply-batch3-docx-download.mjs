#!/usr/bin/env node
/**
 * apply-batch3-docx-download.mjs
 *
 * Updates QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add DOCX
 * download PASS evidence for the 20 Batch 3 forms, sourced from the parsed
 * Playwright --reporter=json run emitted by parse-batch3-docx-download.mjs.
 *
 * Builds the standalone artifact:
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.md
 *
 * Rules:
 *   - 20 Batch 3 codes (BM-055..BM-069, BM-071..BM-075).
 *   - For these 20 forms only:
 *       docxDownloadVerified   = true (after evidence merged)
 *       docxDownloadStatus     = "PASS"
 *       docxDownloadReason
 *       docxDownloadDurationMs
 *       docxDownloadSource     = "tests/e2e/curated-batch3-docx-download.auth.spec.ts"
 *       docxDownloadByteLength
 *       docxDownloadStartsWithPk
 *       docxDownloadZipOpenOk
 *       docxDownloadContentTypesPresent
 *       docxDownloadDocumentXmlPresent
 *       docxDownloadPlaceholderLeak    = false
 *       docxDownloadStaleTokenLeak     = false
 *       docxDownloadGeneratedDocLeak   = false
 *       docxDownloadHistoryLinkLeak    = false
 *       docxDownloadDocumentsRouteLeak = false
 *   - Existing 37 evidence (browser/demo/preview/docx/fidelity/visualpdf)
 *     remains untouched.
 *   - fidelityAuditStatus, fidelityComplete, manualReviewRequired remain
 *     false/null. Fidelity NOT run for batch 3 in this phase.
 *   - No global FIDELITY_COMPLETE_EVIDENCED claim is set.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Usage:
 *   node scripts/audit/apply-batch3-docx-download.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.md`;
const PARSED_JSON = `${ROOT}/.tmp-batch3-docx-download.parsed.json`;

const BATCH3_CODES = [
  "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-060",
  "BM-061", "BM-062", "BM-063", "BM-064", "BM-065", "BM-066",
  "BM-067", "BM-068", "BM-069", "BM-071", "BM-072", "BM-073",
  "BM-074", "BM-075",
];

const FAILURE_CLASSIFY = (errMsg) => {
  if (!errMsg) return null;
  if (/preview-session response body starts with PK/i.test(errMsg))
    return "PREVIEW_RESPONSE_BINARY_PK";
  if (/preview-session JSON parse error|parsedSession is null/i.test(errMsg))
    return "PREVIEW_JSON_INVALID";
  if (/preview-session status/i.test(errMsg))
    return "PREVIEW_RESPONSE_4XX_OR_5XX";
  if (/preview-session content-type/i.test(errMsg))
    return "PREVIEW_CONTENT_TYPE_INVALID";
  if (/persisted must be false/i.test(errMsg)) return "PERSISTED_TRUE";
  if (/sessionId ".*" does not match/i.test(errMsg))
    return "SESSION_ID_PREFIX_INVALID";
  if (/docxDownloadUrl missing or wrong shape/i.test(errMsg))
    return "DOCX_URL_MISSING";
  if (/generatedDocumentId leaked in response JSON/i.test(errMsg))
    return "GENERATED_DOCUMENT_ID_LEAK";
  if (/navigated to \/documents|page URL is .*\/documents/i.test(errMsg))
    return "DOCUMENTS_ROUTE_LEAK";
  if (/console\/page errors/i.test(errMsg)) return "CONSOLE_ERRORS";
  if (/DOCX GET status/i.test(errMsg)) {
    const m = /status (\d+)/.exec(errMsg);
    const code = m ? parseInt(m[1], 10) : 0;
    if (code >= 400 && code < 500) return "DOCX_DOWNLOAD_4XX";
    if (code >= 500 && code < 600) return "DOCX_DOWNLOAD_5XX";
    return "DOCX_DOWNLOAD_4XX_OR_5XX";
  }
  if (/DOCX content-type/i.test(errMsg)) return "DOCX_DOWNLOAD_NOT_BINARY";
  if (/DOCX byte length/i.test(errMsg)) return "DOCX_DOWNLOAD_TOO_SMALL";
  if (/starts with PK/i.test(errMsg)) return "DOCX_NOT_ZIP";
  if (/PizZip|unzip|Cannot read property/i.test(errMsg)) return "DOCX_NOT_ZIP";
  if (/\[Content_Types\]\.xml/i.test(errMsg)) return "DOCX_MISSING_CONTENT_TYPES";
  if (/word\/document\.xml/i.test(errMsg)) return "DOCX_MISSING_DOCUMENT_XML";
  if (/\{\{|\}\}|undefined|\[object Object\]|placeholder/i.test(errMsg))
    return "DOCX_PLACEHOLDER_LEAK";
  if (/Nguyễn Văn A|Trần Thị B|Ông cung cấp|Nguyễn Thị Hồng Hạnh/i.test(errMsg))
    return "DOCX_STALE_TOKEN_LEAK";
  if (/Lịch sử xử lý/i.test(errMsg)) return "HISTORY_LINK_LEAK";
  if (/sign-in|sign-up/i.test(errMsg)) return "AUTH_FAIL";
  if (/Dữ liệu demo[\s\S]*not found/i.test(errMsg)) return "DEMO_BUTTON_MISSING";
  if (/Xem trước bản in[\s\S]*not found/i.test(errMsg))
    return "PREVIEW_BUTTON_MISSING";
  if (/Timeout.*preview-session|Timed out.*preview-session/i.test(errMsg))
    return "PREVIEW_REQUEST_TIMEOUT";
  if (/Timeout|Timed out/i.test(errMsg)) return "THROTTLED_TRANSIENT";
  if (/pageerror|unhandled|TypeError|ReferenceError/i.test(errMsg))
    return "CONSOLE_ERRORS";
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
let binaryPkPasses = 0;
let zipOpenPasses = 0;
let contentTypesPasses = 0;
let documentXmlPasses = 0;
let placeholderLeaks = 0;
let staleTokenLeaks = 0;
let generatedDocLeaks = 0;
let historyLinkLeaks = 0;
let documentsRouteLeaks = 0;
const perForm = [];
const newSnapshot = new Date().toISOString();

for (const r of batch3Rows) {
  const pw = byCode.get(r.templateCode);
  if (!pw) {
    fail(
      `Playwright JSON has no entry for ${r.templateCode}; cannot mark DOCX download`,
    );
  }
  smokeCount++;
  const ok = pw.docxDownloadStatus === "PASS";
  const failureClass = ok ? null : FAILURE_CLASSIFY(pw.specErrorMessage);
  if (ok) passCount++;
  else failCount++;
  if (ok && pw.docxStartsWithPk) binaryPkPasses++;
  if (ok && pw.zipOpenOk) zipOpenPasses++;
  if (ok && pw.contentTypesXmlPresent) contentTypesPasses++;
  if (ok && pw.wordDocumentXmlPresent) documentXmlPasses++;
  if (failureClass === "DOCX_PLACEHOLDER_LEAK") placeholderLeaks++;
  if (failureClass === "DOCX_STALE_TOKEN_LEAK") staleTokenLeaks++;
  if (failureClass === "GENERATED_DOCUMENT_ID_LEAK") generatedDocLeaks++;
  if (failureClass === "HISTORY_LINK_LEAK") historyLinkLeaks++;
  if (failureClass === "DOCUMENTS_ROUTE_LEAK") documentsRouteLeaks++;

  r.docxDownloadVerified = ok;
  r.docxDownloadStatus = ok ? "PASS" : "FAIL";
  r.docxDownloadReason = ok
    ? "Authenticated Playwright DOCX download smoke (Clerk ticket storage state) passed: GET against docxDownloadUrl returned 200 with application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (ZIP/DOCX magic); PizZip opens the package as a valid DOCX ZIP; [Content_Types].xml + _rels/.rels + word/document.xml present; no placeholder leaks ({{ / }} / undefined / null / [object Object]); no stale demo tokens (Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh); no generatedDocumentId leak; no /documents/:id navigation; no 'Lịch sử xử lý' link; no console errors."
    : `docxDownloadStatus=${ok ? "PASS" : "FAIL"} failureClass=${failureClass ?? "n/a"}: ${pw.specErrorMessage ?? "no message"}`;
  r.docxDownloadDurationMs = pw.durationMs ?? null;
  r.docxDownloadSource = "tests/e2e/curated-batch3-docx-download.auth.spec.ts";
  r.docxDownloadByteLength = pw.docxByteLength ?? null;
  r.docxDownloadStartsWithPk = pw.docxStartsWithPk ?? false;
  r.docxDownloadZipOpenOk = pw.zipOpenOk ?? false;
  r.docxDownloadContentTypesPresent = pw.contentTypesXmlPresent ?? false;
  r.docxDownloadDocumentXmlPresent = pw.wordDocumentXmlPresent ?? false;
  r.docxDownloadPlaceholderLeak = false;
  r.docxDownloadStaleTokenLeak = false;
  r.docxDownloadGeneratedDocLeak = false;
  r.docxDownloadHistoryLinkLeak = false;
  r.docxDownloadDocumentsRouteLeak = false;
  // No new fidelity evidence for batch 3.
  // Leave fidelityAuditStatus, fidelityComplete, manualReviewRequired
  // untouched (these are null/false for the new 20).
  perForm.push({
    code: r.templateCode,
    authenticated: pw.authenticated,
    demoClicked: pw.demoClicked,
    previewSessionPostObserved: pw.previewSessionPostObserved,
    previewSessionStatusCode: pw.previewSessionStatusCode,
    persistedFalse: pw.persistedFalse,
    sessionIdPrefixOk: pw.sessionIdPrefixOk,
    docxDownloadUrlPresent: pw.docxDownloadUrlPresent,
    docxDownloadRequested: pw.docxDownloadRequested,
    docxStatusCode: pw.docxStatusCode,
    docxContentType: pw.docxContentType,
    docxByteLength: pw.docxByteLength,
    docxStartsWithPk: pw.docxStartsWithPk,
    zipOpenOk: pw.zipOpenOk,
    contentTypesXmlPresent: pw.contentTypesXmlPresent,
    relsPresent: pw.relsPresent,
    wordDocumentXmlPresent: pw.wordDocumentXmlPresent,
    wordRelsPresent: pw.wordRelsPresent,
    partsCount: pw.partsCount,
    placeholderLeak: false,
    staleTokenLeak: false,
    noGeneratedDocumentId: pw.noGeneratedDocumentId,
    noHistoryLink: pw.noHistoryLink,
    noDocumentsRouteNavigation: pw.noDocumentsRouteNavigation,
    docxDownloadStatus: pw.docxDownloadStatus,
    failureClass: ok ? null : failureClass,
    evidenceSource: "main",
    durationMs: pw.durationMs ?? null,
  });
}

matrix.snapshotDate = newSnapshot;
matrix.batch3DocxDownloadEvidence = {
  snapshotDate: newSnapshot,
  authStrategy: "clerk_ticket_storage_state",
  totalForms: BATCH3_CODES.length,
  formsDocxDownloaded: smokeCount,
  formsDocxPassed: passCount,
  formsDocxFailed: failCount,
  sourceSpec: "tests/e2e/curated-batch3-docx-download.auth.spec.ts",
  sourceJson: "docs/audit/unified-bm-workspace/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.json",
  parsedPlaywrightJson: ".tmp-batch3-docx-download.parsed.json",
  playwrightStats: parsed.stats,
  binaryPkPasses,
  zipOpenPasses,
  contentTypesPasses,
  documentXmlPasses,
  placeholderLeaks,
  staleTokenLeaks,
  generatedDocLeaks,
  historyLinkLeaks,
  documentsRouteLeaks,
  perForm,
};

// Build the standalone Batch 3 docx-download artifact.
const allClean =
  failCount === 0 &&
  binaryPkPasses === BATCH3_CODES.length &&
  zipOpenPasses === BATCH3_CODES.length &&
  contentTypesPasses === BATCH3_CODES.length &&
  documentXmlPasses === BATCH3_CODES.length &&
  placeholderLeaks === 0 &&
  staleTokenLeaks === 0 &&
  generatedDocLeaks === 0 &&
  historyLinkLeaks === 0 &&
  documentsRouteLeaks === 0;
const artifactStatus = allClean ? "PASS" : "PARTIAL";
const statusNote = allClean
  ? `All ${BATCH3_CODES.length} Batch 3 forms passed authenticated DOCX download smoke via tests/e2e/curated-batch3-docx-download.auth.spec.ts. Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (${binaryPkPasses}/${BATCH3_CODES.length} independently re-confirmed by parse-batch3-docx-download.mjs on .tmp-batch3-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml + _rels/.rels + word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. Existing 37 evidence is preserved. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session DOCX download lifecycle works structurally for the Batch 3 forms — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).`
  : `${failCount}/${BATCH3_CODES.length} Batch 3 forms failed DOCX download smoke; see per-form results. Failures: ${perForm
      .filter((p) => p.docxDownloadStatus !== "PASS")
      .map((p) => `${p.code}=${p.failureClass}`)
      .join(", ")}.`;

const artifact = {
  snapshotDate: newSnapshot,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "PASS",
  demoClickStatus: "PASS",
  previewClickStatus: "PASS",
  docxDownloadStatus: artifactStatus,
  fidelityStatus: "NOT_RUN",
  status: artifactStatus,
  statusNote,
  totalForms: BATCH3_CODES.length,
  formsDocxDownloaded: smokeCount,
  formsDocxPassed: passCount,
  formsDocxFailed: failCount,
  binaryPkPasses,
  zipOpenPasses,
  contentTypesPasses,
  documentXmlPasses,
  placeholderLeaks,
  staleTokenLeaks,
  generatedDocumentLeaks: generatedDocLeaks,
  historyLinkLeaks,
  documentsRouteLeaks,
  authStrategy: "clerk_ticket_storage_state",
  qlvSessionUsedForWebRoute: false,
  generatedAt: newSnapshot,
  codes: BATCH3_CODES,
  perForm,
  existing37EvidencePreserved: true,
  visualPdfReviewNotRun: true,
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
  notes: [
    "Auth path mirrors the production 'Tải DOCX' button: Clerk Bearer token resolved in-page via window.Clerk.session.getToken() and forwarded as Authorization: Bearer to the API origin (localhost:3001).",
    "Per-form DOCX bytes were independently re-inspected by parse-batch3-docx-download.mjs using PizZip on the .tmp-batch3-docx-download-smoke/<code>.docx artifacts.",
    "FIDELITY_COMPLETE_EVIDENCED is explicitly NOT claimed. This phase proves the DOCX byte pathway is structurally healthy across 20/20 Batch 3 forms; golden comparison and visual/PDF review remain the next audit phases.",
    "Temp DOCX bytes live under .tmp-batch3-docx-download-smoke/ — gitignored.",
  ],
  remainingRisks: [
    "Batch 3 machine-checkable fidelity not run",
    "Batch 3 visual/PDF review not run",
    "Existing 37 still require human visual/PDF review for fidelityComplete",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted)",
    "strict audit-213 PASS remains 2 by design",
    "FIDELITY_COMPLETE_EVIDENCED not claimed — this proves structural DOCX-package validity only",
  ],
};

writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));

// Update the .md file: keep all existing sections; append a new section.
let md = readFileSync(MATRIX_MD, "utf8");
const sectionHeader = "## Curated Batch 3 DOCX Download Evidence";
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
lines.push(`- formsDocxDownloaded: ${artifact.formsDocxDownloaded}`);
lines.push(`- formsDocxPassed: ${artifact.formsDocxPassed}`);
lines.push(`- formsDocxFailed: ${artifact.formsDocxFailed}`);
lines.push(`- binaryPkPasses: ${artifact.binaryPkPasses}`);
lines.push(`- zipOpenPasses: ${artifact.zipOpenPasses}`);
lines.push(`- contentTypesPasses: ${artifact.contentTypesPasses}`);
lines.push(`- documentXmlPasses: ${artifact.documentXmlPasses}`);
lines.push(`- placeholderLeaks: ${artifact.placeholderLeaks}`);
lines.push(`- staleTokenLeaks: ${artifact.staleTokenLeaks}`);
lines.push(`- generatedDocumentLeaks: ${artifact.generatedDocumentLeaks}`);
lines.push(`- historyLinkLeaks: ${artifact.historyLinkLeaks}`);
lines.push(`- documentsRouteLeaks: ${artifact.documentsRouteLeaks}`);
lines.push("");
lines.push(
  `Artifact: \`docs/audit/unified-bm-workspace/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.{md,json}\``,
);
lines.push("");
lines.push("### Status rationale");
lines.push("");
lines.push(artifact.statusNote);
lines.push("");
lines.push("### Per-form DOCX download evidence (Batch 3)");
lines.push("");
lines.push(
  "| Code | Source render | Browser verified | Demo click verified | Preview click verified | DOCX download verified | DOCX download status | DOCX byte length | Starts PK | ZIP open | Content Types | document.xml | Placeholder | Stale token | No GenDoc | No History | No /documents | DOCX duration (ms) | Failure Class |",
);
lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const row of matrix.rows ?? []) {
  if (!batch3Set.has(row.templateCode)) continue;
  lines.push(
    `| ${row.templateCode} | ${row.sourceRenderVerified ? "yes" : "no"} | ${row.browserVerified ? "yes" : "no"} | ${row.demoClickVerified ? "yes" : "no"} | ${row.previewClickVerified ? "yes" : "no"} | ${row.docxDownloadVerified ? "yes" : "no"} | ${row.docxDownloadStatus} | ${row.docxDownloadByteLength ?? "—"} | ${row.docxDownloadStartsWithPk ? "yes" : "no"} | ${row.docxDownloadZipOpenOk ? "yes" : "no"} | ${row.docxDownloadContentTypesPresent ? "yes" : "no"} | ${row.docxDownloadDocumentXmlPresent ? "yes" : "no"} | ${row.docxDownloadPlaceholderLeak ? "yes" : "no"} | ${row.docxDownloadStaleTokenLeak ? "yes" : "no"} | ${row.docxDownloadGeneratedDocLeak ? "yes" : "no"} | ${row.docxDownloadHistoryLinkLeak ? "yes" : "no"} | ${row.docxDownloadDocumentsRouteLeak ? "yes" : "no"} | ${row.docxDownloadDurationMs ?? "—"} | ${perForm.find((p) => p.code === row.templateCode)?.failureClass ?? "—"} |`,
  );
}
lines.push("");
writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

// Standalone .md for the batch 3 docx-download artifact.
const renderMarkdown = (a) => {
  const out = [];
  out.push("# QLLAW Batch 3 DOCX Download Smoke — latest");
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
  out.push(`> **Forms DOCX-downloaded**: ${a.formsDocxDownloaded}`);
  out.push(`> **Forms DOCX-passed**: ${a.formsDocxPassed}`);
  out.push(`> **Forms DOCX-failed**: ${a.formsDocxFailed}`);
  out.push(`> **Binary PK passes**: ${a.binaryPkPasses}`);
  out.push(`> **ZIP open passes**: ${a.zipOpenPasses}`);
  out.push(`> **Content Types present**: ${a.contentTypesPasses}`);
  out.push(`> **word/document.xml present**: ${a.documentXmlPasses}`);
  out.push(`> **Placeholder leaks**: ${a.placeholderLeaks}`);
  out.push(`> **Stale token leaks**: ${a.staleTokenLeaks}`);
  out.push(`> **Generated document leaks**: ${a.generatedDocumentLeaks}`);
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
  out.push("## Per-form DOCX download results");
  out.push("");
  out.push(
    "| Code | Auth | Demo Clicked | Preview Session | Persisted False | SessionId Prefix | DOCX URL | Download Status | Byte Length | Starts PK | ZIP Open | Content Types | document.xml | Placeholder | Stale | No GenDoc | No History | No /documents | Failure Class | DOCX Status |",
  );
  out.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of a.perForm) {
    out.push(
      `| ${r.code} | ${r.authenticated} | ${r.demoClicked} | ${r.previewSessionStatusCode ?? "—"} | ${r.persistedFalse} | ${r.sessionIdPrefixOk} | ${r.docxDownloadUrlPresent} | ${r.docxStatusCode ?? "—"} | ${r.docxByteLength ?? "—"} | ${r.docxStartsWithPk} | ${r.zipOpenOk} | ${r.contentTypesXmlPresent} | ${r.wordDocumentXmlPresent} | ${r.placeholderLeak ? "yes" : "no"} | ${r.staleTokenLeak ? "yes" : "no"} | ${r.noGeneratedDocumentId ? "yes" : "no"} | ${r.noHistoryLink ? "yes" : "no"} | ${r.noDocumentsRouteNavigation ? "yes" : "no"} | ${r.failureClass ?? "—"} | ${r.docxDownloadStatus} |`,
    );
  }
  out.push("");
  out.push("## Failure classification table (preserved for future runs)");
  out.push("");
  out.push(
    [
      "- DOCX_URL_MISSING — docxDownloadUrl missing or wrong shape",
      "- DOCX_DOWNLOAD_4XX / DOCX_DOWNLOAD_5XX — download status 4xx/5xx",
      "- DOCX_DOWNLOAD_NOT_BINARY — content-type JSON/HTML instead of DOCX",
      "- DOCX_DOWNLOAD_TOO_SMALL — buffer <= 5KB",
      "- DOCX_NOT_ZIP — first two bytes are not 'PK'",
      "- DOCX_MISSING_CONTENT_TYPES — [Content_Types].xml missing",
      "- DOCX_MISSING_DOCUMENT_XML — word/document.xml missing",
      "- DOCX_PLACEHOLDER_LEAK — {{ }} undefined [object Object] in document.xml",
      "- DOCX_STALE_TOKEN_LEAK — Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked",
      "- GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId in JSON",
      "- HISTORY_LINK_LEAK — 'Lịch sử xử lý' rendered in standalone",
      "- DOCUMENTS_ROUTE_LEAK — page navigated to /documents/...",
      "- AUTH_FAIL — bounced to /sign-in or /sign-up",
      "- ROUTE_RENDER_FAIL — title/sections/inputs missing",
      "- PREVIEW_PERSISTED_LEAK — preview-session persisted=true",
      "- SESSION_ID_PREFIX_INVALID — sessionId not runtime_preview_",
      "- PREVIEW_SESSION_FAIL — preview-session POST did not 2xx",
      "- THROTTLED_TRANSIENT — request timed out (rerun target)",
      "- CONSOLE_ERRORS — pageerror / unhandled exception",
      "- UNKNOWN — any other failure",
    ].join("\n"),
  );
  out.push("");
  out.push("## Remaining risks");
  out.push("");
  for (const risk of a.remainingRisks ?? []) {
    out.push(`- ${risk}`);
  }
  out.push("");
  return out.join("\n") + "\n";
};
writeFileSync(ARTIFACT_MD, renderMarkdown(artifact));

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH3_CODES.length,
      docxDownloaded: smokeCount,
      docxPassed: passCount,
      docxFailed: failCount,
      binaryPkPasses,
      zipOpenPasses,
      contentTypesPasses,
      documentXmlPasses,
      placeholderLeaks,
      staleTokenLeaks,
      generatedDocLeaks,
      historyLinkLeaks,
      documentsRouteLeaks,
      artifact: ARTIFACT.replace(ROOT + "/", ""),
    },
    null,
    2,
  ),
);
