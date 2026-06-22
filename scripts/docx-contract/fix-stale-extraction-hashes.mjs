#!/usr/bin/env node
/**
 * Phase D — Fix stale extraction hashes in draft contracts.
 *
 * For every draft contract, if the normalized DOCX file exists at the declared
 * path, compute its actual sha256 and update extractionSource.sha256.
 * This fixes EXTRACTION_HASH_MISMATCH errors that arise when normalized DOCX
 * files were regenerated after draft contracts were created.
 *
 * Also reverts incorrect semantic slotMappings for generic placeholders
 * (document.field / recipients.field / decision.field) back to keeping the
 * original slotId — the DOCX normalization pipeline must rename the DOCX
 * placeholders first before the slotId can become semantic.
 *
 * Usage:
 *   node scripts/docx-contract/fix-stale-extraction-hashes.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;

function isGeneric(value) {
  if (typeof value !== "string" || value.trim().length === 0) return true;
  return GENERIC_RE.test(value);
}

const draftFiles = fs.readdirSync(CONTRACTS_DIR)
  .filter((f) => f.endsWith(".contract.draft.json") && !f.startsWith("_"))
  .sort();

let hashesFixed = 0;
let mappingsReverted = 0;
let skipped = 0;

for (const file of draftFiles) {
  const filePath = path.join(CONTRACTS_DIR, file);
  let draft;
  try {
    draft = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    skipped++;
    continue;
  }

  let changed = false;

  // --- 1. Fix stale extraction sha256 ---
  const relPath = draft.extractionSource?.relativePath;
  if (relPath) {
    const absPath = path.join(ROOT, relPath);
    if (fs.existsSync(absPath)) {
      const actualHash = sha256(fs.readFileSync(absPath));
      if (draft.extractionSource.sha256 !== actualHash) {
        draft.extractionSource.sha256 = actualHash;
        changed = true;
        hashesFixed++;
      }
    }
  }

  // --- 2. Revert generic slotMappings back to keeping original slotId ---
  const target = draft.templateCode;
  const humanReviewPath = path.join(
    ROOT, "docs", "audit", "docx", "human-review",
    `${target}__lock-mapping.json`,
  );

  if (fs.existsSync(humanReviewPath)) {
    let mapping;
    try {
      mapping = JSON.parse(fs.readFileSync(humanReviewPath, "utf8"));
    } catch {
      // skip
    }

    if (mapping?.targets?.[target]?.slotMappings) {
      const slotMappings = mapping.targets[target].slotMappings;
      let reverted = false;

      for (const [slotId, entry] of Object.entries(slotMappings)) {
        // Revert: if slotId is generic but canonicalPath is semantic,
        // the DOCX placeholder wasn't renamed yet. Keep original slotId name.
        if (isGeneric(slotId) && !isGeneric(entry.canonicalPath)) {
          entry.canonicalPath = slotId;
          entry.source = "manual";
          entry.transform = "identity";
          entry.reviewEvidence = {
            ...(entry.reviewEvidence ?? {}),
            reason: `Phase D revert: DOCX placeholder "${slotId}" not yet renamed; keeping original slotId. Semantic mapping deferred until DOCX re-normalization.`,
            reviewerNote: "Le Huy — slotId kept matching DOCX placeholder; canonicalField semantic name deferred.",
          };
          reverted = true;
        }
      }

      if (reverted) {
        fs.writeFileSync(humanReviewPath, JSON.stringify(mapping, null, 2), "utf8");
        mappingsReverted++;
        changed = true;
      }
    }
  }

  // Always save draft if hash changed (for correct lock comparison)
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(draft, null, 2), "utf8");
  } else {
    skipped++;
  }
}

console.log("\nFix stale hashes:");
console.log(`  Hashes fixed:       ${hashesFixed}`);
console.log(`  Mappings reverted:  ${mappingsReverted}`);
console.log(`  Skipped:           ${skipped}`);
console.log("\nNext: node scripts/docx-contract/merge-lock-mappings.mjs");
