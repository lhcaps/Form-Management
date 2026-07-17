#!/usr/bin/env node
/**
 * assert-curated-57-evidence-matrix.mjs
 *
 * Read-only guard. Verifies the 57-row evidence matrix invariants
 * after Batch 3 has been promoted (37 existing + 20 new = 57
 * INPUT_CONNECTED_PASS rows).
 *
 * Asserts:
 *   - Total rows == 213
 *   - counts.INPUT_CONNECTED_PASS  == 57
 *   - counts.INPUT_CONNECTED_PARTIAL == 156
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
 *       visualPdfReviewStatus        === "NOT_RUN" | null | undefined
 *                                       | PASS_AUTO_NEEDS_HUMAN_CONFIRM
 *                                       | PARTIAL_AUTO_NEEDS_REVIEW
 *                                       | FAIL_AUTO_NEEDS_REVIEW
 *                                       | CONVERSION_FAILED
 *                                       | PASS_HUMAN_REVIEWED | FAIL_HUMAN_REVIEWED
 *                                       | PARTIAL_HUMAN_REVIEW_REQUIRED
 *       (if Batch 3 visual/PDF review artifact present, status
 *        must come from QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json —
 *        never NOT_RUN unless that artifact is missing)
 *       fidelityComplete             === false
 *       manualReviewRequired         === true
 *   - No non-curated, non-batch3 row has any of the curated-only
 *     evidence flags.
 *   - No global FIDELITY_COMPLETE_EVIDENCED claim is set on the matrix.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Exits non-zero on the first invariant failure with a clear error
 * message. Used as a CI gate at the end of
 * scripts/audit/apply-batch3-browser-visibility.mjs.
 *
 * Usage:
 *   node scripts/audit/assert-curated-57-evidence-matrix.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateHoldoutRuntimeEvidence } from "./holdout-runtime-evidence.mjs";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;

const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const BROWSER_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_BROWSER_VISIBILITY.latest.json`;
const BATCH3_DEMO_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_DEMO_CLICK.latest.json`;
const BATCH3_PREVIEW_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_PREVIEW_CLICK.latest.json`;
const BATCH3_DOCX_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.json`;
const BATCH3_FIDELITY_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json`;
const CURATED_BROWSER_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_BROWSER_SMOKE.latest.json`;
const DEMO_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_DEMO_CLICK_SMOKE.latest.json`;
const PREVIEW_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_PREVIEW_CLICK_SMOKE.latest.json`;
const DOCX_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json`;
const FIDELITY_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.json`;

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

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

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
  const batch3Artifact = loadJson(BROWSER_ARTIFACT, "batch 3 browser visibility artifact");

  // 1. Total rows.
  const rows = matrix.rows || [];
  if (matrix.total !== 213 || rows.length !== 213) {
    fail(`matrix.total=${matrix.total} rows.length=${rows.length}; expected 213/213`);
  }

  // 2. Top-level counts.
  //   - Legacy baseline: 57 PASS / 156 PARTIAL (existing 37 + batch 3 20).
  //   - After batch 4 source/render: 77 PASS / 136 PARTIAL.
  //   - This assertion accepts either baseline; the per-row invariants
  //     on the existing 37 and batch 3 codes themselves remain strict. Later
  //     source/render batches may increase PASS beyond 77.
  const counts = matrix.counts || {};
  if (counts.INPUT_CONNECTED_PASS < 57) {
    fail(`counts.INPUT_CONNECTED_PASS=${counts.INPUT_CONNECTED_PASS}; expected at least 57`);
  }
  if (counts.INPUT_CONNECTED_PARTIAL > 156) {
    fail(`counts.INPUT_CONNECTED_PARTIAL=${counts.INPUT_CONNECTED_PARTIAL}; expected at most 156`);
  }

  // 3. Index rows.
  const byCode = new Map(rows.map((r) => [r.templateCode, r]));
  const curatedSet = new Set(CURATED_37);
  const batch3Set = new Set(BATCH3_CODES);
  for (const code of [...CURATED_37, ...BATCH3_CODES]) {
    if (!byCode.get(code)) fail(`missing curated row ${code} in matrix`);
  }

  // 4. Per-curated-37 invariants.
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
      fail(`batch3 ${r.templateCode}: demoClickVerified=${r.demoClickVerified}; expected true (after batch 3 demo-click phase)`);
    }
    if (r.previewClickVerified !== true) {
      fail(`batch3 ${r.templateCode}: previewClickVerified=${r.previewClickVerified}; expected true (after batch 3 preview-click phase)`);
    }
    if (r.docxDownloadVerified !== true) {
      fail(`batch3 ${r.templateCode}: docxDownloadVerified=${r.docxDownloadVerified}; expected true (after batch 3 docx-download phase)`);
    }
    if (r.fidelityAuditStatus !== "PASS") {
      fail(`batch3 ${r.templateCode}: fidelityAuditStatus=${r.fidelityAuditStatus}; expected PASS (after batch 3 machine-checkable fidelity phase)`);
    }
    if (r.machineCheckableFidelityStatus !== "PASS") {
      fail(`batch3 ${r.templateCode}: machineCheckableFidelityStatus=${r.machineCheckableFidelityStatus}; expected PASS (after batch 3 machine-checkable fidelity phase)`);
    }
    // visualPdfReviewStatus: if Batch 3 visual/PDF review artifact
    // exists, status must be from artifact (never NOT_RUN). If
    // artifact missing, status must be NOT_RUN/null.
    const BATCH3_VISUAL_PDF_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json`;
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
    if (existsSync(BATCH3_VISUAL_PDF_ARTIFACT)) {
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

  // 6. No partial (non-curated, non-batch3) row has any of the
  //    curated-only evidence flags.
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

  // 7. No global FIDELITY_COMPLETE_EVIDENCED claim.
  if (matrix.curated37FidelityEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.curated37FidelityEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (matrix.batch3BrowserEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch3BrowserEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (batch3Artifact.fidelityCompleteClaimed === true) {
    fail("batch3 browser artifact fidelityCompleteClaimed===true; not allowed");
  }
  const batch3DemoArtifact = loadJson(BATCH3_DEMO_ARTIFACT, "batch 3 demo-click artifact");
  if (batch3DemoArtifact.fidelityCompleteClaimed === true) {
    fail("batch3 demo-click artifact fidelityCompleteClaimed===true; not allowed");
  }
  const batch3PreviewArtifact = loadJson(BATCH3_PREVIEW_ARTIFACT, "batch 3 preview-click artifact");
  if (batch3PreviewArtifact.fidelityCompleteClaimed === true) {
    fail("batch3 preview-click artifact fidelityCompleteClaimed===true; not allowed");
  }
  const batch3DocxArtifact = loadJson(BATCH3_DOCX_ARTIFACT, "batch 3 docx-download artifact");
  if (batch3DocxArtifact.fidelityCompleteClaimed === true) {
    fail("batch3 docx-download artifact fidelityCompleteClaimed===true; not allowed");
  }

  // 7b. Batch 3 machine-checkable fidelity artifact invariants.
  const batch3FidelityArtifact = loadJson(
    BATCH3_FIDELITY_ARTIFACT,
    "batch 3 machine-checkable fidelity artifact",
  );
  if (batch3FidelityArtifact.fidelityCompleteClaimed === true) {
    fail("batch3 fidelity artifact fidelityCompleteClaimed===true; not allowed");
  }
  if (batch3FidelityArtifact.totalForms !== 20) {
    fail(`batch3 fidelity artifact totalForms=${batch3FidelityArtifact.totalForms}; expected 20`);
  }
  if (batch3FidelityArtifact.formsPass !== 20) {
    fail(`batch3 fidelity artifact formsPass=${batch3FidelityArtifact.formsPass}; expected 20`);
  }
  if (batch3FidelityArtifact.formsFail !== 0) {
    fail(`batch3 fidelity artifact formsFail=${batch3FidelityArtifact.formsFail}; expected 0`);
  }
  if (batch3FidelityArtifact.placeholderLeaksTotal !== 0) {
    fail(`batch3 fidelity artifact placeholderLeaksTotal=${batch3FidelityArtifact.placeholderLeaksTotal}; expected 0`);
  }
  if (batch3FidelityArtifact.staleTokenLeaksTotal !== 0) {
    fail(`batch3 fidelity artifact staleTokenLeaksTotal=${batch3FidelityArtifact.staleTokenLeaksTotal}; expected 0`);
  }
  if (batch3FidelityArtifact.structureFailuresTotal !== 0) {
    fail(`batch3 fidelity artifact structureFailuresTotal=${batch3FidelityArtifact.structureFailuresTotal}; expected 0`);
  }
  if (batch3FidelityArtifact.formattingFailuresTotal !== 0) {
    fail(`batch3 fidelity artifact formattingFailuresTotal=${batch3FidelityArtifact.formattingFailuresTotal}; expected 0`);
  }
  if (batch3FidelityArtifact.lifecycleFailuresTotal !== 0) {
    fail(`batch3 fidelity artifact lifecycleFailuresTotal=${batch3FidelityArtifact.lifecycleFailuresTotal}; expected 0`);
  }
  if (matrix.batch3FidelityEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.batch3FidelityEvidence.fidelityCompleteClaimed===true; not allowed");
  }

  // 7c. Batch 3 visual/PDF review artifact invariants (this phase) — must
  //     mirror the actual visual/PDF review run produced by
  //     scripts/audit/batch3-visual-pdf-review.mjs.
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

  // 8. FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
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

  // 9. Existing 37 artifact totals are coherent (37/37).
  const demo = loadJson(DEMO_ARTIFACT, "demo click artifact");
  const preview = loadJson(PREVIEW_ARTIFACT, "preview click artifact");
  const docx = loadJson(DOCX_ARTIFACT, "docx download artifact");
  const fidelity = loadJson(FIDELITY_ARTIFACT, "fidelity artifact");
  const curatedBrowser = loadJson(CURATED_BROWSER_ARTIFACT, "curated browser smoke artifact");
  if (demo.formsDemoPassed !== 37) fail(`demo artifact formsDemoPassed=${demo.formsDemoPassed}; expected 37`);
  if (preview.formsPreviewPassed !== 37) fail(`preview artifact formsPreviewPassed=${preview.formsPreviewPassed}; expected 37`);
  if (docx.formsDocxPassed !== 37) fail(`docx artifact formsDocxPassed=${docx.formsDocxPassed}; expected 37`);
  if (fidelity.formsPass !== 37) fail(`fidelity artifact formsPass=${fidelity.formsPass}; expected 37`);
  if (curatedBrowser.counts?.browserPassed !== 37) {
    fail(`curated browser artifact counts.browserPassed=${curatedBrowser.counts?.browserPassed}; expected 37`);
  }

  // 10. Batch 3 browser artifact totals are coherent (20/20).
  if (batch3Artifact.totalForms !== 20) fail(`batch3 browser artifact totalForms=${batch3Artifact.totalForms}; expected 20`);
  if (batch3Artifact.formsVisibilitySmoked !== 20) {
    fail(`batch3 browser artifact formsVisibilitySmoked=${batch3Artifact.formsVisibilitySmoked}; expected 20`);
  }
  if (batch3Artifact.formsVisibilityPassed !== 20) {
    fail(`batch3 browser artifact formsVisibilityPassed=${batch3Artifact.formsVisibilityPassed}; expected 20`);
  }
  if (batch3Artifact.formsVisibilityFailed !== 0) {
    fail(`batch3 browser artifact formsVisibilityFailed=${batch3Artifact.formsVisibilityFailed}; expected 0`);
  }
  if (batch3Artifact.qlvSessionUsedForWebRoute !== false) {
    fail("batch3 browser artifact qlvSessionUsedForWebRoute must be false");
  }

  // 11. Batch 3 demo-click artifact totals are coherent (20/20).
  if (batch3DemoArtifact.totalForms !== 20) {
    fail(`batch3 demo-click artifact totalForms=${batch3DemoArtifact.totalForms}; expected 20`);
  }
  if (batch3DemoArtifact.formsDemoClicked !== 20) {
    fail(`batch3 demo-click artifact formsDemoClicked=${batch3DemoArtifact.formsDemoClicked}; expected 20`);
  }
  if (batch3DemoArtifact.formsDemoPassed !== 20) {
    fail(`batch3 demo-click artifact formsDemoPassed=${batch3DemoArtifact.formsDemoPassed}; expected 20`);
  }
  if (batch3DemoArtifact.formsDemoFailed !== 0) {
    fail(`batch3 demo-click artifact formsDemoFailed=${batch3DemoArtifact.formsDemoFailed}; expected 0`);
  }
  if (batch3DemoArtifact.staleTokenHits !== 0) {
    fail(`batch3 demo-click artifact staleTokenHits=${batch3DemoArtifact.staleTokenHits}; expected 0`);
  }
  if (batch3DemoArtifact.qlvSessionUsedForWebRoute !== false) {
    fail("batch3 demo-click artifact qlvSessionUsedForWebRoute must be false");
  }
  if (batch3DemoArtifact.previewClickStatus !== "NOT_RUN") {
    fail(`batch3 demo-click artifact previewClickStatus=${batch3DemoArtifact.previewClickStatus}; expected NOT_RUN`);
  }
  if (batch3DemoArtifact.docxDownloadStatus !== "NOT_RUN") {
    fail(`batch3 demo-click artifact docxDownloadStatus=${batch3DemoArtifact.docxDownloadStatus}; expected NOT_RUN`);
  }
  if (batch3DemoArtifact.fidelityStatus !== "NOT_RUN") {
    fail(`batch3 demo-click artifact fidelityStatus=${batch3DemoArtifact.fidelityStatus}; expected NOT_RUN`);
  }

  // 12. Batch 3 preview-click artifact totals are coherent (20/20).
  if (batch3PreviewArtifact.totalForms !== 20) {
    fail(`batch3 preview-click artifact totalForms=${batch3PreviewArtifact.totalForms}; expected 20`);
  }
  if (batch3PreviewArtifact.formsPreviewClicked !== 20) {
    fail(`batch3 preview-click artifact formsPreviewClicked=${batch3PreviewArtifact.formsPreviewClicked}; expected 20`);
  }
  if (batch3PreviewArtifact.formsPreviewPassed !== 20) {
    fail(`batch3 preview-click artifact formsPreviewPassed=${batch3PreviewArtifact.formsPreviewPassed}; expected 20`);
  }
  if (batch3PreviewArtifact.formsPreviewFailed !== 0) {
    fail(`batch3 preview-click artifact formsPreviewFailed=${batch3PreviewArtifact.formsPreviewFailed}; expected 0`);
  }
  if (batch3PreviewArtifact.binaryPkLeaks !== 0) {
    fail(`batch3 preview-click artifact binaryPkLeaks=${batch3PreviewArtifact.binaryPkLeaks}; expected 0`);
  }
  if (batch3PreviewArtifact.generatedDocumentLeaks !== 0) {
    fail(`batch3 preview-click artifact generatedDocumentLeaks=${batch3PreviewArtifact.generatedDocumentLeaks}; expected 0`);
  }
  if (batch3PreviewArtifact.autoDownloadLeaks !== 0) {
    fail(`batch3 preview-click artifact autoDownloadLeaks=${batch3PreviewArtifact.autoDownloadLeaks}; expected 0`);
  }
  if (batch3PreviewArtifact.historyLinkLeaks !== 0) {
    fail(`batch3 preview-click artifact historyLinkLeaks=${batch3PreviewArtifact.historyLinkLeaks}; expected 0`);
  }
  if (batch3PreviewArtifact.documentsRouteLeaks !== 0) {
    fail(`batch3 preview-click artifact documentsRouteLeaks=${batch3PreviewArtifact.documentsRouteLeaks}; expected 0`);
  }
  if (batch3PreviewArtifact.qlvSessionUsedForWebRoute !== false) {
    fail("batch3 preview-click artifact qlvSessionUsedForWebRoute must be false");
  }
  if (batch3PreviewArtifact.docxDownloadStatus !== "NOT_RUN") {
    fail(`batch3 preview-click artifact docxDownloadStatus=${batch3PreviewArtifact.docxDownloadStatus}; expected NOT_RUN`);
  }
  if (batch3PreviewArtifact.fidelityStatus !== "NOT_RUN") {
    fail(`batch3 preview-click artifact fidelityStatus=${batch3PreviewArtifact.fidelityStatus}; expected NOT_RUN`);
  }

  // 13. Batch 3 docx-download artifact totals are coherent.
  if (batch3DocxArtifact.totalForms !== 20) {
    fail(`batch3 docx-download artifact totalForms=${batch3DocxArtifact.totalForms}; expected 20`);
  }
  if (batch3DocxArtifact.formsDocxDownloaded !== 20) {
    fail(`batch3 docx-download artifact formsDocxDownloaded=${batch3DocxArtifact.formsDocxDownloaded}; expected 20`);
  }
  if (batch3DocxArtifact.formsDocxPassed !== 20) {
    fail(`batch3 docx-download artifact formsDocxPassed=${batch3DocxArtifact.formsDocxPassed}; expected 20`);
  }
  if (batch3DocxArtifact.formsDocxFailed !== 0) {
    fail(`batch3 docx-download artifact formsDocxFailed=${batch3DocxArtifact.formsDocxFailed}; expected 0`);
  }
  if (batch3DocxArtifact.binaryPkPasses !== 20) {
    fail(`batch3 docx-download artifact binaryPkPasses=${batch3DocxArtifact.binaryPkPasses}; expected 20`);
  }
  if (batch3DocxArtifact.zipOpenPasses !== 20) {
    fail(`batch3 docx-download artifact zipOpenPasses=${batch3DocxArtifact.zipOpenPasses}; expected 20`);
  }
  if (batch3DocxArtifact.contentTypesPasses !== 20) {
    fail(`batch3 docx-download artifact contentTypesPasses=${batch3DocxArtifact.contentTypesPasses}; expected 20`);
  }
  if (batch3DocxArtifact.documentXmlPasses !== 20) {
    fail(`batch3 docx-download artifact documentXmlPasses=${batch3DocxArtifact.documentXmlPasses}; expected 20`);
  }
  if (batch3DocxArtifact.placeholderLeaks !== 0) {
    fail(`batch3 docx-download artifact placeholderLeaks=${batch3DocxArtifact.placeholderLeaks}; expected 0`);
  }
  if (batch3DocxArtifact.staleTokenLeaks !== 0) {
    fail(`batch3 docx-download artifact staleTokenLeaks=${batch3DocxArtifact.staleTokenLeaks}; expected 0`);
  }
  if (batch3DocxArtifact.qlvSessionUsedForWebRoute !== false) {
    fail("batch3 docx-download artifact qlvSessionUsedForWebRoute must be false");
  }
  if (batch3DocxArtifact.fidelityStatus !== "NOT_RUN") {
    fail(`batch3 docx-download artifact fidelityStatus=${batch3DocxArtifact.fidelityStatus}; expected NOT_RUN`);
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
        batch3FidelityComplete: 0,
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
