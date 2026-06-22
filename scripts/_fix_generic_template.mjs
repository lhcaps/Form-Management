#!/usr/bin/env node
/**
 * Fixes semantic slot IDs in contracts AND DOCX mustaches for GenericTemplate BMs.
 * Uses contract evidence.textBefore for context matching.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");
const CONTRACTS_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts");

function stripDiac(s) {
  const m = { "à":"a","á":"a","ả":"a","ã":"a","ạ":"a","ă":"a","ằ":"a","ắ":"a","ẳ":"a","ẵ":"a","ặ":"a","â":"a","ầ":"a","ấ":"a","ậ":"a","ẫ":"a","ẩ":"a","đ":"d","è":"e","é":"e","ẻ":"e","ẽ":"e","ẹ":"e","ê":"e","ề":"e","ế":"e","ệ":"e","ễ":"e","ể":"e","ì":"i","í":"i","ỉ":"i","ĩ":"i","ị":"i","ò":"o","ó":"o","ỏ":"o","õ":"o","ọ":"o","ô":"o","ồ":"o","ố":"o","ộ":"o","ổ":"o","ỗ":"o","ơ":"o","ờ":"o","ớ":"o","ở":"o","ỡ":"o","ợ":"o","ù":"u","ú":"u","ủ":"u","ũ":"u","ụ":"u","ư":"u","ừ":"u","ứ":"u","ử":"u","ữ":"u","ự":"u","ỳ":"y","ý":"y","ỷ":"y","ỹ":"y","ỵ":"y" };
  return String(s || "").replace(/[àáảãạăằắẳẵặâầấậẫẩđèéẻẽẹêềếệễểìíỉĩịòóỏõọôồốộổỗơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/g, (c) => m[c] || c).toLowerCase();
}

const KEYWORD_MAP = [
  // Agency
  [{ k: "viện kiểm sát cấp trên", n: "agency", f: "parentName" }, { k: "viện kiểm sát", n: "agency", f: "name" }, { k: "cơ quan ban hành", n: "agency", f: "name" }, { k: "tên cơ quan", n: "agency", f: "bodyName" }, { k: "tên viết tắt", n: "agency", f: "shortName" }, { k: "địa danh ban hành", n: "agency", f: "issuePlace" }, { k: "địa danh", n: "agency", f: "issuePlace" }],
  // Document
  [{ k: "số quyết định", n: "document", f: "documentCode" }, { k: "số văn bản", n: "document", f: "documentCode" }, { k: "số lệnh", n: "document", f: "documentCode" }, { k: "số vụ án", n: "document", f: "caseNo" }, { k: "ngày ban hành", n: "document", f: "issueDate" }, { k: "ngày quyết định", n: "document", f: "issueDate" }, { k: "ngày tháng năm", n: "document", f: "dateLine" }, { k: "tóm tắt", n: "document", f: "caseSummary" }, { k: "mô tả vụ việc", n: "document", f: "caseSummary" }, { k: "diễn biến", n: "document", f: "caseSummary" }, { k: "nội dung quyết định", n: "document", f: "decisionContentLine" }, { k: "thế biện pháp", n: "document", f: "guaranteeAmount" }, { k: "điều 1", n: "document", f: "decisionArticle1Line" }, { k: "điều 2", n: "document", f: "decisionArticle2Line" }],
  // Person
  [{ k: "họ tên người", n: "person", f: "personName" }, { k: "họ tên:", n: "person", f: "personName" }, { k: "người bị áp dụng", n: "person", f: "personName" }, { k: "bị can", n: "person", f: "accusedName" }, { k: "tội danh", n: "person", f: "chargeName" }, { k: "sinh ngày", n: "person", f: "birthDate" }, { k: "nơi sinh", n: "person", f: "birthPlace" }, { k: "quốc tịch", n: "person", f: "nationality" }, { k: "dân tộc", n: "person", f: "ethnicity" }, { k: "tôn giáo", n: "person", f: "religion" }, { k: "nghề nghiệp", n: "person", f: "occupation" }, { k: "số cmnd", n: "person", f: "idCardNo" }, { k: "số cccd", n: "person", f: "idCardNo" }, { k: "nơi thường trú", n: "person", f: "permanentAddress" }, { k: "nơi tạm trú", n: "person", f: "temporaryAddress" }, { k: "người đại diện", n: "person", f: "representativeName" }, { k: "người bào chữa", n: "person", f: "lawyerName" }],
  // LegalBasis
  [{ k: "căn cứ bộ luật", n: "legalBasis", f: "legalBasisLine" }, { k: "blhs", n: "legalBasis", f: "legalBasisLine" }, { k: "điều khoản blhs", n: "legalBasis", f: "lawArticleLine" }],
  // Signature
  [{ k: "chế độ ký", n: "signature", f: "signMode" }, { k: "chức vụ ký", n: "signature", f: "positionTitle" }, { k: "họ tên người ký", n: "signature", f: "signerName" }, { k: "người ký quyết định", n: "signature", f: "signerName" }],
  // Recipients
  [{ k: "nơi nhận", n: "recipients", f: "recipientsLine" }, { k: "lưu hồ sơ", n: "recipients", f: "archiveLine" }, { k: "cơ quan thi hành", n: "recipients", f: "enforcementAgency" }, { k: "cơ quan điều tra", n: "recipients", f: "investigationAgency" }],
];

function inferFromContext(text) {
  const norm = stripDiac(text);
  for (const group of KEYWORD_MAP) {
    for (const { k, n, f } of group) {
      if (norm.includes(k)) return { ns: n, field: f };
    }
  }
  return { ns: "document", field: "field" };
}

// Track what namespace section we're in based on surrounding semantic slots
function getDefaultNamespace(contract, slotIndex) {
  for (let i = slotIndex - 1; i >= 0; i--) {
    const slot = contract.docxSlots?.[i];
    if (!slot) continue;
    const ns = slot.slotId.split(".")[0];
    if (!/\.field\d+$/i.test(slot.slotId)) return ns;
  }
  return "document";
}

function processBM(code) {
  const drafts = fs.readdirSync(CONTRACTS_DIR)
    .filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.draft.json"));
  if (drafts.length === 0) return { status: "no_draft" };

  const draftPath = path.join(CONTRACTS_DIR, drafts[0]);
  const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
  if (draft.status === "locked") return { status: "already_locked" };

  const slots = draft.docxSlots || [];
  const genericSlots = slots.filter((s) => /^[a-z]+\.field\d+$/i.test(s.slotId));
  if (genericSlots.length === 0) return { status: "no_generic" };

  // Build replacement map: generic slotId -> semantic path
  const replacements = {};
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!/^[a-z]+\.field\d+$/i.test(slot.slotId)) continue;

    const context = (slot.evidence?.textBefore || slot.context || "").replace(/\{\{[^}]+\}\}/g, "…").trim();
    const { ns, field } = inferFromContext(context);
    const defaultNs = getDefaultNamespace(draft, i);
    const finalNs = (ns !== "document" || context.length > 5) ? ns : defaultNs;
    replacements[slot.slotId] = finalNs + "." + field;
  }

  // Apply to contract
  for (const slot of draft.docxSlots || []) {
    const sem = replacements[slot.slotId];
    if (sem) slot.slotId = sem;
  }
  for (const field of draft.canonicalFields || []) {
    const sem = replacements[field.path];
    if (sem) field.path = sem;
  }
  for (const binding of draft.renderBindings || []) {
    const sem = replacements[binding.slotId];
    if (sem) {
      binding.slotId = sem;
      binding.from = sem;
    }
  }
  fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2));

  // Apply to DOCX
  const normFile = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (fs.existsSync(normFile)) {
    const buf = fs.readFileSync(normFile);
    const zip = new PizZip(buf);
    let xml = zip.file("word/document.xml")?.asText() || "";
    let changed = false;
    for (const [old, sem] of Object.entries(replacements)) {
      if (xml.includes("{{" + old + "}}")) {
        xml = xml.split("{{" + old + "}}").join("{{" + sem + "}}");
        changed = true;
      }
    }
    if (changed) {
      zip.file("word/document.xml", xml);
      fs.writeFileSync(normFile, zip.generate({ type: "nodebuffer" }));
    }
  }

  return { status: "fixed", count: Object.keys(replacements).length };
}

const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));
let fixed = 0, skipped = 0;

for (const code of ALL) {
  const result = processBM(code);
  if (result.status === "fixed") {
    console.log("FIXED: " + code + " (" + result.count + " slots)");
    fixed++;
  } else {
    skipped++;
  }
}

console.log("\nFixed: " + fixed + " contracts + DOCX");
console.log("Skipped: " + skipped);
