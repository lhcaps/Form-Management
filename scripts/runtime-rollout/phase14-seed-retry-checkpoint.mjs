import fs from "node:fs";
const PHASE14 = "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion";
const persisted = JSON.parse(fs.readFileSync(`${PHASE14}/persisted-ui-results-77.json`, "utf8"));
const failed = persisted.forms.filter((f) => (f.finalVerdict || f.verdict || "").includes("FAIL"));
console.log("Failed forms:", failed.length);
console.log("Codes:", failed.map((f) => f.formCode).join(", "));

// Write the failed list back into the checkpoint as starting point for retry
const cp = { completed: {}, failed: {} };
for (const f of failed) {
  cp.failed[f.formCode] = f;
}
fs.writeFileSync(`${PHASE14}/checkpoint.json`, JSON.stringify(cp, null, 2));
console.log("Wrote checkpoint with 30 failed entries ready for retry");