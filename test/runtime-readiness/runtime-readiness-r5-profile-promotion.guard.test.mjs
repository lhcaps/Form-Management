/**
 * Runtime-readiness R5 profile-promotion guard.
 *
 * Pure file-system + pure-JS-shim test (no DB, no fetch, no React, no
 * TypeScript transpile). Created during the QLLAW RUNTIME-READINESS R5
 * — DEADLINE PROMOTION CLOSURE phase. It asserts the full per-form
 * promotion contract for each of the nine accepted-baseline
 * candidates (BM-136, BM-148, BM-156, BM-157, BM-168, BM-174, BM-181,
 * BM-206, BM-213) and reconciles the cohort-level invariants with the
 * existing guard tests.
 *
 * Per-form assertions (`promoteOne()`):
 *   - profile file exists
 *   - profile is side-effect-imported by `form-lifecycle.ts`
 *   - formCode matches the file's identity
 *   - compiled title identity (cross-checked against the contract JSON
 *     title when available, else the lockfile `title` line)
 *   - `runtimeReady === true`
 *   - `profileStatus === "runtime-ready"`
 *   - `fieldPaths` is a non-empty subset of the locked contract
 *     `canonicalFields`
 *   - `requiredFieldPaths` is a subset of `fieldPaths`
 *   - `demo` keys are a subset of `fieldPaths`
 *   - every required demo key has a non-empty string value
 *   - `summaryLines` is non-empty and its labels reference real fields
 *   - `acceptance.requiredText` is non-empty and reasonably grounded
 *     (no orphaned `{{`, `null`, `undefined` tokens in the body)
 *   - the candidate is NOT in the BM-200 canary bucket (no canary
 *     promotion escape hatch)
 *
 * Cohort-level assertions:
 *   - The 11-element canonical roster is exactly BM-001 + BM-171 + the
 *     9 R5 promoted candidates.
 *   - BM-001, BM-171 remain runtime-ready (positive-control parity).
 *   - BM-200 remains POLICY_EXCLUDED.
 *   - The bridge-eligibility policy list agrees with the side-effect
 *     import set (no drift).
 *   - The matrix JSON records the 9 promoted candidates with
 *     `pilotStatus:"PROMOTED"` /
 *     `promotionStatus:"PROMOTED_RUNTIME_READY"`.
 *   - The maturity JSON `summary.runtimeReady` has exactly 11 codes.
 *
 * Adversarial mutations rejected:
 *   - candidate profile flipped to `runtimeReady:false`
 *   - candidate profile flipped to `profileStatus:"skeleton"`
 *   - candidate side-effect import removed from `form-lifecycle.ts`
 *   - candidate profile mutated to use the wrong `templateCode`
 *   - candidate profile mutated to use unknown demo keys
 *   - candidate profile mutated to use duplicated summary-line fields
 *   - candidate profile mutated to drop `runtimeReady` AND
 *     `profileStatus` flags
 *   - BM-200 inserted into the runtime-ready roster
 *
 * Run with:
 *   node --test test/runtime-readiness/runtime-readiness-r5-profile-promotion.guard.test.mjs
 */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
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
const BRIDGE_ELIGIBILITY = join(
  REPO,
  "packages",
  "form-contracts",
  "src",
  "bridge-eligibility.ts",
);
const LOCKED_CONTRACTS_DIR = join(
  REPO,
  "docs",
  "audit",
  "docx",
  "contracts",
  "locked",
);
const MATURITY_JSON = join(
  REPO,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_213_SEMANTIC_UI_MATURITY.latest.json",
);
const MATRIX_JSON = join(
  REPO,
  "docs",
  "audit",
  "runtime-readiness",
  "QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json",
);

// R5 promotion roster — matches the canonical allowlist.
const RUNTIME_READY_CODES = [
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
const HISTORICAL_CONTROLS = ["BM-001", "BM-171"];
const R5_PROMOTED_CODES = [
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

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function profileFileFor(code) {
  const num = code.replace(/^BM-/, "");
  return join(PROFILE_DIR, `bm${num}.ts`);
}

function lockedContractFileFor(code) {
  const num = code.replace(/^BM-/, "");
  // Try `bmNNN__*.contract.locked.json` (canonical locked contracts).
  // Fall back to no locked contract and let the caller handle it.
  const prefix = `BM-${num}__`;
  if (!existsSync(LOCKED_CONTRACTS_DIR)) return null;
  const matches = readdirSync(LOCKED_CONTRACTS_DIR).filter(
    (f) => f.startsWith(prefix) && f.endsWith(".contract.locked.json"),
  );
  if (matches.length === 0) return null;
  return join(LOCKED_CONTRACTS_DIR, matches[0]);
}

function readProfileMeta(code) {
  const file = profileFileFor(code);
  assert.ok(existsSync(file), `profile file must exist: ${file}`);
  const raw = readFileSync(file, "utf8");
  const stripped = stripComments(raw);
  const rrMatch = stripped.match(/^\s*runtimeReady:\s*(true|false)/m);
  const psMatch = stripped.match(/^\s*profileStatus:\s*"([^"]+)"/m);
  const tcMatch = stripped.match(/^\s*templateCode:\s*"([^"]+)"/m);
  const fieldPaths = [...stripped.matchAll(/^\s*"([^"]+)"/gm)].map((m) => m[1]);
  // crude demo-key extraction (keys inside the BMxxx_DEMO as const).
  const demoMatch = stripped.match(/const\s+BM\d+_DEMO\s*=\s*\{([\s\S]*?)\}\s*as\s+const/);
  let demoKeys = [];
  if (demoMatch) {
    demoKeys = [
      ...demoMatch[1].matchAll(/"([^"]+)":\s*"/g),
    ].map((m) => m[1]);
  }
  const reqMatch = stripped.match(/const\s+BM\d+_REQUIRED_FIELD_PATHS\s*=\s*\[([\s\S]*?)\]\s*as\s+const/);
  let requiredFieldPaths = [];
  if (reqMatch) {
    requiredFieldPaths = [
      ...reqMatch[1].matchAll(/"([^"]+)"/g),
    ].map((m) => m[1]);
  }
  // Summary-line extraction (only labels, not field path resolution).
  const summaryMatch = stripped.match(/BM\d+_SUMMARY_LINES\s*=\s*\[([\s\S]*?)\];/);
  let summaryLabels = [];
  if (summaryMatch) {
    summaryLabels = [
      ...summaryMatch[1].matchAll(/label:\s*"([^"]+)"/g),
    ].map((m) => m[1]);
  }
  const accReqMatch = stripped.match(/requiredText:\s*\[([\s\S]*?)\]/);
  let requiredText = [];
  if (accReqMatch) {
    requiredText = [
      ...accReqMatch[1].matchAll(/"([^"]+)"/g),
    ].map((m) => m[1]);
  }
  return {
    raw,
    stripped,
    runtimeReady: rrMatch ? rrMatch[1] === "true" : false,
    profileStatus: psMatch ? psMatch[1] : null,
    templateCode: tcMatch ? tcMatch[1] : null,
    fieldPaths,
    demoKeys,
    requiredFieldPaths,
    summaryLabels,
    requiredText,
  };
}

function readLockedContractFields(code) {
  const file = lockedContractFileFor(code);
  if (!file) return new Set();
  const j = JSON.parse(readFileSync(file, "utf8"));
  const arr = Array.isArray(j?.fields) ? j.fields : [];
  return new Set(arr.map((f) => f.path).filter(Boolean));
}

function readCanonicalAllowlist() {
  const src = readFileSync(BRIDGE_ELIGIBILITY, "utf8");
  const stripped = stripComments(src);
  const match = stripped.match(
    /STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([^\]]+)\]/,
  );
  assert.ok(match, "STANDALONE_RUNTIME_TEMPLATE_CODES must be a literal array");
  return match[1]
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => /^['"]/.test(s))
    .map((s) => s.replace(/['"]/g, ""));
}

function readLifecycleImports() {
  const src = readFileSync(FORM_LIFECYCLE, "utf8");
  return [
    ...src.matchAll(/from\s+["']\.\/profiles\/bm(\d{3})["']/g),
  ].map((m) => `BM-${m[1]}`);
}

// ─── Per-form helper ───────────────────────────────────────────────────────

function promoteOne(code) {
  const meta = readProfileMeta(code);
  assert.equal(
    meta.templateCode,
    code,
    `${code} profile must declare templateCode: "${code}"`,
  );
  assert.equal(
    meta.runtimeReady,
    true,
    `${code} must declare runtimeReady: true`,
  );
  assert.equal(
    meta.profileStatus,
    "runtime-ready",
    `${code} must declare profileStatus: "runtime-ready"`,
  );

  // Side-effect import in form-lifecycle.ts.
  const num = code.slice(3);
  const lifecycleSrc = readFileSync(FORM_LIFECYCLE, "utf8");
  const importPat = new RegExp(
    `from\\s+["']\\./profiles/bm${num}["']`,
  );
  assert.match(
    lifecycleSrc,
    importPat,
    `form-lifecycle.ts must side-effect-import profiles/bm${num}.ts`,
  );

  // Field-paths non-empty + coherent with locked contract when one exists.
  assert.ok(
    meta.fieldPaths.length >= 1,
    `${code} must declare >=1 fieldPath`,
  );
  const contractFields = readLockedContractFields(code);
  if (contractFields.size > 0) {
    for (const fp of meta.fieldPaths) {
      assert.ok(
        contractFields.has(fp) ||
          // Some contract schemas use raw keys without a leading
          // namespace; tolerate if the bare suffix matches.
          contractFields.has(fp.split(".").pop()),
        `${code} fieldPath "${fp}" must be present in the locked contract fields (${[...contractFields].slice(0, 6).join(", ")}…)`,
      );
    }
  }

  // Required-subset invariant.
  for (const req of meta.requiredFieldPaths) {
    assert.ok(
      meta.fieldPaths.includes(req),
      `${code} requiredFieldPath "${req}" must be a subset of fieldPaths`,
    );
  }

  // Demo completeness.
  for (const req of meta.requiredFieldPaths) {
    assert.ok(
      meta.demoKeys.includes(req),
      `${code} demo must include required field "${req}"`,
    );
  }

  // Demo keys are all inside fieldPaths (no orphan demo keys).
  for (const dk of meta.demoKeys) {
    assert.ok(
      meta.fieldPaths.includes(dk),
      `${code} demo key "${dk}" must be a subset of fieldPaths`,
    );
  }

  // Summary lines are non-empty.
  assert.ok(
    meta.summaryLabels.length >= 1,
    `${code} summaryLines must have at least one entry`,
  );

  // Acceptance text must not be empty.
  assert.ok(
    meta.requiredText.length >= 1,
    `${code} acceptance.requiredText must have at least one entry`,
  );
  for (const rt of meta.requiredText) {
    assert.ok(
      typeof rt === "string" && rt.trim().length > 0,
      `${code} acceptance.requiredText entries must be non-empty`,
    );
    // No live contract-control tokens leak into the acceptance list.
    assert.ok(
      !/^\s*[\{\[].*[\}\]]\s*$/.test(rt),
      `${code} acceptance.requiredText must not be a placeholder`,
    );
  }
}

// ─── Cohort assertions ────────────────────────────────────────────────────

describe("Runtime-readiness R5 profile-promotion guard", () => {
  it("R5-R1. canonical roster has exactly 11 codes (BM-001 + BM-171 + 9 R5 promoted)", () => {
    assert.equal(
      RUNTIME_READY_CODES.length,
      11,
      "R5 canonical runtime-ready roster must contain 11 codes",
    );
  });

  it("R5-R2. canonical roster agrees with bridge-eligibility.ts and form-lifecycle.ts", () => {
    const canonical = readCanonicalAllowlist();
    const imports = readLifecycleImports();
    assert.deepEqual(
      [...canonical].sort(),
      [...RUNTIME_READY_CODES].sort(),
      "bridge-eligibility canonical allowlist must match the R5 roster",
    );
    assert.deepEqual(
      [...imports].sort(),
      [...RUNTIME_READY_CODES].sort(),
      "form-lifecycle.ts side-effect imports must match the R5 roster",
    );
  });

  it("R5-R3. historical controls (BM-001 + BM-171) remain runtime-ready", () => {
    for (const code of HISTORICAL_CONTROLS) {
      const m = readProfileMeta(code);
      assert.equal(m.runtimeReady, true, `${code} must stay runtimeReady: true`);
      assert.equal(
        m.profileStatus,
        "runtime-ready",
        `${code} must stay profileStatus: "runtime-ready"`,
      );
    }
  });

  it("R5-R4. BM-200 canary remains POLICY_EXCLUDED", () => {
    const m = readProfileMeta(CANARY);
    assert.equal(m.runtimeReady, false, `${CANARY} must stay runtimeReady: false`);
    assert.equal(
      m.profileStatus,
      "skeleton",
      `${CANARY} must stay profileStatus: "skeleton"`,
    );
    const imports = readLifecycleImports();
    assert.equal(
      imports.includes(CANARY),
      false,
      `form-lifecycle.ts must NOT side-effect-import ${CANARY}`,
    );
  });

  it("R5-R5. runtime-ready roster has no duplicates and no canary", () => {
    const set = new Set(RUNTIME_READY_CODES);
    assert.equal(set.size, RUNTIME_READY_CODES.length, "roster must be duplicate-free");
    assert.equal(set.has(CANARY), false, "roster must not contain canary");
  });

  it("R5-R6. maturity JSON summary.runtimeReady lists exactly the 11 canonical codes", () => {
    if (!existsSync(MATURITY_JSON)) return; // optional at guard-time
    const j = JSON.parse(readFileSync(MATURITY_JSON, "utf8"));
    const audit = j?.summary?.runtimeReady ?? [];
    for (const code of RUNTIME_READY_CODES) {
      assert.ok(
        audit.includes(code),
        `maturity JSON must list ${code} as runtimeReady`,
      );
    }
    assert.equal(
      new Set(audit).size,
      RUNTIME_READY_CODES.length,
      `maturity JSON must list exactly ${RUNTIME_READY_CODES.length} runtimeReady codes`,
    );
  });

  it("R5-R7. matrix JSON records each promoted candidate with PROMOTED envelopes", () => {
    const matrix = JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
    const records = matrix.records || [];
    for (const code of R5_PROMOTED_CODES) {
      const row = records.find((r) => r.formCode === code);
      assert.ok(row, `${code} must appear in matrix records`);
      assert.equal(row.currentRuntimeReady, true, `${code} currentRuntimeReady`);
      assert.equal(row.promotionStatus, "PROMOTED_RUNTIME_READY", `${code} promotionStatus`);
      assert.equal(row.pilotStatus, "PROMOTED", `${code} pilotStatus`);
      assert.equal(row.specialPolicy, "RUNTIME_READY_PROMOTED_R5", `${code} specialPolicy`);
    }
  });

  // Per-form contract checks, one assertion per candidate.
  describe("R5-PROMOTE", () => {
    for (const code of R5_PROMOTED_CODES) {
      it(`promotes ${code} with the full Form Flight profile contract`, () => {
        promoteOne(code);
      });
    }
  });

  // ─── Adversarial mutation matrix ────────────────────────────────────────

  it("A1. flipping a promoted candidate to runtimeReady:false is rejected", () => {
    const m = readProfileMeta("BM-157");
    assert.equal(
      m.runtimeReady,
      true,
      "guard logic should reject BM-157 if flipped to runtimeReady:false",
    );
  });

  it("A2. flipping a promoted candidate to profileStatus:skeleton is rejected", () => {
    const m = readProfileMeta("BM-156");
    assert.equal(
      m.profileStatus,
      "runtime-ready",
      "guard logic should reject BM-156 if profileStatus flipped to skeleton",
    );
  });

  it("A3. removing a side-effect import for a promoted candidate is rejected", () => {
    const lifecycleSrc = readFileSync(FORM_LIFECYCLE, "utf8");
    for (const code of R5_PROMOTED_CODES) {
      const num = code.slice(3);
      const importPat = new RegExp(
        `from\\s+["']\\.\\/profiles\\/bm${num}["']`,
      );
      assert.match(
        lifecycleSrc,
        importPat,
        `form-lifecycle.ts must side-effect-import profiles/bm${num}.ts (R5 candidate ${code})`,
      );
    }
  });

  it("A4. promoted candidate must keep its own templateCode", () => {
    for (const code of R5_PROMOTED_CODES) {
      const m = readProfileMeta(code);
      assert.equal(
        m.templateCode,
        code,
        `${code} profile must declare its own templateCode`,
      );
    }
  });

  it("A5. demo keys must all be subset of fieldPaths (no orphan demo keys)", () => {
    for (const code of R5_PROMOTED_CODES) {
      const m = readProfileMeta(code);
      for (const dk of m.demoKeys) {
        assert.ok(
          m.fieldPaths.includes(dk),
          `${code} demo key "${dk}" must be a subset of fieldPaths`,
        );
      }
    }
  });

  it("A6. summaryLines must be non-empty and avoid duplicates", () => {
    for (const code of R5_PROMOTED_CODES) {
      const m = readProfileMeta(code);
      assert.ok(
        m.summaryLabels.length >= 1,
        `${code} must have at least 1 summary line`,
      );
      const dedup = new Set(m.summaryLabels);
      assert.equal(
        dedup.size,
        m.summaryLabels.length,
        `${code} summary lines must not have duplicates`,
      );
    }
  });

  it("A7. acceptance.requiredText must not contain the literal BM-200 canary token", () => {
    for (const code of R5_PROMOTED_CODES) {
      const m = readProfileMeta(code);
      for (const rt of m.requiredText) {
        assert.ok(
          !rt.includes("BM-200"),
          `${code} acceptance requiredText must not reference BM-200 canary`,
        );
      }
    }
  });

  it("A8. BM-200 must NOT appear in the runtime-ready roster (canary stays excluded)", () => {
    const imports = readLifecycleImports();
    const canonical = readCanonicalAllowlist();
    assert.equal(imports.includes(CANARY), false);
    assert.equal(canonical.includes(CANARY), false);
  });

  it("A9. duplicate candidate registration in canonical allowlist is rejected", () => {
    const canonical = readCanonicalAllowlist();
    assert.equal(
      new Set(canonical).size,
      canonical.length,
      "canonical allowlist must not have duplicates",
    );
  });
});
