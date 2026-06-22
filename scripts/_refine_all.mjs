#!/usr/bin/env node
/**
 * Run refine on all 213 BMs that have profiles.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(__dirname, "form-refinement", "profiles");
const contractsDir = path.join(__dirname, "..", "docs", "audit", "docx", "contracts");

// Get all profile codes
const profileCodes = fs.readdirSync(PROFILES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(".json", ""))
  .sort();

// Split into batches of 50 to avoid command line length limits
const batchSize = 50;
for (let i = 0; i < profileCodes.length; i += batchSize) {
  const batch = profileCodes.slice(i, i + batchSize);
  const codesArg = batch.join(",");
  const cmd = `node scripts/refine-form-contracts-from-normalized-docx.mjs --codes=${codesArg} --write`;
  console.log(`\n=== Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} BMs ===`);
  try {
    execSync(cmd, { cwd: path.join(__dirname, ".."), stdio: "inherit" });
  } catch (e) {
    console.error("Batch failed:", e.message);
  }
}
console.log("\nAll batches done.");
