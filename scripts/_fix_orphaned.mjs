#!/usr/bin/env node
/**
 * Fix orphaned slots in locked contracts:
 * 1. Remove slots from contract that don't exist in DOCX
 * 2. Remove corresponding canonicalFields and renderBindings
 * 3. Regenerate lock mappings with removed slots excluded
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts", "locked");
const DRAFT_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts");
const OUT_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "human-review");

function getDocxMustaches(code) {
  const f = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(f)) return new Set();
  try {
    const zip = new PizZip(fs.readFileSync(f));
    const xml = zip.file("word/document.xml")?.asText() || "";
    const musts = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());
    return new Set(musts);
  } catch { return new Set(); }
}

const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));
let fixed = 0;

for (const code of ALL) {
  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (lockedFiles.length === 0) continue;

  const lockedPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const contract = JSON.parse(fs.readFileSync(lockedPath, "utf8"));

  const docxMustaches = getDocxMustaches(code);
  const slotIds = new Set((contract.docxSlots || []).map(s => s.slotId));

  // Find orphaned slots
  const orphanedSlots = (contract.docxSlots || []).filter(s => !docxMustaches.has(s.slotId));
  if (orphanedSlots.length === 0) continue;

  console.log("FIX: " + code + " - removing " + orphanedSlots.length + " orphaned slot(s): " + orphanedSlots.map(s => s.slotId).join(", "));

  // Remove from docxSlots
  contract.docxSlots = (contract.docxSlots || []).filter(s => docxMustaches.has(s.slotId));

  // Remove orphaned canonicalFields
  const orphanedPaths = new Set(orphanedSlots.map(s => s.slotId));
  contract.canonicalFields = (contract.canonicalFields || []).filter(f => !orphanedPaths.has(f.path));

  // Remove orphaned renderBindings
  contract.renderBindings = (contract.renderBindings || []).filter(b => !orphanedPaths.has(b.slotId));

  // Update contract slots count
  contract.metadata = contract.metadata || {};
  contract.metadata.slotCount = contract.docxSlots.length;

  fs.writeFileSync(lockedPath, JSON.stringify(contract, null, 2));

  // Regenerate lock mapping for this BM
  const slotMappings = {};
  for (const slot of (contract.docxSlots || [])) {
    const src = inferSource(slot.slotId);
    const trf = inferTransform(slot.slotId);
    const blockId = slot.location?.blockId || "";
    const tableCellId = slot.location?.tableCellId || null;
    slotMappings[slot.slotId] = {
      canonicalPath: slot.slotId,
      source: src,
      transform: trf,
      reviewEvidence: { context: "[Auto] " + ((slot.evidence?.textBefore || slot.context || "").trim()), blockId, ...(tableCellId ? { tableCellId } : {}) },
    };
  }

  const mapping = {
    reviewedBy: contract.reviewedBy || "system-batch-lock",
    reviewedAt: contract.reviewedAt || new Date().toISOString(),
    targets: {
      [code]: {
        sourceId: contract.sourceId || lockedFiles[0].replace(".contract.locked.json", ""),
        decision: "locked",
        slotMappings,
      },
    },
  };
  fs.writeFileSync(path.join(OUT_DIR, code + "__lock-mapping.json"), JSON.stringify(mapping, null, 2));

  fixed++;
}

function inferSource(fp) {
  const ns = fp.split(".")[0];
  const n = fp.split(".")[1] || "";
  if (n.includes("NameUpper")) return "constantFromDocx";
  if (n.includes("issuePlace") && !n.includes("Line")) return "constantFromDocx";
  const lineLegal = n.includes("Line") && (n.includes("legalBasis") || n.includes("procedure") || n.includes("summary"));
  if (lineLegal) return "constantFromDocx";
  if (n.includes("signMode") || n.includes("positionTitle")) return "officialConfig";
  if (n.includes("signerName")) return "officialConfig";
  if (n.includes("Date") || n.includes("date")) return "systemDate";
  if (n.includes("day") || n.includes("month") || n.includes("year")) return "derived";
  if (ns === "agency") return "agencyConfig";
  return "manual";
}

function inferTransform(fp) {
  const n = fp.split(".")[1] || "";
  if (n.includes("day")) return "date.day";
  if (n.includes("month")) return "date.month";
  if (n.includes("year")) return "date.year";
  if (n.includes("vnLine") || n.includes("issuePlaceAndDateLine")) return "date.issuePlaceDateLine";
  if (n.includes("dateLine")) return "date.vnLine";
  return "identity";
}

console.log("\nFixed: " + fixed + " locked contracts");
}
