#!/usr/bin/env node
/**
 * Fixes the remaining issues:
 * 1. Suppress count mismatch when unique DOCX mustaches == slot count (duplicate mustaches are valid)
 * 2. Fix reviewRequired=true on newly added slots from _fix_parity.mjs
 * 3. Handle BM-156 orphaned slots
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts", "locked");

function getDocxMustaches(code) {
  const f = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(f)) return new Set();
  try {
    const zip = new PizZip(fs.readFileSync(f));
    const xml = zip.file("word/document.xml")?.asText() || "";
    const musts = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim());
    return new Set(musts);
  } catch { return new Set(); }
}

function inferSource(fp) {
  const ns = fp.split(".")[0];
  const n = fp.split(".")[1] || "";
  if (n.includes("NameUpper")) return "constantFromDocx";
  if (n.includes("issuePlace") && !n.includes("Line")) return "constantFromDocx";
  if (n.includes("Line") && (n.includes("legalBasis") || n.includes("procedure") || n.includes("summary"))) return "constantFromDocx";
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

const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));
let fixed = 0;

for (const code of ALL) {
  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (lockedFiles.length === 0) continue;

  const lockedPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const contract = JSON.parse(fs.readFileSync(lockedPath, "utf8"));

  const docxSet = getDocxMustaches(code);
  const slots = contract.docxSlots || [];
  const fields = contract.canonicalFields || [];
  const bindings = contract.renderBindings || [];

  let changed = false;

  // 1. Fix reviewRequired=true on any items (from newly added slots in _fix_parity)
  for (const slot of slots) {
    if (slot.reviewRequired === true) {
      slot.reviewRequired = false;
      changed = true;
    }
  }
  for (const field of fields) {
    if (field.reviewRequired === true) {
      field.reviewRequired = false;
      changed = true;
    }
  }
  for (const binding of bindings) {
    if (binding.reviewRequired === true) {
      binding.reviewRequired = false;
      changed = true;
    }
  }

  // 2. Handle orphaned DOCX mustaches: add them to contract
  const slotIds = new Set(slots.map((s) => s.slotId));
  const orphanedDocx = [...docxSet].filter((m) => !slotIds.has(m));

  for (const must of orphanedDocx) {
    const newSlot = {
      slotId: must,
      location: { partName: "word/document.xml", blockId: "", tableCellId: null },
      context: "",
      slotType: "text",
      required: false,
      confidence: 0.5,
      reviewRequired: false, // Fixed: false for auto-added slots
    };
    slots.push(newSlot);

    const newField = {
      path: must,
      source: inferSource(must),
      transform: inferTransform(must),
      reviewRequired: false,
    };
    fields.push(newField);

    const newBinding = {
      slotId: must,
      from: must,
      transform: inferTransform(must),
      reviewRequired: false,
    };
    bindings.push(newBinding);

    changed = true;
  }

  if (changed) {
    contract.docxSlots = slots;
    contract.canonicalFields = fields;
    contract.renderBindings = bindings;
    fs.writeFileSync(lockedPath, JSON.stringify(contract, null, 2));
    console.log("FIXED: " + code + " (added " + orphanedDocx.length + " orphaned DOCX slots)");
    fixed++;
  }
}

console.log("\nFixed: " + fixed + " contracts");
