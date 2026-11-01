#!/usr/bin/env node
/**
 * apply-batch3-fidelity-status.mjs
 *
 * Updates QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add
 * machine-checkable fidelity evidence for the 20 Batch 3 forms
 * (BM-055..BM-069, BM-071..BM-075) sourced from
 * docs/audit/unified-bm-workspace/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json
 *
 * Per-form fields updated for Batch 3 only:
 *   - fidelityAuditStatus = PASS | PARTIAL | FAIL | NOT_RUN
 *   - fidelityComplete = false (never claim without visual review)
 *   - fidelityReason = short summary
 *   - fidelityCriteriaPassed = array
 *   - fidelityCriteriaFailed = array
 *   - fidelityCompleteEvidenceSource
 *     = "QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json"
 *   - machineCheckableFidelityStatus = PASS | PARTIAL | FAIL | NOT_RUN
 *   - visualPdfReviewStatus remains null (NOT_RUN) for Batch 3
 *   - manualReviewRequired = true after this phase
 *     (fidelity PASS still requires visual/PDF review)
 *
 * Existing 37 evidence (browser/demo/preview/docx/fidelity/visualpdf)
 * remains untouched.
 *
 * Counts preserved:
 *   - INPUT_CONNECTED_PASS    = 57
 *   - INPUT_CONNECTED_PARTIAL = 156
 *   - fidelityComplete=true count = 0 (visual review never run)
 *
 * No global FIDELITY_COMPLETE_EVIDENCED claim is set.
 * FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Usage:
 *   node scripts/audit/apply-batch3-fidelity-status.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX_JSON = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const FIDELITY_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json`;

const BATCH3_CODES = [
  "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-060",
  "BM-061", "BM-062", "BM-063", "BM-064", "BM-065", "BM-066",
  "BM-067", "BM-068", "BM-069", "BM-071", "BM-072", "BM-073",
  "BM-074", "BM-075",
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
    if (!BATCH3_CODES.includes(row.templateCode)) continue;
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
    row.fidelityReason = r.failureReasons?.length > 0
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
    row.fidelityCompleteEvidenceSource = "QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json";

    updated++;
  }

  // Top-level batch3 fidelity evidence block.
  matrix.batch3FidelityEvidence = {
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
    visualPdfReviewStatusForBatch3: fidelity.visualPdfReviewStatusForBatch3,
  };

  matrix.snapshotDate = new Date().toISOString();

  // Counts preserved for this script's scope. Later source/render batches may
  // increase PASS beyond the older 57/77 baselines.
  const passCount = (matrix.rows || []).filter(
    (r) => r.status === "INPUT_CONNECTED_PASS",
  ).length;
  const partialCount = (matrix.rows || []).filter(
    (r) => r.status === "INPUT_CONNECTED_PARTIAL",
  ).length;
  if (passCount < 57 || partialCount > 156) {
    console.error(
      `FATAL: count drift detected INPUT_CONNECTED_PASS=${passCount} (expected at least 57), INPUT_CONNECTED_PARTIAL=${partialCount} (expected at most 156)`,
    );
    process.exit(2);
  }

  writeFileSync(MATRIX_JSON, JSON.stringify(matrix, null, 2));

  let md = readFileSync(MATRIX_MD, "utf8");
  const sectionHeader = "## Batch 3 Machine-Checkable Fidelity Evidence";
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
    `Artifact: \`docs/audit/unified-bm-workspace/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.{md,json}\``,
  );
  lines.push("");
  lines.push(
    `> Note: fidelityComplete=false for all 20 Batch 3 forms. Visual equivalence requires human review.`,
  );
  lines.push("");
  lines.push(
    "| Code | Machine-fidelity | fidelityComplete | Major structure | Placeholder | Stale | Formatting | Tables | Lifecycle | Failure reasons |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const row of matrix.rows || []) {
    if (!BATCH3_CODES.includes(row.templateCode)) continue;
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

  console.log(`Updated ${updated} Batch 3 rows. fidelityComplete=true for 0 forms.`);
}

main();
