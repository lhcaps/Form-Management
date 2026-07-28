/**
 * Phase 11 — Re-run full persisted with the new Playwright-fill based runner.
 * Reset checkpoint first to fresh start.
 */
import fs from "node:fs";
import path from "node:path";

const PHASE14 = "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion";
// Reset checkpoint
fs.writeFileSync(path.join(PHASE14, "checkpoint.json"), JSON.stringify({ completed: {}, failed: {} }, null, 2));
console.log("Checkpoint reset.");