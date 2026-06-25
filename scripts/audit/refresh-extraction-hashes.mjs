#!/usr/bin/env node
/**
 * GATE_FIX_EXTRACTION_HASH_MISMATCH
 *
 * Refreshes extractionSource.sha256 in locked contracts for the 13 templates
 * that were intentionally repaired by F1_FIX (repair-triple-brace-placeholders.mjs).
 *
 * The normalized DOCX files were modified in-place, so the SHA256 hash changed.
 * The locked contract JSON still carries the old hash.
 * This script updates extractionSource.sha256 to match the current DOCX hash
 * using the authoritative afterHash values from triple-brace-repair.json.
 *
 * Strict constraints:
 *   - Only update extractionSource.sha256
 *   - Do NOT change any field paths, labels, required flags, sources,
 *     docxSlots, renderBindings, or canonicalFields
 *   - Fail if structural counts change after the update
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const TRIPLE_BRACE_REPAIR = path.join(ROOT, "docs", "audit", "docx-slot-inventory", "triple-brace-repair.json");
const REPORT_DIR = path.join(ROOT, "docs", "audit", "extraction-hash-remediation");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Load authoritative after-hashes from triple-brace-repair.json
const repair = loadJson(TRIPLE_BRACE_REPAIR);
const afterHashByTemplate = new Map(
  repair.repairedTemplates.map((t) => [t.templateCode, t.afterHash]),
);

const AFFECTED_CODES = [...afterHashByTemplate.keys()];
console.log("Affected templates: " + AFFECTED_CODES.join(", "));

// Find locked files for each template
const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
  (f) => f.endsWith(".contract.locked.json") && !f.startsWith("_"),
).sort();

const results = [];
let updated = 0;
let skipped = 0;
let failed = 0;

for (const file of lockedFiles) {
  const templateCode = file.replace(/^(BM-\d+)__[^.]+\.contract\.locked\.json$/, "$1");
  if (!afterHashByTemplate.has(templateCode)) continue;

  const filePath = path.join(LOCKED_DIR, file);
  const contract = loadJson(filePath);
  const newHash = afterHashByTemplate.get(templateCode);
  const oldHash = (contract.extractionSource && contract.extractionSource.sha256) || null;

  // Record structural counts BEFORE
  const slotCountBefore = (contract.docxSlots || []).length;
  const fieldCountBefore = (contract.canonicalFields || []).length;
  const bindingCountBefore = (contract.renderBindings || []).length;

  if (oldHash === newHash) {
    results.push({
      templateCode,
      status: "SKIPPED",
      reason: "hash unchanged (" + (oldHash ? oldHash.slice(0, 8) : "null") + ")",
      slotCountBefore,
      fieldCountBefore,
      bindingCountBefore,
      slotCountAfter: slotCountBefore,
      fieldCountAfter: fieldCountBefore,
      bindingCountAfter: bindingCountBefore,
      oldHash,
      newHash,
    });
    skipped++;
    continue;
  }

  // Update extraction hash
  contract.extractionSource.sha256 = newHash;

  // Record structural counts AFTER
  const slotCountAfter = (contract.docxSlots || []).length;
  const fieldCountAfter = (contract.canonicalFields || []).length;
  const bindingCountAfter = (contract.renderBindings || []).length;

  // STRICT: structural counts must not change
  if (
    slotCountAfter !== slotCountBefore ||
    fieldCountAfter !== fieldCountBefore ||
    bindingCountAfter !== bindingCountBefore
  ) {
    results.push({
      templateCode,
      status: "FAILED",
      reason: "structural count changed: slots " + slotCountBefore + "->" + slotCountAfter +
        ", fields " + fieldCountBefore + "->" + fieldCountAfter +
        ", bindings " + bindingCountBefore + "->" + bindingCountAfter,
      slotCountBefore,
      fieldCountBefore,
      bindingCountBefore,
      slotCountAfter,
      fieldCountAfter,
      bindingCountAfter,
      oldHash,
      newHash,
    });
    failed++;
    console.error("FAILED " + templateCode + ": structural counts changed");
    continue;
  }

  // Verify hash on disk matches newHash
  const relPath = contract.extractionSource && contract.extractionSource.relativePath;
  if (relPath) {
    const absPath = path.join(ROOT, relPath.replace(/\\/g, "/"));
    if (fs.existsSync(absPath)) {
      const actualHash = sha256(fs.readFileSync(absPath));
      if (actualHash !== newHash) {
        results.push({
          templateCode,
          status: "FAILED",
          reason: "disk hash mismatch: expected " + newHash.slice(0, 8) + ", got " + actualHash.slice(0, 8),
          slotCountBefore,
          fieldCountBefore,
          bindingCountBefore,
          slotCountAfter,
          fieldCountAfter,
          bindingCountAfter,
          oldHash,
          newHash,
        });
        failed++;
        console.error("FAILED " + templateCode + ": disk hash " + actualHash.slice(0, 8) + " != expected " + newHash.slice(0, 8));
        continue;
      }
    }
  }

  // Write updated locked contract
  fs.writeFileSync(filePath, JSON.stringify(contract, null, 2), "utf8");

  results.push({
    templateCode,
    status: "UPDATED",
    reason: (oldHash ? oldHash.slice(0, 8) : "null") + " -> " + newHash.slice(0, 8),
    slotCountBefore,
    fieldCountBefore,
    bindingCountBefore,
    slotCountAfter,
    fieldCountAfter,
    bindingCountAfter,
    oldHash,
    newHash,
  });
  updated++;
}

console.log("\nResults: " + updated + " updated, " + skipped + " skipped, " + failed + " failed");

// Write report
fs.mkdirSync(REPORT_DIR, { recursive: true });

const reportJson = {
  generatedAt: new Date().toISOString(),
  totalAffected: AFFECTED_CODES.length,
  updated,
  skipped,
  failed,
  results,
};

fs.writeFileSync(
  path.join(REPORT_DIR, "latest.json"),
  JSON.stringify(reportJson, null, 2),
  "utf8",
);

const mdLines = [
  "# Extraction Hash Remediation Report",
  "",
  "Generated: " + reportJson.generatedAt,
  "Affected: " + AFFECTED_CODES.length + " templates",
  "Updated: " + updated,
  "Skipped: " + skipped,
  "Failed: " + failed,
  "",
  "| Template | Status | Old Hash | New Hash | Slots | Fields | Bindings |",
  "|---|---|---|---|---|---|---|---|",
];

for (const r of results) {
  const old = r.oldHash ? r.oldHash.slice(0, 8) : "null";
  const ne = r.newHash ? r.newHash.slice(0, 8) : "null";
  mdLines.push(
    "| " + r.templateCode + " | " + r.status + " | " + old + " | " + ne + " | " +
    r.slotCountBefore + "/" + r.slotCountAfter + " | " +
    r.fieldCountBefore + "/" + r.fieldCountAfter + " | " +
    r.bindingCountBefore + "/" + r.bindingCountAfter + " |",
  );
}

fs.writeFileSync(
  path.join(REPORT_DIR, "latest.md"),
  mdLines.join("\n"),
  "utf8",
);

console.log("\nReport: " + path.join(REPORT_DIR, "latest.md"));

if (failed > 0) {
  console.error("\n" + failed + " templates FAILED — fix before proceeding");
  process.exit(1);
}

console.log("\nAll 13 extraction hashes refreshed");
