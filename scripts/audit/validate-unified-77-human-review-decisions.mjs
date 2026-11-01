// scripts/audit/validate-unified-77-human-review-decisions.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Validates QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.input.json
//
// Rules (exit 1 on any violation):
//   1. Input file absent  → exit 0, status NEED_HUMAN_INPUT (no decisions to apply)
//   2. Input file present → strict schema validation (see below)
//
// Present-mode rules:
//   - decisions count must equal 77
//   - codes must exactly match the 77 INPUT_CONNECTED_PASS codes from the matrix
//   - no duplicate codes
//   - reviewer must be non-empty human identifier (not AI/tool)
//   - reviewedAt must be valid ISO-8601
//   - decision must be PASS | FAIL | UNCERTAIN
//   - PASS requires all 9 criteria === true
//   - FAIL/UNCERTAIN requires non-empty notes
//   - sourcePdf/generatedPdf paths must exist or be explicitly marked missing
//   - input must not declare FIDELITY_COMPLETE_EVIDENCED / global flag
//   - input must not declare generatedDocumentId / workspace fields
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT      = resolve(process.cwd()).replace(/\\/g, "/");
const OUT       = `${ROOT}/docs/audit/unified-bm-workspace`;
const TEMPLATE  = `${OUT}/QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.json`;
const INPUT     = `${OUT}/QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.input.json`;
const PACK     = `${OUT}/QLLAW_UNIFIED_77_HUMAN_REVIEW_PACK.latest.json`;
const MATRIX    = `${OUT}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;

function readJson(p) {
  try { return JSON.parse(readFileSync(p, "utf8")); }
  catch (e) { return { __readError: e.message }; }
}
function fail(errors) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

const CRITERIA_FIELDS = [
  "samePageCountOrAcceptedDelta",
  "headerLooksCorrect",
  "titleLooksCorrect",
  "bodyLayoutLooksCorrect",
  "tablesLookCorrect",
  "footerSignatureLooksCorrect",
  "noMissingTextVisible",
  "noObviousOverflowOrClipping",
  "acceptableForLegalDemo",
];

const ALLOWED_DECISIONS   = new Set(["PASS","FAIL","UNCERTAIN"]);
const FORBIDDEN_REVIEWERS = new Set(["ai","cursor","gpt","tool","assistant","claude","chatgpt","llm","gemini"]);

function isIsoTimestamp(s) {
  if (typeof s !== "string" || s.length < 10) return false;
  return !Number.isNaN(new Date(s).getTime());
}

// ── Load reference data ─────────────────────────────────────────────────────
const matrix = readJson(MATRIX);
if (matrix.__readError) fail([{ path: MATRIX, issue: "MATRIX_UNREADABLE", detail: matrix.__readError }]);

// All 77 INPUT_CONNECTED_PASS codes from matrix
const EXPECTED_CODES = new Set(
  matrix.rows
    .filter(r => r.status === "INPUT_CONNECTED_PASS")
    .map(r => r.templateCode)
);
if (EXPECTED_CODES.size !== 77) {
  fail([{
    issue: "MATRIX_CODE_COUNT_MISMATCH",
    detail: `Expected 77 INPUT_CONNECTED_PASS codes from matrix, got ${EXPECTED_CODES.size}.`
  }]);
}

// ── Check input file presence ────────────────────────────────────────────────
if (!existsSync(INPUT)) {
  console.log(JSON.stringify({
    ok: true,
    status: "NEED_HUMAN_INPUT",
    detail: "Input decisions file not found. Human reviewer must complete decisions.",
    inputPath: INPUT,
    templatePath: TEMPLATE,
  }, null, 2));
  process.exit(0);
}

// ── Load template ──────────────────────────────────────────────────────────
const template = readJson(TEMPLATE);
if (template.__readError) fail([{ path: TEMPLATE, issue: "TEMPLATE_UNREADABLE", detail: template.__readError }]);

// ── Load input ──────────────────────────────────────────────────────────────
const input = readJson(INPUT);
if (input.__readError) fail([{ path: INPUT, issue: "INPUT_UNREADABLE", detail: input.__readError }]);

// ── Structural checks ───────────────────────────────────────────────────────
const errors = [];

// Forbidden top-level fields
for (const f of ["fidelityCompleteEvidenced","FIDELITY_COMPLETE_EVIDENCED","globalEvidenced","fidelityCompleteTrue"]) {
  if (Object.prototype.hasOwnProperty.call(input, f)) {
    errors.push({ path: INPUT, issue: "FORBIDDEN_TOP_LEVEL_FIELD", detail: `Input must not declare ${f}.` });
  }
}

if (!Array.isArray(input.decisions)) {
  fail([{ path: INPUT, issue: "INPUT_SHAPE_INVALID", detail: "input.decisions must be an array." }]);
}

if (input.decisions.length !== 77) {
  errors.push({
    path: INPUT,
    issue: "DECISION_COUNT_MISMATCH",
    detail: `Expected 77 decisions, got ${input.decisions.length}.`
  });
}

// ── Per-decision validation ─────────────────────────────────────────────────
const seen = new Set();
for (const [idx, d] of input.decisions.entries()) {
  const prefix = `decisions[${idx}]`;

  if (!d || typeof d !== "object") {
    errors.push({ path: prefix, issue: "NOT_OBJECT" }); continue;
  }

  // code must be present
  if (!d.code || typeof d.code !== "string") {
    errors.push({ path: prefix, issue: "MISSING_CODE" });
  } else {
    if (!EXPECTED_CODES.has(d.code)) {
      errors.push({ path: prefix + ".code", issue: "CODE_NOT_IN_MATRIX", detail: `code=${d.code} is not in matrix INPUT_CONNECTED_PASS list.` });
    }
    if (seen.has(d.code)) {
      errors.push({ path: prefix + ".code", issue: "DUPLICATE_CODE", detail: `code=${d.code} appears more than once.` });
    }
    seen.add(d.code);
  }

  // sourcePdf / generatedPdf
  if (typeof d.sourcePdf !== "string" || !d.sourcePdf.trim()) {
    errors.push({ path: prefix + ".sourcePdf", issue: "EMPTY", detail: "sourcePdf must be a non-empty string." });
  } else {
    const sp = resolve(ROOT, d.sourcePdf);
    if (!existsSync(sp)) {
      errors.push({ path: prefix + ".sourcePdf", issue: "FILE_NOT_FOUND", detail: `${d.sourcePdf} does not exist (resolved=${sp}).` });
    }
  }

  if (typeof d.generatedPdf !== "string" || !d.generatedPdf.trim()) {
    errors.push({ path: prefix + ".generatedPdf", issue: "EMPTY", detail: "generatedPdf must be a non-empty string." });
  } else {
    const gp = resolve(ROOT, d.generatedPdf);
    if (!existsSync(gp)) {
      errors.push({ path: prefix + ".generatedPdf", issue: "FILE_NOT_FOUND", detail: `${d.generatedPdf} does not exist (resolved=${gp}).` });
    }
  }

  // reviewer
  if (typeof d.reviewer !== "string" || !d.reviewer.trim()) {
    errors.push({ path: prefix + ".reviewer", issue: "EMPTY", detail: "reviewer must be a non-empty human identifier." });
  } else if (FORBIDDEN_REVIEWERS.has(d.reviewer.trim().toLowerCase())) {
    errors.push({ path: prefix + ".reviewer", issue: "AI_TOOL_REVIEWER_REJECTED", detail: `reviewer=${d.reviewer} is a known AI/tool identifier; human signoff required.` });
  }

  // reviewedAt
  if (typeof d.reviewedAt !== "string" || !isIsoTimestamp(d.reviewedAt)) {
    errors.push({ path: prefix + ".reviewedAt", issue: "NOT_ISO_TIMESTAMP", detail: `reviewedAt=${d.reviewedAt} is not a valid ISO-8601 timestamp.` });
  }

  // decision
  if (!ALLOWED_DECISIONS.has(d.decision)) {
    errors.push({ path: prefix + ".decision", issue: "INVALID_DECISION", detail: `decision=${d.decision} must be PASS, FAIL, or UNCERTAIN.` });
  }

  // criteria
  if (!d.criteria || typeof d.criteria !== "object") {
    errors.push({ path: prefix + ".criteria", issue: "NOT_OBJECT", detail: "criteria must be an object with the nine boolean fields." });
  } else {
    for (const f of CRITERIA_FIELDS) {
      if (!(f in d.criteria)) {
        errors.push({ path: prefix + ".criteria." + f, issue: "MISSING", detail: `criteria field '${f}' must be present.` });
      } else if (d.decision === "PASS" && d.criteria[f] !== true) {
        errors.push({
          path: prefix + ".criteria." + f,
          issue: "MUST_BE_TRUE_FOR_PASS",
          detail: `For decision=PASS, criteria.${f} must be true. Got ${JSON.stringify(d.criteria[f])}.`
        });
      }
    }
  }

  // notes
  if (d.decision === "FAIL" || d.decision === "UNCERTAIN") {
    if (typeof d.notes !== "string" || !d.notes.trim()) {
      errors.push({ path: prefix + ".notes", issue: "EMPTY_FOR_NON_PASS", detail: `For decision=${d.decision}, notes must explain.` });
    }
  }

  // forbidden fields
  for (const f of ["generatedDocumentId","workspace","workspaceId","documentId"]) {
    if (Object.prototype.hasOwnProperty.call(d, f)) {
      errors.push({ path: prefix + "." + f, issue: "FORBIDDEN_FIELD", detail: `Decision must not declare ${f}.` });
    }
  }
}

// Check all expected codes have a decision
for (const code of EXPECTED_CODES) {
  if (!seen.has(code)) {
    errors.push({ path: INPUT, issue: "MISSING_CODE_DECISION", detail: `No decision entry for code=${code}.` });
  }
}

if (errors.length) fail(errors);

// ── Summary ─────────────────────────────────────────────────────────────────
const summary = {
  PASS:      input.decisions.filter(d => d.decision === "PASS").length,
  FAIL:      input.decisions.filter(d => d.decision === "FAIL").length,
  UNCERTAIN: input.decisions.filter(d => d.decision === "UNCERTAIN").length,
};

console.log(JSON.stringify({
  ok: true,
  inputPath: INPUT,
  templatePath: TEMPLATE,
  totalDecisions: input.decisions.length,
  summary,
  reviewerRule: "Human reviewer only — AI/tool identifiers rejected.",
  fidelityCompleteEvidencedScope: "All 77 forms; global FIDELITY_COMPLETE_EVIDENCED stays false unless all 77 PASS.",
}, null, 2));
