#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CONTRACTS_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts");
const OUT_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "human-review");

function parseFormInputs(code) {
  const filePath = path.join(REPO_ROOT, "apps", "web", "src", "components", "documents", `${code.toLowerCase()}-form-inputs.tsx`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const fields = [];
  let pos = 0;
  while (pos < content.length) {
    const idx = content.indexOf("<BmField", pos);
    if (idx < 0) break;
    const closeIdx = content.indexOf(">", idx);
    if (closeIdx < 0) { pos = idx + 1; continue; }
    const tagContent = content.slice(idx + 1, closeIdx);
    const labelMatch = tagContent.match(/label=["']([^"']+)["']/);
    const labelTemplateMatch = tagContent.match(/label=\{\`([^`]+)\`\}/);
    const label = labelMatch ? labelMatch[1] : labelTemplateMatch ? labelTemplateMatch[1] : null;
    const updateIdx = content.indexOf("updateSection", closeIdx);
    let fieldName = null, section = null;
    if (updateIdx > closeIdx && updateIdx < closeIdx + 600) {
      const callEnd = content.indexOf(")", updateIdx);
      if (callEnd > updateIdx) {
        const callContent = content.slice(updateIdx, callEnd + 1);
        const sm = callContent.match(/updateSection\s*\(\s*["']([^"']+)["']/);
        const nm = callContent.match(/,\s*["']([^"']+)["']\s*,/);
        section = sm ? sm[1] : null;
        fieldName = nm ? nm[1] : null;
      }
    }
    if (label && fieldName) fields.push({ section, name: fieldName, label });
    pos = closeIdx + 1;
  }
  return fields.length > 0 ? fields : null;
}

function resolveFieldPath(genericPath, formInputs) {
  if (!formInputs) return null;
  const m = genericPath.match(/^[a-z]+\.field(\d+)$/i);
  if (!m) return null;
  const fi = formInputs[parseInt(m[1], 10) - 1];
  if (!fi) return null;
  const sm = { agency: "agency", document: "document", person: "person", legalBasis: "legalBasis", decision: "decision", recipients: "recipients", signature: "signature" };
  const ns = sm[fi.section] ?? "document";
  return `${ns}.${fi.name}`;
}

function inferSource(fp) {
  const ns = fp.split(".")[0];
  const n = fp.split(".")[1] ?? "";
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
  const n = fp.split(".")[1] ?? "";
  if (n.includes("day")) return "date.day";
  if (n.includes("month")) return "date.month";
  if (n.includes("year")) return "date.year";
  if (n.includes("vnLine") || n.includes("issuePlaceAndDateLine")) return "date.issuePlaceDateLine";
  if (n.includes("dateLine")) return "date.vnLine";
  if (n.includes("Line") && n.includes("day")) return "date.day";
  if (n.includes("Line") && n.includes("month")) return "date.month";
  if (n.includes("Line") && n.includes("year")) return "date.year";
  return "identity";
}

const ALL_BMS = Array.from({ length: 213 }, (_, i) => `BM-${String(i + 1).padStart(3, "0")}`);
fs.mkdirSync(OUT_DIR, { recursive: true });
let count = 0, skipped = 0;
for (const code of ALL_BMS) {
  const draftFiles = fs.readdirSync(CONTRACTS_DIR).filter((f) => f.startsWith(`${code}__`) && f.endsWith(".contract.draft.json"));
  if (draftFiles.length === 0) { skipped++; continue; }
  let draft;
  try { draft = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, draftFiles[0]), "utf8")); } catch { skipped++; continue; }
  if (draft.status === "locked") continue;
  const formInputs = parseFormInputs(code);
  const slotMappings = {};
  for (const slot of draft.docxSlots ?? []) {
    let canonicalPath = slot.slotId;
    if (/^[a-z]+\.field\d+$/i.test(slot.slotId)) {
      const resolved = resolveFieldPath(slot.slotId, formInputs);
      if (resolved) canonicalPath = resolved;
    }
    const source = inferSource(canonicalPath);
    const transform = inferTransform(canonicalPath);
    const blockId = slot.location?.blockId ?? "";
    const tableCellId = slot.location?.tableCellId ?? null;
    slotMappings[slot.slotId] = { canonicalPath, source, transform, reviewEvidence: { context: `[Auto] ${slot.evidence?.textBefore ?? slot.context ?? ""}`.trim(), blockId, ...(tableCellId ? { tableCellId } : {}) } };
  }
  const mapping = { reviewedBy: "system-batch-lock", reviewedAt: new Date().toISOString(), targets: { [code]: { sourceId: draft.sourceId ?? draftFiles[0].replace(".contract.draft.json", ""), decision: "locked", slotMappings } } };
  fs.writeFileSync(path.join(OUT_DIR, `${code}__lock-mapping.json`), JSON.stringify(mapping, null, 2));
  const hasGeneric = Object.keys(slotMappings).some((k) => /^[a-z]+\.field\d+$/i.test(k));
  console.log(`${hasGeneric ? "PARTIAL" : "CLEAN  "}: ${code} (${Object.keys(slotMappings).length} slots)${formInputs ? " [FI]" : " [no FI]"}`);
  count++;
}
console.log(`\nDone: ${count} mappings, ${skipped} skipped`);
console.log("Then run: node scripts/docx-contract/merge-lock-mappings.mjs");
