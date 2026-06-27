#!/usr/bin/env node
/**
 * scripts/audit/validate-bm096-single-candidate-review.mjs
 *
 * Validates BM-096 single candidate review packet.
 * Ensures proposed-only mode, no approved decisions, exact candidate path,
 * and no mutation artifacts.
 *
 * Run: node scripts/audit/validate-bm096-single-candidate-review.mjs
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const REVIEW_DIR = join(ROOT, 'docs', 'audit', 'path-domain-binding-batch-1-bm096-single-candidate');

const VALID_RECOMMENDATIONS = [
  'PROPOSE_APPROVE_SAFE_REMAP',
  'DEFER_PATH_COLLISION',
  'DEFER_SOURCE_POLICY_CONFLICT',
  'DEFER_RENDER_BINDING_CONFLICT',
  'DEFER_DOCX_EVIDENCE_WEAK',
];

const VALID_RISKS = ['LOW', 'MEDIUM', 'HIGH'];

const ERRORS = [];
const WARNINGS = [];

function log(level, message) {
  const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
  console.log(`${prefix} [${level}] ${message}`);
}

function loadJson(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    ERRORS.push(`Failed to parse ${filePath}: ${e.message}`);
    return null;
  }
}

function validateFileExistence() {
  console.log('\n📁 File Existence\n');

  const reviewPath = join(REVIEW_DIR, 'review.latest.json');
  const decisionPath = join(REVIEW_DIR, 'decision.proposed.json');

  if (!existsSync(reviewPath)) {
    ERRORS.push('review.latest.json not found');
  } else {
    log('OK', 'review.latest.json exists');
  }

  if (!existsSync(decisionPath)) {
    ERRORS.push('decision.proposed.json not found');
  } else {
    log('OK', 'decision.proposed.json exists');
  }

  return { reviewPath, decisionPath };
}

function validateMode(decision) {
  console.log('\n🔒 Mode Enforcement\n');

  if (!decision) {
    ERRORS.push('decision.proposed.json is null');
    return;
  }

  if (decision.mode !== 'PROPOSED_ONLY_NOT_APPROVED') {
    ERRORS.push(`mode must be PROPOSED_ONLY_NOT_APPROVED, got: ${decision.mode}`);
  } else {
    log('OK', 'Mode is PROPOSED_ONLY_NOT_APPROVED');
  }

  const approved = decision.decisions?.filter(d => d.approved === true) || [];
  if (approved.length > 0) {
    ERRORS.push(`No approved decisions allowed, found ${approved.length}`);
  } else {
    log('OK', 'No approved decisions');
  }
}

function validateExactCandidate(decision) {
  console.log('\n🎯 Exact Candidate Path\n');

  if (!decision?.decisions) {
    ERRORS.push('decision.decisions is null or empty');
    return;
  }

  for (const d of decision.decisions) {
    if (d.templateCode !== 'BM-096') {
      ERRORS.push(`templateCode must be BM-096, got: ${d.templateCode}`);
    } else {
      log('OK', `templateCode: ${d.templateCode}`);
    }

    if (d.oldPath !== 'document.diaChi') {
      ERRORS.push(`Only document.diaChi allowed, got: ${d.oldPath}`);
    } else {
      log('OK', `oldPath: ${d.oldPath}`);
    }

    if (d.newPath !== 'person.idNumber') {
      ERRORS.push(`newPath must be person.idNumber, got: ${d.newPath}`);
    } else {
      log('OK', `newPath: ${d.newPath}`);
    }

    if (d.newLabel !== 'Số CCCD/CMND') {
      ERRORS.push(`newLabel must be "Số CCCD/CMND", got: ${d.newLabel}`);
    } else {
      log('OK', `newLabel: ${d.newLabel}`);
    }
  }
}

function validateSignatureExclusion(decision) {
  console.log('\n🚫 Signature Exclusion\n');

  if (!decision?.decisions) return;

  const signatureCheDo = decision.decisions.filter(d =>
    d.oldPath?.startsWith('signature.cheDo')
  );
  if (signatureCheDo.length > 0) {
    ERRORS.push('signature.cheDo must NOT be in decisions');
  } else {
    log('OK', 'signature.cheDo excluded');
  }

  const signatureNguoiKy = decision.decisions.filter(d =>
    d.oldPath?.startsWith('signature.nguoiKy')
  );
  if (signatureNguoiKy.length > 0) {
    ERRORS.push('signature.nguoiKy must NOT be in decisions');
  } else {
    log('OK', 'signature.nguoiKy excluded');
  }
}

function validateCollisionChecks(decision) {
  console.log('\n🔍 Collision Checks\n');

  if (!decision?.decisions) return;

  const diaChi = decision.decisions.find(d => d.oldPath === 'document.diaChi');
  if (!diaChi) {
    ERRORS.push('document.diaChi decision not found');
    return;
  }

  if (!diaChi.collisionCheck) {
    ERRORS.push('collisionCheck must exist for document.diaChi');
    return;
  }

  const checks = [
    ['canonicalFields', 'NO_COLLISION'],
    ['docxSlots', 'NO_COLLISION'],
    ['renderBindings', 'NO_COLLISION'],
  ];

  for (const [key, expected] of checks) {
    if (diaChi.collisionCheck[key] !== expected) {
      ERRORS.push(`${key} collision must be ${expected}, got: ${diaChi.collisionCheck[key]}`);
    } else {
      log('OK', `${key}: ${expected}`);
    }
  }
}

function validateSafetyCriteria(decision) {
  console.log('\n🔐 Safety Criteria\n');

  if (!decision?.decisions) return;

  const diaChi = decision.decisions.find(d => d.oldPath === 'document.diaChi');
  if (!diaChi) return;

  if (!diaChi.rawPattern || diaChi.rawPattern.trim() === '') {
    ERRORS.push('rawPattern must not be empty');
  } else {
    log('OK', `rawPattern: "${diaChi.rawPattern}"`);
  }

  if (!diaChi.evidenceTextBefore) {
    ERRORS.push('evidenceTextBefore must exist');
  } else if (/^\{\{document\.\w+\}\}$/.test(diaChi.evidenceTextBefore.trim())) {
    ERRORS.push('evidenceTextBefore must not be placeholder-only');
  } else {
    log('OK', `evidenceTextBefore: "${diaChi.evidenceTextBefore}"`);
  }

  const mutations = diaChi.mutationsNeededIfApprovedLater ?? diaChi.mutationsNeeded;
  if (!mutations || mutations.length === 0) {
    ERRORS.push('mutationsNeededIfApprovedLater must not be empty');
  } else {
    log('OK', `mutationsNeededIfApprovedLater: ${mutations.join(', ')}`);
  }

  if (diaChi.reviewerRequired !== true) {
    ERRORS.push('reviewerRequired must be true');
  } else {
    log('OK', 'reviewerRequired: true');
  }

  if (!diaChi.risk || !VALID_RISKS.includes(diaChi.risk)) {
    ERRORS.push(`risk must be LOW/MEDIUM/HIGH, got: ${diaChi.risk}`);
  } else {
    log('OK', `risk: ${diaChi.risk}`);
  }

  if (!diaChi.recommendation || !VALID_RECOMMENDATIONS.includes(diaChi.recommendation)) {
    ERRORS.push(`recommendation must be valid, got: ${diaChi.recommendation}`);
  } else {
    log('OK', `recommendation: ${diaChi.recommendation}`);
  }
}

function validateNoWriteArtifacts() {
  console.log('\n📦 No Write Artifacts\n');

  if (!existsSync(REVIEW_DIR)) {
    WARNINGS.push('Review directory does not exist yet (may be expected)');
    return;
  }

  const files = readdirSync(REVIEW_DIR);

  const mutationFiles = files.filter(f =>
    f.includes('mutation') || f.includes('apply') || f.includes('approved')
  );
  if (mutationFiles.length > 0) {
    ERRORS.push(`No mutation/apply artifacts allowed: ${mutationFiles.join(', ')}`);
  } else {
    log('OK', 'No mutation/apply artifacts');
  }

  const lockedFiles = files.filter(f => f.includes('.contract.locked.json'));
  if (lockedFiles.length > 0) {
    ERRORS.push(`No locked contract files allowed: ${lockedFiles.length} found`);
  } else {
    log('OK', 'No locked contract files');
  }

  const compiledFiles = files.filter(f => f.includes('compiled-v2'));
  if (compiledFiles.length > 0) {
    ERRORS.push(`No compiled-v2 files allowed: ${compiledFiles.length} found`);
  } else {
    log('OK', 'No compiled-v2 files');
  }
}

function validateReviewPacket(review) {
  console.log('\n📋 Review Packet Completeness\n');

  if (!review) {
    WARNINGS.push('review.latest.json not loaded');
    return;
  }

  if (review.templateCode !== 'BM-096') {
    ERRORS.push(`review.templateCode must be BM-096, got: ${review.templateCode}`);
  } else {
    log('OK', `review.templateCode: ${review.templateCode}`);
  }

  const candidates = review.candidates || review.analysis || [];
  const diaChi = candidates.find(c =>
    c.path === 'document.diaChi' || c.oldPath === 'document.diaChi'
  );

  if (!diaChi) {
    ERRORS.push('document.diaChi not found in review candidates');
  } else {
    log('OK', 'document.diaChi found in review');
  }

  if (diaChi?.collisionCheck || diaChi?.collision_result) {
    log('OK', 'Collision check present in review');
  } else {
    WARNINGS.push('Collision check not found in review');
  }

  if (diaChi?.issues || diaChi?.issueCodes || diaChi?.coOccurringIssues) {
    log('OK', 'Co-occurring issues present in review');
  } else {
    WARNINGS.push('Co-occurring issues not found in review');
  }
}

function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 VALIDATION SUMMARY\n');

  if (WARNINGS.length > 0) {
    console.log(`⚠️  Warnings: ${WARNINGS.length}`);
    for (const w of WARNINGS) {
      console.log(`   - ${w}`);
    }
    console.log('');
  }

  if (ERRORS.length > 0) {
    console.log(`❌ Errors: ${ERRORS.length}`);
    for (const e of ERRORS) {
      console.log(`   - ${e}`);
    }
    console.log('');
    console.log('❌ VALIDATION FAILED\n');
    process.exit(1);
  }

  console.log('✅ ALL VALIDATIONS PASSED\n');
  process.exit(0);
}

function main() {
  console.log('🔒 BM-096 Single Candidate Review Validator\n');
  console.log('═'.repeat(60));

  const { reviewPath, decisionPath } = validateFileExistence();
  const review = loadJson(reviewPath);
  const decision = loadJson(decisionPath);

  validateMode(decision);
  validateExactCandidate(decision);
  validateSignatureExclusion(decision);
  validateCollisionChecks(decision);
  validateSafetyCriteria(decision);
  validateNoWriteArtifacts();
  validateReviewPacket(review);

  printSummary();
}

main();
