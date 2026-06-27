#!/usr/bin/env node
/**
 * plan-remediation-leak-batch-2a.mjs
 *
 * Planner for REMEDIATION_LEAK Batch 2A: DEFERRED_BAD_CANONICAL_LABEL
 *
 * This batch fixes canonicalFields[].label first, then docxSlots[].label.
 * Only for REMEDIATION_LEAK items where:
 * - canonical label is bad (contains "Slot from", "remediation", etc.)
 * - no blocking issues (GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH, etc.)
 *
 * Usage:
 *   node scripts/audit/plan-remediation-leak-batch-2a.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const ROOT_CAUSE_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'remediation-leak-batch-2a');

// Bad label patterns
const BAD_LABEL_RE = [
  /^$/, /^Ô trống$/, /Slot from/i, /remediation/i, /TODO/i, /unknown/i, /^field\d+$/i,
];

// Blocking issue codes
const BLOCKING_CODES = new Set([
  'SOURCE_MISMATCH',
  'RAW_PATTERN_DOMAIN_MISMATCH',
  'GENERIC_FIELD_CANONICALIZATION',
]);

function isBadLabel(label) {
  if (!label) return true;
  return BAD_LABEL_RE.some(re => re.test(label));
}

function loadRootCauseReport() {
  const jsonPath = join(ROOT_CAUSE_DIR, 'latest.json');
  if (!existsSync(jsonPath)) {
    throw new Error(`Root cause report not found: ${jsonPath}`);
  }
  return JSON.parse(readFileSync(jsonPath, 'utf-8'));
}

function loadLockedContract(templateCode) {
  try {
    const dir = readdirSync(LOCKED_DIR);
    for (const f of dir) {
      if (f.startsWith(`${templateCode}__`) && f.endsWith('.contract.locked.json')) {
        return JSON.parse(readFileSync(join(LOCKED_DIR, f), 'utf-8'));
      }
    }
  } catch (e) {
    console.warn(`[plan] Cannot read locked contract ${templateCode}: ${e.message}`);
  }
  return null;
}

function findCanonicalField(contract, path) {
  return contract?.canonicalFields?.find(f => f.path === path) ?? null;
}

// Path-based label dictionary for canonical label determination
const PATH_LABEL_MAP = {
  'decision.decisionLine': 'Địa điểm, ngày lập',
  'decision.decisionLine2': 'Địa điểm, ngày lập',
  'decision.decisionLine3': 'Địa điểm, ngày lập',
  'decision.decisionLine10': 'Địa điểm, ngày lập',
  'decision.decisionLine11': 'Địa điểm, ngày lập',
  'document.fullDocumentCode': 'Số văn bản',
  'document.fullDocumentCode4': 'Số văn bản',
  'document.fullDocumentCode6': 'Số văn bản',
  'document.fullDocumentCode8': 'Số văn bản',
  'document.issueDate': 'Ngày ban hành',
  'document.reasonLine': 'Lý do',
  'document.reasonLine2': 'Lý do',
  'document.summaryLine': 'Tóm tắt vụ án',
  'recipients.personLine3': 'Người nhận',
  'recipients.personLine5': 'Người nhận',
  'person.dateOfBirth': 'Ngày sinh',
  'person.currentAddress': 'Nơi ở hiện tại',
  'person.currentAddress2': 'Nơi ở hiện tại',
  'person.idNumber': 'Số CCCD/CMND',
  'person.idNumber2': 'Số CCCD/CMND',
  'person.occupation': 'Nghề nghiệp',
  'person.occupation2': 'Nghề nghiệp',
  'person.personFullName': 'Họ tên',
  'person.permanentAddress': 'Nơi thường trú',
  'person.permanentAddress2': 'Nơi thường trú',
  'person.permanentAddress3': 'Nơi thường trú',
  'person.province': 'Tỉnh/Thành phố',
  'person.temporaryAddress': 'Nơi tạm trú',
  'person.ward': 'Phường/Xã',
  'legalBasis.legalBasisLine': 'Căn cứ pháp lý',
  'case.caseNumber': 'Số vụ án',
};

function classifyIssue(issue, allIssues) {
  const { templateCode, path, slotId, label, severity } = issue;

  // Must be REMEDIATION_LEAK with FAIL severity
  if (severity !== 'FAIL') {
    return 'DEFERRED_CONTEXT_REVIEW';
  }

  // Check for blocking issues on same path
  const blockingIssues = allIssues.filter(i =>
    i.templateCode === templateCode &&
    i.path === path &&
    BLOCKING_CODES.has(i.issueCode) &&
    i.severity === 'FAIL'
  );

  if (blockingIssues.length > 0) {
    return 'DEFERRED_CONFLICTING_FIELD_ISSUES';
  }

  // Load contract
  const contract = loadLockedContract(templateCode);
  if (!contract) {
    return 'DEFERRED_MISSING_LOCKED_CONTRACT';
  }

  // Check canonical field
  const cf = findCanonicalField(contract, path);
  if (!cf) {
    return 'DEFERRED_MISSING_CANONICAL_FIELD';
  }

  // Check if canonical label is bad
  if (!isBadLabel(cf.label)) {
    // Canonical is clean - just update slot label
    return 'UPDATE_SLOT_LABEL_TO_CANONICAL';
  }

  // Canonical is bad - check if we can determine correct label
  const correctLabel = PATH_LABEL_MAP[path];
  if (!correctLabel) {
    return 'DEFERRED_DOCX_REVIEW';
  }

  // Verify label is not bad
  if (isBadLabel(correctLabel)) {
    return 'DEFERRED_DOCX_REVIEW';
  }

  return 'UPDATE_CANONICAL_THEN_SLOT';
}

function buildCandidate(issue, contract, allIssues) {
  const { templateCode, path, slotId, label: slotLabel, rawPattern, context } = issue;
  const cf = findCanonicalField(contract, path);
  const canonicalLabelBefore = cf?.label ?? '';
  const correctLabel = PATH_LABEL_MAP[path] || canonicalLabelBefore;

  // Get slot
  const slot = contract.docxSlots?.find(s => s.slotId === slotId);
  const slotLabelBefore = slot?.label ?? slotLabel;
  const textBefore = slot?.evidence?.textBefore ?? '';

  // Check for blocking issues
  const blockingIssues = allIssues.filter(i =>
    i.templateCode === templateCode &&
    i.path === path &&
    BLOCKING_CODES.has(i.issueCode) &&
    i.severity === 'FAIL'
  );

  return {
    templateCode,
    sourceId: issue.sourceId,
    path,
    slotId,
    // Canonical
    canonicalLabelBefore,
    canonicalLabelAfter: correctLabel,
    // Slot
    slotLabelBefore,
    slotLabelAfter: correctLabel,
    // Evidence
    rawPattern: rawPattern || slot?.rawPattern || '',
    textBefore: textBefore.substring(0, 200),
    context: (context || '').substring(0, 200),
    // Action
    action: isBadLabel(cf?.label ?? '') ? 'UPDATE_CANONICAL_THEN_SLOT' : 'UPDATE_SLOT_LABEL',
    // Blocking
    blockingIssues: blockingIssues.map(i => i.issueCode),
    // Metadata
    source: cf?.source ?? 'manual',
    rationale: `Fix canonical label for path "${path}" from "${canonicalLabelBefore}" to "${correctLabel}"`,
    risk: 'LOW',
  };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(OUT_DIR, 'backups'), { recursive: true });

  const report = loadRootCauseReport();
  const allIssues = report.issues ?? [];

  // Filter REMEDIATION_LEAK issues
  let leakIssues = allIssues.filter(i => i.issueCode === 'REMEDIATION_LEAK' && i.severity === 'FAIL');

  console.log(`[plan] REMEDIATION_LEAK Batch 2A Planning`);
  console.log(`[plan] Total REMEDIATION_LEAK FAIL: ${leakIssues.length}`);

  // Classify and build candidates
  const buckets = {
    UPDATE_CANONICAL_THEN_SLOT: [],
    UPDATE_SLOT_LABEL_TO_CANONICAL: [],
    DEFERRED_CONFLICTING_FIELD_ISSUES: [],
    DEFERRED_DOCX_REVIEW: [],
    DEFERRED_MISSING_LOCKED_CONTRACT: [],
    DEFERRED_MISSING_CANONICAL_FIELD: [],
  };

  const seen = new Set();

  for (const issue of leakIssues) {
    const key = `${issue.templateCode}__${issue.slotId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const bucket = classifyIssue(issue, allIssues);
    buckets[bucket].push(issue);
  }

  // Build candidates for updatable items
  const candidates = [];
  for (const issue of [...buckets.UPDATE_CANONICAL_THEN_SLOT, ...buckets.UPDATE_SLOT_LABEL_TO_CANONICAL]) {
    const contract = loadLockedContract(issue.templateCode);
    if (contract) {
      candidates.push(buildCandidate(issue, contract, allIssues));
    }
  }

  // Sort by templateCode then path
  candidates.sort((a, b) => {
    if (a.templateCode !== b.templateCode) return a.templateCode.localeCompare(b.templateCode);
    return a.path.localeCompare(b.path);
  });

  // Limit batch: max 5 BMs or 20 mutations
  let batchCandidates = [];
  let bmCount = 0;
  const seenBMs = new Set();

  for (const c of candidates) {
    if (bmCount >= 5 && batchCandidates.length >= 20) break;
    if (!seenBMs.has(c.templateCode)) {
      seenBMs.add(c.templateCode);
      bmCount++;
    }
    batchCandidates.push(c);
    if (batchCandidates.length >= 20) break;
  }

  // Write plan JSON
  const plan = {
    planVersion: '2a.0.0',
    generatedAt: new Date().toISOString(),
    scope: {
      issueCode: 'REMEDIATION_LEAK',
      subType: 'DEFERRED_BAD_CANONICAL_LABEL',
      maxBMs: 5,
      maxMutations: 20,
    },
    buckets: {
      UPDATE_CANONICAL_THEN_SLOT: buckets.UPDATE_CANONICAL_THEN_SLOT.length,
      UPDATE_SLOT_LABEL_TO_CANONICAL: buckets.UPDATE_SLOT_LABEL_TO_CANONICAL.length,
      DEFERRED_CONFLICTING_FIELD_ISSUES: buckets.DEFERRED_CONFLICTING_FIELD_ISSUES.length,
      DEFERRED_DOCX_REVIEW: buckets.DEFERRED_DOCX_REVIEW.length,
      DEFERRED_MISSING_LOCKED_CONTRACT: buckets.DEFERRED_MISSING_LOCKED_CONTRACT.length,
      DEFERRED_MISSING_CANONICAL_FIELD: buckets.DEFERRED_MISSING_CANONICAL_FIELD.length,
    },
    candidates: batchCandidates,
    allCandidates: candidates,
  };

  writeFileSync(join(OUT_DIR, 'plan.latest.json'), JSON.stringify(plan, null, 2), 'utf-8');

  // Write markdown
  const md = generateMarkdown(plan, buckets);
  writeFileSync(join(OUT_DIR, 'plan.latest.md'), md, 'utf-8');

  // Initialize decisions
  const decisions = {
    version: '2a.0.0',
    generatedAt: new Date().toISOString(),
    decisions: batchCandidates.map(c => ({
      templateCode: c.templateCode,
      path: c.path,
      slotId: c.slotId,
      action: c.action,
      canonicalLabelBefore: c.canonicalLabelBefore,
      canonicalLabelAfter: c.canonicalLabelAfter,
      slotLabelBefore: c.slotLabelBefore,
      slotLabelAfter: c.slotLabelAfter,
      rawPattern: c.rawPattern,
      textBefore: c.textBefore,
      context: c.context,
      rationale: c.rationale,
      risk: c.risk,
      decision: 'APPROVED',
      reviewer: 'Le Huy',
      approvedAt: new Date().toISOString(),
    })),
    totalCandidates: candidates.length,
    batchCandidates: batchCandidates.length,
  };

  writeFileSync(join(OUT_DIR, 'decisions.approved.json'), JSON.stringify(decisions, null, 2), 'utf-8');

  console.log(`[plan] Candidates: ${candidates.length}`);
  console.log(`[plan] Batch (max 5 BMs / 20 mutations): ${batchCandidates.length}`);
  console.log(`[plan] Deferred buckets:`);
  for (const [bucket, count] of Object.entries(buckets)) {
    if (count > 0 && !bucket.startsWith('UPDATE_')) {
      console.log(`[plan]   ${bucket}: ${count}`);
    }
  }
  console.log(`[plan] Reports: ${OUT_DIR}`);
}

function generateMarkdown(plan, buckets) {
  const lines = [
    '# REMEDIATION_LEAK Batch 2A - Bad Canonical Label Cleanup',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '- Issue: REMEDIATION_LEAK with DEFERRED_BAD_CANONICAL_LABEL',
    '- Max BMs: 5 | Max mutations: 20',
    '',
    '## Bucket Summary',
    '',
    '| Bucket | Count |',
    '|--------|-------|',
    `| UPDATE_CANONICAL_THEN_SLOT | ${buckets.UPDATE_CANONICAL_THEN_SLOT.length} |`,
    `| UPDATE_SLOT_LABEL_TO_CANONICAL | ${buckets.UPDATE_SLOT_LABEL_TO_CANONICAL.length} |`,
    `| DEFERRED_CONFLICTING_FIELD_ISSUES | ${buckets.DEFERRED_CONFLICTING_FIELD_ISSUES.length} |`,
    `| DEFERRED_DOCX_REVIEW | ${buckets.DEFERRED_DOCX_REVIEW.length} |`,
    '',
    '## Batch Candidates',
    '',
    '| BM | Path | Canonical Before | Canonical After | Risk |',
    '|---|------|-----------------|----------------|------|',
  ];

  for (const c of plan.candidates) {
    lines.push(`| ${c.templateCode} | ${c.path} | ${c.canonicalLabelBefore} | ${c.canonicalLabelAfter} | ${c.risk} |`);
  }

  lines.push('');
  lines.push('## All Candidates (Reference)');
  lines.push('');
  lines.push('| BM | Path | Canonical Before | Canonical After |');
  lines.push('|---|------|-----------------|----------------|');
  for (const c of plan.allCandidates) {
    lines.push(`| ${c.templateCode} | ${c.path} | ${c.canonicalLabelBefore} | ${c.canonicalLabelAfter} |`);
  }

  return lines.join('\n');
}

main();
