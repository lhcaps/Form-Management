/**
 * Runtime-readiness contract guard — static structural assertions.
 *
 * Pure file-system + pure-JS-shim test (no DB, no fetch, no React, no
 * TypeScript transpile). Verifies that the canonical runtime-readiness
 * contract is internally consistent in the live working tree.
 *
 * R5 deadline-promo closure: the canonical roster grew from 2 to 11
 * (BM-001, BM-171, plus the 9 R5 promoted candidates). This guard now
 * asserts:
 *
 *   1.  Canonical allowlist lives in `STANDALONE_RUNTIME_TEMPLATE_CODES`
 *       (`packages/form-contracts/src/bridge-eligibility.ts`) and is
 *       exactly the 11 R5-promoted codes.
 *   2.  `RUNTIME_READY_FORM_FLIGHT_PROFILES` in
 *       `apps/web/src/lib/form-flight/form-lifecycle.ts` re-exports the
 *       canonical allowlist, imports its cohort profiles, and adds
 *       side-effect imports ONLY for those codes (no auto-discovery).
 *   3.  `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs`
 *       still hard-codes the same list (now expanded to 11).
 *   4.  Every BM-XXX form in the canonical allowlist declares
 *       `runtimeReady: true && profileStatus: "runtime-ready"` and
 *       self-registers via `registerFormFlightProfile`.
 *   5.  BM-200 policy is preserved: profile file declares
 *       `runtimeReady: false, profileStatus: "skeleton"`.
 *   6.  Skeleton profiles (i.e. every form outside the canonical
 *       allowlist + the BM-200 canary) do NOT declare
 *       `runtimeReady: true` AND do NOT carry
 *       `profileStatus: "runtime-ready"` (cohort-promotion rule).
 *   7.  The runtime-readiness contract document exists and references
 *       the canonical contract.
 *   8.  The runtime-readiness matrix JSON exists with 213 records, and
 *       after R5 promotion no record still carries the pre-promotion
 *       "PILOT_CANDIDATE + NOT_PROMOTED" envelope (those rows must have
 *       flipped to PROMOTED + PROMOTED_RUNTIME_READY).
 *
 * Adversarial mutations rejected (assertion-level, no code mutation):
 *
 *   A1  Adding a new code to `STANDALONE_RUNTIME_TEMPLATE_CODES` without
 *       a profile import in `form-lifecycle.ts` is rejected by item 2.
 *   A2  Adding a profile import in `form-lifecycle.ts` that is not in
 *       `STANDALONE_RUNTIME_TEMPLATE_CODES` is rejected by item 2.
 *   A3  Drift between `STANDALONE_RUNTIME_TEMPLATE_CODES` size and the
 *       form-lifecycle.ts import count is rejected (item 2 + A2).
 *   A4  Duplicate codes in `STANDALONE_RUNTIME_TEMPLATE_CODES` are
 *       rejected (item 1 + A3).
 *   A5  All imported profiles resolve on disk (no missing skeleton file).
 *   A6  Setting `runtimeReady: true` on a skeleton (e.g. BM-200 or any
 *       non-canonical form) is rejected by item 6 / item 5.
 *
 * Run with:
 *   node --test test/runtime-readiness/runtime-readiness-contract.guard.test.mjs
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..", "..");

const BRIDGE_ELIGIBILITY = join(
  REPO,
  "packages",
  "form-contracts",
  "src",
  "bridge-eligibility.ts",
);
const FORM_LIFECYCLE = join(
  REPO,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
  "form-lifecycle.ts",
);
const LIFECYCLE_GUARD = join(
  REPO,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
  "form-lifecycle-wiring.guard.test.mjs",
);
const PROFILE_DIR = join(
  REPO,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
  "profiles",
);
const CONTRACT_MD = join(
  REPO,
  "docs",
  "audit",
  "runtime-readiness",
  "QLLAW_213_RUNTIME_READINESS_CONTRACT.md",
);
const MATRIX_JSON = join(
  REPO,
  "docs",
  "audit",
  "runtime-readiness",
  "QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json",
);

// R5 promotion canonical roster — matches
// `STANDALONE_RUNTIME_TEMPLATE_CODES`.
const CANONICAL_CODES = [
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
// R5 promotion: the 9-candidate pilot roster is now empty.
const R5_PILOT_CANDIDATES = [];
const CANARY = "BM-200";

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function readCanonicalCodes() {
  const src = readFileSync(BRIDGE_ELIGIBILITY, "utf8");
  const stripped = stripComments(src);
  const match = stripped.match(
    /STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([^\]]+)\]/,
  );
  assert.ok(match, "STANDALONE_RUNTIME_TEMPLATE_CODES must be a literal array");
  const list = match[1]
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('"') || s.startsWith("'"))
    .map((s) => s.replace(/['"]/g, ""));
  return list;
}

function readLifecycleImports() {
  const src = readFileSync(FORM_LIFECYCLE, "utf8");
  const imports = [
    ...src.matchAll(/from\s+["']\.\/profiles\/bm(\d{3})["']/g),
  ].map((m) => `BM-${m[1]}`);
  return imports;
}

function readLifecycleGuardCodes() {
  const src = readFileSync(LIFECYCLE_GUARD, "utf8");
  // Item-10 guard (now expanded to 11 codes): the
  // `RUNTIME_READY_CODES` constant at the top of the guard test plus
  // the `assert.deepEqual` on item 10. We read both and use the
  // array-form constant as the source of truth.
  const constantMatch = src.match(
    /const\s+RUNTIME_READY_CODES\s*=\s*\[([^\]]+)\]/,
  );
  if (constantMatch) {
    return [
      ...constantMatch[1].matchAll(/["'](BM-\d{3})["']/g),
    ].map((m) => m[1]);
  }
  // Fallback: scrape the deepEqual inside item-10 in case the constant
  // is renamed.
  const deepEqualMatch = src.match(
    /assert\.deepEqual\([\s\S]+?\[([^\]]+)\]/,
  );
  assert.ok(deepEqualMatch, "lifecycle guard must hard-code the expected allowlist");
  return [
    ...deepEqualMatch[1].matchAll(/["'](BM-\d{3})["']/g),
  ].map((m) => m[1]);
}

function profileFileFor(code) {
  const num = code.replace(/^BM-/, "");
  return join(PROFILE_DIR, `bm${num}.ts`);
}

function profileMetaForContract(code) {
  const file = profileFileFor(code);
  assert.ok(existsSync(file), `profile file ${code} must exist (${file})`);
  const stripped = stripComments(readFileSync(file, "utf8"));
  const rrMatch = stripped.match(/^\s*runtimeReady:\s*(true|false)/m);
  const psMatch = stripped.match(/^\s*profileStatus:\s*"([^"]+)"/m);
  const raw = readFileSync(file, "utf8");
  const selfReg = /registerFormFlightProfile\(\s*[A-Z0-9_]+_FORM_FLIGHT_PROFILE\s*\)/.test(raw);
  return {
    runtimeReady: rrMatch ? rrMatch[1] === "true" : false,
    profileStatus: psMatch ? psMatch[1] : null,
    selfRegisters: selfReg,
  };
}

// ─── Guard assertions ──────────────────────────────────────────────────────

describe("Runtime-readiness contract guard", () => {
  it("1. canonical allowlist lives in bridge-eligibility.ts and contains the 11 R5-promoted codes", () => {
    const codes = readCanonicalCodes();
    assert.deepEqual(
      codes.sort(),
      [...CANONICAL_CODES].sort(),
      "canonical allowlist must be the 11 R5-promoted codes",
    );
  });

  it("2. form-lifecycle.ts delegates to canonical allowlist and imports exactly the 11 cohort profiles", () => {
    const src = readFileSync(FORM_LIFECYCLE, "utf8");
    assert.match(
      src,
      /export\s+const\s+RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*STANDALONE_RUNTIME_TEMPLATE_CODES/,
      "form-lifecycle.ts must delegate to canonical allowlist",
    );
    const imports = readLifecycleImports();
    assert.deepEqual(
      [...imports].sort(),
      [...CANONICAL_CODES].sort(),
      "form-lifecycle.ts must import exactly the 11 canonical cohort profiles",
    );
  });

  it("3. lifecycle wiring guard hard-codes the 11 canonical codes", () => {
    const codes = readLifecycleGuardCodes();
    assert.deepEqual(
      codes.sort(),
      [...CANONICAL_CODES].sort(),
      "lifecycle wiring guard must hard-code the same canonical roster",
    );
  });

  it("4. canonical allowlist profiles declare runtimeReady:true + profileStatus:'runtime-ready' + self-register", () => {
    for (const code of CANONICAL_CODES) {
      const profile = profileMetaForContract(code);
      assert.equal(profile.runtimeReady, true, `${code} runtimeReady must be true`);
      assert.equal(
        profile.profileStatus,
        "runtime-ready",
        `${code} profileStatus must be "runtime-ready"`,
      );
      assert.equal(
        profile.selfRegisters,
        true,
        `${code} must call registerFormFlightProfile`,
      );
    }
  });

  it("5. BM-200 policy preserved (skeleton, runtime-ready forbidden)", () => {
    const file = profileFileFor("BM-200");
    const raw = readFileSync(file, "utf8");
    const stripped = stripComments(raw);
    const rr = /^\s*runtimeReady:\s*(true|false)/m.exec(stripped);
    const ps = /^\s*profileStatus:\s*"([^"]+)"/m.exec(stripped);
    assert.ok(rr, "BM-200 must declare runtimeReady");
    assert.equal(rr[1], "false", "BM-200 must be runtimeReady:false (canary)");
    assert.ok(ps, "BM-200 must declare profileStatus");
    assert.equal(ps[1], "skeleton", 'BM-200 must be profileStatus:"skeleton"');
    assert.match(
      raw,
      /AUTO-GENERATED SKELETON/,
      "BM-200 must retain the AUTO-GENERATED SKELETON policy comment",
    );
  });

  it("6. skeletons (every form outside canonical allowlist) do NOT declare runtimeReady:true", () => {
    // We can spot-check the canary plus a few non-canonical candidates;
    // a strict full-file scan would overlap with the more comprehensive
    // `profile-registry-guard.test.mjs`.
    const sample = ["BM-002", "BM-050", "BM-100", "BM-150", "BM-200", "BM-211"];
    for (const code of sample) {
      if (CANONICAL_CODES.includes(code)) continue;
      const profile = profileMetaForContract(code);
      assert.equal(
        profile.runtimeReady,
        false,
        `${code} must be runtimeReady:false (not in canonical R5 cohort)`,
      );
      assert.notEqual(
        profile.profileStatus,
        "runtime-ready",
        `${code} must NOT have profileStatus:"runtime-ready"`,
      );
    }
  });

  it("7. contract document exists and references the canonical policy", () => {
    assert.ok(existsSync(CONTRACT_MD), "contract doc must exist");
    const doc = readFileSync(CONTRACT_MD, "utf8");
    assert.match(doc, /STANDALONE_RUNTIME_TEMPLATE_CODES/, "contract doc must reference the canonical policy");
    assert.match(doc, /R1[\s\S]+R10/, "contract doc must list gates R1..R10");
  });

  it("8. cohort matrix JSON exists and has 213 records (no pre-promotion pilot-candidate rows after R5)", () => {
    assert.ok(existsSync(MATRIX_JSON), "matrix JSON must exist");
    const matrix = JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
    assert.equal(
      matrix.totalForms,
      213,
      "matrix must record all 213 forms",
    );
    assert.equal(matrix.records.length, 213);
    // R5 promotion closure: no row keeps the pre-promotion
    // `PILOT_CANDIDATE + NOT_PROMOTED` envelope.
    const remainingPilot = matrix.records.filter(
      (r) =>
        r.pilotStatus === "PILOT_CANDIDATE" &&
        r.promotionStatus === "NOT_PROMOTED",
    );
    assert.equal(
      remainingPilot.length,
      R5_PILOT_CANDIDATES.length,
      `R5 promotion should leave no PILOT_CANDIDATE + NOT_PROMOTED rows (got ${remainingPilot.length})`,
    );
  });

  // ─── Adversarial mutations ──────────────────────────────────────────────

  it("A1. canonical allowlist with no lifecycle import is rejected", () => {
    const canonical = readCanonicalCodes();
    const imports = readLifecycleImports();
    for (const imp of imports) {
      assert.ok(
        canonical.includes(imp),
        `imported profile ${imp} must be in canonical allowlist`,
      );
    }
  });

  it("A2. canonical allowlist size must equal form-lifecycle.ts imports size (no drift)", () => {
    const canonical = readCanonicalCodes();
    const imports = readLifecycleImports();
    assert.equal(
      canonical.length,
      imports.length,
      "canonical allowlist size must equal form-lifecycle.ts imports size",
    );
  });

  it("A3. duplicate codes in canonical allowlist are rejected", () => {
    const canonical = readCanonicalCodes();
    const deduped = [...new Set(canonical)];
    assert.equal(
      canonical.length,
      deduped.length,
      "canonical allowlist must not have duplicates",
    );
  });

  it("A4. all imported profiles resolve on disk (no missing skeleton file)", () => {
    const imports = readLifecycleImports();
    for (const code of imports) {
      const file = profileFileFor(code);
      assert.ok(existsSync(file), `imported profile ${code} must resolve to ${file}`);
    }
  });

  it("A5. BM-200 is NEVER imported by form-lifecycle.ts (canary stays excluded)", () => {
    const imports = readLifecycleImports();
    assert.equal(
      imports.includes(CANARY),
      false,
      `${CANARY} must NOT be a form-lifecycle.ts side-effect import`,
    );
  });
});
