#!/usr/bin/env node
/**
 * scripts/audit/plan-bm063-docx-placeholder-renormalization.mjs
 *
 * Phase 2: OOXML occurrence extraction for BM-063.
 * Extracts all occurrences of document.fullDocumentCode8 and recipients.personLine5
 * from the normalized DOCX, enriches with context, and classifies each occurrence.
 *
 * EVIDENCE_ONLY mode — no mutations.
 *
 * Run: node scripts/audit/plan-bm063-docx-placeholder-renormalization.mjs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const workspaceRequire = createRequire(join(ROOT, 'apps', 'api', 'package.json'));
const PizZip = workspaceRequire('pizzip');

const DOCX_PATH = join(ROOT, 'storage', 'templates', 'normalized-docx', 'BM-063', 'BM-063_normalized.docx');
const CONTRACT_PATH = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked', 'BM-063__54b73110a34f.contract.locked.json');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', 'BM-063');
const EVIDENCE_JSON = join(OUT_DIR, 'evidence.latest.json');
const EVIDENCE_MD = join(OUT_DIR, 'evidence.latest.md');
const PATCH_JSON = join(OUT_DIR, 'patch-plan.latest.json');
const PATCH_MD = join(OUT_DIR, 'patch-plan.latest.md');
const HANDOFF_JSON = join(OUT_DIR, 'planner-handoff.latest.json');
const HANDOFF_MD = join(OUT_DIR, 'planner-handoff.latest.md');

const RISK_PLACEHOLDERS = ['document.fullDocumentCode8', 'recipients.personLine5'];

// ── helpers ─────────────────────────────────────────────────────────────────

function extractAllTextNodes(xml) {
  const results = [];
  const textNodeRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  while ((match = textNodeRegex.exec(xml)) !== null) {
    results.push({ text: match[1], index: match.index });
  }
  return results;
}

function findOccurrences(textNodes, placeholder) {
  const tag = `{{${placeholder}}}`;
  const results = [];
  for (let i = 0; i < textNodes.length; i++) {
    if (textNodes[i].text.includes(tag)) {
      results.push({ textNodeIndex: i, text: textNodes[i].text, pos: textNodes[i].index });
    }
  }
  return results;
}

function buildNeighborhood(textNodes, occIdx, radius = 8) {
  const parts = [];
  for (let i = Math.max(0, occIdx - radius); i < Math.min(textNodes.length, occIdx + radius + 1); i++) {
    const marker = i === occIdx ? '>>>' : '   ';
    parts.push(`${marker}[${i}] ${textNodes[i].text}`);
  }
  return parts.join('\n');
}

function getFullParagraph(xml, occTextNode) {
  const before = xml.substring(0, occTextNode.pos);
  const lastOpenP = before.lastIndexOf('<w:p>');
  const lastOpenP2 = before.lastIndexOf('<w:p ');
  const pStart = Math.max(lastOpenP, lastOpenP2);
  if (pStart < 0) return null;
  const after = xml.substring(occTextNode.pos);
  const nextCloseP = after.indexOf('</w:p>');
  if (nextCloseP < 0) return null;
  const fullP = before.substring(pStart) + after.substring(0, nextCloseP + 7);
  const paraTexts = [];
  const tnRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = tnRegex.exec(fullP)) !== null) {
    paraTexts.push(m[1]);
  }
  return paraTexts.join(' ');
}

function getTableContext(xml, occTextNode) {
  const before = xml.substring(0, occTextNode.pos);
  const lastTc = before.lastIndexOf('<w:tc>');
  const lastTr = before.lastIndexOf('<w:tr>');
  const lastTbl = before.lastIndexOf('<w:tbl>');
  if (lastTc < 0 && lastTr < 0) return null;
  const tblStart = lastTbl >= 0 ? lastTbl : Math.max(lastTc, lastTr);
  const region = xml.substring(tblStart, occTextNode.pos + 500);
  const tnRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const parts = [];
  let m;
  while ((m = tnRegex.exec(region)) !== null) {
    if (m[1].trim()) parts.push(m[1].trim());
  }
  return parts.length > 0 ? parts.join(' | ') : null;
}

function getSurroundingLabels(textNodes, occIdx, direction = 'both', radius = 15) {
  const checkTexts = [];
  if (direction === 'before' || direction === 'both') {
    for (let i = Math.max(0, occIdx - radius); i < occIdx; i++) checkTexts.push(textNodes[i].text);
  }
  if (direction === 'after' || direction === 'both') {
    for (let i = occIdx + 1; i < Math.min(textNodes.length, occIdx + radius + 1); i++) checkTexts.push(textNodes[i].text);
  }
  const combined = checkTexts.join(' ');
  const labelRegex = /\b[A-ZÀ-Ỹ][a-zà-ỹ]*(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]*){0,5}\s*:/g;
  const labels = [];
  let m;
  while ((m = labelRegex.exec(combined)) !== null) {
    const label = m[0].trim();
    if (label.length >= 4) labels.push(label);
  }
  return [...new Set(labels)];
}

// ── classification logic ───────────────────────────────────────────────────

/**
 * Classify document.fullDocumentCode8 occurrences.
 *
 * This placeholder appears 8 times in BM-063 with no slot/binding.
 * The contract has document.fullDocumentCode (singular) with label "Số văn bản".
 *
 * BM-063 is a "Biên bản kê biên tài sản" (asset seizure report) — it references
 * a prior Lệnh/Quyết định that authorized the seizure.
 *
 * Classification depends on whether the occurrence is:
 * 1. The formal document header "Số văn bản" reference (should bind to document.fullDocumentCode)
 * 2. A body reference to the underlying Lệnh/Quyết định (procedural antecedent)
 * 3. A table/asset item reference
 * 4. A person/organization reference
 */
function classifyDocumentFullDocCode8(occ, contract) {
  const nb = occ.neighborhoodText || '';
  const nbLower = nb.toLowerCase();
  const para = occ.fullParagraphText || '';
  const paraLower = para.toLowerCase();

  // FORMAL HEADER: occurrences near "Số văn bản" label in document header
  // The slot's own label "Số văn bản" + singular document.fullDocumentCode slot
  if (nbLower.includes('số văn bản') || paraLower.includes('số văn bản')) {
    return {
      classification: 'REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER',
      confidence: 'MEDIUM',
      inferredSemantic: 'document.fullDocumentCode',
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Visible "Số văn bản" label in neighborhood. Contract has document.fullDocumentCode slot with this label. Proposal: bind this occurrence to document.fullDocumentCode. MEDIUM confidence — same label as existing slot. Requires verifying this is the header occurrence, not a body reference.`
    };
  }

  // BODY PROCEDURAL ANTECEDENT: references to the underlying Lệnh/Quyết định
  // These are NOT the same as the formal header "Số văn bản"
  // They appear in body text referencing the order that authorized the seizure
  if (
    nbLower.includes('lệnh') ||
    nbLower.includes('quyết định') ||
    nbLower.includes('căn cứ') ||
    nbLower.includes('theo lệnh') ||
    nbLower.includes('theo quyết định') ||
    paraLower.includes('căn cứ vào lệnh') ||
    paraLower.includes('căn cứ vào quyết định')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in body text referencing underlying Lệnh/Quyết định procedural antecedent. These are separate from the formal "Số văn bản" header. Semantic requires human DOCX/legal review — should these bind to document.fullDocumentCode (same formal header) or to a different field (e.g., legalBasis.relatedDecisionLine)? Cannot determine from DOCX alone.`
    };
  }

  // KIỂM SÁT VIÊN SUPERSCRIPT REFERENCE: footnote-style reference to Kiểm sát viên
  // These appear as superscript numerals near Kiểm sát viên names
  if (
    nbLower.includes('kiểm sát viên') ||
    nbLower.includes('viện kiểm sát') ||
    paraLower.includes('kiểm sát viên')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears near "Kiểm sát viên" reference — likely a superscript footnote numeral (1, 2, etc.) attached to prosecutor names. NOT the formal document code. Semantic requires human review.`
    };
  }

  // UBND CẤP XÃ REFERENCE: administrative authority reference
  if (
    nbLower.includes('ubnd') ||
    nbLower.includes('uỷ ban nhân dân') ||
    nbLower.includes('cấp xã') ||
    nbLower.includes('cơ quan có thẩm quyền')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears near UBND/cơ quan có thẩm quyền administrative authority reference. NOT the formal document code. Semantic requires human review.`
    };
  }

  // ASSET/PROPERTY TABLE: kê biên tài sản item references
  if (
    nbLower.includes('biên bản') ||
    nbLower.includes('tài sản') ||
    nbLower.includes('kê biên') ||
    nbLower.includes('thu hồi') ||
    nbLower.includes('niêm phong') ||
    nbLower.includes('phong tỏa')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in asset/property table context (kê biên tài sản, tài sản, thu hồi, niêm phong, phong tỏa). NOT the formal document code. Semantic requires human review against TT-03-2026-VKSTC.`
    };
  }

  // Default: no clear semantic — defer
  return {
    classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
    confidence: 'LOW',
    inferredSemantic: null,
    proposedNewPlaceholderId: null,
    reason: `Occurrence ${occ.occurrenceIndex}: document.fullDocumentCode8 with no clear visible label or semantic context. Contract has document.fullDocumentCode (singular) as formal header field, but 8 occurrences suggests DOCX formatting artifact or body references. Cannot approve without human DOCX/legal review.`
  };
}

/**
 * Classify recipients.personLine5 occurrences in BM-063.
 *
 * The contract has recipients.personLine5 (1 slot, label "Người nhận") and
 * recipients.personLine (1 slot, label "Người bị áp dụng").
 *
 * BM-063 has 5 recipients.personLine5 occurrences. The single slot cannot bind all 5.
 * These may be:
 * 1. Table recipient cells (distribution list)
 * 2. Body references to prior recipients
 * 3. Signature/distribution footer
 */
function classifyRecipientsPersonLine5(occ, contract) {
  const nb = occ.neighborhoodText || '';
  const nbLower = nb.toLowerCase();
  const para = occ.fullParagraphText || '';
  const paraLower = para.toLowerCase();

  // SIGNATURE/FOOTER DISTRIBUTION: "(Ký, ghi rõ họ tên, đóng dấu)" pattern
  if (
    nbLower.includes('ký') &&
    (nbLower.includes('ghi rõ họ tên') || nbLower.includes('đóng dấu'))
  ) {
    return {
      classification: 'REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER',
      confidence: 'MEDIUM',
      inferredSemantic: 'signature.signerName',
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Signature footer/distribution context with "(Ký, ghi rõ họ tên, đóng dấu)" label. Proposal: bind to signature.signerName. MEDIUM confidence — matches BM-052/BM-062 footer signature pattern. Only one such occurrence should be in footer.`
    };
  }

  // DISTRIBUTION LIST: multiple recipients in document body
  // These are the people/organizations receiving copies of the biên bản
  if (
    nbLower.includes('người nhận') ||
    nbLower.includes('nơi nhận') ||
    nbLower.includes('phát hành') ||
    paraLower.includes('người nhận') ||
    paraLower.includes('phát hành biên bản')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in distribution list context (người nhận, nơi nhận). BM-063 is a biên bản (report) that gets distributed to multiple recipients. 5 occurrences likely represent 5 distinct distribution targets. Cannot merge into one field. Semantic requires human DOCX/legal review.`
    };
  }

  // PERSON TABLE ROWS: blank cells in recipient/seizure participant table
  if (
    nbLower.includes('họ tên') ||
    nbLower.includes('nghề nghiệp') ||
    nbLower.includes('địa chỉ') ||
    nbLower.includes('người') ||
    nbLower.includes('bị can') ||
    nbLower.includes('người vi phạm')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Blank cell in person/organization table row. 5 such cells likely represent 5 distinct participants in the asset seizure. Cannot merge into one field. Semantic requires human DOCX/legal review.`
    };
  }

  // ASSET/PROPERTY TABLE: rows in kê biên tài sản table
  if (
    nbLower.includes('tài sản') ||
    nbLower.includes('kê biên') ||
    nbLower.includes('biên bản') ||
    nbLower.includes('mô tả')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in asset table context. Should NOT be recipients.personLine5 namespace — likely a description/quantity cell, not a person name. Semantic requires human DOCX/legal review.`
    };
  }

  // Default: no visible label
  return {
    classification: 'DEFER_NO_VISIBLE_LABEL',
    confidence: 'LOW',
    inferredSemantic: null,
    proposedNewPlaceholderId: null,
    reason: `Occurrence ${occ.occurrenceIndex}: No clear visible label or semantic context. 5 occurrences with 1 slot. Cannot determine semantic from DOCX alone. Deferred.`
  };
}

// ── main ─────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  // Load DOCX
  if (!existsSync(DOCX_PATH)) throw new Error(`DOCX not found: ${DOCX_PATH}`);
  const docxBuffer = readFileSync(DOCX_PATH);
  const zip = new PizZip(docxBuffer);
  const documentXml = zip.file('word/document.xml')?.asText();
  if (!documentXml) throw new Error('word/document.xml not found in DOCX');

  // Load contract
  if (!existsSync(CONTRACT_PATH)) throw new Error(`Contract not found: ${CONTRACT_PATH}`);
  const contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));

  // Extract text nodes
  const textNodes = extractAllTextNodes(documentXml);
  console.log(`[BM-063] Text nodes: ${textNodes.length}`);

  // Process each risk placeholder
  const allOccurrences = [];
  for (const placeholder of RISK_PLACEHOLDERS) {
    const occurrences = findOccurrences(textNodes, placeholder);
    console.log(`[BM-063] ${placeholder}: ${occurrences.length} occurrences`);

    for (let i = 0; i < occurrences.length; i++) {
      const occ = occurrences[i];
      const neighborhood = buildNeighborhood(textNodes, occ.textNodeIndex);
      const fullParagraph = getFullParagraph(documentXml, occ);
      const tableContext = getTableContext(documentXml, occ);
      const labels = getSurroundingLabels(textNodes, occ.textNodeIndex);

      const enriched = {
        placeholder,
        occurrenceIndex: i,
        textNodeIndex: occ.textNodeIndex,
        partName: 'word/document.xml',
        fullParagraphText: fullParagraph,
        tableContext,
        neighborhoodText: neighborhood,
        visibleLabels: labels,
        allPlaceholdersInParagraph: (fullParagraph || '').match(/\{\{[^}]+\}\}/g) || [],
      };

      // Classify
      let classification;
      if (placeholder === 'document.fullDocumentCode8') {
        classification = classifyDocumentFullDocCode8(enriched, contract);
      } else if (placeholder === 'recipients.personLine5') {
        classification = classifyRecipientsPersonLine5(enriched, contract);
      }

      allOccurrences.push({ ...enriched, ...classification });
    }
  }

  // Compute classification counts
  const counts = {};
  for (const occ of allOccurrences) {
    counts[occ.classification] = (counts[occ.classification] || 0) + 1;
  }

  // Separate candidates from deferred
  const candidates = allOccurrences.filter(o =>
    o.classification.startsWith('REVIEW_CANDIDATE_')
  );
  const deferred = allOccurrences.filter(o =>
    o.classification.startsWith('DEFER_')
  );

  // Evidence JSON
  const evidence = {
    schemaVersion: '1.0.0',
    task: 'BM063_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    generatedAt: new Date().toISOString(),
    templateCode: 'BM-063',
    sourceId: contract.sourceId || 'BM-063__54b73110a34f',
    riskPlaceholders: RISK_PLACEHOLDERS,
    occurrenceCount: allOccurrences.length,
    classificationCounts: counts,
    occurrences: allOccurrences,
    candidates,
    deferred,
    contractSlots: {
      documentFullDocCode8: {
        exists: (contract.docxSlots || []).some(s => s.slotId === 'document.fullDocumentCode8'),
        note: 'No slot for document.fullDocumentCode8 in contract'
      },
      recipientsPersonLine5: {
        exists: (contract.docxSlots || []).some(s => s.slotId === 'recipients.personLine5'),
        count: (contract.docxSlots || []).filter(s => s.slotId === 'recipients.personLine5').length
      }
    }
  };

  writeFileSync(EVIDENCE_JSON, JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`[BM-063] Evidence: ${EVIDENCE_JSON}`);

  // Evidence MD
  const evidenceMd = `# BM-063 DOCX Placeholder Renormalization Evidence

**Task:** BM063_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Generated:** ${evidence.generatedAt}
**Template:** BM-063 — ${contract.templateTitle || 'Biên bản kê biên tài sản'}

## Summary

| Placeholder | Occurrences | Classifications |
|---|---|---|
${RISK_PLACEHOLDERS.map(ph => {
  const occs = allOccurrences.filter(o => o.placeholder === ph);
  const cands = occs.filter(o => o.classification.startsWith('REVIEW_CANDIDATE_')).length;
  const defs = occs.filter(o => o.classification.startsWith('DEFER_')).length;
  return `| \`${ph}\` | ${occs.length} | candidates=${cands} deferred=${defs} |`;
}).join('\n')}

## Classification Counts

${Object.entries(counts).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

## Candidates

${candidates.length === 0 ? '_None_' : candidates.map(c => `### Occ ${c.occurrenceIndex}: \`${c.placeholder}\`

- **Classification:** ${c.classification}
- **Confidence:** ${c.confidence}
- **Inferred semantic:** ${c.inferredSemantic || 'N/A'}
- **Reason:** ${c.reason}
- **Visible labels:** ${c.visibleLabels?.join(', ') || 'none'}
`).join('\n\n---\n')}

## Deferred

${deferred.length === 0 ? '_None_' : deferred.map(d => `### Occ ${d.occurrenceIndex}: \`${d.placeholder}\`

- **Classification:** ${d.classification}
- **Confidence:** ${d.confidence}
- **Reason:** ${d.reason}
- **Visible labels:** ${d.visibleLabels?.join(', ') || 'none'}
`).join('\n\n---\n')}
`;

  writeFileSync(EVIDENCE_MD, evidenceMd, 'utf8');
  console.log(`[BM-063] Evidence MD: ${EVIDENCE_MD}`);

  // Patch plan JSON
  const patchPlan = {
    schemaVersion: '1.0.0',
    task: 'BM063_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    generatedAt: new Date().toISOString(),
    templateCode: 'BM-063',
    patchCandidates: candidates.map(c => ({
      placeholder: c.placeholder,
      occurrenceIndex: c.occurrenceIndex,
      classification: c.classification,
      confidence: c.confidence,
      inferredSemantic: c.inferredSemantic,
      proposedNewPlaceholder: c.inferredSemantic || null,
      reason: c.reason,
    })),
    deferredItems: deferred.map(d => ({
      placeholder: d.placeholder,
      occurrenceIndex: d.occurrenceIndex,
      classification: d.classification,
      confidence: d.confidence,
      reason: d.reason,
    })),
    safetyAssertions: {
      noDocxMutation: true,
      noContractMutation: true,
      noCompiledMutation: true,
      noDbPublish: true,
      noApprovedDecisions: true,
      canApplyRunNow: false,
    }
  };

  writeFileSync(PATCH_JSON, JSON.stringify(patchPlan, null, 2), 'utf8');
  console.log(`[BM-063] Patch plan: ${PATCH_JSON}`);

  // Patch plan MD
  const patchMd = `# BM-063 Patch Plan

**Task:** BM063_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Generated:** ${patchPlan.generatedAt}

## Candidates (proposed for review, NOT approved)

${patchPlan.patchCandidates.length === 0 ? '_None_' : patchPlan.patchCandidates.map(c =>
    `### \`${c.placeholder}\` occ ${c.occurrenceIndex}

- **Classification:** ${c.classification}
- **Confidence:** ${c.confidence}
- **Proposed path:** \`${c.proposedNewPlaceholder || 'N/A'}\`
- **Reason:** ${c.reason}`
  ).join('\n\n---\n')}

## Deferred (NOT to be touched)

${patchPlan.deferredItems.length === 0 ? '_None_' : patchPlan.deferredItems.map(d =>
    `### \`${d.placeholder}\` occ ${d.occurrenceIndex}

- **Classification:** ${d.classification}
- **Confidence:** ${d.confidence}
- **Reason:** ${d.reason}`
  ).join('\n\n---\n')}
`;

  writeFileSync(PATCH_MD, patchMd, 'utf8');

  // Planner handoff
  const handoff = {
    handoffVersion: '1.0.0',
    task: 'BM063_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    status: 'EVIDENCE_COMPLETE',
    templateCode: 'BM-063',
    canApplyRunNow: false,
    sourcePair: {
      normalizedDocx: DOCX_PATH,
      lockedContract: CONTRACT_PATH,
    },
    renderGateBefore: {
      bindingFidelity: 'FAIL',
      literalFidelity: 'FAIL',
      templatePlaceholdersWithoutSlots: ['document.fullDocumentCode8'],
      templatePlaceholdersWithoutBindings: ['document.fullDocumentCode8'],
      undefinedOrNullLiterals: 8,
    },
    riskPlaceholders: RISK_PLACEHOLDERS,
    occurrenceEvidence: allOccurrences.map(o => ({
      placeholder: o.placeholder,
      occurrenceIndex: o.occurrenceIndex,
      classification: o.classification,
      confidence: o.confidence,
      inferredSemantic: o.inferredSemantic,
      reason: o.reason,
      visibleLabels: o.visibleLabels,
    })),
    classificationCounts: counts,
    proposedCandidates: candidates.map(c => ({
      placeholder: c.placeholder,
      occurrenceIndex: c.occurrenceIndex,
      inferredSemantic: c.inferredSemantic,
      classification: c.classification,
      confidence: c.confidence,
    })),
    deferredItems: deferred.map(d => ({
      placeholder: d.placeholder,
      occurrenceIndex: d.occurrenceIndex,
      classification: d.classification,
      confidence: d.confidence,
    })),
    blockedBmsPreserved: {
      'BM-052': true,
      'BM-062': true,
    },
    safetyAssertions: {
      noDocxMutation: true,
      noLockedContractMutation: true,
      noCompiledV2Mutation: true,
      noDbPublish: true,
      noApprovedDecisions: true,
      sameBmEvidenceOnly: true,
      renderGateUsed: true,
      codeGraphUsedForCodeOnly: true,
      blockedBmsNotMarkedDone: true,
    },
    validation: {
      evidenceScriptRun: true,
      totalOccurrencesExtracted: allOccurrences.length,
      renderGateStatus: 'FAIL',
    },
    plannerDecisionNeeded: {
      singleNextDecision: 'Review BM-063 evidence — are any REVIEW_CANDIDATE occurrences approved for apply? All others deferred to human DOCX/legal review.',
    }
  };

  writeFileSync(HANDOFF_JSON, JSON.stringify(handoff, null, 2), 'utf8');
  console.log(`[BM-063] Handoff: ${HANDOFF_JSON}`);

  const handoffMd = `# BM-063 Planner Handoff

**Task:** BM063_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Status:** EVIDENCE_COMPLETE
**Generated:** ${handoff.generatedAt}

## Summary

| Placeholder | Occurrences | Candidates | Deferred |
|---|---|---|---|
| \`document.fullDocumentCode8\` | ${allOccurrences.filter(o => o.placeholder === 'document.fullDocumentCode8').length} | ${candidates.filter(o => o.placeholder === 'document.fullDocumentCode8').length} | ${deferred.filter(o => o.placeholder === 'document.fullDocumentCode8').length} |
| \`recipients.personLine5\` | ${allOccurrences.filter(o => o.placeholder === 'recipients.personLine5').length} | ${candidates.filter(o => o.placeholder === 'recipients.personLine5').length} | ${deferred.filter(o => o.placeholder === 'recipients.personLine5').length} |

## Classification

${Object.entries(counts).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

## Render Gate (Before)

- Binding fidelity: FAIL
- \`document.fullDocumentCode8\`: 0 slots, 0 bindings → all 8 render as "undefined"
- \`recipients.personLine5\`: 1 slot, 5 DOCX occurrences → 4 render as "undefined"

## Candidates

${candidates.length === 0 ? '_None_' : candidates.map(c =>
    `### \`${c.placeholder}\` occ ${c.occurrenceIndex} → \`${c.inferredSemantic || '?'}\`

${c.reason}`
  ).join('\n\n---\n')}

## Deferred

${deferred.length === 0 ? '_None_' : deferred.map(d =>
    `### \`${d.placeholder}\` occ ${d.occurrenceIndex}: **${d.classification}**

${d.reason}`
  ).join('\n\n---\n')}

## Safety

- [x] No DOCX mutation
- [x] No locked contract mutation
- [x] No compiled-v2 mutation
- [x] No DB publish
- [x] No approved decisions
- [x] BM-052/BM-062 blockers preserved
- [x] canApplyRunNow = false

## Next: Planner Decision

Review candidates. Approve or defer each one.
`;

  writeFileSync(HANDOFF_MD, handoffMd, 'utf8');
  console.log(`[BM-063] Handoff MD: ${HANDOFF_MD}`);
  console.log(`[BM-063] Complete. Candidates=${candidates.length}, Deferred=${deferred.length}`);
}

main().catch(err => {
  console.error(`[BM-063] ERROR: ${err.message}`);
  process.exit(1);
});
