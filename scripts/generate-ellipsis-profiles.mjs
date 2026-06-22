#!/usr/bin/env node
/**
 * generate-ellipsis-profiles.mjs
 *
 * Builds a JSON profile for each ellipsis-style BM by:
 * 1. Extracting paragraphs + ellipsis positions from the normalized DOCX XML.
 * 2. Mapping each ellipsis occurrence to a form-input field using context clues.
 * 3. Writing the profile to scripts/form-refinement/profiles/BM-XXX.json.
 *
 * Usage:
 *   node scripts/generate-ellipsis-profiles.mjs --codes BM-021,BM-022
 *   node scripts/generate-ellipsis-profiles.mjs --all           # all ellipsis BMs
 *   node scripts/generate-ellipsis-profiles.mjs --dry-run      # list what would be generated
 *
 * Profile schema:
 * {
 *   "templateCode": "BM-XXX",
 *   "source": "normalized-docx-ellipsis",
 *   "fields": [
 *     {
 *       "path": "namespace.fieldName",
 *       "label": "Mô tả tiếng Việt",
 *       "section": "Tên section",
 *       "uiComponent": "text|date|textarea|select|checkbox|number",
 *       "required": true|false,
 *       "sample": "Giá trị mẫu tự nhiên",
 *       "contextBefore": "văn bản trước ellipsis trong paragraph",
 *       "contextAfter": "văn bản sau ellipsis trong paragraph",
 *       "blockId": "P####",
 *       "slotType": "text|date|table|signature",
 *       "confidence": 0.4|0.8|1.0,
 *       "reviewRequired": true
 *     }
 *   ]
 * }
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PROFILES_DIR = path.join(REPO_ROOT, "scripts", "form-refinement", "profiles");

// Ellipsis patterns to detect in XML text content
const ELLIPSIS_PATTERNS = [
  { regex: /\.{3,}/g, kind: "dot3+" },
  { regex: /…{1,}/g, kind: "unicode-ellipsis" },
  { regex: /_{3,}/g, kind: "underscore3+" },
];

// Vietnamese date line — must be matched BEFORE individual ellipsis
const DATE_LINE_REGEX = /ngày\s*[….]+\s*tháng\s*[….]+\s*năm\s*[….]+/iu;

// Regex to strip XML tags
function stripXmlTags(xml) {
  return xml.replace(/<[^>]+>/gu, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

// Extract paragraphs from DOCX word/document.xml
function extractParagraphs(docxPath) {
  const zip = new PizZip(fs.readFileSync(docxPath));
  const docXml = zip.file("word/document.xml")?.asText() ?? "";

  // Split into paragraph blocks — keep track of position in raw XML
  const paragraphPattern = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu;
  const paragraphs = [];
  let match;

  while ((match = paragraphPattern.exec(docXml)) !== null) {
    const rawXml = match[0];
    const blockText = stripXmlTags(rawXml);
    // Only keep paragraphs with ellipsis content
    const hasEllipsis = /[…._]{3,}/.test(blockText);
    if (!hasEllipsis) continue;

    paragraphs.push({
      blockId: `P${String(paragraphs.length + 1).padStart(4, "0")}`,
      rawXml,
      text: blockText,
    });
  }

  return paragraphs;
}

// Extract ellipsis positions from paragraph text
function extractEllipsisInParagraph(para) {
  const results = [];

  // Check for date line first
  const dateMatch = para.text.match(DATE_LINE_REGEX);
  if (dateMatch) {
    const dateText = dateMatch[0];
    const dateStart = para.text.indexOf(dateText);
    results.push({
      kind: "vn-date-line",
      raw: dateText,
      textBefore: para.text.slice(0, dateStart),
      textAfter: para.text.slice(dateStart + dateText.length),
      blockId: para.blockId,
      rawXml: para.rawXml,
      slotType: "date",
    });
    return results;
  }

  // Check for numbered blanks (1).... (2)....
  const numberedMatches = [...para.text.matchAll(/\(\s*(\d+)\s*\)\s*\.{3,}/g)];
  for (const m of numberedMatches) {
    const textBefore = para.text.slice(0, m.index);
    const textAfter = para.text.slice(m.index + m[0].length);
    results.push({
      kind: "numbered-blank",
      raw: m[0],
      number: parseInt(m[1], 10),
      textBefore,
      textAfter,
      blockId: para.blockId,
      rawXml: para.rawXml,
      slotType: "text",
    });
  }

  // Check for dot sequences
  const dotMatches = [...para.text.matchAll(/\.{3,}/g)];
  for (const m of dotMatches) {
    // Skip if inside a date match already recorded
    const textBefore = para.text.slice(0, m.index);
    const textAfter = para.text.slice(m.index + m[0].length);
    results.push({
      kind: "ellipsis-dots",
      raw: m[0],
      textBefore,
      textAfter,
      blockId: para.blockId,
      rawXml: para.rawXml,
      slotType: "text",
    });
  }

  // Check for Unicode ellipsis
  const ellipsisMatches = [...para.text.matchAll(/…{1,}/g)];
  for (const m of ellipsisMatches) {
    const textBefore = para.text.slice(0, m.index);
    const textAfter = para.text.slice(m.index + m[0].length);
    results.push({
      kind: "ellipsis-unicode",
      raw: m[0],
      textBefore,
      textAfter,
      blockId: para.blockId,
      rawXml: para.rawXml,
      slotType: "text",
    });
  }

  return results;
}

// Load form-inputs for a BM to get field definitions
function loadFormInputs(code) {
  const formInputsPath = path.join(
    REPO_ROOT, "apps", "web", "src", "components", "documents",
    `${code.toLowerCase()}-form-inputs.tsx`
  );
  if (!fs.existsSync(formInputsPath)) return null;

  const content = fs.readFileSync(formInputsPath, "utf8");

  // Parse field definitions from the TypeScript component
  const fields = [];
  // Look for Field components: <Field name="xxx" ...>
  const fieldMatches = content.matchAll(/<Field\s+([^>]+)>/gi);
  for (const m of fieldMatches) {
    const attrs = m[1];
    const nameMatch = attrs.match(/\bname=["']([^"']+)["']/i);
    const labelMatch = attrs.match(/\blabel=["']([^"']+)["']/i);
    const requiredMatch = attrs.match(/\brequired\s*=\s*\{(true|false)\}/i);
    const componentMatch = attrs.match(/\bcomponent=["']([^"']+)["']/i);

    if (nameMatch) {
      fields.push({
        name: nameMatch[1],
        label: labelMatch ? labelMatch[1] : nameMatch[1],
        required: requiredMatch ? requiredMatch[1] === "true" : false,
        component: componentMatch ? componentMatch[1] : "text",
      });
    }
  }

  // Also look for section labels
  const sectionMatches = content.matchAll(/\/\/\s*(.+?)\s*[-–]\s*fields?/gi);
  const sections = [];
  for (const m of sectionMatches) {
    sections.push(m[1].trim());
  }

  return { fields, sections, raw: content };
}

// Infer namespace from context
function suggestNamespace(textBefore, textAfter, blockId) {
  const combined = (textBefore + " " + textAfter).toLowerCase();
  if (/viện kiểm sát|cơ quan|cấp trên|cơ quan cấp/i.test(combined))
    return "agency";
  if (/ngày|số:|mẫu số|văn bản|qđ-|quyết định|số &|năm &|tháng &/i.test(combined))
    return "document";
  if (/vụ án|tối phạm|nguồn tin|hành vi|khởi tố/i.test(combined))
    return "case";
  if (/họ tên|ngày sinh|cmnd|cccd|quốc tịch|nơi ở|địa chỉ|cư trú/i.test(combined))
    return "informant";
  if (/người nhận|người tiếp nhận|người có thẩm quyền/i.test(combined))
    return "receiver";
  if (/ksv|kiểm sát viên|viện trưởng|phó viện trưởng/i.test(combined))
    return "prosecutor";
  if (/điều\s*\d|điều\s*\d+\/\d|khoản\s*\d/i.test(combined))
    return "legalBasis";
  if (/quyết định khởi tố|quyết định\s*\d|nội dung|tóm tắt/i.test(combined))
    return "decision";
  if (/nơi nhận|lưu|hsva|hsvv/i.test(combined))
    return "recipients";
  if (/ký|chức danh|ký tên|thủ trưởng/i.test(combined))
    return "signature";
  if (/bị can|bị cáo|người bị tố giác/i.test(combined))
    return "defendant";
  if (/công dân|người báo tin|người tố giác/i.test(combined))
    return "reporter";
  return "document";
}

// Infer uiComponent from context
function inferUiComponent(textBefore, textAfter, raw) {
  const combined = (textBefore + " " + textAfter).toLowerCase();
  if (/ngày\s*[….]+\s*tháng\s*[….]+\s*năm/i.test(combined))
    return "date";
  if (/số điện thoại|điện thoại/i.test(combined))
    return "text";
  if (/nội dung|mô tả|diễn giải|lý do/i.test(combined))
    return "textarea";
  if (/căn cứ|điều luật|khoản/i.test(combined))
    return "text";
  if (/địa chỉ|nơi cư trú/i.test(combined))
    return "text";
  if (raw.length > 60) return "textarea";
  return "text";
}

// Map ellipsis to a form-input field using context
function mapToFormField(ellipsis, formInputs) {
  if (!formInputs) return null;

  const ctx = (ellipsis.textBefore + " " + ellipsis.textAfter).toLowerCase();

  for (const field of formInputs.fields) {
    const fieldKey = field.name.toLowerCase();
    const fieldLabel = field.label.toLowerCase();

    // Direct keyword match
    if (
      ctx.includes(fieldKey) ||
      fieldKey.split(/(?=[A-Z])/).some(part => part.length > 3 && ctx.includes(part.toLowerCase()))
    ) {
      return field;
    }

    // Label match
    if (fieldLabel.length > 3 && ctx.includes(fieldLabel)) {
      return field;
    }
  }

  return null;
}

// Build a semantic field name from context
function buildFieldName(ellipsis, index, formField) {
  if (formField) {
    // Convert camelCase to snake_case then dot notation
    const name = formField.name
      .replace(/([a-z])([A-Z])/g, "$1$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1.$2")
      .toLowerCase();
    return name;
  }

  const ns = suggestNamespace(
    ellipsis.textBefore,
    ellipsis.textAfter,
    ellipsis.blockId
  );

  if (ellipsis.kind === "vn-date-line") return `${ns}.issuePlaceDateLine`;
  if (ellipsis.kind === "numbered-blank")
    return `${ns}.numberedSlot${ellipsis.number}`;
  return `${ns}.field${index + 1}`;
}

// Generate profile for a single BM
function generateProfile(code) {
  const docxPath = path.join(
    REPO_ROOT, "storage", "templates", "normalized-docx",
    code, `${code}_normalized.docx`
  );

  if (!fs.existsSync(docxPath)) {
    console.error(`Normalized DOCX not found: ${docxPath}`);
    return null;
  }

  const formInputs = loadFormInputs(code);

  // Extract paragraphs with ellipsis
  const paragraphs = extractParagraphs(docxPath);

  // Extract ellipsis from each paragraph
  const ellipses = [];
  for (const para of paragraphs) {
    const found = extractEllipsisInParagraph(para);
    ellipses.push(...found);
  }

  if (ellipses.length === 0) {
    console.log(`  No ellipsis found in ${code}`);
    return null;
  }

  console.log(`  Found ${ellipses.length} ellipsis in ${code}`);

  // Build fields from ellipsis
  const fields = [];
  for (let i = 0; i < ellipses.length; i++) {
    const ell = ellipses[i];
    const formField = mapToFormField(ell, formInputs);
    const path = buildFieldName(ell, i, formField);
    const label = formField
      ? formField.label
      : ellipsisKindToLabel(ell.kind, ell.textBefore, ell.textAfter);
    const uiComponent = formField
      ? formField.component
      : inferUiComponent(ell.textBefore, ell.textAfter, ell.raw);
    const section = formField
      ? inferSection(formField.name, formInputs)
      : suggestNamespace(ell.textBefore, ell.textAfter, ell.blockId);

    fields.push({
      path,
      label,
      section,
      uiComponent,
      required: formField ? formField.required : false,
      sample: generateSample(path, ell),
      contextBefore: ellipsisTrim(ell.textBefore, 80),
      contextAfter: ellipsisTrim(ell.textAfter, 80),
      blockId: ell.blockId,
      slotType: ell.slotType,
      confidence: formField ? 0.8 : 0.4,
      reviewRequired: true,
    });
  }

  return {
    templateCode: code,
    source: "normalized-docx-ellipsis",
    fieldCount: fields.length,
    formInputFields: formInputs ? formInputs.fields.length : 0,
    fields,
  };
}

function ellipsisKindToLabel(kind, textBefore, textAfter) {
  if (kind === "vn-date-line") return "Dòng ngày tháng năm";
  if (kind === "numbered-blank") return "Ô đánh số";
  const ctx = (textBefore + " " + textAfter).toLowerCase();
  if (/viện kiểm sát/i.test(ctx)) return "Tên cơ quan";
  if (/quyết định khởi tố/i.test(ctx)) return "Số quyết định";
  if (/họ tên/i.test(ctx)) return "Họ tên";
  if (/ngày tháng/i.test(ctx)) return "Ngày tháng";
  if (/địa chỉ/i.test(ctx)) return "Địa chỉ";
  if (/nội dung/i.test(ctx)) return "Nội dung";
  if (/căn cứ/i.test(ctx)) return "Căn cứ pháp lý";
  if (/ký|ký tên/i.test(ctx)) return "Chữ ký";
  return "Ô trống";
}

function inferSection(fieldName, formInputs) {
  if (!formInputs) return "Thông tin chung";
  // Look for section comments in the form-inputs file
  const raw = formInputs.raw;
  // Try to find the section containing this field
  const fieldIndex = raw.indexOf(`name="${fieldName}"`);
  if (fieldIndex < 0) return "Thông tin chung";

  // Look backwards from the field for the nearest section comment
  const before = raw.slice(0, fieldIndex);
  const sectionMatch = before.match(/\/\/\s*(.+?)\s*[-–]\s*fields?/g);
  if (sectionMatch && sectionMatch.length > 0) {
    const last = sectionMatch[sectionMatch.length - 1];
    return last.replace(/\/\/\s*/, "").replace(/\s*[-–]\s*fields?/i, "").trim();
  }
  return "Thông tin chung";
}

function generateSample(path, ell) {
  const ns = path.split(".")[0];
  if (ell.kind === "vn-date-line") return "TP. Hà Nội, 15 tháng 01 năm 2025";
  if (path.includes("Name") || path.includes("name")) return "Nguyễn Văn Minh";
  if (path.includes("Address") || path.includes("address")) return "123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh";
  if (path.includes("Date") || path.includes("date")) return "15/01/2025";
  if (path.includes("Code") || path.includes("code")) return "01/QĐ-VKS";
  if (path.includes("Phone") || path.includes("phone")) return "0901234567";
  if (path.includes("Agency") || path.includes("agency")) return "Viện kiểm sát nhân dân TP. Hà Nội";
  if (path.includes("Article") || path.includes("article")) return "Điều 147";
  if (path.includes("Content") || path.includes("content") || path.includes("reason"))
    return "Căn cứ vào các tình tiết có thật";
  if (path.includes("signature") || path.includes("signer")) return "Trần Thị Lan";
  if (path.includes("Prosecutor") || path.includes("prosecutor")) return "Kiểm sát viên Nguyễn Văn A";
  return "Giá trị mẫu";
}

function ellipsisTrim(text, maxLen) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 1) + "…";
}

// Parse CLI args
const args = process.argv.slice(2).filter(Boolean);
// Handle codes: --codes=BM-021,BM-022 or just positional BM-021 BM-022
const dryRun = args.includes("--dry-run") || args.includes("-n");
const allFlag = args.includes("--all");
const codes = args
  .filter((a) => /^BM-\d{3}$/i.test(a))
  .map((c) => c.toUpperCase());

if (!allFlag && codes.length === 0) {
  console.error("Usage:");
  console.error("  node generate-ellipsis-profiles.mjs --codes BM-021,BM-022");
  console.error("  node generate-ellipsis-profiles.mjs --all");
  console.error("  node generate-ellipsis-profiles.mjs --dry-run");
  process.exit(1);
}

// If --all, scan for all ellipsis BMs
let allCodes = codes;
if (allFlag) {
  allCodes = [];
  for (let i = 1; i <= 213; i++) {
    const code = `BM-${String(i).padStart(3, "0")}`;
    const docxPath = path.join(
      REPO_ROOT, "storage", "templates", "normalized-docx",
      code, `${code}_normalized.docx`
    );
    if (!fs.existsSync(docxPath)) continue;

    // Quick check: does it have ellipsis but no mustache?
    try {
      const zip = new PizZip(fs.readFileSync(docxPath));
      const docXml = zip.file("word/document.xml")?.asText() ?? "";
      const hasMustache = /\{\{[^}]+\}\}/.test(docXml);
      const hasEllipsis = /[…._]{3,}/.test(docXml);
      if (hasEllipsis && !hasMustache) {
        allCodes.push(code);
      }
    } catch {
      // skip
    }
  }
  console.log(`Found ${allCodes.length} ellipsis BMs to process`);
}

console.log(`Processing ${allCodes.length} BMs: ${allCodes.join(", ")}`);

const results = [];
for (const code of allCodes) {
  process.stdout.write(`  ${code}... `);
  const profile = generateProfile(code);
  if (profile) {
    results.push(profile);
    if (!dryRun) {
      const profilePath = path.join(PROFILES_DIR, `${code}.json`);
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), "utf8");
      console.log(`written (${profile.fields.length} fields)`);
    } else {
      console.log(`would write (${profile.fields.length} fields)`);
    }
  } else {
    console.log("skipped");
  }
}

console.log(`\nSummary: ${results.length} profiles generated`);
if (!dryRun && results.length > 0) {
  const totalFields = results.reduce((sum, p) => sum + p.fields.length, 0);
  console.log(`Total fields: ${totalFields}`);
}
