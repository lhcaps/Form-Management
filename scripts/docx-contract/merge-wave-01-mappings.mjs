#!/usr/bin/env node
/**
 * Merge individual lock-mapping files into one for lock-reviewed-contracts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const MAPPING_DIR = path.join(ROOT, "docs", "audit", "docx", "human-review");

const WAVE_01 = [
  "BM-051", "BM-052", "BM-060", "BM-061", "BM-062",
  "BM-063", "BM-064", "BM-065", "BM-066", "BM-067",
];

const merged = {
  reviewedBy: "Le Huy",
  reviewedAt: new Date().toISOString(),
  reviewKind: "human",
  targets: {},
};

for (const code of WAVE_01) {
  const file = path.join(MAPPING_DIR, `${code}__lock-mapping.json`);
  if (!fs.existsSync(file)) {
    console.log(`SKIP: ${code} (no mapping file)`);
    continue;
  }
  const m = JSON.parse(fs.readFileSync(file, "utf8"));
  const targetKey = Object.keys(m.targets ?? {})[0];
  if (!targetKey) { console.log(`SKIP: ${code} (empty targets)`); continue; }
  merged.targets[code] = m.targets[targetKey];
  console.log(`ADD: ${code}`);
}

const outPath = path.join(MAPPING_DIR, "wave-01-merged-lock-mapping.json");
fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
console.log(`\nMerged mapping: ${outPath}`);
console.log(`Forms: ${Object.keys(merged.targets).join(", ")}`);
