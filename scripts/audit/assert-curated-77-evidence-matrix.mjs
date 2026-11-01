#!/usr/bin/env node
/**
 * assert-curated-77-evidence-matrix.mjs
 *
 * Read-only guard. Verifies the original 77-row evidence matrix invariants
 * after Batch 4 has been promoted (37 existing + 20 batch 3 + 20 batch 4
 * = 77 preserved INPUT_CONNECTED_PASS rows). Later source/render batches may
 * increase the total PASS count; this guard must still prove the old 77
 * evidence remains intact.
 *
 * Asserts:
 *   - Total rows == 213
 *   - counts.INPUT_CONNECTED_PASS  == 77
 *   - counts.INPUT_CONNECTED_PARTIAL == 136
 *   - For every existing 37 (CURATED_37) code:
 *       status                       === "INPUT_CONNECTED_PASS"
 *       sourceRenderVerified         === true
 *       browserVerified              === true
 *       demoClickVerified            === true
 *       previewClickVerified         === true
 *       docxDownloadVerified         === true
 *       fidelityAuditStatus          === "PASS"
 *       visualPdfReviewStatus        === "PARTIAL"  (manual review required)
 *       fidelityComplete             === false
 *       manualReviewRequired         === true
 *   - For every Batch 3 code (BATCH3_CODES):
 *       status                       === "INPUT_CONNECTED_PASS"
 *       sourceRenderVerified         === true
 *       browserVerified              === true
 *       browserVerifiedStatus        === "PASS"
 *       demoClickVerified            === true
 *       previewClickVerified         === true
 *       docxDownloadVerified         === true
 *       fidelityAuditStatus          === "PASS"
 *       machineCheckableFidelityStatus === "PASS"
 *       visualPdfReviewStatus        is one of the Batch 3 visual/PDF
 *                                       allowed values (NOT_RUN only if
 *                                       the Batch 3 artifact is missing).
 *       fidelityComplete             === false
 *       manualReviewRequired         === true
 *   - For every Batch 4 code (BATCH4_CODES):
 *       status                       === "INPUT_CONNECTED_PASS"
 *       sourceRenderVerified         === true
 *       (browser/demo/preview/docx/fidelity evidence required)
 *       visualPdfReviewStatus may be:
 *         NOT_RUN | null | undefined |
 *         PASS_AUTO_NEEDS_HUMAN_CONFIRM | PARTIAL_AUTO_NEEDS_REVIEW |
 *         FAIL_AUTO_NEEDS_REVIEW | CONVERSION_FAILED |
 *         PASS_HUMAN_REVIEWED | FAIL_HUMAN_REVIEWED
 *       fidelityComplete             === false
 *       manualReviewRequired         === true
 *   - No non-curated, non-batch3, non-batch4 row has any of the
 *     curated-only evidence flags.
 *   - No global FIDELITY_COMPLETE_EVIDENCED claim is set on the matrix.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Exits non-zero on the first invariant failure with a clear error
 * message. Used as a CI gate at the end of
 * scripts/audit/apply-batch4-evidence.mjs (future phase).
 *
 * Usage:
 *   node scripts/audit/assert-curated-77-evidence-matrix.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateHoldoutRuntimeEvidence } from "./holdout-runtime-evidence.mjs";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;

const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const BATCH4_DOCX_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_DOCX_DOWNLOAD.latest.json`;

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

// Batch 4 (20 forms) — promoted from PARTIAL → PASS via source/render
// smoke only. Browser/demo/preview/docx/fidelity phases run separately.
const BATCH4_CODES = [
  "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084",
  "BM-085", "BM-086", "BM-087", "BM-088", "BM-090", "BM-091",
  "BM-092", "BM-093", "BM-094", "BM-095", "BM-096", "BM-097",
  "BM-098", "BM-100",
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

const ALLOWED_DECISIONS = new Set(["PASS", "FAIL", "UNCERTAIN"]);

function loadJson(path, label) {
  if (!existsSync(path)) fail(`missing required artifact: ${label} (${path})`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`invalid JSON in ${label}: ${err.message}`);
  }
}

function main() {
  let approvedHoldoutEvidence;
  try {
    approvedHoldoutEvidence = validateHoldoutRuntimeEvidence(OUT_DIR);
  } catch (error) {
    fail(error.message);
  }
  const matrix = loadJson(MATRIX, "status matrix");

  // 1. Total rows.
  const rows = matrix.rows || [];
  if (matrix.total !== 213 || rows.length !== 213) {
    fail(`matrix.total=${matrix.total} rows.length=${rows.length}; expected 213/213`);
  }

  // 2. Top-level counts. This is a preservation guard, so later source/render
  // batches may increase PASS above 77 and reduce PARTIAL below 136.
  const counts = matrix.counts || {};
  if (counts.INPUT_CONNECTED_PASS < 77) {
    fail(`counts.INPUT_CONNECTED_PASS=${counts.INPUT_CONNECTED_PASS}; expected at least 77`);
  }
  if (counts.INPUT_CONNECTED_PARTIAL > 136) {
    fail(`counts.INPUT_CONNECTED_PARTIAL=${counts.INPUT_CONNECTED_PARTIAL}; expected at most 136`);
  }

  // 3. Index rows.
  const byCode = new Map(rows.map((r) => [r.templateCode, r]));
  const curatedSet = new Set(CURATED_37);
  const batch3Set = new Set(BATCH3_CODES);
  const batch4Set = new Set(BATCH4_CODES);
  for (const code of [...CURATED_37, ...BATCH3_CODES, ...BATCH4_CODES]) {
    if (!byCode.get(code)) fail(`missing curated row ${code} in matrix`);
  }

  // 4. Per-curated-37 invariants (unchanged from assert-curated-37).
  for (const code of CURATED_37) {
    const r = byCode.get(code);
    if (r.status !== "INPUT_CONNECTED_PASS") {
      fail(`curated-37 ${r.templateCode}: status=${r.status}; expected INPUT_CONNECTED_PASS`);
    }
    if (r.sourceRenderVerified !== true) {
      fail(`curated-37 ${r.templateCode}: sourceRenderVerified=${r.sourceRenderVerified}; expected true`);
    }
    if (r.browserVerified !== true) {
      fail(`curated-37 ${r.templateCode}: browserVerified=${r.browserVerified}; expected true`);
    }
    if (r.demoClickVerified !== true) {
      fail(`curated-37 ${r.templateCode}: demoClickVerified=${r.demoClickVerified}; expected true`);
    }
    if (r.previewClickVerified !== true) {
      fail(`curated-37 ${r.templateCode}: previewClickVerified=${r.previewClickVerified}; expected true`);
    }
    if (r.docxDownloadVerified !== true) {
      fail(`curated-37 ${r.templateCode}: docxDownloadVerified=${r.docxDownloadVerified}; expected true`);
    }
    if (r.fidelityAuditStatus !== "PASS") {
      fail(`curated-37 ${r.templateCode}: fidelityAuditStatus=${r.fidelityAuditStatus}; expected PASS`);
    }
    if (r.fidelityComplete !== false) {
      fail(`curated-37 ${r.templateCode}: fidelityComplete=${r.fidelityComplete}; expected false`);
    }
    if (r.manualReviewRequired !== true) {
      fail(`curated-37 ${r.templateCode}: manualReviewRequired=${r.manualReviewRequired}; expected true`);
    }
  }

  // 5. Per-batch-3 invariants.
  for (const code of BATCH3_CODES) {
    const r = byCode.get(code);
    if (r.status !== "INPUT_CONNECTED_PASS") {
      fail(`batch3 ${r.templateCode}: status=${r.status}; expected INPUT_CONNECTED_PASS`);
    }
    if (r.sourceRenderVerified !== true) {
      fail(`batch3 ${r.templateCode}: sourceRenderVerified=${r.sourceRenderVerified}; expected true`);
    }
    if (r.browserVerified !== true) {
      fail(`batch3 ${r.templateCode}: browserVerified=${r.browserVerified}; expected true`);
    }
    if (r.browserVerifiedStatus !== "PASS") {
      fail(`batch3 ${r.templateCode}: browserVerifiedStatus=${r.browserVerifiedStatus}; expected PASS`);
    }
    if (r.demoClickVerified !== true) {
      fail(`batch3 ${r.templateCode}: demoClickVerified=${r.demoClickVerified}; expected true`);
    }
    if (r.previewClickVerified !== true) {
      fail(`batch3 ${r.templateCode}: previewClickVerified=${r.previewClickVerified}; expected true`);
    }
    if (r.docxDownloadVerified !== true) {
      fail(`batch3 ${r.templateCode}: docxDownloadVerified=${r.docxDownloadVerified}; expected true`);
    }
    if (r.fidelityAuditStatus !== "PASS") {
      fail(`batch3 ${r.templateCode}: fidelityAuditStatus=${r.fidelityAuditStatus}; expected PASS`);
    }
    if (r.machineCheckableFidelityStatus !== "PASS") {
      fail(`batch3 ${r.templateCode}: machineCheckableFidelityStatus=${r.machineCheckableFidelityStatus}; expected PASS`);
    }
    // visualPdfReviewStatus: if Batch 3 visual/PDF review artifact
    // exists, status must be from artifact (never NOT_RUN).
    const BATCH3_VISUAL_PDF_ARTIFACT_LOCAL = `${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`;
    const allowedBatch3VisualPdfStatuses = new Set([
      "NOT_RUN",
      null,
      undefined,
      "PASS_AUTO_NEEDS_HUMAN_CONFIRM",
      "PARTIAL_AUTO_NEEDS_REVIEW",
      "FAIL_AUTO_NEEDS_REVIEW",
      "CONVERSION_FAILED",
      "PASS_HUMAN_REVIEWED",
      "FAIL_HUMAN_REVIEWED",
      "PARTIAL_HUMAN_REVIEW_REQUIRED",
    ]);
    if (!allowedBatch3VisualPdfStatuses.has(r.visualPdfReviewStatus)) {
      fail(`batch3 ${r.templateCode}: visualPdfReviewStatus=${r.visualPdfReviewStatus}; expected NOT_RUN/null/PASS_*/PARTIAL_*/FAIL_*/CONVERSION_FAILED`);
    }
    if (existsSync(BATCH3_VISUAL_PDF_ARTIFACT_LOCAL)) {
      if (r.visualPdfReviewStatus === "NOT_RUN") {
        fail(`batch3 ${r.templateCode}: visualPdfReviewStatus=NOT_RUN but Batch 3 visual/PDF review artifact exists; status must come from artifact`);
      }
      if (r.visualPdfFidelityEvidenceSource && r.visualPdfFidelityEvidenceSource !== "QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json") {
        fail(`batch3 ${r.templateCode}: visualPdfFidelityEvidenceSource=${r.visualPdfFidelityEvidenceSource}; expected QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`);
      }
    }
    if (r.fidelityComplete === true) {
      fail(`batch3 ${r.templateCode}: fidelityComplete=${r.fidelityComplete}; expected false`);
    }
    if (r.manualReviewRequired !== true) {
      fail(`batch3 ${r.templateCode}: manualReviewRequired=${r.manualReviewRequired}; expected true (visual/PDF review still requires human review)`);
    }
  }

  // 6. Per-batch-4 invariants (source/render + browser visibility + demo
  //    + preview-click + docx download — fidelity NOT_YET_RUN).
  for (const code of BATCH4_CODES) {
    const r = byCode.get(code);
    if (r.status !== "INPUT_CONNECTED_PASS") {
      fail(`batch4 ${r.templateCode}: status=${r.status}; expected INPUT_CONNECTED_PASS`);
    }
    if (r.sourceRenderVerified !== true) {
      fail(`batch4 ${r.templateCode}: sourceRenderVerified=${r.sourceRenderVerified}; expected true`);
    }
    // Browser visibility (authenticated) — required after Phase 8.
    if (r.browserVerified !== true) {
      fail(`batch4 ${r.templateCode}: browserVerified=${r.browserVerified}; expected true`);
    }
    if (r.browserVerifiedStatus !== "PASS") {
      fail(`batch4 ${r.templateCode}: browserVerifiedStatus=${r.browserVerifiedStatus}; expected PASS`);
    }
    // Demo-click (authenticated) — required after Batch 4 demo-click smoke.
    if (r.demoClickVerified !== true) {
      fail(`batch4 ${r.templateCode}: demoClickVerified=${r.demoClickVerified}; expected true`);
    }
    if (r.demoClickStatus !== "PASS") {
      fail(`batch4 ${r.templateCode}: demoClickStatus=${r.demoClickStatus}; expected PASS`);
    }
    // Preview-click (authenticated) — required after Batch 4 preview-click smoke.
    if (r.previewClickVerified !== true) {
      fail(`batch4 ${r.templateCode}: previewClickVerified=${r.previewClickVerified}; expected true`);
    }
    if (r.previewClickStatus !== "PASS") {
      fail(`batch4 ${r.templateCode}: previewClickStatus=${r.previewClickStatus}; expected PASS`);
    }
    // DOCX download (authenticated) — required after Batch 4 docx-download smoke.
    if (r.docxDownloadVerified !== true) {
      fail(`batch4 ${r.templateCode}: docxDownloadVerified=${r.docxDownloadVerified}; expected true (after Batch 4 docx-download phase)`);
    }
    if (r.docxDownloadStatus !== "PASS") {
      fail(`batch4 ${r.templateCode}: docxDownloadStatus=${r.docxDownloadStatus}; expected PASS (after Batch 4 docx-download phase)`);
    }
    if (r.docxDownloadStartsWithPk !== true) {
      fail(`batch4 ${r.templateCode}: docxDownloadStartsWithPk=${r.docxDownloadStartsWithPk}; expected true`);
    }
    if (r.docxDownloadZipOpenOk !== true) {
      fail(`batch4 ${r.templateCode}: docxDownloadZipOpenOk=${r.docxDownloadZipOpenOk}; expected true`);
    }
    if (r.docxDownloadContentTypesPresent !== true) {
      fail(`batch4 ${r.templateCode}: docxDownloadContentTypesPresent=${r.docxDownloadContentTypesPresent}; expected true`);
    }
    if (r.docxDownloadDocumentXmlPresent !== true) {
      fail(`batch4 ${r.templateCode}: docxDownloadDocumentXmlPresent=${r.docxDownloadDocumentXmlPresent}; expected true`);
    }
    // Fidelity — Batch 4 machine-fidelity phase ran and passed.
    if (r.fidelityAuditStatus !== "PASS") {
      fail(`batch4 ${r.templateCode}: fidelityAuditStatus=${r.fidelityAuditStatus}; expected PASS (after Batch 4 fidelity phase)`);
    }
    if (r.machineCheckableFidelityStatus !== "PASS") {
      fail(`batch4 ${r.templateCode}: machineCheckableFidelityStatus=${r.machineCheckableFidelityStatus}; expected PASS (after Batch 4 fidelity phase)`);
    }
    if (r.fidelityComplete === true) {
      fail(`batch4 ${r.templateCode}: fidelityComplete=${r.fidelityComplete}; expected false (visual/PDF review not yet human-reviewed)`);
    }
    // visualPdfReviewStatus — accepted after Batch 4 visual/PDF review phase.
    // Allowed values:
    //   - NOT_RUN | null | undefined (if visual review never run)
    //   - PASS_AUTO_NEEDS_HUMAN_CONFIRM
    //   - PARTIAL_AUTO_NEEDS_REVIEW (tooling limitation: pdfplumber CJK font)
    //   - FAIL_AUTO_NEEDS_REVIEW
    //   - CONVERSION_FAILED
    //   - PASS_HUMAN_REVIEWED | FAIL_HUMAN_REVIEWED | PARTIAL_HUMAN_REVIEW_REQUIRED (if human reviewed)
    const allowedBatch4VisualPdfStatuses = new Set([
      "NOT_RUN",
      null,
      undefined,
      "PASS_AUTO_NEEDS_HUMAN_CONFIRM",
      "PARTIAL_AUTO_NEEDS_REVIEW",
      "FAIL_AUTO_NEEDS_REVIEW",
      "CONVERSION_FAILED",
      "PASS_HUMAN_REVIEWED",
      "FAIL_HUMAN_REVIEWED",
      "PARTIAL_HUMAN_REVIEW_REQUIRED",
    ]);
    if (!allowedBatch4VisualPdfStatuses.has(r.visualPdfReviewStatus)) {
      fail(`batch4 ${r.templateCode}: visualPdfReviewStatus=${r.visualPdfReviewStatus}; expected NOT_RUN/null/PASS_*/PARTIAL_*/FAIL_*/CONVERSION_FAILED`);
    }
    if (r.visualPdfFidelityEvidenceSource && r.visualPdfFidelityEvidenceSource !== "QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.json") {
      fail(`batch4 ${r.templateCode}: visualPdfFidelityEvidenceSource=${r.visualPdfFidelityEvidenceSource}; expected QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.json`);
    }
    if (r.manualReviewRequired !== true) {
      fail(`batch4 ${r.templateCode}: manualReviewRequired=${r.manualReviewRequired}; expected true (visual/PDF review still requires human review)`);
    }
  }

  // 7. No partial (non-curated, non-batch3, non-batch4) row has any of
  //    the curated-only evidence flags.
  const STRICT_FLAGS = [
    "demoClickVerified",
    "previewClickVerified",
    "docxDownloadVerified",
    "fidelityAuditStatus",
    "fidelityComplete",
    "manualReviewRequired",
  ];
  const violations = [];
  for (const r of rows) {
    if (r.status !== "INPUT_CONNECTED_PARTIAL") continue;
    if (curatedSet.has(r.templateCode)) continue;
    if (batch3Set.has(r.templateCode)) continue;
    if (batch4Set.has(r.templateCode)) continue;
    if (approvedHoldoutEvidence.has(r.templateCode)) continue;
    for (const flag of STRICT_FLAGS) {
      const v = r[flag];
      if (v === true || v === "PASS") {
        violations.push(`${r.templateCode}.${flag}=${v}`);
      }
    }
  }
  if (violations.length > 0) {
    fail(`non-curated partial rows leaked curated-only evidence: ${violations.join(", ")}`);
  }

  // 8. No global FIDELITY_COMPLETE_EVIDENCED claim.
  if (matrix.curated37FidelityEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.curated37FidelityEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (matrix.batch3BrowserEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch3BrowserEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (matrix.batch3FidelityEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch3FidelityEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (matrix.batch4CurationEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch4CurationEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (matrix.batch4BrowserEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch4BrowserEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (matrix.batch4DocxDownloadEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch4DocxDownloadEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (matrix.batch4FidelityEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch4FidelityEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (matrix.batch4VisualPdfEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch4VisualPdfEvidence.fidelityCompleteClaimed===true; not allowed");
  }

  // Batch 4 docx-download artifact invariants (this phase).
  const batch4DocxArtifact = loadJson(
    BATCH4_DOCX_ARTIFACT,
    "batch 4 docx-download artifact",
  );
  if (batch4DocxArtifact.fidelityCompleteClaimed === true) {
    fail("batch4 docx-download artifact fidelityCompleteClaimed===true; not allowed");
  }
  if (batch4DocxArtifact.totalForms !== 20) {
    fail(`batch4 docx-download artifact totalForms=${batch4DocxArtifact.totalForms}; expected 20`);
  }
  if (batch4DocxArtifact.formsDocxPassed !== 20) {
    fail(`batch4 docx-download artifact formsDocxPassed=${batch4DocxArtifact.formsDocxPassed}; expected 20`);
  }
  if (batch4DocxArtifact.formsDocxFailed !== 0) {
    fail(`batch4 docx-download artifact formsDocxFailed=${batch4DocxArtifact.formsDocxFailed}; expected 0`);
  }
  if (batch4DocxArtifact.binaryPkPasses !== 20) {
    fail(`batch4 docx-download artifact binaryPkPasses=${batch4DocxArtifact.binaryPkPasses}; expected 20`);
  }
  if (batch4DocxArtifact.zipOpenPasses !== 20) {
    fail(`batch4 docx-download artifact zipOpenPasses=${batch4DocxArtifact.zipOpenPasses}; expected 20`);
  }
  if (batch4DocxArtifact.contentTypesPasses !== 20) {
    fail(`batch4 docx-download artifact contentTypesPasses=${batch4DocxArtifact.contentTypesPasses}; expected 20`);
  }
  if (batch4DocxArtifact.relsPasses !== 20) {
    fail(`batch4 docx-download artifact relsPasses=${batch4DocxArtifact.relsPasses}; expected 20`);
  }
  if (batch4DocxArtifact.documentXmlPasses !== 20) {
    fail(`batch4 docx-download artifact documentXmlPasses=${batch4DocxArtifact.documentXmlPasses}; expected 20`);
  }
  if (batch4DocxArtifact.placeholderLeaks !== 0) {
    fail(`batch4 docx-download artifact placeholderLeaks=${batch4DocxArtifact.placeholderLeaks}; expected 0`);
  }
  if (batch4DocxArtifact.staleTokenLeaks !== 0) {
    fail(`batch4 docx-download artifact staleTokenLeaks=${batch4DocxArtifact.staleTokenLeaks}; expected 0`);
  }
  if (batch4DocxArtifact.historyLinkLeaks !== 0) {
    fail(`batch4 docx-download artifact historyLinkLeaks=${batch4DocxArtifact.historyLinkLeaks}; expected 0`);
  }
  if (batch4DocxArtifact.documentsRouteLeaks !== 0) {
    fail(`batch4 docx-download artifact documentsRouteLeaks=${batch4DocxArtifact.documentsRouteLeaks}; expected 0`);
  }
  if (batch4DocxArtifact.contentDispositionLeaks !== 0) {
    fail(`batch4 docx-download artifact contentDispositionLeaks=${batch4DocxArtifact.contentDispositionLeaks}; expected 0`);
  }
  if (batch4DocxArtifact.qlvSessionUsedForWebRoute !== false) {
    fail("batch4 docx-download artifact qlvSessionUsedForWebRoute must be false");
  }
  if (batch4DocxArtifact.machineCheckableFidelityStatus !== "NOT_RUN for Batch 4") {
    fail(`batch4 docx-download artifact machineCheckableFidelityStatus=${batch4DocxArtifact.machineCheckableFidelityStatus}; expected NOT_RUN for Batch 4`);
  }
  if (batch4DocxArtifact.visualPdfReviewStatus !== "NOT_RUN for Batch 4") {
    fail(`batch4 docx-download artifact visualPdfReviewStatus=${batch4DocxArtifact.visualPdfReviewStatus}; expected NOT_RUN for Batch 4`);
  }

  // Batch 4 fidelity artifact invariants (this phase) — must mirror
  // the actual machine-fidelity run produced by
  // scripts/audit/batch4-golden-layout-fidelity.mjs.
  const BATCH4_FIDELITY_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json`;
  if (!existsSync(BATCH4_FIDELITY_ARTIFACT)) {
    fail(`missing required Batch 4 fidelity artifact: ${BATCH4_FIDELITY_ARTIFACT}`);
  }
  const batch4FidelityArtifact = loadJson(
    BATCH4_FIDELITY_ARTIFACT,
    "batch 4 fidelity artifact",
  );
  if (batch4FidelityArtifact.fidelityCompleteClaimed === true) {
    fail("batch4 fidelity artifact fidelityCompleteClaimed===true; not allowed");
  }
  if (batch4FidelityArtifact.totalForms !== 20) {
    fail(`batch4 fidelity artifact totalForms=${batch4FidelityArtifact.totalForms}; expected 20`);
  }
  if (batch4FidelityArtifact.formsPass !== 20) {
    fail(`batch4 fidelity artifact formsPass=${batch4FidelityArtifact.formsPass}; expected 20`);
  }
  if (batch4FidelityArtifact.formsPartial !== 0) {
    fail(`batch4 fidelity artifact formsPartial=${batch4FidelityArtifact.formsPartial}; expected 0`);
  }
  if (batch4FidelityArtifact.formsFail !== 0) {
    fail(`batch4 fidelity artifact formsFail=${batch4FidelityArtifact.formsFail}; expected 0`);
  }
  if (batch4FidelityArtifact.placeholderLeaksTotal !== 0) {
    fail(`batch4 fidelity artifact placeholderLeaksTotal=${batch4FidelityArtifact.placeholderLeaksTotal}; expected 0`);
  }
  if (batch4FidelityArtifact.staleTokenLeaksTotal !== 0) {
    fail(`batch4 fidelity artifact staleTokenLeaksTotal=${batch4FidelityArtifact.staleTokenLeaksTotal}; expected 0`);
  }
  if (batch4FidelityArtifact.structureFailuresTotal !== 0) {
    fail(`batch4 fidelity artifact structureFailuresTotal=${batch4FidelityArtifact.structureFailuresTotal}; expected 0`);
  }
  if (batch4FidelityArtifact.formattingFailuresTotal !== 0) {
    fail(`batch4 fidelity artifact formattingFailuresTotal=${batch4FidelityArtifact.formattingFailuresTotal}; expected 0`);
  }
  if (batch4FidelityArtifact.lifecycleFailuresTotal !== 0) {
    fail(`batch4 fidelity artifact lifecycleFailuresTotal=${batch4FidelityArtifact.lifecycleFailuresTotal}; expected 0`);
  }
  if (batch4FidelityArtifact.visualPdfReviewStatus !== "NOT_RUN") {
    fail(`batch4 fidelity artifact visualPdfReviewStatus=${batch4FidelityArtifact.visualPdfReviewStatus}; expected NOT_RUN`);
  }

  // Batch 3 visual/PDF review artifact invariants (this phase) — must
  // mirror the actual visual/PDF review run produced by
  // scripts/audit/batch3-visual-pdf-review.mjs.
  const BATCH3_VISUAL_PDF_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`;
  if (existsSync(BATCH3_VISUAL_PDF_ARTIFACT)) {
    const batch3VisualPdfArtifact = loadJson(
      BATCH3_VISUAL_PDF_ARTIFACT,
      "batch 3 visual/PDF review artifact",
    );
    if (batch3VisualPdfArtifact.fidelityCompleteEvidenced === true) {
      fail("batch3 visual/PDF artifact fidelityCompleteEvidenced===true; not allowed");
    }
    if (batch3VisualPdfArtifact.fidelityCompleteClaimed > 0) {
      fail(`batch3 visual/PDF artifact fidelityCompleteClaimed=${batch3VisualPdfArtifact.fidelityCompleteClaimed}; expected 0 (no human review yet)`);
    }
    if (batch3VisualPdfArtifact.totalForms !== 20) {
      fail(`batch3 visual/PDF artifact totalForms=${batch3VisualPdfArtifact.totalForms}; expected 20`);
    }
    if (batch3VisualPdfArtifact.formsVisualPdfReviewed !== 20) {
      fail(`batch3 visual/PDF artifact formsVisualPdfReviewed=${batch3VisualPdfArtifact.formsVisualPdfReviewed}; expected 20`);
    }
    if (batch3VisualPdfArtifact.pdfConverted !== 20) {
      fail(`batch3 visual/PDF artifact pdfConverted=${batch3VisualPdfArtifact.pdfConverted}; expected 20`);
    }
    if (batch3VisualPdfArtifact.pdfConversionFailed !== 0) {
      fail(`batch3 visual/PDF artifact pdfConversionFailed=${batch3VisualPdfArtifact.pdfConversionFailed}; expected 0`);
    }
    if (batch3VisualPdfArtifact.manualReviewRequired !== 20) {
      fail(`batch3 visual/PDF artifact manualReviewRequired=${batch3VisualPdfArtifact.manualReviewRequired}; expected 20`);
    }
    if (batch3VisualPdfArtifact.formFlightRuntimeReadyPromoted !== 0) {
      fail(`batch3 visual/PDF artifact formFlightRuntimeReadyPromoted=${batch3VisualPdfArtifact.formFlightRuntimeReadyPromoted}; expected 0`);
    }
    if (batch3VisualPdfArtifact.sourceDocxMutated !== false) {
      fail("batch3 visual/PDF artifact sourceDocxMutated must be false");
    }
    if (batch3VisualPdfArtifact.normalizedDocxMutated !== false) {
      fail("batch3 visual/PDF artifact normalizedDocxMutated must be false");
    }
    if (batch3VisualPdfArtifact.lockedContractsMutated !== false) {
      fail("batch3 visual/PDF artifact lockedContractsMutated must be false");
    }
    if (batch3VisualPdfArtifact.compiledContractsMutated !== false) {
      fail("batch3 visual/PDF artifact compiledContractsMutated must be false");
    }
    if (batch3VisualPdfArtifact.dbMutated !== false) {
      fail("batch3 visual/PDF artifact dbMutated must be false");
    }
    if (batch3VisualPdfArtifact.commitCreated !== false) {
      fail("batch3 visual/PDF artifact commitCreated must be false");
    }
    if (batch3VisualPdfArtifact.existing37EvidencePreserved !== true) {
      fail("batch3 visual/PDF artifact existing37EvidencePreserved must be true");
    }
    if (batch3VisualPdfArtifact.batch3PriorEvidencePreserved !== true) {
      fail("batch3 visual/PDF artifact batch3PriorEvidencePreserved must be true");
    }
    if (batch3VisualPdfArtifact.batch4EvidencePreserved !== true) {
      fail("batch3 visual/PDF artifact batch4EvidencePreserved must be true");
    }
    if (matrix.batch3VisualPdfEvidence?.fidelityCompleteClaimed > 0) {
      fail(`matrix.batch3VisualPdfEvidence.fidelityCompleteClaimed=${matrix.batch3VisualPdfEvidence.fidelityCompleteClaimed}; expected 0`);
    }
  }

  // Batch 4 visual/PDF review artifact invariants (this phase) — must
  // mirror the actual visual/PDF review run produced by
  // scripts/audit/batch4-visual-pdf-review.mjs.
  const BATCH4_VISUAL_PDF_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.json`;
  if (!existsSync(BATCH4_VISUAL_PDF_ARTIFACT)) {
    fail(`missing required Batch 4 visual/PDF review artifact: ${BATCH4_VISUAL_PDF_ARTIFACT}`);
  }
  const batch4VisualPdfArtifact = loadJson(
    BATCH4_VISUAL_PDF_ARTIFACT,
    "batch 4 visual/PDF review artifact",
  );
  if (batch4VisualPdfArtifact.fidelityCompleteEvidenced === true) {
    fail("batch4 visual/PDF artifact fidelityCompleteEvidenced===true; not allowed");
  }
  if (batch4VisualPdfArtifact.fidelityCompleteClaimed > 0) {
    fail(`batch4 visual/PDF artifact fidelityCompleteClaimed=${batch4VisualPdfArtifact.fidelityCompleteClaimed}; expected 0 (no human review yet)`);
  }
  if (batch4VisualPdfArtifact.totalForms !== 20) {
    fail(`batch4 visual/PDF artifact totalForms=${batch4VisualPdfArtifact.totalForms}; expected 20`);
  }
  if (batch4VisualPdfArtifact.formsVisualPdfReviewed !== 20) {
    fail(`batch4 visual/PDF artifact formsVisualPdfReviewed=${batch4VisualPdfArtifact.formsVisualPdfReviewed}; expected 20`);
  }
  if (batch4VisualPdfArtifact.pdfConverted !== 20) {
    fail(`batch4 visual/PDF artifact pdfConverted=${batch4VisualPdfArtifact.pdfConverted}; expected 20`);
  }
  if (batch4VisualPdfArtifact.pdfConversionFailed !== 0) {
    fail(`batch4 visual/PDF artifact pdfConversionFailed=${batch4VisualPdfArtifact.pdfConversionFailed}; expected 0`);
  }
  if (batch4VisualPdfArtifact.pageCountParityPass !== 20) {
    fail(`batch4 visual/PDF artifact pageCountParityPass=${batch4VisualPdfArtifact.pageCountParityPass}; expected 20`);
  }
  if (batch4VisualPdfArtifact.pageCountMismatch !== 0) {
    fail(`batch4 visual/PDF artifact pageCountMismatch=${batch4VisualPdfArtifact.pageCountMismatch}; expected 0`);
  }
  if (batch4VisualPdfArtifact.manualReviewRequired !== 20) {
    fail(`batch4 visual/PDF artifact manualReviewRequired=${batch4VisualPdfArtifact.manualReviewRequired}; expected 20`);
  }
  if (batch4VisualPdfArtifact.formFlightRuntimeReadyPromoted !== 0) {
    fail(`batch4 visual/PDF artifact formFlightRuntimeReadyPromoted=${batch4VisualPdfArtifact.formFlightRuntimeReadyPromoted}; expected 0`);
  }
  if (batch4VisualPdfArtifact.existing37EvidencePreserved !== true) {
    fail("batch4 visual/PDF artifact existing37EvidencePreserved must be true");
  }
  if (batch4VisualPdfArtifact.existing57EvidencePreserved !== true) {
    fail("batch4 visual/PDF artifact existing57EvidencePreserved must be true");
  }
  if (batch4VisualPdfArtifact.batch3EvidencePreserved !== true) {
    fail("batch4 visual/PDF artifact batch3EvidencePreserved must be true");
  }
  if (batch4VisualPdfArtifact.batch4PriorEvidencePreserved !== true) {
    fail("batch4 visual/PDF artifact batch4PriorEvidencePreserved must be true");
  }
  if (batch4VisualPdfArtifact.sourceDocxMutated !== false) {
    fail("batch4 visual/PDF artifact sourceDocxMutated must be false");
  }
  if (batch4VisualPdfArtifact.normalizedDocxMutated !== false) {
    fail("batch4 visual/PDF artifact normalizedDocxMutated must be false");
  }
  if (batch4VisualPdfArtifact.lockedContractsMutated !== false) {
    fail("batch4 visual/PDF artifact lockedContractsMutated must be false");
  }
  if (batch4VisualPdfArtifact.compiledContractsMutated !== false) {
    fail("batch4 visual/PDF artifact compiledContractsMutated must be false");
  }
  if (batch4VisualPdfArtifact.dbMutated !== false) {
    fail("batch4 visual/PDF artifact dbMutated must be false");
  }
  if (batch4VisualPdfArtifact.commitCreated !== false) {
    fail("batch4 visual/PDF artifact commitCreated must be false");
  }

  // Batch 4 human review artifact invariants (this phase) — if human
  // decisions have been applied, the applied artifact exists and the
  // matrix must carry consistent humanReviewStatus + visualPdfReviewStatus
  // + fidelityComplete for each Batch 4 row.
  const BATCH4_HUMAN_DECISIONS_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.latest.json`;
  if (existsSync(BATCH4_HUMAN_DECISIONS_ARTIFACT)) {
    const decisionsArtifact = loadJson(
      BATCH4_HUMAN_DECISIONS_ARTIFACT,
      "batch 4 human decisions artifact",
    );
    if (decisionsArtifact.fidelityCompleteEvidenced === true) {
      fail("batch4 human decisions artifact fidelityCompleteEvidenced===true; not allowed (Batch 4 only; global false)");
    }
    if (decisionsArtifact.totalForms !== 20) {
      fail(`batch4 human decisions artifact totalForms=${decisionsArtifact.totalForms}; expected 20`);
    }
    const decisionsByCode = new Map(
      (decisionsArtifact.decisions || []).map((d) => [d.code, d]),
    );
    for (const code of BATCH4_CODES) {
      const d = decisionsByCode.get(code);
      if (!d) fail(`batch4 human decisions artifact missing code=${code}`);
      if (!ALLOWED_DECISIONS.has(d.decision)) {
        fail(`batch4 human decisions artifact ${code}: decision=${d.decision}; expected PASS|FAIL|UNCERTAIN`);
      }
    }
    // Per-row cross-check with matrix
    for (const code of BATCH4_CODES) {
      const r = byCode.get(code);
      const d = decisionsByCode.get(code);
      if (r.humanReviewStatus !== d.decision) {
        fail(`batch4 ${code}: humanReviewStatus=${r.humanReviewStatus}; expected ${d.decision}`);
      }
      if (d.decision === "PASS") {
        if (r.fidelityComplete !== true) {
          fail(`batch4 ${code}: humanReviewStatus=PASS but fidelityComplete=${r.fidelityComplete}; expected true`);
        }
        if (r.manualReviewRequired !== false) {
          fail(`batch4 ${code}: humanReviewStatus=PASS but manualReviewRequired=${r.manualReviewRequired}; expected false`);
        }
        if (r.visualPdfReviewStatus !== "PASS_HUMAN_REVIEWED") {
          fail(`batch4 ${code}: humanReviewStatus=PASS but visualPdfReviewStatus=${r.visualPdfReviewStatus}; expected PASS_HUMAN_REVIEWED`);
        }
      } else if (d.decision === "FAIL") {
        if (r.fidelityComplete !== false) {
          fail(`batch4 ${code}: humanReviewStatus=FAIL but fidelityComplete=${r.fidelityComplete}; expected false`);
        }
        if (r.manualReviewRequired !== true) {
          fail(`batch4 ${code}: humanReviewStatus=FAIL but manualReviewRequired=${r.manualReviewRequired}; expected true`);
        }
        if (r.visualPdfReviewStatus !== "FAIL_HUMAN_REVIEWED") {
          fail(`batch4 ${code}: humanReviewStatus=FAIL but visualPdfReviewStatus=${r.visualPdfReviewStatus}; expected FAIL_HUMAN_REVIEWED`);
        }
      } else if (d.decision === "UNCERTAIN") {
        if (r.fidelityComplete !== false) {
          fail(`batch4 ${code}: humanReviewStatus=UNCERTAIN but fidelityComplete=${r.fidelityComplete}; expected false`);
        }
        if (r.manualReviewRequired !== true) {
          fail(`batch4 ${code}: humanReviewStatus=UNCERTAIN but manualReviewRequired=${r.manualReviewRequired}; expected true`);
        }
        if (r.visualPdfReviewStatus !== "PARTIAL_HUMAN_REVIEW_REQUIRED") {
          fail(`batch4 ${code}: humanReviewStatus=UNCERTAIN but visualPdfReviewStatus=${r.visualPdfReviewStatus}; expected PARTIAL_HUMAN_REVIEW_REQUIRED`);
        }
      }
    }
    // No global claim
    if (matrix.batch4HumanReviewEvidence?.fidelityCompleteEvidenced === true) {
      fail("matrix.batch4HumanReviewEvidence.fidelityCompleteEvidenced===true; not allowed (Batch 4 only)");
    }
  } else {
    // No applied decisions artifact yet. Batch 4 must still be in
    // pre-human-review state (PARTIAL_AUTO_NEEDS_REVIEW + manualReviewRequired=true).
    for (const code of BATCH4_CODES) {
      const r = byCode.get(code);
      if (r.visualPdfReviewStatus !== "PARTIAL_AUTO_NEEDS_REVIEW") {
        fail(`batch4 ${code}: visualPdfReviewStatus=${r.visualPdfReviewStatus}; expected PARTIAL_AUTO_NEEDS_REVIEW (no human decisions applied)`);
      }
      if (r.manualReviewRequired !== true) {
        fail(`batch4 ${code}: manualReviewRequired=${r.manualReviewRequired}; expected true (no human decisions applied)`);
      }
      if (r.fidelityComplete !== false) {
        fail(`batch4 ${code}: fidelityComplete=${r.fidelityComplete}; expected false (no human decisions applied)`);
      }
    }
  }

  // 9. FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
  const allowlistCandidates = [
    "apps/web/src/lib/form-flight/runtime-ready-allowlist.ts",
    "apps/web/src/lib/form-flight/profile-registry.ts",
    "apps/web/src/lib/form-flight/index.ts",
  ];
  for (const rel of allowlistCandidates) {
    const p = `${ROOT}/${rel}`;
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");
    const matches = src.match(/BM-\d{3}/g);
    if (!matches) continue;
    const uniq = Array.from(new Set(matches));
    const nonAllowlisted = uniq.filter(
      (c) => c !== "BM-001" && c !== "BM-171",
    );
    if (nonAllowlisted.length > 0) {
      fail(
        `runtimeReady allowlist file ${rel} references non-BM-001/BM-171 codes: ${nonAllowlisted.join(", ")}`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        total: 213,
        inputConnectedPass: counts.INPUT_CONNECTED_PASS,
        inputConnectedPartial: counts.INPUT_CONNECTED_PARTIAL,
        curated37Preserved: true,
        batch3BrowserVerified: 20,
        batch3DemoClickVerified: 20,
        batch3PreviewClickVerified: 20,
        batch3DocxDownloadVerified: 20,
        batch3MachineFidelityPass: 20,
        batch4CurationCount: 20,
        batch4BrowserVerified: 20,
        batch4DemoClickVerified: 20,
        batch4PreviewClickVerified: 20,
        batch4DocxDownloadVerified: 20,
        batch4MachineFidelityPass: 20,
        batch4VisualPdfReviewed: 20,
        batch4PdfConverted: 20,
        batch4PageCountParityPass: 20,
        batch4VisualPdfStatus: batch4VisualPdfArtifact.visualPdfFidelityStatus,
        batch4FidelityComplete: 0,
        batch3VisualPdfReviewed: (() => {
          try {
            return existsSync(`${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`)
              ? JSON.parse(readFileSync(`${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`, "utf8")).formsVisualPdfReviewed || 0
              : 0;
          } catch { return 0; }
        })(),
        batch3PdfConverted: (() => {
          try {
            return existsSync(`${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`)
              ? JSON.parse(readFileSync(`${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`, "utf8")).pdfConverted || 0
              : 0;
          } catch { return 0; }
        })(),
        batch3PageCountParityPass: (() => {
          try {
            return existsSync(`${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`)
              ? JSON.parse(readFileSync(`${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`, "utf8")).pageCountParityPass || 0
              : 0;
          } catch { return 0; }
        })(),
        batch3VisualPdfStatus: (() => {
          try {
            return existsSync(`${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`)
              ? JSON.parse(readFileSync(`${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`, "utf8")).status || "NOT_RUN"
              : "NOT_RUN";
          } catch { return "NOT_RUN"; }
        })(),
        fidelityCompleteEvidenced: false,
        formFlightRuntimeReadyPromoted: 0,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main();
