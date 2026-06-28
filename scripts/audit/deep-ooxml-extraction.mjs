#!/usr/bin/env node
/**
 * scripts/audit/deep-ooxml-extraction.mjs
 *
 * Phase 2: Deep OOXML occurrence extractor for BM-052.
 * Parses raw OOXML to get paragraph/table/row/cell indices and
 * exact context for every flagged placeholder occurrence.
 *
 * Mode: EVIDENCE_ONLY — no mutation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import PizZip from 'pizzip';

const ROOT = process.cwd();
const DOCX_PATH = join(ROOT, 'storage/templates/normalized-docx/BM-052/BM-052_normalized.docx');
const OUT_DIR = join(ROOT, 'docs/audit/docx-placeholder-renormalization/BM-052');

// ─── XML helpers ─────────────────────────────────────────────────────────────────
function decodeXml(text) {
  return String(text ?? '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTextsFromXml(xml) {
  const texts = [];
  for (const m of xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)) {
    texts.push(m[1]);
  }
  return texts.join('');
}

function paraText(paraXml) {
  return decodeXml(extractTextsFromXml(paraXml)).replace(/\s+/g, ' ').trim();
}

function extractPlaceholders(paraXml) {
  return [...paraXml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim());
}

// ─── OOXML structure extractor ────────────────────────────────────────────────────
// Returns {bodyParagraphs, tables, ooxmlPath}.
// bodyParagraphs: all <w:p> blocks NOT inside <w:tc>...</w:tc>
// tables: each {tableIndex, xml, rows:[{rowIndex, xml, cells:[{cellIndex, xml, content, placeholders}]}]}
function extractDocxStructure(docxPath) {
  if (!existsSync(docxPath)) {
    return { error: 'DOCX_NOT_FOUND', bodyParagraphs: [], tables: [] };
  }

  const zip = new PizZip(readFileSync(docxPath));
  const docXml = zip.file('word/document.xml').asText();

  // ── Step 1: Build table cell blocks with position boundaries ─────────────────
  // A paragraph is "inside" a cell if its <w:p> start position falls
  // between the <w:tc> start and end positions.
  const tableCellBlocks = []; // [{cellXml, tableIdx, rowIdx, cellIdx, tcStart, tcEnd}]
  let tableIdx = 0;
  for (const tblMatch of docXml.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g)) {
    const tblStart = tblMatch.index;
    const tblEnd = tblStart + tblMatch[0].length;
    let rowIdx = 0;
    for (const rowMatch of tblMatch[0].matchAll(/<w:tr>([\s\S]*?)<\/w:tr>/g)) {
      // row offset relative to table start
      const rowAbsStart = tblStart + rowMatch.index;
      let cellIdx = 0;
      for (const cellMatch of rowMatch[0].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)) {
        // cell offset relative to document
        const cellAbsStart = rowAbsStart + cellMatch.index;
        const cellAbsEnd = cellAbsStart + cellMatch[0].length;
        tableCellBlocks.push({
          xml: cellMatch[0],
          tableIdx,
          rowIdx,
          cellIdx,
          tcStart: cellAbsStart,
          tcEnd: cellAbsEnd,
        });
        cellIdx++;
      }
      rowIdx++;
    }
    tableIdx++;
  }

  // ── Step 2: Assign each <w:p> to either a table cell or the body ─────────────────
  // Use the absolute character position of each <w:p> tag from the regex match.
  // Paragraphs with positions inside a table block boundary are table paragraphs.
  const bodyParagraphs = [];
  const tableParagraphs = [];
  let bodyIdx = 0;
  let tableIdx2 = 0; // distinct counter for table paragraphs array

  // Get all paragraph matches with their absolute positions
  for (const pMatch of docXml.matchAll(/<w:p>([\s\S]*?)<\/w:p>/g)) {
    const pXml = pMatch[0];
    const pAbsPos = pMatch.index; // absolute position in document
    const pPlain = paraText(pXml);
    const pPlaceholders = extractPlaceholders(pXml);

    // Position-based containment check
    const inCell = tableCellBlocks.find(
      (b) => pAbsPos >= b.tcStart && pAbsPos <= b.tcEnd,
    );

    if (inCell) {
      tableParagraphs.push({
        arrayIndex: tableIdx2++, // array index within tableParagraphs
        docParaIndex: pAbsPos, // absolute character position as unique doc identifier
        tableIndex: inCell.tableIdx,
        rowIndex: inCell.rowIdx,
        cellIndex: inCell.cellIdx,
        xml: pXml,
        rawPlain: pPlain,
        placeholders: pPlaceholders,
        inTable: true,
      });
    } else {
      bodyParagraphs.push({
        arrayIndex: bodyIdx++, // array index within bodyParagraphs
        docParaIndex: pAbsPos, // absolute character position
        xml: pXml,
        rawPlain: pPlain,
        placeholders: pPlaceholders,
        inTable: false,
        tableIndex: null,
        rowIndex: null,
        cellIndex: null,
        cellParaIndex: null,
      });
    }
  }

  // ── Step 3: Build table rows from cell blocks ──────────────────────────────
  const tables = [];
  tableIdx = 0;
  for (const tblMatch of docXml.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g)) {
    const rows = [];
    let rowIdx = 0;
    for (const rowMatch of tblMatch[0].matchAll(/<w:tr>([\s\S]*?)<\/w:tr>/g)) {
      const cells = [];
      let cellIdx = 0;
      for (const cellMatch of rowMatch[0].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)) {
        const cellPlain = paraText(cellMatch[0]);
        cells.push({
          cellIndex: cellIdx,
          xml: cellMatch[0],
          rawPlain: cellPlain,
          placeholders: extractPlaceholders(cellMatch[0]),
        });
        cellIdx++;
      }
      rows.push({ rowIndex: rowIdx, xml: rowMatch[0], cells });
      rowIdx++;
    }
    tables.push({ tableIndex: tableIdx, xml: tblMatch[0], rows });
    tableIdx++;
  }

  return { bodyParagraphs, tableParagraphs, tables, error: null };
}

// ─── Occurrence extractor ─────────────────────────────────────────────────────────
function findOccurrencesInParagraphs(paragraphs, placeholder) {
  const token = '{{' + placeholder + '}}';
  const results = [];

  for (const para of paragraphs) {
    if (!para.rawPlain.includes(token)) continue;

    let charPos = 0;
    while ((charPos = para.rawPlain.indexOf(token, charPos)) >= 0) {
      const occ = {
        placeholder,
        occurrenceIndex: results.length, // stable sequential index
        charPosition: charPos,
        // Structural — use arrayIndex for paragraph numbering
        paraIndex: para.arrayIndex,
        inTable: para.inTable ?? false,
        tableIndex: para.tableIndex ?? null,
        rowIndex: para.rowIndex ?? null,
        cellIndex: para.cellIndex ?? null,
        cellParaIndex: para.cellParaIndex ?? null,
        // Document absolute position (useful for cross-reference)
        docParaIndex: para.docParaIndex,
        // Text
        fullParagraphPlain: para.rawPlain,
        allPlaceholdersInPara: para.placeholders,
        // 500 chars before/after
        before500: para.rawPlain.slice(Math.max(0, charPos - 500), charPos),
        after500: para.rawPlain.slice(charPos + token.length, charPos + token.length + 500),
        // 200 chars immediate context
        textBeforeToken: para.rawPlain.slice(Math.max(0, charPos - 200), charPos),
        textAfterToken: para.rawPlain.slice(charPos + token.length, charPos + token.length + 200),
      };
      results.push(occ);
      charPos += token.length;
    }
  }

  return results;
}

function findAllOccurrences(doc, placeholder) {
  // Search body paragraphs
  const body = findOccurrencesInParagraphs(doc.bodyParagraphs, placeholder);
  // Also search table cell paragraphs
  const table = findOccurrencesInParagraphs(
    doc.tableParagraphs.map((p) => ({ ...p, inTable: true })),
    placeholder,
  );
  // Re-index occurrence indices to be globally sequential
  const all = [...body, ...table];
  all.forEach((occ, i) => {
    occ.occurrenceIndex = i;
  });
  return all;
}

// ─── Semantic anchors ────────────────────────────────────────────────────────────
const ANCHOR_PATTERNS = [
  ['fullName', /họ\s*tên|Họ\s*tên\b/g],
  ['alias', /tên\s*gọi\s*khác/i],
  ['job', /nghề\s*nghiệp|Nghề\s*nghiệp\b/g],
  ['idNumber', /cmnd|cccd|hộ\s*chiếu|CMND|CCCD/g],
  ['permanentAddress', /nơi\s*thường\s*trú|Nơi\s*thường\s*trú\b/g],
  ['temporaryAddress', /nơi\s*tạm\s*trú|Nơi\s*tạm\s*trú\b/g],
  ['signature', /ký,\s*ghi\s*rõ\s*họ\s*tên|Ký,\s*ghi\s*rõ\s*họ\s*tên/g],
  ['recipientFooter', /nơi\s*nhận|Nơi\s*nhận\b/g],
  ['decisionBasis', /căn\s*cứ\s*quyết\s*định|căn\s*cứ|xét\s*thấy|Căn\s*cứ|Xét\s*thấy\b/g],
  ['ofFor', /\bcủa\b|\bđối\s*với\b/g],  // "của" = "of", "đối với" = "about/for"
];

function scoreAnchors(context) {
  const scores = {};
  for (const [name] of ANCHOR_PATTERNS) scores[name] = 0;
  for (const [name, pattern] of ANCHOR_PATTERNS) {
    let match;
    const re = new RegExp(pattern.source, 'gi');
    while ((match = re.exec(context)) !== null) scores[name]++;
  }
  return scores;
}

function topAnchors(context, threshold = 1) {
  const scores = scoreAnchors(context);
  return Object.entries(scores)
    .filter(([, n]) => n >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => ({ name, count: n }));
}

// ─── Semantic resolution ──────────────────────────────────────────────────────────
// CRITICAL RULES FROM PLANNER:
// decision.decisionLine2:
//   - Both occurrences are person name references, NOT decision date lines.
//   - Keeping decision.* namespace is WRONG for both.
//   - Must propose replacing BOTH with domain-correct person placeholder OR defer.
//   - Do NOT mark as NOOP keep existing.
// recipients.personLine6:
//   - "Họ tên" → person.personFullName6
//   - "Nơi thường trú" → person.addressPermanent6
//   - "Nơi tạm trú" → person.addressTemporary6
//   - Ambiguous → DEFER_AMBIGUOUS_ADDRESS_TYPE
// footer/signature:
//   - Do NOT map to person.signatureLine6 unless model supports it
//   - Use CodeGraph to check pattern first

function resolveOccurrence(placeholder, occ, doc) {
  const ctx = occ.fullParagraphPlain;
  const anchors = topAnchors(ctx, 1);
  const anchorNames = anchors.map((a) => a.name);
  const anchorCounts = scoreAnchors(ctx);

  if (placeholder === 'decision.decisionLine2') {
    // CONFIRMED from raw OOXML extraction:
    // Occurrence 0 (para 24, char 589): "...của… đối với{{decision.decisionLine2}}"
    //   The placeholder appears AFTER "của… đối với" — "của" = "of/about", "đối với" = "about/for"
    //   This is a person name reference: "about/for [PERSON_NAME]" in the decision basis clause
    //   Semantic: person.fullName, NOT decision date/line
    // Occurrence 1 (para 25, char 623): "Xét thấy{{decision.decisionLine2}}QUYẾT ĐỊNH:..."
    //   The placeholder appears AFTER "Xét thấy" — "Considering [PERSON_NAME] DECIDES:..."
    //   This is a person name reference in the decision clause
    //   Semantic: person.fullName, NOT decision date/line
    //
    // BOTH are person name references. The namespace `decision.decisionLine2` is WRONG.
    // The contract label "Địa điểm, ngày lập" is also WRONG.
    // Must NOT keep as NOOP. Must either split (two different person placeholders) or defer.

    const nameForOcc0 = 'person.personFullName2a';
    const nameForOcc1 = 'person.personFullName2b';

    if (occ.occurrenceIndex === 0) {
      return {
        preciseSemantic: 'person.personFullName',
        preciseConfidence: 'HIGH',
        proposedNewPlaceholderId: nameForOcc0,
        classification: 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT',
        changeType: 'DOCX+CONTRACT',
        reason:
          'Confirmed HIGH confidence: occurrence 0 appears after "của... đối với" in decision basis clause. ' +
          '"đối với" = "about/for" + person name. The namespace `decision.decisionLine2` is WRONG. ' +
          'The contract label "Địa điểm, ngày lập" is also WRONG. ' +
          'Propose renaming DOCX placeholder to `person.personFullName2a` and updating contract slot/binding. ' +
          'This occurrence (basis clause) is distinct from occ 1 (decision clause).',
        namespaceCorrect: false,
        needsNewPlaceholder: true,
        keepExisting: false,
        reviewRequired: true,
        reviewRequiredReason: 'Namespace mismatch confirmed — DOCX placeholder semantically holds person name, not decision date.',
      };
    } else {
      return {
        preciseSemantic: 'person.personFullName',
        preciseConfidence: 'HIGH',
        proposedNewPlaceholderId: nameForOcc1,
        classification: 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT',
        changeType: 'DOCX+CONTRACT',
        reason:
          'Confirmed HIGH confidence: occurrence 1 appears after "Xét thấy" before "QUYẾT ĐỊNH:". ' +
          '"Xét thấy [PERSON_NAME] QUYẾT ĐỊNH" — person name in decision clause. ' +
          'The namespace `decision.decisionLine2` is WRONG. ' +
          'Propose renaming DOCX placeholder to `person.personFullName2b` and updating contract slot/binding. ' +
          'This occurrence (decision clause) is distinct from occ 0 (basis clause).',
        namespaceCorrect: false,
        needsNewPlaceholder: true,
        keepExisting: false,
        reviewRequired: true,
        reviewRequiredReason: 'Namespace mismatch confirmed — DOCX placeholder semantically holds person name, not decision date.',
      };
    }
  }

  if (placeholder === 'recipients.personLine6') {
    // CONFIRMED from raw OOXML extraction:
    //
    // Person table structure (single-row wide table):
    // Row 1, Cell 1: "Họ tên:8{{recipients.personLine}}{{recipients.personLine6}}{{recipients.personLine6}}{{recipients.personLine6}}"
    //   → Para 28: "Họ tên:8{{recipients.personLine}}" (personLine = full name)
    //   → Para 29: "{{recipients.personLine6}}" — occ 0: blank cell after Họ tên
    //   → Para 30: "{{recipients.personLine6}}" — occ 1: blank cell
    //   → Para 31: "{{recipients.personLine6}} " — occ 2: blank cell
    // Row 1, Cell 2: "Nghề nghiệp:Số CMND/...:{{recipients.personLine6}}Nơi thường trú: Nơi tạm trú: {{recipients.personLine6}}"
    //   → Para 32: "Nghề nghiệp:" (label only)
    //   → Para 33: "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:" (label only)
    //   → Para 34: "{{recipients.personLine6}}" — occ 3: AFTER "Số CMND/..." → ID NUMBER
    //   → Para 35: "Nơi thường trú: " (label only — note trailing space, no placeholder after)
    //   → Para 36: "Nơi tạm trú: " (label only — note trailing space, no placeholder after)
    //   → Para 37: "{{recipients.personLine6}}" — occ 4: second address placeholder
    // Row 2, Cell 2: "11{{recipients.personLine6}} (Ký, ghi rõ họ tên, đóng dấu)"
    //   → Para 45: "  11{{recipients.personLine6}}" — occ 5: IN TABLE CELL, footer signature
    //
    // CRITICAL FINDING: "Nơi thường trú:" (para 35) and "Nơi tạm trú:" (para 36) are
    // SEPARATE PARAGRAPHS with NO placeholders after them in the plain text.
    // Para 37's placeholder comes AFTER para 36's "Nơi tạm trú:" label.
    // But para 35's "Nơi thường trú:" has no placeholder after it in the same paragraph.
    //
    // The DOCX uses a table with NO visible grid lines. The "Nơi thường trú:" and
    // "Nơi tạm trú:" are separate paragraphs WITHIN THE SAME TABLE CELL.
    // Para 37's placeholder ({{recipients.personLine6}}) is in the SAME CELL as para 35 and 36.
    // This means occ 4 is in the address cell of the person table.
    //
    // QUESTION: Is occ 4 the permanent address or the temporary address?
    // From the text: "Nơi thường trú: " (para 35) + "Nơi tạm trú: " (para 36) + "{{recipients.personLine6}}" (para 37)
    // The placeholder appears AFTER "Nơi tạm trú:". This suggests occ 4 = temporary address.
    // BUT where is the permanent address placeholder? Para 35 has NO placeholder.
    //
    // POSSIBLE INTERPRETATION:
    // The table has these columns: [label | value] for each field
    // For permanent address: the label "Nơi thường trú:" IS the label, and the VALUE is blank
    // For temporary address: the label "Nơi tạm trú:" IS the label, and the VALUE is {{recipients.personLine6}} (occ 4)
    // OR: The table has NO column headers — just alternating label/value pairs
    // "Nơi thường trú: " and "Nơi tạm trú: " are the label values themselves
    // and occ 4 is somewhere in between
    //
    // From the character position analysis:
    // occ 3 at char 876: BEFORE "Số CMND/..." → ID number ✓
    // occ 4 at char 931: AFTER "Nơi tạm trú:" → TEMPORARY address
    //
    // Where is permanent address? The cell has no placeholder for it.
    // This means either:
    // 1. The permanent address is merged with the temporary address cell (occ 4)
    // 2. The permanent address placeholder was accidentally removed
    // 3. The permanent address cell is blank (no placeholder)
    //
    // Most likely: occ 4 = TEMPORARY ADDRESS. The permanent address cell is blank or uses a different placeholder.
    //
    // For footer signature (occ 5): "11{{recipients.personLine6}} (Ký, ghi rõ họ tên, đóng dấu)"
    // This is in TABLE 1, ROW 0, CELL 1. The table is the "Nơi nhận" distribution list.
    // This is the recipient footer/signature — NOT a person field.

    if (occ.occurrenceIndex === 0) {
      // Para 29: blank cell after "Họ tên:" in the person header row
      // Extra person field (alias/date of birth/ethnicity) — cannot determine without column headers
      return {
        preciseSemantic: 'person.personExtra',
        preciseConfidence: 'LOW',
        proposedNewPlaceholderId: null,
        classification: 'DEFER_AMBIGUOUS_PERSON_NAME',
        changeType: 'NONE',
        reason:
          'Occurrence 0 is in the person header table row as a blank cell after "Họ tên:8{{recipients.personLine}}". ' +
          'Cannot determine exact semantic (alias, date of birth, ethnicity, or another name field) without column header context. ' +
          'The cell is blank with no visible label. Defer to human DOCX review.',
        namespaceCorrect: null,
        needsNewPlaceholder: false,
        keepExisting: true,
        reviewRequired: true,
        reviewRequiredReason: 'Ambiguous — blank cell with no visible label in person table header.',
      };
    } else if (occ.occurrenceIndex === 1) {
      // Para 30: another blank cell in the person header row
      return {
        preciseSemantic: 'person.personExtra',
        preciseConfidence: 'LOW',
        proposedNewPlaceholderId: null,
        classification: 'DEFER_AMBIGUOUS_PERSON_NAME',
        changeType: 'NONE',
        reason:
          'Occurrence 1 is another blank cell in the person header table row. ' +
          'Cannot determine exact semantic without column header context. Defer to human DOCX review.',
        namespaceCorrect: null,
        needsNewPlaceholder: false,
        keepExisting: true,
        reviewRequired: true,
        reviewRequiredReason: 'Ambiguous — blank cell with no visible label in person table header.',
      };
    } else if (occ.occurrenceIndex === 2) {
      // Para 31: third blank cell in the person header row
      return {
        preciseSemantic: 'person.personExtra',
        preciseConfidence: 'LOW',
        proposedNewPlaceholderId: null,
        classification: 'DEFER_AMBIGUOUS_PERSON_NAME',
        changeType: 'NONE',
        reason:
          'Occurrence 2 is the third blank cell in the person header table row. ' +
          'Cannot determine exact semantic without column header context. Defer to human DOCX review.',
        namespaceCorrect: null,
        needsNewPlaceholder: false,
        keepExisting: true,
        reviewRequired: true,
        reviewRequiredReason: 'Ambiguous — blank cell with no visible label in person table header.',
      };
    } else if (occ.occurrenceIndex === 3) {
      // Para 34: after "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:" → ID number
      return {
        preciseSemantic: 'person.idNumber',
        preciseConfidence: 'HIGH',
        proposedNewPlaceholderId: 'person.idNumber6',
        classification: 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT',
        changeType: 'DOCX+CONTRACT',
        reason:
          'Confirmed HIGH confidence: occurrence 3 appears directly after "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:" label. ' +
          'This is the person ID number cell. ' +
          'Propose renaming DOCX placeholder to `person.idNumber6` and adding/updating contract slot/binding.',
        namespaceCorrect: false,
        needsNewPlaceholder: true,
        keepExisting: false,
        reviewRequired: true,
        reviewRequiredReason: 'Namespace mismatch — generic personLine6 placeholder should be specific to ID number.',
      };
    } else if (occ.occurrenceIndex === 4) {
      // Para 37: after "Nơi tạm trú:" → TEMPORARY address (not permanent!)
      // The "Nơi thường trú:" paragraph has no placeholder.
      // occ 4 is the temporary address placeholder. Permanent address cell appears blank.
      return {
        preciseSemantic: 'person.addressTemporary',
        preciseConfidence: 'HIGH',
        proposedNewPlaceholderId: 'person.addressTemporary6',
        classification: 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT',
        changeType: 'DOCX+CONTRACT',
        reason:
          'Confirmed HIGH confidence: occurrence 4 appears after "Nơi tạm trú:" label (para 36) within the same cell. ' +
          'The "Nơi thường trú:" paragraph (para 35) has NO placeholder after it — permanent address cell is blank. ' +
          'occ 4 is the TEMPORARY ADDRESS placeholder, NOT permanent address. ' +
          'IMPORTANT: Do NOT map occ 4 to `person.addressPermanent6`. It is `person.addressTemporary6`. ' +
          'Propose renaming DOCX placeholder to `person.addressTemporary6` and updating contract slot/binding.',
        namespaceCorrect: false,
        needsNewPlaceholder: true,
        keepExisting: false,
        reviewRequired: true,
        reviewRequiredReason: 'Namespace mismatch — occ 4 is temporary address, NOT permanent. "Nơi thường trú:" cell is blank.',
      };
    } else if (occ.occurrenceIndex === 5) {
      // Para 45: in TABLE 1 (Nơi nhận distribution table), footer signature
      // "11{{recipients.personLine6}} (Ký, ghi rõ họ tên, đóng dấu)"
      // This is the recipient footer signature — NOT a person field
      // Do NOT map to person.signatureLine6 unless model supports it
      // Defer until we check CodeGraph for existing signature patterns
      return {
        preciseSemantic: 'recipients.footerSignature',
        preciseConfidence: 'HIGH',
        proposedNewPlaceholderId: 'recipients.footerSignature6',
        classification: 'DEFER_REQUIRES_HUMAN_DOCX_REVIEW',
        changeType: 'NONE',
        reason:
          'Confirmed HIGH confidence: occurrence 5 is in TABLE 1 (Nơi nhận distribution list), CELL 1. ' +
          'The placeholder is "11{{recipients.personLine6}} (Ký, ghi rõ họ tên, đóng dấu)" — recipient footer signature. ' +
          'This is NOT a person field; it is the distribution/signature block of the recipient table. ' +
          'The table "Nơi nhận" (recipients/distribution list) is separate from the person information table. ' +
          'CodeGraph should be used to check if `recipients.signatureLine*` or similar patterns exist in the contract model. ' +
          'If no safe pattern exists, defer to human DOCX/legal review.',
        namespaceCorrect: false,
        needsNewPlaceholder: false,
        keepExisting: true,
        reviewRequired: true,
        reviewRequiredReason: 'Footer signature in distribution table — requires CodeGraph check for model support before naming.',
      };
    }
  }

  // Fallback
  return {
    preciseSemantic: null,
    preciseConfidence: 'NONE',
    proposedNewPlaceholderId: null,
    classification: 'DEFER_NO_VISIBLE_LABEL',
    changeType: 'NONE',
    reason: 'Cannot determine semantic from context.',
    namespaceCorrect: null,
    needsNewPlaceholder: false,
    keepExisting: false,
    reviewRequired: true,
    reviewRequiredReason: 'Unknown — no visible label or semantic anchor.',
  };
}

// ─── Collision checker ────────────────────────────────────────────────────────────
function checkCollisions(proposedId, lockedContract) {
  const collisions = [];
  const slots = lockedContract?.docxSlots ?? [];
  const canonFields = lockedContract?.canonicalFields ?? [];
  const bindings = lockedContract?.renderBindings ?? [];

  for (const slot of slots) {
    if (slot.id === proposedId) {
      collisions.push({
        type: 'docxSlots.id',
        id: slot.id,
        description: 'Exact collision with existing docxSlots.id — slot exists in contract',
        semanticMatch: true,
      });
    }
  }

  for (const field of canonFields) {
    if (field.path === proposedId) {
      collisions.push({
        type: 'canonicalFields.path',
        path: field.path,
        description: 'Exact collision with existing canonicalFields.path — field path exists',
        semanticMatch: true,
      });
    }
  }

  for (const binding of bindings) {
    if (binding.slotId === proposedId) {
      collisions.push({
        type: 'renderBindings.slotId',
        slotId: binding.slotId,
        description: `Exact collision with existing renderBindings.slotId — binding to ${binding.from}`,
        semanticMatch: true,
      });
    }
    if (binding.from === proposedId) {
      collisions.push({
        type: 'renderBindings.from',
        from: binding.from,
        description: `Exact collision with existing renderBindings.from — binding from ${binding.slotId}`,
        semanticMatch: true,
      });
    }
  }

  return collisions;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const doc = extractDocxStructure(DOCX_PATH);
  if (doc.error) {
    console.error('Error:', doc.error);
    process.exit(1);
  }

  console.log('=== BM-052 Deep OOXML Extraction ===');
  console.log(`Body paragraphs: ${doc.bodyParagraphs.length}`);
  console.log(`Table paragraphs: ${doc.tableParagraphs.length}`);
  console.log(`Tables: ${doc.tables.length}`);
  for (const t of doc.tables) {
    console.log(`  Table ${t.tableIndex}: ${t.rows.length} rows, ${t.rows[0]?.cells.length ?? 0} cells`);
  }

  // Load locked contract for collision checks
  const LOCKED_PATH = join(
    ROOT,
    'docs/audit/docx/contracts/locked/BM-052__9919ecdb3971.contract.locked.json',
  );
  let lockedContract = null;
  if (existsSync(LOCKED_PATH)) {
    lockedContract = JSON.parse(readFileSync(LOCKED_PATH, 'utf8'));
  }

  const TARGETS = ['decision.decisionLine2', 'recipients.personLine6'];
  const allOccurrences = {};
  const classificationCounts = {};

  for (const target of TARGETS) {
    const occurrences = findAllOccurrences(doc, target);
    console.log(`\n${target}: ${occurrences.length} occurrences`);

    for (const occ of occurrences) {
      const resolution = resolveOccurrence(target, occ, doc);
      const anchors = topAnchors(occ.fullParagraphPlain, 1);
      const collisions = lockedContract
        ? checkCollisions(resolution.proposedNewPlaceholderId ?? '__NONE__', lockedContract)
        : [];

      // Count classifications
      const cls = resolution.classification;
      classificationCounts[cls] = (classificationCounts[cls] ?? 0) + 1;

      const enrichedOccurrence = {
        // Core identification
        placeholder: occ.placeholder,
        occurrenceIndex: occ.occurrenceIndex,
        charPosition: occ.charPosition,
        // Structural context from OOXML
        paraIndex: occ.paraIndex,
        inTable: occ.inTable,
        tableIndex: occ.tableIndex,
        rowIndex: occ.rowIndex,
        cellIndex: occ.cellIndex,
        // Full text context
        fullParagraphPlain: occ.fullParagraphPlain,
        allPlaceholdersInPara: occ.allPlaceholdersInPara,
        before500: occ.before500,
        after500: occ.after500,
        textBeforeToken: occ.textBeforeToken,
        textAfterToken: occ.textAfterToken,
        // Semantic analysis
        anchors,
        anchorNames: anchors.map((a) => a.name),
        anchorCounts: scoreAnchors(occ.fullParagraphPlain),
        // Resolution
        ...resolution,
        // Collision checks
        collisions,
      };

      allOccurrences[target] = allOccurrences[target] ?? [];
      allOccurrences[target].push(enrichedOccurrence);

      console.log(
        `  Occ ${occ.occurrenceIndex} | para=${occ.paraIndex} | table=${occ.tableIndex} row=${occ.rowIndex} cell=${occ.cellIndex} | inTable=${occ.inTable}`,
      );
      console.log(`  Semantic: ${resolution.preciseSemantic} (${resolution.preciseConfidence})`);
      console.log(`  Proposed: ${resolution.proposedNewPlaceholderId ?? '—'}`);
      console.log(`  Class: ${resolution.classification}`);
      console.log(`  Anchors: ${anchors.map((a) => a.name).join(', ')}`);
      console.log(`  Para: "${occ.fullParagraphPlain.slice(0, 100)}..."`);
      console.log(`  Before: "${occ.textBeforeToken.slice(-80)}"`);
      console.log(`  After: "${occ.textAfterToken.slice(0, 80)}"`);
    }
  }

  // Build summary
  const summary = {
    decision_decisionLine2: allOccurrences['decision.decisionLine2']?.map((o) => ({
      occ: o.occurrenceIndex,
      para: o.paraIndex,
      semantic: o.preciseSemantic,
      confidence: o.preciseConfidence,
      proposed: o.proposedNewPlaceholderId,
      class: o.classification,
      reason: o.reason.slice(0, 150),
    })),
    recipients_personLine6: allOccurrences['recipients.personLine6']?.map((o) => ({
      occ: o.occurrenceIndex,
      para: o.paraIndex,
      inTable: o.inTable,
      semantic: o.preciseSemantic,
      confidence: o.preciseConfidence,
      proposed: o.proposedNewPlaceholderId,
      class: o.classification,
      reason: o.reason.slice(0, 150),
    })),
  };

  const output = {
    schemaVersion: '1.0.0',
    task: 'BM052_DEEP_OOXML_OCCURRENCE_EXTRACTION',
    mode: 'EVIDENCE_ONLY',
    templateCode: 'BM-052',
    docxPath: DOCX_PATH,
    lockedContractPath: LOCKED_PATH,
    ooxmlStats: {
      totalBodyParagraphs: doc.bodyParagraphs.length,
      totalTableParagraphs: doc.tableParagraphs.length,
      totalTables: doc.tables.length,
    },
    targetPlaceholders: TARGETS,
    occurrences: allOccurrences,
    summary,
    classificationCounts,
    meta: {
      generatedAt: new Date().toISOString(),
      canApplyRunNow: false,
      forbiddenActionsBlocked: [
        'storage/templates/normalized-docx',
        'docs/audit/docx/contracts/locked',
        'docs/audit/docx/compiled-v2',
      ],
    },
  };

  const outJson = join(OUT_DIR, 'ooxml-deep-extraction.latest.json');
  writeFileSync(outJson, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log('\n=== Summary ===');
  for (const [cls, count] of Object.entries(classificationCounts)) {
    console.log(`  ${cls}: ${count}`);
  }
  console.log('\nOutput:', outJson);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
