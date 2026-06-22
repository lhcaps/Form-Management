#!/usr/bin/env node
/**
 * Phase D - Gate: 213/213 corpus readiness check.
 *
 * Exits 0 only when:
 *   1. Exactly 213 locked .contract.locked.json files exist.
 *   2. All 213 are human-reviewed (reviewKind === "human").
 *   3. Zero generic slot/binding/field paths exist.
 *
 * Exit codes:
 *   0 = all gates pass
 *   1 = gate failure (reason printed to stderr)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");

// Matches generic DOCX-extracted paths: document.field, recipients.field, etc.
const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;

function isGenericContractPath(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  return GENERIC_RE.test(value);
}

const lockedFiles = (fs.readdirSync(LOCKED_DIR) ?? [])
  .filter((f) => f.endsWith(".contract.locked.json") && !f.startsWith("_"))
  .sort();

const total = lockedFiles.length;

if (total !== 213) {
  console.error(`\n[GATE FAILED] Locked count: ${total} (expected 213)`);
  process.exit(1);
}

const issues = [];
let humanReviewed = 0;
let genericSlots = 0;
let genericFields = 0;
let genericBindings = 0;

for (const file of lockedFiles) {
  const c = JSON.parse(
    fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"),
  );

  if (c.productMetadata?.reviewKind === "human") {
    humanReviewed++;
  }

  genericSlots += (c.docxSlots ?? []).filter((s) =>
    isGenericContractPath(s.slotId)
  ).length;

  genericFields += (c.canonicalFields ?? []).filter((f) =>
    isGenericContractPath(f.path)
  ).length;

  genericBindings += (c.renderBindings ?? []).filter(
    (b) =>
      isGenericContractPath(b.slotId) ||
      isGenericContractPath(b.from),
  ).length;
}

console.log(`\n[gate:forms:213]`);
console.log(`  Locked count:    ${total}/213`);
console.log(`  Human-reviewed:  ${humanReviewed}/213`);
console.log(`  Generic slots:  ${genericSlots}`);
console.log(`  Generic fields: ${genericFields}`);
console.log(`  Generic binds:  ${genericBindings}`);

if (humanReviewed < 213) {
  issues.push(`human-reviewed: ${humanReviewed}/213`);
}
if (genericSlots > 0) {
  issues.push(`generic slots: ${genericSlots}`);
}
if (genericFields > 0) {
  issues.push(`generic fields: ${genericFields}`);
}
if (genericBindings > 0) {
  issues.push(`generic bindings: ${genericBindings}`);
}

if (issues.length > 0) {
  console.error(`\n[GATE FAILED]`);
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  process.exit(1);
}

console.log(
  `\n[GATE PASSED] 213/213 forms locked and human-reviewed, 0 generic paths.`,
);
process.exit(0);
