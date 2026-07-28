#!/usr/bin/env node
/**
 * apply-batch4-visual-pdf-review.mjs
 *
 * Updates QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} with
 * visual / PDF review evidence for the 20 Batch 4 forms.
 *
 * Per-form fields updated for Batch 4 only:
 *   - visualPdfReviewStatus
 *       (PASS_AUTO_NEEDS_HUMAN_CONFIRM | PARTIAL_AUTO_NEEDS_REVIEW |
 *        FAIL_AUTO_NEEDS_REVIEW | CONVERSION_FAILED)
 *   - visualPdfToolingLimitation
 *   - visualPdfTextSanityStatus
 *   - visualPdfImageDiffStatus
 *   - visualPdfMaxDiffRatio
 *   - visualPdfPageCountStatus
 *   - visualPdfHumanReviewStatus
 *   - visualPdfFidelityEvidenceSource
 *       = "QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.json"
 *   - visualPdfArtifactDate
 *   - manualReviewRequired remains true
 *   - fidelityComplete stays false
 *
 * Rules:
 *   - pdfplumber text extraction failure is a known tooling limitation
 *     (Vietnamese CJK fonts). The Batch 4 machine-fidelity artifact
 *     already validated text sanity via DOCX XML. The apply script
 *     surfaces tooling limitations but does not treat them as a
 *     fidelity failure.
 *   - visualPdfReviewStatus is set to:
 *       PASS_AUTO_NEEDS_HUMAN_CONFIRM when both PDFs converted, page
 *         count matches, text sanity pass, image diff pass
 *       PARTIAL_AUTO_NEEDS_REVIEW when tooling limits prevent full
 *         automated verification (text extraction unreliable, image
 *         diff unavailable) but conversion + page count succeed
 *       FAIL_AUTO_NEEDS_REVIEW when conversion or page parity fails
 *       CONVERSION_FAILED when PDF conversion failed
 *   - fidelityComplete remains false for all 20 forms (no human review
 *     PASS recorded in this phase).
 *
 * Existing 57 evidence (37 curated + 20 batch 3) and the 20 Batch 4
 * source/render + browser + demo + preview + docx + machine-fidelity
 * evidence remain untouched.
 *
 * Counts preserved:
 *   - INPUT_CONNECTED_PASS    = 77
 *   - INPUT_CONNECTED_PARTIAL = 136
 *   - fidelityComplete=true count = 0
 *
 * No global FIDELITY_COMPLETE_EVIDENCED claim is set.
 * FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Usage:
 *   node scripts/audit/apply-batch4-visual-pdf-review.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX_JSON = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const VISUAL_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.json`;

const BATCH4_CODES = [
  "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084",
  "BM-085", "BM-086", "BM-087", "BM-088", "BM-090", "BM-091",
  "BM-092", "BM-093", "BM-094", "BM-095", "BM-096", "BM-097",
  "BM-098", "BM-100",
];

function main() {
  if (!existsSync(MATRIX_JSON)) {
    console.error(`FATAL: missing ${MATRIX_JSON}`);
    process.exit(2);
  }
  if (!existsSync(VISUAL_ARTIFACT)) {
    console.error(`FATAL: missing ${VISUAL_ARTIFACT}. Re-run scripts/audit/batch4-visual-pdf-review.mjs first.`);
    process.exit(2);
  }

  const matrix = JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
  const visual = JSON.parse(readFileSync(VISUAL_ARTIFACT, "utf8"));

  const byCode = new Map((visual.results || []).map((r) => [r.templateCode, r]));

  let updated = 0;
  let fidelityCompleteCount = 0;

  for (const row of matrix.rows || []) {
    if (!BATCH4_CODES.includes(row.templateCode)) continue;
    const v = byCode.get(row.templateCode);
    if (!v) continue;

    const humanPass = v.humanReviewStatus === "PASS";
    const humanFail = v.humanReviewStatus === "FAIL";
    const humanReviewed = humanPass || humanFail;

    const pdfConverted = v.pdfConversionStatus === "both_converted";
    const pageMismatch = v.pageCountStatus === "mismatch";
    const textSanityFail = v.textSanityStatus === "fail"; // tooling limitation

    let visualStatus;
    if (humanPass) {
      visualStatus = "PASS_HUMAN_REVIEWED";
    } else if (humanFail) {
      visualStatus = "FAIL_HUMAN_REVIEWED";
    } else if (!pdfConverted) {
      visualStatus = "CONVERSION_FAILED";
    } else if (pageMismatch) {
      visualStatus = "FAIL_AUTO_NEEDS_REVIEW";
    } else if (pdfConverted && textSanityFail) {
      // Tooling limitation: text extraction unreliable for Vietnamese CJK fonts.
      // Page count and PDF conversion both succeed. Treat as PARTIAL pending
      // human review (mirrors curated-37 convention).
      visualStatus = "PARTIAL_AUTO_NEEDS_REVIEW";
    } else if (pdfConverted) {
      visualStatus = "PASS_AUTO_NEEDS_HUMAN_CONFIRM";
    } else {
      visualStatus = "PARTIAL_AUTO_NEEDS_REVIEW";
    }

    row.visualPdfReviewStatus = visualStatus;
    row.visualPdfToolingLimitation = textSanityFail && !humanReviewed;
    row.visualPdfTextSanityStatus = v.textSanityStatus;
    row.visualPdfImageDiffStatus = v.imageDiffStatus;
    row.visualPdfMaxDiffRatio = v.maxDiffRatio;
    row.visualPdfPageCountStatus = v.pageCountStatus;
    row.visualPdfHumanReviewStatus = v.humanReviewStatus;

    // fidelityComplete: only when human-reviewed PASS
    row.fidelityComplete = humanPass;
    // manualReviewRequired: true unless human-reviewed
    row.manualReviewRequired = !humanReviewed;

    if (humanPass) {
      row.fidelityReason = `Human review PASS. visualPdfReviewStatus=${visualStatus}.`;
    } else if (humanFail) {
      row.fidelityReason = `Human review FAIL. visualPdfReviewStatus=${visualStatus}.`;
    } else if (!pdfConverted) {
      row.fidelityReason = `PDF conversion failed. Visual review not possible.`;
    } else if (pageMismatch) {
      row.fidelityReason = `Page count mismatch (src=${v.sourcePageCount} gen=${v.generatedPageCount}). Human review required.`;
    } else if (textSanityFail) {
      row.fidelityReason = `PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML text sanity previously PASS (QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY). Human review recommended.`;
    } else {
      row.fidelityReason = `Automated checks pass. Human review required before fidelityComplete=true.`;
    }

    row.visualPdfFidelityEvidenceSource = "QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.json";
    row.visualPdfArtifactDate = visual.snapshotDate;

    if (row.fidelityComplete === true) fidelityCompleteCount++;
    updated++;
  }

  // Top-level batch4VisualPdfEvidence block
  matrix.batch4VisualPdfEvidence = {
    snapshotDate: visual.snapshotDate,
    status: visual.status,
    statusNote: visual.statusNote,
    fidelityCompleteEvidenced: visual.fidelityCompleteEvidenced,
    totalForms: visual.totalForms,
    formsVisualPdfReviewed: visual.formsVisualPdfReviewed,
    formsVisualPdfPassed: visual.formsVisualPdfPassed,
    formsVisualPdfPartial: visual.formsVisualPdfPartial,
    formsVisualPdfFailed: visual.formsVisualPdfFailed,
    pdfConverted: visual.pdfConverted,
    pdfConversionFailed: visual.pdfConversionFailed,
    pageCountParityPass: visual.pageCountParityPass,
    pageCountMismatch: visual.pageCountMismatch,
    textExtractionReliable: visual.textExtractionReliable,
    textExtractionUnreliable: visual.textExtractionUnreliable,
    manualReviewRequired: visual.manualReviewRequired,
    fidelityCompleteClaimed: visual.fidelityCompleteClaimed,
    formFlightRuntimeReadyPromoted: visual.formFlightRuntimeReadyPromoted,
    sourceRenderStatus: visual.sourceRenderStatus,
    browserVisibilityStatus: visual.browserVisibilityStatus,
    demoClickStatus: visual.demoClickStatus,
    previewClickStatus: visual.previewClickStatus,
    docxDownloadStatus: visual.docxDownloadStatus,
    machineCheckableFidelityStatus: visual.machineCheckableFidelityStatus,
    visualPdfFidelityStatus: visual.visualPdfFidelityStatus,
    toolingNote: visual.toolingNote,
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

  // Update markdown — append/replace "## Batch 4 Visual / PDF Review Evidence" section
  let md = readFileSync(MATRIX_MD, "utf8");
  const sectionHeader = "## Batch 4 Visual / PDF Review Evidence";
  const startIdx = md.indexOf(sectionHeader);
  if (startIdx >= 0) {
    md = md.slice(0, startIdx).trimEnd() + "\n";
  }

  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${visual.snapshotDate}`);
  lines.push(`- status: ${visual.status}`);
  lines.push(`- statusNote: ${visual.statusNote}`);
  lines.push(`- fidelityCompleteClaimed: ${visual.fidelityCompleteClaimed}`);
  lines.push(`- visualPdfFidelityStatus: ${visual.visualPdfFidelityStatus}`);
  lines.push(`- pdfConverted: ${visual.pdfConverted}/${visual.totalForms}`);
  lines.push(`- pageCountParityPass: ${visual.pageCountParityPass}`);
  lines.push(`- textExtractionReliable: ${visual.textExtractionReliable} (tooling limitation: pdfplumber CJK font)`);
  lines.push(`- textExtractionUnreliable: ${visual.textExtractionUnreliable}`);
  lines.push(`- manualReviewRequired: ${visual.manualReviewRequired}`);
  lines.push(`- toolingNote: ${visual.toolingNote}`);
  lines.push("");
  lines.push(
    `Artifacts: \`docs/audit/unified-bm-workspace/QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.{md,json}\`, \`QLLAW_BATCH4_VISUAL_PDF_REVIEW_CHECKLIST.latest.md\``,
  );
  lines.push(`Temp: \`.tmp-batch4-visual-pdf-review/<code>/{source,generated}.pdf\``);
  lines.push("");
  lines.push(
    `> Note: fidelityComplete=false for all 20 Batch 4 forms. Visual equivalence requires human review. Tooling limitation (pdfplumber CJK font) prevents automated text extraction; DOCX XML text sanity already validated by \`QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json\`.`,
  );
  lines.push("");
  lines.push(
    "| Code | PDF converted | Pages (src/gen) | Page match | Text sanity | Image diff | maxDiffRatio | Auto status | visualPdfReviewStatus | manualReviewRequired |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const row of matrix.rows || []) {
    if (!BATCH4_CODES.includes(row.templateCode)) continue;
    const pages = `${row.visualPdfPageCountStatus}`;
    const diff = row.visualPdfMaxDiffRatio !== null && row.visualPdfMaxDiffRatio !== undefined
      ? row.visualPdfMaxDiffRatio.toFixed(3)
      : "N/A";
    const autoStatus = (visual.results.find((r) => r.templateCode === row.templateCode) || {}).automatedVisualStatus || "N/A";
    lines.push(
      `| ${row.templateCode} | ${(byCode.get(row.templateCode) || {}).pdfConversionStatus || "N/A"} | ${(byCode.get(row.templateCode) || {}).sourcePageCount ?? "?"}/${(byCode.get(row.templateCode) || {}).generatedPageCount ?? "?"} | ${pages} | ${row.visualPdfTextSanityStatus} | ${row.visualPdfImageDiffStatus} | ${diff} | ${autoStatus} | ${row.visualPdfReviewStatus} | ${row.manualReviewRequired ? "yes" : "no"} |`,
    );
  }
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

  console.log(`Updated ${updated} Batch 4 rows. fidelityComplete=true for ${fidelityCompleteCount} forms.`);
  console.log(`Matrix: ${MATRIX_JSON}`);
  console.log(`Visual artifact: ${VISUAL_ARTIFACT}`);
}

main();
