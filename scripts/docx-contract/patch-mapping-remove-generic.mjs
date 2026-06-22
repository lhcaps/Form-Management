#!/usr/bin/env node
/**
 * Removes generic canonicalPath entries from all-lock-mappings.json.
 * Generic entries (where canonicalPath matches GENERIC_RE) should be removed
 * so the lock script won't map/keep generic slotIds. The slots will remain
 * as-is (generic) in the locked contract, but won't block locking since
 * their DOCX has no mustache placeholders anyway.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const MAPPING_FILE = path.join(ROOT, "docs", "audit", "docx", "human-review", "all-lock-mappings.json");

// Matches: document.field, recipients.field, etc.
const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;

function isGeneric(v) {
  return typeof v === "string" && v.trim() && GENERIC_RE.test(v);
}

const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf8"));
let totalEntries = 0;
let removedEntries = 0;

for (const [formCode, target] of Object.entries(mapping.targets ?? {})) {
  const slotMappings = target.slotMappings ?? {};
  const newSlotMappings = {};
  let formRemoved = 0;

  for (const [slotId, entry] of Object.entries(slotMappings)) {
    totalEntries++;
    if (isGeneric(entry.canonicalPath ?? slotId)) {
      formRemoved++;
      removedEntries++;
    } else {
      newSlotMappings[slotId] = entry;
    }
  }

  target.slotMappings = newSlotMappings;
  if (formRemoved > 0) {
    console.log(`${formCode}: removed ${formRemoved} generic mapping entries`);
  }
}

fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
console.log(`\nTotal entries: ${totalEntries} | Removed: ${removedEntries} | Remaining: ${totalEntries - removedEntries}`);
console.log("Updated: docs/audit/docx/human-review/all-lock-mappings.json");
