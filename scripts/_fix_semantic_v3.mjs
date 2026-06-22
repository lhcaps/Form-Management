#!/usr/bin/env node
/**
 * Fixes semantic mustache names in DOCX + draft contracts via positional mapping:
 * Mustache at position N in DOCX = form field at index N in form-inputs.tsx.
 * Field names are derived from the form field label.
 * Works for both single-line and multi-line BmField tags.
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

function parseFormInputs(code) {
  const fp = path.join(FORM_DIR, code.toLowerCase() + "-form-inputs.tsx");
  if (!fs.existsSync(fp)) return null;
  const content = fs.readFileSync(fp, "utf8");
  const fields = [];

  // Try BmField (multi-line) tags first
  const bmFieldTagRe = /<BmField(Text|Date|Textarea|Select)/g;
  let lastIndex = 0;
  let match;
  while ((match = bmFieldTagRe.exec(content)) !== null) {
    const start = match.index;
    // Collect until closing /> or </BmField...>
    let pos = start + match[0].length;
    let tagContent = match[0];
    while (pos < content.length) {
      const ch = content[pos];
      tagContent += ch;
      if (ch === ">" && (content.slice(pos - 1, pos + 1) === "/>" || content.slice(pos - 8, pos + 1).includes("</BmField"))) break;
      pos++;
    }
    const lm = tagContent.match(/label\s*=\s*["']([^"']+)["']/);
    const ltm = tagContent.match(/label\s*=\s*\{\`([^`]+)\`\}/);
    let label = lm ? lm[1] : ltm ? ltm[1] : null;
    if (label) label = label.replace(/\$\{[^}]+\}/g, "…").replace(/<[^>]+>/g, "…").trim();
    if (label) fields.push(label);
    lastIndex = pos;
  }

  // Try custom Field component (single-label, used in some BMs like BM-027)
  if (fields.length === 0) {
    const fieldTagRe = /<Field\s+label\s*=\s*["']([^"']+)["']\s+value\s*=\s*\{form\.(\w+)\.(\w+)\}/g;
    while ((match = fieldTagRe.exec(content)) !== null) {
      fields.push(match[1]);
    }
  }

  return fields.length > 0 ? fields : null;
}

function labelToFieldName(label) {
  const key = label.toLowerCase().replace(/[àáảãạăằắẳẵặâầấậẫẩđèéẻẽẹêềếệễểìíỉĩịòóỏõọôồốộổỗơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/g, (c) => {
    const m = { "à":"a","á":"a","ả":"a","ã":"a","ạ":"a","ă":"a","ằ":"a","ắ":"a","ẳ":"a","ẵ":"a","ặ":"a","â":"a","ầ":"a","ấ":"a","ậ":"a","ẫ":"a","ẩ":"a","đ":"d","è":"e","é":"e","ẻ":"e","ẽ":"e","ẹ":"e","ê":"e","ề":"e","ế":"e","ệ":"e","ễ":"e","ể":"e","ì":"i","í":"i","ỉ":"i","ĩ":"i","ị":"i","ò":"o","ó":"o","ỏ":"o","õ":"o","ọ":"o","ô":"o","ồ":"o","ố":"o","ộ":"o","ổ":"o","ỗ":"o","ơ":"o","ờ":"o","ớ":"o","ở":"o","ỡ":"o","ợ":"o","ù":"u","ú":"u","ủ":"u","ũ":"u","ụ":"u","ư":"u","ừ":"u","ứ":"u","ử":"u","ữ":"u","ự":"u","ỳ":"y","ý":"y","ỷ":"y","ỹ":"y","ỵ":"y" };
    return m[c] || c;
  });

  const PATTERNS = [
    [/cơ quan cấp trên|viện kiểm sát cấp trên/i, "parentName"],
    [/viện kiểm sát ban hành|cơ quan ban hành/i, "name"],
    [/tên cơ quan|tên viết tắt/i, "bodyName"],
    [/viết tắt/i, "shortName"],
    [/địa danh(?!.*ngày)/i, "issuePlace"],
    [/nơi ban hành/i, "issuePlace"],
    [/số lệnh|số quyết định|số văn bản|số quyết định khởi tố/i, "documentCode"],
    [/ngày ban hành|ngày quyết định|ngày lệnh/i, "issueDate"],
    [/dòng thẩm quyền/i, "authorityLine"],
    [/số quyết định khởi tố vụ án/i, "indictmentDecisionNo"],
    [/ngày quyết định khởi tố vụ án/i, "indictmentDecisionDate"],
    [/cơ quan ra quyết định khởi tố vụ án/i, "indictmentAgencyName"],
    [/số quyết định khởi tố bị can/i, "prosecutorDecisionNo"],
    [/ngày quyết định khởi tố bị can/i, "prosecutorDecisionDate"],
    [/cơ quan ra quyết định khởi tố bị can/i, "prosecutorAgencyName"],
    [/thời hạn tạm giam/i, "detentionDuration"],
    [/từ ngày/i, "detentionStartDate"],
    [/đến ngày/i, "detentionEndDate"],
    [/lý do.*căn cứ.*tạm giam/i, "detentionReasonLine"],
    [/điều 1.*tự sinh|điều 1/i, "decisionArticle1Line"],
    [/điều 2.*tự sinh|điều 2/i, "decisionArticle2Line"],
    [/đơn vị thi hành|lệnh tạm giam/i, "enforcementUnit"],
    [/họ tên(?!.*ký)/i, "personName"],
    [/tên gọi khác/i, "aliasName"],
    [/ngày sinh/i, "birthDate"],
    [/nơi sinh/i, "birthPlace"],
    [/quốc tịch/i, "nationality"],
    [/dân tộc/i, "ethnicity"],
    [/tôn giáo/i, "religion"],
    [/nghề nghiệp/i, "occupation"],
    [/loại giấy tờ|số cmnd|số cccd|số hộ chiếu/i, "idCardNo"],
    [/ngày cấp/i, "idCardIssueDate"],
    [/nơi cấp/i, "idCardIssuePlace"],
    [/nơi thường trú/i, "permanentAddress"],
    [/nơi tạm trú/i, "temporaryAddress"],
    [/nơi ở hiện tại/i, "currentAddress"],
    [/người bị tạm giam/i, "detaineeName"],
    [/đơn vị thi hành lệnh/i, "enforcementUnit"],
    [/cơ quan điều tra/i, "investigationAgency"],
    [/lưu hồ sơ|lưu$|dòng lưu/i, "archiveLine"],
    [/người ký$|người ký quyết định/i, "signerName"],
    [/dòng giao lệnh/i, "deliveryLine"],
    [/chức danh người nhận lệnh/i, "receiverTitle"],
    [/chế độ ký/i, "signMode"],
    [/chức vụ ký|chức vụ$/i, "positionTitle"],
    [/chức danh người ký/i, "positionTitle"],
    [/dòng thẩm quyền/i, "authorityLine"],
    [/lý do thay đổi/i, "changeReasonLine"],
    [/tóm tắt|mô tả vụ việc/i, "caseSummary"],
    [/họ tên người ký/i, "signerName"],
    [/số vụ án/i, "caseNo"],
    [/số qđ khởi tố/i, "indictmentDecisionNo"],
    [/ngày qđ khởi tố/i, "indictmentDecisionDate"],
    [/tên bị can/i, "accusedName"],
    [/tội danh/i, "chargeName"],
    [/điều khoản blhs/i, "lawArticleLine"],
    [/loại thay đổi/i, "changeType"],
    [/lý do thay đổi/i, "changeReasonLine"],
    [/người cũ/i, "previousPersonName"],
    [/chức vụ người cũ/i, "previousPersonTitle"],
    [/người mới/i, "newPersonName"],
    [/chức vụ người mới/i, "newPersonTitle"],
    [/điều khoản tố tụng/i, "procedureArticleLine"],
    [/nội dung điều/i, "decisionArticleLine"],
    [/người bị can$/i, "accusedName"],
    [/điện thoại/i, "phone"],
    [/lý do căn cứ/i, "reasonLine"],
  ];

  for (const [re, name] of PATTERNS) {
    if (re.test(key)) return name;
  }

  // Fallback: first meaningful 2-word combo
  const words = key.replace(/[^\w\sàáảãạăằắẳẵặâầấậẫẩđèéẻẽẹêềếệễểìíỉĩịòóỏõọôồốộổỗơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words[0] + words[1].charAt(0).toUpperCase() + words[1].slice(1);
  if (words.length === 1) return words[0].replace(/\s/g, "");
  return "field";
}

function labelToNamespace(label) {
  const key = label.toLowerCase();
  if (/cơ quan|viện kiểm|địa danh|nơi ban hành/i.test(key)) return "agency";
  if (/ngày ban hành|số lệnh|số quyết định|tóm tắt|mô tả|diễn biến|số vụ án|thời hạn|lý do căn|điều 1|điều 2|nội dung/i.test(key)) return "document";
  if (/người ký|chế độ|chức vụ|chữ ký/i.test(key)) return "signature";
  if (/căn cứ|tố tụng|blhs/i.test(key)) return "legalBasis";
  if (/người bị|bị can|tội danh|điều tra/i.test(key)) return "person";
  if (/nhận|lưu hồ|thi hành/i.test(key)) return "recipients";
  return "document";
}

function getSemanticPath(formInputs, position) {
  if (!formInputs || position >= formInputs.length) return null;
  const label = formInputs[position];
  const ns = labelToNamespace(label);
  const name = labelToFieldName(label);
  return ns + "." + name;
}

function extractDocxMustachesInOrder(docxBuffer) {
  const zip = new PizZip(docxBuffer);
  const docXml = zip.file("word/document.xml")?.asText() || "";
  // Extract all mustache positions in document order
  const results = [];
  const re = /\{\{([^}]+)\}\}/g;
  let m;
  while ((m = re.exec(docXml)) !== null) {
    results.push({ mustache: m[1].trim(), pos: m.index });
  }
  return results;
}

function fixDocxAndContract(code, formInputs) {
  const normFile = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(normFile)) return { status: "no_docx" };

  const docxBuffer = fs.readFileSync(normFile);
  const mustaches = extractDocxMustachesInOrder(docxBuffer);

  if (mustaches.length === 0) return { status: "no_mustaches" };

  // Check if any are generic
  const genericMustaches = mustaches.filter((m) => /^[a-z]+\.field\d+$/i.test(m.mustache));
  if (genericMustaches.length === 0) return { status: "already_semantic" };

  // Build replacement map: generic mustache -> semantic path
  const replacements = {};
  // Track mustache position within generic list (0, 1, 2...) for positional matching
  let genericPosition = 0;
  for (const { mustache } of mustaches) {
    if (!/^[a-z]+\.field\d+$/i.test(mustache)) continue;

    let semantic = null;
    if (formInputs) {
      // Positional: generic mustache at position N -> form field at index N
      if (genericPosition < formInputs.length) {
        semantic = getSemanticPath(formInputs, genericPosition);
      }
      // Fallback: match by field number (document.field3 -> form field index 2)
      if (!semantic) {
        const num = parseInt(mustache.match(/(\d+)$/)?.[1] || "0", 10);
        if (num > 0 && num - 1 < formInputs.length) {
          semantic = getSemanticPath(formInputs, num - 1);
        }
      }
    }

    if (semantic) replacements[mustache] = semantic;
    genericPosition++;
  }

  if (Object.keys(replacements).length === 0) return { status: "no_mapping", genericCount: genericMustaches.length };

  // Apply to DOCX
  const zip = new PizZip(docxBuffer);
  let xml = zip.file("word/document.xml")?.asText() || "";
  let changedCount = 0;
  for (const [old, semantic] of Object.entries(replacements)) {
    if (xml.includes("{{" + old + "}}")) {
      xml = xml.split("{{" + old + "}}").join("{{" + semantic + "}}");
      changedCount++;
    }
  }
  if (changedCount > 0) {
    zip.file("word/document.xml", xml);
    fs.writeFileSync(normFile, zip.generate({ type: "nodebuffer" }));
  }

  // Update draft contract
  const drafts = fs.readdirSync(CONTRACTS_DIR)
    .filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.draft.json"));
  if (drafts.length > 0) {
    try {
      const draft = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, drafts[0]), "utf8"));
      if (draft.status !== "locked") {
        for (const slot of (draft.docxSlots || [])) {
          const sem = replacements[slot.slotId];
          if (sem) slot.slotId = sem;
        }
        for (const field of (draft.canonicalFields || [])) {
          const sem = replacements[field.path];
          if (sem) field.path = sem;
        }
        for (const binding of (draft.renderBindings || [])) {
          const sem = replacements[binding.slotId];
          if (sem) {
            binding.slotId = sem;
            binding.from = sem;
          }
        }
        fs.writeFileSync(path.join(CONTRACTS_DIR, drafts[0]), JSON.stringify(draft, null, 2));
      }
    } catch (e) { /* skip */ }
  }

  return { status: "fixed", changed: changedCount, mappings: Object.keys(replacements).length };
}

// ── Main ───────────────────────────────────────────────────────────────────
const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));
let fixed = 0, skipped = 0, noFI = 0;

for (const code of ALL) {
  const formInputs = parseFormInputs(code);
  if (!formInputs) noFI++;

  const result = fixDocxAndContract(code, formInputs);

  if (result.status === "fixed") {
    console.log("FIXED: " + code + " (" + result.mappings + " mappings, " + result.changed + " replaces)");
    fixed++;
  } else if (result.status === "already_semantic") {
    skipped++;
  } else if (result.status === "no_mapping") {
    console.log("NOMAP: " + code + " (" + result.genericCount + " generic mustaches, no FI)");
    skipped++;
  } else if (result.status === "no_docx") {
    skipped++;
  } else if (result.status === "no_mustaches") {
    skipped++;
  }
}

console.log("\nFixed: " + fixed + " DOCX + contracts");
console.log("Skipped: " + skipped);
console.log("No form inputs: " + noFI);
