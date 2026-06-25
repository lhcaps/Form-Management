#!/usr/bin/env node
/**
 * apply-forms-root-cause-review-batch-1-approved.mjs
 *
 * Applies reviewer-approved label decisions from FORMS_ROOT_CAUSE_REVIEW_BATCH_1.
 * Only RG-001 and RG-002 are approved for apply.
 *
 * Safe mutation design: dry-run never mutates loaded contract objects.
 * Planned mutations are computed separately; actual file writes happen only in write mode.
 *
 * Exit codes:
 *   0 — dry-run completed or mutations applied
 *   1 — strict validation failure
 *
 * Usage:
 *   node scripts/audit/apply-forms-root-cause-review-batch-1-approved.mjs          # dry-run
 *   node scripts/audit/apply-forms-root-cause-review-batch-1-approved.mjs --write   # apply
 *   pnpm apply:forms-root-cause-review-batch-1-approved
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const WRITE_FLAG = process.argv.includes('--write');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const DECISIONS_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1', 'decisions.approved.json');
const REVIEW_DIR   = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1');
const APPLY_DIR    = join(REVIEW_DIR, 'apply-approved');
const BACKUP_DIR   = join(APPLY_DIR, 'backups');

const BAD_LABEL_PATTERNS = [
  'Ô trống', 'Slot from', 'Wave', 'remediation', 'TODO', 'unknown',
  'documentCode', 'field1', 'field2', 'field3', 'field4', 'field5',
  'rawPattern', 'camelCase', 'generic',
];

const WAVE02_BMS = new Set([
  'BM-068', 'BM-069', 'BM-073', 'BM-075', 'BM-077',
  'BM-080', 'BM-082', 'BM-162', 'BM-163',
]);

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadContracts() {
  const map = new Map();
  for (const f of readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'))) {
    const code = f.match(/^(BM-\d+)/)?.[1];
    if (!code) continue;
    try { map.set(code, deepClone(JSON.parse(readFileSync(join(LOCKED_DIR, f), 'utf8')))); } catch { /* skip */ }
  }
  return map;
}

function isBadLabel(label) {
  if (!label || typeof label !== 'string') return true;
  return BAD_LABEL_PATTERNS.some((p) => label.includes(p));
}

// =============================================================================
// STRICT VALIDATION — run BEFORE any mutation
// =============================================================================

function strictValidate(decisions) {
  const errors = [];

  if (decisions.length !== 24) {
    errors.push(`decisions count ${decisions.length} != 24`);
  }

  const approved = decisions.filter((d) => d.decision === 'APPROVED_FOR_APPLY');
  if (approved.length !== 2) {
    errors.push(`approvedForApply ${approved.length} != 2`);
  }

  for (const d of approved) {
    if (!['RG-001', 'RG-002'].includes(d.reviewGroupId)) {
      errors.push(`approved group ${d.reviewGroupId} is not RG-001 or RG-002`);
    }
    if (d.action !== 'UPDATE_LABEL') {
      errors.push(`approved group ${d.reviewGroupId} action ${d.action} != UPDATE_LABEL`);
    }
    if (d.confidence !== 'HIGH') {
      errors.push(`approved group ${d.reviewGroupId} confidence ${d.confidence} != HIGH`);
    }
    if (d.reviewerOverrideConfidence !== 'HIGH') {
      errors.push(`approved group ${d.reviewGroupId} reviewerOverrideConfidence ${d.reviewerOverrideConfidence} != HIGH`);
    }
    if (d.applyEligible !== true) {
      errors.push(`approved group ${d.reviewGroupId} applyEligible != true`);
    }
    if (isBadLabel(d.approvedLabel)) {
      errors.push(`approved group ${d.reviewGroupId} has bad label: "${d.approvedLabel}"`);
    }
  }

  // All legalBasis.* must be not applyEligible
  const legalBasis = decisions.filter((d) => d.path.startsWith('legalBasis.'));
  for (const d of legalBasis) {
    if (d.applyEligible) {
      errors.push(`legalBasis.* group ${d.reviewGroupId} is applyEligible`);
    }
  }

  // All Wave 02 BMS must be not applyEligible
  for (const d of decisions) {
    if (WAVE02_BMS.has(d.templateCode) && d.applyEligible) {
      errors.push(`Wave 02 BM ${d.templateCode} group ${d.reviewGroupId} is applyEligible`);
    }
  }

  // All REJECTED_NO_OP must be not applyEligible
  const rejected = decisions.filter((d) => d.decision === 'REJECTED_NO_OP');
  for (const d of rejected) {
    if (d.applyEligible) {
      errors.push(`REJECTED_NO_OP group ${d.reviewGroupId} is applyEligible`);
    }
  }

  return errors;
}

// =============================================================================
// MUTATION PLANNING — never mutates loaded contracts
// =============================================================================

function planMutations(approvedDecisions, contracts) {
  const mutations = [];

  for (const decision of approvedDecisions) {
    const { templateCode, path, approvedLabel, reviewGroupId } = decision;

    if (isBadLabel(approvedLabel)) {
      process.stderr.write(`[APPLY] SKIP ${reviewGroupId}: approved label "${approvedLabel}" is bad\n`);
      continue;
    }

    const contract = contracts.get(templateCode);
    if (!contract) {
      process.stderr.write(`[APPLY] SKIP ${reviewGroupId}: contract ${templateCode} not found\n`);
      continue;
    }

    const field = contract.canonicalFields?.find((f) => f.path === path);
    if (!field) {
      process.stderr.write(`[APPLY] SKIP ${reviewGroupId}: field ${path} not found in ${templateCode}\n`);
      continue;
    }

    if (field.label === approvedLabel) {
      process.stderr.write(`[APPLY] SKIP ${reviewGroupId}: label already "${approvedLabel}"\n`);
      mutations.push({
        reviewGroupId,
        templateCode,
        path,
        action: 'UPDATE_LABEL',
        labelBefore: field.label,
        labelAfter: approvedLabel,
        status: 'SKIPPED_IDEMPOTENT',
      });
      continue;
    }

    mutations.push({
      reviewGroupId,
      templateCode,
      path,
      action: 'UPDATE_LABEL',
      labelBefore: field.label,
      labelAfter: approvedLabel,
      status: 'PLANNED',
    });
  }

  return mutations;
}

// =============================================================================
// MUTATION APPLICATION — only called in write mode
// =============================================================================

function applyMutations(mutations, contracts, backupDir) {
  const applied = [];
  const skipped = [];

  mkdirSync(backupDir, { recursive: true });

  for (const mutation of mutations) {
    if (mutation.status === 'SKIPPED_IDEMPOTENT') {
      skipped.push(mutation);
      continue;
    }

    const { templateCode, path, labelAfter } = mutation;

    // Find the contract file on disk
    const files = readdirSync(LOCKED_DIR)
      .filter((f) => f.startsWith(templateCode) && f.endsWith('.contract.locked.json'));
    if (files.length === 0) {
      skipped.push({ ...mutation, status: 'SKIPPED_NO_FILE' });
      continue;
    }

    const filePath = join(LOCKED_DIR, files[0]);

    // Backup
    const backupPath = join(backupDir, files[0]);
    copyFileSync(filePath, backupPath);
    process.stderr.write(`[APPLY] Backup: ${backupPath}\n`);

    // Read current file content
    const contract = deepClone(JSON.parse(readFileSync(filePath, 'utf8')));

    // Apply mutation to cloned object
    const field = contract.canonicalFields?.find((f) => f.path === path);
    if (!field) {
      skipped.push({ ...mutation, status: 'SKIPPED_FIELD_MISSING' });
      continue;
    }

    const labelBefore = field.label;
    field.label = labelAfter;

    // Write back
    writeFileSync(filePath, JSON.stringify(contract, null, 2), 'utf8');
    process.stderr.write(`[APPLY] Applied: ${templateCode}::${path}: "${labelBefore}" -> "${labelAfter}"\n`);

    applied.push({ ...mutation, labelBefore, labelAfter, status: 'APPLIED' });
  }

  return { applied, skipped };
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function buildReport(mutations, applied, skipped, decisions) {
  const timestamp = new Date().toISOString();

  // Group decisions by status
  const approvedDecisions = decisions.filter((d) => d.decision === 'APPROVED_FOR_APPLY');
  const deferredLegal = decisions.filter((d) => d.decision === 'DEFER_LEGAL');
  const deferredDocx = decisions.filter((d) => d.decision === 'DEFER_DOCX');
  const rejectedNoOp = decisions.filter((d) => d.decision === 'REJECTED_NO_OP');

  const approvedPlanned = mutations.filter((m) => m.status === 'PLANNED');
  const approvedSkipped = mutations.filter((m) => m.status === 'SKIPPED_IDEMPOTENT');

  const report = {
    generatedAt: timestamp,
    mode: WRITE_FLAG ? 'write' : 'dry-run',
    totalDecisionsReviewed: decisions.length,
    decisionsSummary: {
      approvedForApply: approvedDecisions.length,
      rejectedNoOp: rejectedNoOp.length,
      deferredLegal: deferredLegal.length,
      deferredDocx: deferredDocx.length,
    },
    mutations: {
      planned: approvedPlanned.length,
      applied: applied.length,
      skipped: skipped.length,
      idempotent: approvedSkipped.length,
      items: mutations,
    },
    appliedContracts: [...new Set(applied.map((m) => m.templateCode))],
    deferredGroups: {
      deferredLegal: deferredLegal.map((d) => ({ id: d.reviewGroupId, bm: d.templateCode, path: d.path })),
      deferredDocx: deferredDocx.map((d) => ({ id: d.reviewGroupId, bm: d.templateCode, path: d.path })),
    },
    rejectedGroups: rejectedNoOp.map((d) => ({ id: d.reviewGroupId, bm: d.templateCode, path: d.path })),
  };

  return report;
}

function writeReport(report) {
  mkdirSync(APPLY_DIR, { recursive: true });
  writeFileSync(join(APPLY_DIR, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');
  process.stderr.write(`[APPLY] Written: ${join(APPLY_DIR, 'latest.json')}\n`);

  const lines = [
    '# Review Batch 1 — Approved Apply Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Mode: **${report.mode.toUpperCase()}**`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Decisions reviewed | ${report.totalDecisionsReviewed} |`,
    `| Approved for apply | ${report.decisionsSummary.approvedForApply} |`,
    `| Mutations planned | ${report.mutations.planned} |`,
    `| Mutations applied | ${report.mutations.applied} |`,
    `| Mutations skipped/idempotent | ${report.mutations.skipped + report.mutations.idempotent} |`,
    `| Changed contracts | ${report.appliedContracts.length} |`,
    '',
  ];

  if (report.mutations.applied > 0) {
    lines.push('## Applied Mutations');
    lines.push('');
    lines.push('| Group | BM | Path | Before | After |');
    lines.push('|-------|---|------|--------|-------|');
    for (const m of report.mutations.items.filter((x) => x.status === 'APPLIED')) {
      lines.push(`| ${m.reviewGroupId} | ${m.templateCode} | \`${m.path}\` | \`${m.labelBefore}\` | \`${m.labelAfter}\` |`);
    }
    lines.push('');
  }

  if (report.mutations.idempotent > 0) {
    lines.push('## Idempotent (Already Applied)');
    lines.push('');
    for (const m of report.mutations.items.filter((x) => x.status === 'SKIPPED_IDEMPOTENT')) {
      lines.push(`- ${m.reviewGroupId}: ${m.templateCode}::${m.path} — already "${m.labelAfter}"`);
    }
    lines.push('');
  }

  lines.push('## Non-Touched Groups');
  lines.push('');

  if (report.deferredGroups.deferredLegal.length > 0) {
    lines.push('### Deferred Legal (RG-003)');
    for (const g of report.deferredGroups.deferredLegal) {
      lines.push(`- **${g.id}**: ${g.bm}::${g.path} — DEFER_LEGAL`);
    }
    lines.push('');
  }

  if (report.rejectedGroups.length > 0) {
    lines.push('### Rejected Path Collisions (RG-004 to RG-009)');
    for (const g of report.rejectedGroups) {
      lines.push(`- **${g.id}**: ${g.bm}::${g.path} — REJECTED_NO_OP`);
    }
    lines.push('');
  }

  if (report.deferredGroups.deferredDocx.length > 0) {
    lines.push(`### Deferred DOCX/Wave 02 (RG-010 to RG-024, ${report.deferredGroups.deferredDocx.length} groups)`);
    lines.push('');
    lines.push('BM-068 groups:');
    for (const g of report.deferredGroups.deferredDocx.filter((x) => x.bm === 'BM-068')) {
      lines.push(`- **${g.id}**: ${g.bm}::${g.path} — DEFER_DOCX`);
    }
    lines.push('');
  }

  writeFileSync(join(APPLY_DIR, 'latest.md'), lines.join('\n'), 'utf8');
  process.stderr.write(`[APPLY] Written: ${join(APPLY_DIR, 'latest.md')}\n`);
}

// =============================================================================
// VALIDATION RUNNER
// =============================================================================

function runValidation() {
  // Note: do NOT run `pnpm plan` between audits — plan regenerates auto-fix-candidates.json
  // which would make subsequent audit results inconsistent.
  const commands = [
    'pnpm contract:validate',
    'pnpm contract:validate',
    'pnpm gate:forms:213',
    'pnpm audit:forms-root-cause',
    'pnpm audit:forms-root-cause',
    'pnpm audit:forms-root-cause',
    'pnpm --filter @qllaw/form-contracts test',
    'pnpm typecheck',
  ];
  const results = [];
  for (const cmd of commands) {
    try {
      execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 180000, maxBuffer: 10 * 1024 * 1024 });
      results.push({ command: cmd, exitCode: 0, result: 'PASS' });
    } catch (err) {
      results.push({
        command: cmd,
        exitCode: err.status ?? 1,
        result: 'FAIL',
        note: (err.message || '').slice(0, 200),
      });
    }
  }
  return results;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const mode = WRITE_FLAG ? 'WRITE' : 'DRY-RUN';
  process.stderr.write(`[APPLY] === Review Batch 1 Approved Apply (${mode}) ===\n`);

  // Load decisions
  const decisionsRaw = loadJson(DECISIONS_JSON);
  if (!decisionsRaw) {
    process.stderr.write(`[APPLY] FATAL: Cannot load ${DECISIONS_JSON}\n`);
    process.exit(1);
  }
  const decisions = decisionsRaw.decisions ?? [];

  process.stderr.write(`[APPLY] Loaded ${decisions.length} decisions\n`);

  // Strict validation
  const strictErrors = strictValidate(decisions);
  if (strictErrors.length > 0) {
    process.stderr.write(`[APPLY] STRICT VALIDATION FAILED:\n`);
    strictErrors.forEach((e) => process.stderr.write(`  - ${e}\n`));
    process.exit(1);
  }
  process.stderr.write(`[APPLY] Strict validation: PASS\n`);

  // Load contracts (deep cloned — never mutated in dry-run)
  const contracts = loadContracts();
  process.stderr.write(`[APPLY] Loaded ${contracts.size} contracts\n`);

  // Get approved decisions
  const approvedDecisions = decisions.filter(
    (d) =>
      d.decision === 'APPROVED_FOR_APPLY' &&
      d.applyEligible === true &&
      d.confidence === 'HIGH' &&
      d.reviewerOverrideConfidence === 'HIGH' &&
      d.action === 'UPDATE_LABEL' &&
      ['RG-001', 'RG-002'].includes(d.reviewGroupId)
  );

  process.stderr.write(`[APPLY] Approved decisions: ${approvedDecisions.length}\n`);

  // Plan mutations (pure computation, no mutation)
  const mutations = planMutations(approvedDecisions, contracts);
  const planned = mutations.filter((m) => m.status === 'PLANNED');
  const skipped = mutations.filter((m) => m.status !== 'PLANNED');

  process.stderr.write(`[APPLY] Planned: ${planned.length} | Skipped: ${skipped.length}\n`);
  for (const m of planned) {
    process.stderr.write(`  ${m.reviewGroupId}: ${m.templateCode}::${m.path} "${m.labelBefore}" -> "${m.labelAfter}"\n`);
  }

  // Enforce: only RG-001/RG-002 allowed
  for (const m of planned) {
    if (!['RG-001', 'RG-002'].includes(m.reviewGroupId)) {
      process.stderr.write(`[APPLY] FATAL: Non-approved group ${m.reviewGroupId} in planned mutations\n`);
      process.exit(1);
    }
  }

  // In DRY-RUN mode: report and exit
  if (!WRITE_FLAG) {
    process.stderr.write(`[APPLY] DRY-RUN: no files written\n`);
    const report = buildReport(mutations, [], skipped, decisions);
    writeReport(report);
    process.stderr.write(`[APPLY] DRY-RUN complete.\n`);
    process.exit(0);
  }

  // WRITE MODE
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = join(BACKUP_DIR, timestamp);

  process.stderr.write(`[APPLY] WRITE MODE: applying mutations...\n`);
  const { applied, skipped: writeSkipped } = applyMutations(mutations, contracts, backupDir);

  process.stderr.write(`[APPLY] Applied: ${applied.length} | Skipped: ${writeSkipped.length}\n`);

  // Build and write report
  const report = buildReport(mutations, applied, writeSkipped, decisions);
  writeReport(report);

  // Strict mutation count check
  if (applied.length !== 0 && applied.length !== 2) {
    process.stderr.write(`[APPLY] FATAL: mutation count ${applied.length} is not 0 or 2\n`);
    process.exit(1);
  }

  // Run validation
  process.stderr.write(`[APPLY] Running validation...\n`);
  const validations = runValidation();

  const criticalCommands = [
    'pnpm gate:forms:213',
    'pnpm contract:validate',
    'pnpm contract:compile',
    'pnpm --filter @qllaw/form-contracts test',
    'pnpm typecheck',
  ];

  let hasCriticalFailure = false;
  for (const v of validations) {
    const icon = v.exitCode === 0 ? 'PASS' : 'INFO';
    // Mark audit failures as INFO since audit may still report issues
    const isAudit = v.command.includes('audit:forms-root-cause');
    const isCritical = criticalCommands.some((c) => v.command.includes(c));
    if (v.exitCode !== 0) {
      if (isCritical) {
        hasCriticalFailure = true;
        process.stderr.write(`[APPLY] **FAIL** ${v.command}: exit ${v.exitCode}\n`);
      } else {
        process.stderr.write(`[APPLY] INFO ${v.command}: exit ${v.exitCode} (non-critical)\n`);
      }
    } else {
      process.stderr.write(`[APPLY] ${icon} ${v.command}: exit ${v.exitCode}\n`);
    }
  }

  // Strict validation exit conditions
  if (hasCriticalFailure) {
    process.stderr.write(`[APPLY] VALIDATION FAILED — critical validation errors. Review outputs before proceeding.\n`);
    process.exit(1);
  }

  // Idempotency check: second run should be no-op
  process.stderr.write(`[APPLY] Idempotency check: re-running to verify no new mutations...\n`);
  const contracts2 = loadContracts();
  const mutations2 = planMutations(approvedDecisions, contracts2);
  const planned2 = mutations2.filter((m) => m.status === 'PLANNED');
  if (planned2.length > 0) {
    process.stderr.write(`[APPLY] WARNING: Idempotency check found ${planned2.length} new mutations — possible re-apply needed.\n`);
    planned2.forEach((m) => process.stderr.write(`  ${m.reviewGroupId}: ${m.templateCode}::${m.path}\n`));
  } else {
    process.stderr.write(`[APPLY] Idempotency check: PASS — all already applied.\n`);
  }

  process.stderr.write(`[APPLY] === COMPLETE ===\n`);
  process.stderr.write(`[APPLY] Applied ${applied.length} mutations to ${report.appliedContracts.length} contracts.\n`);
  process.stderr.write(`[APPLY] Backup: ${backupDir}\n`);
  process.exit(0);
}

main();
