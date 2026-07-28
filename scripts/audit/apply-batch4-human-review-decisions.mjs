#!/usr/bin/env node
/**
 * apply-batch4-human-review-decisions.mjs
 *
 * Applies validated human review decisions for the 20 Batch 4 forms to:
 *   - QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md}
 *   - QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.latest.{json,md}
 *
 * Reads:
 *   - docs/audit/unified-bm-workspace/QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.input.json
 *   - docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json
 *
 * Rules:
 *   - Touches ONLY Batch 4 rows (templateCode in BATCH4_CODES).
 *   - Existing 37 and Batch 3 rows are not modified.
 *   - For decision PASS:
 *       visualPdfReviewStatus = PASS_HUMAN_REVIEWED
 *       humanReviewStatus = PASS
 *       manualReviewRequired = false
 *       fidelityComplete = true
 *   - For decision FAIL:
 *       visualPdfReviewStatus = FAIL_HUMAN_REVIEWED
 *       humanReviewStatus = FAIL
 *       manualReviewRequired = true
 *       fidelityComplete = false
 *   - For decision UNCERTAIN:
 *       visualPdfReviewStatus = PARTIAL_HUMAN_REVIEW_REQUIRED
 *       humanReviewStatus = UNCERTAIN
 *       manualReviewRequired = true
 *       fidelityComplete = false
 *   - Global FIDELITY_COMPLETE_EVIDENCED stays FALSE unless all 77 forms are cleared.
 *   - Counts INPUT_CONNECTED_PASS=77 and INPUT_CONNECTED_PARTIAL=136 preserved.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * No mutations to source/normalized/locked/compiled DOCX, DB, Prisma schema,
 * migrations, or runtime routes. No commit/push/stage.
 *
 * Usage:
 *   node scripts/audit/validate-batch4-human-review-decisions.mjs
 *   node scripts/audit/apply-batch4-human-review-decisions.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';

const ROOT = pathResolve(process.cwd()).replace(/\\/g, '/');
const OUT_DIR = ROOT + '/docs/audit/unified-bm-workspace';
const MATRIX_JSON = OUT_DIR + '/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json';
const MATRIX_MD = OUT_DIR + '/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md';
const INPUT_PATH = OUT_DIR + '/QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.input.json';
const DECISIONS_JSON = OUT_DIR + '/QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.latest.json';
const DECISIONS_MD = OUT_DIR + '/QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.latest.md';

const BATCH4_CODES = [
  'BM-076','BM-078','BM-080','BM-081','BM-083','BM-084','BM-085','BM-086',
  'BM-087','BM-088','BM-090','BM-091','BM-092','BM-093','BM-094','BM-095',
  'BM-096','BM-097','BM-098','BM-100',
];
const BATCH4_SET = new Set(BATCH4_CODES);

function fail(msg, code = 1) { console.error("FATAL:", msg); process.exit(code); }
function readJson(p) {
  try { return JSON.parse(readFileSync(p, "utf8")); } catch (e) { return { __readError: e.message }; }
}
function isIsoTimestamp(s) {
  if (typeof s !== "string" || s.length < 10) return false;
  return !Number.isNaN(new Date(s).getTime());
}
const CRITERIA_FIELDS = [
  "samePageCount","headerLooksCorrect","titleLooksCorrect","bodyLayoutLooksCorrect",
  "tablesLookCorrect","footerSignatureLooksCorrect","noMissingTextVisible",
  "noObviousOverflowOrClipping","acceptableForLegalDemo",
];
const ALLOWED_DECISIONS = new Set(["PASS","FAIL","UNCERTAIN"]);
const FORBIDDEN_REVIEWERS = new Set(["ai","cursor","gpt","tool","assistant","claude","chatgpt"]);

function validateDecisions(input) {
  const errors = [];
  for (const f of ["fidelityCompleteEvidenced","FIDELITY_COMPLETE_EVIDENCED","globalEvidenced"]) {
    if (Object.prototype.hasOwnProperty.call(input, f)) {
      errors.push({ path: INPUT_PATH, issue: "FORBIDDEN_TOP_LEVEL_FIELD", detail: "Input must not declare " + f + "." });
    }
  }
  if (!Array.isArray(input.decisions) || input.decisions.length !== 20) {
    errors.push({ path: INPUT_PATH, issue: "DECISION_COUNT_MISMATCH", detail: "Expected 20 decisions, got " + (input.decisions && input.decisions.length) + "." });
    return { errors };
  }
  const seen = new Set();
  for (const [idx, d] of input.decisions.entries()) {
    const prefix = "decisions[" + idx + "]";
    if (!d || typeof d !== "object") { errors.push({ path: prefix, issue: "NOT_OBJECT", detail: "Decision must be an object." }); continue; }
    if (!BATCH4_SET.has(d.code)) errors.push({ path: prefix + ".code", issue: "CODE_NOT_IN_BATCH4", detail: "code=" + d.code + " is not a Batch 4 code." });
    if (seen.has(d.code)) errors.push({ path: prefix + ".code", issue: "DUPLICATE_CODE", detail: "code=" + d.code + " appears more than once." });
    seen.add(d.code);
    if (typeof d.sourcePdf !== "string" || !existsSync(pathResolve(ROOT, d.sourcePdf))) errors.push({ path: prefix + ".sourcePdf", issue: "FILE_NOT_FOUND", detail: d.sourcePdf });
    if (typeof d.generatedPdf !== "string" || !existsSync(pathResolve(ROOT, d.generatedPdf))) errors.push({ path: prefix + ".generatedPdf", issue: "FILE_NOT_FOUND", detail: d.generatedPdf });
    if (typeof d.reviewer !== "string" || !d.reviewer.trim().length) errors.push({ path: prefix + ".reviewer", issue: "EMPTY", detail: "reviewer required" });
    else if (FORBIDDEN_REVIEWERS.has(d.reviewer.trim().toLowerCase())) errors.push({ path: prefix + ".reviewer", issue: "AI_TOOL_REVIEWER_REJECTED", detail: "reviewer=" + d.reviewer });
    if (typeof d.reviewedAt !== "string" || !isIsoTimestamp(d.reviewedAt)) errors.push({ path: prefix + ".reviewedAt", issue: "NOT_ISO_TIMESTAMP", detail: "reviewedAt=" + d.reviewedAt });
    if (!ALLOWED_DECISIONS.has(d.decision)) errors.push({ path: prefix + ".decision", issue: "INVALID_DECISION", detail: "decision=" + d.decision });
    if (!d.criteria || typeof d.criteria !== "object") errors.push({ path: prefix + ".criteria", issue: "NOT_OBJECT", detail: "criteria required" });
    else if (d.decision === "PASS") {
      for (const f of CRITERIA_FIELDS) {
        if (d.criteria[f] !== true) errors.push({ path: prefix + ".criteria." + f, issue: "MUST_BE_TRUE_FOR_PASS", detail: "For PASS, all criteria must be true." });
      }
    }
    if ((d.decision === "FAIL" || d.decision === "UNCERTAIN") && (typeof d.notes !== "string" || !d.notes.trim().length)) {
      errors.push({ path: prefix + ".notes", issue: "EMPTY_FOR_NON_PASS", detail: "For " + d.decision + ", notes required" });
    }
    for (const f of ["generatedDocumentId","workspace","workspaceId","documentId"]) {
      if (Object.prototype.hasOwnProperty.call(d, f)) errors.push({ path: prefix + "." + f, issue: "FORBIDDEN_FIELD", detail: "Decision must not declare " + f + "." });
    }
  }
  for (const c of BATCH4_CODES) if (!seen.has(c)) errors.push({ path: INPUT_PATH, issue: "MISSING_CODE_DECISION", detail: "No decision entry for code=" + c + "." });
  return { errors, seen };
}

function mapDecisionToStatus(d) {
  if (d.decision === "PASS") return { visual: "PASS_HUMAN_REVIEWED", manual: false, fidelity: true };
  if (d.decision === "FAIL") return { visual: "FAIL_HUMAN_REVIEWED", manual: true, fidelity: false };
  return { visual: "PARTIAL_HUMAN_REVIEW_REQUIRED", manual: true, fidelity: false };
}

function main() {
  if (!existsSync(MATRIX_JSON)) fail("missing " + MATRIX_JSON);
  if (!existsSync(INPUT_PATH)) fail("missing " + INPUT_PATH + " \u2014 run validate first or fill human decisions");
  const input = readJson(INPUT_PATH);
  if (input.__readError) fail("input unreadable: " + input.__readError);
  const matrix = readJson(MATRIX_JSON);
  if (matrix.__readError) fail("matrix unreadable: " + matrix.__readError);
  const { errors } = validateDecisions(input);
  if (errors.length) {
    console.error(JSON.stringify({ ok: false, errors }, null, 2));
    process.exit(1);
  }

  // Snapshot pre-state for guards
  const prePassCount = (matrix.rows || []).filter((r) => r.status === "INPUT_CONNECTED_PASS").length;
  const prePartialCount = (matrix.rows || []).filter((r) => r.status === "INPUT_CONNECTED_PARTIAL").length;
  if (prePassCount !== 77 || prePartialCount !== 136) {
    fail("count drift before apply: PASS=" + prePassCount + " (expected 77), PARTIAL=" + prePartialCount + " (expected 136)");
  }

  // Snapshot pre-state of existing 37 / Batch 3 rows for non-mutation guard
  const EXISTING37_BATCH3_CODES = new Set([
    "BM-001","BM-002","BM-003","BM-004","BM-005","BM-006","BM-007","BM-008","BM-009","BM-010",
    "BM-011","BM-012","BM-013","BM-014","BM-015","BM-016","BM-017","BM-018","BM-019","BM-020",
    "BM-021","BM-022","BM-023","BM-024","BM-025","BM-026","BM-027","BM-028","BM-029","BM-030",
    "BM-031","BM-032","BM-033","BM-034","BM-035","BM-036","BM-037",
    // Batch 3 codes
    "BM-048","BM-049","BM-050","BM-051","BM-052","BM-053","BM-054","BM-055","BM-056","BM-057",
    "BM-058","BM-059","BM-060","BM-061","BM-062","BM-063","BM-064","BM-065","BM-066","BM-067",
  ]);
  const preExistingSnapshot = {};
  for (const r of matrix.rows || []) {
    if (EXISTING37_BATCH3_CODES.has(r.templateCode)) preExistingSnapshot[r.templateCode] = JSON.stringify(r);
  }

  // Apply
  const byCode = new Map(input.decisions.map((d) => [d.code, d]));
  let updated = 0;
  let fidelityCompleteCount = 0;
  let humanPass = 0, humanFail = 0, humanUncertain = 0;

  for (const row of matrix.rows || []) {
    if (!BATCH4_SET.has(row.templateCode)) continue;
    const d = byCode.get(row.templateCode);
    if (!d) continue;
    const status = mapDecisionToStatus(d);
    row.humanReviewStatus = d.decision;
    row.visualPdfReviewStatus = status.visual;
    row.humanReviewReviewer = d.reviewer;
    row.humanReviewReviewedAt = d.reviewedAt;
    row.humanReviewNotes = typeof d.notes === "string" ? d.notes : "";
    row.humanReviewCriteria = d.criteria;
    row.manualReviewRequired = status.manual;
    row.fidelityComplete = status.fidelity;
    if (status.fidelity) fidelityCompleteCount++;
    if (d.decision === "PASS") humanPass++;
    if (d.decision === "FAIL") humanFail++;
    if (d.decision === "UNCERTAIN") humanUncertain++;
    row.fidelityReason = (status.fidelity ? "Human review PASS by " + d.reviewer + " at " + d.reviewedAt : "Human review " + d.decision + " by " + d.reviewer + " at " + d.reviewedAt + ". Notes: " + (d.notes || ""));
    updated++;
  }

  // Verify counts still preserved
  const postPassCount = (matrix.rows || []).filter((r) => r.status === "INPUT_CONNECTED_PASS").length;
  const postPartialCount = (matrix.rows || []).filter((r) => r.status === "INPUT_CONNECTED_PARTIAL").length;
  if (postPassCount !== 77 || postPartialCount !== 136) {
    fail("count drift after apply: PASS=" + postPassCount + " (expected 77), PARTIAL=" + postPartialCount + " (expected 136)");
  }

  // Verify existing 37 / Batch 3 unchanged
  for (const r of matrix.rows || []) {
    if (EXISTING37_BATCH3_CODES.has(r.templateCode)) {
      const post = JSON.stringify(r);
      if (preExistingSnapshot[r.templateCode] !== post) fail("existing row mutated: " + r.templateCode);
    }
  }

  // Top-level evidence block
  matrix.batch4HumanReviewEvidence = {
    snapshotDate: new Date().toISOString(),
    source: "QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.input.json",
    appliedAt: new Date().toISOString(),
    totalDecisions: input.decisions.length,
    humanPass,
    humanFail,
    humanUncertain,
    fidelityCompleteTrue: fidelityCompleteCount,
    fidelityCompleteEvidenced: false,
    fidelityCompleteEvidencedNote: "Global FIDELITY_COMPLETE_EVIDENCED stays false unless all 77 forms have human/equivalent PASS. Batch 4 evidence is partial.",
    scope: "Batch 4 only",
    countsPreserved: { INPUT_CONNECTED_PASS: postPassCount, INPUT_CONNECTED_PARTIAL: postPartialCount },
    formFlightRuntimeReadyPromoted: 0,
    runtimeReadyAllowlistRemains: ["BM-001","BM-171"],
    mutationsApplied: ["humanReviewStatus","visualPdfReviewStatus","manualReviewRequired","fidelityComplete","humanReviewReviewer","humanReviewReviewedAt","humanReviewNotes","humanReviewCriteria","fidelityReason"],
    mutationsForbidden: ["sourceDocx","normalizedDocx","lockedContracts","compiledContracts","db","prismaSchema","migrations","runtimeRoutes"],
  };

  matrix.snapshotDate = new Date().toISOString();

  writeFileSync(MATRIX_JSON, JSON.stringify(matrix, null, 2));

  // Write the applied decisions artifact (latest)
  const appliedArtifact = {
    snapshotDate: new Date().toISOString(),
    source: INPUT_PATH,
    batch: "Batch 4",
    scope: "visual_pdf_human_review",
    totalForms: 20,
    fidelityCompleteEvidenced: false,
    fidelityCompleteEvidencedNote: "Batch 4 only; global FIDELITY_COMPLETE_EVIDENCED stays false unless all 77 forms cleared.",
    counts: {
      INPUT_CONNECTED_PASS: postPassCount,
      INPUT_CONNECTED_PARTIAL: postPartialCount,
      humanPass,
      humanFail,
      humanUncertain,
      fidelityCompleteTrue: fidelityCompleteCount,
      fidelityCompleteEvidenced: false,
    },
    decisions: input.decisions.map((d) => ({
      code: d.code,
      sourcePdf: d.sourcePdf,
      generatedPdf: d.generatedPdf,
      reviewer: d.reviewer,
      reviewedAt: d.reviewedAt,
      decision: d.decision,
      criteria: d.criteria,
      notes: d.notes,
      visualPdfReviewStatus: mapDecisionToStatus(d).visual,
      fidelityComplete: mapDecisionToStatus(d).fidelity,
      manualReviewRequired: mapDecisionToStatus(d).manual,
    })),
  };
  writeFileSync(DECISIONS_JSON, JSON.stringify(appliedArtifact, null, 2));

  // Markdown summary
  const md = [];
  md.push("# QLLAW Batch 4 \u2014 Applied Human Review Decisions");
  md.push("");
  md.push("- snapshotDate: " + appliedArtifact.snapshotDate);
  md.push("- source: " + INPUT_PATH);
  md.push("- totalForms: 20");
  md.push("- fidelityCompleteEvidenced: " + appliedArtifact.fidelityCompleteEvidenced + " (Batch 4 only; global false unless all 77 cleared)");
  md.push("- counts preserved: INPUT_CONNECTED_PASS=" + postPassCount + ", INPUT_CONNECTED_PARTIAL=" + postPartialCount);
  md.push("- humanPass=" + humanPass + " humanFail=" + humanFail + " humanUncertain=" + humanUncertain);
  md.push("- fidelityCompleteTrue=" + fidelityCompleteCount + " (Batch 4 only)");
  md.push("- formFlightRuntimeReadyPromoted: 0");
  md.push("");
  md.push("## Per-form results");
  md.push("");
  md.push("| Code | Source PDF | Generated PDF | Decision | Reviewer | Reviewed At | Visual/PDF Status | Fidelity Complete | Notes |");
  md.push("|---|---|---|---|---|---|---|---|---|");
  for (const d of input.decisions) {
    const s = mapDecisionToStatus(d);
    const notes = (d.notes || "").replace(/\|/g, "\\|");
    md.push("| " + d.code + " | `" + d.sourcePdf + "` | `" + d.generatedPdf + "` | " + d.decision + " | " + d.reviewer + " | " + d.reviewedAt + " | " + s.visual + " | " + s.fidelity + " | " + notes + " |");
  }
  md.push("");
  md.push("## What changed in the matrix");
  md.push("");
  md.push("- 20 Batch 4 rows updated with humanReviewStatus + visualPdfReviewStatus + manualReviewRequired + fidelityComplete.");
  md.push("- Existing 37 and Batch 3 rows NOT modified (verified by pre/post JSON diff).");
  md.push("- Counts INPUT_CONNECTED_PASS=77, INPUT_CONNECTED_PARTIAL=136 preserved.");
  md.push("- Global FIDELITY_COMPLETE_EVIDENCED stays false.");
  md.push("- FormFlight runtimeReady allowlist unchanged (BM-001 + BM-171).");
  md.push("");
  writeFileSync(DECISIONS_MD, md.join("\n"));

  console.log(JSON.stringify({
    ok: true,
    updated,
    humanPass,
    humanFail,
    humanUncertain,
    fidelityCompleteTrue: fidelityCompleteCount,
    countsPreserved: { INPUT_CONNECTED_PASS: postPassCount, INPUT_CONNECTED_PARTIAL: postPartialCount },
    matrixUpdated: MATRIX_JSON,
    appliedArtifact: DECISIONS_JSON,
    appliedArtifactMd: DECISIONS_MD,
  }, null, 2));
}

main();
