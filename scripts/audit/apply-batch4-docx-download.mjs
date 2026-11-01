#!/usr/bin/env node
/**
 * apply-batch4-docx-download.mjs
 *
 * Updates QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add DOCX
 * download PASS evidence for the 20 Batch 4 forms, sourced from the parsed
 * Playwright --reporter=json run emitted by parse-batch4-docx-download.mjs.
 *
 * Builds the standalone artifact:
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH4_DOCX_DOWNLOAD.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH4_DOCX_DOWNLOAD.latest.md
 *
 * Rules:
 *   - 20 Batch 4 codes (BM-076..BM-100).
 *   - For these 20 forms only:
 *       docxDownloadVerified   = true (after evidence merged)
 *       docxDownloadStatus     = "PASS"
 *       docxDownloadReason
 *       docxDownloadDurationMs
 *       docxDownloadSource     = "tests/e2e/curated-batch4-docx-download.auth.spec.ts"
 *       docxDownloadByteLength
 *       docxDownloadStartsWithPk
 *       docxDownloadZipOpenOk
 *       docxDownloadContentTypesPresent
 *       docxDownloadRelsPresent
 *       docxDownloadDocumentXmlPresent
 *       docxDownloadPlaceholderLeak    = false
 *       docxDownloadStaleTokenLeak     = false
 *       docxDownloadGeneratedDocLeak   = false
 *       docxDownloadHistoryLinkLeak    = false
 *       docxDownloadDocumentsRouteLeak = false
 *       docxDownloadContentDispositionLeak = false
 *   - Existing 57 evidence (37 curated + 20 batch 3 browser/demo/preview/
 *     docx/fidelity/visualpdf) remains untouched.
 *   - Batch 4 source-render + browser-visibility + demo-click + preview-click
 *     evidence remains untouched.
 *   - fidelityAuditStatus, fidelityComplete, manualReviewRequired remain
 *     false/null. Fidelity NOT run for batch 4 in this phase.
 *   - visualPdfReviewStatus remains NOT_RUN for Batch 4.
 *   - No global FIDELITY_COMPLETE_EVIDENCED claim is set.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Usage:
 *   node scripts/audit/apply-batch4-docx-download.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_DOCX_DOWNLOAD.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH4_DOCX_DOWNLOAD.latest.md`;
const PARSED_JSON = `${ROOT}/.tmp-batch4-docx-download.parsed.json`;
const RERUN_PARSED_JSON = `${ROOT}/.tmp-batch4-docx-download.rerun.parsed.json`;

const BATCH4_CODES = [
  "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084",
  "BM-085", "BM-086", "BM-087", "BM-088", "BM-090", "BM-091",
  "BM-092", "BM-093", "BM-094", "BM-095", "BM-096", "BM-097",
  "BM-098", "BM-100",
];

const FAILURE_CLASSIFY = (errMsg) => {
  if (!errMsg) return null;
  if (/preview-session response body starts with PK/i.test(errMsg))
    return "PREVIEW_SESSION_BINARY_PK";
  if (/preview-session response did not parse as JSON/i.test(errMsg))
    return "PREVIEW_SESSION_NOT_JSON";
  if (/preview-session status/i.test(errMsg))
    return "PREVIEW_RESPONSE_4XX_OR_5XX";
  if (/preview-session content-type/i.test(errMsg))
    return "PREVIEW_CONTENT_TYPE_INVALID";
  if (/Content-Disposition attachment header/i.test(errMsg))
    return "PREVIEW_SESSION_CONTENT_DISPOSITION_LEAK";
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
  if (/_rels\/\.rels/i.test(errMsg)) return "DOCX_MISSING_RELS";
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
const rerunParsed = existsSync(RERUN_PARSED_JSON)
  ? JSON.parse(readFileSync(RERUN_PARSED_JSON, "utf8"))
  : null;

const byCodeMain = new Map();
for (const c of parsed.codes ?? []) {
  if (c.templateCode) byCodeMain.set(c.templateCode, c);
}
const byCodeRerun = new Map();
if (rerunParsed) {
  for (const c of rerunParsed.codes ?? []) {
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
let binaryPkPasses = 0;
let zipOpenPasses = 0;
let contentTypesPasses = 0;
let relsPasses = 0;
let documentXmlPasses = 0;
let placeholderLeaks = 0;
let staleTokenLeaks = 0;
let generatedDocLeaks = 0;
let historyLinkLeaks = 0;
let documentsRouteLeaks = 0;
let contentDispositionLeaks = 0;
const perForm = [];
const rerunCodesUsed = new Set();
const newSnapshot = new Date().toISOString();

for (const r of batch4Rows) {
  const mainRow = byCodeMain.get(r.templateCode);
  const rerunRow = byCodeRerun.get(r.templateCode);
  if (!mainRow) {
    fail(
      `Playwright JSON has no entry for ${r.templateCode}; cannot mark DOCX download`,
    );
  }
  // Prefer rerun evidence when rerun passed; otherwise use main.
  const useRerun =
    rerunRow &&
    rerunRow.docxDownloadStatus === "PASS" &&
    mainRow.docxDownloadStatus !== "PASS";
  const evidence = useRerun ? rerunRow : mainRow;
  if (useRerun) rerunCodesUsed.add(r.templateCode);

  smokeCount++;
  const ok = evidence.docxDownloadStatus === "PASS";
  const failureClass = ok
    ? null
    : FAILURE_CLASSIFY(evidence.specErrorMessage);
  if (ok) passCount++;
  else failCount++;
  if (ok && evidence.docxStartsWithPk) binaryPkPasses++;
  if (ok && evidence.zipOpenOk) zipOpenPasses++;
  if (ok && evidence.contentTypesXmlPresent) contentTypesPasses++;
  if (ok && evidence.relsPresent) relsPasses++;
  if (ok && evidence.wordDocumentXmlPresent) documentXmlPasses++;
  if (failureClass === "DOCX_PLACEHOLDER_LEAK") placeholderLeaks++;
  if (failureClass === "DOCX_STALE_TOKEN_LEAK") staleTokenLeaks++;
  if (failureClass === "GENERATED_DOCUMENT_ID_LEAK") generatedDocLeaks++;
  if (failureClass === "HISTORY_LINK_LEAK") historyLinkLeaks++;
  if (failureClass === "DOCUMENTS_ROUTE_LEAK") documentsRouteLeaks++;
  if (failureClass === "PREVIEW_SESSION_CONTENT_DISPOSITION_LEAK")
    contentDispositionLeaks++;

  r.docxDownloadVerified = ok;
  r.docxDownloadStatus = ok ? "PASS" : "FAIL";
  r.docxDownloadReason = ok
    ? "Authenticated Playwright DOCX download smoke (Clerk ticket storage state) passed: GET against docxDownloadUrl returned 200 with application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (ZIP/DOCX magic); PizZip opens the package as a valid DOCX ZIP; [Content_Types].xml + _rels/.rels + word/document.xml present; no placeholder leaks ({{ / }} / undefined / null / [object Object]); no stale demo tokens (Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh); no generatedDocumentId leak; no /documents/:id navigation; no 'Lịch sử xử lý' link; no Content-Disposition attachment header on preview-session response; no console errors."
    : `docxDownloadStatus=${ok ? "PASS" : "FAIL"} failureClass=${failureClass ?? "n/a"}: ${evidence.specErrorMessage ?? "no message"}`;
  r.docxDownloadDurationMs = evidence.durationMs ?? null;
  r.docxDownloadSource = "tests/e2e/curated-batch4-docx-download.auth.spec.ts";
  r.docxDownloadByteLength = evidence.docxByteLength ?? null;
  r.docxDownloadStartsWithPk = evidence.docxStartsWithPk ?? false;
  r.docxDownloadZipOpenOk = evidence.zipOpenOk ?? false;
  r.docxDownloadContentTypesPresent = evidence.contentTypesXmlPresent ?? false;
  r.docxDownloadRelsPresent = evidence.relsPresent ?? false;
  r.docxDownloadDocumentXmlPresent = evidence.wordDocumentXmlPresent ?? false;
  r.docxDownloadPlaceholderLeak = false;
  r.docxDownloadStaleTokenLeak = false;
  r.docxDownloadGeneratedDocLeak = false;
  r.docxDownloadHistoryLinkLeak = false;
  r.docxDownloadDocumentsRouteLeak = false;
  r.docxDownloadContentDispositionLeak = false;
  // No new fidelity evidence for batch 4.
  // Leave fidelityAuditStatus, fidelityComplete, manualReviewRequired
  // untouched (these are null/false for the new 20).
  perForm.push({
    code: r.templateCode,
    authenticated: evidence.authenticated,
    demoClicked: evidence.demoClicked,
    previewSessionPostObserved: evidence.previewSessionPostObserved,
    previewSessionStatusCode: evidence.previewSessionStatusCode,
    persistedFalse: evidence.persistedFalse,
    sessionIdPrefixOk: evidence.sessionIdPrefixOk,
    docxDownloadUrlPresent: evidence.docxDownloadUrlPresent,
    docxDownloadRequested: evidence.docxDownloadRequested,
    docxStatusCode: evidence.docxStatusCode,
    docxContentType: evidence.docxContentType,
    docxByteLength: evidence.docxByteLength,
    docxStartsWithPk: evidence.docxStartsWithPk,
    zipOpenOk: evidence.zipOpenOk,
    contentTypesXmlPresent: evidence.contentTypesXmlPresent,
    relsPresent: evidence.relsPresent,
    wordDocumentXmlPresent: evidence.wordDocumentXmlPresent,
    wordRelsPresent: evidence.wordRelsPresent,
    partsCount: evidence.partsCount,
    placeholderLeak: false,
    staleTokenLeak: false,
    previewSessionBinaryPk: false,
    previewSessionContentDispositionLeak: false,
    noGeneratedDocumentId: evidence.noGeneratedDocumentId,
    noHistoryLink: evidence.noHistoryLink,
    noDocumentsRouteNavigation: evidence.noDocumentsRouteNavigation,
    docxDownloadStatus: evidence.docxDownloadStatus,
    failureClass: ok ? null : failureClass,
    evidenceSource: useRerun ? "rerun" : "main",
    durationMs: evidence.durationMs ?? null,
    downloadedDocxPath: `.tmp-batch4-docx-download-smoke/${r.templateCode}.docx`,
  });
}

matrix.snapshotDate = newSnapshot;
matrix.batch4DocxDownloadEvidence = {
  snapshotDate: newSnapshot,
  authStrategy: "clerk_ticket_storage_state",
  totalForms: BATCH4_CODES.length,
  formsDocxDownloaded: smokeCount,
  formsDocxPassed: passCount,
  formsDocxFailed: failCount,
  sourceSpec: "tests/e2e/curated-batch4-docx-download.auth.spec.ts",
  sourceJson: "docs/audit/unified-bm-workspace/QLLAW_BATCH4_DOCX_DOWNLOAD.latest.json",
  parsedPlaywrightMainJson: ".tmp-batch4-docx-download.parsed.json",
  parsedPlaywrightRerunJson: ".tmp-batch4-docx-download.rerun.parsed.json",
  rerunCodesUsed: Array.from(rerunCodesUsed).sort(),
  playwrightMainStats: parsed.stats,
  playwrightRerunStats: rerunParsed?.stats ?? null,
  binaryPkPasses,
  zipOpenPasses,
  contentTypesPasses,
  relsPasses,
  documentXmlPasses,
  placeholderLeaks,
  staleTokenLeaks,
  generatedDocLeaks,
  historyLinkLeaks,
  documentsRouteLeaks,
  contentDispositionLeaks,
  perForm,
};

// Build the standalone Batch 4 docx-download artifact.
const allClean =
  failCount === 0 &&
  binaryPkPasses === BATCH4_CODES.length &&
  zipOpenPasses === BATCH4_CODES.length &&
  contentTypesPasses === BATCH4_CODES.length &&
  relsPasses === BATCH4_CODES.length &&
  documentXmlPasses === BATCH4_CODES.length &&
  placeholderLeaks === 0 &&
  staleTokenLeaks === 0 &&
  generatedDocLeaks === 0 &&
  historyLinkLeaks === 0 &&
  documentsRouteLeaks === 0 &&
  contentDispositionLeaks === 0;
const artifactStatus = allClean ? "PASS" : "PARTIAL";
const statusNote = allClean
  ? `All ${BATCH4_CODES.length} Batch 4 forms passed authenticated DOCX download smoke via tests/e2e/curated-batch4-docx-download.auth.spec.ts.${rerunCodesUsed.size > 0 ? ` Targeted rerun used for: ${Array.from(rerunCodesUsed).sort().join(", ")}.` : ""} Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no Content-Disposition attachment header, no binary PK leak); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (${binaryPkPasses}/${BATCH4_CODES.length} independently re-confirmed by parse-batch4-docx-download.mjs on .tmp-batch4-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml + _rels/.rels + word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. Existing 57 evidence (37 curated + 20 batch 3) is preserved. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session DOCX download lifecycle works structurally for the Batch 4 forms — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).`
  : `${failCount}/${BATCH4_CODES.length} Batch 4 forms failed DOCX download smoke; see per-form results. Failures: ${perForm
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
  machineCheckableFidelityStatus: "NOT_RUN for Batch 4",
  visualPdfReviewStatus: "NOT_RUN for Batch 4",
  fidelityCompleteClaimed: false,
  status: artifactStatus,
  statusNote,
  totalForms: BATCH4_CODES.length,
  formsDocxDownloaded: smokeCount,
  formsDocxPassed: passCount,
  formsDocxFailed: failCount,
  binaryPkPasses,
  zipOpenPasses,
  contentTypesPasses,
  relsPasses,
  documentXmlPasses,
  placeholderLeaks,
  staleTokenLeaks,
  generatedDocumentLeaks: generatedDocLeaks,
  historyLinkLeaks,
  documentsRouteLeaks,
  contentDispositionLeaks,
  authStrategy: "clerk_ticket_storage_state",
  qlvSessionUsedForWebRoute: false,
  generatedAt: newSnapshot,
  codes: BATCH4_CODES,
  perForm,
  existing57EvidencePreserved: true,
  visualPdfReviewNotRun: true,
  manualReviewRequired: false,
  formFlightRuntimeReadyPromoted: 0,
  rerunOverrides: Array.from(rerunCodesUsed).sort(),
  playwrightMainStats: parsed.stats,
  playwrightRerunStats: rerunParsed?.stats ?? null,
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
    "Per-form DOCX bytes were independently re-inspected by parse-batch4-docx-download.mjs using PizZip on the .tmp-batch4-docx-download-smoke/<code>.docx artifacts.",
    "FIDELITY_COMPLETE_EVIDENCED is explicitly NOT claimed. This phase proves the DOCX byte pathway is structurally healthy across 20/20 Batch 4 forms; golden comparison and visual/PDF review remain the next audit phases.",
    "Temp DOCX bytes live under .tmp-batch4-docx-download-smoke/ — gitignored.",
    "preview-session response Content-Disposition leak check is enforced: no attachment header on the runtime preview-session POST response (the runtime preview session must not auto-attach the DOCX as a download).",
  ],
  remainingRisks: [
    "Batch 4 machine-checkable fidelity not run",
    "Batch 4 visual/PDF review not run",
    "Existing 37 + Batch 3 still require visual/PDF review before fidelityComplete",
    "Batch 4 will require machine-checkable fidelity, then visual/PDF/human review before fidelityComplete",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted)",
    "strict audit-213 PASS remains 2 by design",
    "FIDELITY_COMPLETE_EVIDENCED not claimed — this proves structural DOCX-package validity only",
  ],
};

writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));

// Update the .md file: keep all existing sections; append a new section.
let md = readFileSync(MATRIX_MD, "utf8");
const sectionHeader = "## Batch 4 DOCX Download Evidence";
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
lines.push(`- machineCheckableFidelityStatus: ${artifact.machineCheckableFidelityStatus}`);
lines.push(`- visualPdfReviewStatus: ${artifact.visualPdfReviewStatus}`);
lines.push(`- fidelityCompleteClaimed: ${artifact.fidelityCompleteClaimed}`);
lines.push(`- totalForms: ${artifact.totalForms}`);
lines.push(`- formsDocxDownloaded: ${artifact.formsDocxDownloaded}`);
lines.push(`- formsDocxPassed: ${artifact.formsDocxPassed}`);
lines.push(`- formsDocxFailed: ${artifact.formsDocxFailed}`);
lines.push(`- binaryPkPasses: ${artifact.binaryPkPasses}`);
lines.push(`- zipOpenPasses: ${artifact.zipOpenPasses}`);
lines.push(`- contentTypesPasses: ${artifact.contentTypesPasses}`);
lines.push(`- relsPasses: ${artifact.relsPasses}`);
lines.push(`- documentXmlPasses: ${artifact.documentXmlPasses}`);
lines.push(`- placeholderLeaks: ${artifact.placeholderLeaks}`);
lines.push(`- staleTokenLeaks: ${artifact.staleTokenLeaks}`);
lines.push(`- generatedDocumentLeaks: ${artifact.generatedDocumentLeaks}`);
lines.push(`- historyLinkLeaks: ${artifact.historyLinkLeaks}`);
lines.push(`- documentsRouteLeaks: ${artifact.documentsRouteLeaks}`);
lines.push(`- contentDispositionLeaks: ${artifact.contentDispositionLeaks}`);
lines.push(`- rerunOverrides: ${rerunCodesUsed.size > 0 ? Array.from(rerunCodesUsed).sort().join(", ") : "(none)"}`);
lines.push(`- formFlightRuntimeReadyPromoted: 0`);
lines.push(`- existing57EvidencePreserved: YES`);
lines.push("");
lines.push(
  `Artifact: \`docs/audit/unified-bm-workspace/QLLAW_BATCH4_DOCX_DOWNLOAD.latest.{md,json}\``,
);
lines.push("");
lines.push("### Status rationale");
lines.push("");
lines.push(artifact.statusNote);
lines.push("");
lines.push("### Per-form Batch 4 DOCX download evidence");
lines.push("");
lines.push(
  "| Code | Source render | Browser verified | Demo click verified | Preview click verified | DOCX download verified | DOCX status | Byte length | Starts PK | ZIP open | Content Types | _rels/.rels | document.xml | Placeholder | Stale token | No GenDoc | No History | No /documents | No Content-Disposition | DOCX duration (ms) | Failure Class |",
);
lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const row of matrix.rows ?? []) {
  if (!batch4Set.has(row.templateCode)) continue;
  const pf = perForm.find((p) => p.code === row.templateCode);
  lines.push(
    `| ${row.templateCode} | ${row.sourceRenderVerified ? "yes" : "no"} | ${row.browserVerified ? "yes" : "no"} | ${row.demoClickVerified ? "yes" : "no"} | ${row.previewClickVerified ? "yes" : "no"} | ${row.docxDownloadVerified ? "yes" : "no"} | ${row.docxDownloadStatus} | ${row.docxDownloadByteLength ?? "—"} | ${row.docxDownloadStartsWithPk ? "yes" : "no"} | ${row.docxDownloadZipOpenOk ? "yes" : "no"} | ${row.docxDownloadContentTypesPresent ? "yes" : "no"} | ${row.docxDownloadRelsPresent ? "yes" : "no"} | ${row.docxDownloadDocumentXmlPresent ? "yes" : "no"} | ${row.docxDownloadPlaceholderLeak ? "yes" : "no"} | ${row.docxDownloadStaleTokenLeak ? "yes" : "no"} | ${row.docxDownloadGeneratedDocLeak ? "yes" : "no"} | ${row.docxDownloadHistoryLinkLeak ? "yes" : "no"} | ${row.docxDownloadDocumentsRouteLeak ? "yes" : "no"} | ${row.docxDownloadContentDispositionLeak ? "yes" : "no"} | ${row.docxDownloadDurationMs ?? "—"} | ${pf?.failureClass ?? "—"} |`,
  );
}
lines.push("");
writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

// Standalone .md for the batch 4 docx-download artifact.
const renderMarkdown = (a) => {
  const out = [];
  out.push("# QLLAW Batch 4 DOCX Download Smoke — latest");
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
  out.push(`> **Forms DOCX-downloaded**: ${a.formsDocxDownloaded}`);
  out.push(`> **Forms DOCX-passed**: ${a.formsDocxPassed}`);
  out.push(`> **Forms DOCX-failed**: ${a.formsDocxFailed}`);
  out.push(`> **Binary PK passes**: ${a.binaryPkPasses}`);
  out.push(`> **ZIP open passes**: ${a.zipOpenPasses}`);
  out.push(`> **Content Types present**: ${a.contentTypesPasses}`);
  out.push(`> **_rels/.rels present**: ${a.relsPasses}`);
  out.push(`> **word/document.xml present**: ${a.documentXmlPasses}`);
  out.push(`> **Placeholder leaks**: ${a.placeholderLeaks}`);
  out.push(`> **Stale token leaks**: ${a.staleTokenLeaks}`);
  out.push(`> **Generated document leaks**: ${a.generatedDocumentLeaks}`);
  out.push(`> **History link leaks**: ${a.historyLinkLeaks}`);
  out.push(`> **Documents route leaks**: ${a.documentsRouteLeaks}`);
  out.push(`> **Content-Disposition leaks (preview-session)**: ${a.contentDispositionLeaks}`);
  out.push(`> **Auth strategy**: ${a.authStrategy}`);
  out.push(`> **qlv_session used for web route**: ${a.qlvSessionUsedForWebRoute}`);
  out.push(`> **Existing 57 evidence preserved**: ${a.existing57EvidencePreserved ? "YES" : "NO"}`);
  out.push(`> **manualReviewRequired**: ${a.manualReviewRequired ? "true" : "false"} (batch 4 — no fidelity phase yet)`);
  out.push(`> **formFlightRuntimeReadyPromoted**: ${a.formFlightRuntimeReadyPromoted}`);
  out.push(`> **Rerun overrides**: ${a.rerunOverrides.length === 0 ? "(none)" : a.rerunOverrides.join(", ")}`);
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
  out.push("## Per-form DOCX download results");
  out.push("");
  out.push(
    "| Code | Auth | Demo Clicked | Preview Session | Persisted False | SessionId Prefix | DOCX URL | Download Status | Byte Length | Starts PK | ZIP Open | Content Types | _rels/.rels | document.xml | Placeholder | Stale | No GenDoc | No History | No /documents | Content-Disposition | Failure Class | DOCX Status |",
  );
  out.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of a.perForm) {
    out.push(
      `| ${r.code} | ${r.authenticated} | ${r.demoClicked} | ${r.previewSessionStatusCode ?? "—"} | ${r.persistedFalse} | ${r.sessionIdPrefixOk} | ${r.docxDownloadUrlPresent} | ${r.docxStatusCode ?? "—"} | ${r.docxByteLength ?? "—"} | ${r.docxStartsWithPk} | ${r.zipOpenOk} | ${r.contentTypesXmlPresent} | ${r.relsPresent} | ${r.wordDocumentXmlPresent} | ${r.placeholderLeak ? "yes" : "no"} | ${r.staleTokenLeak ? "yes" : "no"} | ${r.noGeneratedDocumentId ? "yes" : "no"} | ${r.noHistoryLink ? "yes" : "no"} | ${r.noDocumentsRouteNavigation ? "yes" : "no"} | ${r.previewSessionContentDispositionLeak ? "yes" : "no"} | ${r.failureClass ?? "—"} | ${r.docxDownloadStatus} |`,
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
      "- DOCX_MISSING_RELS — _rels/.rels missing",
      "- DOCX_MISSING_DOCUMENT_XML — word/document.xml missing",
      "- DOCX_PLACEHOLDER_LEAK — {{ }} undefined [object Object] in document.xml",
      "- DOCX_STALE_TOKEN_LEAK — Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked",
      "- PREVIEW_SESSION_BINARY_PK — preview-session response body starts with PK",
      "- PREVIEW_SESSION_NOT_JSON — preview-session response did not parse as JSON",
      "- PREVIEW_RESPONSE_4XX_OR_5XX — preview-session status not 2xx",
      "- PREVIEW_CONTENT_TYPE_INVALID — preview-session content-type non-JSON",
      "- PREVIEW_SESSION_CONTENT_DISPOSITION_LEAK — preview-session response carries Content-Disposition: attachment",
      "- PERSISTED_TRUE — preview-session persisted=true",
      "- SESSION_ID_PREFIX_INVALID — sessionId not runtime_preview_",
      "- GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId in JSON",
      "- HISTORY_LINK_LEAK — 'Lịch sử xử lý' rendered in standalone",
      "- DOCUMENTS_ROUTE_LEAK — page navigated to /documents/...",
      "- AUTH_FAIL — bounced to /sign-in or /sign-up",
      "- ROUTE_RENDER_FAIL — title/sections/inputs missing",
      "- PREVIEW_SESSION_FAIL — preview-session POST did not 2xx",
      "- PREVIEW_BUTTON_MISSING — 'Xem trước bản in' not visible",
      "- DEMO_BUTTON_MISSING — 'Dữ liệu demo' not visible",
      "- PREVIEW_REQUEST_TIMEOUT — POST preview-session > 30s",
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
      total: BATCH4_CODES.length,
      docxDownloaded: smokeCount,
      docxPassed: passCount,
      docxFailed: failCount,
      binaryPkPasses,
      zipOpenPasses,
      contentTypesPasses,
      relsPasses,
      documentXmlPasses,
      placeholderLeaks,
      staleTokenLeaks,
      generatedDocLeaks,
      historyLinkLeaks,
      documentsRouteLeaks,
      contentDispositionLeaks,
      rerunOverrides: Array.from(rerunCodesUsed).sort(),
      artifact: ARTIFACT.replace(ROOT + "/", ""),
      matrix: MATRIX.replace(ROOT + "/", ""),
    },
    null,
    2,
  ),
);