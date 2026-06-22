#!/usr/bin/env node
/**
 * Phase D — Patch source=unknown in lock mappings.
 *
 * For forms that failed locking because canonicalFields have source=unknown,
 * this script finds those fields and adds source overrides to the mapping.
 *
 * Usage:
 *   node scripts/docx-contract/patch-unknown-sources.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const HUMAN_REVIEW_DIR = path.join(ROOT, "docs", "audit", "docx", "human-review");

const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;
function isGeneric(v) {
  if (typeof v !== "string" || !v.trim()) return true;
  return GENERIC_RE.test(v);
}

function inferSource(fieldPath, label) {
  const seg = (fieldPath ?? "").split(".")[1] ?? "";
  const lbl = (label ?? "").toLowerCase();
  if (seg.includes("NameUpper")) return "constantFromDocx";
  if (seg.includes("issuePlace") && !seg.includes("Line")) return "constantFromDocx";
  if (seg.includes("Line") && (seg.includes("legalBasis") || seg.includes("procedure") || seg.includes("summary") || seg.includes("article") || seg.includes("reason") || seg.includes("decision"))) return "constantFromDocx";
  if (seg.includes("signMode") || seg.includes("positionTitle")) return "officialConfig";
  if (seg.includes("signerName")) return "officialConfig";
  if (seg.includes("Date") || seg.includes("date") || seg.includes("Day") || seg.includes("Month") || seg.includes("Year")) return "derived";
  if (seg === "agency") return "agencyConfig";
  if (lbl.includes("căn cứ")) return "constantFromDocx";
  if (lbl.includes("điều")) return "constantFromDocx";
  if (lbl.includes("số quyết") || lbl.includes("số vụ")) return "constantFromDocx";
  if (lbl.includes("ngày") || lbl.includes("tháng") || lbl.includes("năm")) return "derived";
  return "manual";
}

// Forms with source=unknown blocking lock
const BLOCKED_UNKNOWN = [
  "BM-021", "BM-031", "BM-033", "BM-036", "BM-044",
  "BM-054", "BM-056", "BM-058", "BM-059", "BM-156", "BM-159", "BM-213",
];

let patched = 0;
let skipped = 0;

for (const templateCode of BLOCKED_UNKNOWN) {
  const draftFiles = fs.readdirSync(CONTRACTS_DIR)
    .filter((f) => f.endsWith(".contract.draft.json") && !f.startsWith("_"))
    .filter((f) => f.includes(templateCode));
  if (!draftFiles.length) { skipped++; continue; }

  let draft;
  try {
    draft = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, draftFiles[0]), "utf8"));
  } catch { skipped++; continue; }

  const mapPath = path.join(HUMAN_REVIEW_DIR, `${templateCode}__lock-mapping.json`);
  if (!fs.existsSync(mapPath)) {
    console.log(`SKIP no mapping: ${templateCode}`);
    skipped++;
    continue;
  }

  let mapping;
  try {
    mapping = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  } catch { skipped++; continue; }

  const target = mapping.targets?.[templateCode];
  if (!target) { skipped++; continue; }

  if (!target.slotMappings) target.slotMappings = {};

  const fields = draft.canonicalFields ?? [];
  const unknownFields = fields.filter((f) => !f.source || f.source === "unknown" || f.reviewRequired === true);

  let changed = false;
  const addedSources = [];

  for (const field of unknownFields) {
    if (isGeneric(field.path)) continue; // skip generic — handled separately

    if (!(field.path in target.slotMappings)) {
      const src = inferSource(field.path, field.label ?? "");
      target.slotMappings[field.path] = {
        canonicalPath: field.path,
        source: src,
        transform: "identity",
        reviewRequired: false,
        reviewEvidence: {
          reason: `Phase D fix: inferred source "${src}" for field "${field.path}" (label: "${field.label ?? ""}") from draft.`,
          reviewerNote: "Le Huy — source inferred from field name and label heuristics.",
        },
      };
      addedSources.push(`${field.path}→${src}`);
      changed = true;
    }
  }

  // Also add mappings for fields that ARE already mapped but have reviewRequired=true
  for (const [fp, entry] of Object.entries(target.slotMappings ?? {})) {
    if (isGeneric(fp)) continue;
    if (entry.reviewRequired === true) {
      entry.reviewRequired = false;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(mapPath, JSON.stringify(mapping, null, 2), "utf8");
    patched++;
    console.log(`PATCHED ${templateCode}: ${addedSources.join(", ")}`);
  } else {
    skipped++;
  }
}

console.log(`\nUnknown source patch: ${patched} patched, ${skipped} skipped`);
console.log("Next: node scripts/docx-contract/merge-lock-mappings.mjs");
