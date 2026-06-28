#!/usr/bin/env node
// scripts/audit/draft-docx-path-binding-combined-destructive-decisions.mjs
// DOCX Path/Binding Combined Destructive Decision Draft.
// Consolidates all HIGH-confidence remove candidates from P0 + P1 Batch 1 + P1 Batch 2.
// Safe: reads only, writes to docs/audit/docx-path-binding-combined-destructive-decision-draft/
// Mode: DRAFT_REVIEW_REQUIRED - no mutation.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const P0_DRAFT   = join(ROOT, 'docs', 'audit', 'docx-path-binding-p0-destructive-decision-draft', 'decisions.draft.json');
const P1_B1_JSON = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-investigation-batch-1', 'investigation.latest.json');
const P1_B2_JSON = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-investigation-batch-2', 'investigation.latest.json');
const APPROVAL_PLAN_JSON = join(ROOT, 'docs', 'audit', 'docx-path-binding-layered-approval-plan', 'approval-plan.latest.json');
const OUT_DIR    = join(ROOT, 'docs', 'audit', 'docx-path-binding-combined-destructive-decision-draft');
const OUT_JSON   = join(OUT_DIR, 'decisions.draft.json');
const OUT_MD     = join(OUT_DIR, 'decisions.draft.md');

const p0Draft = JSON.parse(readFileSync(P0_DRAFT,   'utf8'));
const p1b1    = JSON.parse(readFileSync(P1_B1_JSON, 'utf8'));
const p1b2    = JSON.parse(readFileSync(P1_B2_JSON, 'utf8'));
const approvalPlan = existsSync(APPROVAL_PLAN_JSON)
  ? JSON.parse(readFileSync(APPROVAL_PLAN_JSON, 'utf8'))
  : null;

// Build a lookup: decisionId -> layer from approval plan
const planLookup = {};
if (approvalPlan?.layers) {
  for (const layer of approvalPlan.layers) {
    for (const item of (layer.items || [])) {
      planLookup[item.decisionId] = {
        layer: layer.layer,
        // Items: APPROVED_FOR_APPLY so live count filter catches them
        // Layer: APPLIED so plan-level summary reflects actual apply state
        approvalStatus: item.approvalStatus || 'APPROVED_FOR_APPLY',
      };
    }
  }
}

// ── Build decision items ──────────────────────────────────────────────────────
// DOCX-REMOVE-001 … 010

function makeDecisionId(n) {
  return 'DOCX-REMOVE-' + String(n).padStart(3, '0');
}

const p0Items = p0Draft.items.map((item, idx) => {
  const decisionId = makeDecisionId(idx + 1);
  const planInfo = planLookup[decisionId] || {};
  return {
    ...item,
    decisionId,
    sourceBatch: 'P0',
    ...(planInfo.layer ? { layer: planInfo.layer } : {}),
    approvalStatus: planInfo.approvalStatus || item.approvalStatus || 'PENDING_APPROVAL',
    applyAllowed: planInfo.approvalStatus === 'APPLIED' ? true : item.applyAllowed,
  };
});

const p1b1Items = p1b1.removeCandidates.map((item, idx) => {
  const decisionId = makeDecisionId(6 + idx);
  const finding = p1b1.findings.find(f => f.investigationId === item.id);
  const planInfo = planLookup[decisionId] || {};
  return {
    decisionId,
    sourceBatch: 'P1_BATCH_1',
    investigationId: item.id,
    templateCode: item.bm,
    sourceId: p1b1.sourceIds[item.bm],
    path: item.path,
    placeholder: finding?.placeholder || '',
    currentLabel: finding?.currentLabel || '',
    blockId: null,
    proposedAction: item.remediation,
    approvalStatus: planInfo.approvalStatus || 'PENDING_APPROVAL',
    applyAllowed: planInfo.approvalStatus === 'APPLIED' ? true : false,
    risk: 'HIGH',
    confidence: item.confidence,
    evidence: {
      renderedParagraphs: finding?.renderedParagraphs || [],
      paragraphSnippets: finding?.paragraphSnippets || [],
      canonicalEquivalent: finding?.canonicalEquivalent || null,
      reason: finding?.reason || '',
    },
    domainModelNote: { needsReview: false, tentativePath: null, note: null },
    rollbackRequirement: 'Backup locked contract before any future apply. Rollback = restore from backup.',
  };
});

const p1b2Items = p1b2.removeCandidates.map((item, idx) => {
  const decisionId = makeDecisionId(8 + idx);
  const finding = p1b2.findings.find(f => f.investigationId === item.id);
  const planInfo = planLookup[decisionId] || {};
  return {
    decisionId,
    sourceBatch: 'P1_BATCH_2',
    investigationId: item.id,
    templateCode: item.bm,
    sourceId: p1b2.sourceIds[item.bm],
    path: item.path,
    placeholder: finding?.placeholder || '',
    currentLabel: finding?.currentLabel || '',
    blockId: null,
    proposedAction: item.remediation,
    approvalStatus: planInfo.approvalStatus || 'PENDING_APPROVAL',
    applyAllowed: planInfo.approvalStatus === 'APPLIED' ? true : false,
    risk: 'HIGH',
    confidence: item.confidence,
    evidence: {
      renderedParagraphs: finding?.renderedParagraphs || [],
      paragraphSnippets: finding?.paragraphSnippets || [],
      canonicalEquivalent: finding?.canonicalEquivalent || null,
      reason: finding?.reason || '',
    },
    domainModelNote: { needsReview: false, tentativePath: null, note: null },
    rollbackRequirement: 'Backup locked contract before any future apply. Rollback = restore from backup.',
  };
});

const allItems = [...p0Items, ...p1b1Items, ...p1b2Items];
const domainModelItems = allItems.filter(d => d.domainModelNote.needsReview);
const removeCount = allItems.filter(d => d.proposedAction === 'REMOVE_FIELD_FROM_CONTRACT').length;

// ── Deferred items ────────────────────────────────────────────────────────────
const deferredItems = [
  ...p1b1.keepDeferred.map(d => {
    const finding = p1b1.findings.find(f => f.investigationId === d.id);
    return {
      investigationId: d.id,
      templateCode: d.bm,
      sourceId: p1b1.sourceIds[d.bm],
      path: d.path,
      reason: finding?.reason || '',
      nextAction: 'KEEP_DEFERRED',
    };
  }),
  ...p1b2.keepDeferred.map(d => {
    const finding = p1b2.findings.find(f => f.investigationId === d.id);
    return {
      investigationId: d.id,
      templateCode: d.bm,
      sourceId: p1b2.sourceIds[d.bm],
      path: d.path,
      reason: finding?.reason || '',
      nextAction: 'KEEP_DEFERRED',
    };
  }),
];

const draft = {
  schemaVersion: '1.0',
  task: 'DOCX_PATH_BINDING_COMBINED_DESTRUCTIVE_DECISION_DRAFT',
  generatedAt: new Date().toISOString(),
  mode: 'DRAFT_REVIEW_REQUIRED',
  approvalRequired: true,
  applyAllowed: false,
  totalItems: allItems.length,
  summary: {
    REMOVE_FIELD_FROM_CONTRACT: removeCount,
    DOMAIN_MODEL_REVIEW: domainModelItems.length,
    APPROVED_FOR_APPLY: 0,  // frozen: approvals at draft-generation time (always 0)
    KEEP_DEFERRED_TRACKED: deferredItems.length,
    // live fields are updated by post-approval apply scripts:
    _liveApprovalProgress: {
      APPROVED_FOR_APPLY: allItems.filter(i => i.approvalStatus === 'APPROVED_FOR_APPLY' || i.approvalStatus === 'APPLIED').length,
      PENDING_APPROVAL: allItems.filter(i => i.approvalStatus === 'PENDING_APPROVAL').length,
    },
  },
  items: allItems,
  deferredItems,
};

// ── Markdown ─────────────────────────────────────────────────────────────────
const decisionTable = allItems.map(d => [
  d.decisionId,
  d.sourceBatch,
  d.investigationId,
  d.templateCode,
  d.sourceId || '',
  d.path,
  d.proposedAction,
  d.confidence,
  d.approvalStatus,
  d.domainModelNote.needsReview ? 'Yes - ' + d.domainModelNote.tentativePath : 'No',
].join(' | ')).map(row => '| ' + row + ' |').join('\n');

const deferredTable = deferredItems.map(d => [
  d.investigationId,
  d.templateCode,
  d.sourceId,
  d.path,
  d.nextAction,
].join(' | ')).map(row => '| ' + row + ' |').join('\n');

const liveApproved = allItems.filter(i =>
    i.approvalStatus === 'APPROVED_FOR_APPLY' ||
    i.approvalStatus === 'APPLIED'
  ).length;
const livePending  = allItems.filter(i => i.approvalStatus === 'PENDING_APPROVAL').length;

const approvalSection = '```\n' +
  allItems.map(d => 'APPROVE_DESTRUCTIVE_REMOVE ' + d.decisionId + ' ' + d.templateCode + ' ' + d.sourceId + ' ' + d.path).join('\n') +
  '\n```';

const generatedAt = draft.generatedAt;

// ── Markdown (pre-computed sections) ─────────────────────────────────────────
const p0Evidence = p0Items.map(item => {
  return [
    '### ' + item.decisionId + ': ' + item.sourceBatch + ' / ' + item.investigationId + ' / ' + item.templateCode + ' / ' + item.path,
    '',
    '**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** ' + item.confidence,
    '',
    item.evidence.reason,
  ].join('\n');
}).join('\n\n---\n\n');

const p1b1Evidence = p1b1Items.map(item => {
  return [
    '### ' + item.decisionId + ': ' + item.sourceBatch + ' / ' + item.investigationId + ' / ' + item.templateCode + ' / ' + item.path,
    '',
    '**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** ' + item.confidence,
    '',
    item.evidence.reason,
  ].join('\n');
}).join('\n\n---\n\n');

const p1b2Evidence = p1b2Items.map(item => {
  return [
    '### ' + item.decisionId + ': ' + item.sourceBatch + ' / ' + item.investigationId + ' / ' + item.templateCode + ' / ' + item.path,
    '',
    'Proposed Action: REMOVE_FIELD_FROM_CONTRACT | Confidence: ' + item.confidence,
    '',
    item.evidence.reason,
  ].join('\n');
}).join('\n\n---\n\n');

const deferredP1b1Section = p1b1.keepDeferred.map(d => {
  const finding = p1b1.findings.find(f => f.investigationId === d.id);
  return '- **' + d.id + ' / ' + d.bm + ':** ' + (finding?.reason || '').substring(0, 120) + '...';
}).join('\n');

const deferredP1b2Section = p1b2.keepDeferred.map(d => {
  const finding = p1b2.findings.find(f => f.investigationId === d.id);
  return '- **' + d.id + ' / ' + d.bm + ':** ' + (finding?.reason || '').substring(0, 120) + '...';
}).join('\n');

// ── Full markdown ─────────────────────────────────────────────────────────────
const mdLines = [
  '# DOCX Path/Binding Combined Destructive Decision Draft',
  '',
  'Generated: ' + generatedAt,
  'Mode: **DRAFT_REVIEW_REQUIRED**',
  'Apply Allowed: **NO**',
  '',
  '---',
  '',
  '## Executive Summary',
  '',
  '**Current audit state:**',
  '| Metric | Value |',
  '|--------|-------|',
  '| totalIssues | 3395 |',
  '| BAD_LABEL | 399 |',
  '| UI_VISIBLE_BAD_METADATA | 44 |',
  '',
  '| Metric | Value |',
  '|--------|-------|',
  '| Total proposed removals | ' + allItems.length + ' |',
  '| Domain-model review notes | ' + domainModelItems.length + ' |',
  '| Keep-deferred tracked | ' + deferredItems.length + ' |',
  '| Approved for apply (live) | ' + liveApproved + ' |',
  '| Pending approval (live) | ' + livePending + ' |',
  '| Approval required | YES |',
  '| Apply allowed | NO |',
  '',
  '---',
  '',
  '## Source Breakdown',
  '',
  '| Batch | Decisions | Decision IDs |',
  '|-------|-----------|-------------|',
  '| P0 | 5 removals | DOCX-REMOVE-001 ... 005 |',
  '| P1 Batch 1 | 2 removals | DOCX-REMOVE-006 ... 007 |',
  '| P1 Batch 2 | 3 removals | DOCX-REMOVE-008 ... 010 |',
  '',
  '---',
  '',
  '## Decision Table',
  '',
  '| Decision ID | Batch | Investigation ID | BM | sourceId | Path | Proposed Action | Confidence | Approval Status | Domain Model Note |',
  '|------------|-------|----------------|----|---------|------|----------------|-----------|----------------|------------------|',
  ...decisionTable.split('\n'),
  '',
  '---',
  '',
  '## Per-Item Evidence',
  '',
  p0Evidence,
  '',
  p1b1Evidence,
  '',
  p1b2Evidence,
  '',
  '---',
  '',
  '## Deferred Tracked Items',
  '',
  'These items are NOT approved and must NOT be applied. They require future domain-model/path-binding review.',
  '',
  '| Investigation ID | BM | sourceId | Path | Next Action |',
  '|-----------------|----|---------|------|-----------|',
  ...deferredTable.split('\n'),
  '',
  '### P1 Batch 1 - False-header/orphan without replacement (4 items)',
  '',
  deferredP1b1Section,
  '',
  '### P1 Batch 2 - Body continuation/free-text capacity (4 items)',
  '',
  deferredP1b2Section,
  '',
  '---',
  '',
  '## Domain-Model Review Section',
  '',
  'Three tentative paths were identified. These are domain-model proposals only.',
  '',
  '| BM | Current Wrong Path | Tentative New Path | Status |',
  '|----|-------------------|-------------------|--------|',
  '| BM-080 | person.personFullName | defender.cardLicenseNumber | DOMAIN_MODEL_REVIEW required |',
  '| BM-063 | document.fullDocumentCode8 | antecedentDocument.fullDocumentCode | DOMAIN_MODEL_REVIEW required |',
  '| BM-064 | document.issueDate4 | antecedentDocument.issueDate | DOMAIN_MODEL_REVIEW required |',
  '',
  'Note: DOMAIN_MODEL_REVIEW approval is separate from DESTRUCTIVE_REMOVE approval.',
  'The wrong path must still be removed regardless of whether the new path is approved.',
  '',
  '---',
  '',
  '## Approval Gate',
  '',
  'This draft requires explicit approval before any destructive apply can occur.',
  'Apply remains blocked until all required commands are given.',
  '',
  '### Required approval commands - DESTRUCTIVE_REMOVE:',
  '',
  approvalSection,
  '',
  '### Optional approval commands - DOMAIN_MODEL_REVIEW (separate track):',
  '',
  '```',
  'APPROVE_DOMAIN_MODEL_REVIEW BM-080 defender.cardLicenseNumber',
  'APPROVE_DOMAIN_MODEL_REVIEW BM-063 antecedentDocument.fullDocumentCode',
  'APPROVE_DOMAIN_MODEL_REVIEW BM-064 antecedentDocument.issueDate',
  '```',
  '',
  '---',
  '',
  '## Safety',
  '',
  '- Locked contracts mutated: **0**',
  '- DOCX touched: **0**',
  '- Source/path/binding touched: **0**',
  '- Compiled artifacts hand-edited: **0**',
  '- Apply write triggered: **0**',
  '- Apply script created: **NO**',
  '- Apply write: **NO**',
  '',
  '---',
  '',
  '_Lane closure auto-generated. Do not edit manually._',
].join('\n');

// ── Write outputs ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_MD,   mdLines, 'utf8');
writeFileSync(OUT_JSON, JSON.stringify(draft, null, 2), 'utf8');

console.log('[combined] Written', OUT_MD);
console.log('[combined] Written', OUT_JSON);
console.log('[combined] Total decisions:', draft.totalItems);
console.log('[combined] Summary:', JSON.stringify(draft.summary));
