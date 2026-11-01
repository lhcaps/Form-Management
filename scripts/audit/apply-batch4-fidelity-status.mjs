#!/usr/bin/env node
/**
 * apply-batch4-fidelity-status.mjs
 *
 * Updates QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add
 * machine-checkable fidelity evidence for the 20 Batch 4 forms
 * (BM-076, BM-078, BM-080..BM-100) sourced from
 * docs/audit/unified-bm-workspace/QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json
 *
 * Per-form fields updated for Batch 4 only:
 *   - fidelityAuditStatus = PASS | PARTIAL | FAIL | NOT_RUN
 *   - fidelityComplete = false (never claim without visual review)
 *   - fidelityReason = short summary
 *   - fidelityCriteriaPassed = array
 *   - fidelityCriteriaFailed = array
 *   - fidelityCompleteEvidenceSource
 *     = "QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json"
 *   - machineCheckableFidelityStatus = PASS | PARTIAL | FAIL | NOT_RUN
 *   - visualPdfReviewStatus remains NOT_RUN for Batch 4
 *   - manualReviewRequired = true after this phase
 *     (fidelity PASS still requires visual/PDF review)
 *
 * Existing 57 evidence (37 curated + 20 batch 3 browser/demo/preview/
 * docx/fidelity) remains untouched.
 *
 * Existing Batch 4 source-render + browser-visibility + demo-click +
 * preview-click + docx-download evidence remains untouched.
 *
 * Counts preserved:
 *   - INPUT_CONNECTED_PASS    = 77
 *   - INPUT_CONNECTED_PARTIAL = 136
 *   - fidelityComplete=true count = 0 (visual review never run)
 *
 * No global FIDELITY_COMPLETE_EVIDENCED claim is set.
 * FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Usage:
 *   node scripts/audit/apply-batch4-fidelity-status.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX_JSON = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const FIDELITY_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json`;

const BATCH4_CODES = [
  "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084",
  "BM-085", "BM-086", "BM-087", "BM-088", "BM-090", "BM-091",
  "BM-092", "BM-093", "BM-094", "BM-095", "BM-096", "BM-097",
  "BM-098", "BM-100",
];

function main() {
  if (!existsSync(MATRIX_JSON) || !existsSync(FIDELITY_ARTIFACT)) {
    console.error(`FATAL: missing ${MATRIX_JSON} or ${FIDELITY_ARTIFACT}`);
    process.exit(2);
  }

  const matrix = JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
  const fidelity = JSON.parse(readFileSync(FIDELITY_ARTIFACT, "utf8"));

  const byCode = new Map((fidelity.results || []).map((r) => [r.templateCode, r]));

  let updated = 0;

  for (const row of matrix.rows || []) {
    if (!BATCH4_CODES.includes(row.templateCode)) continue;
    const r = byCode.get(row.templateCode);
    if (!r) continue;

    const majorStructurePassed =
      (r.formTitlePresent !== false) &&
      (r.agencyTextPresent !== false) &&
      (r.signatureBlockPresent !== false) &&
      (r.recipientsBlockPresent !== false) &&
      (r.placeDateLinePresent !== false) &&
      (r.legalBasisPresent !== false);
    const placeholderClean = !r.placeholderLeaks || r.placeholderLeaks.length === 0;
    const staleTokenClean = !r.staleTokenLeaks || r.staleTokenLeaks.length === 0;
    const formattingPassed =
      (r.marginsStatus === "pass" || r.marginsStatus === "not_checked" || r.marginsStatus === "n/a") &&
      (r.fontStatus === "pass" || r.fontStatus === "not_checked" || r.fontStatus === "n/a");

    row.fidelityAuditStatus = r.fidelityStatus || "NOT_RUN";
    row.machineCheckableFidelityStatus = r.fidelityStatus || "NOT_RUN";
    row.fidelityComplete = false; // never claim without visual review
    row.visualPdfReviewStatus = "NOT_RUN";
    row.manualReviewRequired = r.manualReviewRequired === true;
    row.fidelityReason = (r.failureReasons && r.failureReasons.length > 0)
      ? `Machine-check failed: ${r.failureReasons.join("; ")}`
      : r.manualReviewRequired
        ? "Machine checks passed; visual/manual review required before fidelityComplete claim."
        : "All machine-checkable criteria passed; visual review still recommended.";

    const majorStructureOk = majorStructurePassed ? "pass" : "fail";
    const placeholderOk = placeholderClean ? "pass" : "fail";
    const staleTokenOk = staleTokenClean ? "pass" : "fail";
    const formattingOk = formattingPassed ? "pass" : "fail";
    const tableOk = r.tableParity ?? "n/a";
    const lifecycleOk = r.lifecycleStatus === "pass" ? "pass" : (r.lifecycleStatus || "n/a");
    const failures = (r.failureReasons || []).join("; ");

    row._displayFidelityMajorStructure = majorStructureOk;
    row._displayFidelityPlaceholderClean = placeholderOk;
    row._displayFidelityStaleTokenClean = staleTokenOk;
    row._displayFidelityFormatting = formattingOk;
    row._displayFidelityTableParity = tableOk;
    row._displayFidelityLifecycle = lifecycleOk;
    row._displayFidelityFailures = failures;

    row.fidelityCriteriaPassed = r.criteriaPassed || [];
    row.fidelityCriteriaFailed = r.criteriaFailed || [];
    row.fidelityCompleteEvidenceSource = "QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json";

    updated++;
  }

  // Top-level batch4 fidelity evidence block.
  matrix.batch4FidelityEvidence = {
    snapshotDate: fidelity.snapshotDate,
    status: fidelity.status,
    statusNote: fidelity.statusNote,
    fidelityCompleteClaimed: fidelity.fidelityCompleteClaimed,
    visualPdfReviewStatus: fidelity.visualPdfReviewStatus,
    totalForms: fidelity.totalForms,
    formsPass: fidelity.formsPass,
    formsPartial: fidelity.formsPartial,
    formsFail: fidelity.formsFail,
    placeholderLeaksTotal: fidelity.placeholderLeaksTotal,
    staleTokenLeaksTotal: fidelity.staleTokenLeaksTotal,
    structureFailuresTotal: fidelity.structureFailuresTotal,
    formattingFailuresTotal: fidelity.formattingFailuresTotal,
    lifecycleFailuresTotal: fidelity.lifecycleFailuresTotal,
    manualReviewRequired: fidelity.manualReviewRequired,
    sourceRenderStatus: fidelity.sourceRenderStatus,
    browserVisibilityStatus: fidelity.browserVisibilityStatus,
    demoClickStatus: fidelity.demoClickStatus,
    previewClickStatus: fidelity.previewClickStatus,
    docxDownloadStatus: fidelity.docxDownloadStatus,
    machineCheckableFidelityStatus: fidelity.machineCheckableFidelityStatus,
    visualPdfReviewStatusForBatch4: fidelity.visualPdfReviewStatusForBatch4,
  };

  matrix.snapshotDate = new Date().toISOString();

  // Counts preserved for this script's scope. Later source/render batches may
  // increase PASS beyond the older 77 baseline.
  const passCount = (matrix.rows || []).filter(
    (r) => r.status === "INPUT_CONNECTED_PASS",
  ).length;
  const partialCount = (matrix.rows || []).filter(
    (r) => r.status === "INPUT_CONNECTED_PARTIAL",
  ).length;
  if (passCount < 77 || partialCount > 136) {
    console.error(
      `FATAL: count drift detected INPUT_CONNECTED_PASS=${passCount} (expected at least 77), INPUT_CONNECTED_PARTIAL=${partialCount} (expected at most 136)`,
    );
    process.exit(2);
  }

  writeFileSync(MATRIX_JSON, JSON.stringify(matrix, null, 2));

  let md = readFileSync(MATRIX_MD, "utf8");
  const sectionHeader = "## Batch 4 Machine-Checkable Fidelity Evidence";
  const startIdx = md.indexOf(sectionHeader);
  if (startIdx >= 0) {
    md = md.slice(0, startIdx).trimEnd() + "\n";
  }

  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${fidelity.snapshotDate}`);
  lines.push(`- status: ${fidelity.status}`);
  lines.push(`- statusNote: ${fidelity.statusNote}`);
  lines.push(`- fidelityCompleteClaimed: ${fidelity.fidelityCompleteClaimed}`);
  lines.push(`- visualPdfReviewStatus: ${fidelity.visualPdfReviewStatus}`);
  lines.push(`- totalForms: ${fidelity.totalForms}`);
  lines.push(`- formsPass: ${fidelity.formsPass}`);
  lines.push(`- formsPartial: ${fidelity.formsPartial}`);
  lines.push(`- formsFail: ${fidelity.formsFail}`);
  lines.push(`- placeholderLeaksTotal: ${fidelity.placeholderLeaksTotal}`);
  lines.push(`- staleTokenLeaksTotal: ${fidelity.staleTokenLeaksTotal}`);
  lines.push(`- structureFailuresTotal: ${fidelity.structureFailuresTotal}`);
  lines.push(`- formattingFailuresTotal: ${fidelity.formattingFailuresTotal}`);
  lines.push(`- lifecycleFailuresTotal: ${fidelity.lifecycleFailuresTotal}`);
  lines.push(`- manualReviewRequired: ${fidelity.manualReviewRequired}`);
  lines.push("");
  lines.push(
    `Artifact: \`docs/audit/unified-bm-workspace/QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.{md,json}\``,
  );
  lines.push("");
  lines.push(
    `> Note: fidelityComplete=false for all 20 Batch 4 forms. Visual equivalence requires human review.`,
  );
  lines.push("");
  lines.push(
    "| Code | Machine-fidelity | fidelityComplete | Major structure | Placeholder | Stale | Formatting | Tables | Lifecycle | Failure reasons |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const row of matrix.rows || []) {
    if (!BATCH4_CODES.includes(row.templateCode)) continue;
    lines.push(
      `| ${row.templateCode} | ${row.fidelityAuditStatus} | ${row.fidelityComplete ? "yes" : "no"} | ${row._displayFidelityMajorStructure} | ${row._displayFidelityPlaceholderClean} | ${row._displayFidelityStaleTokenClean} | ${row._displayFidelityFormatting} | ${row._displayFidelityTableParity} | ${row._displayFidelityLifecycle} | ${row._displayFidelityFailures} |`,
    );
  }
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

  // Strip private display fields from JSON.
  for (const row of matrix.rows || []) {
    delete row._displayFidelityMajorStructure;
    delete row._displayFidelityPlaceholderClean;
    delete row._displayFidelityStaleTokenClean;
    delete row._displayFidelityFormatting;
    delete row._displayFidelityTableParity;
    delete row._displayFidelityLifecycle;
    delete row._displayFidelityFailures;
  }
  writeFileSync(MATRIX_JSON, JSON.stringify(matrix, null, 2));

  console.log(`Updated ${updated} Batch 4 rows. fidelityComplete=true for 0 forms.`);
}

main();
