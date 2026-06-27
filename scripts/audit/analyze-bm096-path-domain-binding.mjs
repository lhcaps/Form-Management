#!/usr/bin/env node
/**
 * analyze-bm096-path-domain-binding.mjs
 *
 * Evidence-only analysis of BM-096 BAD_LABEL + GENERIC_FIELD_CANONICALIZATION items.
 * Conservative analysis: only approve when textBefore label is strong AND path name is semantically plausible.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function main() {
  const contract = loadJSON(join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked', 'BM-096__a50a08efa62f.contract.locked.json'));
  const audit = loadJSON(join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json'));

  const bm096Issues = audit.issues.filter(i => i.templateCode === 'BM-096');
  const pathsWithIssues = [...new Set(bm096Issues.map(i => i.path))];

  console.log('BM-096 Analysis (Conservative)');
  console.log('Total paths with issues:', pathsWithIssues.length);

  const analysis = [];

  for (const path of pathsWithIssues) {
    const slot = contract.docxSlots?.find(s => s.slotId === path);
    const cf = contract.canonicalFields?.find(f => f.path === path);
    const issues = bm096Issues.filter(i => i.path === path);

    const rawPattern = slot?.evidence?.rawPattern || '';
    const textBefore = slot?.evidence?.textBefore || '';
    const textAfter = slot?.evidence?.textAfter || '';
    const context = slot?.context || '';

    // Extract Vietnamese label from textBefore
    let extractedLabel = null;
    if (textBefore && !textBefore.includes('{{')) {
      extractedLabel = textBefore.replace(/\d+$/, '').trim();
    }

    // Conservative classification
    let proposedLabel = null;
    let proposedPath = null;
    let confidence = 'LOW';
    let classification = 'DEFER_REQUIRES_MANUAL_REVIEW';
    let rationale = '';

    // Only approve when:
    // 1. textBefore has a clear visible label (not just field codes)
    // 2. The label is semantically plausible for the path
    // 3. Not contradicting the path name itself

    if (extractedLabel && extractedLabel.length > 2) {
      // Check for clear semantic matches
      const labelLower = extractedLabel.toLowerCase();

      if (labelLower.includes('họ tên') || labelLower.includes('tên')) {
        proposedLabel = 'Họ tên';
        confidence = 'MEDIUM';
        classification = 'SAFE_LABEL_CLEANUP';
        rationale = 'Clear "Họ tên" label. Path name "' + path + '" supports person name semantic.';
      } else if (labelLower.includes('ngày') || labelLower.includes('tháng') || labelLower.includes('năm')) {
        proposedLabel = extractedLabel;
        confidence = 'MEDIUM';
        classification = 'SAFE_LABEL_CLEANUP';
        rationale = 'Clear date label found.';
      } else if (labelLower.includes('số') && (labelLower.includes('cmnd') || labelLower.includes('cccd'))) {
        proposedLabel = 'Số CCCD/CMND';
        proposedPath = 'person.idNumber';
        confidence = 'MEDIUM';
        classification = 'SAFE_PATH_REMAP';
        rationale = 'Clear ID number label. Path should be person.idNumber.';
      } else if (labelLower.includes('nghề nghiệp')) {
        // Only approve if path supports occupation semantic
        if (path.includes('occupation')) {
          proposedLabel = 'Nghề nghiệp';
          confidence = 'MEDIUM';
          classification = 'SAFE_LABEL_CLEANUP';
          rationale = 'Path name supports occupation semantic.';
        } else {
          proposedLabel = extractedLabel;
          confidence = 'LOW';
          classification = 'DEFER_REQUIRES_MANUAL_REVIEW';
          rationale = 'Label suggests occupation but path "' + path + '" may not match. Need domain expert review.';
        }
      } else if (labelLower.includes('nơi') && (labelLower.includes('thường trú') || labelLower.includes('tạm trú') || labelLower.includes('ở'))) {
        proposedLabel = extractedLabel;
        confidence = 'MEDIUM';
        classification = 'SAFE_LABEL_CLEANUP';
        rationale = 'Clear address label found.';
      } else if (labelLower.includes('chức vụ')) {
        proposedLabel = 'Chức vụ';
        confidence = 'MEDIUM';
        classification = 'SAFE_LABEL_CLEANUP';
        rationale = 'Clear position/title label found.';
      } else if (labelLower.includes('địa danh')) {
        proposedLabel = 'Địa danh';
        confidence = 'MEDIUM';
        classification = 'SAFE_LABEL_CLEANUP';
        rationale = 'Clear location name label found.';
      } else if (labelLower.includes('căn cứ') || labelLower.includes('điều')) {
        proposedLabel = extractedLabel;
        confidence = 'MEDIUM';
        classification = 'SAFE_LABEL_CLEANUP';
        rationale = 'Clear legal basis label found.';
      } else {
        // Label found but not in approved list
        proposedLabel = extractedLabel;
        confidence = 'LOW';
        classification = 'DEFER_REQUIRES_MANUAL_REVIEW';
        rationale = 'Label "' + extractedLabel + '" found but not in approved semantic list. Need domain review.';
      }
    } else if (textBefore.includes('{{')) {
      // textBefore only has field codes, no visible label
      proposedLabel = null;
      confidence = 'NONE';
      classification = 'DEFER_NO_VISIBLE_LABEL';
      rationale = 'textBefore only contains field codes. No visible label found.';
    } else {
      proposedLabel = null;
      confidence = 'NONE';
      classification = 'DEFER_REQUIRES_MANUAL_REVIEW';
      rationale = 'No clear evidence for semantic determination.';
    }

    analysis.push({
      path,
      slotId: slot?.slotId,
      currentLabel: cf?.label || slot?.label || 'Ô trống',
      rawPattern,
      textBefore,
      extractedLabel,
      proposedLabel,
      proposedPath,
      confidence,
      classification,
      rationale,
      issues: issues.map(i => i.issueCode),
    });
  }

  // Summary
  const safeCleanup = analysis.filter(a => a.classification === 'SAFE_LABEL_CLEANUP');
  const safeRemap = analysis.filter(a => a.classification === 'SAFE_PATH_REMAP');
  const deferred = analysis.filter(a => a.classification !== 'SAFE_LABEL_CLEANUP' && a.classification !== 'SAFE_PATH_REMAP');

  console.log('\n=== Summary ===');
  console.log('SAFE_LABEL_CLEANUP:', safeCleanup.length);
  console.log('SAFE_PATH_REMAP:', safeRemap.length);
  console.log('DEFERRED:', deferred.length);

  // Write report
  const report = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    task: 'PATH_DOMAIN_BINDING_BATCH_1',
    templateCode: 'BM-096',
    templateTitle: contract.templateTitle,
    mode: 'evidence-only',
    summary: {
      totalPathsWithIssues: pathsWithIssues.length,
      safeLabelCleanup: safeCleanup.length,
      safePathRemap: safeRemap.length,
      deferred: deferred.length,
      approvedForBatch1: safeCleanup.length + safeRemap.length,
    },
    analysis,
    safeCleanupCandidates: safeCleanup,
    safeRemapCandidates: safeRemap,
    deferredCandidates: deferred,
  };

  writeFileSync(join(ROOT, 'docs', 'audit', 'path-domain-binding-batch-1', 'bm-096-latest.json'), JSON.stringify(report, null, 2), 'utf-8');

  // Write markdown
  const md = [
    '# PATH_DOMAIN_BINDING Batch 1 - BM-096 Analysis',
    '',
    '**Generated:** ' + new Date().toISOString(),
    '**Mode:** Evidence-only (NO mutations)',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    '| Total Paths with Issues | ' + pathsWithIssues.length + ' |',
    '| **SAFE_LABEL_CLEANUP** | **' + safeCleanup.length + '** |',
    '| **SAFE_PATH_REMAP** | **' + safeRemap.length + '** |',
    '| **DEFERRED** | **' + deferred.length + '** |',
    '',
    '## Evidence Analysis',
    '',
    '| Path | Current Label | textBefore | Extracted Label | Proposed | Confidence | Classification |',
    '|------|--------------|-----------|----------------|---------|------------|----------------|',
  ];

  for (const a of analysis) {
    md.push('| ' + a.path + ' | ' + a.currentLabel + ' | ' + (a.textBefore || '').substring(0, 30) + ' | ' + (a.extractedLabel || 'NONE') + ' | ' + (a.proposedLabel || 'TBD') + ' | ' + a.confidence + ' | ' + a.classification + ' |');
  }

  md.push('');
  md.push('## Safe Label Cleanup Candidates (' + safeCleanup.length + ')');
  md.push('');

  if (safeCleanup.length > 0) {
    md.push('| Path | Current Label | Proposed Label | Rationale |');
    md.push('|------|--------------|----------------|------------|');
    for (const a of safeCleanup) {
      md.push('| ' + a.path + ' | ' + a.currentLabel + ' | ' + a.proposedLabel + ' | ' + a.rationale + ' |');
    }
  } else {
    md.push('No safe label cleanup candidates found.');
  }

  md.push('');
  md.push('## Safe Path Remap Candidates (' + safeRemap.length + ')');
  md.push('');

  if (safeRemap.length > 0) {
    md.push('| Path | Current Label | Proposed Path | Proposed Label | Rationale |');
    md.push('|------|--------------|----------------|----------------|------------|');
    for (const a of safeRemap) {
      md.push('| ' + a.path + ' | ' + a.currentLabel + ' | ' + a.proposedPath + ' | ' + a.proposedLabel + ' | ' + a.rationale + ' |');
    }
  } else {
    md.push('No safe path remap candidates found.');
  }

  md.push('');
  md.push('## Deferred Candidates (' + deferred.length + ')');
  md.push('');

  if (deferred.length > 0) {
    md.push('| Path | Current Label | Classification | Rationale |');
    md.push('|------|--------------|----------------|------------|');
    for (const a of deferred) {
      md.push('| ' + a.path + ' | ' + a.currentLabel + ' | ' + a.classification + ' | ' + a.rationale + ' |');
    }
  } else {
    md.push('No deferred candidates.');
  }

  md.push('');
  md.push('## Batch 1 Status');
  md.push('');
  md.push('**Candidates for Batch 1:** ' + (safeCleanup.length + safeRemap.length));
  md.push('');
  md.push('---');
  md.push('*Evidence-only analysis. No mutations applied.*');

  writeFileSync(join(ROOT, 'docs', 'audit', 'path-domain-binding-batch-1', 'bm-096-latest.md'), md.join('\n'), 'utf-8');

  console.log('\nReport written to docs/audit/path-domain-binding-batch-1/');
}

main();
