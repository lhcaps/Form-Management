#!/usr/bin/env node
/**
 * generate-review-decisions.mjs
 *
 * Reads latest.json from FORMS_ROOT_CAUSE_REVIEW_BATCH_1
 * and produces decisions.approved.json / .md per reviewer decisions.
 *
 * Reviewer: Project Owner (Human Reviewer)
 * Approval scope: Only RG-001 and RG-002, deterministic label-only corrections.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const REVIEW_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1');
const LATEST_JSON = join(REVIEW_DIR, 'latest.json');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main() {
  const review = loadJson(LATEST_JSON);
  const now = new Date().toISOString();

  // Decision map: reviewGroupId -> reviewer decision
  const decisionMap = {
    // RG-001, RG-002: APPROVED — known label correction
    'RG-001': {
      decision: 'APPROVED_FOR_APPLY',
      action: 'UPDATE_LABEL',
      approvedLabel: 'Số văn bản',
      approvedPath: null,
      approvedSource: null,
      confidence: 'HIGH',
      reviewerOverrideConfidence: 'HIGH',
      applyEligible: true,
      rationale: 'Known label map: document.documentCode is a stable document number/code field. Vietnamese UI label "Số văn bản" is deterministic, non-legal, and label-only. No path/source/required/editable/visible semantics changed.',
    },
    'RG-002': {
      decision: 'APPROVED_FOR_APPLY',
      action: 'UPDATE_LABEL',
      approvedLabel: 'Số văn bản',
      approvedPath: null,
      approvedSource: null,
      confidence: 'HIGH',
      reviewerOverrideConfidence: 'HIGH',
      applyEligible: true,
      rationale: 'Known label map: document.documentCode is a stable document number/code field. Vietnamese UI label "Số văn bản" is deterministic, non-legal, and label-only. No path/source/required/editable/visible semantics changed.',
    },
    // RG-003: DEFER_LEGAL — legalBasis.* excluded from safe apply
    'RG-003': {
      decision: 'DEFER_LEGAL',
      action: 'MANUAL_REVIEW',
      approvedLabel: null,
      approvedPath: null,
      approvedSource: null,
      confidence: null,
      reviewerOverrideConfidence: null,
      applyEligible: false,
      rationale: 'legalBasis.* is excluded from safe apply. Even if "Căn cứ pháp lý" looks reasonable, legalBasis labels must be reviewed separately.',
    },
    // RG-004 to RG-009: REJECTED_NO_OP — path collision
    'RG-004': { decision: 'REJECTED_NO_OP', action: 'NO_OP', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'LOW', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.' },
    'RG-005': { decision: 'REJECTED_NO_OP', action: 'NO_OP', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'LOW', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.' },
    'RG-006': { decision: 'REJECTED_NO_OP', action: 'NO_OP', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'LOW', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.' },
    'RG-007': { decision: 'REJECTED_NO_OP', action: 'NO_OP', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'LOW', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.' },
    'RG-008': { decision: 'REJECTED_NO_OP', action: 'NO_OP', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'LOW', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.' },
    'RG-009': { decision: 'REJECTED_NO_OP', action: 'NO_OP', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'LOW', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.' },
    // RG-010 to RG-024: DEFER_DOCX — Wave 02 remediation labels
    'RG-010': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'HIGH', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-011': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'HIGH', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-012': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'HIGH', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-013': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'HIGH', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-014': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-015': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-016': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-017': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-018': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-019': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-020': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-021': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-022': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-023': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
    'RG-024': { decision: 'DEFER_DOCX', action: 'MANUAL_REVIEW', approvedLabel: null, approvedPath: null, approvedSource: null, confidence: 'MEDIUM', reviewerOverrideConfidence: null, applyEligible: false, rationale: 'Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause, not just a label issue. Must be handled in a separate DOCX/metadata review lane.' },
  };

  // Build decisions array
  const decisions = review.groups.map((g) => {
    const d = decisionMap[g.reviewGroupId];
    return {
      reviewGroupId: g.reviewGroupId,
      templateCode: g.templateCode,
      path: g.path,
      decision: d.decision,
      action: d.action,
      approvedLabel: d.approvedLabel,
      approvedPath: d.approvedPath,
      approvedSource: d.approvedSource,
      confidence: d.confidence,
      reviewerOverrideConfidence: d.reviewerOverrideConfidence,
      applyEligible: d.applyEligible,
      rationale: d.rationale,
      sourceReviewGroup: {
        reviewGroupId: g.reviewGroupId,
        templateCode: g.templateCode,
        path: g.path,
        currentLabel: g.current?.label ?? null,
        currentSource: g.current?.source ?? null,
        issueCodes: g.issueCodes ?? [],
        rawPattern: g.rawPattern ?? null,
        candidateOptions: g.candidateOptions ?? [],
      },
    };
  });

  // Summarize
  const summary = {
    totalGroupsReviewed: decisions.length,
    approvedForApply: decisions.filter((d) => d.decision === 'APPROVED_FOR_APPLY').length,
    rejected: decisions.filter((d) => d.decision === 'REJECTED_NO_OP').length,
    deferredLegal: decisions.filter((d) => d.decision === 'DEFER_LEGAL').length,
    deferredDocx: decisions.filter((d) => d.decision === 'DEFER_DOCX').length,
    deferredMetadataReview: decisions.filter((d) => d.decision === 'DEFER_METADATA_REVIEW').length,
  };

  const approvedJson = {
    generatedAt: now,
    reviewBatch: 'FORMS_ROOT_CAUSE_REVIEW_BATCH_1',
    reviewer: {
      name: 'Project Owner',
      role: 'Human Reviewer',
      approvedAt: now,
    },
    summary,
    decisions,
  };

  // Write JSON
  mkdirSync(REVIEW_DIR, { recursive: true });
  writeFileSync(join(REVIEW_DIR, 'decisions.approved.json'), JSON.stringify(approvedJson, null, 2), 'utf8');
  process.stderr.write(`[DECISIONS] Written: ${join(REVIEW_DIR, 'decisions.approved.json')}\n`);

  // Build markdown
  const lines = [
    '# Review Batch 1 — Approved Decisions',
    '',
    `Generated: ${now}`,
    `Reviewer: Project Owner (Human Reviewer)`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Total groups reviewed | ${summary.totalGroupsReviewed} |`,
    `| Approved for apply | ${summary.approvedForApply} |`,
    `| Rejected (NO_OP) | ${summary.rejected} |`,
    `| Deferred legal | ${summary.deferredLegal} |`,
    `| Deferred DOCX | ${summary.deferredDocx} |`,
    '',
    '## Decisions',
    '',
    '| reviewGroupId | BM | path | decision | action | approved label | rationale |',
    '|---|---|---|---|---|---|---|',
  ];

  for (const d of decisions) {
    lines.push(
      `| ${d.reviewGroupId} | ${d.templateCode} | \`${d.path}\` | ${d.decision} | ${d.action} | ${d.approvedLabel ?? '-'} | ${d.rationale?.slice(0, 80) ?? '-'} |`
    );
  }

  lines.push('');
  lines.push('## Approved for Apply');
  lines.push('');

  const approved = decisions.filter((d) => d.decision === 'APPROVED_FOR_APPLY');
  for (const d of approved) {
    lines.push(`### ${d.reviewGroupId}: ${d.templateCode}::${d.path}`);
    lines.push('');
    lines.push(`- **Decision**: ${d.decision}`);
    lines.push(`- **Action**: ${d.action}`);
    lines.push(`- **Approved label**: \`${d.approvedLabel}\``);
    lines.push(`- **Current label**: \`${d.sourceReviewGroup.currentLabel}\``);
    lines.push(`- **Confidence**: ${d.confidence}`);
    lines.push(`- **Reviewer override**: ${d.reviewerOverrideConfidence}`);
    lines.push(`- **Apply eligible**: ${d.applyEligible}`);
    lines.push(`- **Rationale**: ${d.rationale}`);
    lines.push('');
  }

  lines.push('## Deferred / Rejected Groups');
  lines.push('');

  const deferred = decisions.filter((d) => d.decision !== 'APPROVED_FOR_APPLY');
  for (const d of deferred) {
    lines.push(`- **${d.reviewGroupId}** (${d.templateCode}::${d.path}): ${d.decision} — ${d.rationale?.slice(0, 100)}`);
  }

  writeFileSync(join(REVIEW_DIR, 'decisions.approved.md'), lines.join('\n'), 'utf8');
  process.stderr.write(`[DECISIONS] Written: ${join(REVIEW_DIR, 'decisions.approved.md')}\n`);
  process.stderr.write(`[DECISIONS] Summary: ${JSON.stringify(summary)}\n`);
}

main();
