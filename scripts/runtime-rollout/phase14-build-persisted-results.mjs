/**
 * Phase 11 — Build persisted-ui-results-77.json from checkpoint (live + completed + failed).
 */
import fs from "node:fs";
import path from "node:path";

const PHASE14 = "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion";
const cp = JSON.parse(fs.readFileSync(path.join(PHASE14, "checkpoint.json"), "utf8"));
const completed = Object.values(cp.completed || {});
const failed = Object.values(cp.failed || {});

const result = {
  schema: "qllaw.phase14.persisted_ui_results/v1",
  generatedAt: new Date().toISOString(),
  phase: "phase14-dual-browser-promotion",
  runId: cp.runId || "PHASE14_TURN2_2026_07_27",
  totalForms: completed.length + failed.length,
  forms: [...completed, ...failed],
  summary: {
    attempted: completed.length + failed.length,
    pass: completed.filter((f) => (f.finalVerdict || f.verdict || "").includes("PASS")).length,
    fail: failed.length,
  },
};

fs.writeFileSync(path.join(PHASE14, "persisted-ui-results-77.json"), JSON.stringify(result, null, 2));
console.log(`persisted-ui-results-77.json written: attempted=${result.summary.attempted}, pass=${result.summary.pass}, fail=${result.summary.fail}`);