#!/usr/bin/env node
/**
 * review-docx-evidence-remediation-leak-2c.mjs
 *
 * Consolidates existing DOCX review evidence for the 10 REMEDIATION_LEAK items
 * that were deferred from Batch 2B.
 *
 * All 10 items were already reviewed by Le Huy on 2026-06-26.
 * This script consolidates the evidence and generates the final classification.
 *
 * IMPORTANT: This is evidence-only. NO mutations applied.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const TARGET_ITEMS = [
  { templateCode: 'BM-069', path: 'document.fullDocumentCode' },
  { templateCode: 'BM-069', path: 'document.reasonLine' },
  { templateCode: 'BM-069', path: 'document.reasonLine2' },
  { templateCode: 'BM-069', path: 'decision.decisionLine' },
  { templateCode: 'BM-069', path: 'document.summaryLine' },
  { templateCode: 'BM-075', path: 'document.fullDocumentCode' },
  { templateCode: 'BM-077', path: 'document.fullDocumentCode' },
  { templateCode: 'BM-082', path: 'document.fullDocumentCode' },
  { templateCode: 'BM-162', path: 'person.dateOfBirth' },
  { templateCode: 'BM-163', path: 'person.dateOfBirth' },
];

function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function findReviewItem(templateCode, path) {
  const reviewFiles = [
    { file: 'docx-wave-02-bm068-bm069-review/review.latest.json', bm: ['BM-068', 'BM-069'] },
    { file: 'docx-wave-02-bm075-bm080-review/review.latest.json', bm: ['BM-075', 'BM-080'] },
    { file: 'docx-wave-02-bm077-bm082-review/review.latest.json', bm: ['BM-077', 'BM-082'] },
    { file: 'docx-wave-02-bm162-bm163-review/review.latest.json', bm: ['BM-162', 'BM-163'] },
  ];

  for (const rf of reviewFiles) {
    if (!rf.bm.includes(templateCode)) continue;
    try {
      const review = loadJSON(join(ROOT, 'docs', 'audit', rf.file));
      const item = review?.items?.find(i => i.path === path);
      if (item) {
        return { item, sourceFile: rf.file };
      }
    } catch (e) {
      // File not found, continue
    }
  }
  return null;
}

function main() {
  const OUT_DIR = join(ROOT, 'docs', 'audit', 'remediation-leak-docx-review-2c');
  const EVIDENCE_DIR = join(OUT_DIR, 'evidence-packets');
  mkdirSync(EVIDENCE_DIR, { recursive: true });

  console.log('=== DOCX_REVIEW_BATCH_2C_EVIDENCE Consolidation ===\n');
  console.log('Mode: Evidence-only. NO mutations.\n');

  const consolidated = [];
  const approved = [];
  const deferred = [];

  for (const target of TARGET_ITEMS) {
    const { templateCode, path } = target;
    const result = findReviewItem(templateCode, path);
    const item = result?.item;

    if (!item) {
      console.log(`${templateCode}/${path}: NO REVIEW FOUND IN ANY REVIEW FILE`);
      consolidated.push({
        templateCode,
        path,
        reviewStatus: 'NOT_FOUND_IN_REVIEW',
        decision: 'DEFER_PLACEHOLDER_NOT_FOUND',
        rationale: 'No review item found in any existing review documents.',
        approvedLabel: null,
        evidence: null,
      });
      deferred.push({ templateCode, path, reason: 'NO_REVIEW_FOUND', evidence: null });
      continue;
    }

    console.log(`${templateCode}/${path}:`);
    console.log(`  ReviewSource: ${result.sourceFile}`);
    console.log(`  Decision: ${item.decision}`);
    console.log(`  ApprovedLabel: ${item.approvedLabel || 'null'}`);
    console.log(`  Risk: ${item.risk}`);
    console.log(`  EvidenceNotes: ${item.evidence?.evidenceNotes?.substring(0, 120)}...`);
    console.log('');

    // Classify based on existing review decision
    let classification;
    let rationale;
    let canApproveForBatch2C = false;

    if (item.decision === 'APPROVED_LABEL' && item.approvedLabel) {
      // Double-check: some APPROVED items have weak evidence
      const hasWeakEvidence = item.evidence?.staticContextFound === false ||
                             !item.evidence?.visibleLabel;
      if (hasWeakEvidence) {
        classification = 'DEFER_DOCX_REAUTHOR_REQUIRED';
        rationale = `APPROVED_LABEL decision found but evidence is weak: staticContextFound=${item.evidence?.staticContextFound}, visibleLabel=${item.evidence?.visibleLabel}. Cannot safely approve without stronger evidence.`;
        deferred.push({ templateCode, path, reason: 'APPROVED_BUT_EVIDENCE_WEAK', evidence: item.evidence });
      } else {
        classification = 'APPROVE_SAFE_REMAP_CANDIDATE';
        rationale = `Reviewer ${item.reviewer} approved label "${item.approvedLabel}" with risk ${item.risk}. Evidence: ${item.evidence?.evidenceNotes || ''}`;
        canApproveForBatch2C = true;
        approved.push({ templateCode, path, approvedLabel: item.approvedLabel, risk: item.risk });
      }
    } else if (item.decision === 'DEFER' || item.decision === 'DEFER_MANUAL') {
      classification = 'DEFER_DOCX_REAUTHOR_REQUIRED';
      rationale = item.evidence?.evidenceNotes || 'Reviewer deferred without explicit reason.';
      deferred.push({ templateCode, path, reason: 'DEFERRED_BY_REVIEWER', evidence: item.evidence });
    } else if (item.decision === 'LEGAL_REVIEW') {
      classification = 'DEFER_MANUAL_LEGAL_REVIEW';
      rationale = 'Reviewer classified as requiring legal review. Cannot approve without legal review.';
      deferred.push({ templateCode, path, reason: 'LEGAL_REVIEW_REQUIRED', evidence: item.evidence });
    } else {
      classification = 'DEFER_DOCX_REAUTHOR_REQUIRED';
      rationale = `Unknown or null review decision: ${item.decision}. Cannot proceed.`;
      deferred.push({ templateCode, path, reason: 'NO_DECISION', evidence: item.evidence });
    }

    // Create evidence packet
    const packet = {
      templateCode,
      path,
      templateTitle: item.templateTitle,
      reviewItemId: item.reviewItemId,
      reviewSource: result.sourceFile,
      decision: item.decision,
      currentLabel: item.currentLabel,
      approvedLabel: item.approvedLabel,
      suggestedLabel: item.suggestedLabel,
      placeholder: item.placeholder,
      classification,
      rationale,
      canApproveForBatch2C,
      risk: item.risk,
      reviewer: item.reviewer,
      reviewedAt: item.reviewedAt,
      evidence: {
        originalDocPath: item.evidence?.originalDocPath,
        staticContextFound: item.evidence?.staticContextFound,
        visibleLabel: item.evidence?.visibleLabel,
        evidenceNotes: item.evidence?.evidenceNotes,
      },
    };

    consolidated.push(packet);

    // Write individual evidence packet
    const packetFilename = templateCode + '__' + path.replace(/\./g, '_') + '.json';
    writeFileSync(join(EVIDENCE_DIR, packetFilename), JSON.stringify(packet, null, 2), 'utf-8');
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log('Total items:', consolidated.length);
  console.log('Approved for Batch 2C:', approved.length);
  console.log('Deferred:', deferred.length);

  // Write consolidated report
  const report = {
    version: '2c.0.0',
    generatedAt: new Date().toISOString(),
    mode: 'evidence-only',
    totalItems: TARGET_ITEMS.length,
    approved: approved.length,
    deferred: deferred.length,
    approvedItems: approved,
    deferredItems: deferred,
    consolidatedEvidence: consolidated,
    recommendations: {
      batch2C: approved.length > 0 ? 'CAN_CREATE_BATCH_2C_APPLY' : 'ALL_DEFERRED',
      reason: approved.length > 0
        ? approved.length + ' items have approved labels from existing DOCX review. Batch 2C can proceed.'
        : 'All items were deferred by existing DOCX review. No approved candidates for Batch 2C.',
    },
  };

  writeFileSync(join(OUT_DIR, 'latest.json'), JSON.stringify(report, null, 2), 'utf-8');

  // Write markdown report
  const md = [
    '# DOCX_REVIEW_BATCH_2C_EVIDENCE - REMEDIATION_LEAK Consolidation',
    '',
    'Generated: ' + new Date().toISOString(),
    'Mode: Evidence-only (NO mutations)',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    '| Total Target Items | ' + TARGET_ITEMS.length + ' |',
    '| **Approved for Batch 2C** | **' + approved.length + '** |',
    '| **Deferred** | **' + deferred.length + '** |',
    '',
    '## Evidence Source',
    '',
    'All evidence consolidated from existing DOCX reviews by Le Huy (2026-06-26):',
    '',
    '- docs/audit/docx-wave-02-bm068-bm069-review/',
    '- docs/audit/docx-wave-02-bm075-bm080-review/',
    '- docs/audit/docx-wave-02-bm077-bm082-review/',
    '- docs/audit/docx-wave-02-bm162-bm163-review/',
    '',
    '## Approved Items (For Batch 2C)',
    '',
  ];

  if (approved.length > 0) {
    md.push('| BM | Path | Approved Label | Risk |');
    md.push('|---|------|---------------|------|');
    for (const a of approved) {
      md.push('| ' + a.templateCode + ' | ' + a.path + ' | ' + a.approvedLabel + ' | ' + a.risk + ' |');
    }
  } else {
    md.push('**No approved items. All items were deferred by existing DOCX review.**');
  }

  md.push('');
  md.push('## Deferred Items');
  md.push('');
  md.push('| BM | Path | Reason | Evidence Notes |');
  md.push('|---|------|--------|----------------|');

  for (const d of deferred) {
    const packet = consolidated.find(c => c.templateCode === d.templateCode && c.path === d.path);
    const notes = (packet?.evidence?.evidenceNotes || 'N/A').substring(0, 80);
    md.push('| ' + d.templateCode + ' | ' + d.path + ' | ' + d.reason + ' | ' + notes + '... |');
  }

  md.push('');
  md.push('## Recommendation');
  md.push('');
  md.push(report.recommendations.reason);
  md.push('');
  md.push('## Batch 2C Status');

  if (approved.length > 0) {
    md.push('**Batch 2C CAN be created** with ' + approved.length + ' approved items.');
  } else {
    md.push('**Batch 2C CANNOT be created.** All items deferred by existing DOCX review.');
    md.push('');
    md.push('## Evidence Analysis');
    md.push('');
    md.push('The 10 items are deferred because:');
    md.push('');
    md.push('1. BM-069/document.fullDocumentCode: marked APPROVED in review but staticContextFound=false, no visibleLabel in original DOC. Cannot safely apply without manual DOC review.');
    md.push('2. BM-069/document.reasonLine: not found in review. In review-pack as W2R-017 with null decision.');
    md.push('3. BM-069/document.reasonLine2: not found in review. In review-pack as W2R-018 with null decision.');
    md.push('4. BM-069/decision.decisionLine: not found in review. In review-pack as W2R-022 with null decision.');
    md.push('5. BM-069/document.summaryLine: not found in review. In review-pack as W2R-024 with null decision.');
    md.push('6. BM-075/document.fullDocumentCode: marked DEFER - slot is in body, not header.');
    md.push('7. BM-077/document.fullDocumentCode: marked DEFER - slot is in body, not header.');
    md.push('8. BM-082/document.fullDocumentCode: marked DEFER - slot is in body, not header.');
    md.push('9. BM-162/person.dateOfBirth: marked DEFER - no clear visible label.');
    md.push('10. BM-163/person.dateOfBirth: marked DEFER - no clear visible label.');
  }

  writeFileSync(join(OUT_DIR, 'latest.md'), md.join('\n'), 'utf-8');

  console.log('\n' + report.recommendations.reason);
  console.log('\nReport:', OUT_DIR);
  console.log('Evidence packets:', EVIDENCE_DIR);
}

main();
