#!/usr/bin/env node
/**
 * Fixes semantic mustache names and draft contracts for all 213 BMs.
 * Strategy:
 * 1. For each generic mustache (e.g. {{document.field1}}), extract its context text from DOCX
 * 2. Match context to form field labels (using diacritic-stripped text)
 * 3. Update DOCX: replace generic mustaches with semantic paths
 * 4. Update draft contract: update slotId, canonicalField.path, renderBindings
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");
const CONTRACTS_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts");
const FORM_DIR = path.join(REPO_ROOT, "apps", "web", "src", "components", "documents");

// ── Diacritic stripper ───────────────────────────────────────────────────────
const DIAC_MAP = { "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a", "ă": "a", "ằ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a", "â": "a", "ầ": "a", "ấ": "a", "ậ": "a", "ẫ": "a", "ẩ": "a", "đ": "d", "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e", "ê": "e", "ề": "e", "ế": "e", "ệ": "e", "ễ": "e", "ể": "e", "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i", "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o", "ô": "o", "ồ": "o", "ố": "o", "ổ": "o", "ỗ": "o", "ộ": "o", "ơ": "o", "ờ": "o", "ớ": "o", "ở": "o", "ỡ": "o", "ợ": "o", "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u", "ư": "u", "ừ": "u", "ứ": "u", "ử": "u", "ữ": "u", "ự": "u", "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y" };
const DIAC_RE = new RegExp("[" + Object.keys(DIAC_MAP).join("") + "]", "g");
function stripDiac(s) { return String(s || "").replace(DIAC_RE, (c) => DIAC_MAP[c] || c).toLowerCase(); }

// ── Parse form inputs from form-inputs.tsx ────────────────────────────────
function parseFormInputs(code) {
  const fp = path.join(FORM_DIR, code.toLowerCase() + "-form-inputs.tsx");
  if (!fs.existsSync(fp)) return null;
  const content = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const fields = [];
  let sectionTitle = "default";

  // Scan for BmFormSection titles and BmField labels
  const lines = content.split("\n");
  for (const line of lines) {
    const secMatch = line.match(/<BmFormSection\s+title\s*=\s*["']([^"']+)["']/i);
    if (secMatch) { sectionTitle = secMatch[1].trim(); continue; }

    const fieldMatch = line.match(/<BmField(Text|Date|Textarea|Select)\s+([^>]+)>/);
    if (fieldMatch) {
      const attrs = fieldMatch[2];
      const lm = attrs.match(/label\s*=\s*["']([^"']+)["']/);
      const ltm = attrs.match(/label\s*=\s*\{\`([^`]+)\`\}/);
      let label = lm ? lm[1] : ltm ? ltm[1] : null;
      // Strip template expressions from label template literals
      if (label) label = label.replace(/\$\{[^}]+\}/g, "…").trim();
      if (label) fields.push({ section: sectionTitle, label });
    }
  }
  return fields.length > 0 ? fields : null;
}

// ── Infer section from form field label ────────────────────────────────────
const LABEL_TO_NS = {
  "viện kiểm sát cấp trên": "agency",
  "viện kiểm sát ban hành": "agency",
  "tên cơ quan trong thân văn bản": "agency",
  "viết tắt tên vks": "agency",
  "địa danh": "agency",
  "cơ quan cấp trên": "agency",
  "số quyết định": "document",
  "số văn bản": "document",
  "ngày ban hành": "document",
  "dòng địa danh, ngày tháng": "document",
  "ngày tháng năm": "document",
  "nơi ban hành": "document",
  "chủ thể ban hành": "official",
  "chức danh người ký": "signature",
  "chế độ ký": "signature",
  "chức vụ ký": "signature",
  "họ tên người ký": "signature",
  "người ký": "signature",
  "căn cứ bộ luật tố tụng hình sự": "legalBasis",
  "căn cứ pháp lý": "legalBasis",
  "tóm tắt hồ sơ": "document",
  "tóm tắt hồ sơ / diễn biến": "document",
  "nội dung quyết định": "document",
  "họ tên người bị áp dụng": "person",
  "người bị áp dụng": "person",
  "đối tượng": "person",
  "cơ quan thi hành": "recipients",
  "người bị": "recipients",
  "dòng lưu": "recipients",
  "dòng lưu hồ sơ": "recipients",
  "nơi nhận": "recipients",
};

function inferNamespace(label) {
  const key = stripDiac(label);
  for (const [k, v] of Object.entries(LABEL_TO_NS)) {
    if (key.includes(k)) return v;
  }
  return null;
}

// ── Infer field name from label ────────────────────────────────────────────
function inferFieldName(label, section) {
  const key = stripDiac(label);
  const norm = key.replace(/[^\w\s]/g, " ").trim();
  const words = norm.split(/\s+/).filter(Boolean);

  // Map common label patterns to field names
  const PATTERNS = [
    [/^(viện|kiểm sát)\s*cấp\s*trên/i, "parentName"],
    [/^(viện|kiểm sát)\s*ban\s*hành/i, "name"],
    [/tên\s*cơ\s*quan/i, "bodyName"],
    [/viết\s*tắt/i, "shortName"],
    [/địa\s*danh/i, "issuePlace"],
    [/cơ\s*quan\s*cấp\s*trên/i, "parentName"],
    [/số\s*(quyết\s*định|văn\s*bản)/i, "documentCode"],
    [/ngày\s*ban\s*hành/i, "issueDate"],
    [/dòng\s*địa\s*danh.*ngày/i, "issuePlaceAndDateLine"],
    [/ngày\s*tháng\s*năm/i, "dateLine"],
    [/chủ\s*thể\s*ban\s*hành/i, "issuerTitle"],
    [/chức\s*danh.*ký/i, "positionTitle"],
    [/chế\s*độ\s*ký/i, "signMode"],
    [/họ\s*tên.*ký/i, "signerName"],
    [/người\s*ký/i, "signerName"],
    [/căn\s*cứ.*tố\s*tụng/i, "legalBasisLine"],
    [/căn\s*cứ.*pháp\s*lý/i, "legalBasisLine"],
    [/tóm\s*tắt.*hồ\s*sơ/i, "caseSummary"],
    [/diễn\s*biến/i, "caseSummary"],
    [/nội\s*dung.*quyết\s*định/i, "decisionContentLine"],
    [/họ\s*tên.*bị\s*áp\s*dụng/i, "personName"],
    [/người\s*bị\s*áp\s*dụng/i, "personName"],
    [/cơ\s*quan\s*thi\s*hành/i, "enforcementAgency"],
    [/dòng\s*lưu/i, "archiveLine"],
    [/nơi\s*nhận/i, "recipientsLine"],
  ];

  for (const [re, name] of PATTERNS) {
    if (re.test(key)) return name;
  }

  // Fallback: first 2 words of label
  if (words.length >= 2) return words[0] + words[1].charAt(0).toUpperCase() + words[1].slice(1);
  if (words.length === 1) return words[0].replace(/\s/g, "");
  return null;
}

// ── Extract mustaches from DOCX with context ────────────────────────────────
function extractMustachesWithContext(docxBuffer) {
  const zip = new PizZip(docxBuffer);
  const docXml = zip.file("word/document.xml")?.asText() || "";

  // Find all mustache positions with surrounding text
  const results = [];
  const mustRe = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = mustRe.exec(docXml)) !== null) {
    const mustache = match[1].trim();
    const pos = match.index;
    // Extract 150 chars of context before
    const ctxStart = Math.max(0, pos - 150);
    const ctxText = docXml.slice(ctxStart, pos + match[0].length + 50);
    // Strip XML tags
    const plain = ctxText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    results.push({ mustache, plainText: plain });
  }
  return results;
}

// ── Match generic mustaches to semantic paths using context ─────────────────
function matchMustaches(mustaches, formInputs) {
  if (!formInputs || formInputs.length === 0) return {};

  const map = {};
  // Match each mustache (in doc order) to a form field
  for (let i = 0; i < mustaches.length; i++) {
    const { mustache, plainText } = mustaches[i];

    // Try to match the mustache to a form field by label in context
    const ctxNorm = stripDiac(plainText);
    let bestMatch = null;
    let bestScore = 0;

    for (let fi = 0; fi < formInputs.length; fi++) {
      const field = formInputs[fi];
      if (!field) continue;
      const labelNorm = stripDiac(field.label);
      // Check if label appears in context
      if (ctxNorm.includes(labelNorm) && labelNorm.length > 2) {
        const score = labelNorm.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = fi;
        }
      }
    }

    if (bestMatch !== null) {
      const field = formInputs[bestMatch];
      const ns = inferNamespace(field.label) || "document";
      const name = inferFieldName(field.label, field.section) || "field" + (bestMatch + 1);
      map[mustache] = ns + "." + name;
    }
  }
  return map;
}

// ── Update DOCX with new mustache names ────────────────────────────────────
function updateDocx(buffer, mustacheMap) {
  const zip = new PizZip(buffer);
  const docXml = zip.file("word/document.xml");
  if (!docXml) return buffer;

  let xml = docXml.asText();
  let changed = false;
  for (const [old, semantic] of Object.entries(mustacheMap)) {
    if (old !== semantic && xml.includes("{{" + old + "}}")) {
      xml = xml.split("{{" + old + "}}").join("{{" + semantic + "}}");
      changed = true;
    }
  }
  if (!changed) return buffer;

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer" });
}

// ── Update draft contract with new paths ───────────────────────────────────
function updateContract(contract, mustacheMap) {
  const updated = JSON.parse(JSON.stringify(contract));

  for (const slot of (updated.docxSlots || [])) {
    const semantic = mustacheMap[slot.slotId];
    if (semantic && slot.slotId !== semantic) slot.slotId = semantic;
  }

  for (const field of (updated.canonicalFields || [])) {
    const semantic = mustacheMap[field.path];
    if (semantic && field.path !== semantic) field.path = semantic;
  }

  for (const binding of (updated.renderBindings || [])) {
    const semantic = mustacheMap[binding.slotId];
    if (semantic && binding.slotId !== semantic) {
      binding.slotId = semantic;
      binding.from = semantic;
    }
  }

  return updated;
}

// ── Main ───────────────────────────────────────────────────────────────────
const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));
let updated = 0, skipped = 0, noFormInputs = 0;

for (const code of ALL) {
  const normFile = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(normFile)) { skipped++; continue; }

  const formInputs = parseFormInputs(code);
  if (!formInputs) { noFormInputs++; }

  const docxBuffer = fs.readFileSync(normFile);
  const mustaches = extractMustachesWithContext(docxBuffer);

  if (mustaches.length === 0) { skipped++; continue; }

  // Check if any mustaches are generic
  const hasGeneric = mustaches.some((m) => /^[a-z]+\.field\d+$/i.test(m.mustache));
  if (!hasGeneric) { skipped++; continue; }

  // Match generic mustaches to semantic paths
  const mustacheMap = matchMustaches(mustaches, formInputs);
  const hasMapping = Object.values(mustacheMap).some((v) => v !== null);

  if (hasMapping) {
    const newBuffer = updateDocx(docxBuffer, mustacheMap);
    fs.writeFileSync(normFile, newBuffer);

    const drafts = fs.readdirSync(CONTRACTS_DIR)
      .filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.draft.json"));
    if (drafts.length > 0) {
      try {
        const draft = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, drafts[0]), "utf8"));
        if (draft.status !== "locked") {
          const updatedContract = updateContract(draft, mustacheMap);
          fs.writeFileSync(path.join(CONTRACTS_DIR, drafts[0]), JSON.stringify(updatedContract, null, 2));
        }
      } catch (e) { /* skip */ }
    }
    const changed = Object.entries(mustacheMap).filter(([k, v]) => k !== v && v).length;
    console.log("FIXED: " + code + " (" + mustaches.length + " mustaches, " + changed + " mapped) " + (formInputs ? "[FI]" : "[no FI]"));
    updated++;
  } else {
    console.log("UNMAPPED: " + code + " (" + mustaches.length + " mustaches) " + (formInputs ? "[FI]" : "[no FI]"));
    skipped++;
  }
}

console.log("\nFixed: " + updated + " DOCX + contracts");
console.log("No form inputs: " + noFormInputs);
console.log("Skipped: " + skipped);
