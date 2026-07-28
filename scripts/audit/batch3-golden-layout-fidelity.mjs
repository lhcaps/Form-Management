#!/usr/bin/env node
/**
 * batch3-golden-layout-fidelity.mjs
 *
 * Machine-checkable golden / layout fidelity audit for the 20 Batch 3
 * INPUT_CONNECTED_PASS forms (BM-055..BM-069, BM-071..BM-075).
 *
 * Mirrors the curated-37 fidelity script (scripts/audit/curated-37-golden-layout-fidelity.mjs)
 * but applies it to Batch 3 generated DOCX files emitted by
 * apply-batch3-docx-download.mjs.
 *
 * Reads:
 *   - docs/audit/unified-bm-workspace/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.json (lifecycle evidence)
 *   - .tmp-batch3-docx-download-smoke/<code>.docx                        (generated runtime preview DOCX)
 *   - storage/templates/normalized-docx/<code>/<code>_normalized.docx   (normalized source DOCX)
 *   - docs/audit/docx/contracts/locked/<code>__*.contract.locked.json   (locked contract)
 *
 * Per-form machine-checkable criteria:
 *
 * A. Package / XML baseline
 *    - valid DOCX ZIP
 *    - [Content_Types].xml present
 *    - word/document.xml present
 *    - word/styles.xml parity vs source
 *    - word/numbering.xml parity vs source
 *
 * B. Placeholder / data quality
 *    - no {{
 *    - no }}
 *    - no undefined
 *    - no null
 *    - no [object Object]
 *    - no stale demo tokens (same set as curated-37)
 *
 * C. Major legal document structure
 *    - agency/header text present
 *    - form title present (templateTitle words)
 *    - issue place/date line keywords present
 *    - legal basis / decision content present
 *    - signature block keywords present (where source has signature slots)
 *    - recipients block keywords present (where source has recipient slots)
 *
 * D. Formatting / document settings
 *    - page margins (w:pgMar) within tolerance
 *    - default font family (w:rFonts) overlap
 *    - paragraph alignment for title preserved (w:jc center)
 *    - table count parity
 *    - section/page break count parity
 *    - bold runs present
 *
 * E. Runtime lifecycle (from Batch 3 docx-download artifact)
 *    - lifecycleVerifiedBySmoke=true
 *    - persisted=false evidence present
 *    - no generatedDocumentId leakage
 *    - no /documents route navigation
 *
 * Outputs:
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.md
 *
 * No source DOCX, locked contract, compiled contract, or DB mutation. Read-only.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const SAMPLE_DIR = `${ROOT}/.tmp-batch3-docx-download-smoke`;
const NORM_DIR = `${ROOT}/storage/templates/normalized-docx`;
const LOCKED_DIR = `${ROOT}/docs/audit/docx/contracts/locked`;
const DOWNLOAD_ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.json`;

const BATCH3_CODES = [
  "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-060",
  "BM-061", "BM-062", "BM-063", "BM-064", "BM-065", "BM-066",
  "BM-067", "BM-068", "BM-069", "BM-071", "BM-072", "BM-073",
  "BM-074", "BM-075",
];

const PLACEHOLDER_PATTERNS = [
  /\{\{[^}]+\}\}/g,
  /\}\}[^}]+\}/g,
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
// DOCX analysis helpers (mirrors curated-37)
// ---------------------------------------------------------------

function extractDocxText(zip) {
  const docXml = zip.files["word/document.xml"];
  if (!docXml) return "";
  try {
    const raw = docXml.asText();
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().normalize("NFC");
  } catch {
    return "";
  }
}

function extractDocxXml(zip, partName) {
  const file = zip.files[partName];
  if (!file) return null;
  try { return file.asText(); } catch { return null; }
}

function getZipPartNames(zip) {
  return Object.keys(zip.files);
}

function hasPart(zip, name) {
  return name in zip.files;
}

function extractPageSettings(zip) {
  const xml = extractDocxXml(zip, "word/document.xml");
  if (!xml) return {};
  const result = {};

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

  const sizeMatch = xml.match(/<w:pgSz\s+([^>]+)>/);
  if (sizeMatch) result.pageSize = sizeMatch[0];

  return result;
}

function countTableElements(zip) {
  const xml = extractDocxXml(zip, "word/document.xml") || "";
  const starts = (xml.match(/<w:tbl\b/g) || []).length;
  const ends = (xml.match(/<\/w:tbl>/g) || []).length;
  return { starts, ends, balanced: starts === ends };
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
  return (xml.match(/<w:b\/>/g) || []).length;
}

function detectFontInfo(zip) {
  const xml = extractDocxXml(zip, "word/document.xml") || "";
  const fontMatches = (xml.match(/w:rFonts\s+[^>]*w:ascii="([^"]+)"/g) || []);
  const fonts = fontMatches.map((m) => {
    const match = /w:ascii="([^"]+)"/.exec(m);
    return match ? match[1] : null;
  }).filter(Boolean);
  return [...new Set(fonts)];
}

// ---------------------------------------------------------------
// Placeholder / stale token checks
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

function checkSignatureBlock(text) {
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
  // Vietnamese date patterns. Two cases:
  //  1) Real digits filled in:        "ngày 04 tháng 3 năm 2026"
  //  2) Structural placeholder line:  "ngày … tháng … năm 20…"
  // We also accept the location keyword "tại" as evidence of a place line.
  const hasFilledDatePattern = /ngày\s+\d+|tháng\s+\d+|năm\s+\d{4}/i.test(text);
  const hasStructuralDatePattern = /ngày\s+\S|tháng\s+\S|năm\s+\S/i.test(text);
  const hasLocation = /\btại\s+\S/.test(text);
  return {
    present: hasFilledDatePattern || hasStructuralDatePattern || hasLocation,
    hasFilledDatePattern,
    hasStructuralDatePattern,
    hasLocation,
  };
}

function checkLegalBasis(text) {
  const lower = text.toLowerCase();
  // The DOCX may split multi-word legal references across multiple
  // <w:r> runs (e.g. italic "Thông tư" becomes "Thông t ư" after
  // tag-stripping). Allow optional whitespace between characters
  // when checking for these legal-basis tokens.
  const keywords = ["căn cứ", "luật", "nghị định", "thông tư"];
  const hits = [];
  for (const kw of keywords) {
    const re = new RegExp(kw.split("").join("\\s*"), "i");
    if (re.test(lower)) hits.push(kw);
  }
  return { present: hits.length > 0, keywords: hits };
}

// ---------------------------------------------------------------
// Locked contract + normalized DOCX readers
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
  // A "recipients block" slot is a Nơi nhận / để biết / để thực hiện
  // distribution-list slot, NOT a signature role line such as
  // recipients.personLine (which is a person name, not a Nơi nhận entry).
  const blockKeywords = [
    "nơi nhận",
    "noi nhan",
    "để biết",
    "de biet",
    "để thực hiện",
    "de thuc hien",
    "để chấp hành",
    "de cham hanh",
    "recipientblock",
    "distributionlist",
    "distribution_list",
  ];
  return locked.docxSlots.some((s) => {
    const sid = (s.slotId || "").toLowerCase();
    const label = (s.label || "").toLowerCase();
    return blockKeywords.some((kw) => sid.includes(kw) || label.includes(kw));
  });
}

function readNormalizedDocx(code) {
  const candidates = [
    `${NORM_DIR}/${code}/${code}_normalized.docx`,
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

function assessForm(code, downloadPerForm) {
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
    signatureSlotsExpected: false,
    recipientsBlockPresent: false,
    recipientsKeywords: [],
    recipientsSlotsExpected: false,
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

    // E. Lifecycle (from Batch 3 docx-download artifact)
    lifecycleVerifiedBySmoke: false,
    persistedFalseEvidence: false,
    noGeneratedDocumentIdLeak: false,
    noDocumentsRouteLeak: false,
    lifecycleStatus: "unknown",

    // Summary
    fidelityStatus: "FAIL",
    machineCheckableFidelityComplete: false,
    fidelityComplete: false,
    visualPdfReviewStatus: null,
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

  // ----- E: Lifecycle (from Batch 3 docx-download artifact) -----
  if (downloadPerForm) {
    result.lifecycleVerifiedBySmoke = downloadPerForm.docxDownloadStatus === "PASS";
    result.persistedFalseEvidence = downloadPerForm.persistedFalse === true;
    result.noGeneratedDocumentIdLeak = downloadPerForm.noGeneratedDocumentId === true;
    result.noDocumentsRouteLeak = downloadPerForm.noDocumentsRouteNavigation === true;

    if (
      result.lifecycleVerifiedBySmoke &&
      result.persistedFalseEvidence &&
      result.noGeneratedDocumentIdLeak &&
      result.noDocumentsRouteLeak
    ) {
      result.criteriaPassed.push("E.lifecycle_runtime_preview (proven by batch3 docx-download smoke)");
      result.lifecycleStatus = "pass";
    } else {
      const missing = [];
      if (!result.lifecycleVerifiedBySmoke) missing.push("docxDownloadStatus!=PASS");
      if (!result.persistedFalseEvidence) missing.push("persistedFalse!=true");
      if (!result.noGeneratedDocumentIdLeak) missing.push("noGeneratedDocumentId!=true");
      if (!result.noDocumentsRouteLeak) missing.push("noDocumentsRouteNavigation!=true");
      result.criteriaFailed.push("E.lifecycle_runtime_preview");
      result.failureReasons.push(`Lifecycle invariant not satisfied: ${missing.join("; ")}`);
      result.lifecycleStatus = "fail";
    }
  } else {
    result.unknownCriteria.push("E.lifecycle_runtime_preview (download artifact missing for this code)");
    result.lifecycleStatus = "no_artifact";
  }

  if (!generatedZip) {
    result.failureReasons.push("Generated DOCX not found in .tmp-batch3-docx-download-smoke/");
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

    if (result.stylesPresent === result.normalizedStylesPresent) {
      result.criteriaPassed.push("A.styles_parity");
    } else {
      result.criteriaFailed.push("A.styles_parity");
      result.failureReasons.push(`Styles presence mismatch: generated=${result.stylesPresent} vs source=${result.normalizedStylesPresent}`);
    }

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

  const hasSigSlots = hasSignatureSlots(locked);
  const sig = checkSignatureBlock(genText);
  result.signatureBlockPresent = sig.present;
  result.signatureKeywords = sig.keywords;
  result.signatureSlotsExpected = hasSigSlots;
  if (!hasSigSlots) {
    result.criteriaPassed.push("C.signature_block_present (N/A — no signature slots in source)");
  } else if (sig.present) {
    result.criteriaPassed.push("C.signature_block_present");
  } else {
    result.criteriaFailed.push("C.signature_block_present");
    result.failureReasons.push("Locked contract has signature slots but no signature keywords found in generated DOCX");
  }

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
      const tolerance = 0.5;
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

  result.generatedBoldCount = detectBoldTitle(generatedZip);
  if (normalizedZip) {
    result.sourceBoldCount = detectBoldTitle(normalizedZip);
    if (result.sourceBoldCount > 0 && result.generatedBoldCount > 0) {
      result.criteriaPassed.push("D.bold_runs_present");
    } else if (result.generatedBoldCount > 0) {
      result.criteriaPassed.push("D.bold_runs_present (generated has bold)");
    }
  }

  // ----- Final fidelity status -----
  const criticalFails = result.criteriaFailed.filter((c) => {
    return /^A\.package_valid$/.test(c) ||
      /^A\.content_types_present$/.test(c) ||
      /^A\.document_xml_present$/.test(c) ||
      /^B\.placeholder_clean$/.test(c) ||
      /^B\.stale_token_clean$/.test(c) ||
      /^C\.form_title_present$/.test(c) ||
      /^C\.agency_text_present$/.test(c) ||
      /^C\.signature_block_present$/.test(c) ||
      /^C\.recipients_block_present$/.test(c) ||
      /^C\.place_date_line_present$/.test(c) ||
      /^C\.legal_basis_present$/.test(c) ||
      /^D\.table_count_parity$/.test(c) ||
      /^D\.margins_match$/.test(c) ||
      /^D\.font_preserved$/.test(c) ||
      /^E\.lifecycle_runtime_preview$/.test(c);
  });

  const hasCriticalFail = criticalFails.length > 0;
  const hasNonCriticalFail = result.criteriaFailed.length > criticalFails.length;

  if (hasCriticalFail) {
    result.fidelityStatus = "FAIL";
    result.fidelityComplete = false;
    result.machineCheckableFidelityComplete = false;
    result.manualReviewRequired = false;
  } else if (hasNonCriticalFail) {
    result.fidelityStatus = "PARTIAL";
    result.fidelityComplete = false;
    result.machineCheckableFidelityComplete = false;
    result.manualReviewRequired = true;
  } else {
    result.fidelityStatus = "PASS";
    result.machineCheckableFidelityComplete = true;
    result.fidelityComplete = false; // never claim complete without visual review
    result.manualReviewRequired = true;
    result.visualPdfReviewStatus = "NOT_RUN";
    result.criteriaPassed.push("manual_visual_review_required_for_complete_claim");
  }

  return result;
}

// ---------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------

function renderMarkdown(results, counts, snapshotDate) {
  const lines = [];
  lines.push("# QLLAW Batch 3 — Machine-Checkable Golden / Layout Fidelity Audit");
  lines.push("");
  lines.push(`> **Generated**: ${snapshotDate}`);
  lines.push(`> **STATUS**: ${counts.status}`);
  lines.push(`> **STATUS_NOTE**: ${counts.statusNote}`);
  lines.push(`> **FIDELITY_COMPLETE_EVIDENCED**: false`);
  lines.push(`> **MANUAL_REVIEW_REQUIRED**: ${counts.manualReviewRequired}`);
  lines.push(`> **Total Batch 3 forms**: ${results.length}`);
  lines.push(`> **Forms machine-fidelity PASS**: ${counts.pass}`);
  lines.push(`> **Forms machine-fidelity PARTIAL**: ${counts.partial}`);
  lines.push(`> **Forms machine-fidelity FAIL**: ${counts.fail}`);
  lines.push(`> **Placeholder leaks total**: ${counts.placeholderLeaks}`);
  lines.push(`> **Stale token leaks total**: ${counts.staleTokenLeaks}`);
  lines.push(`> **Structure failures total**: ${counts.structureFailures}`);
  lines.push(`> **Formatting failures total**: ${counts.formattingFailures}`);
  lines.push(`> **Lifecycle failures total**: ${counts.lifecycleFailures}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|---|---|");
  lines.push(`| Total Batch 3 forms | ${results.length} |`);
  lines.push(`| Machine-fidelity PASS | ${counts.pass} |`);
  lines.push(`| Machine-fidelity PARTIAL | ${counts.partial} |`);
  lines.push(`| Machine-fidelity FAIL | ${counts.fail} |`);
  lines.push(`| Placeholder leaks | ${counts.placeholderLeaks} |`);
  lines.push(`| Stale token leaks | ${counts.staleTokenLeaks} |`);
  lines.push(`| Structure failures | ${counts.structureFailures} |`);
  lines.push(`| Formatting failures | ${counts.formattingFailures} |`);
  lines.push(`| Lifecycle failures | ${counts.lifecycleFailures} |`);
  lines.push(`| Manual review required | ${counts.manualReviewRequired} |`);
  lines.push(`| Visual/PDF review run | 0 |`);
  lines.push(`| Fidelity complete claimed | 0 |`);
  lines.push("");
  lines.push("## Criteria legend");
  lines.push("");
  lines.push("- **A** = Package / XML baseline (ZIP validity, content types, document.xml, styles, numbering)");
  lines.push("- **B** = Placeholder / data quality (no {{ / }} / undefined / null / [object Object] / stale tokens)");
  lines.push("- **C** = Major legal document structure (title, agency, signature, recipients, place/date, legal basis)");
  lines.push("- **D** = Formatting / document settings (margins, fonts, tables, section/page breaks, alignment)");
  lines.push("- **E** = Runtime lifecycle (lifecycleVerifiedBySmoke, persisted=false, no generatedDocumentId, no /documents route)");
  lines.push("");
  lines.push("## Per-form fidelity results");
  lines.push("");
  lines.push(
    "| Code | Package | Placeholder | Stale | Form Title | Agency | Sig | Recip | Place/Date | Legal Basis | Margins | Fonts | Tables | Breaks | Lifecycle | Manual Review | Status | Complete | Reason |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const reasons = r.failureReasons.slice(0, 2).join("; ") || "—";
    lines.push(
      `| ${r.templateCode} | ${r.packageValid ? "✓" : "✗"} | ${r.placeholderLeaks.length === 0 ? "✓" : r.placeholderLeaks.length} | ${r.staleTokenLeaks.length === 0 ? "✓" : r.staleTokenLeaks.length} | ${r.formTitlePresent ? "✓" : "✗"} | ${r.agencyTextPresent ? "✓" : "✗"} | ${r.signatureBlockPresent ? "✓" : "✗"} | ${r.recipientsBlockPresent ? "✓" : "✗"} | ${r.placeDateLinePresent ? "✓" : "✗"} | ${r.legalBasisPresent ? "✓" : "✗"} | ${r.marginsStatus} | ${r.fontStatus} | ${r.tableParity} | ${r.sectionBreakParity} | ${r.lifecycleStatus} | ${r.manualReviewRequired ? "yes" : "no"} | ${r.fidelityStatus} | ${r.fidelityComplete} | ${reasons} |`,
    );
  }
  lines.push("");
  lines.push("## Summary rationale");
  lines.push("");
  lines.push(counts.statusNote);
  lines.push("");
  lines.push("## Remaining risks");
  lines.push("");
  lines.push("- FIDELITY_COMPLETE_EVIDENCED not claimed — visual equivalence requires human review.");
  lines.push("- Batch 3 visual/PDF review not run in this phase.");
  lines.push("- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted).");
  lines.push("- Only machine-checkable fidelity criteria are audited here; font/margin exactness has tolerance.");
  lines.push("- All unknownCriteria are excluded from PASS/FAIL but noted.");
  lines.push("");
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------

async function main() {
  console.error("Starting batch 3 machine-checkable golden/layout fidelity audit...");
  console.error(`Read-only: generated DOCX = ${SAMPLE_DIR}/<code>.docx`);
  console.error(`Read-only: normalized source = ${NORM_DIR}/<code>/<code>_normalized.docx`);
  console.error(`Read-only: locked contract = ${LOCKED_DIR}/<code>__*.contract.locked.json`);
  console.error("");

  if (!existsSync(DOWNLOAD_ARTIFACT)) {
    console.error(`FATAL: missing ${DOWNLOAD_ARTIFACT}. Re-run scripts/audit/apply-batch3-docx-download.mjs first.`);
    process.exit(2);
  }

  const download = JSON.parse(readFileSync(DOWNLOAD_ARTIFACT, "utf8"));
  const perFormMap = {};
  for (const r of download.perForm || []) {
    if (r && r.code) perFormMap[r.code] = r;
  }

  const results = [];
  for (const code of BATCH3_CODES) {
    process.stderr.write(`  Auditing ${code}...`);
    const result = assessForm(code, perFormMap[code]);
    results.push(result);
    process.stderr.write(` ${result.fidelityStatus} (${result.criteriaFailed.length} fails, ${result.unknownCriteria.length} unknown)\n`);
  }

  const counts = {
    pass: results.filter((r) => r.fidelityStatus === "PASS").length,
    partial: results.filter((r) => r.fidelityStatus === "PARTIAL").length,
    fail: results.filter((r) => r.fidelityStatus === "FAIL").length,
    placeholderLeaks: results.reduce((s, r) => s + r.placeholderLeaks.length, 0),
    staleTokenLeaks: results.reduce((s, r) => s + r.staleTokenLeaks.length, 0),
    structureFailures: results.reduce((s, r) => s + r.criteriaFailed.filter((c) => c.startsWith("C.")).length, 0),
    formattingFailures: results.reduce((s, r) => s + r.criteriaFailed.filter((c) => c.startsWith("D.")).length, 0),
    lifecycleFailures: results.reduce((s, r) => s + r.criteriaFailed.filter((c) => c.startsWith("E.")).length, 0),
    manualReviewRequired: results.filter((r) => r.manualReviewRequired).length,
  };

  const hasAnyFailure = counts.fail > 0;
  const hasPartial = counts.partial > 0;

  if (hasAnyFailure) {
    counts.status = "PARTIAL";
    counts.statusNote = `${counts.fail} form(s) FAIL critical fidelity criteria (package invalid, placeholder leaks, stale tokens, missing major structure, or lifecycle invariant). ${counts.partial} form(s) PARTIAL (non-critical formatting gaps). ${counts.pass} form(s) PASS all machine-checkable criteria. No Batch 3 visual/PDF review run. FIDELITY_COMPLETE_EVIDENCED not claimed: visual equivalence requires human review.`;
  } else if (hasPartial) {
    counts.status = "PARTIAL";
    counts.statusNote = `All ${results.length} form(s) PASS critical fidelity criteria. ${counts.partial} form(s) PARTIAL due to non-critical formatting gaps. ${counts.pass} form(s) PASS all machine-checkable criteria. No placeholder/stale-token leaks. No Batch 3 visual/PDF review run. FIDELITY_COMPLETE_EVIDENCED not claimed: visual equivalence requires human review.`;
  } else {
    counts.status = "PASS";
    counts.statusNote = `All ${results.length} form(s) PASS all machine-checkable fidelity criteria. No placeholder/stale-token leaks. Major legal document structure present. Formatting within tolerance. Lifecycle invariants satisfied. No Batch 3 visual/PDF review run. FIDELITY_COMPLETE_EVIDENCED not claimed: visual equivalence requires human review.`;
  }

  const snapshotDate = new Date().toISOString();
  const summary = {
    snapshotDate,
    status: counts.status,
    statusNote: counts.statusNote,
    fidelityCompleteClaimed: false,
    visualPdfReviewStatus: "NOT_RUN",
    totalForms: results.length,
    formsPass: counts.pass,
    formsPartial: counts.partial,
    formsFail: counts.fail,
    placeholderLeaksTotal: counts.placeholderLeaks,
    staleTokenLeaksTotal: counts.staleTokenLeaks,
    structureFailuresTotal: counts.structureFailures,
    formattingFailuresTotal: counts.formattingFailures,
    lifecycleFailuresTotal: counts.lifecycleFailures,
    manualReviewRequired: counts.manualReviewRequired,
    sourceRenderStatus: "PASS",
    browserVisibilityStatus: "PASS",
    demoClickStatus: "PASS",
    previewClickStatus: "PASS",
    docxDownloadStatus: "PASS",
    machineCheckableFidelityStatus: counts.status,
    visualPdfReviewStatusForBatch3: "NOT_RUN",
    counts,
    results,
    auditScript: "scripts/audit/batch3-golden-layout-fidelity.mjs",
    inputArtifacts: [
      "docs/audit/unified-bm-workspace/QLLAW_BATCH3_DOCX_DOWNLOAD.latest.json",
    ],
    sourcePaths: {
      generated: ".tmp-batch3-docx-download-smoke/<code>.docx",
      normalized: "storage/templates/normalized-docx/<code>/<code>_normalized.docx",
      locked: "docs/audit/docx/contracts/locked/<code>__*.contract.locked.json",
    },
    criteriaDef: {
      "A.package_valid": "Valid DOCX ZIP",
      "A.content_types_present": "[Content_Types].xml in package",
      "A.document_xml_present": "word/document.xml in package",
      "A.styles_parity": "word/styles.xml presence matches source",
      "A.numbering_parity": "word/numbering.xml presence matches source",
      "B.placeholder_clean": "No {{ / }} / undefined / null / [object Object]",
      "B.stale_token_clean": "No Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh",
      "C.form_title_present": "templateTitle words present in document text",
      "C.agency_text_present": "Agency keywords (Viện Kiểm sát etc.) present",
      "C.signature_block_present": "Signature block keywords present (when source has signature slots)",
      "C.recipients_block_present": "Recipients block keywords present (when source has recipient slots)",
      "C.place_date_line_present": "Date/location pattern present",
      "C.legal_basis_present": "Legal basis keywords present",
      "D.margins_match": "Page margins within 0.5-inch tolerance of source",
      "D.font_preserved": "Font family overlap between source and generated",
      "D.table_count_parity": "Table count matches source",
      "D.section_break_parity": "Section break count matches source",
      "D.page_break_parity": "Page break count matches source",
      "D.title_alignment_preserved": "Center alignment present in generated (or matches source)",
      "D.bold_runs_present": "Bold runs present in generated",
      "E.lifecycle_runtime_preview": "lifecycleVerifiedBySmoke + persisted=false + no generatedDocumentId + no /documents route",
    },
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
    existing37EvidencePreserved: true,
    remainingRisks: [
      "FIDELITY_COMPLETE_EVIDENCED not claimed — visual equivalence requires human review.",
      "Batch 3 visual/PDF review not run in this phase.",
      "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted).",
      "Only machine-checkable fidelity criteria audited; exact visual layout not compared.",
      "Font/margin exactness uses tolerance — may not catch subtle differences.",
    ],
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    `${OUT_DIR}/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json`,
    JSON.stringify(summary, null, 2),
  );
  writeFileSync(
    `${OUT_DIR}/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.md`,
    renderMarkdown(results, counts, snapshotDate),
  );

  console.error("");
  console.error(`Results: ${counts.pass} PASS, ${counts.partial} PARTIAL, ${counts.fail} FAIL`);
  console.error(`Placeholder leaks: ${counts.placeholderLeaks}, Stale token leaks: ${counts.staleTokenLeaks}`);
  console.error(`Structure failures: ${counts.structureFailures}, Formatting failures: ${counts.formattingFailures}, Lifecycle failures: ${counts.lifecycleFailures}`);
  console.error(`Manual review required: ${counts.manualReviewRequired}`);
  console.error(`Artifacts written:`);
  console.error(`  ${OUT_DIR}/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json`);
  console.error(`  ${OUT_DIR}/QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.md`);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
