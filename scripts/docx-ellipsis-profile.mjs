#!/usr/bin/env node
/**
 * docx-ellipsis-profile.mjs
 *
 * Pipeline cho ellipsis-style BMs:
 * 1. Convert DOC/DOCX gốc bằng LibreOffice (soffice headless).
 * 2. Extract ellipsis positions từ DOCX XML.
 * 3. Map ellipsis → form-inputs field names dùng context + namespace.
 * 4. Generate profile JSON.
 *
 * Usage:
 *   node scripts/docx-ellipsis-profile.mjs --codes BM-021
 *   node scripts/docx-ellipsis-profile.mjs --codes BM-021,BM-022,BM-024
 *   node scripts/docx-ellipsis-profile.mjs --all-ellipsis
 *   node scripts/docx-ellipsis-profile.mjs --dry-run --codes BM-021
 *
 * Output:
 *   scripts/form-refinement/profiles/BM-XXX.json
 *   scripts/form-refinement/profiles/BM-XXX.docx (converted DOCX)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PROFILES_DIR = path.join(REPO_ROOT, "scripts", "form-refinement", "profiles");
const DOCX_OUT_DIR = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");

const SOFFICE = process.env.LIBREOFFICE_PATH ??
  (fs.existsSync("C:\\Program Files\\LibreOffice\\program\\soffice.exe")
    ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe"
    : fs.existsSync("C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe")
    ? "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
    : null);

if (!SOFFICE) {
  console.error("LibreOffice soffice.exe not found. Set LIBREOFFICE_PATH env or install LibreOffice.");
  process.exit(1);
}

// ─── XML helpers ───────────────────────────────────────────────────────────────

function stripXmlTags(xml) {
  return xml
    .replace(/<[^>]+>/gu, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function extractDocxParagraphs(docxPath) {
  const zip = new PizZip(fs.readFileSync(docxPath));
  const docXml = zip.file("word/document.xml")?.asText() ?? "";

  const paragraphPattern = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu;
  const paragraphs = [];
  let match;

  while ((match = paragraphPattern.exec(docXml)) !== null) {
    const rawXml = match[0];
    const text = stripXmlTags(rawXml);
    const fullText = text.replace(/\s+/g, " ").trim();

    paragraphs.push({
      blockId: `P${String(paragraphs.length + 1).padStart(4, "0")}`,
      rawXml,
      text,
      fullText,
      rawStart: match.index,
      rawEnd: match.index + match[0].length,
    });
  }

  return paragraphs;
}

// ─── Ellipsis detection ──────────────────────────────────────────────────────

// Vietnamese date line patterns (ellipsis can appear BEFORE or AFTER keywords)
const DATE_LINE_PATTERNS = [
  /[….\s]*ngày[….\s]*tháng[….\s]*năm[….\s]*/iu,
  /[….\s]*tháng[….\s]*năm[….\s]*/iu,
  /ngày[….\s]+/iu,
  /tháng[….\s]+/iu,
  /năm[….\s]+/iu,
];

// All ellipsis patterns
const ELLIPSIS_KINDS = [
  { regex: /\.{3,}/g, kind: "ellipsis-dots" },
  { regex: /…{1,}/g, kind: "ellipsis-unicode" },
  { regex: /_{3,}/g, kind: "underscore" },
];

function detectEllipsisPositions(paragraphs) {
  const positions = [];

  for (const para of paragraphs) {
    // Check for date line first (entire paragraph as one slot)
    for (const dateRegex of DATE_LINE_PATTERNS) {
      const match = para.fullText.match(dateRegex);
      if (match) {
        positions.push({
          kind: "vn-date-line",
          raw: match[0],
          blockId: para.blockId,
          textBefore: "",
          textAfter: "",
          fullText: para.fullText,
          slotType: "date",
        });
        break;
      }
    }

    // Individual ellipsis within paragraph
    for (const { regex, kind } of ELLIPSIS_KINDS) {
      const text = para.fullText;
      let m;
      regex.lastIndex = 0;
      while ((m = regex.exec(text)) !== null) {
        const raw = m[0];
        const rawStart = m.index;
        const rawEnd = m.index + raw.length;
        const textBefore = text.slice(0, rawStart).trim();
        const textAfter = text.slice(rawEnd).trim();

        // Skip if this ellipsis is part of a date line already recorded
        const inDateLine = positions.some(
          (p) =>
            p.blockId === para.blockId &&
            p.kind === "vn-date-line" &&
            rawStart >= 0
        );
        if (inDateLine) continue;

        positions.push({
          kind,
          raw,
          blockId: para.blockId,
          textBefore,
          textAfter,
          fullText: para.fullText,
          slotType: inferSlotType(raw, textBefore, textAfter),
        });
      }
    }
  }

  return positions;
}

function inferSlotType(raw, textBefore, textAfter) {
  const ctx = `${textBefore} ${textAfter}`.toLowerCase();
  if (/ngày|tháng|năm/i.test(ctx)) return "date";
  if (/signature|chữ.ký|ký tên/i.test(ctx)) return "signature";
  return "text";
}

// ─── Form inputs parser ─────────────────────────────────────────────────────

function parseFormInputs(code) {
  const filePath = path.join(
    REPO_ROOT, "apps", "web", "src", "components", "documents",
    `${code.toLowerCase()}-form-inputs.tsx`
  );
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf8");

  // Match component tags by finding <BmFieldXxx and reading up to the next > not inside quotes
  const fields = [];
  let pos = 0;
  const raw = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  while (pos < raw.length) {
    const openIdx = raw.indexOf("<BmField", pos);
    if (openIdx < 0) break;

    // Find the closing > for this tag (not inside quotes)
    let closeIdx = -1;
    let inQuote = false;
    let quoteChar = "";
    for (let i = openIdx + 1; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === "\r" || ch === "\n") continue; // skip line breaks in attributes
      if (!inQuote && (ch === '"' || ch === "'")) {
        inQuote = true;
        quoteChar = ch;
      } else if (inQuote && ch === quoteChar) {
        inQuote = false;
        quoteChar = "";
      } else if (!inQuote && ch === ">") {
        closeIdx = i;
        break;
      }
    }

    if (closeIdx < 0) break;
    // Use string search instead of regex to avoid multi-line issues
    const tagContent = raw.slice(openIdx + 1, closeIdx);

    // Extract label from label="..." or label={`...`}
    const labelMatch = tagContent.match(/label=["']([^"']+)["']/);
    const labelTemplateMatch = tagContent.match(/label=\{\`([^`]+)\`\}/);
    const label = labelMatch ? labelMatch[1] : labelTemplateMatch ? labelTemplateMatch[1] : null;

    // Extract component type
    const compMatch = tagContent.match(/^(\w+)/);
    const component = compMatch ? compMatch[1] : "BmFieldText";

    // Extract required (standalone attribute = true, or required={true})
    const standaloneRequired = /\brequired\b/.test(tagContent) && !/\brequired\s*=\s*\{false\}/.test(tagContent);
    const requiredMatch = tagContent.match(/\brequired\s*=\s*\{(true|false)\}/);
    const required = requiredMatch ? requiredMatch[1] === "true" : standaloneRequired;

    // Find fullWidth (standalone attribute)
    const fullWidth = /\bfullWidth\b/.test(tagContent);

    // Now find the field name from updateSection call in the NEXT 600 chars
    const afterTag = raw.slice(closeIdx + 1, Math.min(raw.length, closeIdx + 601));
    const updateMatch = afterTag.match(/updateSection\s*\(\s*["'](\w+)["']\s*,\s*["']([^"']+)["']/);
    const section = updateMatch ? updateMatch[1] : null;
    const fieldName = updateMatch ? updateMatch[2] : null;

    if (fieldName && label) {
      fields.push({
        name: fieldName,
        section,
        component,
        label,
        required,
        fullWidth,
      });
    }

    pos = closeIdx + 1;
  }

  // Extract section names from section titles
  const sectionRe = /BmFormSection\s+title=["']([^"']+)["']/gi;
  const sections = [];
  let sm;
  while ((sm = sectionRe.exec(content)) !== null) {
    sections.push(sm[1]);
  }

  return { fields, sections, raw: content };
}

// ─── Namespace + field name inference ──────────────────────────────────────

const FIELD_NAME_INFERENCE = [
  // Agency
  [/viện kiểm sát\s*(cấp\s*)?trên/i, "agency.parentNameUpper"],
  [/viện kiểm sát\s*ban hành/i, "agency.nameUpper"],
  [/địa danh/i, "agency.issuePlace"],
  [/tên\s*cơ\s*quan/i, "agency.nameUpper"],
  // Document
  [/số\s*quyết\s*định/i, "document.documentCode"],
  [/ngày\s*ban\s*hành/i, "document.issueDate"],
  [/dòng\s*địa\s*danh/i, "document.issuePlaceAndDateLine"],
  [/mẫu\s*số/i, "document.documentCode"],
  [/thông\s*tư/i, "document.documentCode"],
  // Person
  [/họ\s*tên/i, "person.fullName"],
  [/người\s*bị\s*áp\s*dụng/i, "recipients.personLine"],
  [/người\s*bị\s*can/i, "recipients.personLine"],
  // Legal basis
  [/căn\s*cứ\s*bộ\s*luật/i, "legalBasis.procedureArticlesLine"],
  [/điều\s*\d/i, "legalBasis.procedureArticlesLine"],
  // Decision
  [/tóm\s*tắt/i, "decision.summaryLine"],
  [/nội\s*dung\s*quyết\s*định/i, "decision.decisionLine"],
  [/lý\s*do/i, "decision.decisionLine"],
  // Recipients
  [/cơ\s*quan\s*thi\s*hành/i, "recipients.executionAgencyLine"],
  [/người\s*bị\s*á p ?dụng/i, "recipients.personLine"],
  [/lưu\s*hồ\s*sơ/i, "recipients.archiveLine"],
  [/nơi\s*nhận/i, "recipients.executionAgencyLine"],
  // Signature
  [/chế\s*độ\s*ký/i, "signature.signMode"],
  [/chức\s*danh/i, "signature.positionTitle"],
  [/người\s*ký/i, "signature.signerName"],
  [/ký\s*tên/i, "signature.signerName"],
];

const NAMESPACE_INFERENCE = [
  [/viện kiểm sát|cơ quan|cấp trên|cấp dưới/i, "agency"],
  [/số quyết định|ngày tháng|mẫu số|văn bản|thông tư|địa danh/i, "document"],
  [/vụ án|tối phạm|nguồn tin|hành vi|khởi tố/i, "case"],
  [/họ tên|ngày sinh|cmnd|cccd|nơi ở|cư trú/i, "person"],
  [/căn cứ pháp luật|điều|khoản/i, "legalBasis"],
  [/quyết định|tóm tắt|nội dung|lý do/i, "decision"],
  [/cơ quan thi hành|nơi nhận|lưu hồ sơ|người nhận/i, "recipients"],
  [/ký|chức danh|chữ ký/i, "signature"],
  [/bị can|bị cáo/i, "defendant"],
];

function inferFieldPath(ctx) {
  const context = ctx.toLowerCase();
  for (const [re, path] of FIELD_NAME_INFERENCE) {
    if (re.test(context)) return path;
  }
  return null;
}

function inferNamespace(ctx) {
  const context = ctx.toLowerCase();
  for (const [re, ns] of NAMESPACE_INFERENCE) {
    if (re.test(context)) return ns;
  }
  return "document";
}

function suggestFieldName(ellipsis, index, formInputs) {
  // Try form inputs first
  if (formInputs) {
    for (const field of formInputs.fields) {
      const labelLower = field.label.toLowerCase();
      const ctx = `${ellipsis.textBefore} ${ellipsis.textAfter}`.toLowerCase();

      // Keyword match
      if (
        ctx.includes(labelLower) ||
        labelLower.split(/\s+/).filter(Boolean).some(
          (w) => w.length > 3 && ctx.includes(w)
        )
      ) {
        return field;
      }
    }
  }

  // Fall back to regex inference
  const ctx = `${ellipsis.textBefore} ${ellipsis.textAfter}`;
  const inferred = inferFieldPath(ctx);
  if (inferred) return { name: inferred, label: ellipsisKindToLabel(ctx), required: false };

  const ns = inferNamespace(ctx);
  const count = index + 1;
  return { name: `${ns}.field${count}`, label: ellipsisKindToLabel(ctx), required: false };
}

function ellipsisKindToLabel(ctx) {
  const c = ctx.toLowerCase();
  if (/viện kiểm sát|cơ quan ban hành/i.test(c)) return "Tên cơ quan";
  if (/số quyết định|số văn bản/i.test(c)) return "Số quyết định";
  if (/ngày|tháng|năm/i.test(c)) return "Ngày tháng năm";
  if (/họ tên|người/i.test(c)) return "Họ tên";
  if (/địa chỉ|địa danh/i.test(c)) return "Địa danh";
  if (/căn cứ/i.test(c)) return "Căn cứ pháp lý";
  if (/nội dung|lý do/i.test(c)) return "Nội dung quyết định";
  if (/ký|chữ ký/i.test(c)) return "Chữ ký";
  if (/lưu hồ sơ|nơi nhận/i.test(c)) return "Nơi nhận";
  return "Ô trống";
}

function inferSection(fieldName, formInputs) {
  if (!formInputs) return "Thông tin chung";

  // Map field path → section
  const sectionMap = {
    agency: "1. Cơ quan ban hành",
    document: "2. Số / ngày văn bản",
    person: "3. Đối tượng áp dụng",
    legalBasis: "4. Căn cứ pháp lý",
    decision: "5. Nội dung quyết định",
    recipients: "6. Nơi nhận",
    signature: "7. Chữ ký",
  };

  const ns = fieldName.split(".")[0];
  return sectionMap[ns] ?? "Thông tin chung";
}

function generateSample(path, ellipsis) {
  if (path.includes("Name") || path.includes("name")) return "Nguyễn Văn Minh";
  if (path.includes("Address") || path.includes("address")) return "TP. Hồ Chí Minh";
  if (path.includes("Date") || path.includes("date") || ellipsis.kind === "vn-date-line")
    return "TP. Hà Nội, 15 tháng 01 năm 2025";
  if (path.includes("Code") || path.includes("code")) return "21/QĐ-VKS";
  if (path.includes("Phone")) return "0901234567";
  if (path.includes("Agency") || path.includes("agency"))
    return "Viện kiểm sát nhân dân TP. Hà Nội";
  if (path.includes("Article") || path.includes("article")) return "Điều 147";
  if (path.includes("Content") || path.includes("content") || path.includes("reason"))
    return "Căn cứ vào các tình tiết có thật theo quy định";
  if (path.includes("signature") || path.includes("signer")) return "Trần Thị Lan";
  return "Giá trị mẫu";
}

// ─── LibreOffice conversion ─────────────────────────────────────────────────

function convertToDocx(sourcePath, outputDir, code) {
  const outFile = path.join(outputDir, code, `${code}_normalized.docx`);
  const outDirForCode = path.join(outputDir, code);

  fs.mkdirSync(outDirForCode, { recursive: true });

  const stderrBuf = [];
  try {
    execSync(
      `"${SOFFICE}" --headless --convert-to docx --outdir "${outDirForCode}" "${sourcePath}"`,
      {
        cwd: outDirForCode,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 60000,
        env: { ...process.env, HOME: process.env.TEMP ?? "/tmp" },
      }
    );
  } catch (err) {
    // LibreOffice sometimes outputs to the source dir; try that
  }

  // Find the converted DOCX (LibreOffice may rename it)
  const candidates = [
    outFile,
    path.join(outDirForCode, path.basename(sourcePath).replace(/\.docx?$/i, ".docx")),
  ];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }

  // Try glob for any .docx in the output dir
  const files = fs.readdirSync(outDirForCode).filter((f) => f.endsWith(".docx"));
  if (files.length > 0) {
    return path.join(outDirForCode, files[0]);
  }

  return null;
}

// ─── Source DOCX resolution ────────────────────────────────────────────────

function findSourceDocx(code) {
  const bmNum = parseInt(code.replace("BM-", ""), 10);
  const padded = String(bmNum).padStart(2, "0");

  // 1. Scan all group subfolders for a file starting with "XX-" where XX is the BM number
  const docsDir = path.join(REPO_ROOT, "docs", "Biểu mẫu", "Full", "0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC");
  if (fs.existsSync(docsDir)) {
    const entries = fs.readdirSync(docsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const subDir = path.join(docsDir, entry.name);
      try {
        const files = fs.readdirSync(subDir);
        for (const file of files) {
          const fileLower = file.toLowerCase();
          const ext = path.extname(file).toLowerCase();
          if (!ext) continue;
          // Match "21-xxx.doc" or "21.xxx.doc"
          if (
            fileLower.startsWith(padded + "-") ||
            fileLower.startsWith(padded + ".")
          ) {
            return { path: path.join(subDir, file), source: ext === ".doc" ? "doc" : "docx" };
          }
        }
      } catch {
        // skip inaccessible dirs
      }
    }
  }

  // 2. Fall back to normalized DOCX (for BMs without source docs)
  const normPath = path.join(
    REPO_ROOT, "storage", "templates", "normalized-docx",
    code, `${code}_normalized.docx`
  );
  if (fs.existsSync(normPath)) return { path: normPath, source: "normalized" };

  return null;
}

// ─── Profile generation ─────────────────────────────────────────────────────

function buildProfile(code, docxPath, formInputs) {
  const paragraphs = extractDocxParagraphs(docxPath);
  const positions = detectEllipsisPositions(paragraphs);

  if (positions.length === 0) {
    console.log(`  No ellipsis found in ${code} DOCX`);
    return null;
  }

  const fields = [];
  for (let i = 0; i < positions.length; i++) {
    const ell = positions[i];
    const field = suggestFieldName(ell, i, formInputs);
    const path = typeof field === "string" ? field : field.name;
    const label = typeof field === "string" ? field : field.label;
    const required = typeof field !== "string" && field.required !== undefined ? field.required : false;

    fields.push({
      path,
      label,
      section: inferSection(path, formInputs),
      uiComponent: ell.slotType === "date" ? "date" : ell.slotType === "signature" ? "text" : "text",
      required,
      sample: generateSample(path, ell),
      contextBefore: ellipsisTrim(ell.textBefore, 80),
      contextAfter: ellipsisTrim(ell.textAfter, 80),
      blockId: ell.blockId,
      slotType: ell.slotType,
      confidence: typeof field !== "string" && formInputs ? 0.8 : 0.4,
      reviewRequired: true,
    });
  }

  return {
    templateCode: code,
    source: "docx-ellipsis",
    fieldCount: fields.length,
    formInputFields: formInputs ? formInputs.fields.length : 0,
    paragraphCount: paragraphs.length,
    fields,
  };
}

function ellipsisTrim(text, maxLen) {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  return t.length > maxLen ? t.slice(0, maxLen - 1) + "…" : t;
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2).filter(Boolean);
const dryRun = args.includes("--dry-run") || args.includes("-n");
const allFlag = args.includes("--all-ellipsis");

// Parse positional BM codes
const codes = args
  .filter((a) => /^BM-\d{3}$/i.test(a))
  .map((c) => c.toUpperCase());

if (!allFlag && codes.length === 0) {
  console.error("Usage:");
  console.error("  node scripts/docx-ellipsis-profile.mjs --dry-run BM-021");
  console.error("  node scripts/docx-ellipsis-profile.mjs BM-021 BM-022 BM-024");
  console.error("  node scripts/docx-ellipsis-profile.mjs --all-ellipsis");
  process.exit(1);
}

// If --all-ellipsis, scan for all ellipsis BMs
let targetCodes = codes;
if (allFlag) {
  targetCodes = [];
  for (let i = 1; i <= 213; i++) {
    const code = `BM-${String(i).padStart(3, "0")}`;
    const normPath = path.join(
      REPO_ROOT, "storage", "templates", "normalized-docx",
      code, `${code}_normalized.docx`
    );
    if (!fs.existsSync(normPath)) continue;
    try {
      const zip = new PizZip(fs.readFileSync(normPath));
      const docXml = zip.file("word/document.xml")?.asText() ?? "";
      const hasMustache = /\{\{[^}]+\}\}/.test(docXml);
      const hasEllipsis = /[…._]{3,}/.test(docXml);
      if (hasEllipsis && !hasMustache) targetCodes.push(code);
    } catch {
      // skip
    }
  }
  console.log(`Found ${targetCodes.length} ellipsis BMs: ${targetCodes.join(", ")}`);
}

console.log(`\nProcessing ${targetCodes.length} BMs: ${targetCodes.join(", ")}\n`);

const results = [];
for (const code of targetCodes) {
  process.stdout.write(`  ${code}... `);

  const sourceInfo = findSourceDocx(code);
  if (!sourceInfo) {
    console.log("SOURCE_NOT_FOUND");
    continue;
  }

  // Convert DOC/DOCX → DOCX if needed
  let docxPath = sourceInfo.path;
  if (!docxPath.toLowerCase().endsWith(".docx")) {
    const converted = convertToDocx(sourceInfo.path, DOCX_OUT_DIR, code);
    if (!converted) {
      console.log("CONVERSION_FAILED");
      continue;
    }
    docxPath = converted;
    process.stdout.write("(converted) ");
  }

  const formInputs = parseFormInputs(code);
  if (formInputs) {
    process.stdout.write(`(${formInputs.fields.length} form-fields) `);
  }

  const profile = buildProfile(code, docxPath, formInputs);
  if (!profile) continue;

  results.push({ code, profile });
  console.log(`${profile.fieldCount} ellipsis positions → ${profile.fields.length} fields`);

  if (!dryRun) {
    fs.writeFileSync(
      path.join(PROFILES_DIR, `${code}.json`),
      JSON.stringify(profile, null, 2),
      "utf8"
    );
    console.log(`    → profile written`);
  } else {
    console.log(`    → [DRY-RUN] not written`);
  }
}

console.log(`\nSummary: ${results.length}/${targetCodes.length} profiles generated`);
if (!dryRun && results.length > 0) {
  const totalFields = results.reduce((s, r) => s + r.profile.fieldCount, 0);
  console.log(`Total ellipsis fields: ${totalFields}`);
}
