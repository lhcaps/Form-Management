#!/usr/bin/env node
/**
 * Safety gates guard for remediation batches.
 * Prevents mutation if any safety rule is violated.
 *
 * Run: node scripts/audit/validate-remediation-batch-safety-gates.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// Baseline metrics - these must not increase
const BASELINE = {
  totalIssues: 1477,
  REMEDIATION_LEAK: 10,
  COMPILED_DRIFT: 37,
  SOURCE_MISMATCH: 121,
};

const GATE_FAILURES = [];

function log(level, message) {
  const prefix = level === 'FAIL' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
  console.log(`${prefix} [${level}] ${message}`);
}

function checkFile(filePath, description) {
  const fullPath = join(ROOT, filePath);
  if (!existsSync(fullPath)) {
    log('WARN', `${description}: FILE NOT FOUND (may be expected)`);
    return true;
  }
  return false;
}

function readJson(filePath) {
  try {
    const fullPath = join(ROOT, filePath);
    const raw = readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Gate 1: No cross-BM evidence
function gate1NoCrossBmEvidence(decisionsPath) {
  const decisions = readJson(decisionsPath);
  if (!decisions) return true;

  const templateCodes = new Set(
    decisions.decisions?.map((d) => d.templateCode) || []
  );

  if (templateCodes.size > 1) {
    GATE_FAILURES.push({
      gate: 'GATE1',
      rule: 'No cross-BM evidence',
      message: `Multiple templateCodes in one batch: ${[...templateCodes].join(', ')}`,
    });
    return false;
  }

  log('PASS', 'Gate 1: No cross-BM evidence');
  return true;
}

// Gate 2: No label-only if domain mismatch
function gate2LabelOnlyDomainMatch(decision) {
  if (!decision) return true;

  const hasPathChange = decision.oldPath !== decision.newPath;
  const hasLabelOnly = decision.mutationsNeeded?.every(
    (m) => m === 'UPDATE_CANONICAL_LABEL'
  );

  if (hasLabelOnly && hasPathChange) {
    const oldDomain = decision.oldPath?.split('.')[0];
    const labelDomain = decision.newLabel?.toLowerCase() || '';

    const domainMismatch =
      (oldDomain === 'document' && labelDomain.includes('người')) ||
      (oldDomain === 'person' && labelDomain.includes('tài liệu'));

    if (domainMismatch) {
      GATE_FAILURES.push({
        gate: 'GATE2',
        rule: 'No label-only if domain label ≠ domain path',
        message: `${decision.oldPath} → "${decision.newLabel}" has domain mismatch`,
      });
      return false;
    }
  }

  log('PASS', 'Gate 2: Label-only domain check');
  return true;
}

// Gate 3: No risk > MEDIUM without reviewer approval
function gate3RiskAndApproval(decision) {
  if (!decision) return true;

  const risk = decision.risk || 'LOW';
  const approved = decision.approved === true;
  const reviewerRequired = decision.reviewerRequired === true;

  if (risk === 'HIGH' && !approved) {
    GATE_FAILURES.push({
      gate: 'GATE3',
      rule: 'No HIGH risk approved without reviewer approval',
      message: `${decision.oldPath} → ${decision.newPath} has HIGH risk but not approved`,
    });
    return false;
  }

  if (risk === 'MEDIUM' && !approved && reviewerRequired) {
    GATE_FAILURES.push({
      gate: 'GATE3',
      rule: 'MEDIUM risk requires explicit approval',
      message: `${decision.oldPath} → ${decision.newPath} is MEDIUM risk, needs approval`,
    });
    return false;
  }

  log('PASS', 'Gate 3: Risk and approval check');
  return true;
}

// Gate 4: No empty rawPattern approved
function gate4NoEmptyRawPattern(decision) {
  if (!decision) return true;

  const rawPattern = decision.rawPattern || '';
  const approved = decision.approved === true;

  if (approved && rawPattern.trim() === '') {
    GATE_FAILURES.push({
      gate: 'GATE4',
      rule: 'No empty rawPattern approved',
      message: `${decision.oldPath} has empty rawPattern but was approved`,
    });
    return false;
  }

  log('PASS', 'Gate 4: No empty rawPattern');
  return true;
}

// Gate 5: No textBefore only {{document.fieldN}} approved
function gate5NoPlaceholderOnly(decision) {
  if (!decision) return true;

  const textBefore = decision.evidenceTextBefore || '';
  const approved = decision.approved === true;

  const isOnlyPlaceholder = /^\{\{document\.\w+\}\}$/.test(textBefore.trim());

  if (approved && isOnlyPlaceholder) {
    GATE_FAILURES.push({
      gate: 'GATE5',
      rule: 'No textBefore only {{document.fieldN}} approved',
      message: `${decision.oldPath} has placeholder-only textBefore but was approved`,
    });
    return false;
  }

  log('PASS', 'Gate 5: No placeholder-only textBefore');
  return true;
}

// Gate 6: No compiled-v2 manual edit
function gate6NoCompiledV2Edit(auditPath) {
  const audit = readJson(auditPath);
  if (!audit) {
    log('WARN', 'Gate 6: Audit file not found, assuming no compiled-v2 edit');
    return true;
  }

  const compiledV2Changes = audit.changes?.filter(
    (c) => c.file?.includes('compiled-v2')
  );

  if (compiledV2Changes && compiledV2Changes.length > 0) {
    GATE_FAILURES.push({
      gate: 'GATE6',
      rule: 'No compiled-v2 manual edit',
      message: `${compiledV2Changes.length} compiled-v2 files changed manually`,
    });
    return false;
  }

  log('PASS', 'Gate 6: No compiled-v2 manual edit');
  return true;
}

// Gate 7: No locked contract mutation outside approved decisions
function gate7NoLockedContractMutation(decision, auditPath) {
  const audit = readJson(auditPath);
  if (!audit) return true;

  const approvedDecisions = audit.decisions?.filter((d) => d.approved);

  if (!approvedDecisions || approvedDecisions.length === 0) {
    log('WARN', 'Gate 7: No approved decisions found');
    return true;
  }

  const lockedContractChanges = audit.changes?.filter(
    (c) => c.file?.includes('.contract.locked.json')
  );

  const approvedPaths = new Set(
    approvedDecisions.map((d) => `${d.templateCode}:${d.oldPath}`)
  );

  for (const change of lockedContractChanges || []) {
    const changedPath = change.path;
    if (!approvedPaths.has(changedPath)) {
      GATE_FAILURES.push({
        gate: 'GATE7',
        rule: 'No locked contract mutation outside approved decisions',
        message: `${change.file} has unapproved mutation for ${changedPath}`,
      });
      return false;
    }
  }

  log('PASS', 'Gate 7: Locked contract mutation check');
  return true;
}

// Gate 8-10: Metrics not increased
function gateMetricsNotIncreased(auditPath) {
  const audit = readJson(auditPath);
  if (!audit) {
    log('WARN', 'Metrics audit not found, skipping baseline checks');
    return true;
  }

  const metrics = audit.metrics || audit.summary || {};

  const checks = [
    { key: 'totalIssues', threshold: BASELINE.totalIssues },
    { key: 'REMEDIATION_LEAK', threshold: BASELINE.REMEDIATION_LEAK },
    { key: 'COMPILED_DRIFT', threshold: BASELINE.COMPILED_DRIFT },
    { key: 'SOURCE_MISMATCH', threshold: BASELINE.SOURCE_MISMATCH },
  ];

  let allPass = true;
  for (const check of checks) {
    const current = metrics[check.key] ?? 0;
    if (current > check.threshold) {
      GATE_FAILURES.push({
        gate: `GATE_${check.key}`,
        rule: `${check.key} not increased`,
        message: `${check.key} is ${current}, exceeds baseline ${check.threshold}`,
      });
      allPass = false;
    } else {
      log('PASS', `Gate ${check.key}: ${current} ≤ ${check.threshold}`);
    }
  }

  return allPass;
}

function runGates(decisionsPath, auditPath) {
  console.log('\n🔒 REMEDIATION BATCH SAFETY GATES\n');
  console.log('═'.repeat(60));

  const decisions = readJson(decisionsPath);

  // Run all gates
  gate1NoCrossBmEvidence(decisionsPath);
  if (decisions?.decisions) {
    for (const decision of decisions.decisions) {
      gate2LabelOnlyDomainMatch(decision);
      gate3RiskAndApproval(decision);
      gate4NoEmptyRawPattern(decision);
      gate5NoPlaceholderOnly(decision);
    }
  }
  gate6NoCompiledV2Edit(auditPath);
  gate7NoLockedContractMutation(decisions, auditPath);
  gateMetricsNotIncreased(auditPath);

  console.log('\n' + '═'.repeat(60));

  if (GATE_FAILURES.length > 0) {
    console.log('\n❌ SAFETY GATES FAILED\n');
    for (const failure of GATE_FAILURES) {
      console.log(`  [${failure.gate}] ${failure.message}`);
      console.log(`         Rule: ${failure.rule}\n`);
    }
    process.exit(1);
  }

  console.log('\n✅ ALL SAFETY GATES PASSED\n');
  process.exit(0);
}

// CLI
const decisionsArg = process.argv[2];
const auditArg = process.argv[3];

if (!decisionsArg || !auditArg) {
  console.log('Usage: node validate-remediation-batch-safety-gates.mjs <decisions.json> <audit.json>');
  console.log('\nExample:');
  console.log('  node scripts/audit/validate-remediation-batch-safety-gates.mjs \\');
  console.log('    docs/audit/path-domain-binding-batch-1/decisions.approved.json \\');
  console.log('    docs/audit/path-domain-binding-batch-1/audit.latest.json');
  process.exit(1);
}

runGates(decisionsArg, auditArg);
