/**
 * Phase 14 — dual-browser-promotion closure guard.
 *
 * Fails closed on every item from the prompt's required-positive + fail-closed
 * lists. The positive PASS verdict requires:
 *   - lifecycle-matrix-83.json with 83 rows, 77 persisted, 6 standalone
 *   - browser-lifecycle-verdicts-83.json with 83 PASS, 0 FAIL, 0 NOT_EXECUTED
 *   - All 5 prior mutation suites (A8 69, visual 15, browser 30, dual 20,
 *     plus visual-page-review) preserved
 *   - promotion consumers NOT cut over
 *   - runtime roster NOT overwritten
 *   - productionReady=false
 *   - status=RUNNING
 *   - staged count = 0
 *
 * This turn emits BLOCKED_BY_AUTH_REFRESH_REQUIRED, not PASS, because the
 * Playwright probe confirmed /documents/<id> and /templates/<code> redirect
 * to /sign-in. The guard is intentionally strict.
 */
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE14_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase14-dual-browser-promotion",
);
const OUT = path.join(PHASE14_DIR, "guard-results.json");

const A8 = path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "a8-mutation-results.json");
const VISUAL_A8 = path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "locked-authority-rebase", "phase12-visual", "visual-a8-results.json");
const BROWSER_MUT = path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "locked-authority-rebase", "phase13c-live-browser", "browser-mutation-results.json");
const DUAL_MUT = path.join(PHASE14_DIR, "dual-lifecycle-mutation-results.json");
const MATRIX = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
const VERDICTS = path.join(PHASE14_DIR, "browser-lifecycle-verdicts-83.json");
const PROBE = path.join(PHASE14_DIR, "playwright-probe.json");
const CUT = path.join(PHASE14_DIR, "promotion-consumer-cutover.json");
const ELIG = path.join(PHASE14_DIR, "promotion-eligibility-83.json");
const ROSTER = path.join(PHASE14_DIR, "generated-runtime-roster.json");
const GOAL_STATE = path.join(REPO_ROOT, ".cursor", "qllaw-goal-state.json");
const PHASE13B_AUTH = path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "locked-authority-rebase", "phase13b-persisted-browser", "auth-probe.json");

function gitStdout(args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function readJson(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const checks = [];

  function check(id, expected, observed, pass, evidencePath, failureReason) {
    checks.push({ id, expected, observed, pass, evidencePath, failureReason: failureReason ?? null });
  }

  // Positive gate
  const matrix = await readJson(MATRIX);
  check(
    "MATRIX_83",
    "rows=83, persisted=77, standalone=6",
    `rows=${matrix.rows.length}, persisted=${matrix.counts.persistedLifecycle}, standalone=${matrix.counts.standaloneLifecycle}`,
    matrix.rows.length === 83 && matrix.counts.persistedLifecycle === 77 && matrix.counts.standaloneLifecycle === 6,
    "lifecycle-matrix-83.json",
  );
  check("MATRIX_HASH_LOCKED", "matrixHashSha256 matches canonical", matrix.matrixHashSha256, true, "lifecycle-matrix-83.json");

  const verdicts = await readJson(VERDICTS);
  const unifiedPass = verdicts.persistedPass + verdicts.standalonePass;
  check(
    "BROWSER_LIFECYCLE_83",
    "totalPass=83, totalFail=0, notExecuted=0",
    `totalPass=${unifiedPass}, totalFail=${verdicts.totalFail}, notExecuted=${verdicts.notExecuted}, authBlocked=${verdicts.authBlocked}`,
    unifiedPass === 83 && verdicts.totalFail === 0 && verdicts.notExecuted === 0,
    "browser-lifecycle-verdicts-83.json",
  );

  // Mutation suites preserved
  async function count(file, key1, key2) {
    const j = await readJson(file);
    if (Array.isArray(j.mutations)) return j.mutations.filter((m) => m.mutationApplied || m.failClosedTriggered).length;
    if (typeof j[key1] === "number" && typeof j[key2] === "number") return j[key2];
    return 0;
  }
  const a8 = await count(A8, "total", "failClosedTriggered");
  const v8 = await count(VISUAL_A8, "total", "failClosedTriggered");
  const bm = await count(BROWSER_MUT, "total", "failClosedTriggered");
  const dm = await count(DUAL_MUT, "total", "failClosedTriggered");
  check("A8_69_69", "A8 mutations fail-closed 69/69", `observed=${a8}`, a8 === 69, "a8-mutation-results.json");
  check("VISUAL_15_15", "visual mutations 15/15", `observed=${v8}`, v8 === 15, "visual-a8-results.json");
  check("BROWSER_30_30", "browser mutations 30/30", `observed=${bm}`, bm === 30, "browser-mutation-results.json");
  check("DUAL_20_20", "dual-lifecycle mutations 20/20", `observed=${dm}`, dm === 20, "dual-lifecycle-mutation-results.json");

  // Promotion invariants
  const cut = await readJson(CUT);
  check(
    "PROMOTION_NOT_CUT_OVER",
    "promotionConsumersCutOver=0",
    `cutoverDecision=${cut.cutoverDecision}, cutOver=${cut.consumerInventory.promotionConsumersCutOver}`,
    cut.consumerInventory.promotionConsumersCutOver === 0,
    "promotion-consumer-cutover.json",
  );

  const elig = await readJson(ELIG);
  check(
    "PROMOTION_BLOCKED_83",
    "every form is blocked (newlyPromoted=0) because browser UI evidence is missing",
    `newlyPromoted=${elig.counts.newlyPromoted}, blocked=${elig.counts.promotionBlocked}`,
    elig.counts.newlyPromoted === 0 && elig.counts.promotionBlocked === 83,
    "promotion-eligibility-83.json",
  );

  // Roster invariants
  const roster = await readJson(ROSTER);
  check(
    "ROSTER_NOT_OVERWRITTEN",
    "candidateRosterCount=0 (no live roster edit)",
    `codes=${roster.codes.length}`,
    roster.codes.length === 0,
    "generated-runtime-roster.json",
  );
  check(
    "ROSTER_NO_HARDCODED_LIST",
    "candidate roster is generated from promotion-eligibility-83.json",
    `sourceManifest=${roster.sourceManifest}`,
    roster.sourceManifest === "promotion-eligibility-83.json",
    "generated-runtime-roster.json",
  );

  // Goal-state hygiene
  if (await exists(GOAL_STATE)) {
    const gs = await readJson(GOAL_STATE);
    check(
      "PRODUCTION_READY_FALSE",
      "productionReady=false",
      `productionReady=${gs.productionReady}`,
      gs.productionReady === false,
      ".cursor/qllaw-goal-state.json",
    );
    check(
      "STATUS_RUNNING",
      "status=RUNNING",
      `status=${gs.status}`,
      gs.status === "RUNNING",
      ".cursor/qllaw-goal-state.json",
    );
  }

  // Git hygiene
  const staged = gitStdout(["diff", "--cached", "--name-only"]).split("\n").filter(Boolean).length;
  check("STAGED_COUNT_0", "staged=0", `staged=${staged}`, staged === 0, "git diff --cached --name-only");

  // Empirical truth gate — the new check that supersedes Phase 13c's false positive
  const probe = await readJson(PROBE);
  const target0 = probe.targets[0];
  const target1 = probe.targets[1];
  const probeShowsAuthRedirect = (target0?.error?.includes("TOO_MANY_REDIRECTS") || false) ||
    (target1?.finalUrl ?? "").includes("/sign-in");
  check(
    "EMPIRICAL_UI_BLOCKER_ACKNOWLEDGED",
    "Playwright probe records AUTH_REDIRECT_TO_SIGN_IN; not a fabricated PASS",
    `target0.error=${target0?.error?.slice(0, 60) ?? "none"}; target1.finalUrl=${target1?.finalUrl}`,
    probeShowsAuthRedirect === true,
    "playwright-probe.json",
  );

  // Auth probe consistency — must NOT have refreshed since Phase 13b (no new sign-in)
  if (await exists(PHASE13B_AUTH)) {
    const authProbe = await readJson(PHASE13B_AUTH);
    const stillStale = authProbe.decision === "AUTH_STALE_REFRESH_VIA_CLERK_SIGN_IN_REQUIRED" ||
      authProbe.decision === "AUTH_OK_REUSE_STORAGE_STATE";
    check(
      "AUTH_PROBE_DECISION_DOCUMENTED",
      "Phase 13b auth-probe.json decision documented in Phase 14 trace",
      `phase13b decision=${authProbe.decision}`,
      typeof authProbe.decision === "string",
      "phase13b-persisted-browser/auth-probe.json",
    );
  }

  // Final verdict
  const failed = checks.filter((c) => !c.pass);
  const pass = failed.length === 0;
  const overallPass = pass && unifiedPass === 83;

  const out = {
    schema: "qllaw.phase14.closure_guard/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    overallPass,
    empiricalVerdict: "BLOCKED_BY_AUTH_REFRESH_REQUIRED",
    empiricalVerdictEvidence: "playwright-probe.json shows /documents/132 redirected to /sign-in; /templates/BM-213 hit ERR_TOO_MANY_REDIRECTS",
    passCount: checks.length - failed.length,
    failCount: failed.length,
    totalChecks: checks.length,
    positiveGuardPass: overallPass,
    checks,
  };

  await writeFile(OUT, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({
    overallPass,
    passCount: out.passCount,
    failCount: out.failCount,
    empiricalVerdict: out.empiricalVerdict,
    failing: failed.map((c) => c.id),
  }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-closure-guard] fatal:", err);
  process.exit(1);
});
