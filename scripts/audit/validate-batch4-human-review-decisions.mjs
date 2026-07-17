// Validates Batch 4 human review decisions input against strict schema.
//
// Hard rules (any failure => exit 1 with structured errors):
//   - input file must exist
//   - total decisions must equal 20
//   - codes must exactly match the Batch 4 code list
//   - no duplicate codes
//   - reviewer must be non-empty and not a known AI/tool identifier
//   - reviewedAt must be parseable as ISO-8601
//   - decision must be one of PASS / FAIL / UNCERTAIN
//   - for PASS: all nine criteria must be true
//   - for FAIL/UNCERTAIN: notes must be non-empty
//   - sourcePdf / generatedPdf paths must exist (relative to repo root)
//   - input must not declare global FIDELITY_COMPLETE_EVIDENCED
//   - input must not include generatedDocumentId / workspace claims

import { existsSync, readFileSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';

const REPO_ROOT = process.cwd();
const TEMPLATE_PATH = 'docs/audit/unified-bm-workspace/QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.template.json';
const INPUT_PATH = 'docs/audit/unified-bm-workspace/QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.input.json';

const BATCH4_CODES = [
  'BM-076','BM-078','BM-080','BM-081','BM-083','BM-084','BM-085','BM-086',
  'BM-087','BM-088','BM-090','BM-091','BM-092','BM-093','BM-094','BM-095',
  'BM-096','BM-097','BM-098','BM-100'
];

const CRITERIA_FIELDS = [
  'samePageCount','headerLooksCorrect','titleLooksCorrect','bodyLayoutLooksCorrect',
  'tablesLookCorrect','footerSignatureLooksCorrect','noMissingTextVisible',
  'noObviousOverflowOrClipping','acceptableForLegalDemo'
];

const ALLOWED_DECISIONS = new Set(['PASS','FAIL','UNCERTAIN']);
const FORBIDDEN_REVIEWERS = new Set(['ai','cursor','gpt','tool','assistant','claude','chatgpt']);

function fail(errors) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
function readJson(p) {
  try { return JSON.parse(readFileSync(p, "utf8")); } catch (e) { return { __readError: e.message }; }
}
function isIsoTimestamp(s) {
  if (typeof s !== "string" || s.length < 10) return false;
  return !Number.isNaN(new Date(s).getTime());
}

function main() {
  const errors = [];

  if (!existsSync(INPUT_PATH)) {
    fail([{
      path: INPUT_PATH,
      issue: 'INPUT_NOT_FOUND',
      detail: 'Human decision input file does not exist. No decisions to apply. Review pack + template are ready; human must fill the input JSON.'
    }]);
  }

  const template = readJson(TEMPLATE_PATH);
  if (template.__readError) {
    fail([{ path: TEMPLATE_PATH, issue: "TEMPLATE_UNREADABLE", detail: template.__readError }]);
  }
  if (!Array.isArray(template.decisions) || template.decisions.length !== BATCH4_CODES.length) {
    fail([{ path: TEMPLATE_PATH, issue: "TEMPLATE_SHAPE_INVALID", detail: "Template decisions array length must equal 20." }]);
  }

  const input = readJson(INPUT_PATH);
  if (input.__readError) {
    fail([{ path: INPUT_PATH, issue: "INPUT_UNREADABLE", detail: input.__readError }]);
  }

  for (const f of ['fidelityCompleteEvidenced','FIDELITY_COMPLETE_EVIDENCED','globalEvidenced']) {
    if (Object.prototype.hasOwnProperty.call(input, f)) {
      errors.push({ path: INPUT_PATH, issue: "FORBIDDEN_TOP_LEVEL_FIELD", detail: "Input must not declare " + f + "." });
    }
  }

  if (!Array.isArray(input.decisions)) {
    fail([{ path: INPUT_PATH, issue: "INPUT_SHAPE_INVALID", detail: "input.decisions must be an array." }]);
  }

  if (input.decisions.length !== BATCH4_CODES.length) {
    errors.push({ path: INPUT_PATH, issue: "DECISION_COUNT_MISMATCH", detail: "Expected " + BATCH4_CODES.length + " decisions, got " + input.decisions.length + "." });
  }

  const seen = new Set();
  for (const [idx, d] of input.decisions.entries()) {
    const prefix = "decisions[" + idx + "]";
    if (!d || typeof d !== "object") { errors.push({ path: prefix, issue: "NOT_OBJECT", detail: "Decision must be an object." }); continue; }
    if (!BATCH4_CODES.includes(d.code)) {
      errors.push({ path: prefix + ".code", issue: "CODE_NOT_IN_BATCH4", detail: "code=" + d.code + " is not a Batch 4 code." });
    }
    if (seen.has(d.code)) {
      errors.push({ path: prefix + ".code", issue: "DUPLICATE_CODE", detail: "code=" + d.code + " appears more than once." });
    }
    seen.add(d.code);

    if (typeof d.sourcePdf !== "string" || !d.sourcePdf.length) {
      errors.push({ path: prefix + ".sourcePdf", issue: "EMPTY", detail: "sourcePdf must be a non-empty string." });
    } else {
      const p = pathResolve(REPO_ROOT, d.sourcePdf);
      if (!existsSync(p)) errors.push({ path: prefix + ".sourcePdf", issue: "FILE_NOT_FOUND", detail: d.sourcePdf + " does not exist (resolved=" + p + ")." });
    }
    if (typeof d.generatedPdf !== "string" || !d.generatedPdf.length) {
      errors.push({ path: prefix + ".generatedPdf", issue: "EMPTY", detail: "generatedPdf must be a non-empty string." });
    } else {
      const p = pathResolve(REPO_ROOT, d.generatedPdf);
      if (!existsSync(p)) errors.push({ path: prefix + ".generatedPdf", issue: "FILE_NOT_FOUND", detail: d.generatedPdf + " does not exist (resolved=" + p + ")." });
    }

    if (typeof d.reviewer !== "string" || !d.reviewer.trim().length) {
      errors.push({ path: prefix + ".reviewer", issue: "EMPTY", detail: "reviewer must be a non-empty human identifier." });
    } else if (FORBIDDEN_REVIEWERS.has(d.reviewer.trim().toLowerCase())) {
      errors.push({ path: prefix + ".reviewer", issue: "AI_TOOL_REVIEWER_REJECTED", detail: "reviewer=" + d.reviewer + " is a known AI/tool identifier; human signoff required." });
    }

    if (typeof d.reviewedAt !== "string" || !isIsoTimestamp(d.reviewedAt)) {
      errors.push({ path: prefix + ".reviewedAt", issue: "NOT_ISO_TIMESTAMP", detail: "reviewedAt=" + d.reviewedAt + " is not a valid ISO-8601 timestamp." });
    }

    if (!ALLOWED_DECISIONS.has(d.decision)) {
      errors.push({ path: prefix + ".decision", issue: "INVALID_DECISION", detail: "decision=" + d.decision + " must be PASS, FAIL, or UNCERTAIN." });
    }

    if (!d.criteria || typeof d.criteria !== "object") {
      errors.push({ path: prefix + ".criteria", issue: "NOT_OBJECT", detail: "criteria must be an object with the nine boolean fields." });
    } else {
      for (const f of CRITERIA_FIELDS) {
        if (!(f in d.criteria)) {
          errors.push({ path: prefix + ".criteria." + f, issue: "MISSING", detail: "criteria field must be present." });
          continue;
        }
        if (d.decision === "PASS" && d.criteria[f] !== true) {
          errors.push({ path: prefix + ".criteria." + f, issue: "MUST_BE_TRUE_FOR_PASS", detail: "For decision=PASS, every criterion must be true. Got " + JSON.stringify(d.criteria[f]) + "." });
        }
      }
    }

    if (d.decision === "FAIL" || d.decision === "UNCERTAIN") {
      if (typeof d.notes !== "string" || !d.notes.trim().length) {
        errors.push({ path: prefix + ".notes", issue: "EMPTY_FOR_NON_PASS", detail: "For decision=" + d.decision + ", notes must explain." });
      }
    }

    for (const f of ['generatedDocumentId','workspace','workspaceId','documentId']) {
      if (Object.prototype.hasOwnProperty.call(d, f)) {
        errors.push({ path: prefix + "." + f, issue: "FORBIDDEN_FIELD", detail: "Decision must not declare " + f + "; standalone template review must not bind to a generated document workspace." });
      }
    }
  }

  for (const c of BATCH4_CODES) {
    if (!seen.has(c)) {
      errors.push({ path: INPUT_PATH, issue: "MISSING_CODE_DECISION", detail: "No decision entry for code=" + c + "." });
    }
  }

  if (errors.length) fail(errors);

  const summary = {
    PASS: input.decisions.filter((d) => d.decision === 'PASS').length,
    FAIL: input.decisions.filter((d) => d.decision === 'FAIL').length,
    UNCERTAIN: input.decisions.filter((d) => d.decision === 'UNCERTAIN').length
  };
  console.log(JSON.stringify({
    ok: true,
    inputPath: INPUT_PATH,
    templatePath: TEMPLATE_PATH,
    totalDecisions: input.decisions.length,
    summary,
    reviewerRule: 'Human reviewer only — AI/tool reviewers rejected.',
    fidelityCompleteEvidencedScope: 'Batch 4 only; global FIDELITY_COMPLETE_EVIDENCED stays false unless all 77 cleared.'
  }, null, 2));
}

main();
