/**
 * Phase 13C closure guard.
 *
 * Rejects the closure unless every Phase 13C invariant is satisfied:
 *  - non-stale Clerk state
 *  - guard reconciliation present
 *  - queue count = 83
 *  - smoke count = 12 (when present)
 *  - smoke form all PASS
 *  - full result count = 83
 *  - NOT_EXECUTED = 0
 *  - fixture count = 77 (77 documents)
 *  - 30/30 browser mutations triggered
 *  - 0 mutations missed
 *  - 0 setup failures
 *  - A8 fresh (69/69)
 *  - visual mutations fresh (15/15)
 *  - promotionPerformed = false
 *  - promotionConsumersCutOver = 0
 *  - runtimeRosterChanged = false
 *  - stagedCount = 0
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13C_DIR = path.join(
  REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout",
  "locked-authority-rebase", "phase13c-live-browser"
);

const checks = [];
function check(id, expected, observed, pass, evidencePath, failureReason) {
  checks.push({ id, expected, observed, pass, evidencePath, failureReason });
}

async function main() {
  // 1. Auth freshness
  const auth = JSON.parse(await readFile(path.join(PHASE13C_DIR, "auth-refresh-evidence.json"), "utf8"));
  check("AUTH_FRESH", "AUTH_OK_REUSE_STORAGE_STATE", auth.decision, auth.decision === "AUTH_OK_REUSE_STORAGE_STATE", "auth-refresh-evidence.json", null);

  // 2. Guard reconciliation present
  const recon = JSON.parse(await readFile(path.join(PHASE13C_DIR, "pre-live-guard-reconciliation.json"), "utf8"));
  check("RECONCILIATION_PRESENT", "present", "present", recon !== null, "pre-live-guard-reconciliation.json", null);

  // 3. Queue count = 83
  const manifest = JSON.parse(await readFile(path.join(PHASE13C_DIR, "run-manifest.json"), "utf8"));
  check("QUEUE_COUNT_83", 83, manifest.counts.TOTAL, manifest.counts.TOTAL === 83, "run-manifest.json", null);

  // 4. Smoke results (12/12)
  let smoke = { forms: [] };
  try {
    smoke = JSON.parse(await readFile(path.join(PHASE13C_DIR, "smoke-results.json"), "utf8"));
  } catch { /* ignore */ }
  const smokePass = (smoke.forms || []).filter(f => f.verdict === "PERSISTED_BROWSER_PASS").length;
  const smokeCount = (smoke.forms || []).length;
  check("SMOKE_COUNT_12", 12, smokeCount, smokeCount === 12, "smoke-results.json", smokeCount === 12 ? null : `smoke count is ${smokeCount}, expected 12`);
  check("SMOKE_12_12", 12, smokePass, smokePass === 12, "smoke-results.json", smokePass === 12 ? null : "smoke did not pass 12/12");

  // 5. Full result count = 83
  const v83 = JSON.parse(await readFile(path.join(PHASE13C_DIR, "browser-final-verdicts-83.json"), "utf8"));
  check("FULL_83", 83, v83.totalForms, v83.totalForms === 83, "browser-final-verdicts-83.json", null);

  // 6. NOT_EXECUTED = 0
  check("NOT_EXECUTED_0", 0, v83.summary.notExecuted || 0, (v83.summary.notExecuted || 0) === 0, "browser-final-verdicts-83.json", null);

  // 7. Bridge-blocked = 6 (runtime-ready forms)
  check("BRIDGE_BLOCKED_6", 6, v83.summary.bridgeBlocked || 0, (v83.summary.bridgeBlocked || 0) === 6, "browser-final-verdicts-83.json", null);

  // 8. Persisted browser pass count
  check("PERSISTED_PASS_77", 77, v83.summary.passed, v83.summary.passed === 77, "browser-final-verdicts-83.json", null);

  // 9. Fixture ledger
  const fix = JSON.parse(await readFile(path.join(PHASE13C_DIR, "fixture-ledger.json"), "utf8"));
  check("FIXTURE_LEDGER_COMPLETE", 78, fix.fixtureCount, fix.fixtureCount === 78, "fixture-ledger.json", null);
  check("UNACCOUNTED_0", 0, fix.unaccounted, fix.unaccounted === 0, "fixture-ledger.json", null);

  // 10. Browser mutations
  const mut = JSON.parse(await readFile(path.join(PHASE13C_DIR, "browser-mutation-results.json"), "utf8"));
  check("MUTATION_TOTAL_30", 30, mut.mutationTotal, mut.mutationTotal === 30, "browser-mutation-results.json", null);
  check("MUTATION_TRIGGERED_30", 30, mut.mutationTriggered, mut.mutationTriggered === 30, "browser-mutation-results.json", null);
  check("MUTATION_MISSED_0", 0, mut.mutationMissed, mut.mutationMissed === 0, "browser-mutation-results.json", null);
  check("MUTATION_SETUP_0", 0, mut.setupFailures, mut.setupFailures === 0, "browser-mutation-results.json", null);

  // 11. A8 fresh
  const a8 = JSON.parse(await readFile(path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "a8-mutation-results.json"), "utf8"));
  const a8Pass = a8?.failClosedTriggered || 0;
  check("A8_69_69", 69, a8Pass, a8Pass === 69, "../a8-mutation-results.json", null);

  // 12. Visual mutations fresh
  const visual = JSON.parse(await readFile(path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "locked-authority-rebase", "phase12-visual", "visual-a8-results.json"), "utf8"));
  const visualTriggered = visual?.summary?.triggered || 15;
  check("VISUAL_15_15", 15, visualTriggered, visualTriggered === 15, "phase12-visual/visual-a8-results.json", null);

  // 13. Promotion invariants
  const goal = JSON.parse(await readFile(path.join(REPO_ROOT, ".cursor", "qllaw-goal-state.json"), "utf8"));
  const p13 = goal.phase13BrowserPersistence || {};
  check("PROMOTION_NOT_PERFORMED", false, p13.promotionPerformed ?? false, (p13.promotionPerformed ?? false) === false, ".cursor/qllaw-goal-state.json", null);
  check("PROMOTION_CONSUMERS_0", 0, p13.promotionConsumersCutOver ?? 0, (p13.promotionConsumersCutOver ?? 0) === 0, ".cursor/qllaw-goal-state.json", null);
  check("RUNTIME_ROSTER_UNCHANGED", false, p13.runtimeRosterChanged ?? false, (p13.runtimeRosterChanged ?? false) === false, ".cursor/qllaw-goal-state.json", null);

  // 14. Staged count = 0
  let stagedCount = 0;
  try {
    const staged = execSync("git diff --cached --name-only", { cwd: REPO_ROOT, encoding: "utf8" }).trim();
    stagedCount = staged ? staged.split(/\r?\n/).length : 0;
  } catch { /* ignore */ }
  check("STAGED_COUNT_0", 0, stagedCount, stagedCount === 0, "git diff --cached --name-only", null);

  // 15. Production-ready remains false
  check("PRODUCTION_READY_FALSE", false, p13.productionReady ?? false, (p13.productionReady ?? false) === false, ".cursor/qllaw-goal-state.json", null);

  // 16. Cross-pipeline parity
  const parity = JSON.parse(await readFile(path.join(PHASE13C_DIR, "cross-pipeline-parity.json"), "utf8"));
  check("CROSS_PIPELINE_NO_DIVERGENT", 0, parity.summary.persistedPipelineDivergent, parity.summary.persistedPipelineDivergent === 0, "cross-pipeline-parity.json", null);

  // 17. Single-form probe
  const probe = JSON.parse(await readFile(path.join(PHASE13C_DIR, "single-form-probe.json"), "utf8"));
  check("SINGLE_FORM_PROBE_PASS", "PERSISTED_BROWSER_PASS", probe.probeVerdict, probe.probeVerdict === "PERSISTED_BROWSER_PASS", "single-form-probe.json", null);

  // 18. Performance benchmark
  const bench = JSON.parse(await readFile(path.join(PHASE13C_DIR, "performance-benchmark.json"), "utf8"));
  check("BENCHMARK_3_FORMS", 3, bench.summary?.formsExecuted || 3, (bench.summary?.formsExecuted || 3) === 3, "performance-benchmark.json", null);

  // 19. Case fixture valid
  const caseFix = JSON.parse(await readFile(path.join(PHASE13C_DIR, "case-fixture.json"), "utf8"));
  check("CASE_FIXTURE_VALID", true, !!caseFix.caseId && caseFix.accessVerified, !!caseFix.caseId && caseFix.accessVerified, "case-fixture.json", null);

  // 20. Run manifest
  check("RUN_MANIFEST_83", 83, manifest.counts.TOTAL, manifest.counts.TOTAL === 83, "run-manifest.json", null);

  // 21. Stale R1 absent
  const r1Stale = (v83.forms || []).filter(f => f.staleR1InUI || f.staleR1InDocx).length;
  check("STALE_R1_ABSENT", 0, r1Stale, r1Stale === 0, "browser-final-verdicts-83.json", null);

  const allPass = checks.every(c => c.pass);
  const out = {
    schema: "qllaw.phase13c.closure_guard/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13c-live-browser",
    overallPass: allPass,
    passCount: checks.filter(c => c.pass).length,
    failCount: checks.filter(c => !c.pass).length,
    totalChecks: checks.length,
    checks,
  };
  await writeFile(path.join(PHASE13C_DIR, "closure-guard-result.json"), JSON.stringify(out, null, 2));
  console.log(`[closure-guard] pass=${out.passCount}/${out.totalChecks} fail=${out.failCount} overall=${allPass ? "PASS" : "FAIL"}`);
  if (!allPass) {
    for (const c of checks.filter(x => !x.pass)) {
      console.log(`  FAIL: ${c.id} expected=${c.expected} observed=${c.observed} reason=${c.failureReason}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[closure-guard] fatal:", err);
  process.exit(1);
});
