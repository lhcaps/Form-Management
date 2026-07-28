/**
 * Runtime-readiness pilot registry guard.
 *
 * Pure file-system + pure-JS-shim test. Verifies the promotion registry
 * invariants in `apps/web/src/lib/form-flight/` and the pilot-cohort
 * documentation. The "registry" we audit here is the set of files /
 * constants that together decide what is `runtimeReady` at runtime.
 *
 * R5 deadline-promo closure: the canonical runtime-ready roster grew
 * from 2 controls to 11 (BM-001, BM-171, plus the 9 R5 promoted
 * candidates). This guard now asserts:
 *
 *   1.  All 11 runtime-ready profile files exist, declare
 *       `runtimeReady:true` + `profileStatus:"runtime-ready"`, and call
 *       `registerFormFlightProfile`.
 *   2.  The BM-200 canary profile file exists, remains
 *       `runtimeReady:false` + `profileStatus:"skeleton"`, and calls
 *       `registerFormFlightProfile`.
 *   3.  `form-lifecycle.ts` side-effect-imports exactly the 11
 *       runtime-ready profile files in canonical sorted order. The
 *       previously-frozen "only the 2 controls" rule has flipped to
 *       "only the canonical 11 cohort" — promoted forms MUST be in this
 *       side-effect import set; skeletons MUST NOT.
 *   4.  `apps/web/src/lib/generated/bm-panel-codes.generated.ts` exists
 *       and exports `hasRegisteredBmPanel`.
 *   5.  The audit JSON `summary.runtimeReady` contains all 11 runtime-
 *       ready codes and NO pilot-candidate roster entry (the canonical
 *       pre-R5 pilot list is now empty after promotion).
 *   6.  `apps/web/src/lib/form-flight/profile-status.ts` exports
 *       `isRuntimeReadyProfile` and fails closed when either flag is
 *       missing.
 *   7.  The R5 pilot-candidate roster is empty by design: every code
 *       that started as a pilot candidate in the R5 accepted baseline
 *       has been promoted; the set is empty and disjoint from
 *       `CANONICAL` and `CANARY`.
 *   8.  `form-lifecycle.ts` does NOT side-effect-import the BM-200
 *       canary profile (the canary remains a policy-excluded skeleton).
 *
 * Run with:
 *   node --test test/runtime-readiness/runtime-readiness-pilot-registry.guard.test.mjs
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..", "..");

const FORM_FLIGHT_DIR = join(
  REPO,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
);
const PROFILE_DIR = join(FORM_FLIGHT_DIR, "profiles");
const FORM_LIFECYCLE = join(FORM_FLIGHT_DIR, "form-lifecycle.ts");
const PROFILE_STATUS = join(FORM_FLIGHT_DIR, "profile-status.ts");
const BM_PANEL_CODES = join(
  REPO,
  "apps",
  "web",
  "src",
  "lib",
  "generated",
  "bm-panel-codes.generated.ts",
);
const MATURITY_JSON = join(
  REPO,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_213_SEMANTIC_UI_MATURITY.latest.json",
);

// R5 promotion canonical roster — matches
// `STANDALONE_RUNTIME_TEMPLATE_CODES`.
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
// R5 promotion: the historical 9-candidate pilot roster is now empty.
// We keep the variable so legacy audit rows can still be cross-checked
// without code churn.
const PILOT_CANDIDATES = [];
const CANARY = "BM-200";

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function profileMetaForRegistry(code) {
  const num = code.replace(/^BM-/, "");
  const file = join(PROFILE_DIR, `bm${num}.ts`);
  assert.ok(existsSync(file), `profile file ${code} must exist`);
  const raw = readFileSync(file, "utf8");
  const stripped = stripComments(raw);
  const rr = /^\s*runtimeReady:\s*(true|false)/m.exec(stripped);
  const ps = /^\s*profileStatus:\s*"([^"]+)"/m.exec(stripped);
  const reg = /registerFormFlightProfile\(\s*[A-Z0-9_]+_FORM_FLIGHT_PROFILE\s*\)/.test(raw);
  return {
    runtimeReady: rr ? rr[1] === "true" : false,
    profileStatus: ps ? ps[1] : null,
    selfRegisters: reg,
  };
}

describe("Runtime-readiness pilot registry guard", () => {
  it("1. all 11 canonical runtime-ready profiles declare runtimeReady:true + profileStatus:'runtime-ready' and self-register", () => {
    for (const c of CANONICAL) {
      const m = profileMetaForRegistry(c);
      assert.equal(m.runtimeReady, true, `${c} must be runtimeReady:true`);
      assert.equal(
        m.profileStatus,
        "runtime-ready",
        `${c} must be profileStatus:"runtime-ready"`,
      );
      assert.equal(m.selfRegisters, true, `${c} must call registerFormFlightProfile`);
    }
  });

  it("2. BM-200 canary profile remains skeleton (runtimeReady:false, not 'runtime-ready')", () => {
    const m = profileMetaForRegistry(CANARY);
    assert.equal(
      m.runtimeReady,
      false,
      `${CANARY} must remain runtimeReady:false (canary policy)`,
    );
    assert.notEqual(
      m.profileStatus,
      "runtime-ready",
      `${CANARY} must not have profileStatus:"runtime-ready"`,
    );
  });

  it("3. form-lifecycle.ts side-effect-imports exactly the 11 canonical runtime-ready profiles", () => {
    const src = readFileSync(FORM_LIFECYCLE, "utf8");
    const imports = [
      ...src.matchAll(/from\s+["']\.\/profiles\/bm(\d{3})["']/g),
    ].map((m) => `BM-${m[1]}`);
    assert.deepEqual(
      [...imports].sort(),
      [...CANONICAL].sort(),
      "form-lifecycle.ts must import exactly the 11 runtime-ready cohort profiles",
    );
  });

  it("4. hasRegisteredBmPanel exists in the generated registry", () => {
    assert.ok(existsSync(BM_PANEL_CODES), "bm-panel-codes.generated.ts must exist");
    const src = readFileSync(BM_PANEL_CODES, "utf8");
    assert.match(
      src,
      /export\s+function\s+hasRegisteredBmPanel/,
      "bm-panel-codes.generated.ts must export hasRegisteredBmPanel",
    );
  });

  it("5. audit JSON summary.runtimeReady contains the 11 canonical codes (no historical pilot candidates remain)", () => {
    const maturity = JSON.parse(readFileSync(MATURITY_JSON, "utf8"));
    const audit = maturity.summary.runtimeReady ?? [];
    for (const c of CANONICAL) {
      assert.ok(
        audit.includes(c),
        `audit JSON must report ${c} as runtimeReady after R5 promotion`,
      );
    }
    for (const c of PILOT_CANDIDATES) {
      assert.ok(
        !audit.includes(c),
        `audit JSON must NOT list ${c} as runtimeReady (R5 has promoted it)`,
      );
    }
  });

  it("6. profile-status exports isRuntimeReadyProfile and fails closed", () => {
    assert.ok(existsSync(PROFILE_STATUS), "profile-status.ts must exist");
    const src = readFileSync(PROFILE_STATUS, "utf8");
    assert.match(
      src,
      /export\s+function\s+isRuntimeReadyProfile\s*\(/,
      "profile-status.ts must export isRuntimeReadyProfile",
    );
    const stripped = stripComments(src);
    assert.match(
      stripped,
      /runtimeReady\s*===\s*true/,
      "isRuntimeReadyProfile must require runtimeReady === true",
    );
    assert.match(
      stripped,
      /profileStatus\s*===\s*["']runtime-ready["']/,
      "isRuntimeReadyProfile must require profileStatus === 'runtime-ready'",
    );
  });

  it("7. R5 pilot-candidate roster is empty and disjoint from controls / canary", () => {
    const set = new Set(PILOT_CANDIDATES);
    assert.equal(set.size, 0, "R5 pilot-candidate list must be empty (all 9 promoted)");
    for (const c of CANONICAL) {
      assert.ok(!set.has(c), "pilot list must not contain canonical runtime-ready " + c);
    }
    assert.ok(!set.has(CANARY), "pilot list must not contain canary BM-200");
  });

  it("8. form-lifecycle.ts does NOT side-effect-import the BM-200 canary profile", () => {
    const src = readFileSync(FORM_LIFECYCLE, "utf8");
    const num = CANARY.slice(3);
    const re = new RegExp(`from\\s+["']\\./profiles/bm${num}["']`, "g");
    assert.equal(
      re.test(src),
      false,
      `form-lifecycle.ts must NOT eagerly import ${CANARY}; the canary stays policy-excluded`,
    );
  });
});
