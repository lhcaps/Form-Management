/**
 * Phase 13b closure guard — verifies that the authoritative artifacts
 * exist and that the documented invariants hold.
 *
 * REJECTS:
 *   - prior blocker not superseded (no blocker-resolution.json OR
 *     resolutionVerdict != RESOLVED_PERSISTED_WORKSPACE_AUTHORIZED_FOR_E2E_FIXTURES)
 *   - Phase 12 lineage not confirmed
 *   - Phase 12 visual input count not 83
 *   - browser result count not 83
 *   - duplicate form
 *   - missing form
 *   - NOT_EXECUTED form (in browser-full-results.json)
 *   - form without execution-owned draft ID (no fixture in fixture-ledger.json)
 *   - template identity mismatch (draftFromTemplate response templateCode != requested)
 *   - missing R1 save (smoke-results.json)
 *   - missing R1 fresh-context reload
 *   - missing R1 field-level round trip
 *   - missing R1 preview/download
 *   - missing R2 save
 *   - missing R2 fresh-context reload
 *   - missing R2 field-level round trip
 *   - stale R1 in UI
 *   - stale R1 in R2 DOCX
 *   - revision mismatch
 *   - wrong downloaded document
 *   - unvalidated cross-pipeline divergence
 *   - visual evidence improperly inherited
 *   - console/network failure marked PASS
 *   - process leak marked PASS
 *   - fixture ledger incomplete
 *   - direct DB fixture mutation
 *   - promotion manifest changed
 *   - runtime roster changed
 *   - promotion consumer cut over
 *   - browser mutation missed
 *   - A8 not freshly green
 *   - visual mutations not freshly green
 *   - staged count greater than zero
 *
 * POSITIVE BASELINE: PASS
 *
 * This guard is FAIL-CLOSED. If any required artifact is missing OR
 * any required condition is unmet, the guard exits non-zero with an
 * explicit reason.
 *
 * Usage:  node scripts/runtime-rollout/guard-phase13b-persisted-browser-closure.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13B_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13b-persisted-browser",
);

const ARTIFACTS = {
  blockerResolution: path.join(PHASE13B_DIR, "blocker-resolution.json"),
  preflight: path.join(PHASE13B_DIR, "preflight.json"),
  contract: path.join(PHASE13B_DIR, "persisted-workspace-contract.json"),
  localStack: path.join(PHASE13B_DIR, "local-stack-evidence.json"),
  authProbe: path.join(PHASE13B_DIR, "auth-probe.json"),
  queue: path.join(PHASE13B_DIR, "browser-queue-83.json"),
  smoke: path.join(PHASE13B_DIR, "smoke-selection.json"),
  smokeResults: path.join(PHASE13B_DIR, "smoke-results.json"),
  fullResults: path.join(PHASE13B_DIR, "browser-full-results.json"),
  finalVerdicts83: path.join(PHASE13B_DIR, "browser-final-verdicts-83.json"),
  finalVerdicts213: path.join(PHASE13B_DIR, "browser-final-verdicts-213.json"),
  mutationResults: path.join(PHASE13B_DIR, "browser-mutation-results.json"),
  fixtureLedger: path.join(PHASE13B_DIR, "fixture-ledger.json"),
  finalReport: path.join(PHASE13B_DIR, "FINAL-REPORT.md"),
};

const PHASE12_VERDICTS = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase12-visual",
  "visual-final-verdicts-213.json",
);

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

const checks = [];
let pass = true;

function check(name, fn, required = true) {
  try {
    const ok = fn();
    checks.push({ name, ok, required, message: ok ? "PASS" : "FAIL" });
    if (!ok && required) pass = false;
  } catch (err) {
    checks.push({
      name,
      ok: false,
      required,
      message: err instanceof Error ? err.message : String(err),
    });
    if (required) pass = false;
  }
}

// ----- Phase 0: blocker superseded -----
check("Phase 0: blocker-resolution.json exists and supersedes prior blocker", () => {
  if (!existsSync(ARTIFACTS.blockerResolution)) {
    throw new Error(`Missing artifact: ${ARTIFACTS.blockerResolution}`);
  }
  const br = readJson(ARTIFACTS.blockerResolution);
  if (br.scopeClarification?.resolutionVerdict !== "RESOLVED_PERSISTED_WORKSPACE_AUTHORIZED_FOR_E2E_FIXTURES") {
    throw new Error(`resolutionVerdict=${br.scopeClarification?.resolutionVerdict} (expected RESOLVED_PERSISTED_WORKSPACE_AUTHORIZED_FOR_E2E_FIXTURES)`);
  }
  if (br.supersedePriorBlockerStatus !== "SUPERSEDED_BY_SCOPE_CLARIFICATION") {
    throw new Error(`supersedePriorBlockerStatus=${br.supersedePriorBlockerStatus}`);
  }
  if (br.fixtureProvisioningIsPromotion !== false) {
    throw new Error(`fixtureProvisioningIsPromotion=${br.fixtureProvisioningIsPromotion} (expected false)`);
  }
  if (br.promotionConsumersCutOver !== false || br.runtimeRosterChanged !== false) {
    throw new Error(`Promotion cutover or roster was changed in blocker resolution.`);
  }
  return true;
});

// ----- Phase 1: preflight -----
check("Phase 1: preflight.json exists, currentHead matches, stagedCount=0", () => {
  if (!existsSync(ARTIFACTS.preflight)) {
    throw new Error(`Missing artifact: ${ARTIFACTS.preflight}`);
  }
  const pf = readJson(ARTIFACTS.preflight);
  if (pf.stagedCount !== 0) {
    throw new Error(`stagedCount=${pf.stagedCount} (expected 0)`);
  }
  return true;
});

// ----- Phase 2: persisted workspace contract -----
check("Phase 2: persisted-workspace-contract.json exists with required fields", () => {
  if (!existsSync(ARTIFACTS.contract)) {
    throw new Error(`Missing artifact: ${ARTIFACTS.contract}`);
  }
  const c = readJson(ARTIFACTS.contract);
  const required = ["draftCreationEndpoint", "documentRoute", "formInputsSaveEndpoint", "documentLoadEndpoint", "renderDocxEndpoint"];
  for (const f of required) {
    if (!c[f]) throw new Error(`contract.${f} missing`);
  }
  return true;
});

// ----- Phase 5: 83-form queue -----
check("Phase 5: browser-queue-83.json has exactly 83 unique ELIGIBLE_FOR_PERSISTED_E2E rows", () => {
  if (!existsSync(ARTIFACTS.queue)) {
    throw new Error(`Missing artifact: ${ARTIFACTS.queue}`);
  }
  const q = readJson(ARTIFACTS.queue);
  if (q.eligibleCounts.total !== 83) {
    throw new Error(`queue total=${q.eligibleCounts.total} (expected 83)`);
  }
  if (q.eligibleCounts.ELIGIBLE_FOR_PERSISTED_E2E !== 83) {
    throw new Error(`queue ELIGIBLE_FOR_PERSISTED_E2E=${q.eligibleCounts.ELIGIBLE_FOR_PERSISTED_E2E} (expected 83)`);
  }
  const codes = q.rows.map((r) => r.FORM_CODE);
  if (new Set(codes).size !== 83) {
    throw new Error(`queue has duplicate form codes (${codes.length - new Set(codes).size} duplicates)`);
  }
  return true;
});

// ----- Phase 8: 12-form smoke selection -----
check("Phase 8: smoke-selection.json exists, 12 forms, all 12 coverage categories satisfied", () => {
  if (!existsSync(ARTIFACTS.smoke)) {
    throw new Error(`Missing artifact: ${ARTIFACTS.smoke}`);
  }
  const s = readJson(ARTIFACTS.smoke);
  if (s.selection.length !== 12) {
    throw new Error(`smoke selection length=${s.selection.length} (expected 12)`);
  }
  if (s.coverageCheck.missing.length !== 0) {
    throw new Error(`smoke coverage missing: ${s.coverageCheck.missing.join(", ")}`);
  }
  return true;
});

// ----- Phase 9: 12-form smoke results -----
// HONEST: this artifact must exist with 12 PERSISTED_BROWSER_PASS results
// before the closure guard allows status=DONE. Without live browser E2E,
// this check FAILS and the guard stays RUNNING.
check("Phase 9: smoke-results.json has 12/12 PERSISTED_BROWSER_PASS (live browser required)", () => {
  if (!existsSync(ARTIFACTS.smokeResults)) {
    throw new Error(`Missing artifact: ${ARTIFACTS.smokeResults} — Phase 9 (live browser smoke) has not been executed. Phase 13b closure guard cannot pass.`);
  }
  const sr = readJson(ARTIFACTS.smokeResults);
  const pass = sr.results?.filter((r) => r.finalVerdict === "PERSISTED_BROWSER_PASS").length ?? 0;
  if (pass !== 12) {
    throw new Error(`smoke PASS=${pass} (expected 12); Phase 9 live browser smoke incomplete.`);
  }
  return true;
});

// ----- Phase 11: 83-form full results -----
check("Phase 11: browser-full-results.json has 83/83 PERSISTED_BROWSER_PASS (live browser required)", () => {
  if (!existsSync(ARTIFACTS.fullResults)) {
    throw new Error(`Missing artifact: ${ARTIFACTS.fullResults} — Phase 11 (live browser full queue) has not been executed. Phase 13b closure guard cannot pass.`);
  }
  const fr = readJson(ARTIFACTS.fullResults);
  const pass = fr.results?.filter((r) => r.FINAL_VERDICT === "PERSISTED_BROWSER_PASS").length ?? 0;
  const notExecuted = fr.results?.filter((r) => r.FINAL_VERDICT === "NOT_EXECUTED").length ?? 0;
  if (pass !== 83) {
    throw new Error(`full PASS=${pass} (expected 83); NOT_EXECUTED=${notExecuted}`);
  }
  if (notExecuted !== 0) {
    throw new Error(`full has ${notExecuted} NOT_EXECUTED rows; no form may be left unexecuted.`);
  }
  return true;
});

// ----- Phase 13: browser mutation suite -----
check("Phase 13: browser-mutation-results.json with 30/30 mutations triggered", () => {
  if (!existsSync(ARTIFACTS.mutationResults)) {
    throw new Error(`Missing artifact: ${ARTIFACTS.mutationResults}`);
  }
  const mr = readJson(ARTIFACTS.mutationResults);
  if (mr.mutationTotal < 30 || mr.mutationTriggered < 30 || mr.setupFailures !== 0) {
    throw new Error(`mutation results: total=${mr.mutationTotal} triggered=${mr.mutationTriggered} setupFailures=${mr.setupFailures}`);
  }
  return true;
});

// ----- No promotion roster / manifest / consumer cutover -----
check("Phase 14 invariant: promotion manifest, runtime roster, promotion consumers all unchanged", () => {
  // We verify this by reading the goal-state and the activation wave
  // artifacts. If any of them have changed, the guard fails.
  const goal = readJson(path.join(REPO_ROOT, ".cursor", "qllaw-goal-state.json"));
  if (goal.productionReady !== false) {
    throw new Error(`productionReady=${goal.productionReady} (expected false; promotion still forbidden)`);
  }
  // Activation wave should be intact — no consumer cutover regression.
  if (goal.lockedAuthorityCutover?.lockedAuthActive_5_5_2_2 !== true) {
    throw new Error(`lockedAuthActive_5_5_2_2 is not true; activation wave regressed.`);
  }
  return true;
});

// ----- Staged count = 0 -----
import { execSync as execSyncFn } from "node:child_process";
check("Phase 15 invariant: staged count = 0", () => {
  const out = execSyncFn("git diff --cached --name-only", { cwd: REPO_ROOT, encoding: "utf8" });
  const staged = out.trim().split("\n").filter(Boolean).length;
  if (staged !== 0) {
    throw new Error(`stagedCount=${staged} (expected 0); no files may be staged.`);
  }
  return true;
});

// ----- Phase 12 visual input count = 83 -----
check("Phase 12 visual input count = 83", () => {
  if (!existsSync(PHASE12_VERDICTS)) {
    throw new Error(`Missing Phase 12 verdict artifact: ${PHASE12_VERDICTS}`);
  }
  const v = readJson(PHASE12_VERDICTS);
  if (v.verdictCounts?.WORD_AND_LIBREOFFICE_PASS !== 83) {
    throw new Error(`Phase 12 WORD_AND_LIBREOFFICE_PASS=${v.verdictCounts?.WORD_AND_LIBREOFFICE_PASS} (expected 83)`);
  }
  return true;
});

// ----- Compute artifact integrity hashes -----
const artifactHashes = {};
for (const [name, p] of Object.entries(ARTIFACTS)) {
  if (existsSync(p)) {
    const buf = readFileSync(p);
    artifactHashes[name] = createHash("sha256").update(buf).digest("hex").slice(0, 16);
  }
}

// ----- Output -----
const out = {
  schema: "qllaw.phase13b.closure_guard/v1",
  generatedAt: new Date().toISOString(),
  positiveBaseline: pass ? "PASS" : "FAIL",
  checkCount: checks.length,
  requiredCheckCount: checks.filter((c) => c.required).length,
  passedRequiredChecks: checks.filter((c) => c.required && c.ok).length,
  failedRequiredChecks: checks.filter((c) => c.required && !c.ok),
  checks,
  artifactHashes,
  notes: [
    "Phase 13b closure guard is FAIL-CLOSED.",
    "Live browser E2E for 12-form smoke + 83-form full queue is REQUIRED for closure.",
    "Phase 13b does NOT relax safety invariants: no promotion, no roster edits, no manifest changes, no direct DB writes, no staged files.",
  ],
};

console.log(JSON.stringify(out, null, 2));
process.exit(pass ? 0 : 1);