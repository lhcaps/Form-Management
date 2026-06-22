#!/usr/bin/env node
/**
 * Regenerates DOCX mustache names and draft contracts with semantic slot IDs
 * for all 213 BMs that have form-inputs.tsx.
 *
 * For each BM:
 * 1. Read DOCX, extract all mustaches ({{path}})
 * 2. Read form-inputs.tsx, get field name list
 * 3. Map mustache N to form field N → get semantic path
 * 4. Update DOCX: replace {{document.fieldN}} with {{semanticPath}}
 * 5. Update draft contract: update slotId, canonicalField path, renderBindings
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");
const CONTRACTS_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts");

function parseFormInputs(code) {
  const fp = path.join(REPO_ROOT, "apps", "web", "src", "components", "documents", code.toLowerCase() + "-form-inputs.tsx");
  if (!fs.existsSync(fp)) return null;
  const content = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const fields = [];
  let pos = 0;
  while (pos < content.length) {
    const idx = content.indexOf("<BmField", pos);
    if (idx < 0) break;
    const closeIdx = content.indexOf(">", idx);
    if (closeIdx < 0) { pos = idx + 1; continue; }
    const tag = content.slice(idx + 1, closeIdx);
    const lm = tag.match(/label=["']([^"']+)["']/);
    const ltm = tag.match(/label=\{\`([^`]+)\`\}/);
    const label = lm ? lm[1] : ltm ? ltm[1] : null;
    const ui = content.indexOf("updateSection", closeIdx);
    let fn = null, sec = null;
    if (ui > closeIdx && ui < closeIdx + 600) {
      const ce = content.indexOf(")", ui);
      if (ce > ui) {
        const call = content.slice(ui, ce + 1);
        const sm = call.match(/updateSection\s*\(\s*["']([^"']+)["']/);
        const nm = call.match(/,\s*["']([^"']+)["']\s*,/);
        sec = sm ? sm[1] : null;
        fn = nm ? nm[1] : null;
      }
    }
    if (label && fn) fields.push({ section: sec, name: fn, label });
    pos = closeIdx + 1;
  }
  return fields.length > 0 ? fields : null;
}

const NS_MAP = { agency: "agency", document: "document", person: "person", legalBasis: "legalBasis", decision: "decision", recipients: "recipients", signature: "signature", official: "official", measure: "measure", delivery: "delivery", accusedDecision: "accusedDecision", caseDecision: "caseDecision" };

function toSemanticPath(section, name) {
  const ns = NS_MAP[section] || section || "document";
  return ns + "." + name;
}

function buildMustacheMap(docxMustaches, formInputs) {
  // Mustaches appear in document order
  // formInputs[N] = field at index N (0-based)
  // docxMustaches[N] = mustache at position N (0-based)
  // Map each mustache to the corresponding form input field
  const map = {};
  for (let i = 0; i < docxMustaches.length; i++) {
    const mustache = docxMustaches[i]; // e.g. "document.field1"
    const fi = formInputs ? formInputs[i] : null;
    if (fi) {
      map[mustache] = toSemanticPath(fi.section, fi.name);
    }
  }
  return map;
}

function updateDocx(buffer, mustacheMap) {
  const zip = new PizZip(buffer);
  const docXml = zip.file("word/document.xml");
  if (!docXml) return buffer;

  let xml = docXml.asText();
  for (const [old, semantic] of Object.entries(mustacheMap)) {
    if (old === semantic) continue;
    xml = xml.split("{{" + old + "}}").join("{{" + semantic + "}}");
    xml = xml.split("{{" + old.replace(/\./g, ".") + "}}").join("{{" + semantic + "}}");
  }
  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer" });
}

function updateContract(contract, mustacheMap) {
  const updated = JSON.parse(JSON.stringify(contract));

  // Update docxSlots slotId
  for (const slot of (updated.docxSlots || [])) {
    const old = slot.slotId;
    const semantic = mustacheMap[old];
    if (semantic && old !== semantic) {
      slot.slotId = semantic;
      if (slot.evidence) slot.evidence.textBefore = slot.evidence.textBefore || "";
    }
  }

  // Update canonicalFields path
  for (const field of (updated.canonicalFields || [])) {
    const old = field.path;
    const semantic = mustacheMap[old];
    if (semantic && old !== semantic) {
      field.path = semantic;
    }
  }

  // Update renderBindings slotId and from
  for (const binding of (updated.renderBindings || [])) {
    const old = binding.slotId;
    const semantic = mustacheMap[old];
    if (semantic && old !== semantic) {
      binding.slotId = semantic;
      binding.from = semantic;
    }
  }

  return updated;
}

const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));
let updated = 0, skipped = 0, noFI = 0;

for (const code of ALL) {
  const normDir = path.join(DOCX_OUT, code);
  const normFile = path.join(normDir, code + "_normalized.docx");
  if (!fs.existsSync(normFile)) { skipped++; continue; }

  const formInputs = parseFormInputs(code);
  if (!formInputs) { noFI++; }

  // Read DOCX and extract mustaches
  const docxBuffer = fs.readFileSync(normFile);
  const zip = new PizZip(docxBuffer);
  const docXml = zip.file("word/document.xml")?.asText() || "";

  // Extract all mustaches in document order
  const mustaches = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim());
  if (mustaches.length === 0) { skipped++; continue; }

  // Build semantic mapping
  const mustacheMap = buildMustacheMap(mustaches, formInputs);
  const hasChanges = Object.entries(mustacheMap).some(([k, v]) => k !== v);
  if (!hasChanges) { skipped++; continue; }

  // Update DOCX
  const newDocxBuffer = updateDocx(docxBuffer, mustacheMap);
  fs.writeFileSync(normFile, newDocxBuffer);

  // Find and update draft contract
  const drafts = fs.readdirSync(CONTRACTS_DIR)
    .filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.draft.json"));
  if (drafts.length > 0) {
    try {
      const draft = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, drafts[0]), "utf8"));
      if (draft.status !== "locked") {
        const updatedContract = updateContract(draft, mustacheMap);
        fs.writeFileSync(path.join(CONTRACTS_DIR, drafts[0]), JSON.stringify(updatedContract, null, 2));
      }
    } catch (e) { /* skip contract update */ }
  }

  const changed = Object.values(mustacheMap).filter((v, i) => Object.keys(mustacheMap)[i] !== v).length;
  console.log("FIXED: " + code + " (" + mustaches.length + " mustaches, " + changed + " semantic) " + (formInputs ? "[FI]" : "[no FI]"));
  updated++;
}

console.log("\nUpdated: " + updated + " DOCX + contracts");
console.log("Skipped (no changes needed): " + skipped);
console.log("No form inputs: " + noFI);
