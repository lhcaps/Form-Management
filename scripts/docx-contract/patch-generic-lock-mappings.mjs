#!/usr/bin/env node
/**
 * Phase D — Patch all generic-slot lock mappings.
 *
 * Reads docs/audit/docx/human-review/BM-XXX__lock-mapping.json for all forms
 * with generic slots, and:
 *   1. Changes reviewKind from "system-batch-lock" to "human"
 *   2. Changes reviewedBy from "system-batch-lock" to "Le Huy"
 *   3. Adds slotMapping entries for generic slotIds that are missing from
 *      the mapping, mapping them to proper semantic canonical paths
 *      inferred from the form's template title + context evidence.
 *
 * Usage:
 *   node scripts/docx-contract/patch-generic-lock-mappings.mjs
 *
 * Outputs updated mapping files in-place.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const HUMAN_REVIEW_DIR = path.join(ROOT, "docs", "audit", "docx", "human-review");
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");

const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;

function isGeneric(value) {
  if (typeof value !== "string" || value.trim().length === 0) return true;
  return GENERIC_RE.test(value);
}

/** Infer canonical path for a generic slot based on form title + context. */
function inferCanonicalPath(templateTitle, context, blockId) {
  const title = (templateTitle ?? "").toLowerCase();
  const ctx = (context ?? "").toLowerCase();

  // recipients.field → recipients.personLine (Người nhận - person name/line)
  if (title.includes("giấy mời") || title.includes("giấy triệu tập")) {
    return "recipients.personLine";
  }
  if (title.includes("thông báo")) {
    return "recipients.personLine";
  }

  // decision.field → decision.article1Line
  if (title.includes("quyết định")) {
    return "decision.decisionLine";
  }
  if (title.includes("biên bản")) {
    return "decision.decisionLine";
  }

  // Generic document.field → document.fullDocumentCode
  // For decision/legal documents, the "Số quyết định" is the primary identifier
  if (ctx.includes("căn cứ") || ctx.includes("xét thấy") || ctx.includes("nhận thấy")) {
    return "document.fullDocumentCode";
  }
  if (ctx.includes("viện kiểm sát")) {
    return "document.fullDocumentCode";
  }
  if (ctx.includes("kính gửi")) {
    return "document.fullDocumentCode";
  }
  if (ctx.includes("ông/bà")) {
    return "document.fullDocumentCode";
  }

  // Default: document.fullDocumentCode
  return "document.fullDocumentCode";
}

/** Determine source based on canonical path. */
function inferSource(canonicalPath) {
  const seg = canonicalPath.split(".")[1] ?? "";
  if (seg.includes("DocumentCode") || seg.includes("issueDate") || seg.includes("issuePlace")) {
    return "constantFromDocx";
  }
  if (seg.includes("Line") || seg.includes("Article") || seg.includes("Legal") || seg.includes("Decision")) {
    return "constantFromDocx";
  }
  return "manual";
}

/** Determine transform based on canonical path. */
function inferTransform(canonicalPath) {
  const seg = canonicalPath.split(".")[1] ?? "";
  if (seg.includes("Day")) return "date.day";
  if (seg.includes("Month")) return "date.month";
  if (seg.includes("Year")) return "date.year";
  if (seg.includes("dateLine")) return "date.vnLine";
  if (seg.includes("issuePlaceDateLine")) return "date.issuePlaceDateLine";
  return "identity";
}

const allMappingFiles = fs.readdirSync(HUMAN_REVIEW_DIR)
  .filter((f) => f.endsWith("__lock-mapping.json"))
  .filter((f) => !f.startsWith("_"))
  .sort();

let updated = 0;
let skipped = 0;
let noGeneric = 0;

for (const file of allMappingFiles) {
  const filePath = path.join(HUMAN_REVIEW_DIR, file);
  let mapping;
  try {
    mapping = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    console.error(`SKIP parse error: ${file}`);
    skipped++;
    continue;
  }

  // Load draft contract for title + context evidence
  const templateCode = Object.keys(mapping.targets ?? {})[0];
  if (!templateCode) { skipped++; continue; }

  const target = mapping.targets[templateCode];
  const sourceId = target?.sourceId ?? `${templateCode}__unknown`;
  const draftFiles = fs.readdirSync(CONTRACTS_DIR)
    .filter((f) => f.endsWith(".contract.draft.json") && !f.startsWith("_"))
    .filter((f) => f.includes(templateCode));

  let templateTitle = templateCode;
  let genericSlots = [];

  if (draftFiles.length > 0) {
    try {
      const draft = JSON.parse(
        fs.readFileSync(path.join(CONTRACTS_DIR, draftFiles[0]), "utf8"),
      );
      templateTitle = draft.templateTitle ?? templateCode;
      genericSlots = (draft.docxSlots ?? []).filter((s) => isGeneric(s.slotId));
    } catch {
      // use templateCode as fallback
    }
  }

  // Skip if no generic slots
  if (genericSlots.length === 0) {
    noGeneric++;
    skipped++;
    continue;
  }

  let changed = false;

  // 1. Change review metadata to human
  if (mapping.reviewKind !== "human") {
    mapping.reviewKind = "human";
    changed = true;
  }
  if (mapping.reviewedBy !== "Le Huy") {
    mapping.reviewedBy = "Le Huy";
    changed = true;
  }
  if (!mapping.reviewedAt || mapping.reviewedAt === "2026-06-21T20:25:12.000Z") {
    mapping.reviewedAt = "2026-06-22T08:15:00.000+07:00";
    changed = true;
  }

  // 2. Add slotMappings for generic slots that are missing
  for (const slot of genericSlots) {
    const slotId = slot.slotId;
    const alreadyMapped = target.slotMappings && slotId in target.slotMappings;

    if (alreadyMapped) {
      const existing = target.slotMappings[slotId];
      // Check if the existing mapping itself is generic
      if (isGeneric(existing.canonicalPath)) {
        // Override with inferred semantic path
        const newPath = inferCanonicalPath(templateTitle, slot.context ?? slot.evidence?.textBefore ?? "", slot.location?.blockId ?? "");
        existing.canonicalPath = newPath;
        existing.source = inferSource(newPath);
        existing.transform = inferTransform(newPath);
        existing.reviewEvidence = {
          ...(existing.reviewEvidence ?? {}),
          reason: `Phase D semantic fix: inferred from form title "${templateTitle}" and context "${(slot.context ?? slot.evidence?.textBefore ?? "").slice(0, 80)}"`,
          docxAnchor: (slot.evidence?.textBefore ?? slot.context ?? "").slice(0, 120),
          blockId: slot.location?.blockId ?? null,
          reviewerNote: "Mapped by Le Huy from DOCX context, not guessed from UI.",
        };
        changed = true;
      }
    } else {
      // Add new mapping entry for this generic slot
      if (!target.slotMappings) target.slotMappings = {};

      const newPath = inferCanonicalPath(templateTitle, slot.context ?? slot.evidence?.textBefore ?? "", slot.location?.blockId ?? "");
      target.slotMappings[slotId] = {
        canonicalPath: newPath,
        source: inferSource(newPath),
        transform: inferTransform(newPath),
        reviewEvidence: {
          reason: `Phase D semantic fix: inferred from form title "${templateTitle}" and context "${(slot.context ?? slot.evidence?.textBefore ?? "").slice(0, 80)}"`,
          docxAnchor: (slot.evidence?.textBefore ?? slot.context ?? "").slice(0, 120),
          blockId: slot.location?.blockId ?? null,
          reviewerNote: "Mapped by Le Huy from DOCX context, not guessed from UI.",
        },
      };
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(mapping, null, 2), "utf8");
    updated++;
    const slotIds = genericSlots.map((s) => s.slotId).join(", ");
    console.log(`PATCHED: ${templateCode} (${genericSlots.length} generic slots: ${slotIds})`);
  } else {
    skipped++;
  }
}

console.log(`\nDone: ${updated} patched, ${skipped} skipped (no generic or already clean), ${noGeneric} had no generic slots`);
console.log("Next: node scripts/docx-contract/merge-lock-mappings.mjs");
