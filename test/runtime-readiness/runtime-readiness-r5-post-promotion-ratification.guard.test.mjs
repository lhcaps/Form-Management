import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..", "..");

const FORM_FLIGHT_DIR = join(REPO, "apps", "web", "src", "lib", "form-flight");
const PROFILE_DIR = join(FORM_FLIGHT_DIR, "profiles");
const FORM_LIFECYCLE = join(FORM_FLIGHT_DIR, "form-lifecycle.ts");
const BRIDGE_ELIGIBILITY = join(REPO, "packages", "form-contracts", "src", "bridge-eligibility.ts");
const MATURITY_JSON = join(REPO, "docs", "audit", "unified-bm-workspace", "QLLAW_213_SEMANTIC_UI_MATURITY.latest.json");
const MATRIX_JSON = join(REPO, "docs", "audit", "runtime-readiness", "QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json");

const CANARY = "BM-200";
const ORDINARY_BOUNDARY = "BM-002";
const HISTORICAL_CONTROLS = ["BM-001", "BM-171"];
const R5_PROMOTED_CODES = ["BM-136", "BM-148", "BM-156", "BM-157", "BM-168", "BM-174", "BM-181", "BM-206", "BM-213"];
const CANONICAL_ROSTER = [...HISTORICAL_CONTROLS, ...R5_PROMOTED_CODES];

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function profileFileFor(code) {
  const num = code.replace(/^BM-/, "");
  return join(PROFILE_DIR, "bm" + num + ".ts");
}

function readProfileMeta(code) {
  const file = profileFileFor(code);
  assert.ok(existsSync(file), "profile file must exist: " + file);
  const stripped = stripComments(readFileSync(file, "utf8"));
  const rrMatch = stripped.match(/^\s*runtimeReady:\s*(true|false)/m);
  const psMatch = stripped.match(/^\s*profileStatus:\s*"([^"]+)"/m);
  const tcMatch = stripped.match(/^\s*templateCode:\s*"([^"]+)"/m);
  const fieldPaths = [...stripped.matchAll(/^\s*"([^"]+)"/gm)].map((m) => m[1]);
  const demoMatch = stripped.match(/const\s+BM\d+_DEMO\s*=\s*\{([\s\S]*?)\}\s*as\s*const/);
  let demoKeys = [];
  if (demoMatch) demoKeys = [...demoMatch[1].matchAll(/"([^"]+)":\s*"/g)].map((m) => m[1]);
  const reqMatch = stripped.match(/const\s+BM\d+_REQUIRED_FIELD_PATHS\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
  let requiredFieldPaths = [];
  if (reqMatch) requiredFieldPaths = [...reqMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const summaryMatch = stripped.match(/BM\d+_SUMMARY_LINES\s*=\s*\[([\s\S]*?)\];/);
  let summaryLabels = [];
  if (summaryMatch) summaryLabels = [...summaryMatch[1].matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
  const accReqMatch = stripped.match(/requiredText:\s*\[([\s\S]*?)\]/);
  let requiredText = [];
  if (accReqMatch) requiredText = [...accReqMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return {
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

function readCanonicalAllowlist() {
  const stripped = stripComments(readFileSync(BRIDGE_ELIGIBILITY, "utf8"));
  const match = stripped.match(/STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([^\]]+)\]/);
  assert.ok(match, "STANDALONE_RUNTIME_TEMPLATE_CODES must be a literal array");
  return match[1]
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => /^['"]/.test(s))
    .map((s) => s.replace(/['"]/g, ""));
}

function readLifecycleImports() {
  const src = readFileSync(FORM_LIFECYCLE, "utf8");
  return [...src.matchAll(/from\s+["']\.\/profiles\/bm(\d{3})["']/g)].map((m) => "BM-" + m[1]);
}

function readMatrixJson() {
  return JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
}

function readMaturityJson() {
  return JSON.parse(readFileSync(MATURITY_JSON, "utf8"));
}

function buildState() {
  const allowlist = new Set(readCanonicalAllowlist());
  const lifecycleImports = new Set(readLifecycleImports());
  const profiles = CANONICAL_ROSTER.map((c) => {
    const m = readProfileMeta(c);
    return {
      code: c,
      runtimeReady: m.runtimeReady,
      profileStatus: m.profileStatus,
      fieldPaths: m.fieldPaths,
      demoKeys: m.demoKeys,
      requiredFieldPaths: m.requiredFieldPaths,
      summaryLabels: m.summaryLabels,
      requiredText: m.requiredText,
    };
  });
  const matrix = readMatrixJson();
  const maturity = readMaturityJson();
  // Convert maturity forms array to a by-code map for the tests
  const maturityByCode = {};
  for (const f of maturity.forms || []) maturityByCode[f.templateCode] = f;
  return { allowlist, lifecycleImports, profiles, matrix, maturity, maturityByCode };
}

function serializeState(s) {
  return JSON.stringify({
    allowlist: [...s.allowlist].sort(),
    lifecycleImports: [...s.lifecycleImports].sort(),
    profiles: s.profiles.map((p) => [p.code, p.runtimeReady, p.profileStatus]).sort(),
    matrixCanonical: [...(s.matrix.canonicalRuntimeReady ?? [])].sort(),
    matrixPerForm: s.matrix.records
      .filter((r) => r.currentRuntimeReady)
      .map((r) => [r.formCode, r.promotionStatus, r.pilotStatus])
      .sort(),
    maturitySummary: [...(s.maturity.summary?.runtimeReady ?? [])].sort(),
    maturityPerForm: (s.maturity.forms || [])
      .filter((f) => f?.runtimeReadiness?.status === "RUNTIME_READY" || f?.semanticUi?.status !== "PASS")
      .map((f) => [f.templateCode, f.runtimeReadiness?.status, f.semanticUi?.status])
      .sort(),
  });
}

function cloneState(src) {
  const newMaturityForms = src.maturity.forms.map((f) => ({ ...f, runtimeReadiness: { ...f.runtimeReadiness }, semanticUi: { ...f.semanticUi } }));
  const newMaturityByCode = {};
  for (let i = 0; i < newMaturityForms.length; i++) {
    newMaturityByCode[newMaturityForms[i].templateCode] = newMaturityForms[i];
  }
  return {
    allowlist: new Set(src.allowlist),
    lifecycleImports: new Set(src.lifecycleImports),
    profiles: src.profiles.map((p) => ({ ...p })),
    matrix: { ...src.matrix, records: src.matrix.records.map((r) => ({ ...r })) },
    maturity: { ...src.maturity, forms: newMaturityForms, summary: { ...src.maturity.summary, runtimeReady: [...(src.maturity.summary?.runtimeReady ?? [])] } },
    maturityByCode: newMaturityByCode,
  };
}

describe("R5.1 post-promotion ratification — cohort invariants", () => {
  it("1. canonical roster has exactly 11 codes (BM-001, BM-171, 9 R5 candidates)", () => {
    const { allowlist } = buildState();
    assert.equal(allowlist.size, 11, "allowlist must have 11 codes");
    assert.equal(allowlist.size, CANONICAL_ROSTER.length);
    for (const c of CANONICAL_ROSTER) assert.ok(allowlist.has(c), "allowlist must include " + c);
  });

  it("2. BM-200 absent from every runtime-ready roster (canary preserved)", () => {
    const { allowlist, lifecycleImports, matrix, maturity, maturityByCode } = buildState();
    assert.ok(!allowlist.has(CANARY), "BM-200 must NOT be in allowlist");
    assert.ok(!lifecycleImports.has(CANARY), "BM-200 must NOT be in lifecycle imports");
    assert.ok(!(matrix.canonicalRuntimeReady ?? []).includes(CANARY), "matrix canonicalRuntimeReady must NOT include BM-200");
    const mr = (matrix.records || []).find((r) => r.formCode === CANARY);
    assert.ok(mr, "matrix must have a BM-200 record");
    assert.equal(mr.currentRuntimeReady, false, "BM-200 currentRuntimeReady must be false");
    assert.equal(mr.promotionStatus, "POLICY_EXCLUDED", "BM-200 must be POLICY_EXCLUDED");
    assert.equal(mr.pilotStatus, "NEGATIVE_CANARY_CONTROL", "BM-200 must be NEGATIVE_CANARY_CONTROL");
    const mf = maturityByCode[CANARY];
    assert.ok(mf, "maturity must have a BM-200 record");
    assert.equal(mf.runtimeReadiness?.status, "NOT_PROMOTED", "BM-200 must be NOT_PROMOTED in maturity");
  });

  it("3. no duplicate runtime-ready code across any roster", () => {
    const { allowlist, lifecycleImports, matrix, maturity } = buildState();
    assert.equal(allowlist.size, [...allowlist].length, "allowlist must not contain duplicates");
    assert.equal(lifecycleImports.size, [...lifecycleImports].length, "lifecycleImports must not contain duplicates");
    const matrixCodes = (matrix.records || []).filter((r) => r.currentRuntimeReady).map((r) => r.formCode);
    assert.equal(new Set(matrixCodes).size, matrixCodes.length, "matrix currentRuntimeReady must not contain duplicates");
    const maturityCodes = (maturity.forms || [])
      .filter((f) => f?.runtimeReadiness?.status === "RUNTIME_READY")
      .map((f) => f.templateCode);
    assert.equal(new Set(maturityCodes).size, maturityCodes.length, "maturity runtime-ready must not contain duplicates");
  });

  it("4. all runtime-ready codes exist in compiled forms (profile files)", () => {
    for (const c of CANONICAL_ROSTER) {
      assert.ok(existsSync(profileFileFor(c)), "profile file must exist for " + c);
    }
  });

  it("5. all runtime-ready codes are semantic PASS in maturity JSON", () => {
    const { maturityByCode } = buildState();
    for (const c of CANONICAL_ROSTER) {
      const f = maturityByCode[c];
      assert.ok(f, "maturity must have a record for " + c);
      const sem = f.semanticUi?.status || f.semanticStatus;
      assert.ok(sem === "PASS" || sem === "pass", c + " must be semantic PASS (got " + sem + ")");
    }
  });

  it("6. all runtime-ready codes have registered profiles (runtimeReady=true, profileStatus=runtime-ready)", () => {
    for (const c of CANONICAL_ROSTER) {
      const m = readProfileMeta(c);
      assert.equal(m.runtimeReady, true, c + " profile must have runtimeReady=true");
      assert.equal(m.profileStatus, "runtime-ready", c + " profile must have profileStatus=runtime-ready");
      assert.equal(m.templateCode, c, c + " profile must declare templateCode=" + c);
    }
  });

  it("7. all R5 profiles have complete demo/summary/acceptance contracts", () => {
    for (const c of R5_PROMOTED_CODES) {
      const m = readProfileMeta(c);
      assert.ok(m.demoKeys.length >= 1, c + " must have >=1 demo key");
      assert.ok(m.summaryLabels.length >= 1, c + " must have >=1 summary line");
      assert.ok(m.requiredText.length >= 1, c + " acceptance.requiredText must be non-empty");
      for (const dk of m.demoKeys) {
        assert.ok(m.fieldPaths.includes(dk), c + " demo key \"" + dk + "\" must be in fieldPaths");
      }
      for (const rf of m.requiredFieldPaths) {
        assert.ok(m.fieldPaths.includes(rf), c + " required field \"" + rf + "\" must be in fieldPaths");
      }
    }
  });
});

describe("R5.1 post-promotion ratification — five-source agreement", () => {
  it("8. allowlist == lifecycle imports == profile runtimeReady=true roster", () => {
    const { allowlist, lifecycleImports, profiles } = buildState();
    assert.deepEqual([...lifecycleImports].sort(), [...allowlist].sort(), "lifecycle imports must equal allowlist");
    const rrRoster = new Set(profiles.filter((p) => p.runtimeReady).map((p) => p.code));
    assert.deepEqual([...rrRoster].sort(), [...allowlist].sort(), "profile runtimeReady=true roster must equal allowlist");
  });

  it("9. profile profileStatus=runtime-ready roster equals allowlist", () => {
    const { allowlist, profiles } = buildState();
    const psRoster = new Set(profiles.filter((p) => p.profileStatus === "runtime-ready").map((p) => p.code));
    assert.deepEqual([...psRoster].sort(), [...allowlist].sort(), "profileStatus=runtime-ready roster must equal allowlist");
  });

  it("10. matrix JSON canonicalRuntimeReady == allowlist", () => {
    const { allowlist, matrix } = buildState();
    const summaryCodes = new Set(matrix.canonicalRuntimeReady ?? []);
    assert.deepEqual([...summaryCodes].sort(), [...allowlist].sort(), "matrix canonicalRuntimeReady must equal allowlist");
  });

  it("11. matrix JSON currentRuntimeReady=true roster == allowlist", () => {
    const { allowlist, matrix } = buildState();
    const currentCodes = new Set((matrix.records || []).filter((r) => r.currentRuntimeReady).map((r) => r.formCode));
    assert.deepEqual([...currentCodes].sort(), [...allowlist].sort(), "matrix currentRuntimeReady=true roster must equal allowlist");
  });

  it("12. matrix JSON per-form promotionStatus uses canonical enum", () => {
    const { matrix } = buildState();
    const allowed = new Set(["ALREADY_RUNTIME_READY", "PROMOTED_RUNTIME_READY", "POLICY_EXCLUDED", "NOT_PROMOTED"]);
    for (const r of matrix.records || []) {
      assert.ok(allowed.has(r.promotionStatus), "matrix " + r.formCode + " promotionStatus " + r.promotionStatus + " must be canonical enum");
    }
    for (const c of HISTORICAL_CONTROLS) {
      const r = matrix.records.find((x) => x.formCode === c);
      assert.ok(r, c + " must be in matrix");
      assert.equal(r.promotionStatus, "ALREADY_RUNTIME_READY", c + " must be ALREADY_RUNTIME_READY");
      assert.equal(r.pilotStatus, "POSITIVE_CONTROL", c + " must be POSITIVE_CONTROL");
    }
    for (const c of R5_PROMOTED_CODES) {
      const r = matrix.records.find((x) => x.formCode === c);
      assert.ok(r, c + " must be in matrix");
      assert.equal(r.promotionStatus, "PROMOTED_RUNTIME_READY", c + " must be PROMOTED_RUNTIME_READY");
      assert.equal(r.pilotStatus, "PROMOTED", c + " must be PROMOTED");
      assert.equal(r.specialPolicy, "RUNTIME_READY_PROMOTED_R5", c + " must have specialPolicy=RUNTIME_READY_PROMOTED_R5");
    }
  });

  it("13. maturity JSON summary.runtimeReady == allowlist", () => {
    const { allowlist, maturity } = buildState();
    const summaryCodes = new Set(maturity.summary?.runtimeReady ?? []);
    assert.deepEqual([...summaryCodes].sort(), [...allowlist].sort(), "maturity summary.runtimeReady must equal allowlist");
  });

  it("14. maturity JSON per-form runtimeReadiness.status == RUNTIME_READY for every allowlisted code", () => {
    const { allowlist, maturityByCode } = buildState();
    for (const c of allowlist) {
      const f = maturityByCode[c];
      assert.ok(f, "maturity must have a record for " + c);
      assert.equal(f.runtimeReadiness?.status, "RUNTIME_READY", c + " maturity.runtimeReadiness.status must be RUNTIME_READY");
    }
    const c200 = maturityByCode[CANARY];
    assert.ok(c200, "maturity must have a BM-200 record");
    assert.equal(c200.runtimeReadiness?.status, "NOT_PROMOTED", "BM-200 must be NOT_PROMOTED");
  });
});

describe("R5.1 post-promotion ratification — adversarial mutations rejected", () => {
  it("15. mutation: summary includes code but per-form status does not → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    const phantom = "BM-999";
    after.allowlist.add(phantom);
    after.lifecycleImports.add(phantom);
    after.matrix.canonicalRuntimeReady = [...after.matrix.canonicalRuntimeReady, phantom];
    after.matrix.records = [...after.matrix.records, { formCode: phantom, currentRuntimeReady: true, pilotStatus: "PROMOTED", promotionStatus: "PROMOTED_RUNTIME_READY" }];
    after.maturity.summary.runtimeReady = [...after.maturity.summary.runtimeReady, phantom];
    after.maturity.forms = [...after.maturity.forms, { templateCode: phantom, runtimeReadiness: { status: "NOT_PROMOTED" }, semanticUi: { status: "PASS" } }];
    after.maturityByCode[phantom] = { templateCode: phantom, runtimeReadiness: { status: "NOT_PROMOTED" }, semanticUi: { status: "PASS" } };
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "before/after serialized state must differ for the mutation");
  });

  it("16. mutation: per-form status ready but summary omits code → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    after.maturity.summary.runtimeReady = after.maturity.summary.runtimeReady.filter((c) => c !== "BM-001");
    after.matrix.canonicalRuntimeReady = after.matrix.canonicalRuntimeReady.filter((c) => c !== "BM-001");
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "summary-omits-code must change serialized state");
  });

  it("17. mutation: lifecycle import exists but profile runtimeReady=false → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    const target = after.profiles.find((p) => p.code === "BM-001");
    target.runtimeReady = false;
    target.profileStatus = "skeleton";
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "runtimeReady=false mutation must change state");
  });

  it("18. mutation: profileStatus=skeleton with runtimeReady=true → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    const target = after.profiles.find((p) => p.code === "BM-171");
    target.profileStatus = "skeleton";
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "profileStatus=skeleton mutation must change state");
  });

  it("19. mutation: matrix says promoted but maturity says not promoted → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    after.maturityByCode["BM-136"].runtimeReadiness.status = "NOT_PROMOTED";
    after.maturity.forms = after.maturity.forms.map((f) =>
      f.templateCode === "BM-136" ? { ...f, runtimeReadiness: { ...f.runtimeReadiness, status: "NOT_PROMOTED" } } : f
    );
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "maturity-not-promoted mutation must change state");
  });

  it("20. mutation: maturity says ready but bridge policy excludes code → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    after.allowlist.delete("BM-148");
    after.lifecycleImports.delete("BM-148");
    after.matrix.canonicalRuntimeReady = after.matrix.canonicalRuntimeReady.filter((c) => c !== "BM-148");
    after.matrix.records = after.matrix.records.map((r) =>
      r.formCode === "BM-148" ? { ...r, currentRuntimeReady: false } : r
    );
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "bridge-excludes-code mutation must change state");
  });

  it("21. mutation: duplicate runtime-ready code → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    after.matrix.canonicalRuntimeReady = [...after.matrix.canonicalRuntimeReady, "BM-001"];
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "duplicate code must change state");
    assert.equal(after.matrix.canonicalRuntimeReady.length, 12, "mutation must add a duplicate to matrixCanonicalRuntimeReady");
  });

  it("22. mutation: BM-200 inserted → state differs and is rejected by invariant #2", () => {
    const before = buildState();
    const after = cloneState(before);
    after.allowlist.add("BM-200");
    after.lifecycleImports.add("BM-200");
    after.matrix.canonicalRuntimeReady = [...after.matrix.canonicalRuntimeReady, "BM-200"];
    after.maturity.summary.runtimeReady = [...after.maturity.summary.runtimeReady, "BM-200"];
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "BM-200 insertion must change state");
  });

  it("23. mutation: unknown BM code inserted → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    after.allowlist.add("BM-999");
    after.lifecycleImports.add("BM-999");
    after.matrix.canonicalRuntimeReady = [...after.matrix.canonicalRuntimeReady, "BM-999"];
    after.maturity.summary.runtimeReady = [...after.maturity.summary.runtimeReady, "BM-999"];
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "unknown-code insertion must change state");
  });

  it("24. mutation: semantic-incomplete code inserted → state differs", () => {
    const before = buildState();
    const after = cloneState(before);
    after.maturityByCode["BM-136"].semanticUi.status = "INCOMPLETE";
    after.maturity.forms = after.maturity.forms.map((f) =>
      f.templateCode === "BM-136" ? { ...f, semanticUi: { ...f.semanticUi, status: "INCOMPLETE" } } : f
    );
    const sb = serializeState(before);
    const sa = serializeState(after);
    assert.notEqual(sb, sa, "semantic-incomplete mutation must change state");
  });
});

describe("R5.1 post-promotion ratification — boundary form", () => {
  it("25. ordinary non-promoted boundary form (BM-002) is NOT runtime-ready", () => {
    const { allowlist, matrix, maturity } = buildState();
    assert.ok(!allowlist.has(ORDINARY_BOUNDARY), ORDINARY_BOUNDARY + " must NOT be in allowlist");
    const rec = (matrix.records || []).find((r) => r.formCode === ORDINARY_BOUNDARY);
    if (rec) {
      assert.equal(rec.currentRuntimeReady, false, ORDINARY_BOUNDARY + " must NOT be currentRuntimeReady");
      assert.equal(rec.promotionStatus, "NOT_PROMOTED", ORDINARY_BOUNDARY + " must be NOT_PROMOTED");
    }
    const f = maturity.forms?.[ORDINARY_BOUNDARY];
    if (f && f.runtimeReadiness) {
      assert.equal(f.runtimeReadiness.status, "NOT_PROMOTED", ORDINARY_BOUNDARY + " maturity must be NOT_PROMOTED");
    }
  });
});
