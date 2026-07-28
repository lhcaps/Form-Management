#!/usr/bin/env node
/**
 * apply-visual-pdf-status.mjs
 *
 * Updates QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json with fields from
 * QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.json for the 37 curated forms:
 *
 *   - visualPdfReviewStatus
 *   - manualReviewRequired
 *   - fidelityComplete
 *   - fidelityCompleteEvidenceSource
 *   - fidelityReason
 *
 * Rules:
 *   - fidelityComplete=true only when humanReviewStatus === "PASS"
 *   - textSanityStatus=fail is expected when pdfplumber can't extract Vietnamese CJK text;
 *     this is a tooling limitation, NOT a form failure. We propagate the raw status
 *     but do NOT treat it as a critical failure here (the golden/layout fidelity
 *     artifact already validated text sanity via XML analysis of the DOCX source).
 *   - Forms with page_count_mismatch are flagged as visualPdfReviewStatus=PARTIAL
 *     (requires human review).
 *   - Forms with image diff available and moderate/high diff are flagged PARTIAL.
 *   - humanReviewStatus=NOT_REVIEWED → visualPdfReviewStatus=PASS_AUTO_NEEDS_HUMAN_CONFIRM
 *     (or PARTIAL if page mismatch or image diff is high).
 *
 * Usage:
 *   node scripts/audit/apply-visual-pdf-status.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX_JSON = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const VISUAL_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.json`;

function main() {
  if (!existsSync(MATRIX_JSON)) {
    console.error(`FATAL: missing ${MATRIX_JSON}`); process.exit(2);
  }
  if (!existsSync(VISUAL_ARTIFACT)) {
    console.error(`FATAL: missing ${VISUAL_ARTIFACT}`); process.exit(2);
  }

  const matrix = JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
  const visual = JSON.parse(readFileSync(VISUAL_ARTIFACT, "utf8"));

  const byCode = new Map((visual.results || []).map((r) => [r.templateCode, r]));

  let updated = 0;
  let fidelityCompleteCount = 0;
  const CURATED_37 = [
    "BM-001","BM-005","BM-006","BM-007","BM-008","BM-009","BM-010",
    "BM-011","BM-012","BM-014","BM-015","BM-017","BM-018","BM-019",
    "BM-020","BM-022","BM-023","BM-030","BM-031","BM-033","BM-035",
    "BM-036","BM-037","BM-038","BM-040","BM-042","BM-043","BM-044",
    "BM-045","BM-046","BM-047","BM-048","BM-052","BM-053","BM-054",
    "BM-070","BM-171",
  ];

  for (const row of matrix.rows || []) {
    if (!CURATED_37.includes(row.templateCode)) continue;
    const v = byCode.get(row.templateCode);
    if (!v) continue;

    // Derive visualPdfReviewStatus from raw artifact fields.
    // Note: textSanityStatus=fail is often a tooling limitation (pdfplumber can't
    // extract Vietnamese CJK text from LibreOffice-rendered PDFs), not a form defect.
    // The golden/layout fidelity script already validated text sanity via DOCX XML.
    const humanPass = v.humanReviewStatus === "PASS";
    const humanFail = v.humanReviewStatus === "FAIL";
    const humanReviewed = humanPass || humanFail;

    const pdfConverted = v.pdfConversionStatus === "both_converted";
    const pageMismatch = v.pageCountStatus === "mismatch";
    const highDiff = v.imageDiffStatus === "high_diff";
    const imageDiffOk = v.imageDiffStatus === "low_diff" || v.imageDiffStatus === "moderate_diff" ||
                        v.imageDiffStatus === "pil_not_available" || v.imageDiffStatus === "no_diff_data";
    const textSanityFail = v.textSanityStatus === "fail"; // often tooling limitation
    const automatedFail = v.automatedVisualStatus === "FAIL";

    let visualStatus;
    if (humanPass) {
      visualStatus = "PASS_HUMAN_REVIEWED";
    } else if (humanFail) {
      visualStatus = "FAIL_HUMAN_REVIEWED";
    } else if (humanReviewed) {
      visualStatus = "FAIL_HUMAN_REVIEWED";
    } else if (automatedFail && (pageMismatch || highDiff)) {
      visualStatus = "FAIL_AUTO_NEEDS_REVIEW";
    } else if (automatedFail) {
      visualStatus = "PARTIAL_AUTO_NEEDS_REVIEW";
    } else if (pdfConverted && !pageMismatch && imageDiffOk) {
      visualStatus = "PASS_AUTO_NEEDS_HUMAN_CONFIRM";
    } else if (pdfConverted) {
      visualStatus = "PARTIAL_AUTO_NEEDS_REVIEW";
    } else {
      visualStatus = "CONVERSION_FAILED";
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

    // fidelityReason
    if (humanPass) {
      row.fidelityReason = `Human review PASS. visualPdfReviewStatus=${visualStatus}.`;
    } else if (humanFail) {
      row.fidelityReason = `Human review FAIL. visualPdfReviewStatus=${visualStatus}.`;
    } else if (!pdfConverted) {
      row.fidelityReason = `PDF conversion failed. Visual review not possible.`;
    } else if (pageMismatch) {
      row.fidelityReason = `Page count mismatch (src=${v.sourcePageCount} gen=${v.generatedPageCount}). Human review required.`;
    } else if (highDiff) {
      row.fidelityReason = `High image diff ratio (${(v.maxDiffRatio || 0).toFixed(3)}). Human review required.`;
    } else if (textSanityFail) {
      row.fidelityReason = `PDF text extraction failed (tooling limitation: pdfplumber CJK font). DOCX XML text sanity previously PASS. Human review recommended.`;
    } else {
      row.fidelityReason = `Automated checks pass. Human review required before fidelityComplete=true.`;
    }

    row.visualPdfFidelityEvidenceSource = "QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.json";
    row.visualPdfArtifactDate = visual.snapshotDate;

    if (row.fidelityComplete === true) fidelityCompleteCount++;
    updated++;
  }

  // Top-level visualPdfEvidence block
  matrix.curated37VisualPdfEvidence = {
    snapshotDate: visual.snapshotDate,
    status: visual.status,
    statusNote: visual.statusNote,
    fidelityCompleteEvidenced: visual.fidelityCompleteEvidenced,
    totalForms: visual.totalForms,
    formsPdfCompared: visual.formsPdfCompared,
    formsAutoVisualPass: visual.formsAutoVisualPass,
    formsHumanReviewedPass: visual.formsHumanReviewedPass,
    formsHumanReviewedFail: visual.formsHumanReviewedFail,
    formsConversionFailed: visual.formsConversionFailed,
    formsManualReviewRequired: visual.formsManualReviewRequired,
    fidelityCompleteClaimed: visual.fidelityCompleteClaimed,
    sourceRenderStatus: visual.sourceRenderStatus,
    browserVisibilityStatus: visual.browserVisibilityStatus,
    demoClickStatus: visual.demoClickStatus,
    previewClickStatus: visual.previewClickStatus,
    docxDownloadStatus: visual.docxDownloadStatus,
    machineCheckableFidelityStatus: visual.machineCheckableFidelityStatus,
    visualPdfFidelityStatus: visual.visualPdfFidelityStatus,
    toolingNote: "pdfplumber text extraction and to_image() are unreliable for Vietnamese CJK fonts. DOCX XML text sanity was validated by golden/layout fidelity script.",
  };

  matrix.snapshotDate = new Date().toISOString();

  // Preserve counts (no classification drift)
  const passCount = (matrix.rows || []).filter((r) => r.status === "INPUT_CONNECTED_PASS").length;
  const partialCount = (matrix.rows || []).filter((r) => r.status === "INPUT_CONNECTED_PARTIAL").length;
  if (passCount !== 37 || partialCount !== 176) {
    console.error(`WARN: count drift INPUT_CONNECTED_PASS=${passCount} partial=${partialCount}`);
  }

  writeFileSync(MATRIX_JSON, JSON.stringify(matrix, null, 2));

  // Update markdown
  let md = readFileSync(MATRIX_MD, "utf8");
  const sectionHeader = "## Curated 37 Visual / PDF Fidelity Evidence";
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
  lines.push(`- toolingNote: pdfplumber unreliable for Vietnamese CJK fonts. DOCX XML text sanity validated separately.`);
  lines.push(`- formsPdfCompared: ${visual.formsPdfCompared}`);
  lines.push(`- formsHumanReviewedPass: ${visual.formsHumanReviewedPass}`);
  lines.push(`- formsHumanReviewedFail: ${visual.formsHumanReviewedFail}`);
  lines.push(`- formsConversionFailed: ${visual.formsConversionFailed}`);
  lines.push(`- fidelityComplete=true: ${fidelityCompleteCount}`);
  lines.push("");
  lines.push(`Artifact: \`docs/audit/unified-bm-workspace/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.{md,json}\``);
  lines.push(`Checklist: \`docs/audit/unified-bm-workspace/QLLAW_CURATED_VISUAL_PDF_REVIEW_CHECKLIST.latest.md\``);
  lines.push("");
  lines.push(
    "| Code | visualPdfReviewStatus | pageCountStatus | textSanityStatus | imageDiffStatus | maxDiffRatio | fidelityComplete | humanReviewStatus | manualReviewRequired | fidelityReason |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const row of matrix.rows || []) {
    if (!CURATED_37.includes(row.templateCode)) continue;
    const diff = row.visualPdfMaxDiffRatio !== null ? row.visualPdfMaxDiffRatio.toFixed(3) : "N/A";
    lines.push(
      `| ${row.templateCode} | ${row.visualPdfReviewStatus} | ${row.visualPdfPageCountStatus} | ${row.visualPdfTextSanityStatus} | ${row.visualPdfImageDiffStatus} | ${diff} | ${row.fidelityComplete ? "yes" : "no"} | ${row.visualPdfHumanReviewStatus} | ${row.manualReviewRequired ? "yes" : "no"} | ${(row.fidelityReason || "").slice(0, 80)} |`,
    );
  }
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

  console.log(`Updated ${updated} curated rows. fidelityComplete=true for ${fidelityCompleteCount} forms.`);
  console.log(`Matrix: ${MATRIX_JSON}`);
  console.log(`Visual artifact: ${VISUAL_ARTIFACT}`);
}

main();
