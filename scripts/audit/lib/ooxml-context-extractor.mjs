/**
 * OOXML Context Extractor for DOCX Atlas V1
 *
 * Extracts placeholder occurrences with full context from normalized DOCX files.
 * Designed for per-file sequential processing (not memory-intensive batch).
 *
 * @module ooxml-context-extractor
 */

import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRequire = createRequire(join(__dirname, '..', '..', 'apps', 'api', 'package.json'));
const PizZip = workspaceRequire('pizzip');

// ─── Vietnamese Label Patterns ─────────────────────────────────────────────────

const LABEL_WITH_COLON = /[A-ZÀ-Ỹ][a-zà-ỹ\s]*(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]*){0,5}\s*:/gu;

const LABEL_WITHOUT_COLON_PATTERNS = [
  'Họ tên',
  'Nghề nghiệp',
  'Nơi cư trú',
  'Nơi thường trú',
  'Nơi tạm trú',
  'CMND',
  'CCCD',
  'Hộ chiếu',
  'Số tài khoản',
  'Ngân hàng',
  'Địa chỉ',
  'Ngày, tháng, năm',
  'Viện kiểm sát',
  'Người nhận',
  'Nơi nhận',
  'Ký, ghi rõ họ tên',
  'Căn cứ',
  'Điều',
  'Quyết định',
  'Nơi ban hành',
  'Bị can',
  'Bị cáo',
  'Người bị buộc tội',
  'Người đại diện',
  'Cơ quan',
  'Tổ chức',
  'Tòa án',
  'Thẩm phán',
  'Hội đồng xét xử',
  'Thư ký',
  'Kiểm sát viên',
  'Điều tra viên',
  'Cán bộ',
  'Công chứng',
  'Chứng minh nhân dân',
  'Căn cước công dân',
  'Số CMND',
  'Số CCCD',
  'Ngày sinh',
  'Tháng sinh',
  'Năm sinh',
  'Quốc tịch',
  'Dân tộc',
  'Tôn giáo',
  'Nghề nghiệp',
  'Số điện thoại',
  'Điện thoại',
  'Fax',
  'Email',
  'Website',
  'Mã số thuế',
  'Số quyết định',
  'Ngày quyết định',
  'Thẩm quyền',
  'Phạm vi',
  'Thời hạn',
  'Lý do',
  'Nơi làm việc',
  'Chức vụ',
  'Đơn vị',
];

// ─── Risky Placeholder Families ───────────────────────────────────────────────

const RISKY_PLACEHOLDER_PATTERNS = [
  /^recipients\.personLine\d+$/,
  /^document\.fullDocumentCode\d+$/,
  /^document\.\w*Code\w*$/,
  /^case\.caseNumber/,
  /^agency\.\w*Line/,
  /^decision\.decisionLine/,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function decodeXmlText(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#xD;/g, '');
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function hashString(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}

function textFromXmlFragment(xml) {
  const parts = [];
  const tnRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/gu;
  let match;
  while ((match = tnRegex.exec(xml)) !== null) {
    parts.push(decodeXmlText(match[1]).replace(/<[^>]*>/g, '').trim());
  }
  return normalizeText(parts.join(' ')) || null;
}

function findContainerRange(xml, position, openNeedle, closeNeedle) {
  if (position < 0) return null;
  const before = xml.slice(0, position);
  const open = before.lastIndexOf(openNeedle);
  const closeBefore = before.lastIndexOf(closeNeedle);
  if (open < 0 || closeBefore > open) return null;
  const closeAfter = xml.indexOf(closeNeedle, position);
  if (closeAfter < 0) return null;
  return { start: open, end: closeAfter + closeNeedle.length };
}

function findParagraphRange(xml, position) {
  if (position < 0) return null;
  const before = xml.slice(0, position);
  const openPlain = before.lastIndexOf('<w:p>');
  const openWithAttrs = before.lastIndexOf('<w:p ');
  const open = Math.max(openPlain, openWithAttrs);
  const closeBefore = before.lastIndexOf('</w:p>');
  if (open < 0 || closeBefore > open) return null;
  const closeAfter = xml.indexOf('</w:p>', position);
  if (closeAfter < 0) return null;
  return { start: open, end: closeAfter + 7 };
}

function tableContextInfo(xml, position) {
  const tableRange = findContainerRange(xml, position, '<w:tbl', '</w:tbl>');
  if (!tableRange) return null;

  const tableXml = xml.slice(tableRange.start, tableRange.end);
  const positionInTable = position - tableRange.start;
  const beforeTable = xml.slice(0, tableRange.start);
  const tableIndex = (beforeTable.match(/<w:tbl\b/gu) ?? []).length;

  const beforeInTable = tableXml.slice(0, positionInTable);
  const rowOpenPlain = beforeInTable.lastIndexOf('<w:tr>');
  const rowOpenWithAttrs = beforeInTable.lastIndexOf('<w:tr ');
  const rowStart = Math.max(rowOpenPlain, rowOpenWithAttrs);
  if (rowStart < 0) {
    return {
      tableIndex,
      rowIndex: -1,
      cellIndex: -1,
      text: textFromXmlFragment(tableXml),
      rowRange: null,
    };
  }

  const rowEndRel = tableXml.indexOf('</w:tr>', positionInTable);
  const rowEnd = rowEndRel < 0 ? tableXml.length : rowEndRel + 7;
  const rowXml = tableXml.slice(rowStart, rowEnd);
  const positionInRow = positionInTable - rowStart;
  const beforeRow = tableXml.slice(0, rowStart);
  const rowIndex = (beforeRow.match(/<w:tr\b/gu) ?? []).length;

  const beforeInRow = rowXml.slice(0, positionInRow);
  const cellOpenPlain = beforeInRow.lastIndexOf('<w:tc>');
  const cellOpenWithAttrs = beforeInRow.lastIndexOf('<w:tc ');
  const cellStart = Math.max(cellOpenPlain, cellOpenWithAttrs);
  const beforeCell = cellStart >= 0 ? rowXml.slice(0, cellStart) : beforeInRow;
  const cellIndex = cellStart >= 0 ? (beforeCell.match(/<w:tc\b/gu) ?? []).length : -1;

  return {
    tableIndex,
    rowIndex,
    cellIndex,
    text: textFromXmlFragment(rowXml) ?? textFromXmlFragment(tableXml),
    rowRange: {
      start: tableRange.start + rowStart,
      end: tableRange.start + rowEnd,
    },
  };
}

/**
 * Parse a DOCX buffer and return the PizZip instance.
 */
export function parseDocxBuffer(buffer) {
  return new PizZip(buffer);
}

/**
 * Extract all OOXML parts from the zip.
 * Returns array of { partName, content, kind }.
 */
export function extractOoxmlParts(zip) {
  const parts = [];
  for (const name of Object.keys(zip.files)) {
    if (!name.startsWith('word/') || !name.endsWith('.xml')) continue;
    const content = zip.file(name)?.asText();
    if (!content) continue;

    let kind = 'other';
    if (name === 'word/document.xml') kind = 'body';
    else if (/^word\/header\d+\.xml$/.test(name)) kind = 'header';
    else if (/^word\/footer\d+\.xml$/.test(name)) kind = 'footer';

    parts.push({ partName: name, content, kind });
  }
  return parts;
}

/**
 * Extract all text nodes from an OOXML part.
 * Returns array of { textNodeIndex, globalTextNodeIndex, text, partTextNodeIndex }.
 */
export function extractTextNodesFromPart(partName, xml, globalOffset = 0) {
  const results = [];
  const textNodeRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu;
  let match;
  let partIndex = 0;
  while ((match = textNodeRegex.exec(xml)) !== null) {
    const text = decodeXmlText(match[1]).replace(/<[^>]*>/g, '');
    if (text.length > 0) {
      results.push({
        text,
        textNodeIndex: partIndex,
        partTextNodeIndex: partIndex,
        globalTextNodeIndex: globalOffset + partIndex,
        partName,
        xmlOffset: match.index,
      });
      partIndex++;
    }
  }
  return { nodes: results, nextOffset: globalOffset + partIndex };
}

/**
 * Find all placeholder occurrences in a DOCX.
 * Returns array of { placeholder, occurrenceIndex, textNodeIndex, partName, partKind }.
 */
export function findPlaceholderOccurrences(textNodes) {
  const occurrences = [];
  const counts = {};

  for (const node of textNodes) {
    const matches = [...node.text.matchAll(/\{\{([^}]+)\}\}/g)];
    for (const match of matches) {
      const placeholder = match[1].trim();
      if (!counts[placeholder]) counts[placeholder] = 0;
      const occIndex = counts[placeholder]++;

      occurrences.push({
        placeholder,
        occurrenceIndex: occIndex,
        textNodeIndex: node.textNodeIndex,
        partTextNodeIndex: node.partTextNodeIndex ?? node.textNodeIndex,
        globalTextNodeIndex: node.globalTextNodeIndex,
        partName: node.partName,
        xmlOffset: node.xmlOffset,
      });
    }
  }

  return { occurrences, counts };
}

/**
 * Get full paragraph text containing a text node.
 */
export function getFullParagraphText(xml, textNodePos) {
  const range = findParagraphRange(xml, textNodePos);
  if (!range) return null;
  return textFromXmlFragment(xml.slice(range.start, range.end));
}

/**
 * Get previous paragraph text.
 */
export function getPreviousParagraphText(xml, textNodePos) {
  const before = xml.substring(0, textNodePos);
  const lastP = before.lastIndexOf('<w:p>');
  const lastPAlt = before.lastIndexOf('<w:p ');
  const lastCloseP = Math.max(lastP, lastPAlt);

  if (lastCloseP < 0) return null;

  const prevBefore = before.substring(0, lastCloseP);
  const prevLastP = Math.max(
    prevBefore.lastIndexOf('<w:p>'),
    prevBefore.lastIndexOf('<w:p ')
  );

  if (prevLastP < 0) return null;

  const prevFullP = prevBefore.substring(prevLastP);
  const endIdx = prevFullP.indexOf('</w:p>');
  if (endIdx < 0) return null;

  const prevP = prevFullP.substring(0, endIdx + 7);
  const tnRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const parts = [];
  let m;
  while ((m = tnRegex.exec(prevP)) !== null) {
    parts.push(m[1].trim());
  }
  return parts.join(' ') || null;
}

/**
 * Get next paragraph text.
 */
export function getNextParagraphText(xml, textNodePos) {
  const after = xml.substring(textNodePos);
  const firstCloseP = after.indexOf('</w:p>');
  if (firstCloseP < 0) return null;

  const nextContent = after.substring(firstCloseP + 7);
  const nextPOpen = nextContent.indexOf('<w:p>');
  const nextPOpenAlt = nextContent.indexOf('<w:p ');

  if (nextPOpen < 0 && nextPOpenAlt < 0) return null;

  const nextPStart = nextPOpen >= 0 ? nextPOpen : nextPOpenAlt;
  const nextP = nextContent.substring(nextPStart);
  const nextPEnd = nextP.indexOf('</w:p>');

  if (nextPEnd < 0) return null;

  const nextPContent = nextP.substring(0, nextPEnd + 7);
  const tnRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const parts = [];
  let m;
  while ((m = tnRegex.exec(nextPContent)) !== null) {
    parts.push(m[1].trim());
  }
  return parts.join(' ') || null;
}

/**
 * Get rough table context around a text node.
 * Returns array of texts from nearby cells (not full table parse).
 */
export function getTableContextRough(xml, textNodePos) {
  return tableContextInfo(xml, textNodePos)?.text ?? null;
}

/**
 * Detect Vietnamese labels in text.
 * Finds both labels with colon and without colon.
 */
export function detectVietnameseLabels(text) {
  const labels = new Set();

  // Labels with colon
  for (const match of text.matchAll(LABEL_WITH_COLON)) {
    const label = match[0].trim().replace(/:$/, '').trim();
    if (label.length >= 3) labels.add(label);
  }

  // Labels without colon (exact substring matches)
  for (const pattern of LABEL_WITHOUT_COLON_PATTERNS) {
    if (text.includes(pattern)) {
      labels.add(pattern);
    }
  }

  return [...labels];
}

/**
 * Check if placeholder belongs to risky family.
 */
export function isRiskyPlaceholderFamily(placeholder) {
  return RISKY_PLACEHOLDER_PATTERNS.some((re) => re.test(placeholder));
}

/**
 * Build context signature for a placeholder occurrence.
 * Used to compare if duplicate occurrences have same/different context.
 */
export function buildContextSignature(occurrence) {
  const parts = [
    occurrence.partKind || 'unknown',
    occurrence.partName || '',
    String(occurrence.tableIndex ?? -1),
    String(occurrence.rowIndex ?? -1),
    String(occurrence.cellIndex ?? -1),
    (occurrence.sameParagraphPlaceholders || []).sort().join(','),
    (occurrence.sameRowPlaceholders || []).sort().join(','),
    (occurrence.visibleLabels || []).slice(0, 3).sort().join('|'),
    occurrence.fullParagraphText?.slice(0, 100) || '',
  ];
  return hashString(parts.join('|'));
}

/**
 * Build the full context object for one placeholder occurrence.
 */
export function buildOccurrenceContext(part, textNodes, occurrence, allOccurrences = []) {
  const partContent = part?.content ?? '';
  const textNodePos = occurrence.xmlOffset ?? -1;
  const paragraphRange = findParagraphRange(partContent, textNodePos);
  const tableInfo = tableContextInfo(partContent, textNodePos);

  const fullParaText = getFullParagraphText(partContent, textNodePos);
  const prevParaText = getPreviousParagraphText(partContent, textNodePos);
  const nextParaText = getNextParagraphText(partContent, textNodePos);
  const tableContext = tableInfo?.text ?? null;

  const sameParagraphPlaceholders = [
    ...new Set(
      allOccurrences
        .filter((other) => {
          if (other.partName !== occurrence.partName) return false;
          if (other.placeholder === occurrence.placeholder) return false;
          if (!paragraphRange || other.xmlOffset === undefined) {
            return Math.abs(other.textNodeIndex - occurrence.textNodeIndex) <= 5;
          }
          return other.xmlOffset >= paragraphRange.start && other.xmlOffset <= paragraphRange.end;
        })
        .map((other) => other.placeholder),
    ),
  ].sort();

  const sameRowPlaceholders = [
    ...new Set(
      allOccurrences
        .filter((other) => {
          if (other.partName !== occurrence.partName) return false;
          if (other.placeholder === occurrence.placeholder) return false;
          if (!tableInfo?.rowRange || other.xmlOffset === undefined) return false;
          return other.xmlOffset >= tableInfo.rowRange.start && other.xmlOffset <= tableInfo.rowRange.end;
        })
        .map((other) => other.placeholder),
    ),
  ].sort();

  const contextText = [
    fullParaText,
    prevParaText,
    nextParaText,
    tableContext,
  ]
    .filter(Boolean)
    .join(' ');

  const enriched = {
    placeholder: occurrence.placeholder,
    occurrenceIndex: occurrence.occurrenceIndex,
    partName: occurrence.partName,
    partKind: part?.kind || 'other',
    textNodeIndex: occurrence.textNodeIndex,
    partTextNodeIndex: occurrence.partTextNodeIndex ?? occurrence.textNodeIndex,
    globalTextNodeIndex: occurrence.globalTextNodeIndex,
    xmlOffset: textNodePos,
    tableIndex: tableInfo?.tableIndex ?? -1,
    rowIndex: tableInfo?.rowIndex ?? -1,
    cellIndex: tableInfo?.cellIndex ?? -1,
    fullParagraphText: fullParaText,
    previousParagraphText: prevParaText,
    nextParagraphText: nextParaText,
    tableContextRough: tableContext,
    sameParagraphPlaceholders,
    sameRowPlaceholders,
    visibleLabels: detectVietnameseLabels(contextText),
    isRiskyFamily: isRiskyPlaceholderFamily(occurrence.placeholder),
  };

  enriched.contextSignature = buildContextSignature(enriched);
  return enriched;
}

/**
 * Classify DOCX risk for a placeholder group based on occurrences.
 */
export function classifyDocxRiskForPlaceholderGroup(placeholder, occurrences) {
  if (occurrences.length === 0) {
    return { level: 'NONE', reason: 'No occurrences' };
  }

  if (occurrences.length === 1) {
    return { level: 'LOW', reason: 'Single occurrence' };
  }

  const isRisky = isRiskyPlaceholderFamily(placeholder);

  // Check context signatures
  const sigSet = new Set(occurrences.map((o) => o.contextSignature));
  const uniqueContexts = sigSet.size;

  // Check visible labels
  const hasLabels = occurrences.some(
    (o) => o.visibleLabels && o.visibleLabels.length > 0
  );

  // Check for multi-part (header/body/footer)
  const partKinds = new Set(occurrences.map((o) => o.partKind));
  const multiPart = partKinds.size > 1;

  // CRITICAL: risky family + different contexts + no labels
  if (
    isRisky &&
    uniqueContexts > 1 &&
    !hasLabels
  ) {
    return {
      level: 'CRITICAL',
      reason: `Risky family ${placeholder} has ${uniqueContexts} different contexts without visible labels`,
    };
  }

  // HIGH: risky family + different contexts + appears in different parts or cells with labels
  const tableCells = new Set(
    occurrences.map((o) => `${o.partName}:${o.tableIndex ?? -1}:${o.rowIndex ?? -1}:${o.cellIndex ?? -1}`)
  );
  const multiCell = tableCells.size > 1;
  if (
    isRisky &&
    uniqueContexts > 1 &&
    (multiPart || multiCell)
  ) {
    return {
      level: 'HIGH',
      reason: `Risky family ${placeholder} has different labeled contexts across parts or table cells`,
    };
  }

  // MEDIUM: different contexts but labels available
  if (uniqueContexts > 1 && hasLabels) {
    return {
      level: 'MEDIUM',
      reason: `${placeholder} has ${uniqueContexts} different contexts with labels`,
    };
  }

  // LOW: same context
  return {
    level: 'LOW',
    reason: `${placeholder} has ${occurrences.length} occurrences with similar context`,
  };
}

/**
 * Main entry point: extract all placeholder occurrences with context from a DOCX file.
 */
export function extractPlaceholderOccurrencesFromDocx(docxPath) {
  if (!existsSync(docxPath)) {
    throw new Error(`DOCX not found: ${docxPath}`);
  }

  const buffer = readFileSync(docxPath);
  const zip = parseDocxBuffer(buffer);
  const parts = extractOoxmlParts(zip);

  // Extract all text nodes with global indices
  let globalOffset = 0;
  const allTextNodes = [];

  for (const part of parts) {
    const { nodes, nextOffset } = extractTextNodesFromPart(
      part.partName,
      part.content,
      globalOffset
    );
    for (const node of nodes) {
      allTextNodes.push({
        ...node,
        partKind: part.kind,
      });
    }
    globalOffset = nextOffset;
  }

  // Find placeholder occurrences
  const { occurrences, counts } = findPlaceholderOccurrences(allTextNodes);

  // Build occurrence context for each
  const enrichedOccurrences = [];

  for (const occ of occurrences) {
    const part = parts.find((p) => p.partName === occ.partName);
    enrichedOccurrences.push(
      buildOccurrenceContext(part, allTextNodes, occ, occurrences)
    );
  }

  // Group by placeholder for risk classification
  const byPlaceholder = {};
  for (const occ of enrichedOccurrences) {
    if (!byPlaceholder[occ.placeholder]) {
      byPlaceholder[occ.placeholder] = [];
    }
    byPlaceholder[occ.placeholder].push(occ);
  }

  const placeholderRisks = {};
  for (const [placeholder, occs] of Object.entries(byPlaceholder)) {
    placeholderRisks[placeholder] = classifyDocxRiskForPlaceholderGroup(
      placeholder,
      occs
    );
  }

  return {
    docxPath,
    totalTextNodes: allTextNodes.length,
    totalPlaceholders: occurrences.length,
    uniquePlaceholders: Object.keys(counts).length,
    occurrenceCounts: counts,
    byPlaceholder,
    occurrences: enrichedOccurrences,
    placeholderRisks,
  };
}
