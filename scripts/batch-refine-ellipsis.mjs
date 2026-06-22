#!/usr/bin/env node
/**
 * batch-refine-ellipsis.mjs
 *
 * Full pipeline for ellipsis-style BMs:
 * 1. Find source DOC/DOCX
 * 2. Convert DOC → DOCX via LibreOffice
 * 3. Normalize typography (Times New Roman 13pt)
 * 4. Replace ellipsis with {{semanticFieldName}} placeholders
 * 5. Save normalized DOCX
 * 6. Generate profile JSON
 * 7. Run smoke test (compile + render)
 *
 * Usage:
 *   node scripts/batch-refine-ellipsis.mjs BM-021
 *   node scripts/batch-refine-ellipsis.mjs BM-021 BM-022 BM-024
 *   node scripts/batch-refine-ellipsis.mjs --all-ellipsis
 *   node scripts/batch-refine-ellipsis.mjs --dry-run --all-ellipsis
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PROFILES_DIR = path.join(REPO_ROOT, "scripts", "form-refinement", "profiles");
const DOCX_OUT_DIR = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");

// Vietnamese diacritics stripper
const DIACRITICS_MAP = {
  à: "a", á: "a", ả: "a", ã: "a", ạ: "a", ă: "a", ằ: "a", ắ: "a", ẳ: "a", ẵ: "a", ặ: "a",
  â: "a", ầ: "a", ấ: "a", ậ: "a", ẫ: "a", ẩ: "a",
  đ: "d",
  è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e", ê: "e", ề: "e", ế: "e", ệ: "e", ễ: "e", ể: "e",
  ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
  ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o", ô: "o", ồ: "o", ố: "o", ổ: "o", ỗ: "o", ộ: "o",
  ơ: "o", ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o",
  ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u", ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u",
  ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y",
};

const DIACRITICS_REGEX = new RegExp(`[${Object.keys(DIACRITICS_MAP).join("")}]`, "g");

function stripDiacritics(text) {
  return String(text).replace(DIACRITICS_REGEX, (ch) => DIACRITICS_MAP[ch] ?? ch);
}

const SOFFICE =
  process.env.LIBREOFFICE_PATH ??
  (fs.existsSync("C:\\Program Files\\LibreOffice\\program\\soffice.exe")
    ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe"
    : fs.existsSync("C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe")
    ? "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
    : null);

if (!SOFFICE) {
  console.error("ERROR: LibreOffice soffice.exe not found.");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function stripXmlTags(xml) {
  return xml
    .replace(/<[^>]+>/gu, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function runPropSetRunProperties(runProperties, tagName, replacement) {
  const pattern = new RegExp(
    `<w:${tagName}\\b[^>]*(?:\\/>|>[\\s\\S]*?<\\/w:${tagName}>)`,
    "u"
  );
  if (pattern.test(runProperties)) {
    return runProperties.replace(pattern, replacement);
  }
  return runProperties.replace("</w:rPr>", `${replacement}</w:rPr>`);
}

function normalizeRunProperties(runProperties, options) {
  let n = runPropSetRunProperties(
    runProperties, "rFonts",
    `<w:rFonts w:ascii="${options.fontFamily}" w:eastAsia="${options.fontFamily}" w:hAnsi="${options.fontFamily}" w:cs="${options.fontFamily}"/>`
  );
  n = runPropSetRunProperties(n, "sz", `<w:sz w:val="${options.fontSizeHalfPoints}"/>`);
  n = runPropSetRunProperties(n, "szCs", `<w:szCs w:val="${options.fontSizeHalfPoints}"/>`);
  return n;
}

function normalizeContainerRunProperties(container, options) {
  const RUN_PROPERTIES_PATTERN = /<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/u;
  if (RUN_PROPERTIES_PATTERN.test(container)) {
    return container.replace(RUN_PROPERTIES_PATTERN, (rp) => normalizeRunProperties(rp, options));
  }
  const idx = container.lastIndexOf("</w:");
  if (idx < 0) return container;
  return `${container.slice(0, idx)}<w:rPr></w:rPr>${container.slice(idx)}`;
}

function normalizeStylesXml(stylesXml, options) {
  const normalStylePattern = /<w:style\b(?=[^>]*w:styleId="Normal")[^>]*>[\s\S]*?<\/w:style>/u;
  if (!normalStylePattern.test(stylesXml)) {
    throw new Error("DOCX styles.xml does not contain the Normal paragraph style.");
  }
  let normalized = stylesXml.replace(normalStylePattern, (ns) =>
    normalizeContainerRunProperties(ns, options)
  );
  const runDefaultPattern = /<w:rPrDefault\b[^>]*>[\s\S]*?<\/w:rPrDefault>/u;
  if (runDefaultPattern.test(normalized)) {
    normalized = normalized.replace(runDefaultPattern, (rd) =>
      normalizeContainerRunProperties(rd, options)
    );
  }
  return normalized;
}

// ─── Ellipsis → mustache replacement ────────────────────────────────────────

function replaceEllipsisWithMustache(documentXml, fieldPath) {
  // Replace run text content that contains only ellipsis characters
  // Pattern: a <w:t>...</w:t> where content is purely ellipsis (dots, unicode ellipsis, underscores)

  // Strategy: find <w:t> tags with purely-ellipsis content, replace content with {{path}}
  // Also handle runs where ellipsis is mixed with other text (split the run)

  const tPattern = /<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/gu;

  return documentXml.replace(tPattern, (match, attrs, content) => {
    const trimmed = content.trim();

    // Check if content is purely ellipsis: 3+ dots, 1+ unicode ellipsis, 3+ underscores, or mix
    if (/^[…\.\_]{3,}$/.test(trimmed)) {
      return `<w:t${attrs}>{{${fieldPath}}}</w:t>`;
    }

    // Mixed content: ellipsis mixed with other text
    // Replace the ellipsis part with {{path}}
    if (/[…\.\_]{3,}/.test(trimmed)) {
      // Replace sequences of 3+ ellipsis chars with {{path}}
      const replaced = trimmed.replace(/[…\.\_]{3,}/g, `{{${fieldPath}}}`);
      return `<w:t${attrs}>${replaced}</w:t>`;
    }

    return match;
  });
}

function replaceEllipsisInXml(documentXml, fieldMappings) {
  // fieldMappings: [{path, blockId}] or just paths in order
  let fieldIndex = 0;

  // Pass 1: Replace pure-ellipsis runs entirely
  const tPattern = /<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/gu;
  let result = documentXml.replace(tPattern, (match, attrs, content) => {
    const trimmed = content.trim();
    if (!/^[…\.\_]+$/.test(trimmed)) return match;

    const mapping = fieldMappings[fieldIndex++];
    const path = mapping?.path ?? `document.field${fieldIndex}`;
    return `<w:t${attrs}>{{${path}}}</w:t>`;
  });

  // Pass 2: Replace ellipsis within mixed-content runs (one mustache per ellipsis span)
  result = result.replace(tPattern, (match, attrs, content) => {
    if (!/[…\.\_]{3,}/.test(content)) return match;
    // Replace each ellipsis span with its own mustache
    return content.replace(/[…\.\_]{3,}/g, () => {
      const mapping = fieldMappings[fieldIndex++];
      const path = mapping?.path ?? `document.field${fieldIndex}`;
      return `{{${path}}}`;
    }).replace(/^/, `<w:t${attrs}>`).replace(/$/, `</w:t>`);
  });

  return result;
}

// ─── DOCX normalization + ellipsis replacement ────────────────────────────────

function normalizeDocxWithEllipsis(docxBuffer, fieldMappings) {
  const zip = new PizZip(docxBuffer);

  // Normalize styles
  const stylesPart = zip.file("word/styles.xml");
  if (stylesPart) {
    zip.file("word/styles.xml", normalizeStylesXml(stylesPart.asText(), {
      fontFamily: "Times New Roman",
      fontSizeHalfPoints: 26,
    }));
  }

  // Replace ellipsis in document.xml
  const documentPart = zip.file("word/document.xml");
  if (documentPart) {
    let docXml = documentPart.asText();
    docXml = replaceEllipsisInXml(docXml, fieldMappings);
    zip.file("word/document.xml", docXml);
  }

  return zip.generate({ type: "nodebuffer" });
}

// ─── Source file finding ────────────────────────────────────────────────────

function findSourceFile(code) {
  const bmNum = parseInt(code.replace("BM-", ""), 10);
  const padded = String(bmNum).padStart(2, "0");

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
          if (fileLower.startsWith(padded + "-") || fileLower.startsWith(padded + ".")) {
            return { path: path.join(subDir, file), ext };
          }
        }
      } catch { /* skip */ }
    }
  }
  return null;
}

// ─── LibreOffice conversion ─────────────────────────────────────────────────

function convertWithLibreOffice(sourcePath, code) {
  const outDir = path.join(DOCX_OUT_DIR, code);
  fs.mkdirSync(outDir, { recursive: true });

  // Remove pre-existing normalized file so it doesn't interfere
  const existingNorm = path.join(outDir, `${code}_normalized.docx`);
  if (fs.existsSync(existingNorm)) fs.unlinkSync(existingNorm);

  try {
    execSync(
      `"${SOFFICE}" --headless --convert-to docx --outdir "${outDir}" "${sourcePath}"`,
      { cwd: outDir, stdio: ["pipe", "pipe", "pipe"], timeout: 120000, env: { ...process.env, HOME: process.env.TEMP ?? "/tmp" } }
    );
  } catch {
    // LibreOffice may still produce output even on error
  }

  // Find the output DOCX — pick the freshest one by timestamp
  const files = fs.readdirSync(outDir)
    .filter((f) => f.endsWith(".docx"))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(outDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) return null;
  return path.join(outDir, files[0].name);
}

// ─── Profile parsing ───────────────────────────────────────────────────────

function loadProfile(code) {
  const profilePath = path.join(PROFILES_DIR, `${code}.json`);
  if (!fs.existsSync(profilePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(profilePath, "utf8"));
  } catch {
    return null;
  }
}

// ─── Ellipsis extraction from converted DOCX ───────────────────────────────

function extractEllipsisFromDocx(docxBufferOrPath) {
  let docXml;
  if (Buffer.isBuffer(docxBufferOrPath)) {
    const zip = new PizZip(docxBufferOrPath);
    docXml = zip.file("word/document.xml")?.asText() ?? "";
  } else {
    const zip = new PizZip(fs.readFileSync(docxBufferOrPath));
    docXml = zip.file("word/document.xml")?.asText() ?? "";
  }

  const positions = [];

  // Helper: count ellipsis spans in a paragraph XML string
  function processParaPara(rawPara, paraIndex) {
    const text = stripXmlTags(rawPara).replace(/\s+/g, " ").trim();
    if (!/[…._]{3,}/.test(text)) return;
    const blockId = `P${String(paraIndex).padStart(4, "0")}`;
    const tRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu;
    let tMatch;
    while ((tMatch = tRe.exec(rawPara)) !== null) {
      const runText = tMatch[1];
      const ellipsisRe = /[…\.\_]{3,}/g;
      let eMatch;
      while ((eMatch = ellipsisRe.exec(runText)) !== null) {
        positions.push({ blockId, runText: eMatch[0], paraText: text, path: null });
      }
    }
  }

  // Process regular paragraphs
  const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu;
  let paraIndex = 0;
  let m;
  while ((m = paraRe.exec(docXml)) !== null) {
    paraIndex++;
    processParaPara(m[0], paraIndex);
  }

  // Process text box paragraphs (inside <wps:txbx>)
  const txbxRe = /<wps:txbx>([\s\S]*?)<\/wps:txbx>/gu;
  let tx;
  while ((tx = txbxRe.exec(docXml)) !== null) {
    const txbxContent = tx[1];
    const txbxParaRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu;
    let tp;
    while ((tp = txbxParaRe.exec(txbxContent)) !== null) {
      paraIndex++;
      processParaPara(tp[0], paraIndex);
    }
  }

  // Count total ellipsis spans (pure runs + mixed spans) for authoritative field count
  const allRuns = [...docXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu)];
  const totalMustacheCount = allRuns.reduce((count, run) => {
    const content = run[1];
    const trimmed = content.trim();
    if (/^[…\.\_]+$/.test(trimmed)) return count + 1;
    const spans = (content.match(/[…\.\_]{3,}/g) ?? []).length;
    return count + spans;
  }, 0);

  return { positions, totalMustacheCount };
}

// ─── Profile building ──────────────────────────────────────────────────────

function buildProfile(code, docxBuffer, formInputs) {
  // extractEllipsisFromDocx finds pure-ellipsis runs; pass 2 of normalizeDocxWithEllipsis
  // also creates mustaches for mixed-content runs, so count from the buffer too.
  const { positions, totalMustacheCount } = extractEllipsisFromDocx(docxBuffer);
  if (positions.length === 0) return null;

  // Use totalMustacheCount (from buffer) as authoritative field count
  const fieldCount = totalMustacheCount;

  const FIELD_NAME_INFERENCE = [
    [/vien kiem sat\s*(cap\s*)?tren/i, "agency.parentNameUpper"],
    [/vien kiem sat\s*ban hang/i, "agency.nameUpper"],
    [/dia danh/i, "agency.issuePlace"],
    [/so\s*quyet\s*dinh/i, "document.documentCode"],
    [/ngay\s*ban\s*hanh/i, "document.issueDate"],
    [/dong\s*dia\s*danh/i, "document.issuePlaceAndDateLine"],
    [/ho\s*ten|nguoi\s*bi\s*a ?p ?ung/i, "recipients.personLine"],
    [/can\s*cu\s*bo\s*luat/i, "legalBasis.procedureArticlesLine"],
    [/tom\s*tat/i, "decision.summaryLine"],
    [/noi\s*dung\s*quyet\s*dinh|ly\s*do/i, "decision.decisionLine"],
    [/co\s*quan\s*thi\s*hanh/i, "recipients.executionAgencyLine"],
    [/luu\s*ho\s*so|noi\s*nhan/i, "recipients.archiveLine"],
    [/che\s*do\s*ky/i, "signature.signMode"],
    [/chuc\s*danh/i, "signature.positionTitle"],
    [/nguoi\s*ky|ky\s*ten/i, "signature.signerName"],
  ];

  const NAMESPACE_INFERENCE = [
    [/vien kiem sat|co quan|cap tren/i, "agency"],
    [/so quyet dinh|ngay thang|mau so|van ban|thong tu/i, "document"],
    [/vu an|toi pham|nguon tin|hanh vi|khoi to/i, "case"],
    [/ho ten|ngay sinh|cmnd|cccd|noi o/i, "person"],
    [/can cu phap luat|dieu|khoan/i, "legalBasis"],
    [/quyet dinh|tom tat|noi dung|ly do/i, "decision"],
    [/co quan thi hanh|noi nhan|luu ho so|nguoi nhan/i, "recipients"],
    [/ky|chuc danh|chu ky/i, "signature"],
  ];

  const SAMPLE_VALUES = {
    agency: { parentNameUpper: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", nameUpper: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7", issuePlace: "TP. Hồ Chí Minh" },
    document: { documentCode: "01/QĐ-VKS", issueDate: "15/01/2025", issuePlaceAndDateLine: "TP. Hà Nội, ngày 15 tháng 01 năm 2025" },
    person: { fullName: "Nguyễn Văn Minh" },
    legalBasis: { procedureArticlesLine: "Căn cứ các điều 36, 39 và 148 của Bộ luật Tố tụng hình sự;" },
    decision: { summaryLine: "Căn cứ vào các tình tiết có thật theo quy định pháp luật.", decisionLine: "Quyết định không khởi tố vụ án hình sự." },
    recipients: { executionAgencyLine: "Cơ quan Công an TP. Hà Nội", personLine: "Nguyễn Văn Minh", archiveLine: "Lưu HSVV, HSKS, VP." },
    signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "Trần Thị Lan" },
  };

  function inferFieldPath(ctx) {
    for (const [re, p] of FIELD_NAME_INFERENCE) {
      if (re.test(ctx)) return p;
    }
    return null;
  }

  function inferNamespace(ctx) {
    for (const [re, ns] of NAMESPACE_INFERENCE) {
      if (re.test(ctx)) return ns;
    }
    return "document";
  }

  function getSample(path) {
    const ns = path.split(".")[0];
    const field = path.split(".")[1];
    const nsSamples = SAMPLE_VALUES[ns];
    if (nsSamples && field in nsSamples) return nsSamples[field];
    if (path.includes("Name")) return "Nguyễn Văn Minh";
    if (path.includes("Date") || path.includes("date")) return "15/01/2025";
    if (path.includes("Code")) return "01/QĐ-VKS";
    if (path.includes("Agency")) return "Viện kiểm sát nhân dân TP. Hà Nội";
    if (path.includes("Content") || path.includes("reason")) return "Căn cứ vào các tình tiết có thật";
    if (path.includes("signature")) return "Trần Thị Lan";
    return "Giá trị mẫu";
  }

  // Build field mappings
  const fieldMappings = [];
  const fields = [];

  for (let i = 0; i < fieldCount; i++) {
    const pos = positions[i];
    // Use full paragraph text (strip diacritics) for matching
    // When pos is undefined (pass-2 positions), fall back to generic context
    const ctx = stripDiacritics((pos?.paraText || pos?.runText || "")).toLowerCase();

    // Try form inputs mapping
    let fieldPath = null;
    let label = "Ô trống";
    let uiComponent = "text";
    let required = false;

    if (formInputs) {
      for (const fi of formInputs.fields) {
        const fiLabelNorm = stripDiacritics(fi.label).toLowerCase();
        // Match by any keyword from the label (3+ chars)
        const keywords = fiLabelNorm.split(/\s+/).filter(Boolean).filter(w => w.length > 2);
        if (keywords.some(w => ctx.includes(w))) {
          const sectionMap = { agency: "agency", document: "document", person: "person", legalBasis: "legalBasis", decision: "decision", recipients: "recipients", signature: "signature" };
          const ns = sectionMap[fi.section] ?? "document";
          fieldPath = `${ns}.${fi.name}`;
          label = fi.label;
          uiComponent = fi.component === "BmFieldDate" ? "date" : fi.component === "BmFieldTextarea" ? "textarea" : "text";
          required = fi.required;
          break;
        }
      }
    }

    // Fall back to inference
    if (!fieldPath) {
      const inferred = inferFieldPath(ctx);
      if (inferred) {
        fieldPath = inferred;
        label = inferLabelFromPath(inferred);
      } else {
        const ns = inferNamespace(ctx);
        fieldPath = `${ns}.field${i + 1}`;
        label = inferLabelFromContext(ctx);
      }
    }

    if (fieldPath.includes("Date") || fieldPath.includes("date")) uiComponent = "date";
    if (fieldPath.includes("signature") || ctx.includes("ky")) uiComponent = "text";

    fieldMappings.push({ path: fieldPath });
    fields.push({
      path: fieldPath,
      label,
      uiComponent,
      required,
      sample: getSample(fieldPath),
      blockId: pos?.blockId ?? `P${String(i).padStart(4, "0")}`,
      slotType: uiComponent === "date" ? "date" : "text",
      confidence: formInputs ? 0.8 : 0.4,
      reviewRequired: true,
    });
  }

  return {
    templateCode: code,
    source: "docx-ellipsis-pipeline",
    fieldCount: fields.length,
    formInputFields: formInputs ? formInputs.fields.length : 0,
    fields,
  };
}

function inferLabelFromPath(p) {
  const map = {
    "agency.parentNameUpper": "Cơ quan cấp trên",
    "agency.nameUpper": "Viện kiểm sát ban hành",
    "agency.issuePlace": "Địa danh",
    "document.documentCode": "Số quyết định",
    "document.issueDate": "Ngày ban hành",
    "document.issuePlaceAndDateLine": "Dòng địa danh, ngày tháng",
    "person.fullName": "Họ tên",
    "recipients.personLine": "Người bị áp dụng",
    "recipients.executionAgencyLine": "Cơ quan thi hành",
    "recipients.archiveLine": "Dòng lưu hồ sơ",
    "legalBasis.procedureArticlesLine": "Căn cứ Bộ luật Tố tụng hình sự",
    "decision.summaryLine": "Tóm tắt hồ sơ",
    "decision.decisionLine": "Nội dung quyết định",
    "signature.signMode": "Chế độ ký",
    "signature.positionTitle": "Chức danh",
    "signature.signerName": "Người ký",
  };
  return map[p] ?? p;
}

function inferLabelFromContext(ctx) {
  if (/viện kiểm sát|cơ quan ban hành/i.test(ctx)) return "Tên cơ quan";
  if (/số quyết định|số văn bản/i.test(ctx)) return "Số quyết định";
  if (/ngày|tháng|năm/i.test(ctx)) return "Ngày tháng năm";
  if (/họ tên/i.test(ctx)) return "Họ tên";
  if (/địa chỉ|địa danh/i.test(ctx)) return "Địa danh";
  if (/căn cứ/i.test(ctx)) return "Căn cứ pháp lý";
  if (/nội dung|lý do/i.test(ctx)) return "Nội dung quyết định";
  if (/ký|chữ ký/i.test(ctx)) return "Chữ ký";
  if (/lưu hồ sơ|nơi nhận/i.test(ctx)) return "Nơi nhận";
  return "Ô trống";
}

// ─── Form inputs parsing ────────────────────────────────────────────────────

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

    let closeIdx = -1;
    let inQuote = false;
    let quoteChar = "";
    for (let i = idx + 1; i < content.length; i++) {
      const ch = content[i];
      if (!inQuote && (ch === '"' || ch === "'")) { inQuote = true; quoteChar = ch; }
      else if (inQuote && ch === quoteChar) { inQuote = false; quoteChar = ""; }
      else if (!inQuote && ch === ">") { closeIdx = i; break; }
    }
    if (closeIdx < 0) break;

    const tagContent = content.slice(idx + 1, closeIdx);
    const labelMatch = tagContent.match(/label=["']([^"']+)["']/);
    const labelTemplateMatch = tagContent.match(/label=\{\`([^`]+)\`\}/);
    const label = labelMatch ? labelMatch[1] : labelTemplateMatch ? labelTemplateMatch[1] : null;
    const compMatch = tagContent.match(/^(\w+)/);
    const component = compMatch ? compMatch[1] : "BmFieldText";
    const standaloneRequired = /\brequired\b/.test(tagContent) && !/\brequired\s*=\s*\{false\}/.test(tagContent);
    const requiredMatch = tagContent.match(/\brequired\s*=\s*\{(true|false)\}/);
    const required = requiredMatch ? requiredMatch[1] === "true" : standaloneRequired;

    const afterTag = content.slice(closeIdx + 1, Math.min(content.length, closeIdx + 601));
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
      });
    }

    pos = closeIdx + 1;
  }

  return { fields };
}

// ─── Smoke test ────────────────────────────────────────────────────────────

function runSmokeTest(code, docxPath) {
  try {
    // 1. Verify it can be opened as ZIP
    const zip = new PizZip(fs.readFileSync(docxPath));

    // 2. Verify document.xml exists and has mustache placeholders
    const docXml = zip.file("word/document.xml")?.asText() ?? "";
    const mustacheCount = (docXml.match(/\{\{[^}]+\}\}/g) ?? []).length;

    // 3. Verify it has no unresolved ellipsis
    const ellipsisCount = (docXml.match(/[…._]{3,}/g) ?? []).length;

    // 4. (docxtemplater smoke test skipped — run separately)
    return {
      ok: mustacheCount > 0 && ellipsisCount === 0,
      mustacheCount,
      ellipsisCount,
      hasDocumentXml: !!zip.file("word/document.xml"),
      hasStyles: !!zip.file("word/styles.xml"),
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2).filter(Boolean);
const dryRun = args.includes("--dry-run") || args.includes("-n");
const allFlag = args.includes("--all-ellipsis");
const codes = args.filter((a) => /^BM-\d{3}$/i.test(a)).map((c) => c.toUpperCase());

if (!allFlag && codes.length === 0) {
  console.error("Usage:");
  console.error("  node scripts/batch-refine-ellipsis.mjs BM-021 BM-022");
  console.error("  node scripts/batch-refine-ellipsis.mjs --all-ellipsis");
  console.error("  node scripts/batch-refine-ellipsis.mjs --dry-run --all-ellipsis");
  process.exit(1);
}

console.log(`\nEllipsis BM Refinement Pipeline`);
console.log(`LibreOffice: ${SOFFICE}`);
console.log(`Output dir: ${DOCX_OUT_DIR}`);
console.log(`Profiles dir: ${PROFILES_DIR}`);
console.log(`Dry run: ${dryRun}\n`);

// If --all-ellipsis, scan for all ellipsis BMs
let targetCodes = codes;
if (allFlag) {
  targetCodes = [];
  for (let i = 1; i <= 213; i++) {
    const code = `BM-${String(i).padStart(3, "0")}`;
    const normPath = path.join(DOCX_OUT_DIR, code, `${code}_normalized.docx`);
    if (!fs.existsSync(normPath)) continue;
    try {
      const zip = new PizZip(fs.readFileSync(normPath));
      const docXml = zip.file("word/document.xml")?.asText() ?? "";
      const hasMustache = /\{\{[^}]+\}\}/.test(docXml);
      const hasEllipsis = /[…._]{3,}/.test(docXml);
      if (hasEllipsis && !hasMustache) targetCodes.push(code);
    } catch { /* skip */ }
  }
  console.log(`Found ${targetCodes.length} ellipsis BMs to process\n`);
}

const results = [];
for (const code of targetCodes) {
  process.stdout.write(`\n${code}... `);

  // 1. Find source file
  const sourceInfo = findSourceFile(code);
  if (!sourceInfo) {
    console.log("SOURCE_NOT_FOUND");
    results.push({ code, status: "SOURCE_NOT_FOUND" });
    continue;
  }

  // 2. Convert DOC → DOCX if needed
  const needsConversion = sourceInfo.ext !== ".docx";
  let docxBuffer = needsConversion ? null : fs.readFileSync(sourceInfo.path);
  if (needsConversion) {
    process.stdout.write("(LO-convert) ");
    // Delete pre-existing normalized file to avoid interference
    const outDir = path.join(DOCX_OUT_DIR, code);
    const existingNorm = path.join(outDir, `${code}_normalized.docx`);
    if (fs.existsSync(existingNorm)) fs.unlinkSync(existingNorm);
    const converted = convertWithLibreOffice(sourceInfo.path, code);
    if (!converted) {
      console.log("CONVERSION_FAILED");
      results.push({ code, status: "CONVERSION_FAILED" });
      continue;
    }
    docxBuffer = fs.readFileSync(converted);
  }

  // 3. Build profile from the freshly converted DOCX buffer (never from disk path)
  const formInputs = parseFormInputs(code);
  const profile = buildProfile(code, docxBuffer, formInputs);
  if (!profile) {
    console.log("NO_ELLIPSIS_FOUND");
    results.push({ code, status: "NO_ELLIPSIS_FOUND" });
    continue;
  }

  // 4. Normalize + replace ellipsis
  if (!dryRun) {
    process.stdout.write("(normalize) ");
    try {
      // fieldMappings: array of field objects from profile.fields
      const fieldMappings = Array.isArray(profile.fields)
        ? profile.fields
        : Object.values(profile.fields);
      const normalizedBuffer = normalizeDocxWithEllipsis(docxBuffer, fieldMappings);

      // Fix profile field ORDER to match mustache order in the normalized DOCX
      const normZip = new PizZip(normalizedBuffer);
      const normDocXml = normZip.file("word/document.xml")?.asText() ?? "";
      const orderedPaths = [...normDocXml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim());
      const profileFields = Object.values(profile.fields);
      const orderedFields = orderedPaths.map((p) => profileFields.find((f) => f.path === p)).filter(Boolean);
      profile.fields = Object.fromEntries(orderedFields.map((f) => [f.path, f]));

      const outDir = path.join(DOCX_OUT_DIR, code);
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `${code}_normalized.docx`);
      fs.writeFileSync(outPath, normalizedBuffer);

      // 5. Write profile — already a dict at this point
      const profilePath = path.join(PROFILES_DIR, `${code}.json`);
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));

      // 6. Verify
      const zip = new PizZip(normalizedBuffer);
      const docXml = zip.file("word/document.xml")?.asText() ?? "";
      const mustacheCount = (docXml.match(/\{\{[^}]+\}\}/g) ?? []).length;
      const ellipsisCount = (docXml.match(/[…._]{3,}/g) ?? []).length;

      console.log(
        `OK(${mustacheCount} mustache, ${ellipsisCount} ellipsis residual) → ${code}_normalized.docx`
      );
      results.push({
        code,
        status: ellipsisCount === 0 ? "DONE" : "PARTIAL_ELLIPSIS",
        mustacheCount,
        ellipsisCount,
        normalizedPath: outPath,
      });
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      results.push({ code, status: "ERROR", error: String(e) });
    }
  } else {
    console.log(`DRY-RUN (${profile.fieldCount} fields, ${sourceInfo.ext})`);
    results.push({ code, status: "DRY-RUN", fields: profile.fieldCount });
  }
}

// Summary
const done = results.filter(r => r.status === "DONE" || r.status === "DRY-RUN").length;
const partial = results.filter(r => r.status === "PARTIAL_ELLIPSIS").length;
const failed = results.filter(r => ["SOURCE_NOT_FOUND","CONVERSION_FAILED","NO_ELLIPSIS_FOUND","ERROR"].includes(r.status)).length;

console.log(`\n\nSummary: ${done} done, ${partial} partial, ${failed} failed / ${targetCodes.length} total`);
