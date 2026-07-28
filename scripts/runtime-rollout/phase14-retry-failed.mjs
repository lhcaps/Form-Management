import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const PHASE14 = "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion";
const cp = JSON.parse(fs.readFileSync(path.join(PHASE14, "checkpoint.json"), "utf8"));
const failedCodes = Object.keys(cp.failed);
console.log("Retrying", failedCodes.length, "failed forms:", failedCodes.join(","));

(async () => {
  for (let i = 0; i < failedCodes.length; i += 1) {
    const code = failedCodes[i];
    if (cp.completed[code]) {
      console.log(`[${i+1}/${failedCodes.length}] ${code}: already PASS, skip`);
      continue;
    }
    console.log(`[${i+1}/${failedCodes.length}] ${code}: running...`);
    await new Promise((resolve) => {
      const proc = spawn("node", [
        "scripts/runtime-rollout/phase14-real-ui-runner.mjs",
        "--form", code,
        "--run-id", "PHASE14_TURN2_2026_07_27_RETRY2",
      ], { cwd: "D:\\Study\\Project\\QLLaw-main", stdio: "pipe" });
      let out = "";
      proc.stdout.on("data", (d) => { out += d; });
      proc.stderr.on("data", (d) => { out += d; });
      proc.on("close", () => {
        const newCp = JSON.parse(fs.readFileSync(path.join(PHASE14, "checkpoint.json"), "utf8"));
        const ok = newCp.completed[code] ? "PASS" : (newCp.failed[code] ? "FAIL" : "UNKNOWN");
        console.log(`[${i+1}/${failedCodes.length}] ${code}: ${ok}`);
        resolve();
      });
      proc.on("error", resolve);
    });
    await new Promise((r) => setTimeout(r, 6000));
  }
  const finalCp = JSON.parse(fs.readFileSync(path.join(PHASE14, "checkpoint.json"), "utf8"));
  const passes = Object.keys(finalCp.completed).length;
  const fails = Object.keys(finalCp.failed).length;
  console.log(`\nFINAL: ${passes} pass, ${fails} fail`);
})();