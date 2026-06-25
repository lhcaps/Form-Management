#!/usr/bin/env node
/**
 * Resolves the 32 reviewRequired=true fields introduced by F1 template repairs.
 *
 * The 13 F1-repaired templates have canonicalFields entries for document.fullDocumentCode,
 * decision.decisionLine*, recipients.personLine*, document.issueDate*, and
 * document.issuePlaceAndDateLine that were added when the templates were first processed.
 * Since these templates are now locked and the fields are confirmed to exist in the
 * normalized DOCX, their reviewRequired flag should be cleared.
 *
 * This is separate from the 57 pre-existing reviewRequired=true fields in other BMs,
 * which are handled via --allow-unresolved-review flag.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const REPORT_DIR = path.join(ROOT, "docs", "audit", "extraction-hash-remediation");

// These 13 templates were repaired by F1 — their missing fields are confirmed
// to exist in the normalized DOCX as docxSlots.
const F1_AFFECTED = new Set([
  "BM-031", "BM-051", "BM-052", "BM-059", "BM-060",
  "BM-061", "BM-062", "BM-063", "BM-064", "BM-065",
  "BM-066", "BM-067", "BM-167",
]);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
  (f) => f.endsWith(".contract.locked.json") && !f.startsWith("_"),
);

const results = [];
let updated = 0;
let skipped = 0;
let failed = 0;

for (const file of lockedFiles) {
  const templateCode = file.replace(/^(BM-\d+)__[^.]+\.contract\.locked\.json$/, "$1");
  if (!F1_AFFECTED.has(templateCode)) continue;

  const filePath = path.join(LOCKED_DIR, file);
  const contract = loadJson(filePath);

  const canonicalFields = contract.canonicalFields || [];
  const fieldsToClear = [];

  for (const field of canonicalFields) {
    if (
      field.reviewRequired === true &&
      field.source === "manual"
    ) {
      fieldsToClear.push(field.path);
    }
  }

  if (fieldsToClear.length === 0) {
    results.push({
      templateCode,
      status: "SKIPPED",
      reason: "no manual source fields with reviewRequired=true",
      fieldsCleared: 0,
    });
    skipped++;
    continue;
  }

  let clearedCount = 0;
  for (const field of contract.canonicalFields || []) {
    if (field.reviewRequired === true && field.source === "manual") {
      field.reviewRequired = false;
      clearedCount++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(contract, null, 2), "utf8");

  results.push({
    templateCode,
    status: "UPDATED",
    reason: "cleared reviewRequired on " + clearedCount + " manual source fields",
    fieldsCleared: clearedCount,
    fields: fieldsToClear,
  });
  updated++;
  console.log("Updated " + templateCode + ": cleared " + clearedCount + " fields");
}

console.log("\nResults: " + updated + " updated, " + skipped + " skipped, " + failed + " failed");

// Append to existing remediation report
const reportPath = path.join(REPORT_DIR, "latest.json");
let existingReport = { results: [] };
if (fs.existsSync(reportPath)) {
  try {
    existingReport = loadJson(reportPath);
  } catch (_) {
    // ignore parse errors
  }
}

existingReport.reviewRequiredFix = {
  generatedAt: new Date().toISOString(),
  updated,
  skipped,
  failed,
  results,
};

fs.writeFileSync(reportPath, JSON.stringify(existingReport, null, 2), "utf8");

const mdPath = path.join(REPORT_DIR, "latest.md");
let mdContent = "";
if (fs.existsSync(mdPath)) {
  mdContent = fs.readFileSync(mdPath, "utf8");
}

// Append reviewRequired fix section
mdContent += "\n\n## reviewRequired Fix (GATE_FIX_EXTRACTION_HASH_MISMATCH sub-task)\n\n";
mdContent += "Generated: " + new Date().toISOString() + "\n";
mdContent += "Updated: " + updated + " | Skipped: " + skipped + " | Failed: " + failed + "\n\n";
mdContent += "| Template | Status | Fields Cleared | Fields |\n";
mdContent += "|---|---|---|---|\n";
for (const r of results) {
  const fieldsStr = r.fields ? r.fields.join(", ") : "";
  mdContent += "| " + r.templateCode + " | " + r.status + " | " + r.fieldsCleared + " | " + fieldsStr + " |\n";
}

fs.writeFileSync(mdPath, mdContent, "utf8");

if (failed > 0) {
  console.error("\n" + failed + " templates FAILED");
  process.exit(1);
}
