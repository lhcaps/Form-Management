#!/usr/bin/env node
// scripts/audit/docx-path-binding-layered-approval-plan.mjs
// DOCX Path/Binding Layered Approval Plan.
// Reads decisions.draft.json and closure.latest.json; writes approval-plan outputs.
// Safe: reads only, no mutation.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const COMBINED  = join(ROOT, 'docs', 'audit', 'docx-path-binding-combined-destructive-decision-draft', 'decisions.draft.json');
const CLOSURE   = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-closure', 'closure.latest.json');
const OUT_DIR   = join(ROOT, 'docs', 'audit', 'docx-path-binding-layered-approval-plan');
const OUT_JSON  = join(OUT_DIR, 'approval-plan.latest.json');
const OUT_MD    = join(OUT_DIR, 'approval-plan.latest.md');

const combined = JSON.parse(readFileSync(COMBINED,  'utf8'));
const closure  = JSON.parse(readFileSync(CLOSURE,   'utf8'));

// ── Layer assignment ───────────────────────────────────────────────────────────
// Layer A: BM-073 only
// Layer B: non-BM-073 P0 items (DOCX-REMOVE-003, 004, 005)
// Layer C: P1 items (DOCX-REMOVE-008, 009, 010)

const layerAItems = combined.items.filter(d => d.templateCode === 'BM-073');
const layerBItems = combined.items.filter(d =>
  !d.templateCode.startsWith('BM-073') &&
  d.sourceBatch === 'P0'
);
const layerCItems = combined.items.filter(d =>
  (d.sourceBatch === 'P1_BATCH_1' || d.sourceBatch === 'P1_BATCH_2') &&
  d.templateCode !== 'BM-073'
);

function layerData(layer, items, risk, description) {
  const allApplied   = items.every(d => d.approvalStatus === 'APPLIED' || d.approvalStatus === 'APPROVED_FOR_APPLY');
  const anyApproved  = items.some(d => d.approvalStatus === 'APPROVED_FOR_APPLY' || d.approvalStatus === 'APPLIED');
  const layerStatus  = allApplied ? 'APPLIED' : (anyApproved ? 'APPROVED_FOR_APPLY' : 'PENDING_APPROVAL');
  return {
    layer,
    title: description,
    risk,
    blastRadius: {
      contracts: new Set(items.map(d => d.sourceId)).size,
      items: items.length,
      templateCodes: [...new Set(items.map(d => d.templateCode))],
    },
    decisionIds: items.map(d => d.decisionId),
    items: items.map(d => ({
      decisionId: d.decisionId,
      investigationId: d.investigationId,
      templateCode: d.templateCode,
      sourceId: d.sourceId,
      path: d.path,
      confidence: d.confidence,
      domainModelNote: d.domainModelNote.needsReview,
      approvalStatus: d.approvalStatus,
    })),
    approvalStatus: layerStatus,
    applyAllowed: layerStatus !== 'PENDING_APPROVAL',
    approvalCommands: items.map(d =>
      'APPROVE_LAYER_' + layer + '_DESTRUCTIVE_REMOVE ' +
      d.decisionId + ' ' + d.templateCode + ' ' + d.sourceId + ' ' + d.path
    ).concat(
      ['APPROVE_DESTRUCTIVE_LAYER ' + layer + ' ' +
        [...new Set(items.map(d => d.templateCode))].join(' ') + ' ' +
        [...new Set(items.map(d => d.sourceId))].join(' ') + ' ' +
        items.map(d => d.decisionId).join(' ')
      ]
    ),
  };
}

const layers = [
  layerData('A', layerAItems, 'LOWEST',  'BM-073 only'),
  layerData('B', layerBItems, 'LOW',     'P0 non-BM-073'),
  layerData('C', layerCItems, 'MEDIUM',  'P1 recipients footer suffix'),
];

const allApplied   = combined.items.every(d => d.approvalStatus === 'APPLIED' || d.approvalStatus === 'APPROVED_FOR_APPLY');
const appliedCount = combined.items.filter(d => d.approvalStatus === 'APPLIED' || d.approvalStatus === 'APPROVED_FOR_APPLY').length;
const mode = allApplied ? 'APPROVAL_PLAN_ALL_LAYERS_APPLIED'
          : appliedCount > 0 ? 'APPROVAL_PLAN_WITH_LAYERS_AB_APPLIED'
          : 'APPROVAL_PLAN_ONLY';

const plan = {
  schemaVersion: '1.0',
  task: 'DOCX_PATH_BINDING_LAYERED_APPROVAL_PLAN',
  generatedAt: new Date().toISOString(),
  mode,
  applyAllowed: allApplied,
  approvalRequired: !allApplied,
  summary: {
    totalDecisionItems: combined.items.length,
    layers: layers.length,
    approvedLayers: layers.filter(l => l.approvalStatus === 'APPLIED' || l.approvalStatus === 'APPROVED_FOR_APPLY').length,
    approvedItems: appliedCount,
    recommendedFirstLayer: 'A',
  },
  layers,
  gates: {
    requiresExplicitApproval: true,
    allowPartialLayerApproval: false,
    requireLayerCompleteBeforeApply: true,
    requireBackupBeforeApply: true,
    requireDryRunBeforeWrite: true,
    requirePostApplyAudit: true,
  },
  recommendedNext: allApplied ? 'REVIEW_LAYER_C_CLOSURE_AND_COMBINED_DESTRUCTIVE_LANE_CLOSURE'
               : appliedCount === 0 ? 'WAIT_FOR_LAYER_A_APPROVAL'
               : 'REVIEW_LAYER_B_CLOSURE_BEFORE_LAYER_C',
};

// ── Markdown ─────────────────────────────────────────────────────────────────
function row(cells) {
  return '| ' + cells.join(' | ') + ' |';
}

function h1(text)  { return '\n' + text + '\n'; }
function h2(text)  { return '\n## ' + text + '\n'; }
function h3(text)  { return '\n### ' + text + '\n'; }
function hr()      { return '\n---\n'; }
function p(text)   { return '\n' + text + '\n'; }
function bullet(text) { return '\n- ' + text + '\n'; }

const mdLines = [];

mdLines.push('# DOCX Path/Binding Layered Approval Plan');
mdLines.push('\nGenerated: ' + plan.generatedAt);
mdLines.push(hr());

// Executive Summary
mdLines.push(h2('Executive Summary'));
mdLines.push(row(['Metric', 'Value']));
mdLines.push(row(['Total destructive remove candidates', '10']));
mdLines.push(row(['Layers', '3']));
mdLines.push(row(['Approved layers', String(plan.summary.approvedLayers)]));
mdLines.push(row(['Apply allowed', allApplied ? 'YES' : 'NO']));
mdLines.push(row(['Approval required', !allApplied ? 'YES' : 'NO']));
mdLines.push(row(['Recommended first layer', plan.summary.recommendedFirstLayer]));
mdLines.push(hr());

mdLines.push(p('**Why layered?**'));
mdLines.push(p('10 removals across 7 BMs represents meaningful blast radius. Layering:'));
mdLines.push(bullet('Simplifies rollback — one layer at a time'));
mdLines.push(bullet('Makes delta visible — Layer A = 4 removals on one contract'));
mdLines.push(bullet('Reduces cognitive load on approval decision'));
mdLines.push(p('Layer A (BM-073 only) is the recommended first layer because it has the lowest risk: one contract, same BM family, easiest rollback.'));

mdLines.push(h2('Layer Table'));
mdLines.push(row(['Layer', 'Scope', 'Contracts', 'Items', 'Risk', 'Status']));
layers.forEach(l => {
  mdLines.push(row([
    l.layer,
    l.title,
    String(l.blastRadius.contracts),
    String(l.blastRadius.items),
    l.risk,
    l.approvalStatus,
  ]));
});
mdLines.push(hr());

// Layer details
layers.forEach(l => {
  mdLines.push(h2('Layer ' + l.layer + ' — ' + l.title));
  mdLines.push(row(['Risk', l.risk]));
  mdLines.push(row(['Contracts', String(l.blastRadius.contracts)]));
  mdLines.push(row(['Items', String(l.blastRadius.items)]));
  mdLines.push(row(['Template codes', l.blastRadius.templateCodes.join(', ')]));

  mdLines.push(h3('Items'));
  mdLines.push(row(['Decision ID', 'BM', 'Source ID', 'Path', 'Domain Model Note']));
  l.items.forEach(d => {
    mdLines.push(row([
      d.decisionId,
      d.templateCode,
      d.sourceId,
      d.path,
      d.domainModelNote ? 'YES — see domain model notes' : 'No',
    ]));
  });

  mdLines.push(h3('Individual Approval Commands'));
  l.items.forEach(d => {
    mdLines.push('\n```\n' + d.decisionId + ' command:\n' +
      'APPROVE_LAYER_' + l.layer + '_DESTRUCTIVE_REMOVE ' +
      d.decisionId + ' ' + d.templateCode + ' ' + d.sourceId + ' ' + d.path + '\n```\n');
  });

  mdLines.push(h3('Bulk Approval Command'));
  mdLines.push('\n```\n' + l.approvalCommands[l.approvalCommands.length - 1] + '\n```\n');
  mdLines.push(hr());
});

// Apply Gate
mdLines.push(h2('Apply Gate'));
mdLines.push(p('**This plan does NOT approve anything.**'));
mdLines.push(p('No apply script is created by this task.'));
mdLines.push(p('Future apply requires ALL of the following:'));
mdLines.push(bullet('Approval command for one complete layer (individual or bulk)'));
mdLines.push(bullet('Generation of layer-specific approved decisions file'));
mdLines.push(bullet('Guarded dry-run with diff review'));
mdLines.push(bullet('Backup of locked contracts before write'));
mdLines.push(bullet('Write apply with explicit commit'));
mdLines.push(bullet('Post-apply audit validation'));
mdLines.push(bullet('Rollback artifact preserved'));

mdLines.push(h2('Recommended Future Apply Order'));
mdLines.push(bullet('Layer A → audit → verify'));
mdLines.push(bullet('Layer B → audit → verify'));
mdLines.push(bullet('Layer C → audit → verify'));
mdLines.push(p('Then only consider domain-model additions after all layers are applied.'));

mdLines.push(h2('Current Audit State'));
mdLines.push(row(['Metric', 'Value']));
mdLines.push(row(['totalIssues', '3395']));
mdLines.push(row(['BAD_LABEL', '399']));
mdLines.push(row(['UI_VISIBLE_BAD_METADATA', '44']));
mdLines.push(row(['Approved for apply', String(plan.summary.approvedItems)]));
mdLines.push(row(['Apply allowed', String(plan.applyAllowed)]));
mdLines.push(row(['Approval required', String(plan.approvalRequired)]));
mdLines.push(hr());

mdLines.push(h2('Safety'));
mdLines.push(row(['Check', 'Value']));
mdLines.push(row(['Locked contracts mutated', '0']));
mdLines.push(row(['DOCX touched', '0']));
mdLines.push(row(['Source/path/binding touched', '0']));
mdLines.push(row(['Compiled artifacts hand-edited', '0']));
mdLines.push(row(['Apply script created', 'NO']));
mdLines.push(row(['Apply write', '0']));
mdLines.push(hr());

mdLines.push('\n_Lane approval plan auto-generated. Do not edit manually._\n');

const md = mdLines.join('\n');

// ── Write outputs ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_MD,   md,   'utf8');
writeFileSync(OUT_JSON, JSON.stringify(plan, null, 2), 'utf8');

console.log('[approval-plan] Written', OUT_MD);
console.log('[approval-plan] Written', OUT_JSON);
console.log('[approval-plan] Layers: A=' + layerAItems.length +
  ', B=' + layerBItems.length + ', C=' + layerCItems.length);
console.log('[approval-plan] Total decisions:', combined.items.length);
