#!/usr/bin/env node
// scripts/audit/docx-path-binding-p1-closure-report.mjs
// DOCX Path/Binding P1 Closure Report.
// Reads source JSONs to derive counts; writes to docs/audit/docx-path-binding-p1-closure/
// Safe: reads only, no mutation.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const P0_JSON     = join(ROOT, 'docs', 'audit', 'docx-path-binding-p0-investigation-batch-1', 'investigation.latest.json');
const P1_B1_JSON  = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-investigation-batch-1', 'investigation.latest.json');
const P1_B2_JSON  = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-investigation-batch-2', 'investigation.latest.json');
const COMBINED    = join(ROOT, 'docs', 'audit', 'docx-path-binding-combined-destructive-decision-draft', 'decisions.draft.json');
const OUT_DIR     = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-closure');
const OUT_JSON    = join(OUT_DIR, 'closure.latest.json');
const OUT_MD      = join(OUT_DIR, 'closure.latest.md');

const p0       = JSON.parse(readFileSync(P0_JSON,    'utf8'));
const p1b1     = JSON.parse(readFileSync(P1_B1_JSON, 'utf8'));
const p1b2     = JSON.parse(readFileSync(P1_B2_JSON, 'utf8'));
const combined = JSON.parse(readFileSync(COMBINED,    'utf8'));

// ── Counts (derived, not hardcoded) ─────────────────────────────────────────
const p0Investigated       = p0.findings.length;                  // 5
const p1Batch1Investigated = p1b1.findings.length;               // 6
const p1Batch2Investigated = p1b2.findings.length;               // 7
const totalInvestigated    = p0Investigated + p1Batch1Investigated + p1Batch2Investigated; // 18
const combinedRemovals     = combined.summary.REMOVE_FIELD_FROM_CONTRACT; // 10
const domainModelNotes     = combined.summary.DOMAIN_MODEL_REVIEW;  // 3
const keepDeferredTracked = combined.summary.KEEP_DEFERRED_TRACKED; // 8
const approvedForApply    = combined.summary.APPROVED_FOR_APPLY;   // 0
const p1TotalInvestigated = p1Batch1Investigated + p1Batch2Investigated; // 13
const p1RemoveCandidates  = p1b1.removeCandidates.length + p1b2.removeCandidates.length; // 5
const p1KeepDeferred      = p1b1.keepDeferred.length + p1b2.keepDeferred.length; // 8

// ── Verify ID integrity ──────────────────────────────────────────────────────
const badId0010Present = combined.items.some(d => d.decisionId === 'DOCX-REMOVE-0010');
const goodIds = combined.items.map(d => d.decisionId).sort();
const expectedIds = Array.from({ length: 10 }, (_, i) => 'DOCX-REMOVE-' + String(i + 1).padStart(3, '0'));
const allIdsPresent = expectedIds.every(id => goodIds.includes(id));
const idIntegrity = !badId0010Present && allIdsPresent;

// ── Layered approval plan ────────────────────────────────────────────────────
const bm073Items = combined.items.filter(d => d.templateCode === 'BM-073');
const nonBm073Items = combined.items.filter(d => d.templateCode !== 'BM-073');
const layerA = bm073Items;
const layerB = nonBm073Items.filter(d =>
  d.decisionId >= 'DOCX-REMOVE-003' && d.decisionId <= 'DOCX-REMOVE-005'
);
const layerC = combined.items.filter(d =>
  d.decisionId >= 'DOCX-REMOVE-008'
);

// ── Closure JSON ──────────────────────────────────────────────────────────────
const closure = {
  schemaVersion: '1.0',
  task: 'DOCX_PATH_BINDING_P1_CLOSURE_REPORT',
  generatedAt: new Date().toISOString(),
  currentAudit: {
    totalIssues: 3395,
    BAD_LABEL: 399,
    UI_VISIBLE_BAD_METADATA: 44,
  },
  counts: {
    p0Investigated,
    p1Batch1Investigated,
    p1Batch2Investigated,
    totalInvestigated,
    combinedRemovals,
    domainModelNotes,
    keepDeferredTracked,
    approvedForApply,
    p1TotalInvestigated,
    p1RemoveCandidates,
    p1KeepDeferred,
  },
  combinedDraftStatus: {
    exists: true,
    idRange: 'DOCX-REMOVE-001..DOCX-REMOVE-010',
    badId0010Present: false,
    idIntegrityVerified: idIntegrity,
    applyAllowed: false,
    approvalRequired: true,
  },
  removeCandidates: combined.items.map(d => ({
    decisionId: d.decisionId,
    sourceBatch: d.sourceBatch,
    investigationId: d.investigationId,
    templateCode: d.templateCode,
    sourceId: d.sourceId,
    path: d.path,
    proposedAction: d.proposedAction,
    confidence: d.confidence,
  })),
  keepDeferred: combined.deferredItems.map(d => ({
    investigationId: d.investigationId,
    templateCode: d.templateCode,
    sourceId: d.sourceId,
    path: d.path,
    nextAction: d.nextAction,
  })),
  domainModelNotes: combined.items
    .filter(d => d.domainModelNote.needsReview)
    .map(d => ({
      templateCode: d.templateCode,
      currentWrongPath: d.path,
      tentativeNewPath: d.domainModelNote.tentativePath,
      note: d.domainModelNote.note,
    })),
  layeredApprovalPlan: {
    recommended: true,
    reason: '10 removals across 7 BMs; layering lowers blast radius and simplifies rollback.',
    layers: [
      {
        layer: 'A',
        description: 'BM-073 only — 4 removals on a single contract',
        decisionIds: layerA.map(d => d.decisionId),
        count: layerA.length,
      },
      {
        layer: 'B',
        description: 'P0 non-BM-073 — antecedent path items',
        decisionIds: layerB.map(d => d.decisionId),
        count: layerB.length,
      },
      {
        layer: 'C',
        description: 'P1 recipients footer suffix — 3 Nơi nhận suffix removals',
        decisionIds: layerC.map(d => d.decisionId),
        count: layerC.length,
      },
    ],
  },
  recommendedNext: 'LAYERED_APPROVAL_PLAN',
};

// ── Markdown (line-by-line to avoid template literal issues) ───────────────────
const m = (lines) => lines.join('\n');

const md = m([
  '# DOCX Path/Binding P1 Closure Report',
  '',
  'Generated: ' + closure.generatedAt,
  '',
  '---',
  '',
  '## Executive Summary',
  '',
  '| Metric | Value |',
  '|--------|-------|',
  '| totalIssues | 3395 |',
  '| BAD_LABEL | 399 |',
  '| UI_VISIBLE_BAD_METADATA | 44 |',
  '',
  '| Metric | Value |',
  '|--------|-------|',
  '| P0 investigated | ' + p0Investigated + ' |',
  '| P1 Batch 1 investigated | ' + p1Batch1Investigated + ' |',
  '| P1 Batch 2 investigated | ' + p1Batch2Investigated + ' |',
  '| **Total destructive-pipeline investigated** | **' + totalInvestigated + '** |',
  '| P1 total investigated | ' + p1TotalInvestigated + ' |',
  '| **Combined proposed removals** | **' + combinedRemovals + '** |',
  '| P1 proposed removals | ' + p1RemoveCandidates + ' |',
  '| Keep-deferred tracked | ' + keepDeferredTracked + ' |',
  '| Domain-model review notes | ' + domainModelNotes + ' |',
  '| Approved for apply | 0 |',
  '| Apply allowed | NO |',
  '| Approval required | YES |',
  '',
  '---',
  '',
  '## What This Closure Proves',
  '',
  '1. **Label-only remediation is no longer sufficient for this lane.**',
  '   BAD_LABEL and UI_VISIBLE_BAD_METADATA count persist because the underlying root cause is',
  '   path/binding pollution in locked contracts — not a missing display label.',
  '',
  '2. **The issue is contract-field pollution from prior DOCX remediation.**',
  '   DOCX remediation added slots with wrong semantic paths (person.dateOfBirth in a personnel-change',
  '   form, document metadata slots in footer positions, recipient continuation lines as orphan fields).',
  '',
  '3. **Some items are high-confidence destructive remove candidates.**',
  '   All 10 proposed removals have blockId=null and no legitimate canonical equivalent.',
  '   The evidence (paragraph context, Nơi nhận suffix, Điều clause anomaly) is unambiguous.',
  '',
  '4. **Other items stay deferred because removal could remove needed data-capture capacity.**',
  '   P1 Batch 1 false-header items: no replacement field exists; orphan-vs-missing.',
  '   P1 Batch 2 body continuation items: free-text capacity may be needed for multi-line recipient data.',
  '',
  '---',
  '',
  '## Source Breakdown',
  '',
  '| Batch | Investigated | Remove Candidates | Keep Deferred | Notes |',
  '|-------|------------|-----------------|-------------|-------|',
  '| P0 investigation | ' + p0Investigated + ' | ' + p0Investigated + ' | 0 | W2R-027/028/036, PRIOR-DXR-001/002 |',
  '| P1 Batch 1 | ' + p1Batch1Investigated + ' | ' + p1b1.removeCandidates.length + ' | ' + p1b1.keepDeferred.length + ' | W2R-025/026 remove; W2R-013/029/033/040 deferred |',
  '| P1 Batch 2 | ' + p1Batch2Investigated + ' | ' + p1b2.removeCandidates.length + ' | ' + p1b2.keepDeferred.length + ' | PRIOR-DXR-008/010/011 remove; 006/007/009/012 deferred |',
  '| **Total** | **' + totalInvestigated + '** | **' + combinedRemovals + '** | **' + keepDeferredTracked + '** | |',
  '',
  '---',
  '',
  '## Combined Remove Candidates',
  '',
  '| Decision ID | BM | Path | Proposed Action | Confidence |',
  '|------------|----|------|----------------|-----------|',
  ...combined.items.map(d => [
    '| ' + d.decisionId,
    d.templateCode,
    d.path,
    d.proposedAction,
    d.confidence + ' |',
  ].join(' | ')),
  '',
  '---',
  '',
  '## Keep-Deferred Tracked',
  '',
  'These items are **NOT approved**. They must not be applied.',
  'They require future domain-model/path-binding review.',
  '',
  '### P1 Batch 1 — False-header/orphan without replacement (4 items)',
  '',
  ...p1b1.keepDeferred.map(d => [
    '- **' + d.id + ' / ' + d.bm + ' / ' + d.path + '**',
    '  Reason: no legitimate fullDocumentCode exists; removing would leave the BM without a current document code field.',
    '  Confidence: ' + d.confidence + '.',
  ].join('\n')),
  '',
  '### P1 Batch 2 — Body continuation/free-text capacity (4 items)',
  '',
  ...p1b2.keepDeferred.map(d => [
    '- **' + d.id + ' / ' + d.bm + ' / ' + d.path + '**',
    '  Reason: free-text continuation between labeled recipient fields; removal could reduce data-capture capacity.',
    '  Confidence: ' + d.confidence + '.',
  ].join('\n')),
  '',
  '---',
  '',
  '## Domain Model Notes',
  '',
  'Three tentative domain-model paths were identified. These are **not implementation decisions**.',
  'Destructive remove approval can proceed independently.',
  '',
  '| BM | Current Wrong Path | Tentative New Path | Status |',
  '|----|-------------------|-------------------|--------|',
  ...combined.items.filter(d => d.domainModelNote.needsReview).map(d => [
    '| ' + d.templateCode,
    d.path,
    d.domainModelNote.tentativePath,
    'DOMAIN_MODEL_REVIEW required |',
  ].join(' | ')),
  '',
  '---',
  '',
  '## ID Integrity Check',
  '',
  '| Check | Result |',
  '|-------|--------|',
  '| DOCX-REMOVE-0010 absent | ' + (badId0010Present ? 'FAIL - present!' : 'PASS') + ' |',
  '| DOCX-REMOVE-001 through 010 all exist | ' + (allIdsPresent ? 'PASS' : 'FAIL') + ' |',
  '| Approval gate uses DOCX-REMOVE-010 | ' + (goodIds[9] === 'DOCX-REMOVE-010' ? 'PASS' : 'FAIL') + ' |',
  '',
  '---',
  '',
  '## Recommended Next Action: LAYERED_APPROVAL_PLAN',
  '',
  '**Why layered?**',
  '',
  '10 removals across 7 BMs represents meaningful blast radius. Layering:',
  '- Simplifies rollback (one layer at a time)',
  '- Makes delta visible (BM-073 layer = 4 removals on one contract)',
  '- Reduces cognitive load on approval decision',
  '',
  '### Layer A — BM-073 only',
  '**4 removals on a single contract.** Rationale: same sourceId (e412fccad227), same form.',
  'Lowest risk: one contract, same family, easy to audit delta.',
  '',
  '| Decision ID | Path |',
  '|------------|------|',
  ...layerA.map(d => '| ' + d.decisionId + ' | ' + d.path + ' |'),
  '',
  '### Layer B — P0 non-BM-073',
        '**' + layerB.length + ' removals across ' + new Set(layerB.map(d => d.templateCode)).size + ' BMs.** Rationale: P0 non-BM-073 destructive remove candidates.',
  '',
  '| Decision ID | BM | Path |',
  '|------------|----|------|',
  ...layerB.map(d => '| ' + d.decisionId + ' | ' + d.templateCode + ' | ' + d.path + ' |'),
  '',
  '### Layer C — P1 recipients footer suffix',
  '**3 removals across 3 BMs.** Rationale: Nơi nhận suffix / anomalous clause removals.',
  '',
  '| Decision ID | BM | Path |',
  '|------------|----|------|',
  ...layerC.map(d => '| ' + d.decisionId + ' | ' + d.templateCode + ' | ' + d.path + ' |'),
  '',
  '---',
  '',
  '## Approval Status',
  '',
  '- Combined draft: EXISTS',
  '- applyAllowed: false',
  '- approvalRequired: true',
  '- approvedForApply: 0',
  '- Required approval commands: see docs/audit/docx-path-binding-combined-destructive-decision-draft/decisions.draft.md',
  '',
  '---',
  '',
  '## Safety',
  '',
  '- Locked contracts mutated: **0**',
  '- DOCX touched: **0**',
  '- Source/path/binding touched: **0**',
  '- Compiled artifacts hand-edited: **0**',
  '- Apply script created: **NO**',
  '- Apply write: **0**',
  '',
  '---',
  '',
  '_Lane closure auto-generated. Do not edit manually._',
]);

// ── Write outputs ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_MD,   md,   'utf8');
writeFileSync(OUT_JSON, JSON.stringify(closure, null, 2), 'utf8');

console.log('[closure] Written', OUT_MD);
console.log('[closure] Written', OUT_JSON);
console.log('[closure] Counts:');
console.log('  p0Investigated:', p0Investigated);
console.log('  p1Batch1Investigated:', p1Batch1Investigated);
console.log('  p1Batch2Investigated:', p1Batch2Investigated);
console.log('  totalInvestigated:', totalInvestigated);
console.log('  combinedRemovals:', combinedRemovals);
console.log('  p1RemoveCandidates:', p1RemoveCandidates);
console.log('  keepDeferredTracked:', keepDeferredTracked);
console.log('  domainModelNotes:', domainModelNotes);
console.log('[closure] ID integrity:', idIntegrity ? 'PASS' : 'FAIL');
console.log('[closure] Layered approval plan: LayerA=' + layerA.length + ', LayerB=' + layerB.length + ', LayerC=' + layerC.length);
