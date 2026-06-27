#!/usr/bin/env node
/**
 * validate-path-domain-batch-1-bm096-plan.mjs
 *
 * Validates the integrity of the BM-096 path-domain binding plan.
 *
 * Guard rules:
 * 1. SAFE_LABEL_CLEANUP must keep the same semantic domain.
 * 2. A path starting with 'signature.' cannot receive person-address labels.
 * 3. A path starting with 'document.' cannot receive person-specific labels unless path remap.
 * 4. SAFE_PATH_REMAP must have collision check result.
 * 5. approvedForBatch1 count must match real candidates.
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const REPORT_PATH = join(ROOT, 'docs', 'audit', 'path-domain-binding-batch-1', 'bm-096-latest.json');

// Labels that belong to person domain (not signature/document domain)
const PERSON_DOMAIN_LABELS = [
  'nơi thường trú',
  'nơi tạm trú',
  'nơi ở',
  'số cccd',
  'số cmnd',
  'ngày sinh',
  'sinh ngày',
  'nghề nghiệp',
  'họ tên',
];

function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function isPersonDomainLabel(label) {
  if (!label) return false;
  const lower = label.toLowerCase();
  return PERSON_DOMAIN_LABELS.some(p => lower.includes(p));
}

function checkDomainMismatch(path, proposedLabel) {
  const pathDomain = path.split('.')[0]; // e.g., 'signature', 'document', 'person'

  // If proposed label is person domain but path is not person, it's a mismatch
  if (isPersonDomainLabel(proposedLabel) && pathDomain !== 'person') {
    return true;
  }

  return false;
}

function main() {
  console.log('=== BM-096 Plan Integrity Validation ===\n');

  const report = loadJSON(REPORT_PATH);
  const errors = [];
  const warnings = [];

  // Rule 1: Check SAFE_LABEL_CLEANUP candidates for domain mismatch
  console.log('Checking SAFE_LABEL_CLEANUP candidates...');
  for (const candidate of report.safeCleanupCandidates || []) {
    const domainMismatch = checkDomainMismatch(candidate.path, candidate.proposedLabel);
    if (domainMismatch) {
      errors.push(`Rule 1 FAILED: SAFE_LABEL_CLEANUP '${candidate.path}' with label '${candidate.proposedLabel}' is domain mismatch (path is ${candidate.path.split('.')[0]}, label is person domain)`);
    } else {
      console.log(`  ${candidate.path}: OK (same domain)`);
    }
  }

  // Rule 2: signature.* paths cannot have person domain labels
  console.log('\nChecking signature.* paths...');
  const signaturePaths = (report.analysis || []).filter(a => a.path.startsWith('signature.'));
  for (const path of signaturePaths) {
    const hasPersonLabel = isPersonDomainLabel(path.extractedLabel) ||
                          isPersonDomainLabel(path.proposedLabel);
    if (hasPersonLabel && path.classification === 'SAFE_LABEL_CLEANUP') {
      errors.push(`Rule 2 FAILED: signature.${path.path} has person domain label but is marked SAFE_LABEL_CLEANUP`);
    }
  }

  // Rule 3: document.* paths cannot have person-specific labels unless path remap
  console.log('\nChecking document.* paths...');
  const documentPaths = (report.analysis || []).filter(a => a.path.startsWith('document.'));
  for (const path of documentPaths) {
    const hasPersonLabel = isPersonDomainLabel(path.extractedLabel) ||
                          isPersonDomainLabel(path.proposedLabel);
    if (hasPersonLabel && path.classification === 'SAFE_LABEL_CLEANUP') {
      errors.push(`Rule 3 FAILED: document.${path.path} has person domain label but is marked SAFE_LABEL_CLEANUP (should be SAFE_PATH_REMAP)`);
    }
  }

  // Rule 4: SAFE_PATH_REMAP must have collision check
  console.log('\nChecking SAFE_PATH_REMAP candidates...');
  for (const candidate of report.safeRemapCandidates || []) {
    if (!candidate.collisionCheck) {
      errors.push(`Rule 4 FAILED: SAFE_PATH_REMAP '${candidate.path}' missing collisionCheck`);
    } else if (!candidate.collisionCheck.safeToRemap) {
      errors.push(`Rule 4 FAILED: SAFE_PATH_REMAP '${candidate.path}' collisionCheck.safeToRemap is false`);
    } else {
      console.log(`  ${candidate.path}: collisionCheck OK (safeToRemap=${candidate.collisionCheck.safeToRemap})`);
    }
  }

  // Rule 5: approvedForBatch1 must match real candidates
  const realCandidates = (report.safeCleanupCandidates?.length || 0) + (report.safeRemapCandidates?.length || 0);
  if (report.summary?.approvedForBatch1 !== realCandidates) {
    errors.push(`Rule 5 FAILED: approvedForBatch1 (${report.summary?.approvedForBatch1}) !== safeCleanup (${report.safeCleanupCandidates?.length || 0}) + safeRemap (${report.safeRemapCandidates?.length || 0}) = ${realCandidates}`);
  } else {
    console.log(`\nRule 5 PASS: approvedForBatch1 (${report.summary?.approvedForBatch1}) === ${realCandidates}`);
  }

  // Additional check: signature paths with person labels should be DEFER_PATH_DOMAIN_MISMATCH
  console.log('\nChecking signature paths with person labels...');
  for (const analysis of report.analysis || []) {
    if (analysis.path.startsWith('signature.') && isPersonDomainLabel(analysis.extractedLabel)) {
      if (analysis.classification !== 'DEFER_PATH_DOMAIN_MISMATCH') {
        errors.push(`ADDITIONAL CHECK FAILED: '${analysis.path}' has person domain label but is '${analysis.classification}' (expected DEFER_PATH_DOMAIN_MISMATCH)`);
      } else {
        console.log(`  ${analysis.path}: correctly DEFER_PATH_DOMAIN_MISMATCH`);
      }
    }
  }

  // Summary
  console.log('\n=== Validation Summary ===');
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✓ ALL VALIDATION RULES PASSED');
    console.log(`  approvedForBatch1: ${report.summary?.approvedForBatch1}`);
    console.log(`  safeLabelCleanup: ${report.summary?.safeLabelCleanup}`);
    console.log(`  safePathRemap: ${report.summary?.safePathRemap}`);
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
