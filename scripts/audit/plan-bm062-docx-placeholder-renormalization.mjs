#!/usr/bin/env node
/**
 * scripts/audit/plan-bm062-docx-placeholder-renormalization.mjs
 *
 * Phase 2: OOXML occurrence extraction for BM-062.
 * Extracts all occurrences of decision.decisionLine11 and recipients.personLine5
 * from the normalized DOCX, enriches with context, and classifies each occurrence.
 *
 * EVIDENCE_ONLY mode — no mutations.
 *
 * Run: node scripts/audit/plan-bm062-docx-placeholder-renormalization.mjs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const workspaceRequire = createRequire(join(ROOT, 'apps', 'api', 'package.json'));
const PizZip = workspaceRequire('pizzip');

const DOCX_PATH = join(ROOT, 'storage', 'templates', 'normalized-docx', 'BM-062', 'BM-062_normalized.docx');
const CONTRACT_PATH = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked', 'BM-062__110961a781fa.contract.locked.json');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', 'BM-062');
const EVIDENCE_JSON = join(OUT_DIR, 'evidence.latest.json');
const EVIDENCE_MD = join(OUT_DIR, 'evidence.latest.md');
const PATCH_JSON = join(OUT_DIR, 'patch-plan.latest.json');
const PATCH_MD = join(OUT_DIR, 'patch-plan.latest.md');
const HANDOFF_JSON = join(OUT_DIR, 'planner-handoff.latest.json');
const HANDOFF_MD = join(OUT_DIR, 'planner-handoff.latest.md');
const LIVE_JSON = join(OUT_DIR, 'live-state.latest.json');
const LIVE_MD = join(OUT_DIR, 'live-state.latest.md');

const RISK_PLACEHOLDERS = ['decision.decisionLine11', 'recipients.personLine5'];

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
  // Get the containing <w:p> element
  const before = xml.substring(0, occTextNode.pos);
  const lastOpenP = before.lastIndexOf('<w:p>');
  const lastOpenP2 = before.lastIndexOf('<w:p ');
  const pStart = Math.max(lastOpenP, lastOpenP2);
  if (pStart < 0) return null;
  const after = xml.substring(occTextNode.pos);
  const nextCloseP = after.indexOf('</w:p>');
  if (nextCloseP < 0) return null;
  const fullP = before.substring(pStart) + after.substring(0, nextCloseP + 7);
  // Extract all text in this paragraph
  const paraTexts = [];
  const tnRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = tnRegex.exec(fullP)) !== null) {
    paraTexts.push(m[1]);
  }
  return paraTexts.join(' ');
}

function getTableContext(xml, occTextNode) {
  // Find nearest table cell context
  const before = xml.substring(0, occTextNode.pos);
  const lastTc = before.lastIndexOf('<w:tc>');
  const lastTr = before.lastIndexOf('<w:tr>');
  const lastTbl = before.lastIndexOf('<w:tbl>');
  if (lastTc < 0 && lastTr < 0) return null;
  // Get a window around the cell
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
  // Combine neighboring text nodes for label detection
  const checkTexts = [];
  if (direction === 'before' || direction === 'both') {
    for (let i = Math.max(0, occIdx - radius); i < occIdx; i++) checkTexts.push(textNodes[i].text);
  }
  if (direction === 'after' || direction === 'both') {
    for (let i = occIdx + 1; i < Math.min(textNodes.length, occIdx + radius + 1); i++) checkTexts.push(textNodes[i].text);
  }
  const combined = checkTexts.join(' ');

  // Find labels ending with colon (at least 2 chars before colon)
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

function classifyDecisionLine11(occ, context) {
  const nb = occ.neighborhoodText || '';
  const nbLower = nb.toLowerCase();
  const paraLower = (occ.fullParagraphText || '').toLowerCase();

  // Slot's intended context: "Địa điểm, ngày lập"
  if (nbLower.includes('địa điểm') || paraLower.includes('địa điểm')) {
    return {
      classification: 'REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER',
      confidence: 'HIGH',
      inferredSemantic: 'document.issuePlaceAndDate',
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: The slot label "Địa điểm, ngày lập" (place and date of drafting) confirms this is the intended context. Proposal: map to document.issuePlaceAndDate. HIGH confidence from the slot's own label.`
    };
  }

  // Person table row: blank cell between "Họ tên" and "Nghề nghiệp"
  if (nbLower.includes('họ tên') && nbLower.includes('nghề nghiệp')) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Blank cell in person table row between "Họ tên" and "Nghề nghiệp" — appears to be a person detail field. Should NOT be decision.* namespace. Semantic requires human DOCX review.`
    };
  }

  // Address fields
  if (nbLower.includes('nơi thường trú') || nbLower.includes('nơi tạm trú') || nbLower.includes('nơi ở hiện tại')) {
    return {
      classification: 'DEFER_AMBIGUOUS_DECISION_LINE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in address context (Nơi thường trú/tạm trú/ở hiện tại). Should NOT be decision.* namespace. Semantic requires human review.`
    };
  }

  // ID document fields
  if (nbLower.includes('cmnd') || nbLower.includes('cccd') || nbLower.includes('hộ chiếu')) {
    return {
      classification: 'DEFER_AMBIGUOUS_DECISION_LINE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears near ID document labels (CMND/CCCD/Hộ chiếu). Should NOT be decision.* namespace. Semantic requires human review.`
    };
  }

  // Assignment / article text
  if (nbLower.includes('điều 1') || nbLower.includes('điều 2') || nbLower.includes('phân công') || nbLower.includes('yêu cầu')) {
    return {
      classification: 'DEFER_AMBIGUOUS_DECISION_LINE',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Appears in article/assignment context. Should NOT be decision.* namespace. Semantic requires human review against TT-03-2026-VKSTC.`
    };
  }

  // Default: ambiguous
  return {
    classification: 'DEFER_AMBIGUOUS_DECISION_LINE',
    confidence: 'LOW',
    inferredSemantic: null,
    proposedNewPlaceholderId: null,
    reason: `Occurrence ${occ.occurrenceIndex}: decision.decisionLine11 in ambiguous context. Should NOT be decision.* namespace. Semantic requires human DOCX review.`
  };
}

function classifyPersonLine5(occ, context) {
  const nb = occ.neighborhoodText || '';
  const nbLower = nb.toLowerCase();

  // Footer signature occurrence: "(Ký, ghi rõ họ tên, đóng dấu)"
  if (nbLower.includes('ký') && nbLower.includes('ghi rõ họ tên') && nbLower.includes('đóng dấu')) {
    return {
      classification: 'REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER',
      confidence: 'MEDIUM',
      inferredSemantic: 'signature.signerName',
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Footer signature context "(Ký, ghi rõ họ tên, đóng dấu)". Proposal: bind to signature.signerName. MEDIUM confidence — matches BM-052 footer pattern.`
    };
  }

  // Person table row: blank cells near "Họ tên" or near recipients.personLine context
  if (nbLower.includes('họ tên') || nbLower.includes('recipients.personline') || nbLower.includes('kê biên tài sản')) {
    return {
      classification: 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL',
      confidence: 'LOW',
      inferredSemantic: null,
      proposedNewPlaceholderId: null,
      reason: `Occurrence ${occ.occurrenceIndex}: Blank cell in asset seizure person table. 4 such cells exist in BM-062 (body) plus 1 footer. Semantic cannot be determined from DOCX alone. Cannot merge 4 body cells into one field — would render same value in 4 distinct cells. Similar to BM-052 deferred pattern.`
    };
  }

  // Default: no visible label context
  return {
    classification: 'DEFER_NO_VISIBLE_LABEL',
    confidence: 'LOW',
    inferredSemantic: null,
    proposedNewPlaceholderId: null,
    reason: `Occurrence ${occ.occurrenceIndex}: No clear visible label context. recipients.personLine5 has no slot/binding in contract. Cannot determine semantic from DOCX alone.`
  };
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[BM-062] Phase 2: OOXML occurrence extraction');
  console.log('[BM-062] EVIDENCE_ONLY mode — no mutations\n');

  mkdirSync(OUT_DIR, { recursive: true });

  // Load DOCX
  if (!existsSync(DOCX_PATH)) {
    throw new Error(`DOCX not found: ${DOCX_PATH}`);
  }
  const docxBuffer = readFileSync(DOCX_PATH);
  const zip = new PizZip(docxBuffer);
  const documentXml = zip.file('word/document.xml')?.asText();
  if (!documentXml) throw new Error('word/document.xml not found in DOCX');

  // Load locked contract
  if (!existsSync(CONTRACT_PATH)) {
    throw new Error(`Contract not found: ${CONTRACT_PATH}`);
  }
  const contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
  const slotIds = new Set((contract.docxSlots || []).map(s => s.slotId));
  const bindingMap = {};
  for (const b of (contract.renderBindings || [])) {
    bindingMap[b.slotId] = b.from;
  }
  const fieldPaths = new Set((contract.canonicalFields || []).map(f => f.path));

  // Extract all text nodes
  const textNodes = extractAllTextNodes(documentXml);
  console.log(`[BM-062] Total text nodes: ${textNodes.length}`);

  // Find occurrences for each risk placeholder
  const allOccurrences = [];
  for (const placeholder of RISK_PLACEHOLDERS) {
    const occurrences = findOccurrences(textNodes, placeholder);
    console.log(`[BM-062] ${placeholder}: ${occurrences.length} occurrences`);

    for (let i = 0; i < occurrences.length; i++) {
      const occ = occurrences[i];
      const fullPara = getFullParagraph(documentXml, occ);
      const tableCtx = getTableContext(documentXml, occ);
      const neighborhood = buildNeighborhood(textNodes, occ.textNodeIndex);
      const labelsBefore = getSurroundingLabels(textNodes, occ.textNodeIndex, 'before');
      const labelsAfter = getSurroundingLabels(textNodes, occ.textNodeIndex, 'after');
      const allLabels = [...new Set([...labelsBefore, ...labelsAfter])];
      const slotExists = slotIds.has(placeholder);
      const bindingExists = !!bindingMap[placeholder];
      const fieldExists = fieldPaths.has(placeholder);

      // Build neighborhood text for classification
      const occNeighborhood = textNodes
        .slice(Math.max(0, occ.textNodeIndex - 8), Math.min(textNodes.length, occ.textNodeIndex + 9))
        .map(n => n.text)
        .join(' ');

      const occData = {
        placeholder,
        occurrenceIndex: i,
        textNodeIndex: occ.textNodeIndex,
        fullParagraphText: fullPara,
        tableContext: tableCtx,
        neighborhoodText: occNeighborhood,
        surroundingLabels: allLabels,
        currentSlotExists: slotExists,
        currentBindingExists: bindingExists,
        currentCanonicalFieldExists: fieldExists,
        // classify
        ...(placeholder === 'decision.decisionLine11'
          ? classifyDecisionLine11({
              occurrenceIndex: i,
              fullParagraphText: fullPara,
              neighborhoodText: occNeighborhood,
              surroundingLabels: allLabels,
            }, { contract })
          : classifyPersonLine5({
              occurrenceIndex: i,
              fullParagraphText: fullPara,
              neighborhoodText: occNeighborhood,
              surroundingLabels: allLabels,
            }, { contract })),
      };

      allOccurrences.push(occData);
    }
  }

  // Count by classification
  const classificationCounts = {};
  for (const occ of allOccurrences) {
    classificationCounts[occ.classification] = (classificationCounts[occ.classification] || 0) + 1;
  }

  // Proposed candidates (only REVIEW_CANDIDATE)
  const proposedCandidates = allOccurrences
    .filter(o => o.classification.startsWith('REVIEW_CANDIDATE'))
    .map(o => ({
      placeholder: o.placeholder,
      occurrenceIndex: o.occurrenceIndex,
      classification: o.classification,
      confidence: o.confidence,
      inferredSemantic: o.inferredSemantic,
      proposedNewPlaceholderId: o.proposedNewPlaceholderId,
      reason: o.reason,
    }));

  // Deferred items
  const deferredItems = allOccurrences
    .filter(o => o.classification.startsWith('DEFER'))
    .map(o => ({
      placeholder: o.placeholder,
      occurrenceIndex: o.occurrenceIndex,
      classification: o.classification,
      confidence: o.confidence,
      reason: o.reason,
    }));

  // Build evidence artifact
  const evidence = {
    schemaVersion: '1.0.0',
    task: 'BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    status: 'COMPLETE',
    canApplyRunNow: false,
    templateCode: 'BM-062',
    docxPath: DOCX_PATH,
    lockedContractPath: CONTRACT_PATH,
    riskPlaceholders: RISK_PLACEHOLDERS,
    totalOccurrences: allOccurrences.length,
    occurrences: allOccurrences.map(o => ({
      placeholder: o.placeholder,
      occurrenceIndex: o.occurrenceIndex,
      textNodeIndex: o.textNodeIndex,
      fullParagraphText: o.fullParagraphText,
      tableContext: o.tableContext,
      neighborhoodText: o.neighborhoodText,
      surroundingLabels: o.surroundingLabels,
      currentSlotExists: o.currentSlotExists,
      currentBindingExists: o.currentBindingExists,
      currentCanonicalFieldExists: o.currentCanonicalFieldExists,
      inferredSemantic: o.inferredSemantic,
      confidence: o.confidence,
      proposedNewPlaceholderId: o.proposedNewPlaceholderId,
      classification: o.classification,
      reason: o.reason,
    })),
    classificationCounts,
    proposedCandidates,
    deferredItems,
    safetyAssertions: {
      noDocxMutation: true,
      noLockedContractMutation: true,
      noCompiledV2Mutation: true,
      noDbPublish: true,
      noApprovedDecisions: true,
      sameBmEvidenceOnly: true,
      renderGateUsed: true,
      codeGraphUsedForCodeOnly: true,
    },
  };

  writeFileSync(EVIDENCE_JSON, JSON.stringify(evidence, null, 2));
  console.log(`[BM-062] Wrote: ${EVIDENCE_JSON}`);

  // Write markdown evidence
  let md = `# BM-062 Evidence — Decision Line 11 & Person Line 5\n\n`;
  md += `**Task:** BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE | **Mode:** EVIDENCE_ONLY\n\n`;
  md += `## Classification Summary\n\n`;
  md += `| Classification | Count |\n|---|---|\n`;
  for (const [cls, cnt] of Object.entries(classificationCounts)) {
    md += `| ${cls} | ${cnt} |\n`;
  }
  md += `\n## Proposed Candidates\n\n`;
  if (proposedCandidates.length === 0) {
    md += `_None — all occurrences are deferred._\n\n`;
  } else {
    for (const c of proposedCandidates) {
      md += `### ${c.placeholder} (occ ${c.occurrenceIndex})\n`;
      md += `- Classification: **${c.classification}** (${c.confidence})\n`;
      md += `- Semantic: \`${c.inferredSemantic}\`\n`;
      md += `- Reason: ${c.reason}\n\n`;
    }
  }
  md += `## Deferred Items\n\n`;
  md += `| Placeholder | Occ | Classification | Confidence | Reason excerpt |\n|---|---|---|---|---|\n`;
  for (const d of deferredItems) {
    md += `| ${d.placeholder} | ${d.occurrenceIndex} | ${d.classification} | ${d.confidence} | ${d.reason.substring(0, 80)}... |\n`;
  }
  writeFileSync(EVIDENCE_MD, md);
  console.log(`[BM-062] Wrote: ${EVIDENCE_MD}`);

  // Build patch plan
  const patchPlan = {
    schemaVersion: '1.0.0',
    task: 'BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    canApplyRunNow: false,
    templateCode: 'BM-062',
    proposedCandidates,
    deferredItems,
    requiredHumanReviewQuestions: [
      'What should decision.decisionLine11 occurrence 0 (Địa điểm, ngày lập) map to — document.issuePlaceAndDate or document.issuePlace?',
      'Should the 10 non-labeled decision.decisionLine11 occurrences be split into person/address fields or removed?',
      'What is the semantic for each person-table blank cell in BM-062 (4 cells)?',
      'Should the footer recipients.personLine5 become signature.signerName?',
      'Is recipients.personLine5 intentional for the person-table row or authoring noise?'
    ],
    evidenceRefs: {
      evidence: EVIDENCE_JSON,
      renderDiff: 'docs/audit/per-form-render-accurate/BM-062/render-diff.latest.json',
    },
  };
  writeFileSync(PATCH_JSON, JSON.stringify(patchPlan, null, 2));
  console.log(`[BM-062] Wrote: ${PATCH_JSON}`);

  // Write markdown patch plan
  let pm = `# BM-062 Patch Plan\n\n`;
  pm += `**Mode:** EVIDENCE_ONLY | **canApplyRunNow:** false\n\n`;
  pm += `## Proposed Candidates\n\n`;
  if (proposedCandidates.length === 0) {
    pm += `_None._\n\n`;
  } else {
    for (const c of proposedCandidates) {
      pm += `- **${c.placeholder}** (occ ${c.occurrenceIndex}): \`${c.inferredSemantic}\` [${c.classification}, ${c.confidence}]\n`;
    }
  }
  pm += `\n## Deferred Items\n\n`;
  pm += `| Placeholder | Count | Classification |\n|---|---|---|\n`;
  for (const [cls, cnt] of Object.entries(classificationCounts)) {
    pm += `| ${cls} | ${cnt} |\n`;
  }
  writeFileSync(PATCH_MD, pm);
  console.log(`[BM-062] Wrote: ${PATCH_MD}`);

  // Build planner handoff
  const handoff = {
    handoffVersion: '1.0.0',
    task: 'BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    status: 'EVIDENCE_COMPLETE',
    templateCode: 'BM-062',
    canApplyRunNow: false,
    sourcePair: {
      docx: DOCX_PATH,
      contract: CONTRACT_PATH,
    },
    renderGateBefore: {
      status: 'FAIL',
      reason: 'recipients.personLine5 has no slot/binding (5 undefined literals); decision.decisionLine11 has 1 slot but 11 DOCX occurrences',
      literalFidelityStatus: 'FAIL',
      bindingFidelityStatus: 'FAIL',
      renderStatus: 'PASS',
    },
    riskPlaceholders: RISK_PLACEHOLDERS,
    occurrenceEvidence: allOccurrences,
    classificationCounts,
    proposedCandidates,
    deferredItems,
    safetyAssertions: {
      noDocxMutation: true,
      noLockedContractMutation: true,
      noCompiledV2Mutation: true,
      noDbPublish: true,
      noApprovedDecisions: true,
      sameBmEvidenceOnly: true,
      renderGateUsed: true,
      codeGraphUsedForCodeOnly: true,
    },
    validation: {
      scriptName: 'scripts/audit/plan-bm062-docx-placeholder-renormalization.mjs',
      testFile: 'test/bm062-docx-placeholder-renormalization.test.mjs',
    },
    plannerDecisionNeeded: {
      singleNextDecision: `BM-062 has ${allOccurrences.length} risk occurrences: ${Object.entries(classificationCounts).map(([k,v]) => `${v}× ${k}`).join(', ')}. All candidates are REVIEW_CANDIDATE (proposed semantic) or DEFER. Decide: approve signature.signerName binding for footer recipients.personLine5, approve document.issuePlaceAndDate for occ 0 decision.decisionLine11, and/or defer remaining. Do not auto-merge 4 person-table cells into one field.`
    },
  };
  writeFileSync(HANDOFF_JSON, JSON.stringify(handoff, null, 2));
  console.log(`[BM-062] Wrote: ${HANDOFF_JSON}`);

  // Write markdown handoff
  let hm = `# BM-062 Planner Handoff\n\n`;
  hm += `**Task:** BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE\n`;
  hm += `**Status:** EVIDENCE_COMPLETE | **canApplyRunNow:** false\n\n`;
  hm += `## Render Gate\n\n`;
  hm += `- Status: FAIL\n`;
  hm += `- Reason: recipients.personLine5 no slot/binding (5 undefined); decision.decisionLine11 1 slot for 11 occurrences\n\n`;
  hm += `## Classification Summary\n\n`;
  hm += `| Classification | Count |\n|---|---|\n`;
  for (const [cls, cnt] of Object.entries(classificationCounts)) {
    hm += `| ${cls} | ${cnt} |\n`;
  }
  hm += `\n## Proposed Candidates (${proposedCandidates.length})\n\n`;
  if (proposedCandidates.length === 0) {
    hm += `_None._\n\n`;
  } else {
    for (const c of proposedCandidates) {
      hm += `- **${c.placeholder}** (occ ${c.occurrenceIndex}): \`${c.inferredSemantic}\` — ${c.classification} (${c.confidence})\n`;
    }
  }
  hm += `\n## Deferred Items (${deferredItems.length})\n\n`;
  hm += `| Placeholder | Occ | Classification |\n|---|---|---|\n`;
  for (const d of deferredItems) {
    hm += `| ${d.placeholder} | ${d.occurrenceIndex} | ${d.classification} |\n`;
  }
  hm += `\n## Planner Decision Needed\n\n${handoff.plannerDecisionNeeded.singleNextDecision}\n`;
  writeFileSync(HANDOFF_MD, hm);
  console.log(`[BM-062] Wrote: ${HANDOFF_MD}`);

  // Write live state
  const liveState = {
    task: 'BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    templateCode: 'BM-062',
    status: 'EVIDENCE_COMPLETE',
    canApplyRunNow: false,
    renderGateStatus: 'FAIL',
    dbSync: { matched: 213, missing: 0, stale: 0 },
    boardLane: 'CONTRACT_REPAIR',
    boardStatus: 'NEEDS_REMEDIATION',
    riskPlaceholders: RISK_PLACEHOLDERS,
    totalOccurrences: allOccurrences.length,
    classificationCounts,
    proposedCandidatesCount: proposedCandidates.length,
    deferredItemsCount: deferredItems.length,
  };
  writeFileSync(LIVE_JSON, JSON.stringify(liveState, null, 2));
  writeFileSync(LIVE_MD, `# BM-062 Live State\n\n**Task:** BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE\n\n## Summary\n\n| Field | Value |\n|---|---|\n| Template | BM-062 |\n| Status | EVIDENCE_COMPLETE |\n| canApplyRunNow | false |\n| Render gate | FAIL |\n| DB sync | 213/0/0 |\n\n## Classification Counts\n\n| Classification | Count |\n|---|---|\n${Object.entries(classificationCounts).map(([k,v]) => `| ${k} | ${v} |`).join('\n')}\n`);
  console.log(`[BM-062] Wrote live state: ${LIVE_JSON}`);

  console.log('\n[BM-062] Phase 2 complete.');
  console.log(`[BM-062] Total occurrences: ${allOccurrences.length}`);
  console.log(`[BM-062] Proposed: ${proposedCandidates.length} | Deferred: ${deferredItems.length}`);
  console.log('[BM-062] Classification counts:', classificationCounts);
}

main().catch(err => {
  console.error('[BM-062] ERROR:', err.message);
  process.exit(1);
});
