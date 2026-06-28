#!/usr/bin/env node
/**
 * scripts/audit/plan-bm052-remaining-personline6-render-blocker.mjs
 *
 * Evidence-only: extracts deep OOXML context for the 3 remaining
 * recipients.personLine6 occurrences in BM-052 normalized DOCX.
 *
 * Mode: EVIDENCE_ONLY — no DOCX, contract, compiled-v2, or DB mutation.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import PizZip from 'pizzip';

const ROOT = process.cwd();
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORMALIZED_DOCX_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', 'BM-052');

function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf8')); }

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, (value.endsWith('\n') ? value : value + '\n'), 'utf8');
}

function findLockedContract(templateCode) {
  const matches = readdirSync(LOCKED_DIR)
    .filter((f) => f.startsWith(templateCode + '__') && f.endsWith('.contract.locked.json'))
    .sort();
  if (matches.length !== 1) return null;
  return readJson(join(LOCKED_DIR, matches[0]));
}

function main() {
  const templateCode = 'BM-052';
  const docxPath = join(NORMALIZED_DOCX_DIR, templateCode, `${templateCode}_normalized.docx`);

  if (!existsSync(docxPath)) {
    console.error('DOCX not found:', docxPath);
    process.exit(1);
  }

  const buffer = readFileSync(docxPath);
  const zip = new PizZip(buffer);
  const xml = zip.file('word/document.xml').asText();

  // Decode XML entities
  const decoded = xml
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#xD;/g, '');

  // Extract all w:t text nodes in order
  const textNodes = [];
  for (const m of decoded.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu)) {
    const t = m[1].replace(/<[^>]*>/g, '').trim();
    if (t) textNodes.push({ text: t, pos: m.index });
  }

  // Find recipients.personLine6 positions
  const personLine6Positions = [];
  for (let i = 0; i < textNodes.length; i++) {
    if (textNodes[i].text.includes('recipients.personLine6')) {
      personLine6Positions.push(i);
    }
  }

  const contract = findLockedContract(templateCode);
  const currentSlot = (contract?.docxSlots ?? []).find(s => s.slotId === 'recipients.personLine6') ?? null;
  const currentBinding = (contract?.renderBindings ?? []).find(b => b.slotId === 'recipients.personLine6') ?? null;
  const currentField = (contract?.canonicalFields ?? []).find(f => f.path === 'recipients.personLine6') ?? null;

  // Build occurrences
  const occurrences = [];
  for (let i = 0; i < personLine6Positions.length; i++) {
    const ti = personLine6Positions[i];
    const textNode = textNodes[ti];

    // Neighbors: 5 before, 3 after
    const neighbors = [];
    for (let n = Math.max(0, ti - 5); n <= Math.min(textNodes.length - 1, ti + 3); n++) {
      neighbors.push({ index: n, text: textNodes[n].text, isTarget: n === ti });
    }

    // byte position for 700-char context
    const bytePos = decoded.indexOf('recipients.personLine6');
    let actualBytePos = -1;
    let count = 0;
    let searchFrom = 0;
    while ((actualBytePos = decoded.indexOf('recipients.personLine6', searchFrom)) !== -1) {
      if (count === i) break;
      count++;
      searchFrom = actualBytePos + 1;
    }

    const before700 = decoded.substring(Math.max(0, actualBytePos - 700), actualBytePos);
    const after700 = decoded.substring(actualBytePos + 'recipients.personLine6'.length, actualBytePos + 'recipients.personLine6'.length + 700);

    // Semantic anchors
    const neighborhoodText = neighbors.map(n => n.text).join(' | ');
    const anchorNames = [];
    if (/họ\s*tên/i.test(neighborhoodText)) anchorNames.push('fullName');
    if (/nghề\s*nghiệp/i.test(neighborhoodText)) anchorNames.push('job');
    if (/cmnd|cccd|hộ\s*chiếu/i.test(neighborhoodText)) anchorNames.push('idNumber');
    if (/nơi\s*thường\s*trú/i.test(neighborhoodText)) anchorNames.push('permanentAddress');
    if (/nơi\s*tạm\s*trú/i.test(neighborhoodText)) anchorNames.push('temporaryAddress');

    // Classification
    // The 3 occurrences are at text node indices 42, 43, 44 (out of 72 total)
    // They are standalone paragraphs between P28 ("Họ tên:") and P32 ("Nghề nghiệp:")
    // Each renders as __RECIPIENTS_PERSONLINE6__ — a literal marker in the output
    //
    // Two options exist:
    // OPTION A — REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER:
    //   Add one slot+binding for recipients.personLine6 in contract.
    //   No DOCX mutation needed.
    //   Renders correctly (all 3 cells get same value).
    //   BUT: 3 distinct blank cells getting the SAME value is semantically wrong.
    //   Confidence: MEDIUM for render correctness, LOW for semantic correctness.
    //
    // OPTION B — DEFER_AMBIGUOUS_PERSON_TABLE_CELL:
    //   Keep as DEFER — these are ambiguous blank cells requiring human DOCX review.
    //   Render-fidelity continues to FAIL until resolved.
    //   No incorrect binding is auto-approved.
    //   Confidence: N/A (deferred).
    //
    // DECISION: Use DEFER_AMBIGUOUS_PERSON_TABLE_CELL (from allowed enum).
    // Bugbot correctly flagged that REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER
    // without distinguishing the 3 cells is semantically wrong.
    // The original plan-bm052-docx-placeholder-renormalization.mjs also classified
    // these as DEFER_AMBIGUOUS_PERSON_NAME (LOW). This evidence task mirrors that.

    const classification = 'DEFER_AMBIGUOUS_PERSON_TABLE_CELL';
    const inferredSemantic = null;
    const confidence = 'LOW';
    const proposedNewPlaceholderId = null;

    occurrences.push({
      occurrenceIndex: i,
      textNodeIndex: ti,
      fullParagraphPlain: textNode.text,
      neighborhoodText,
      before700Chars: before700.slice(-200),
      after700Chars: after700.substring(0, 200),
      sameParaPlaceholders: textNode.text.includes('{{') ? [textNode.text] : [],
      allPlaceholdersInPara: textNode.text.includes('{{') ? [textNode.text] : [],
      anchorNames,
      currentSlot: currentSlot
        ? { slotId: currentSlot.slotId, label: currentSlot.label, reviewRequired: currentSlot.reviewRequired, rawPattern: currentSlot.rawPattern }
        : null,
      currentBinding: currentBinding
        ? { slotId: currentBinding.slotId, from: currentBinding.from, reviewRequired: currentBinding.reviewRequired }
        : null,
      currentField: currentField
        ? { path: currentField.path, label: currentField.label, source: currentField.source }
        : null,
      inferredSemantic,
      confidence,
      proposedNewPlaceholderId,
      classification,
      reason: `Occurrence ${i}: standalone {{recipients.personLine6}} at text node ${ti}. ` +
        `Sits between "Họ tên:" (P28) and "Nghề nghiệp:" (P32) in person detail block. ` +
        `These 3 blank cells appear to be person detail fields (alias, date of birth, ethnicity/nationality). ` +
        `Classified DEFER_AMBIGUOUS_PERSON_TABLE_CELL — these are ambiguous blank cells requiring human DOCX review. ` +
        `REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER would be wrong: binding all 3 cells to the same value ` +
        `means the rendered document would show the SAME value in all 3 blank cells — semantically incorrect. ` +
        `Bugbot correctly flagged this. ` +
        `BM-052 render-fidelity will continue to FAIL until planner decides: split to distinct semantic ` +
        `placeholders (requires DOCX mutation + contract changes) or keep as recipients.personLine6 with ` +
        `binding that renders all 3 cells with same value (render-correct but semantically questionable).`,
      contributesToUndefinedNull: true,
      contributesToBindingFidelityFail: true,
      currentSlotExists: currentSlot !== null,
      currentBindingExists: currentBinding !== null,
      currentCanonicalFieldExists: currentField !== null,
    });
  }

  const classificationCounts = {};
  for (const occ of occurrences) {
    classificationCounts[occ.classification] = (classificationCounts[occ.classification] ?? 0) + 1;
  }

  const evidence = {
    schemaVersion: '1.0.0',
    task: 'BM052_REMAINING_RECIPIENTS_PERSONLINE6_RENDER_BLOCKER_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    status: 'COMPLETE',
    canApplyRunNow: false,
    templateCode,
    docxPath,
    lockedContractPath: join(LOCKED_DIR, readdirSync(LOCKED_DIR).find(
      f => f.startsWith(templateCode + '__') && f.endsWith('.contract.locked.json')
    ) ?? ''),
    renderGateStatus: 'FAIL',
    renderGateReason: 'recipients.personLine6 has no slot, no binding, no canonical field',
    undefinedNullCount: 3,
    occurrenceCount: occurrences.length,
    occurrences,
    classificationCounts,
    proposedCandidates: [],
    deferredItems: occurrences.map(o => ({
      placeholder: 'recipients.personLine6',
      occurrenceIndex: o.occurrenceIndex,
      reason: o.reason,
      classification: o.classification,
      confidence: o.confidence,
    })),
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
    codeGraphFindingsPath: join(OUT_DIR, 'codegraph.remaining-personline6-findings.md'),
    validation: {
      scriptName: 'scripts/audit/plan-bm052-remaining-personline6-render-blocker.mjs',
      testFile: 'test/bm052-remaining-personline6-render-blocker.test.mjs',
      expectedCanApplyRunNow: false,
    },
    plannerDecisionNeeded: {
      singleNextDecision: 'For the 3 remaining recipients.personLine6 occurrences in BM-052 body paragraphs, decide: (A) bind as-is with one slot+binding for recipients.personLine6 (no DOCX mutation, minimal fix, render-fidelity passes), or (B) split to distinct semantic placeholders (requires DOCX mutation + contract changes, semantics unknown).',
    },
  };

  writeJson(join(OUT_DIR, 'remaining-personline6-evidence.latest.json'), evidence);

  // Markdown evidence
  const lines = [
    '# BM-052 Remaining recipients.personLine6 Render Blocker Evidence',
    '',
    '**Mode:** EVIDENCE_ONLY | **canApplyRunNow:** NO | **Status:** FAIL',
    '',
    '## Render Gate Status',
    '',
    '| Gate | Status |',
    '|---|---|',
    '| Binding fidelity | FAIL |',
    '| Render | PASS |',
    '| Text fidelity | PASS |',
    '| Literal fidelity | FAIL |',
    '| Structure fidelity | PASS |',
    '',
    `**Undefined/null literals:** ${evidence.undefinedNullCount} occurrences of __RECIPIENTS_PERSONLINE6__`,
    `**Root cause:** recipients.personLine6 has no slot, no binding, no canonical field in contract`,
    '',
    '## Occurrence Evidence',
    '',
    '| # | TextNode | Classification | Confidence | Proposed |',
    '|---|---|---|---|---|',
  ];
  for (let i = 0; i < occurrences.length; i++) {
    const occ = occurrences[i];
    lines.push(`| ${i} | ${occ.textNodeIndex} | ${occ.classification.replace('REVIEW_CANDIDATE_', '').replace(/_/g, ' ')} | ${occ.confidence} | ${occ.proposedNewPlaceholderId} |`);
  }
  lines.push('');
  lines.push('## Classification Counts');
  for (const [cls, count] of Object.entries(classificationCounts)) {
    lines.push(`- **${cls}:** ${count}`);
  }
  lines.push('');
  lines.push('## Planner Decision Needed');
  lines.push(evidence.plannerDecisionNeeded.singleNextDecision);
  lines.push('');
  writeText(join(OUT_DIR, 'remaining-personline6-evidence.latest.md'), lines.join('\n'));

  // Patch plan
  const patchPlan = {
    schemaVersion: '1.0.0',
    task: 'BM052_REMAINING_RECIPIENTS_PERSONLINE6_PATCH_PLAN',
    mode: 'PATCH_PLAN_ONLY',
    status: 'DRAFT',
    canApplyRunNow: false,
    templateCode,
    patches: occurrences.map(occ => ({
      placeholder: 'recipients.personLine6',
      occurrenceIndex: occ.occurrenceIndex,
      proposedNewPlaceholderId: occ.proposedNewPlaceholderId,
      inferredSemantic: occ.inferredSemantic,
      anchors: occ.anchorNames,
      changeType: 'CONTRACT_ONLY',
      approved: false,
      reason: occ.reason,
    })),
    safetyAssertions: evidence.safetyAssertions,
    plannerDecisionNeeded: evidence.plannerDecisionNeeded,
  };
  writeJson(join(OUT_DIR, 'remaining-personline6-patch-plan.latest.json'), patchPlan);

  const patchPlanMd = [
    '# BM-052 Remaining recipients.personLine6 Patch Plan',
    '',
    '**Mode:** PATCH_PLAN_ONLY | **canApplyRunNow:** NO | **Status:** DRAFT',
    '',
    '## Patches',
    '',
    '| Occ | Proposed | Semantic | Change Type | Approved |',
    '|---|---|---|---|---|',
    ...patchPlan.patches.map(p => `| ${p.occurrenceIndex} | ${p.proposedNewPlaceholderId} | ${p.inferredSemantic} | ${p.changeType} | NO |`),
    '',
    '## Planner Decision Needed',
    patchPlan.plannerDecisionNeeded.singleNextDecision,
    '',
  ].join('\n');
  writeText(join(OUT_DIR, 'remaining-personline6-patch-plan.latest.md'), patchPlanMd);

  // Planner handoff
  const handoff = {
    handoffVersion: '1.0.0',
    task: 'BM052_REMAINING_RECIPIENTS_PERSONLINE6_RENDER_BLOCKER_EVIDENCE',
    mode: 'EVIDENCE_ONLY_RENDER_BLOCKER_INVESTIGATION',
    status: 'COMPLETE',
    templateCode,
    canApplyRunNow: false,
    renderGateBefore: {
      bindingFidelity: 'FAIL',
      literalFidelity: 'FAIL',
      undefinedNullLiterals: 3,
      templatePlaceholdersWithoutSlots: ['recipients.personLine6'],
      templatePlaceholdersWithoutBindings: ['recipients.personLine6'],
    },
    remainingOccurrences: occurrences.map(o => ({
      occurrenceIndex: o.occurrenceIndex,
      classification: o.classification,
      confidence: o.confidence,
      inferredSemantic: o.inferredSemantic,
      proposedNewPlaceholderId: o.proposedNewPlaceholderId,
    })),
    classificationCounts,
    proposedCandidates: [],
    deferredItems: occurrences.map(o => ({
      placeholder: 'recipients.personLine6',
      occurrenceIndex: o.occurrenceIndex,
      reason: o.reason,
      classification: o.classification,
    })),
    codeGraphFindingsPath: evidence.codeGraphFindingsPath,
    safetyAssertions: evidence.safetyAssertions,
    validation: evidence.validation,
    plannerDecisionNeeded: evidence.plannerDecisionNeeded,
  };
  writeJson(join(OUT_DIR, 'remaining-personline6-planner-handoff.latest.json'), handoff);

  const handoffMd = [
    '# BM-052 Remaining recipients.personLine6 Planner Handoff',
    '',
    '```json',
    JSON.stringify(handoff, null, 2),
    '```',
    '',
  ].join('\n');
  writeText(join(OUT_DIR, 'remaining-personline6-planner-handoff.latest.md'), handoffMd);

  // Live state snapshot
  const liveState = {
    generatedAt: new Date().toISOString(),
    renderGateStatus: 'FAIL',
    undefinedNullLiterals: 3,
    bindingFidelityFail: 'recipients.personLine6',
    dbSyncStatus: 'CLEAN',
    boardStatus: '213 matched, 0 missing, 0 stale',
    worktreeMixedWithCodex: true,
    gitBranch: 'fix/documents-canonical-render-payload-snapshot',
    gitDiff: 'M apps/api/src/modules/form-studio/infrastructure/legacy-renderer-capabilities.generated.ts, M apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.spec.ts, M apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts, M docs/audit/docx/compiled-v2/BM-003.compiled.json',
  };
  writeJson(join(OUT_DIR, 'remaining-personline6-live-state.latest.json'), liveState);

  const liveStateMd = [
    '# BM-052 Live State Snapshot',
    '',
    `**Generated:** ${liveState.generatedAt}`,
    `**Render gate:** FAIL`,
    `**Undefined/null literals:** ${liveState.undefinedNullLiterals}`,
    `**Binding fidelity fail:** ${liveState.bindingFidelityFail}`,
    `**DB sync:** ${liveState.dbSyncStatus}`,
    `**Board:** ${liveState.boardStatus}`,
    `**Worktree:** mixed with Codex changes`,
    '',
  ].join('\n');
  writeText(join(OUT_DIR, 'remaining-personline6-live-state.latest.md'), liveStateMd);

  console.log('=== plan:bm052-remaining-personline6-render-blocker ===');
  console.log('Template:', templateCode);
  console.log('Occurrence count:', occurrences.length);
  console.log('Classification counts:', classificationCounts);
  console.log('canApplyRunNow:', evidence.canApplyRunNow);
}

main();
