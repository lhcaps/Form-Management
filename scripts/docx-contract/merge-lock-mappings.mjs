#!/usr/bin/env node
/**
 * Merges all individual lock mappings into one and runs lock-reviewed-contracts.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const HUMAN_REVIEW_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "human-review");
const OUT_FILE = path.join(HUMAN_REVIEW_DIR, "all-lock-mappings.json");

const files = fs.readdirSync(HUMAN_REVIEW_DIR)
  .filter((f) => f.endsWith("__lock-mapping.json"));

const merged = {
  reviewedBy: "system-batch-lock",
  reviewedAt: new Date().toISOString(),
  targets: {},
};

for (const file of files) {
  try {
    const content = JSON.parse(fs.readFileSync(path.join(HUMAN_REVIEW_DIR, file), "utf8"));
    const bm = Object.keys(content.targets ?? {})[0];
    if (bm) merged.targets[bm] = content.targets[bm];
  } catch (e) {
    console.error(`SKIP (parse error): ${file}: ${e.message}`);
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));
console.log(`Merged ${Object.keys(merged.targets).length} targets → ${path.basename(OUT_FILE)}`);
console.log("Now run: node scripts/docx-contract/lock-reviewed-contracts.mjs --mapping docs/audit/docx/human-review/all-lock-mappings.json");
