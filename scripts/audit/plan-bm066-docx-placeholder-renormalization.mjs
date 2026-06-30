#!/usr/bin/env node
/**
 * scripts/audit/plan-bm066-docx-placeholder-renormalization.mjs
 *
 * Phase 2: OOXML occurrence extraction for BM-066.
 * Extracts all occurrences of recipients.personLine4 and document.fullDocumentCode4
 * from the normalized DOCX, enriches with context, and classifies each occurrence.
 *
 * EVIDENCE_ONLY mode — no mutations.
 *
 * Run: node scripts/audit/plan-bm066-docx-placeholder-renormalization.mjs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const workspaceRequire = createRequire(join(ROOT, 'apps', 'api', 'package.json'));
const PizZip = workspaceRequire('pizzip');

const DOCX_PATH = join(ROOT, 'storage', 'templates', 'normalized-docx', 'BM-066', 'BM-066_normalized.docx');
const CONTRACT_PATH = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked', 'BM-066__e3bc56081554.contract.locked.json');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', 'BM-066');
const EVIDENCE_JSON = join(OUT_DIR, 'evidence.latest.json');
const EVIDENCE_MD = join(OUT_DIR, 'evidence.latest.md');
const PATCH_JSON = join(OUT_DIR, 'patch-plan.latest.json');
const PATCH_MD = join(OUT_DIR, 'patch-plan.latest.md');
const HANDOFF_JSON = join(OUT_DIR, 'planner-handoff.latest.json');
const HANDOFF_MD = join(OUT_DIR, 'planner-handoff.latest.md');
const LIVE_JSON = join(OUT_DIR, 'live-state.latest.json');
const LIVE_MD = join(OUT_DIR, 'live-state.latest.md');

const RISK_PLACEHOLDERS = ['recipients.personLine4', 'document.fullDocumentCode4'];

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
  const region = xml.substring(tblStart, occTextNode.pos + 600);
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
 * Classify document.fullDocumentCode4 occurrences in BM-066.
 *
 * Prior DOCX remediation investigation (PRIOR-DXR-002) classified this as
 * DOCX_REAUTHOR_REQUIRED: body/procedural context, canonical field already exists.
 *
 * The contract has document.fullDocumentCode (singular, 1 slot) and
 * document.fullDocumentCode4 (1 slot, label "Số văn bản"). 4 DOCX occurrences.
 *
 * Classification depends on whether occurrence is:
 * 1. The formal header "Số văn bản" reference (bindable to document.fullDocumentCode)
 * 2. A body procedural reference to underlying Lệnh/account freeze order
 * 3. A bank/account/organization entity reference
 */
function classifyDocumentFullDocCode4(occ, contract) {
  const nb = occ.neighborhoodText || '';
  const nbLower = nb.toLowerCase();
  const para = occ.fullParagraphText || '';
  const paraLower = para.toLowerCase();

  // FORMAL HEADER: occurrence near formal "Số văn bản" label
  // The singular document.fullDocumentCode slot has label "Số văn bản"
  if (nbLower.includes('số văn bản') || paraLower.includes('số văn bản')) {
    return {
      classification: 'REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER',
      confidence: 'MEDIUM',
      inferredSemantic: 'document.fullDocumentCode',
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Visible "Số văn bản" label in neighborhood. Contract has document.fullDocumentCode slot with this label. Proposal: bind this occurrence to document.fullDocumentCode. MEDIUM confidence — same label as singular slot. Requires verifying this is the header occurrence, not a body reference.`
    };
  }

  // BANK/ACCOUNT/ORGANIZATION CONTEXT: Lệnh phong tỏa tài khoản involves
  // freezing bank accounts of an entity (tổ chức tín dụng, kho bạc nhà nước)
  if (
    nbLower.includes('tổ chức tín dụng') ||
    nbLower.includes('kho bạc nhà nước') ||
    nbLower.includes('tài khoản') ||
    nbLower.includes('ngân hàng') ||
    nbLower.includes('phong tỏa') ||
    nbLower.includes('ngân hàng nhà nước') ||
    paraLower.includes('tài khoản của')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.`
    };
  }

  // PROCEDURAL ANTECEDENT: body text referencing underlying legal basis
  if (
    nbLower.includes('lệnh') ||
    nbLower.includes('căn cứ') ||
    nbLower.includes('xét thấy') ||
    nbLower.includes('yêu cầu') ||
    nbLower.includes('quyết định')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in body procedural context (căn cứ, lệnh, yêu cầu). NOT the formal document code. Semantic requires human DOCX/legal review against TT-03-2026-VKSTC.`
    };
  }

  // KIỂM SÁT VIÊN FOOTNOTE: superscript numeral near prosecutor name
  if (
    nbLower.includes('kiểm sát viên') ||
    nbLower.includes('viện kiểm sát')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears near "Kiểm sát viên" reference — likely a superscript footnote numeral attached to prosecutor name. NOT the formal document code. Semantic requires human review.`
    };
  }

  // Default: ambiguous
  return {
    classification: 'DEFER_AMBIGUOUS_DOCUMENT_CODE',
    confidence: 'LOW',
    inferredSemantic: null,
    proposedNewPlaceholderId: null,
    reason: `Occurrence ${occ.occurrenceIndex}: document.fullDocumentCode4 in ambiguous context. 4 DOCX occurrences with 1 slot. Cannot determine semantic from DOCX alone. Prior DOCX remediation investigation classified this pattern as DOCX_REAUTHOR_REQUIRED. Deferred.`
  };
}

/**
 * Classify recipients.personLine4 occurrences in BM-066.
 *
 * Prior DOCX remediation investigation classified this as DEFER_NO_CONTEXT:
 * generic blank filler slots, no visible Vietnamese label.
 *
 * BM-066 is Lệnh phong tỏa tài khoản (account freeze order).
 * The table likely contains:
 * - A recipient/organization row (tổ chức tín dụng, kho bạc)
 * - The actual account holder row
 * - Custodian rows
 *
 * 4 DOCX occurrences, 0 slots, 0 bindings — all render as "undefined".
 */
function classifyRecipientsPersonLine4(occ, contract) {
  const nb = occ.neighborhoodText || '';
  const nbLower = nb.toLowerCase();
  const labels = occ.visibleLabels || [];

  // PRIORITY 1: Check visible labels first — avoid substring artifacts like "Lưu:" matching "ký"
  const hasLabel = (needle) =>
    labels.some(l => l.toLowerCase().includes(needle));

  const explicitSig = labels.some(l =>
    l.toLowerCase().includes('ký') &&
    (l.toLowerCase().includes('ghi rõ') || l.toLowerCase().includes('đóng dấu'))
  );
  const explicitDist = labels.some(l =>
    l.toLowerCase().includes('người nhận') ||
    l.toLowerCase().includes('nơi nhận')
  );

  if (explicitSig) {
    return {
      classification: 'REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER',
      confidence: 'MEDIUM',
      inferredSemantic: 'signature.signerName',
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Explicit "(Ký, ghi rõ họ tên, đóng dấu)" label in visibleLabels (${labels.join(', ')}). Proposal: bind to signature.signerName. MEDIUM confidence — matches BM-052/BM-062/BM-063 footer signature pattern.`
    };
  }

  if (explicitDist) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Explicit distribution list label in visibleLabels (${labels.join(', ')}). Cannot bind as one shared semantic.`
    };
  }

  if (hasLabel('tài sản') || hasLabel('giao cho') || hasLabel('bảo quản')) {
    return {
      classification: 'DEFER_AMBIGUOUS_ACCOUNT_FIELD',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Visible label indicates bank/account freeze custodian role (${labels.join(', ')}). Should NOT be recipients.personLine4.`
    };
  }

  if (hasLabel('họ tên') || hasLabel('tên gọi') || hasLabel('nghề nghiệp') ||
      hasLabel('địa chỉ') || hasLabel('tài khoản của')) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Visible label for person/organization table cell (${labels.join(', ')}). Cannot merge into one field.`
    };
  }

  // PRIORITY 2: Neighborhood patterns — only if no visible label matched
  //
  // BM-066 occ 3 has neighborhood showing:
  //   "Lưu: ... {{recipients.personLine4}} (Ký, ghi rõ họ tên, đóng dấu)"
  // This is the Nơi nhận / Lưu: distribution footer section, NOT a formal signer.
  // The "(Ký, ghi rõ họ tên, đóng dấu)" is administrative boilerplate in every
  // Vietnamese legal document distribution list — it does NOT mean this slot is a signer.
  // It must NOT be bound to signature.signerName. Check distribution context first.

  // Nơi nhận / Lưu distribution context
  const isDistributionFooter =
    (nbLower.includes('lưu:') || nbLower.includes('nơi nhận') || nbLower.includes('người nhận')) &&
    (nbLower.includes('ký') || nbLower.includes('họ tên'));

  if (isDistributionFooter) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Nơi nhận / Lưu: distribution footer with "(Ký, ghi rõ họ tên, đóng dấu)" — administrative boilerplate. NOT a formal signer slot. Field is labeled "Người nhận". Semantic requires human DOCX/legal review: is the recipient also the signer, or a separate organization/custodian?`
    };
  }

  // Formal signer context — separate signature section with explicit signer role
  const formalSig = nbLower.includes('ký') &&
    (nbLower.includes('ghi rõ họ tên') || nbLower.includes('đóng dấu')) &&
    (nbLower.includes('viện kiểm sát') || nbLower.includes('kiểm sát viên') ||
     nbLower.includes('thủ trưởng') || nbLower.includes('giám đốc') ||
     nbLower.includes('chủ tịch') || nbLower.includes('công chứng'));

  if (formalSig) {
    return {
      classification: 'REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER',
      confidence: 'MEDIUM',
      inferredSemantic: 'signature.signerName',
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Formal signer context with explicit role (viện kiểm sát / kiểm sát viên / thủ trưởng) + "(Ký, ghi rõ họ tên, đóng dấu)". Proposal: bind to signature.signerName. MEDIUM confidence.`
    };
  }

  if (
    nbLower.includes('tài sản') ||
    nbLower.includes('giao cho') ||
    nbLower.includes('phong tỏa') ||
    nbLower.includes('bảo quản')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_ACCOUNT_FIELD',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in bank/account freeze context. Should NOT be recipients.personLine4.`
    };
  }

  if (
    nbLower.includes('người nhận') ||
    nbLower.includes('nơi nhận') ||
    nbLower.includes('phát hành')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in distribution list context (người nhận, nơi nhận). Cannot merge into one field.`
    };
  }

  if (
    nbLower.includes('họ tên') ||
    nbLower.includes('tên gọi') ||
    nbLower.includes('nghề nghiệp') ||
    nbLower.includes('địa chỉ') ||
    nbLower.includes('tài khoản của')
  ) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Blank cell in person/organization table row. No visible label. Cannot merge into one field.`
    };
  }

  return {
    classification: 'DEFER_NO_VISIBLE_LABEL',
    confidence: 'LOW',
    inferredSemantic: null,
    proposedNewPlaceholderId: null,
    reason: `Occurrence ${occ.occurrenceIndex}: No clear visible label. recipients.personLine4 has 0 slots and 0 bindings. 4 DOCX occurrences with no semantic distinction. Prior investigation classified as DEFER_NO_CONTEXT.`
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
  console.log(`[BM-066] Text nodes: ${textNodes.length}`);

  // Process each risk placeholder
  const allOccurrences = [];
  for (const placeholder of RISK_PLACEHOLDERS) {
    const occurrences = findOccurrences(textNodes, placeholder);
    console.log(`[BM-066] ${placeholder}: ${occurrences.length} occurrences`);

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
      if (placeholder === 'document.fullDocumentCode4') {
        classification = classifyDocumentFullDocCode4(enriched, contract);
      } else if (placeholder === 'recipients.personLine4') {
        classification = classifyRecipientsPersonLine4(enriched, contract);
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
    task: 'BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    generatedAt: new Date().toISOString(),
    templateCode: 'BM-066',
    sourceId: contract.sourceId || 'BM-066__e3bc56081554',
    riskPlaceholders: RISK_PLACEHOLDERS,
    occurrenceCount: allOccurrences.length,
    classificationCounts: counts,
    occurrences: allOccurrences,
    candidates,
    deferred,
    contractSlots: {
      documentFullDocCode4: {
        exists: (contract.docxSlots || []).some(s => s.slotId === 'document.fullDocumentCode4'),
        label: 'Số văn bản',
        note: '1 slot exists for document.fullDocumentCode4, but 4 DOCX occurrences exist'
      },
      documentFullDocCode: {
        exists: (contract.docxSlots || []).some(s => s.slotId === 'document.fullDocumentCode'),
        label: 'Số văn bản',
        note: 'Singular form, separate from document.fullDocumentCode4'
      },
      recipientsPersonLine4: {
        exists: (contract.docxSlots || []).some(s => s.slotId === 'recipients.personLine4'),
        label: 'Người nhận',
        note: 'No slot in contract — 4 DOCX occurrences render as "undefined"'
      }
    }
  };

  writeFileSync(EVIDENCE_JSON, JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`[BM-066] Evidence: ${EVIDENCE_JSON}`);

  // Evidence MD
  const evidenceMd = `# BM-066 DOCX Placeholder Renormalization Evidence

**Task:** BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Generated:** ${evidence.generatedAt}
**Template:** BM-066 — ${contract.templateTitle || 'Lệnh phong tỏa tài khoản'}

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
  console.log(`[BM-066] Evidence MD: ${EVIDENCE_MD}`);

  // Patch plan JSON
  const patchPlan = {
    schemaVersion: '1.0.0',
    task: 'BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    generatedAt: new Date().toISOString(),
    templateCode: 'BM-066',
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
  console.log(`[BM-066] Patch plan: ${PATCH_JSON}`);

  // Patch plan MD
  const patchMd = `# BM-066 Patch Plan

**Task:** BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
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
  const handoffGeneratedAt = new Date().toISOString();
  const handoff = {
    handoffVersion: '1.0.0',
    generatedAt: handoffGeneratedAt,
    task: 'BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    status: 'EVIDENCE_COMPLETE',
    templateCode: 'BM-066',
    canApplyRunNow: false,
    sourcePair: {
      normalizedDocx: DOCX_PATH,
      lockedContract: CONTRACT_PATH,
    },
    renderGateBefore: {
      bindingFidelity: 'FAIL',
      literalFidelity: 'FAIL',
      templatePlaceholdersWithoutSlots: ['recipients.personLine4'],
      templatePlaceholdersWithoutBindings: ['recipients.personLine4'],
      undefinedOrNullLiterals: 4,
      textFidelity: 'PASS',
      structureFidelity: 'PASS',
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
      'BM-063': true,
    },
    occurrenceCount: allOccurrences.length,
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
      singleNextDecision: 'Review BM-066 evidence — are any REVIEW_CANDIDATE occurrences approved for apply? If candidates exist, propose small guarded apply. If all deferred, close as human-review blocker and select next BM.'
    }
  };

  writeFileSync(HANDOFF_JSON, JSON.stringify(handoff, null, 2), 'utf8');
  console.log(`[BM-066] Handoff: ${HANDOFF_JSON}`);

  const handoffMd = `# BM-066 Planner Handoff

**Task:** BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Status:** EVIDENCE_COMPLETE
**Generated:** ${handoff.generatedAt}

## Summary

| Placeholder | Occurrences | Candidates | Deferred |
|---|---|---|---|
| \`recipients.personLine4\` | ${allOccurrences.filter(o => o.placeholder === 'recipients.personLine4').length} | ${candidates.filter(o => o.placeholder === 'recipients.personLine4').length} | ${deferred.filter(o => o.placeholder === 'recipients.personLine4').length} |
| \`document.fullDocumentCode4\` | ${allOccurrences.filter(o => o.placeholder === 'document.fullDocumentCode4').length} | ${candidates.filter(o => o.placeholder === 'document.fullDocumentCode4').length} | ${deferred.filter(o => o.placeholder === 'document.fullDocumentCode4').length} |

## Classification

${Object.entries(counts).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

## Render Gate (Before)

- Binding fidelity: FAIL
- \`recipients.personLine4\`: 0 slots, 0 bindings → all 4 render as "undefined"
- \`document.fullDocumentCode4\`: 4 DOCX occurrences, 1 slot

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
- [x] BM-052/BM-062/BM-063 blockers preserved
- [x] canApplyRunNow = false

## Next: Planner Decision

Review candidates. Approve or defer each one.
If candidates exist with HIGH/MEDIUM confidence and strong same-BM evidence, propose a small guarded apply.
If all deferred, close as BLOCKED_BY_HUMAN_DOCX_REVIEW.
`;

  writeFileSync(HANDOFF_MD, handoffMd, 'utf8');
  console.log(`[BM-066] Handoff MD: ${HANDOFF_MD}`);
  console.log(`[BM-066] Complete. Candidates=${candidates.length}, Deferred=${deferred.length}`);
}

main().catch(err => {
  console.error(`[BM-066] ERROR: ${err.message}`);
  process.exit(1);
});
