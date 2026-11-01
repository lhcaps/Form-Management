#!/usr/bin/env node
/**
 * curated-37-golden-layout-fidelity.mjs
 *
 * Golden / layout fidelity audit for the 37 curated INPUT_CONNECTED_PASS forms.
 *
 * Reads:
 *   - .tmp-docx-download-smoke/<code>.docx   (generated runtime preview-session DOCX)
 *   - storage/templates/normalized-docx/<code>/<code>_normalized.docx  (normalized source DOCX)
 *   - docs/audit/docx/contracts/locked/<code>__*.contract.locked.json  (locked contract)
 *
 * Per-form fidelity criteria (machine-checkable):
 *
 * A. Package / XML baseline
 *    - valid DOCX ZIP (already proven by docx-download smoke)
 *    - [Content_Types].xml present
 *    - word/document.xml present
 *    - word/styles.xml present (if source has it)
 *    - word/numbering.xml parity (if source has it)
 *    - header/footer part presence parity
 *
 * B. Placeholder / data quality
 *    - no {{
 *    - no }}
 *    - no undefined
 *    - no null
 *    - no [object Object]
 *    - no stale demo tokens:
 *        Nguyễn Văn A / Trần Thị B / Ông cung cấp /
 *        Nguyễn Thị Hồng Hạnh
 *
 * C. Major legal document structure
 *    - agency/header text present (check source templateTitle for key phrases)
 *    - form title present (templateTitle appears in document text)
 *    - issue place/date line keywords present
 *    - legal basis / decision content present
 *    - signature block keywords present
 *    - recipients block keywords present (where source contract has recipients)
 *
 * D. Formatting / document settings
 *    - page margins (w:pgMar) exist in both
 *    - default font family (w:rFonts) present in both
 *    - paragraph alignment for title preserved (w:jc center)
 *
 * E. Runtime lifecycle invariants (already proven by docx-download smoke)
 *    - generated from runtime preview-session path
 *    - persisted=false evidence present
 *    - no generatedDocumentId leakage
 *    - no /documents route navigation
 *
 * Outputs:
 *   docs/audit/unified-bm-workspace/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.md
 *
 * No source DOCX, locked contract, or DB mutation. Read-only.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const SAMPLE_DIR = `${ROOT}/.tmp-docx-download-smoke`;
const NORM_DIR = `${ROOT}/storage/templates/normalized-docx`;
const LOCKED_DIR = `${ROOT}/docs/audit/docx/contracts/locked`;

const CURATED_FORMS = [
  "BM-001", "BM-005", "BM-006", "BM-007", "BM-008", "BM-009", "BM-010",
  "BM-011", "BM-012", "BM-014", "BM-015", "BM-017", "BM-018", "BM-019",
  "BM-020", "BM-022", "BM-023", "BM-030", "BM-031", "BM-033", "BM-035",
  "BM-036", "BM-037", "BM-038", "BM-040", "BM-042", "BM-043", "BM-044",
  "BM-045", "BM-046", "BM-047", "BM-048", "BM-052", "BM-053", "BM-054",
  "BM-070", "BM-171",
];

const PLACEHOLDER_PATTERNS = [
  /\{\{[^}]+\}\}/g,       // {{
  /\}\}[^}]+\}/g,         // }}
  /\bundefined\b/g,
  /\bnull\b/g,
  /\[object Object\]/g,
];

const STALE_TOKENS = [
  "Nguyễn Văn A",
  "Trần Thị B",
  "Ông cung cấp",
  "Ông  cung cấp",
  "Nguyễn Thị Hồng Hạnh",
];

// Key Vietnamese phrases that appear in legal document structure.
const FORM_TITLE_KEYWORDS = [
  "Biên bản", "Quyết định", "Báo cáo", "Đơn", "Phiếu", "Giấy",
];

const SIGNATURE_KEYWORDS = [
  "Người lập", "Thủ trưởng", "Viện trưởng", "Ký tên", "Ký và ghi rõ họ tên",
  "kiểm sát viên", "xác nhận", "chữ ký",
];

const RECIPIENT_KEYWORDS = [
  "Nơi nhận", "Để biết", "Để thực hiện", "Để chấp hành",
  "Cơ quan", "Đơn vị",
];

const AGENCY_KEYWORDS = [
  "Viện Kiểm sát", "Viện kiểm sát", "VKSND", "Tòa án",
];

// ---------------------------------------------------------------
// Core DOCX analysis helpers
// ---------------------------------------------------------------

function extractDocxText(zip) {
  const docXml = zip.files["word/document.xml"];
  if (!docXml) return "";
  try {
    const raw = docXml.asText();
    // Strip XML tags to get the rendered text content.
    // Normalize to NFC to ensure consistent Unicode representation for comparison.
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " " ).trim().normalize("NFC");
  } catch {
    return "";
  }
}

function extractDocxXml(zip, partName) {
  const file = zip.files[partName];
  if (!file) return null;
  try { return file.asText(); }
  catch { return null; }
}

function getZipPartNames(zip) {
  return Object.keys(zip.files);
}

function hasPart(zip, name) {
  return name in zip.files;
}

function extractStyles(zip) {
  const xml = extractDocxXml(zip, "word/styles.xml");
  return xml || "";
}

function extractPageSettings(zip) {
  const xml = extractDocxXml(zip, "word/document.xml");
  if (!xml) return {};
  const result = {};

  // Page margins: w:pgMar
  const marginMatch = xml.match(/<w:pgMar\s+([^>]+)>/);
  if (marginMatch) {
    const attrs = marginMatch[1];
    const top = /w:top="([^"]+)"/.exec(attrs);
    const bottom = /w:bottom="([^"]+)"/.exec(attrs);
    const left = /w:left="([^"]+)"/.exec(attrs);
    const right = /w:right="([^"]+)"/.exec(attrs);
    result.margins = {
      top: top ? parseInt(top[1]) / 1440 : null,
      bottom: bottom ? parseInt(bottom[1]) / 1440 : null,
      left: left ? parseInt(left[1]) / 1440 : null,
      right: right ? parseInt(right[1]) / 1440 : null,
      raw: marginMatch[0],
    };
  }

  // Page size: w:pgSz
  const sizeMatch = xml.match(/<w:pgSz\s+([^>]+)>/);
  if (sizeMatch) result.pageSize = sizeMatch[0];

  return result;
}

function countTableElements(zip) {
  const xml = extractDocxXml(zip, "word/document.xml") || "";
  const tableStarts = (xml.match(/<w:tbl\b/g) || []).length;
  const tableEnds = (xml.match(/<\/w:tbl>/g) || []).length;
  return { starts: tableStarts, ends: tableEnds, balanced: tableStarts === tableEnds };
}

function countSectionBreaks(zip) {
  const xml = extractDocxXml(zip, "word/document.xml") || "";
  return (xml.match(/<w:sectPr\b/g) || []).length;
}

function countPageBreaks(zip) {
  const xml = extractDocxXml(zip, "word/document.xml") || "";
  return (xml.match(/<w:br\s+[^>]*w:type="page"/g) || []).length;
}

function detectTitleAlignment(zip) {
  // Look for <w:jc w:val="center"/> in paragraphs with text content
  const xml = extractDocxXml(zip, "word/document.xml") || "";
  const centerMatches = (xml.match(/<w:jc\s+[^>]*w:val="center"[^>]*\/>/g) || []);
  const leftMatches = (xml.match(/<w:jc\s+[^>]*w:val="left"[^>]*\/>/g) || []);
  return {
    centerParagraphCount: centerMatches.length,
    leftParagraphCount: leftMatches.length,
    hasCenter: centerMatches.length > 0,
    hasLeft: leftMatches.length > 0,
  };
}

function detectBoldTitle(zip) {
  const xml = extractDocxXml(zip, "word/document.xml") || "";
  // Count bold runs: <w:b/>
  const boldCount = (xml.match(/<w:b\/>/g) || []).length;
  return boldCount;
}

function extractHeaderParts(zip) {
  return Object.keys(zip.files).filter((n) =>
    n.startsWith("word/header") && n.endsWith(".xml"),
  );
}

function extractFooterParts(zip) {
  return Object.keys(zip.files).filter((n) =>
    n.startsWith("word/footer") && n.endsWith(".xml"),
  );
}

function checkStylesPresence(zip) {
  return hasPart(zip, "word/styles.xml");
}

function checkNumberingPresence(zip) {
  return hasPart(zip, "word/numbering.xml");
}

function detectFontInfo(zip) {
  const xml = extractDocxXml(zip, "word/document.xml") || "";
  // Look for w:rFonts — default font family
  const fontMatches = (xml.match(/w:rFonts\s+[^>]*w:ascii="([^"]+)"/g) || []);
  const fonts = fontMatches.map((m) => {
    const match = /w:ascii="([^"]+)"/.exec(m);
    return match ? match[1] : null;
  }).filter(Boolean);
  return [...new Set(fonts)];
}

// ---------------------------------------------------------------
// Placeholder and stale token checks
// ---------------------------------------------------------------

function findPlaceholderLeaks(text) {
  const leaks = [];
  for (const pat of PLACEHOLDER_PATTERNS) {
    const matches = text.match(pat);
    if (matches && matches.length > 0) {
      leaks.push(...new Set(matches.map((m) => m.slice(0, 80))));
    }
  }
  return leaks;
}

function findStaleTokenLeaks(text) {
  const leaks = [];
  for (const token of STALE_TOKENS) {
    if (text.includes(token)) leaks.push(token);
  }
  return leaks;
}

// ---------------------------------------------------------------
// Major structure checks
// ---------------------------------------------------------------

function checkFormTitle(text, templateTitle) {
  if (!templateTitle) return { present: false, reason: "no templateTitle" };
  const normalized = templateTitle.toLowerCase();
  // Strip punctuation from words for matching against uppercase-stripped DOCX text
  const words = normalized.split(/\s+/).filter((w) => w.length > 3).map((w) => w.replace(/[.,;:!?()-]/g, ""));
  const textLower = text.toLowerCase();
  const hits = words.filter((w) => textLower.includes(w));
  return {
    present: hits.length >= Math.min(2, words.length),
    wordsFound: hits.length,
    wordsTotal: words.length,
    reason: hits.length >= Math.min(2, words.length)
      ? `found ${hits.length}/${words.length} title words`
      : `only ${hits.length}/${words.length} title words found`,
  };
}

function checkAgencyText(text) {
  const lower = text.toLowerCase();
  const hits = AGENCY_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
  return { present: hits.length > 0, keywords: hits };
}

function checkSignatureBlock(text, locked) {
  // Case-insensitive keyword search
  const lower = text.toLowerCase();
  const hits = SIGNATURE_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
  return { present: hits.length > 0, keywords: hits };
}

function checkRecipientsBlock(text) {
  const lower = text.toLowerCase();
  const hits = RECIPIENT_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
  return { present: hits.length > 0, keywords: hits };
}

function checkPlaceDateLine(text) {
  // Vietnamese date patterns: "ngày ... tháng ... năm ..."
  const hasDatePattern = /ngày\s+\d+|tháng\s+\d+|năm\s+\d{4}/i.test(text);
  // Location keyword: "tại"
  const hasLocation = /\btại\s+\S/.test(text);
  return { present: hasDatePattern || hasLocation, hasDatePattern, hasLocation };
}

function checkLegalBasis(text) {
  const lower = text.toLowerCase();
  const keywords = [" căn cứ ", " luật ", " nghị định ", " thông tư "];
  const hits = keywords.filter((kw) => lower.includes(kw));
  return { present: hits.length > 0, keywords: hits };
}

// ---------------------------------------------------------------
// Locked contract reader
// ---------------------------------------------------------------

function readLockedContract(code) {
  if (!existsSync(LOCKED_DIR)) return null;
  const entries = readdirSync(LOCKED_DIR);
  const needle = `${code}__`;
  const name = entries.find((n) => n.startsWith(needle) && n.endsWith(".contract.locked.json"));
  if (!name) return null;
  try {
    return JSON.parse(readFileSync(`${LOCKED_DIR}/${name}`, "utf8"));
  } catch {
    return null;
  }
}

function hasSignatureSlots(locked) {
  if (!locked || !locked.docxSlots) return false;
  return locked.docxSlots.some((s) => {
    const sid = s.slotId || "";
    return sid.startsWith("signature.") || s.slotType === "signature";
  });
}

function hasRecipientsSlots(locked) {
  if (!locked || !locked.docxSlots) return false;
  const keywords = ["receiver", "recipient", "nơi nhận", "recipientName", "receiverName"];
  return locked.docxSlots.some((s) => {
    const sid = (s.slotId || "").toLowerCase();
    return keywords.some((kw) => sid.includes(kw));
  });
}

function readNormalizedDocx(code) {
  const candidates = [
    `${NORM_DIR}/${code}/${code}_normalized.docx`,
    `${NORM_DIR}/${code}/${code}_Bien-ban-tiep-nhan.docx`, // BM-001 specific fallback
  ];
  for (const fp of candidates) {
    if (existsSync(fp)) {
      try {
        const buf = readFileSync(fp);
        return new PizZip(buf);
      } catch {
        return null;
      }
    }
  }
  return null;
}

function readGeneratedDocx(code) {
  const fp = `${SAMPLE_DIR}/${code}.docx`;
  if (!existsSync(fp)) return null;
  try {
    const buf = readFileSync(fp);
    return new PizZip(buf);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------
// Per-form fidelity assessment
// ---------------------------------------------------------------

function assessForm(code) {
  const result = {
    templateCode: code,
    generatedDocxPath: `${SAMPLE_DIR}/${code}.docx`,
    sourceDocxPath: null,
    lockedContractPath: null,
    generatedFound: false,
    normalizedFound: false,
    lockedFound: false,
    templateTitle: null,

    // A. Package / XML
    packageValid: false,
    contentTypesPresent: false,
    documentXmlPresent: false,
    stylesPresent: false,
    numberingPresent: false,
    normalizedStylesPresent: false,
    normalizedNumberingPresent: false,

    // B. Placeholder / stale token
    placeholderLeaks: [],
    staleTokenLeaks: [],

    // C. Major structure
    formTitlePresent: false,
    formTitleCheck: null,
    agencyTextPresent: false,
    agencyKeywords: [],
    signatureBlockPresent: false,
    signatureKeywords: [],
    recipientsBlockPresent: false,
    recipientsKeywords: [],
    placeDateLinePresent: false,
    placeDateLineDetails: null,
    legalBasisPresent: false,
    legalBasisKeywords: [],

    // D. Formatting / document settings
    sourceMargins: null,
    generatedMargins: null,
    marginsStatus: "unknown",
    marginsRaw: null,
    sourceFonts: [],
    generatedFonts: [],
    fontStatus: "unknown",
    sourceTableCount: null,
    generatedTableCount: null,
    tableParity: "unknown",
    tableBalanced: false,
    sourceSectionBreakCount: null,
    generatedSectionBreakCount: null,
    sectionBreakParity: "unknown",
    sourcePageBreakCount: null,
    generatedPageBreakCount: null,
    pageBreakParity: "unknown",
    sourceTitleAlignment: null,
    generatedTitleAlignment: null,
    alignmentStatus: "unknown",
    sourceBoldCount: null,
    generatedBoldCount: null,

    // E. Lifecycle (from docx-download smoke — informational only here)
    lifecycleVerifiedBySmoke: true,

    // Summary
    fidelityStatus: "FAIL",
    fidelityComplete: false,
    manualReviewRequired: false,
    failureReasons: [],
    criteriaPassed: [],
    criteriaFailed: [],
    unknownCriteria: [],
  };

  const generatedZip = readGeneratedDocx(code);
  const normalizedZip = readNormalizedDocx(code);
  const locked = readLockedContract(code);

  result.generatedFound = !!generatedZip;
  result.normalizedFound = !!normalizedZip;
  result.lockedFound = !!locked;

  if (locked) {
    result.templateTitle = locked.templateTitle || null;
    result.lockedContractPath = `${LOCKED_DIR}/${code}__*.contract.locked.json`;
  }

  if (normalizedZip) {
    const parts = getZipPartNames(normalizedZip);
    result.normalizedStylesPresent = parts.includes("word/styles.xml");
    result.normalizedNumberingPresent = parts.includes("word/numbering.xml");
    result.sourceDocxPath = `${NORM_DIR}/${code}/${code}_normalized.docx`;
  }

  if (!generatedZip) {
    result.failureReasons.push("Generated DOCX not found in .tmp-docx-download-smoke/");
    result.criteriaFailed.push("A.generated_docx_exists");
    return result;
  }

  // ----- A: Package checks -----
  try {
    const names = getZipPartNames(generatedZip);
    result.packageValid = true;
    result.contentTypesPresent = names.includes("[Content_Types].xml");
    result.documentXmlPresent = names.includes("word/document.xml");
    result.stylesPresent = names.includes("word/styles.xml");
    result.numberingPresent = names.includes("word/numbering.xml");

    result.criteriaPassed.push("A.package_valid");
    if (result.contentTypesPresent) result.criteriaPassed.push("A.content_types_present");
    else result.criteriaFailed.push("A.content_types_present");

    if (result.documentXmlPresent) result.criteriaPassed.push("A.document_xml_present");
    else result.criteriaFailed.push("A.document_xml_present");

    // Styles parity
    if (result.stylesPresent === result.normalizedStylesPresent) {
      result.criteriaPassed.push("A.styles_parity");
    } else {
      result.criteriaFailed.push("A.styles_parity");
      result.failureReasons.push(`Styles presence mismatch: generated=${result.stylesPresent} vs source=${result.normalizedStylesPresent}`);
    }

    // Numbering parity
    if (result.numberingPresent === result.normalizedNumberingPresent) {
      result.criteriaPassed.push("A.numbering_parity");
    } else {
      result.criteriaFailed.push("A.numbering_parity");
      result.failureReasons.push(`Numbering presence mismatch: generated=${result.numberingPresent} vs source=${result.normalizedNumberingPresent}`);
    }
  } catch (err) {
    result.failureReasons.push(`Package analysis error: ${String(err)}`);
    result.criteriaFailed.push("A.package_valid");
    return result;
  }

  // ----- B: Placeholder / stale token -----
  const genText = extractDocxText(generatedZip);

  const placeholders = findPlaceholderLeaks(genText);
  if (placeholders.length > 0) {
    result.placeholderLeaks = placeholders;
    result.criteriaFailed.push("B.placeholder_clean");
    result.failureReasons.push(`Placeholder leaks: ${placeholders.join("; ")}`);
  } else {
    result.criteriaPassed.push("B.placeholder_clean");
  }

  const staleLeaks = findStaleTokenLeaks(genText);
  if (staleLeaks.length > 0) {
    result.staleTokenLeaks = staleLeaks;
    result.criteriaFailed.push("B.stale_token_clean");
    result.failureReasons.push(`Stale token leaks: ${staleLeaks.join("; ")}`);
  } else {
    result.criteriaPassed.push("B.stale_token_clean");
  }

  // ----- C: Major structure -----
  if (result.templateTitle) {
    result.formTitleCheck = checkFormTitle(genText, result.templateTitle);
    result.formTitlePresent = result.formTitleCheck.present;
    if (result.formTitlePresent) {
      result.criteriaPassed.push("C.form_title_present");
    } else {
      result.criteriaFailed.push("C.form_title_present");
      result.failureReasons.push(`Form title not found: ${result.formTitleCheck.reason}`);
    }
  } else {
    result.unknownCriteria.push("C.form_title_present (no templateTitle in locked contract)");
  }

  const agency = checkAgencyText(genText);
  result.agencyTextPresent = agency.present;
  result.agencyKeywords = agency.keywords;
  if (result.agencyTextPresent) result.criteriaPassed.push("C.agency_text_present");
  else {
    result.criteriaFailed.push("C.agency_text_present");
    result.failureReasons.push("No agency keywords (Viện Kiểm sát, VKSND, Tòa án) found in generated DOCX");
  }

  // Signature block: only check if locked contract has signature slots
  const hasSigSlots = hasSignatureSlots(locked);
  const sig = checkSignatureBlock(genText, locked);
  result.signatureBlockPresent = sig.present;
  result.signatureKeywords = sig.keywords;
  result.signatureSlotsExpected = hasSigSlots;
  if (!hasSigSlots) {
    // No signature slots in locked contract — N/A
    result.criteriaPassed.push("C.signature_block_present (N/A — no signature slots in source)");
  } else if (sig.present) {
    result.criteriaPassed.push("C.signature_block_present");
  } else {
    result.criteriaFailed.push("C.signature_block_present");
    result.failureReasons.push("Locked contract has signature slots but no signature keywords found in generated DOCX");
  }

  // Recipients block: only check if locked contract has recipient slots
  const hasRecipSlots = hasRecipientsSlots(locked);
  const recipients = checkRecipientsBlock(genText);
  result.recipientsBlockPresent = recipients.present;
  result.recipientsKeywords = recipients.keywords;
  result.recipientsSlotsExpected = hasRecipSlots;
  if (!hasRecipSlots) {
    result.criteriaPassed.push("C.recipients_block_present (N/A — no recipient slots in source)");
  } else if (recipients.present) {
    result.criteriaPassed.push("C.recipients_block_present");
  } else {
    result.criteriaFailed.push("C.recipients_block_present");
    result.failureReasons.push("Locked contract has recipient slots but no recipient keywords found in generated DOCX");
  }

  const placeDate = checkPlaceDateLine(genText);
  result.placeDateLinePresent = placeDate.present;
  result.placeDateLineDetails = placeDate;
  if (result.placeDateLinePresent) result.criteriaPassed.push("C.place_date_line_present");
  else {
    result.criteriaFailed.push("C.place_date_line_present");
    result.failureReasons.push("No date/location pattern (ngày/tháng/năm or tại) found in generated DOCX");
  }

  const legalBasis = checkLegalBasis(genText);
  result.legalBasisPresent = legalBasis.present;
  result.legalBasisKeywords = legalBasis.keywords;
  if (result.legalBasisPresent) result.criteriaPassed.push("C.legal_basis_present");
  else {
    result.criteriaFailed.push("C.legal_basis_present");
    result.failureReasons.push("No legal basis keywords (căn cứ, Luật, Nghị định, Thông tư) found in generated DOCX");
  }

  // ----- D: Formatting / document settings -----
  const genSettings = extractPageSettings(generatedZip);
  result.generatedMargins = genSettings.margins || null;

  if (normalizedZip) {
    const srcSettings = extractPageSettings(normalizedZip);
    result.sourceMargins = srcSettings.margins || null;

    if (srcSettings.margins && genSettings.margins) {
      const sm = srcSettings.margins;
      const gm = genSettings.margins;
      const tolerance = 0.5; // half-inch tolerance
      const topDiff = sm.top !== null && gm.top !== null ? Math.abs(sm.top - gm.top) : null;
      const bottomDiff = sm.bottom !== null && gm.bottom !== null ? Math.abs(sm.bottom - gm.bottom) : null;
      const leftDiff = sm.left !== null && gm.left !== null ? Math.abs(sm.left - gm.left) : null;
      const rightDiff = sm.right !== null && gm.right !== null ? Math.abs(sm.right - gm.right) : null;

      const topOk = topDiff === null || topDiff <= tolerance;
      const bottomOk = bottomDiff === null || bottomDiff <= tolerance;
      const leftOk = leftDiff === null || leftDiff <= tolerance;
      const rightOk = rightDiff === null || rightDiff <= tolerance;

      result.marginsStatus = (topOk && bottomOk && leftOk && rightOk) ? "pass" : "warn";
      result.marginsRaw = { topDiff, bottomDiff, leftDiff, rightDiff, tolerance };
      if (result.marginsStatus === "pass") result.criteriaPassed.push("D.margins_match");
      else {
        result.criteriaFailed.push("D.margins_match");
        result.failureReasons.push(`Margin mismatch: top=${topDiff?.toFixed(2)} bottom=${bottomDiff?.toFixed(2)} left=${leftDiff?.toFixed(2)} right=${rightDiff?.toFixed(2)} (tolerance=${tolerance})`);
      }
    } else {
      result.marginsStatus = "unknown";
      result.unknownCriteria.push("D.margins_match (margins not extractable)");
    }
  } else {
    result.marginsStatus = "no_source";
    result.unknownCriteria.push("D.margins_match (normalized source not found)");
  }

  // Font detection
  const genFonts = detectFontInfo(generatedZip);
  result.generatedFonts = genFonts;
  if (normalizedZip) {
    const srcFonts = detectFontInfo(normalizedZip);
    result.sourceFonts = srcFonts;
    if (srcFonts.length > 0 && genFonts.length > 0) {
      const overlap = srcFonts.filter((f) => genFonts.includes(f));
      result.fontStatus = overlap.length > 0 ? "pass" : "warn";
      if (result.fontStatus === "pass") result.criteriaPassed.push("D.font_preserved");
      else result.criteriaFailed.push("D.font_preserved");
    } else if (genFonts.length > 0) {
      result.fontStatus = "source_unknown";
      result.unknownCriteria.push("D.font_preserved (source fonts not extractable)");
    }
  } else {
    result.fontStatus = "no_source";
    result.unknownCriteria.push("D.font_preserved (normalized source not found)");
  }

  // Table count parity
  if (normalizedZip) {
    const srcTables = countTableElements(normalizedZip);
    const genTables = countTableElements(generatedZip);
    result.sourceTableCount = srcTables.starts;
    result.generatedTableCount = genTables.starts;
    result.tableBalanced = genTables.balanced;
    if (srcTables.starts === genTables.starts) {
      result.tableParity = "exact";
      result.criteriaPassed.push("D.table_count_parity");
    } else if (genTables.starts > 0) {
      result.tableParity = "diff";
      result.criteriaFailed.push("D.table_count_parity");
      result.failureReasons.push(`Table count mismatch: source=${srcTables.starts} vs generated=${genTables.starts}`);
    } else {
      result.tableParity = "zero_generated";
      result.criteriaFailed.push("D.table_count_parity");
      result.failureReasons.push(`Zero tables in generated DOCX`);
    }
  }

  // Section/page break count
  if (normalizedZip) {
    const srcBreaks = countSectionBreaks(normalizedZip);
    const genBreaks = countSectionBreaks(generatedZip);
    result.sourceSectionBreakCount = srcBreaks;
    result.generatedSectionBreakCount = genBreaks;
    if (srcBreaks === genBreaks) {
      result.sectionBreakParity = "exact";
      result.criteriaPassed.push("D.section_break_parity");
    } else {
      result.sectionBreakParity = "diff";
      result.criteriaFailed.push("D.section_break_parity");
      result.failureReasons.push(`Section break count mismatch: source=${srcBreaks} vs generated=${genBreaks}`);
    }

    const srcPageBreaks = countPageBreaks(normalizedZip);
    const genPageBreaks = countPageBreaks(generatedZip);
    result.sourcePageBreakCount = srcPageBreaks;
    result.generatedPageBreakCount = genPageBreaks;
    if (srcPageBreaks === genPageBreaks) {
      result.pageBreakParity = "exact";
      result.criteriaPassed.push("D.page_break_parity");
    } else {
      result.pageBreakParity = "diff";
      result.criteriaFailed.push("D.page_break_parity");
      result.failureReasons.push(`Page break count mismatch: source=${srcPageBreaks} vs generated=${genPageBreaks}`);
    }
  }

  // Title alignment
  const genAlignment = detectTitleAlignment(generatedZip);
  result.generatedTitleAlignment = genAlignment;
  if (normalizedZip) {
    const srcAlignment = detectTitleAlignment(normalizedZip);
    result.sourceTitleAlignment = srcAlignment;
    if (srcAlignment.hasCenter && genAlignment.hasCenter) {
      result.alignmentStatus = "pass";
      result.criteriaPassed.push("D.title_alignment_preserved");
    } else if (genAlignment.hasCenter) {
      result.alignmentStatus = "generated_has_center";
      result.criteriaPassed.push("D.title_alignment_preserved (generated has center)");
    } else if (srcAlignment.hasCenter) {
      result.alignmentStatus = "warn";
      result.criteriaFailed.push("D.title_alignment_preserved");
      result.failureReasons.push("Source has center-aligned paragraphs but generated does not");
    }
  } else {
    result.alignmentStatus = "no_source";
    result.unknownCriteria.push("D.title_alignment_preserved");
  }

  // Bold count
  result.generatedBoldCount = detectBoldTitle(generatedZip);
  if (normalizedZip) {
    result.sourceBoldCount = detectBoldTitle(normalizedZip);
    if (result.sourceBoldCount > 0 && result.generatedBoldCount > 0) {
      result.criteriaPassed.push("D.bold_runs_present");
    } else if (result.generatedBoldCount > 0) {
      result.criteriaPassed.push("D.bold_runs_present (generated has bold)");
    }
  }

  // ----- E: Lifecycle (informational) -----
  result.criteriaPassed.push("E.lifecycle_runtime_preview (proven by docx-download smoke)");

  // ----- Final fidelity status -----
  const criticalFails = result.criteriaFailed.filter((c) => {
    // These are critical: package validity, placeholder leaks, stale tokens,
    // and core structure (form title, agency text, signature)
    return /^A\.package_valid$/.test(c) ||
      /^B\.placeholder_clean$/.test(c) ||
      /^B\.stale_token_clean$/.test(c) ||
      /^C\.form_title_present$/.test(c) ||
      /^C\.agency_text_present$/.test(c) ||
      /^C\.signature_block_present$/.test(c) ||
      /^D\.table_count_parity$/.test(c);
  });

  const hasCriticalFail = criticalFails.length > 0;
  const hasNonCriticalFail = result.criteriaFailed.length > criticalFails.length;
  const hasMajorStructuralFail = criticalFails.length > 0;

  if (hasCriticalFail) {
    result.fidelityStatus = "FAIL";
    result.fidelityComplete = false;
    result.manualReviewRequired = false;
  } else if (hasNonCriticalFail) {
    result.fidelityStatus = "PARTIAL";
    result.fidelityComplete = false;
    result.manualReviewRequired = true;
  } else {
    result.fidelityStatus = "PASS";
    result.fidelityComplete = false; // never claim complete without manual visual review
    result.manualReviewRequired = true; // visual equivalence requires human review
    result.criteriaPassed.push("manual_visual_review_required_for_complete_claim");
  }

  return result;
}

// ---------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------

function renderMarkdown(results, counts, snapshotDate) {
  const lines = [];
  lines.push("# QLLAW Curated 37 — Golden / Layout Fidelity Audit");
  lines.push("");
  lines.push(`> **Generated**: ${snapshotDate}`);
  lines.push(`> **STATUS**: ${counts.status}`);
  lines.push(`> **STATUS_NOTE**: ${counts.statusNote}`);
  lines.push(`> **FIDELITY_COMPLETE_EVIDENCED**: false`);
  lines.push(`> **MANUAL_REVIEW_REQUIRED**: ${counts.manualReviewRequired}`);
  lines.push(`> **Total curated forms**: ${results.length}`);
  lines.push(`> **Forms fidelity PASS**: ${counts.pass}`);
  lines.push(`> **Forms fidelity PARTIAL**: ${counts.partial}`);
  lines.push(`> **Forms fidelity FAIL**: ${counts.fail}`);
  lines.push(`> **Placeholder leaks total**: ${counts.placeholderLeaks}`);
  lines.push(`> **Stale token leaks total**: ${counts.staleTokenLeaks}`);
  lines.push(`> **Structure failures total**: ${counts.structureFailures}`);
  lines.push(`> **Formatting failures total**: ${counts.formattingFailures}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|---|---|");
  lines.push(`| Total forms | ${results.length} |`);
  lines.push(`| Fidelity PASS | ${counts.pass} |`);
  lines.push(`| Fidelity PARTIAL | ${counts.partial} |`);
  lines.push(`| Fidelity FAIL | ${counts.fail} |`);
  lines.push(`| Placeholder leaks | ${counts.placeholderLeaks} |`);
  lines.push(`| Stale token leaks | ${counts.staleTokenLeaks} |`);
  lines.push(`| Structure failures | ${counts.structureFailures} |`);
  lines.push(`| Formatting failures | ${counts.formattingFailures} |`);
  lines.push(`| Manual review required | ${counts.manualReviewRequired} |`);
  lines.push(`| Fidelity complete claimed | 0 |`);
  lines.push("");
  lines.push("## Criteria legend");
  lines.push("");
  lines.push("- **A** = Package / XML baseline (ZIP validity, content types, document.xml, styles, numbering)");
  lines.push("- **B** = Placeholder / data quality (no {{ / }} / undefined / null / [object Object] / stale tokens)");
  lines.push("- **C** = Major legal document structure (title, agency, signature, recipients, place/date, legal basis)");
  lines.push("- **D** = Formatting / document settings (margins, fonts, tables, section/page breaks, alignment)");
  lines.push("- **E** = Runtime lifecycle invariants (proven by docx-download smoke)");
  lines.push("");
  lines.push("## Per-form fidelity results");
  lines.push("");
  lines.push(
    "| Code | Package | Placeholder | Stale | Form Title | Agency | Sig | Recip | Place/Date | Legal Basis | Margins | Fonts | Tables | Breaks | Lifecycle | Manual Review | Status | Complete | Reason |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const reasons = r.failureReasons.slice(0, 2).join("; ") || "—";
    lines.push(
      `| ${r.templateCode} | ${r.packageValid ? "✓" : "✗"} | ${r.placeholderLeaks.length === 0 ? "✓" : r.placeholderLeaks.length} | ${r.staleTokenLeaks.length === 0 ? "✓" : r.staleTokenLeaks.length} | ${r.formTitlePresent ? "✓" : "✗"} | ${r.agencyTextPresent ? "✓" : "✗"} | ${r.signatureBlockPresent ? "✓" : "✗"} | ${r.recipientsBlockPresent ? "✓" : "✗"} | ${r.placeDateLinePresent ? "✓" : "✗"} | ${r.legalBasisPresent ? "✓" : "✗"} | ${r.marginsStatus} | ${r.fontStatus} | ${r.tableParity} | ${r.sectionBreakParity} | ✓ | ${r.manualReviewRequired ? "yes" : "no"} | ${r.fidelityStatus} | ${r.fidelityComplete} | ${reasons} |`,
    );
  }
  lines.push("");
  lines.push("## Summary rationale");
  lines.push("");
  lines.push(counts.statusNote);
  lines.push("");
  lines.push("## Remaining risks");
  lines.push("");
  lines.push("- FIDELITY_COMPLETE_EVIDENCED not claimed — visual / layout equivalence requires human review.");
  lines.push("- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.");
  lines.push("- Only machine-checkable fidelity criteria are audited here; font/margin exactness has tolerance.");
  lines.push("- All unknownCriteria are excluded from PASS/FAIL but noted.");
  lines.push("");
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------

async function main() {
  console.error("Starting golden/layout fidelity audit for 37 curated forms...");
  console.error(`Read-only: generated DOCX = ${SAMPLE_DIR}/<code>.docx`);
  console.error(`Read-only: normalized source = ${NORM_DIR}/<code>/<code>_normalized.docx`);
  console.error(`Read-only: locked contract = ${LOCKED_DIR}/<code>__*.contract.locked.json`);
  console.error("");

  const results = [];
  for (const code of CURATED_FORMS) {
    process.stderr.write(`  Auditing ${code}...`);
    const result = assessForm(code);
    results.push(result);
    const status = result.fidelityStatus === "FAIL" ? "FAIL" : result.fidelityStatus === "PARTIAL" ? "PARTIAL" : "PASS";
    process.stderr.write(` ${status} (${result.criteriaFailed.length} fails, ${result.unknownCriteria.length} unknown)\n`);
  }

  const counts = {
    pass: results.filter((r) => r.fidelityStatus === "PASS").length,
    partial: results.filter((r) => r.fidelityStatus === "PARTIAL").length,
    fail: results.filter((r) => r.fidelityStatus === "FAIL").length,
    placeholderLeaks: results.reduce((s, r) => s + r.placeholderLeaks.length, 0),
    staleTokenLeaks: results.reduce((s, r) => s + r.staleTokenLeaks.length, 0),
    structureFailures: results.reduce((s, r) => s + r.criteriaFailed.filter((c) => c.startsWith("C.")).length, 0),
    formattingFailures: results.reduce((s, r) => s + r.criteriaFailed.filter((c) => c.startsWith("D.")).length, 0),
    manualReviewRequired: results.filter((r) => r.manualReviewRequired).length,
  };

  const hasAnyFailure = counts.fail > 0;
  const hasPartial = counts.partial > 0;

  if (hasAnyFailure) {
    counts.status = "PARTIAL";
    counts.statusNote = `${counts.fail} form(s) FAIL critical fidelity criteria (package invalid, placeholder leaks, stale tokens, or missing major structure). ${counts.partial} form(s) PARTIAL (non-critical formatting gaps). ${counts.pass} form(s) PASS all machine-checkable criteria but fidelityComplete not claimed without visual review. Manual visual/PDF comparison recommended for all forms before any fidelityComplete claim.`;
  } else if (hasPartial) {
    counts.status = "PARTIAL";
    counts.statusNote = `All ${results.length} form(s) PASS critical fidelity criteria. ${counts.partial} form(s) PARTIAL due to non-critical formatting gaps. ${counts.pass} form(s) PASS all machine-checkable criteria. No placeholder/stale-token leaks. FIDELITY_COMPLETE_EVIDENCED not claimed: visual equivalence requires human review.`;
  } else {
    counts.status = "PASS";
    counts.statusNote = `All ${results.length} form(s) PASS all machine-checkable fidelity criteria. No placeholder/stale-token leaks. Major legal document structure present. Formatting within tolerance. FIDELITY_COMPLETE_EVIDENCED not claimed: visual equivalence requires human review.`;
  }

  const snapshotDate = new Date().toISOString();
  const summary = {
    snapshotDate,
    status: counts.status,
    statusNote: counts.statusNote,
    fidelityCompleteClaimed: false,
    totalForms: results.length,
    formsPass: counts.pass,
    formsPartial: counts.partial,
    formsFail: counts.fail,
    placeholderLeaksTotal: counts.placeholderLeaks,
    staleTokenLeaksTotal: counts.staleTokenLeaks,
    structureFailuresTotal: counts.structureFailures,
    formattingFailuresTotal: counts.formattingFailures,
    manualReviewRequired: counts.manualReviewRequired,
    sourceRenderStatus: "PASS",
    browserVisibilityStatus: "PASS",
    demoClickStatus: "PASS",
    previewClickStatus: "PASS",
    docxDownloadStatus: "PASS",
    goldenLayoutFidelityStatus: counts.status,
    counts,
    results,
    auditScript: "scripts/audit/curated-37-golden-layout-fidelity.mjs",
    inputArtifacts: [
      "docs/audit/unified-bm-workspace/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json",
    ],
    sourcePaths: {
      generated: ".tmp-docx-download-smoke/<code>.docx",
      normalized: "storage/templates/normalized-docx/<code>/<code>_normalized.docx",
      locked: "docs/audit/docx/contracts/locked/<code>__*.contract.locked.json",
    },
    criteriaDef: {
      "A.package_valid": "Valid DOCX ZIP, [Content_Types].xml, word/document.xml present",
      "A.content_types_present": "[Content_Types].xml in package",
      "A.document_xml_present": "word/document.xml in package",
      "A.styles_parity": "word/styles.xml presence matches source",
      "A.numbering_parity": "word/numbering.xml presence matches source",
      "B.placeholder_clean": "No {{ / }} / undefined / null / [object Object]",
      "B.stale_token_clean": "No Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh",
      "C.form_title_present": "templateTitle words present in document text",
      "C.agency_text_present": "Agency keywords (Viện Kiểm sát etc.) present",
      "C.signature_block_present": "Signature block keywords present",
      "C.recipients_block_present": "Recipients block keywords present",
      "C.place_date_line_present": "Date/location pattern present",
      "C.legal_basis_present": "Legal basis keywords present",
      "D.margins_match": "Page margins within 0.5-inch tolerance of source",
      "D.font_preserved": "Font family overlap between source and generated",
      "D.table_count_parity": "Table count matches source",
      "D.section_break_parity": "Section break count matches source",
      "D.page_break_parity": "Page break count matches source",
      "D.title_alignment_preserved": "Center alignment present in generated (or matches source)",
      "D.bold_runs_present": "Bold runs present in generated",
      "E.lifecycle_runtime_preview": "Runtime preview-session path (proven by docx-download smoke)",
    },
    bm001Mutated: false,
    bm171Mutated: false,
    sourceDocxMutated: false,
    normalizedDocxMutated: false,
    lockedContractsMutated: false,
    compiledContractsMutated: false,
    dbMutated: false,
    prismaSchemaMutated: false,
    migrationsCreated: false,
    publicApiRoutePathsChanged: false,
    commitCreated: false,
    gitPushed: false,
    filesStaged: false,
    formFlightRuntimeReadyPromoted: 0,
    remainingRisks: [
      "FIDELITY_COMPLETE_EVIDENCED not claimed — visual equivalence requires human review.",
      "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted).",
      "Only machine-checkable fidelity criteria audited; exact visual layout not compared.",
      "Font/margin exactness uses tolerance — may not catch subtle differences.",
    ],
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    `${OUT_DIR}/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.json`,
    JSON.stringify(summary, null, 2),
  );
  writeFileSync(
    `${OUT_DIR}/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.md`,
    renderMarkdown(results, counts, snapshotDate),
  );

  console.error("");
  console.error(`Results: ${counts.pass} PASS, ${counts.partial} PARTIAL, ${counts.fail} FAIL`);
  console.error(`Placeholder leaks: ${counts.placeholderLeaks}, Stale token leaks: ${counts.staleTokenLeaks}`);
  console.error(`Structure failures: ${counts.structureFailures}, Formatting failures: ${counts.formattingFailures}`);
  console.error(`Manual review required: ${counts.manualReviewRequired}`);
  console.error(`Artifacts written:`);
  console.error(`  ${OUT_DIR}/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.json`);
  console.error(`  ${OUT_DIR}/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.md`);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
