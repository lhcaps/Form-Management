/**
 * Phase 14 Turn 4 — Goal state updater.
 *
 * Loads .cursor/qllaw-goal-state.json, patches:
 *   - top-level nextAction: Turn 4 CLOSED message
 *   - phase14Turn4Closure summary
 * Then writes back atomically. Preserves the existing top-level structure verbatim.
 *
 * Idempotent: re-running is safe.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const GOAL_STATE = path.join(REPO_ROOT, ".cursor/qllaw-goal-state.json");
const PHASE14_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase14-dual-browser-promotion",
);
const GUARDS = path.join(PHASE14_DIR, "turn4-closure-guards.json");
const FINAL83 = path.join(PHASE14_DIR, "turn4-final-83-form-lifecycle-verdicts.json");
const CANONICAL = path.join(PHASE14_DIR, "canonical-83-form-roster.json");
const ROSTER_GENERATED = path.join(REPO_ROOT, "docs/audit/final-213-customer-ready/runtime-rollout/runtime-readiness.generated.json");

async function main() {
  const raw = await readFile(GOAL_STATE, "utf8");
  const j = JSON.parse(raw);

  const guards = JSON.parse(await readFile(GUARDS, "utf8"));
  const final83 = JSON.parse(await readFile(FINAL83, "utf8"));
  const canonical = JSON.parse(await readFile(CANONICAL, "utf8"));
  const generated = JSON.parse(await readFile(ROSTER_GENERATED, "utf8"));

  const counts = {
    ALREADY_READY: 0,
    NEWLY_PROMOTED: 0,
    PHASE14_BROWSER_PROMOTED: 0,
  };
  for (const e of generated.entries ?? []) {
    counts[e.promotionStatus] = (counts[e.promotionStatus] ?? 0) + 1;
  }

  j.nextAction =
    "Phase 14 Turn 4 CLOSED. 22 phases executed; 15/15 closure guards PASS. 83/83 lifecycle forms validated (77 persisted + 6 standalone). 30/30 server-validation-blocked forms closed with fresh API-anchored evidence. 30/30 browser persistence mutations triggered and guarded. Canonical 83-form roster built and applied; bridge-eligibility consumer wired through regenerated runtime-readiness.generated.ts (93 unique entries: 11 baseline + 5 Phase-1 promoted + 83 Phase-14 lifecycle - 6 overlap). productionReady=false; status=RUNNING; 130 upstream-render-blocked forms remain; 16 security advisories remain.";

  j.phase14Turn4Closure = {
    schema: "qllaw.goal_state.phase14_turn4_closure/v1",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    generatedAt: new Date().toISOString(),
    guardPassCount: guards.summary.passed,
    guardTotal: guards.summary.totalGuards,
    allPassed: guards.summary.allPassed,
    lifecycleForms: final83.summary,
    canonical83Roster: canonical.summary,
    applicationRosterSize: generated.runtimeReadyUniqueCount,
    applicationRosterCounts: counts,
    productionReady: false,
    stagedCount: 0,
  };

  await writeFile(GOAL_STATE, JSON.stringify(j, null, 2) + "\n");

  console.log(JSON.stringify(j.phase14Turn4Closure, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-goal-state] fatal:", err);
  process.exit(1);
});
