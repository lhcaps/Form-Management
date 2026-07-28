/**
 * Phase 13C list-mode runner helper.
 *
 * Usage:  node scripts/runtime-rollout/run-phase13c-list.mjs <form-list.txt> [output]
 *
 * Reads form codes (one per line) from the file and runs the full
 * persisted browser lifecycle for each, writing results to the output
 * file. Avoids the per-form login cost by issuing ONE login for the
 * whole session.
 */
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const formList = (await readFile(process.argv[2], "utf8")).split(/\r?\n/u).map((s) => s.trim()).filter(Boolean);
const output = process.argv[3] || path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "locked-authority-rebase", "phase13c-live-browser", "browser-full-results.json");

console.log(`[phase13c-list] forms=${formList.length} output=${output}`);

// Write the list to a temp file
const listFile = path.join(REPO_ROOT, "scripts", "runtime-rollout", "_tmp_form_list.txt");
await writeFile(listFile, formList.join("\n"), "utf8");

// Invoke the runner with the list file
const outputArg = process.argv[3] || null;
const env = outputArg ? { ...process.env, PHASE13C_OUT: outputArg } : process.env;
const res = spawnSync("node", [
  "scripts/runtime-rollout/run-phase13c-browser-e2e.mjs",
  "--mode", "full",
  "--forms-file", listFile,
], { stdio: "inherit", cwd: REPO_ROOT, env });
if (res.status !== 0) {
  console.error(`[phase13c-list] runner failed: exit ${res.status}`);
  process.exit(res.status ?? 1);
}
console.log(`[phase13c-list] done — results in ${output || path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "locked-authority-rebase", "phase13c-live-browser", "browser-full-results.json")}`);
