import fs from "node:fs";
import path from "node:path";
const PHASE14 = "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion";
const cp = { completed: {}, failed: {} };
fs.writeFileSync(path.join(PHASE14, "checkpoint.json"), JSON.stringify(cp, null, 2));
console.log("Reset checkpoint for fresh full run");