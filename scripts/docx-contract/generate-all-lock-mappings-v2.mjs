#!/usr/bin/env node
/**
 * Regenerates lock mappings for all BMs, resolving generic .field# slot IDs
 * by cross-referencing with form-inputs.tsx semantic names.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CONTRACTS_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts");
const OUT_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "human-review");

// Parse form-inputs.tsx to get semantic field names
function parseFormInputs(code) {
  const filePath = path.join(
    REPO_ROOT, "apps", "web", "src", "components", "documents",
    `${code.toLowerCase()}-form-inputs.tsx`
  );
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
    const compMatch = tagContent.match(/^(\w+)/);
    const component = compMatch ? compMatch[1] : "BmFieldText";

    // Find the updateSection call after this tag to get field name
    const updateIdx = content.indexOf("updateSection", closeIdx);
    let fieldName = null, section = null;
    if (updateIdx > closeIdx && updateIdx < closeIdx + 500) {
      const callEnd = content.indexOf(")", updateIdx);
      if (callEnd > updateIdx) {
        const callContent = content.slice(updateIdx, callEnd + 1);
        const sectionMatch = callContent.match(/updateSection\s*\(\s*["']([^"']+)["']/);
        const nameMatch = callContent.match(/,\s*["']([^"']+)["']\s*,/);
        section = sectionMatch ? sectionMatch[1] : null;
        fieldName = nameMatch ? nameMatch[1] : null;
      }
    }

    if (label && fieldName) {
      fields.push({ section, name: fieldName, label, component });
    }
    pos = closeIdx + 1;
  }

  return fields.length > 0 ? fields : null;
}

// Build semantic name from form inputs for a field path
function resolveFieldPath(genericPath, formInputs, context) {
  if (!formInputs) return null;

  // e.g. "document.field1" -> look for field1 in any section
  const match = genericPath.match(/^[a-z]+\.field(\d+)$/i);
  if (!match) return null;
  const fieldNum = parseInt(match[1], 10);

  const fi = formInputs[fieldNum - 1]; // 0-indexed
  if (!fi) return null;

  const sectionMap = { agency: "agency", document: "document", person: "person", legalBasis: "legalBasis", decision: "decision", recipients: "recipients", signature: "signature" };
  const ns = sectionMap[fi.section] ?? "document";
  return `${ns}.${fi.name}`;
}

// Infer source from field path
function inferSource(fp) {
  const ns = fp.split(".")[0];
  const name = fp.split(".")[1] ?? "";
  if (name.includes("NameUpper") || (name.includes("issuePlace") && !name.includes("Line"))) return "constantFromDocx";
  if (name.includes("Line") && (name.includes("legalBasis") || name.includes("procedure") || name.includes("summary"))) return "constantFromDocx";
  if (name.includes("signMode") || name.includes("positionTitle")) return "officialConfig";
  if (name.includes("signerName")) return "officialConfig";
  if (name.includes("Date") || name.includes("date")) return "systemDate";
  if (name.includes("day") || name.includes("month") || name.includes("year")) return "derived";
  if (ns === "agency") return "agencyConfig";
  return "manual";
}

// Infer transform from field name
function inferTransform(fp) {
  const name = fp.split(".")[1] ?? "";
  if (name.includes("day")) return "date.day";
  if (name.includes("month")) return "date.month";
  if (name.includes("year")) return "date.year";
  if (name.includes("vnLine") || name.includes("issuePlaceAndDateLine")) return "date.issuePlaceDateLine";
  if (name.includes("dateLine")) return "date.vnLine";
  if (name.includes("Line") && name.includes("day")) return "date.day";
  if (name.includes("Line") && name.includes("month")) return "date.month";
  if (name.includes("Line") && name.includes("year")) return "date.year";
  return "identity";
}

const ALL_BMS = Array.from({ length: 213 }, (_, i) => `BM-${String(i + 1).padStart(3, "0")}`);

fs.mkdirSync(OUT_DIR, { recursive: true });

let locked = 0, skipped = 0, errors = 0;

for (const code of ALL_BMS) {
  const draftFiles = fs.readdirSync(CONTRACTS_DIR)
    .filter((f) => f.startsWith(`${code}__`) && f.endsWith(".contract.draft.json"));

  if (draftFiles.length === 0) { skipped++; continue; }

  const draftPath = path.join(CONTRACTS_DIR, draftFiles[0]);
  let draft;
  try {
    draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
  } catch { errors++; continue; }

  if (draft.status === "locked") continue;

  // Parse form inputs for this BM
  const formInputs = parseFormInputs(code);

  // Check if any slot has generic .field# IDs
  const hasGenericSlots = (draft.docxSlots ?? []).some((s) => /^[a-z]+\.field\d+$/i.test(s.slotId));

  const slotMappings = {};

  for (const slot of draft.docxSlots ?? []) {
    const slotId = slot.slotId;
    let canonicalPath = slotId;

    // Resolve generic field IDs using form inputs
    if (/^[a-z]+\.field\d+$/i.test(slotId)) {
      const resolved = resolveFieldPath(slotId, formInputs, slot.evidence?.textBefore ?? slot.context ?? "");
      if (resolved) canonicalPath = resolved;
    }

    // Infer source and transform
    const source = inferSource(canonicalPath);
    const transform = inferTransform(canonicalPath);

    slotMappings[slotId] = {
      canonicalPath,
      source,
      transform,
      reviewEvidence: {
        context: `[Auto-generated] ${slot.evidence?.textBefore ?? slot.context ?? ""}`.trim(),
        blockId: slot.location?.blockId ?? "",
        ...(slot.location?.tableCellId ? { tableCellId: slot.location.tableCellId } : {}),
      },
    };
  }

  const mapping = {
    reviewedBy: "automated-field-correlation",
    reviewedAt: new Date().toISOString(),
    reviewKind: "automated",
    targets: {
      [code]: {
        sourceId: draft.sourceId ?? draftFiles[0].replace(".contract.draft.json", ""),
        decision: "review-pending",
        slotMappings,
      },
    },
  };

  const outPath = path.join(OUT_DIR, `${code}__lock-mapping.json`);
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2));
  console.log(`GENERATED${hasGenericSlots ? "*" : " "}: ${code} (${Object.keys(slotMappings).length} slots)${formInputs ? " [FI]" : " [no FI]"}`);
  locked++;
}

console.log(`\nDone: ${locked} generated, ${skipped} skipped, ${errors} errors`);
console.log("Merge then: node scripts/docx-contract/merge-lock-mappings.mjs");
