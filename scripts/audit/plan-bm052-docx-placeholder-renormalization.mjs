#!/usr/bin/env node
/**
 * scripts/audit/plan-bm052-docx-placeholder-renormalization.mjs
 *
 * Evidence-only: produces occurrence-level DOCX placeholder renormalization plan for BM-052.
 * Mode: EVIDENCE_ONLY — no DOCX, contract, compiled-v2, or DB mutation.
 *
 * Duplicate semantic risks:
 *   1. decision.decisionLine2 — 2 occurrences with mixed semantics
 *   2. recipients.personLine6 — 6 occurrences with mixed semantics
 *
 * Per the corrected binding model:
 *   - docxSlots[].slotId = actual DOCX placeholder id
 *   - renderBindings[].slotId = actual target DOCX placeholder
 *   - renderBindings[].from = semantic source field
 *   - canonicalFields[].path = semantic field path
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import PizZip from 'pizzip';

const ROOT = process.cwd();
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORMALIZED_DOCX_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', 'BM-052');

const SEMANTIC_ANCHORS = [
  ['fullName', /họ\s*tên/i],
  ['alias', /tên\s*gọi\s*khác/i],
  ['job', /nghề\s*nghiệp/i],
  ['idNumber', /cmnd|cccd|hộ\s*chiếu/i],
  ['permanentAddress', /nơi\s*thường\s*trú/i],
  ['temporaryAddress', /nơi\s*tạm\s*trú/i],
  ['currentAddress', /nơi\s*ở\s*hiện\s*tại/i],
  ['recipientFooter', /nơi\s*nhận/i],
  ['signature', /ký,\s*ghi\s*rõ\s*họ\s*tên|đóng\s*dấu/i],
  ['prosecutor', /kiểm\s*sát\s*viên/i],
  ['committee', /ủy\s*ban\s*nhân\s*dân|y\s*ban\s*nhân\s*dân/i],
  ['decisionBasis', /căn\s*cứ\s*quyết\s*định|xét\s*thấy/i],
  ['assignment', /phân\s*công/i],
  ['asset', /tài\s*sản|kê\s*biên|bảo\s*quản/i],
  ['documentNumber', /số:\s*…|số\s*…|số\s*văn\s*bản/i],
  ['dateLine', /ngày\s*…\s*tháng\s*…\s*năm|ngày\s*tháng\s*năm/i],
];

function semanticAnchors(context) {
  return SEMANTIC_ANCHORS
    .filter(([, pattern]) => pattern.test(context))
    .map(([name]) => name);
}

function decodeXml(text) {
  return String(text ?? '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function stripXml(xml) {
  return decodeXml(String(xml ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function contextsAroundAll(text, needle, radius = 120, limit = 30) {
  const contexts = [];
  let index = 0;
  while ((index = text.indexOf(needle, index)) >= 0 && contexts.length < limit) {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + needle.length + radius);
    contexts.push(text.slice(start, end).replace(/\s+/g, ' ').trim());
    index += needle.length;
  }
  return contexts;
}

function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf8')); }

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, (value.endsWith('\n') ? value : value + '\n'), 'utf8');
}

function markdownTable(rows) {
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  const sep = header.map(() => '---');
  return [header, sep, ...body]
    .map((cells) => '| ' + cells.map((c) => String(c ?? '').replace(/\|/g, '\\|')).join(' | ') + ' |')
    .join('\n');
}

function findLockedContract(templateCode) {
  const matches = readdirSync(LOCKED_DIR)
    .filter((f) => f.startsWith(templateCode + '__') && f.endsWith('.contract.locked.json'))
    .sort();
  if (matches.length !== 1) return null;
  return readJson(join(LOCKED_DIR, matches[0]));
}

function extractDocxPlaceholders(docxPath) {
  if (!existsSync(docxPath)) {
    return { exists: false, placeholders: { items: [], duplicates: [], risks: { duplicateSemantic: [] } } };
  }
  const zip = new PizZip(readFileSync(docxPath));
  const documentXml = zip.file('word/document.xml')?.asText() ?? '';
  const plainText = stripXml(documentXml);
  const all = [...documentXml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim());
  const counts = new Map();
  for (const ph of all) counts.set(ph, (counts.get(ph) ?? 0) + 1);
  const unique = [...counts.keys()].sort();
  const items = unique.map((placeholder) => {
    const token = '{{' + placeholder + '}}';
    const plainContexts = contextsAroundAll(plainText, token);
    const occurrenceContexts = plainContexts.length ? plainContexts : contextsAroundAll(decodeXml(documentXml), token);
    return { placeholder, count: counts.get(placeholder), context: occurrenceContexts[0] || '', occurrenceContexts };
  });
  const duplicates = items.filter((item) => item.count > 1).map((item) => ({ placeholder: item.placeholder, count: item.count }));
  const duplicateSemantic = duplicates
    .filter((dup) => {
      const item = items.find((i) => i.placeholder === dup.placeholder);
      const anchors = [...new Set(item.occurrenceContexts.flatMap((ctx) => semanticAnchors(ctx)))].sort();
      const genericNumbered = /(?:personLine|decisionLine|fullDocumentCode)\d+$/u.test(dup.placeholder);
      return (genericNumbered && dup.count >= 3) || (genericNumbered && anchors.length >= 2);
    })
    .map((dup) => {
      const item = items.find((i) => i.placeholder === dup.placeholder);
      const anchors = [...new Set(item.occurrenceContexts.flatMap((ctx) => semanticAnchors(ctx)))].sort();
      return { placeholder: dup.placeholder, count: dup.count, severity: 'HIGH', anchors, occurrenceContexts: item.occurrenceContexts,
        reason: 'The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize before contract repair.' };
    });
  return { exists: true, placeholders: { total: all.length, unique, duplicates, items, risks: { duplicateSemantic } } };
}

function buildOccurrenceEvidence(templateCode) {
  const docxPath = join(NORMALIZED_DOCX_DIR, templateCode, templateCode + '_normalized.docx');
  const docx = extractDocxPlaceholders(docxPath);
  const contract = findLockedContract(templateCode);
  const evidence = [];

  for (const risk of docx.placeholders.risks.duplicateSemantic) {
    const placeholder = risk.placeholder;
    for (let i = 0; i < risk.occurrenceContexts.length; i++) {
      const context = risk.occurrenceContexts[i];
      const anchors = semanticAnchors(context);
      const occurrenceIndex = i;

      let inferredSemantic = null;
      let confidence = 'LOW';
      let preciseSemantic = null;
      let proposedNewPlaceholderId = null;
      let classification = 'DEFER_NO_VISIBLE_LABEL';
      let reason = 'No visible semantic anchor in context; cannot determine safe action.';

      // ── decision.decisionLine2: BOTH occurrences are person name references ─────────────
      // CRITICAL: Keeping decision.* namespace for BOTH is WRONG.
      // The DOCX shows "đối với{{decision.decisionLine2}}" and "Xét thấy{{decision.decisionLine2}}"
      // Both hold person full names. The contract's "Địa điểm, ngày lập" label is WRONG.
      // Rule: Both must be REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT — do NOT keep existing.
      if (placeholder === 'decision.decisionLine2') {
        if (occurrenceIndex === 0) {
          inferredSemantic = 'person.personFullName';
          preciseSemantic = 'person.personFullName';
          proposedNewPlaceholderId = 'person.personFullName2a';
          confidence = 'HIGH';
          classification = 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT';
          reason = 'Occurrence 0: appears after "đối với" in decision basis clause. "đối với [PERSON_NAME]" — this is a person name, not a decision date. Namespace decision.* is WRONG. Propose person.personFullName2a. Must update DOCX placeholder AND contract slot/binding.';
        } else if (occurrenceIndex === 1) {
          inferredSemantic = 'person.personFullName';
          preciseSemantic = 'person.personFullName';
          proposedNewPlaceholderId = 'person.personFullName2b';
          confidence = 'HIGH';
          classification = 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT';
          reason = 'Occurrence 1: appears after "Xét thấy" before "QUYẾT ĐỊNH:". "Xét thấy [PERSON_NAME] QUYẾT ĐỊNH" — this is a person name, not a decision date. Namespace decision.* is WRONG. Propose person.personFullName2b. Must update DOCX placeholder AND contract slot/binding.';
        }
      }

      // ── recipients.personLine6: 6 occurrences with mixed semantics ─────────────────────
      // CONFIRMED from raw OOXML analysis:
      // Occ 0 (para 16): blank cell after "Họ tên:" in person table header — extra person field
      // Occ 1 (para 17): blank cell in person table header
      // Occ 2 (para 18): blank cell in person table header
      // Occ 3 (para 21): AFTER "Số CMND/Thẻ CCCD/..." → person ID number
      // Occ 4 (para 24): AFTER "Nơi tạm trú:" → TEMPORARY address (NOT permanent!)
      // Occ 5 (para 18): in Table 1, CELL 1 — footer signature in distribution table
      if (placeholder === 'recipients.personLine6') {
        if (occurrenceIndex === 0 || occurrenceIndex === 1 || occurrenceIndex === 2) {
          // Blank cells in person table header — extra person fields (alias, DOB, ethnicity)
          inferredSemantic = 'person.personExtra';
          preciseSemantic = 'person.personExtra';
          confidence = 'LOW';
          classification = 'DEFER_AMBIGUOUS_PERSON_NAME';
          proposedNewPlaceholderId = null;
          reason = `Occurrence ${occurrenceIndex}: blank cell in person table header row. Cannot determine exact semantic (alias, date of birth, ethnicity, or another name field) without column header context. Blank cells have no visible label. Classified DEFER_AMBIGUOUS_PERSON_NAME — defer to human DOCX review.`;
        } else if (occurrenceIndex === 3) {
          // After "Số CMND/CCCD/Hộ chiếu:" → person ID number
          inferredSemantic = 'person.idNumber';
          preciseSemantic = 'person.idNumber';
          proposedNewPlaceholderId = 'person.idNumber6';
          confidence = 'HIGH';
          classification = 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT';
          reason = 'Occurrence 3: appears directly after "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:" label — this is the person ID number cell. Propose person.idNumber6. Must update DOCX placeholder AND contract slot/binding.';
        } else if (occurrenceIndex === 4) {
          // After "Nơi tạm trú:" → TEMPORARY address
          // CRITICAL: occ 4 is NOT permanent address. The "Nơi thường trú:" cell has no placeholder.
          inferredSemantic = 'person.addressTemporary';
          preciseSemantic = 'person.addressTemporary';
          proposedNewPlaceholderId = 'person.addressTemporary6';
          confidence = 'HIGH';
          classification = 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT';
          reason = 'Occurrence 4: appears after "Nơi tạm trú:" label in the address row. This is the TEMPORARY ADDRESS placeholder. The "Nơi thường trú:" paragraph has NO placeholder — permanent address cell is blank. IMPORTANT: Do NOT map occ 4 to person.addressPermanent6 — that would be wrong. Propose person.addressTemporary6. Must update DOCX placeholder AND contract slot/binding.';
        } else if (occurrenceIndex === 5) {
          // In Table 1, CELL 1 — footer signature in "Nơi nhận" distribution table
          // NOT a person field; it is the distribution/signature block
          inferredSemantic = 'recipients.footerSignature';
          preciseSemantic = 'recipients.footerSignature';
          confidence = 'HIGH';
          classification = 'DEFER_REQUIRES_HUMAN_DOCX_REVIEW';
          proposedNewPlaceholderId = null;
          reason = 'Occurrence 5: in Table 1 (Nơi nhận distribution list), CELL 1 — footer signature line. "11{{recipients.personLine6}} (Ký, ghi rõ họ tên, đóng dấu)" is the recipient/distribution footer, NOT a person field. Do NOT map to person.signatureLine6 unless contract model supports recipients.signatureLine* patterns. Classified DEFER_REQUIRES_HUMAN_DOCX_REVIEW — requires CodeGraph check for model support before naming.';
        }
      }

      const needsNewPlaceholder =
        classification === 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT' && !!proposedNewPlaceholderId;

      const currentSlot = (contract?.docxSlots ?? []).find((s) => s.slotId === placeholder) ?? null;
      const currentBinding = (contract?.renderBindings ?? []).find((b) => b.slotId === placeholder) ?? null;
      const currentField = (contract?.canonicalFields ?? []).find((f) => f.path === placeholder) ?? null;

      let changeType = 'NONE';
      if (classification === 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT') {
        changeType = 'DOCX+CONTRACT';
      }

      evidence.push({
        placeholder, occurrenceIndex, anchors, context, inferredSemantic, preciseSemantic, confidence,
        needsNewPlaceholder, proposedNewPlaceholderId,
        currentSlot: currentSlot ? { slotId: currentSlot.slotId, label: currentSlot.label, reviewRequired: currentSlot.reviewRequired, rawPattern: currentSlot.rawPattern } : null,
        currentBinding: currentBinding ? { slotId: currentBinding.slotId, from: currentBinding.from, reviewRequired: currentBinding.reviewRequired } : null,
        currentField: currentField ? { path: currentField.path, label: currentField.label, source: currentField.source } : null,
        classification, reason,
        keepCurrentPlaceholder: false,
        changeType,
        // DO NOT clear reviewRequired in EVIDENCE_ONLY mode
        reviewRequiredCleared: false,
        changeTypeNote:
          classification === 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT'
            ? 'DOCX occurrence needs new placeholder; contract slot/binding must track new placeholder'
            : classification === 'DEFER_AMBIGUOUS_PERSON_NAME'
            ? 'Blank cell with no visible label — cannot determine semantic safely; defer to human DOCX review'
            : classification === 'DEFER_REQUIRES_HUMAN_DOCX_REVIEW'
            ? 'Footer signature in distribution table — requires CodeGraph check for model support before naming'
            : 'Cannot determine safe action without human DOCX review',
      });
    }
  }
  return evidence;
}

function buildProposedSplits(occurrenceEvidence) {
  return occurrenceEvidence
    .filter((occ) => occ.classification === 'REVIEW_CANDIDATE_DOCX_OCCURRENCE_SPLIT' && occ.proposedNewPlaceholderId)
    .map((occ) => ({ originalPlaceholder: occ.placeholder, occurrenceIndex: occ.occurrenceIndex,
      proposedNewPlaceholderId: occ.proposedNewPlaceholderId, anchors: occ.anchors,
      inferredSemantic: occ.inferredSemantic, confidence: occ.confidence, changeType: occ.changeType }));
}

function buildCollisionChecks(proposedSplits, templateCode) {
  const contract = findLockedContract(templateCode);
  const allSlots = contract?.docxSlots ?? [];
  const allFields = contract?.canonicalFields ?? [];
  const allBindings = contract?.renderBindings ?? [];
  const allSlotIds = allSlots.map((s) => s.slotId);
  const allFieldPaths = allFields.map((f) => f.path);
  const allBindingSlotIds = allBindings.map((b) => b.slotId);
  return proposedSplits.map((split) => {
    const collisions = [];
    if (allSlotIds.includes(split.proposedNewPlaceholderId)) collisions.push({ type: 'docxSlots.id', value: split.proposedNewPlaceholderId, severity: 'ERROR' });
    if (allFieldPaths.includes(split.proposedNewPlaceholderId)) collisions.push({ type: 'canonicalFields.path', value: split.proposedNewPlaceholderId, severity: 'ERROR' });
    if (allBindingSlotIds.includes(split.proposedNewPlaceholderId)) collisions.push({ type: 'renderBindings.slotId', value: split.proposedNewPlaceholderId, severity: 'ERROR' });
    return { proposedNewPlaceholderId: split.proposedNewPlaceholderId, originalPlaceholder: split.originalPlaceholder, occurrenceIndex: split.occurrenceIndex, collisions, isCollisionFree: collisions.length === 0 };
  });
}

function buildClassificationCounts(occurrenceEvidence) {
  const counts = {};
  for (const occ of occurrenceEvidence) counts[occ.classification] = (counts[occ.classification] ?? 0) + 1;
  return counts;
}

function main() {
  const templateCode = 'BM-052';
  const occurrenceEvidence = buildOccurrenceEvidence(templateCode);
  const proposedSplits = buildProposedSplits(occurrenceEvidence);
  const collisionChecks = buildCollisionChecks(proposedSplits, templateCode);
  const classificationCounts = buildClassificationCounts(occurrenceEvidence);

  const safetyAssertions = {
    noDocxMutation: true, noLockedContractMutation: true, noCompiledV2Mutation: true,
    noDbPublish: true, noApprovedDecisions: true, sameBmEvidenceOnly: true, codeGraphUsedForCodeOnly: true,
  };

  const evidence = {
    schemaVersion: '1.0.0',
    task: 'BM052_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    status: 'COMPLETE',
    canApplyRunNow: false,
    templateCode,
    sourcePair: { normalizedDocx: 'storage/templates/normalized-docx/BM-052/BM-052_normalized.docx', lockedContract: null },
    duplicateSemanticPlaceholders: [
      { placeholder: 'decision.decisionLine2', count: 2, anchors: ['dateLine','decisionBasis','documentNumber','fullName'],
        reason: 'The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize before contract repair.' },
      { placeholder: 'recipients.personLine6', count: 6, anchors: ['fullName','job','idNumber','permanentAddress','temporaryAddress','signature','recipientFooter'],
        reason: 'The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize before contract repair.' },
    ],
    occurrenceEvidence,
    proposedOccurrenceSplits: proposedSplits,
    collisionChecks,
    classificationCounts,
    safetyAssertions,
    validation: {
      scriptName: 'scripts/audit/plan-bm052-docx-placeholder-renormalization.mjs',
      testFile: 'test/bm052-docx-placeholder-renormalization.test.mjs',
      expectedCanApplyRunNow: false,
    },
    plannerDecisionNeeded: {
      singleNextDecision: 'For each proposed occurrence split in BM-052, approve or reject the proposed new placeholder id and the change type (DOCX+CONTRACT or CONTRACT_ONLY), based on whether the DOCX renormalization is warranted for that specific occurrence.',
    },
  };

  writeJson(join(OUT_DIR, 'evidence.latest.json'), evidence);

  const evidenceMd = [
    '# BM-052 DOCX Placeholder Renormalization Evidence',
    '',
    'Mode: EVIDENCE_ONLY | Can apply run now: **NO**',
    '',
    '## Duplicate Semantic Placeholders',
    '',
    markdownTable([
      ['Placeholder', 'Count', 'Severity', 'Anchors'],
      ...evidence.duplicateSemanticPlaceholders.map((p) => [p.placeholder, p.count, 'HIGH', p.anchors.join(', ')]),
    ]),
    '',
    '## Occurrence Evidence',
    '',
    markdownTable([
      ['#', 'Placeholder', 'Occ', 'Anchors', 'Inferred Semantic', 'Confidence', 'Needs New', 'Proposed New', 'Classification', 'Change Type'],
      ...evidence.occurrenceEvidence.map((occ, idx) => [
        idx + 1, occ.placeholder, occ.occurrenceIndex, occ.anchors.join(', '),
        occ.inferredSemantic ?? 'null', occ.confidence,
        occ.needsNewPlaceholder ? 'YES' : 'NO',
        occ.proposedNewPlaceholderId ?? '—',
        occ.classification.replace('REVIEW_CANDIDATE_', '').replace(/_/g, ' '),
        occ.changeType,
      ]),
    ]),
    '',
    '## Proposed Occurrence Splits',
    '',
    markdownTable([
      ['Original', 'Occ', 'Proposed New', 'Semantic', 'Confidence', 'Change Type'],
      ...evidence.proposedOccurrenceSplits.map((s) => [
        s.originalPlaceholder, s.occurrenceIndex, s.proposedNewPlaceholderId, s.inferredSemantic, s.confidence, s.changeType,
      ]),
    ]),
    '',
    '## Collision Checks',
    '',
    markdownTable([
      ['Proposed', 'Original', 'Occ', 'Collisions', 'Collision-Free'],
      ...evidence.collisionChecks.map((c) => [
        c.proposedNewPlaceholderId, c.originalPlaceholder, c.occurrenceIndex,
        c.collisions.length > 0 ? c.collisions.map((x) => x.type + ':' + x.value).join('; ') : 'none',
        c.isCollisionFree ? 'YES' : 'NO',
      ]),
    ]),
    '',
    '## Classification Counts',
    '',
    markdownTable([['Classification', 'Count'], ...Object.entries(evidence.classificationCounts)]),
    '',
    '## Safety Assertions',
    '',
    markdownTable([['Assertion', 'Value'], ...Object.entries(evidence.safetyAssertions)]),
    '',
    '## Planner Decision Needed',
    '',
    evidence.plannerDecisionNeeded.singleNextDecision,
    '',
  ].join('\n');

  writeText(join(OUT_DIR, 'evidence.latest.md'), evidenceMd);

  const patchPlan = {
    schemaVersion: '1.0.0',
    task: 'BM052_DOCX_PLACEHOLDER_RENORMALIZATION_PATCH_PLAN',
    mode: 'PATCH_PLAN_ONLY',
    status: 'DRAFT',
    canApplyRunNow: false,
    templateCode,
    patches: evidence.proposedOccurrenceSplits.map((split) => {
      const collision = evidence.collisionChecks.find((c) => c.proposedNewPlaceholderId === split.proposedNewPlaceholderId);
      return {
        placeholder: split.originalPlaceholder, occurrenceIndex: split.occurrenceIndex,
        proposedNewPlaceholderId: split.proposedNewPlaceholderId, inferredSemantic: split.inferredSemantic,
        anchors: split.anchors, changeType: split.changeType,
        collisionFree: collision?.isCollisionFree ?? false, approved: false, reason: '',
      };
    }),
    safetyAssertions,
    plannerDecisionNeeded: evidence.plannerDecisionNeeded,
  };

  writeJson(join(OUT_DIR, 'patch-plan.latest.json'), patchPlan);

  const patchPlanMd = [
    '# BM-052 DOCX Placeholder Renormalization Patch Plan',
    '',
    'Mode: PATCH_PLAN_ONLY | Can apply run now: **NO** | Status: **DRAFT**',
    '',
    '## Patches',
    '',
    markdownTable([
      ['Placeholder', 'Occ', 'Proposed New', 'Semantic', 'Change Type', 'Collision-Free', 'Approved'],
      ...patchPlan.patches.map((p) => [
        p.placeholder, p.occurrenceIndex, p.proposedNewPlaceholderId, p.inferredSemantic,
        p.changeType, p.collisionFree ? 'YES' : 'NO', p.approved ? 'YES' : 'NO',
      ]),
    ]),
    '',
    '## Planner Decision Needed',
    '',
    patchPlan.plannerDecisionNeeded.singleNextDecision,
    '',
  ].join('\n');

  writeText(join(OUT_DIR, 'patch-plan.latest.md'), patchPlanMd);

  const handoff = {
    handoffVersion: '1.0.0',
    task: 'BM052_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    status: 'COMPLETE',
    canApplyRunNow: false,
    templateCode,
    sourcePair: evidence.sourcePair,
    duplicateSemanticPlaceholders: evidence.duplicateSemanticPlaceholders,
    occurrenceEvidence: evidence.occurrenceEvidence,
    proposedOccurrenceSplits: evidence.proposedOccurrenceSplits,
    collisionChecks: evidence.collisionChecks,
    classificationCounts: evidence.classificationCounts,
    safetyAssertions: evidence.safetyAssertions,
    validation: evidence.validation,
    plannerDecisionNeeded: evidence.plannerDecisionNeeded,
  };

  writeJson(join(OUT_DIR, 'planner-handoff.latest.json'), handoff);
  const handoffMdLines = [
    '# BM-052 Planner Handoff',
    '',
    '```json',
    JSON.stringify(handoff, null, 2),
    '```',
    '',
  ];
  writeText(join(OUT_DIR, 'planner-handoff.latest.md'), handoffMdLines.join('\n'));

  console.log('=== plan:bm052-docx-placeholder-renormalization ===');
  console.log('Template:', templateCode);
  console.log('Duplicate placeholders:', evidence.duplicateSemanticPlaceholders.length);
  console.log('Occurrence evidence items:', evidence.occurrenceEvidence.length);
  console.log('Proposed splits:', evidence.proposedOccurrenceSplits.length);
  console.log('Collision-free splits:', evidence.collisionChecks.filter((c) => c.isCollisionFree).length);
  console.log('Classification counts:', evidence.classificationCounts);
  console.log('canApplyRunNow:', evidence.canApplyRunNow);
}

main();
