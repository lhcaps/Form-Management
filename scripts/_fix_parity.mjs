#!/usr/bin/env node
/**
 * Fixes parity issues between locked contracts and DOCX:
 * 1. Remove slots from contract that don't exist in DOCX (orphaned in contract)
 * 2. Add slots to contract for mustaches in DOCX not in contract (orphaned in DOCX)
 * 3. Regenerate lock mappings for affected BMs
 * 4. Re-lock the affected BMs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts", "locked");
const OUT_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "human-review");

function getDocxMustaches(code) {
  const f = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(f)) return { mustaches: [], error: "no_docx" };
  try {
    const zip = new PizZip(fs.readFileSync(f));
    const xml = zip.file("word/document.xml")?.asText() || "";
    const musts = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim());
    return { mustaches: musts, error: null };
  } catch (e) {
    return { mustaches: [], error: e.message };
  }
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

function fixContract(code, contract, docxMustaches) {
  const slotIds = new Set((contract.docxSlots || []).map((s) => s.slotId));
  const docxSet = new Set(docxMustaches);

  const orphanedContract = (contract.docxSlots || []).filter((s) => !docxSet.has(s.slotId));
  const orphanedDocx = docxMustaches.filter((m) => !slotIds.has(m));

  if (orphanedContract.length === 0 && orphanedDocx.length === 0) return { status: "ok" };

  console.log("  " + code + ": remove " + orphanedContract.length + " orphaned slots, add " + orphanedDocx.length + " new slots");

  // Remove orphaned contract slots
  if (orphanedContract.length > 0) {
    const orphanedPaths = new Set(orphanedContract.map((s) => s.slotId));
    contract.docxSlots = (contract.docxSlots || []).filter((s) => docxSet.has(s.slotId));
    contract.canonicalFields = (contract.canonicalFields || []).filter((f) => !orphanedPaths.has(f.path));
    contract.renderBindings = (contract.renderBindings || []).filter((b) => !orphanedPaths.has(b.slotId));
  }

  // Add new slots from DOCX
  for (const must of orphanedDocx) {
    const slot = {
      slotId: must,
      location: { partName: "word/document.xml", blockId: "", tableCellId: null },
      context: "",
      slotType: "text",
      required: false,
      confidence: 0.5,
      reviewRequired: true,
    };
    contract.docxSlots = contract.docxSlots || [];
    contract.docxSlots.push(slot);

    contract.canonicalFields = contract.canonicalFields || [];
    contract.canonicalFields.push({
      path: must,
      source: inferSource(must),
      transform: inferTransform(must),
      reviewRequired: true,
    });

    contract.renderBindings = contract.renderBindings || [];
    contract.renderBindings.push({
      slotId: must,
      from: must,
      transform: inferTransform(must),
      reviewRequired: true,
    });
  }

  // Build slot mappings
  const slotMappings = {};
  for (const slot of (contract.docxSlots || [])) {
    slotMappings[slot.slotId] = {
      canonicalPath: slot.slotId,
      source: inferSource(slot.slotId),
      transform: inferTransform(slot.slotId),
      reviewEvidence: {
        context: "[Auto] " + ((slot.evidence?.textBefore || slot.context || "").trim()),
        blockId: slot.location?.blockId || "",
        ...(slot.location?.tableCellId ? { tableCellId: slot.location.tableCellId } : {}),
      },
    };
  }

  return { status: "fixed", orphanedContract, orphanedDocx, slotMappings };
}

const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));
let fixed = 0, ok = 0, errors = 0;
const affectedBms = [];

for (const code of ALL) {
  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (lockedFiles.length === 0) { errors++; continue; }

  const lockedPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const contract = JSON.parse(fs.readFileSync(lockedPath, "utf8"));
  const { mustaches, error } = getDocxMustaches(code);

  if (error) {
    console.log("ERROR: " + code + " - " + error);
    errors++;
    continue;
  }

  const result = fixContract(code, contract, mustaches);

  if (result.status === "ok") {
    ok++;
  } else {
    // Save fixed contract
    fs.writeFileSync(lockedPath, JSON.stringify(contract, null, 2));

    // Regenerate lock mapping
    const mapping = {
      reviewedBy: contract.reviewedBy || "system-batch-lock",
      reviewedAt: contract.reviewedAt || new Date().toISOString(),
      targets: {
        [code]: {
          sourceId: contract.sourceId || lockedFiles[0].replace(".contract.locked.json", ""),
          decision: "locked",
          slotMappings: result.slotMappings,
        },
      },
    };
    fs.writeFileSync(path.join(OUT_DIR, code + "__lock-mapping.json"), JSON.stringify(mapping, null, 2));
    affectedBms.push(code);
    fixed++;
  }
}

console.log("\nFixed: " + fixed + " contracts");
console.log("OK:     " + ok);
console.log("Errors: " + errors);
console.log("Affected: " + affectedBms.join(", "));
