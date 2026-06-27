#!/usr/bin/env node
/**
 * plan-remediation-leak-batch-1.mjs
 *
 * Planner for REMEDIATION_LEAK_BATCH_1_SAFE_SLOT_LABEL_CLEANUP.
 *
 * Goal: Close the safest subset of REMEDIATION_LEAK issues:
 * - slot labels that leak internal remediation text
 * - especially "Slot from Wave 02 DOCX remediation"
 * - Do NOT touch weak evidence, source policy, required flags, path/domain rewrites
 *
 * Usage:
 *   node scripts/audit/plan-remediation-leak-batch-1.mjs
 *   node scripts/audit/plan-remediation-leak-batch-1.mjs --template-code BM-068
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const ROOT_CAUSE_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'remediation-leak-batch-1');

const TEMPLATE_CODE = (() => {
  const idx = process.argv.indexOf('--template-code');
  return idx >= 0 ? process.argv[idx + 1]?.toUpperCase() : null;
})();

// Bad canonical label patterns
const BAD_LABEL_RE = [
  /^$/,                    // empty
  /^Ô trống$/,             // Ô trống
  /Slot from/i,            // Slot from
  /remediation/i,          // remediation
  /TODO/i,                  // TODO
  /unknown/i,               // unknown
  /^field\d+$/i,            // fieldN
];

// Issue codes that disqualify a field from safe slot-label mutation
const BLOCKING_ISSUE_CODES = new Set([
  'BAD_LABEL',
  'SOURCE_MISMATCH',
  'RAW_PATTERN_DOMAIN_MISMATCH',
  'GENERIC_FIELD_CANONICALIZATION',
]);

function isBadCanonicalLabel(label) {
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
  if (!contract?.canonicalFields) return null;
  return contract.canonicalFields.find(f => f.path === path) ?? null;
}

function classifyIssue(issue, allIssues) {
  const { templateCode, path, slotId, label, reason, severity, confidence } = issue;

  // Safe only if severity === "FAIL" and label contains leak keywords
  const isSlotLabelLeak =
    severity === 'FAIL' &&
    /Slot from|Wave|remediation/i.test(label);

  if (!isSlotLabelLeak) {
    return 'DEFERRED_CONTEXT_REVIEW';
  }

  // Check blocking issues on same path
  const blockingIssues = allIssues.filter(i =>
    i.templateCode === templateCode &&
    i.path === path &&
    BLOCKING_ISSUE_CODES.has(i.issueCode) &&
    i.severity === 'FAIL'
  );

  if (blockingIssues.length > 0) {
    return 'DEFERRED_CONFLICTING_FIELD_ISSUES';
  }

  // Check if canonical field exists and has good label
  const contract = loadLockedContract(templateCode);
  if (!contract) {
    return 'DEFERRED_MISSING_LOCKED_CONTRACT';
  }

  const canonicalField = findCanonicalField(contract, path);

  if (!canonicalField) {
    return 'DEFERRED_MISSING_CANONICAL_FIELD';
  }

  const canonicalLabel = canonicalField.label ?? '';

  if (isBadCanonicalLabel(canonicalLabel)) {
    return 'DEFERRED_BAD_CANONICAL_LABEL';
  }

  // Safe candidate
  return 'SAFE_SLOT_LABEL_CLEANUP_CANDIDATE';
}

function buildCandidate(issue, contract) {
  const { templateCode, path, slotId, label: labelBefore } = issue;
  const canonicalField = findCanonicalField(contract, path);
  const labelAfter = canonicalField?.label ?? '';

  return {
    templateCode,
    sourceId: issue.sourceId,
    path,
    slotId,
    labelBefore,
    labelAfter,
    canonicalPath: path,
    canonicalLabel: labelAfter,
    action: 'UPDATE_SLOT_LABEL',
    reason: `Slot label "${labelBefore}" contains remediation metadata. Canonical field label is "${labelAfter}".`,
    confidence: issue.confidence ?? 'HIGH',
    decision: null,
  };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const report = loadRootCauseReport();
  const allIssues = report.issues ?? [];

  // Filter REMEDIATION_LEAK issues
  let leakIssues = allIssues.filter(i => i.issueCode === 'REMEDIATION_LEAK');

  if (TEMPLATE_CODE) {
    leakIssues = leakIssues.filter(i => i.templateCode === TEMPLATE_CODE);
    console.log(`[plan] Filtering by template: ${TEMPLATE_CODE} (${leakIssues.length} issues)`);
  }

  // Classify each issue
  const buckets = {
    SAFE_SLOT_LABEL_CLEANUP_CANDIDATE: [],
    DEFERRED_CONTEXT_REVIEW: [],
    DEFERRED_BAD_CANONICAL_LABEL: [],
    DEFERRED_MISSING_CANONICAL_FIELD: [],
    DEFERRED_CONFLICTING_FIELD_ISSUES: [],
    DEFERRED_MISSING_LOCKED_CONTRACT: [],
  };

  const seen = new Set();
  for (const issue of leakIssues) {
    // Deduplicate: same templateCode+slotId
    const key = `${issue.templateCode}__${issue.slotId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const bucket = classifyIssue(issue, allIssues);
    buckets[bucket].push(issue);
  }

  // Build candidates with canonical labels
  const candidates = [];
  for (const issue of buckets.SAFE_SLOT_LABEL_CLEANUP_CANDIDATE) {
    const contract = loadLockedContract(issue.templateCode);
    if (contract) {
      candidates.push(buildCandidate(issue, contract));
    }
  }

  // Sort by templateCode then slotId
  candidates.sort((a, b) => {
    if (a.templateCode !== b.templateCode) return a.templateCode.localeCompare(b.templateCode);
    return a.slotId.localeCompare(b.slotId);
  });

  // Limit first batch: max 5 BM or max 20 mutations (whichever hits first)
  let batchCandidates = [];
  let bmCount = 0;
  const seenBMs = new Set();

  for (const c of candidates) {
    // Stop if both limits reached
    if (bmCount >= 5 && batchCandidates.length >= 20) break;

    // Track unique BMs
    if (!seenBMs.has(c.templateCode)) {
      seenBMs.add(c.templateCode);
      bmCount++;
    }

    batchCandidates.push(c);

    // Stop if mutations limit reached
    if (batchCandidates.length >= 20) break;
  }

  // Write plan JSON
  const plan = {
    planVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    scope: {
      issueCode: 'REMEDIATION_LEAK',
      maxBMs: 5,
      maxMutations: 20,
    },
    buckets: {
      SAFE_SLOT_LABEL_CLEANUP_CANDIDATE: candidates.length,
      DEFERRED_CONTEXT_REVIEW: buckets.DEFERRED_CONTEXT_REVIEW.length,
      DEFERRED_BAD_CANONICAL_LABEL: buckets.DEFERRED_BAD_CANONICAL_LABEL.length,
      DEFERRED_MISSING_CANONICAL_FIELD: buckets.DEFERRED_MISSING_CANONICAL_FIELD.length,
      DEFERRED_CONFLICTING_FIELD_ISSUES: buckets.DEFERRED_CONFLICTING_FIELD_ISSUES.length,
      DEFERRED_MISSING_LOCKED_CONTRACT: buckets.DEFERRED_MISSING_LOCKED_CONTRACT.length,
    },
    candidates: batchCandidates,
    allCandidates: candidates,
  };

  writeFileSync(join(OUT_DIR, 'plan.latest.json'), JSON.stringify(plan, null, 2), 'utf-8');

  // Write markdown summary
  const md = generateMarkdown(plan, buckets);
  writeFileSync(join(OUT_DIR, 'plan.latest.md'), md, 'utf-8');

  // Initialize decisions.approved.json with empty array
  const decisions = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    decisions: [],
    totalCandidates: candidates.length,
    batchCandidates: batchCandidates.length,
  };
  writeFileSync(join(OUT_DIR, 'decisions.approved.json'), JSON.stringify(decisions, null, 2), 'utf-8');

  console.log('[plan] REMEDIATION_LEAK Batch 1 Planning Complete');
  console.log(`[plan] Safe candidates: ${candidates.length}`);
  console.log(`[plan] Batch (max 5 BM / 20 mutations): ${batchCandidates.length}`);
  console.log(`[plan] Deferred buckets:`);
  for (const [bucket, count] of Object.entries(buckets)) {
    if (bucket !== 'SAFE_SLOT_LABEL_CLEANUP_CANDIDATE' && count > 0) {
      console.log(`[plan]   ${bucket}: ${count}`);
    }
  }
  console.log(`[plan] Reports written to: ${OUT_DIR}`);
}

function generateMarkdown(plan, buckets) {
  const lines = [
    '# REMEDIATION_LEAK Batch 1 - Safe Slot Label Cleanup',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    `- Issue: REMEDIATION_LEAK (slot labels leaking internal remediation text)`,
    `- Max BMs: 5`,
    `- Max mutations: 20`,
    '',
    '## Bucket Summary',
    '',
    '| Bucket | Count |',
    '|--------|-------|',
    `| SAFE_SLOT_LABEL_CLEANUP_CANDIDATE | ${buckets.SAFE_SLOT_LABEL_CLEANUP_CANDIDATE.length} |`,
    `| DEFERRED_BAD_CANONICAL_LABEL | ${buckets.DEFERRED_BAD_CANONICAL_LABEL.length} |`,
    `| DEFERRED_MISSING_CANONICAL_FIELD | ${buckets.DEFERRED_MISSING_CANONICAL_FIELD.length} |`,
    `| DEFERRED_CONFLICTING_FIELD_ISSUES | ${buckets.DEFERRED_CONFLICTING_FIELD_ISSUES.length} |`,
    `| DEFERRED_CONTEXT_REVIEW | ${buckets.DEFERRED_CONTEXT_REVIEW.length} |`,
    `| DEFERRED_MISSING_LOCKED_CONTRACT | ${buckets.DEFERRED_MISSING_LOCKED_CONTRACT.length} |`,
    '',
    '## Safe Candidates (Batch)',
    '',
  ];

  if (plan.candidates.length === 0) {
    lines.push('*No safe candidates in this batch.*');
  } else {
    lines.push('| Template | Slot | Label Before | Label After |');
    lines.push('|----------|------|--------------|-------------|');
    for (const c of plan.candidates) {
      lines.push(`| ${c.templateCode} | ${c.slotId} | ${c.labelBefore} | ${c.labelAfter} |`);
    }
  }

  lines.push('');
  lines.push('## All Candidates (Reference)');
  lines.push('');
  lines.push('| Template | Slot | Label Before | Label After |');
  lines.push('|----------|------|--------------|-------------|');
  for (const c of plan.allCandidates) {
    lines.push(`| ${c.templateCode} | ${c.slotId} | ${c.labelBefore} | ${c.labelAfter} |`);
  }

  lines.push('');
  lines.push('## Approval Required');
  lines.push('');
  lines.push('Edit `decisions.approved.json` to add approved decisions:');
  lines.push('');
  lines.push('```json');
  lines.push('{');
  lines.push('  "decisions": [');
  lines.push('    {');
  lines.push('      "templateCode": "BM-XXX",');
  lines.push('      "slotId": "path.to.field",');
  lines.push('      "decision": "APPROVED_UPDATE_SLOT_LABEL",');
  lines.push('      "action": "UPDATE_SLOT_LABEL"');
  lines.push('    }');
  lines.push('  ]');
  lines.push('}');
  lines.push('```');

  return lines.join('\n');
}

main();
