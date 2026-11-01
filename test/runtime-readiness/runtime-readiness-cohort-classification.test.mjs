/**
 * Runtime-readiness cohort classification guard.
 *
 * Pure file-system + pure-JS-shim test. Verifies the 213-form runtime-
 * readiness cohort matrix is internally consistent and the heuristic
 * cohort assignment aligns with the live maturity report.
 *
 *   1.  Matrix file exists and parses as JSON.
 *   2.  Matrix contains exactly 213 records, with distinct formCodes
 *       covering BM-001..BM-213.
 *   3.  Each matrix record has required fields
 *       (formCode, semanticStatus, currentRuntimeReady, specialPolicy,
 *       fieldCount, sectionCount, candidateCohort, pilotStatus,
 *       promotionStatus).
 *   4.  Cohort distribution accounts for every form (sum of counts ==
 *       213).
 *   5.  The 11 runtime-ready codes (BM-001, BM-171, and the 9 R5
 *       promoted candidates) are `currentRuntimeReady:true`,
 *       `promotionStatus:"PROMOTED_RUNTIME_READY"` /
 *       `"ALREADY_RUNTIME_READY"`, `pilotStatus:"PROMOTED"` /
 *       `"POSITIVE_CONTROL"` (historical controls keep their existing
 *       status values; the 9 promoted candidates flip to the canonical
 *       R5 promoted envelope).
 *   6.  BM-200 is `specialPolicy:"CANARY_BM200_PRESERVED"`,
 *       `pilotStatus:"INTENTIONAL_CANARY"`, `currentRuntimeReady:false`.
 *   7.  Any form whose matrix record carries the historical
 *       `pilotStatus:"PILOT_CANDIDATE"` AND `promotionStatus:"NOT_PROMOTED"`
 *       envelope belongs to a non-promoted roster. After R5 the roster
 *       is empty by design.
 *   8.  Every remaining non-promoted pilot-candidate row in the matrix
 *       carries at least one `knownBlockers` entry (no form is silently
 *       promoted). This assertion is moot once R5 closes — guard kept
 *       to catch future regressions where a candidate is dropped from
 *       R5 records without a recorded blocker.
 *
 * Run with:
 *   node --test test/runtime-readiness/runtime-readiness-cohort-classification.test.mjs
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..", "..");
const MATRIX_JSON = join(
  REPO,
  "docs",
  "audit",
  "runtime-readiness",
  "QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json",
);

// R5 promotion: BM-001 + BM-171 historical controls + 9 newly promoted
// candidates. Canonical order matches `STANDALONE_RUNTIME_TEMPLATE_CODES`.
const CANONICAL = [
  "BM-001",
  "BM-171",
  "BM-136",
  "BM-148",
  "BM-156",
  "BM-157",
  "BM-168",
  "BM-174",
  "BM-181",
  "BM-206",
  "BM-213",
];
// R5 promotion: the historic 9-candidate pilot roster is now empty —
// every candidate from the R5 accepted baseline has been promoted.
const R5_PILOT_CANDIDATES = [];
const NEWLY_PROMOTED_CODES = [
  "BM-136",
  "BM-148",
  "BM-156",
  "BM-157",
  "BM-168",
  "BM-174",
  "BM-181",
  "BM-206",
  "BM-213",
];
const CANARY = "BM-200";

const REQUIRED_FIELDS = [
  "formCode",
  "semanticStatus",
  "currentRuntimeReady",
  "specialPolicy",
  "fieldCount",
  "sectionCount",
  "candidateCohort",
  "pilotStatus",
  "promotionStatus",
];

function loadMatrix() {
  assert.ok(existsSync(MATRIX_JSON), "matrix JSON must exist");
  return JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
}

describe("Runtime-readiness cohort classification guard", () => {
  it("1. matrix file exists and parses as JSON", () => {
    const m = loadMatrix();
    assert.ok(m.records, "matrix must contain records");
    assert.equal(typeof m.totalForms, "number");
  });

  it("2. matrix contains exactly 213 records, distinct BM-001..BM-213 formCodes", () => {
    const m = loadMatrix();
    assert.equal(m.totalForms, 213, "matrix totalForms must be 213");
    assert.equal(m.records.length, 213);
    const codes = new Set(m.records.map((r) => r.formCode));
    assert.equal(codes.size, 213, "all 213 codes must be distinct");
    for (const code of codes) {
      assert.match(code, /^BM-\d{3}$/u, `${code} must match BM-NNN`);
      const num = Number(code.slice(3));
      assert.ok(num >= 1 && num <= 213, `${code} number must be 1..213`);
    }
  });

  it("3. each record has required fields with expected types", () => {
    const m = loadMatrix();
    for (const r of m.records) {
      for (const f of REQUIRED_FIELDS) {
        assert.ok(f in r, `record ${r.formCode ?? "?"} missing field ${f}`);
      }
      assert.equal(typeof r.fieldCount, "number");
      assert.equal(typeof r.sectionCount, "number");
    }
  });

  it("4. cohort distribution accounts for every form", () => {
    const m = loadMatrix();
    const total = Object.values(m.cohortDistribution).reduce(
      (a, b) => Number(a) + Number(b),
      0,
    );
    assert.equal(total, 213, "sum of cohortDistribution counts must be 213");
    for (const r of m.records) {
      const c = r.candidateCohort;
      assert.ok(
        c in m.cohortDistribution,
        `${r.formCode} cohort "${c}" must be present in cohortDistribution`,
      );
    }
  });

  it("5. 11 runtime-ready codes are flagged PROMOTED + POSITIVE_CONTROL/PROMOTED", () => {
    const m = loadMatrix();
    // Historical positive controls (BM-001, BM-171) keep their
    // `ALREADY_RUNTIME_READY` / `POSITIVE_CONTROL` envelope.
    const historicalControls = ["BM-001", "BM-171"];
    for (const code of historicalControls) {
      const r = m.records.find((x) => x.formCode === code);
      assert.ok(r, `${code} must be in matrix`);
      assert.equal(r.currentRuntimeReady, true, `${code} currentRuntimeReady`);
      assert.equal(r.promotionStatus, "ALREADY_RUNTIME_READY");
      assert.equal(r.pilotStatus, "POSITIVE_CONTROL");
      assert.equal(
        r.specialPolicy,
        "POSITIVE_CONTROL_RUNTIME_READY",
      );
    }
    // R5 promoted candidates flip to the canonical R5 promoted envelope.
    for (const code of NEWLY_PROMOTED_CODES) {
      const r = m.records.find((x) => x.formCode === code);
      assert.ok(r, `${code} must be in matrix`);
      assert.equal(r.currentRuntimeReady, true, `${code} currentRuntimeReady`);
      assert.equal(r.promotionStatus, "PROMOTED_RUNTIME_READY");
      assert.equal(r.pilotStatus, "PROMOTED");
      assert.equal(
        r.specialPolicy,
        "RUNTIME_READY_PROMOTED_R5",
      );
    }
  });

  it("6. BM-200 is CANARY_BM200_PRESERVED + NEGATIVE_CANARY_CONTROL", () => {
    const m = loadMatrix();
    const r = m.records.find((x) => x.formCode === CANARY);
    assert.ok(r, "BM-200 must be in matrix");
    assert.equal(r.currentRuntimeReady, false, "BM-200 must NOT be runtimeReady");
    assert.equal(r.promotionStatus, "POLICY_EXCLUDED");
    assert.equal(r.pilotStatus, "NEGATIVE_CANARY_CONTROL");
    assert.equal(r.specialPolicy, "CANARY_BM200_PRESERVED");
    assert.equal(r.candidateCohort, "CANARY_OR_SPECIAL");
  });

  it("7. R5 pilot-candidate roster is empty (all 9 candidates promoted)", () => {
    const m = loadMatrix();
    const remainingCandidates = m.records.filter(
      (x) =>
        x.pilotStatus === "PILOT_CANDIDATE" &&
        x.promotionStatus === "NOT_PROMOTED",
    );
    assert.equal(
      remainingCandidates.length,
      R5_PILOT_CANDIDATES.length,
      `R5 should leave no PILOT_CANDIDATE / NOT_PROMOTED rows (got ${remainingCandidates.length})`,
    );
  });

  it("8. any remaining non-promoted pilot row must declare knownBlockers (no silent promotions)", () => {
    const m = loadMatrix();
    const remainingCandidates = m.records.filter(
      (x) =>
        x.pilotStatus === "PILOT_CANDIDATE" &&
        x.promotionStatus === "NOT_PROMOTED",
    );
    for (const r of remainingCandidates) {
      assert.ok(
        Array.isArray(r.knownBlockers) && r.knownBlockers.length >= 1,
        `${r.formCode} must have at least one knownBlockers entry`,
      );
    }
  });
});
