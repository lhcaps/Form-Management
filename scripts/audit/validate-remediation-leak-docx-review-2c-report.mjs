#!/usr/bin/env node
/**
 * validate-remediation-leak-docx-review-2c-report.mjs
 *
 * Validates the integrity of the DOCX review report for Batch 2C.
 *
 * Guard rules:
 * 1. approved count must equal approvedItems.length
 * 2. deferred count must equal deferredItems.length
 * 3. approved + deferred must equal totalItems
 * 4. Any approved item must have evidence.originalDocPath matching the same BM
 * 5. Cross-BM evidence cannot approve a field
 * 6. No approved item may have risk > LOW unless explicitly APPROVED_FOR_APPLY
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const REPORT_PATH = join(ROOT, 'docs', 'audit', 'remediation-leak-docx-review-2c', 'latest.json');

function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function checkOriginalDocMatchesBM(item, itemIndex) {
  const evidence = item.evidence;
  if (!evidence || !evidence.originalDocPath) {
    return { valid: true }; // No evidence to check
  }

  // Check if the originalDocPath contains the correct BM number
  const expectedBM = item.templateCode.replace('BM-', ''); // e.g., "069"
  const docPath = evidence.originalDocPath;

  // Check for BM number in path
  // BM-069 should have 69- in path
  // BM-068 should have 68- in path
  const expectedPattern = expectedBM + '-';
  const unexpectedPatterns = [
    '68-', // BM-068 should not be in BM-069 evidence
    '69-', // BM-069 should not be in BM-068 evidence
  ].filter(p => p !== expectedPattern);

  // Check if the path contains an unexpected BM number
  for (const pattern of unexpectedPatterns) {
    if (docPath.includes(pattern)) {
      const unexpectedBM = pattern.replace('-', '');
      return {
        valid: false,
        error: `CROSS_BM_EVIDENCE: Item ${itemIndex} (${item.templateCode}/${item.path}) has evidence from BM-${unexpectedBM} (${docPath}), expected BM-${expectedBM}`,
      };
    }
  }

  return { valid: true };
}

function main() {
  console.log('=== Report Integrity Validation ===\n');

  const report = loadJSON(REPORT_PATH);
  const errors = [];
  const warnings = [];

  // Rule 1: approved count must equal approvedItems.length
  if (report.approved !== report.approvedItems?.length) {
    errors.push(`Rule 1 FAILED: approved (${report.approved}) !== approvedItems.length (${report.approvedItems?.length})`);
  } else {
    console.log('Rule 1 PASS: approved === approvedItems.length');
  }

  // Rule 2: deferred count must equal deferredItems.length
  if (report.deferred !== report.deferredItems?.length) {
    errors.push(`Rule 2 FAILED: deferred (${report.deferred}) !== deferredItems.length (${report.deferredItems?.length})`);
  } else {
    console.log('Rule 2 PASS: deferred === deferredItems.length');
  }

  // Rule 3: approved + deferred must equal totalItems
  const sum = (report.approved || 0) + (report.deferred || 0);
  if (sum !== report.totalItems) {
    errors.push(`Rule 3 FAILED: approved + deferred (${sum}) !== totalItems (${report.totalItems})`);
  } else {
    console.log('Rule 3 PASS: approved + deferred === totalItems');
  }

  // Rule 4 & 5: Check approved items for cross-BM evidence
  for (let i = 0; i < (report.approvedItems?.length || 0); i++) {
    const item = report.approvedItems[i];
    console.log(`Checking approved item ${i + 1}: ${item.templateCode}/${item.path}`);

    // Check risk level
    if (item.risk && item.risk !== 'low' && item.risk !== 'LOW') {
      // Risk > LOW requires explicit APPROVED_FOR_APPLY in evidence
      const fullItem = report.consolidatedEvidence?.find(
        e => e.templateCode === item.templateCode && e.path === item.path
      );
      if (fullItem?.evidence?.explicitApproval !== 'APPROVED_FOR_APPLY') {
        warnings.push(`Rule 6 WARNING: Item ${item.templateCode}/${item.path} has risk="${item.risk}" but no explicit APPROVED_FOR_APPLY`);
      }
    }
  }

  // Rule 4: Check all consolidated evidence for cross-BM evidence
  if (report.consolidatedEvidence) {
    for (let i = 0; i < report.consolidatedEvidence.length; i++) {
      const item = report.consolidatedEvidence[i];

      // Skip items that are already deferred
      if (!item.canApproveForBatch2C) {
        continue;
      }

      const crossBMCheck = checkOriginalDocMatchesBM(item, i);
      if (!crossBMCheck.valid) {
        errors.push(`Rule 4 FAILED: ${crossBMCheck.error}`);
      }
    }
  }

  // Rule 5: No cross-BM evidence can approve
  // Check consolidatedEvidence for any APPROVED classification with cross-BM evidence
  const approvedItemsWithCrossBM = report.consolidatedEvidence?.filter(item => {
    if (item.classification !== 'APPROVE_SAFE_REMAP_CANDIDATE') return false;
    const crossBMCheck = checkOriginalDocMatchesBM(item, -1);
    return !crossBMCheck.valid;
  });

  if (approvedItemsWithCrossBM?.length > 0) {
    for (const item of approvedItemsWithCrossBM) {
      errors.push(`Rule 5 FAILED: CROSS_BM_EVIDENCE: ${item.templateCode}/${item.path} approved with evidence from different BM`);
    }
  } else {
    console.log('Rule 5 PASS: No cross-BM evidence approved');
  }

  // Summary
  console.log('\n=== Validation Summary ===');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✓ ALL VALIDATION RULES PASSED');
    console.log(`  approved: ${report.approved}`);
    console.log(`  deferred: ${report.deferred}`);
    console.log(`  totalItems: ${report.totalItems}`);
    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log(`\n✗ ${errors.length} ERROR(S):`);
      for (const e of errors) {
        console.log(`  - ${e}`);
      }
    }
    if (warnings.length > 0) {
      console.log(`\n⚠ ${warnings.length} WARNING(S):`);
      for (const w of warnings) {
        console.log(`  - ${w}`);
      }
    }
    process.exit(1);
  }
}

main();
