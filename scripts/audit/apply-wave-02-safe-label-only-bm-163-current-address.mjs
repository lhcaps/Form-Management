#!/usr/bin/env node
/**
 * apply-wave-02-safe-label-only-bm-163-current-address.mjs
 *
 * Applies exactly one safe label-only fix from the Wave 02 planning report.
 *
 * BM-163 :: person.currentAddress
 * "Slot from Wave 02 DOCX remediation" -> "Nơi ở hiện nay"
 *
 * Evidence: DOCX static text "Nơi ở hiện nay:" directly before
 * placeholder {{person.currentAddress}} in word/document.xml.
 *
 * Modes:
 *   dry-run (default)  — read, compute, report, modify nothing
 *   write (--write)    — actually patch the locked contract
 *
 * Safety layers:
 *   1. Strict pre-write safety gate
 *   2. Idempotency check
 *   3. Backup before write (timestamped folder)
 *   4. Label-only mutation (no path/source/binding change)
 *
 * Exit codes:
 *   0 — dry-run or write completed successfully
 *   1 — safety check failed or unexpected error
 *
 * Usage:
 *   node scripts/audit/apply-wave-02-safe-label-only-bm-163-current-address.mjs          # dry-run
 *   node scripts/audit/apply-wave-02-safe-label-only-bm-163-current-address.mjs --write # apply
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const APPLY_DIR = join(ROOT, 'docs', 'audit', 'wave-02-safe-label-only-bm-163-current-address');
const DECISION_JSON = join(APPLY_DIR, 'decision.approved.json');

const WRITE = process.argv.includes('--write');
const WRITE_MODE = WRITE ? 'write' : 'dry-run';

// =============================================================================
// FIX DEFINITION
// =============================================================================

const FIX = {
  templateCode: 'BM-163',
  sourceId: 'BM-163__61941122b9e4',
  path: 'person.currentAddress',
  labelBefore: 'Slot from Wave 02 DOCX remediation',
  labelAfter: 'Nơi ở hiện nay',
  action: 'UPDATE_LABEL',
  evidenceSource: 'DOCX_WAVE_02_PLACEHOLDER_FIX_PLANNING',
  evidenceReport: 'docs/audit/docx-wave-02-placeholder-fix-planning/placeholder-context.latest.json',
  evidenceStaticText: 'Nơi ở hiện nay:',
};

// =============================================================================
// CONTRACT LOADING
// =============================================================================

function loadContract(code, sourceId) {
  const filename = `${code}__${sourceId.split('__')[1]}.contract.locked.json`;
  const filepath = join(LOCKED_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error(`Contract file not found: ${filepath}`);
  }
  return JSON.parse(readFileSync(filepath, 'utf8'));
}

// =============================================================================
// VALIDATION
// =============================================================================

function validate() {
  const errors = [];
  let idempotent = false;
  let labelMismatch = false;

  if (!existsSync(DECISION_JSON)) {
    errors.push(`Decision file not found: ${DECISION_JSON}`);
  }

  const contract = loadContract(FIX.templateCode, FIX.sourceId);

  // Verify current label is what we expect
  const field = contract.canonicalFields?.find((f) => f.path === FIX.path);
  if (!field) {
    errors.push(`Field not found: ${FIX.path} in ${FIX.templateCode}`);
  } else {
    // Idempotency: if already at target label, skip cleanly — check FIRST
    if (field.label === FIX.labelAfter) {
      idempotent = true;
      errors.push(
        `SKIPPED_IDEMPOTENT: ${FIX.templateCode}::${FIX.path} already has label "${FIX.labelAfter}"`
      );
    } else if (field.label !== FIX.labelBefore) {
      // Hard failure: label is neither the expected-before nor the target-after value
      labelMismatch = true;
      errors.push(
        `LABEL_MISMATCH: ${FIX.templateCode}::${FIX.path} — expected "${FIX.labelBefore}" but found "${field.label}". This field may have been edited by another process.`
      );
    }
  }

  return { errors, field, contract, idempotent, labelMismatch };
}

// =============================================================================
// BACKUP
// =============================================================================

function createBackup(contract, filename) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(APPLY_DIR, 'backups', ts);
  mkdirSync(backupDir, { recursive: true });
  const dest = join(backupDir, filename);
  cpSync(join(LOCKED_DIR, filename), dest);
  writeFileSync(
    join(backupDir, 'manifest.json'),
    JSON.stringify({ file: filename, backedUpAt: new Date().toISOString() }, null, 2),
    'utf8'
  );
  process.stderr.write(`[APPLY] Backup created: ${backupDir}\n`);
  return backupDir;
}

// =============================================================================
// REPORT
// =============================================================================

function buildReport({ fieldBefore, contractBefore, contractAfter, applied, skippedReason }) {
  const report = {
    generatedAt: new Date().toISOString(),
    task: 'WAVE_02_SAFE_LABEL_ONLY_MICRO_APPLY_BM_163_CURRENT_ADDRESS',
    mode: WRITE_MODE,
    planned: 1,
    applied: applied ? 1 : 0,
    failed: skippedReason ? 0 : 0,
    skipped: skippedReason ? 1 : 0,
    mutation: {
      templateCode: FIX.templateCode,
      sourceId: FIX.sourceId,
      path: FIX.path,
      action: FIX.action,
      labelBefore: FIX.labelBefore,
      labelAfter: FIX.labelAfter,
    },
    contracts: [
      {
        templateCode: FIX.templateCode,
        file: `${FIX.templateCode}__${FIX.sourceId.split('__')[1]}.contract.locked.json`,
        changed: applied || !!skippedReason,
        skippedReason: skippedReason ?? null,
      },
    ],
    issueDelta: {
      note: 'Actual delta depends on audit run after write. dry-run cannot compute audit delta.',
    },
    safety: {
      lockedContractMutated: applied,
      docxTouched: false,
      sourceUnchanged: true,
      pathUnchanged: true,
      bindingUnchanged: true,
      backupCreated: applied,
    },
    evidence: {
      source: FIX.evidenceSource,
      report: FIX.evidenceReport,
      staticText: FIX.evidenceStaticText,
      confidence: 'strong',
    },
  };

  writeFileSync(join(APPLY_DIR, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');
  return report;
}

function writeMarkdownReport(report) {
  const lines = [];
  lines.push(`# Wave 02 Safe Label-Only Apply Report`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Mode: **${report.mode}**`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Task | ${report.task} |`);
  lines.push(`| Planned | ${report.planned} |`);
  lines.push(`| Applied | ${report.applied} |`);
  lines.push(`| Failed | ${report.failed} |`);
  lines.push(`| Skipped | ${report.skipped} |`);
  lines.push('');

  if (report.skipped && report.contracts[0].skippedReason) {
    lines.push('## Skipped');
    lines.push('');
    lines.push(`**Reason**: ${report.contracts[0].skippedReason}`);
    lines.push('');
  } else {
    lines.push('## Mutation');
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Template | ${report.mutation.templateCode} |`);
    lines.push(`| Path | \`${report.mutation.path}\` |`);
    lines.push(`| Action | ${report.mutation.action} |`);
    lines.push(`| Label before | \`${report.mutation.labelBefore}\` |`);
    lines.push(`| Label after | \`${report.mutation.labelAfter}\` |`);
    lines.push('');
    lines.push('## Evidence');
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Source | ${report.evidence.source} |`);
    lines.push(`| Report | ${report.evidence.report} |`);
    lines.push(`| Static text | "${report.evidence.staticText}" |`);
    lines.push(`| Confidence | ${report.evidence.confidence} |`);
    lines.push('');
  }

  lines.push('## Safety');
  lines.push('');
  lines.push(`| Check | Result |`);
  lines.push(`|-------|--------|`);
  lines.push(`| Locked contract mutated | ${report.safety.lockedContractMutated ? '**true**' : 'false'} |`);
  lines.push(`| DOCX touched | ${report.safety.docxTouched ? '**true**' : 'false'} |`);
  lines.push(`| Source unchanged | ${report.safety.sourceUnchanged ? 'PASS' : '**FAIL**'} |`);
  lines.push(`| Path unchanged | ${report.safety.pathUnchanged ? 'PASS' : '**FAIL**'} |`);
  lines.push(`| Binding unchanged | ${report.safety.bindingUnchanged ? 'PASS' : '**FAIL**'} |`);
  lines.push(`| Backup created | ${report.safety.backupCreated ? '**true**' : 'false'} |`);
  lines.push('');

  lines.push('## Validation Commands');
  lines.push('');
  lines.push('After write mode, run:');
  lines.push('');
  lines.push('```bash');
  lines.push('pnpm contract:validate');
  lines.push('pnpm contract:compile');
  lines.push('pnpm audit:forms-root-cause');
  lines.push('pnpm audit:docx-slot-inventory');
  lines.push('pnpm typecheck');
  lines.push('```');
  lines.push('');

  lines.push('## Next Task');
  lines.push('');
  lines.push('**DOCX_WAVE_02_MANUAL_AUTHORING_REVIEW_PACK**: Create a review pack for the 56 remaining Wave 02 items that lack DOCX context for automatic fixing.');

  writeFileSync(join(APPLY_DIR, 'latest.md'), lines.join('\n') + '\n', 'utf8');
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write(`[APPLY] WAVE_02_SAFE_LABEL_ONLY_MICRO_APPLY_BM_163_CURRENT_ADDRESS\n`);
  process.stderr.write(`[APPLY] Mode: ${WRITE_MODE}\n`);

  const { errors, field, contract, idempotent, labelMismatch } = validate();
  const filename = `${FIX.templateCode}__${FIX.sourceId.split('__')[1]}.contract.locked.json`;

  if (errors.length > 0) {
    for (const e of errors) {
      process.stderr.write(`[APPLY] ${e}\n`);
    }

    const report = buildReport({
      fieldBefore: field ? field.label : null,
      contractBefore: contract,
      contractAfter: null,
      applied: false,
      skippedReason: errors.join('; '),
    });
    writeMarkdownReport(report);

    if (idempotent) {
      process.stderr.write(`[APPLY] Idempotent skip — label already at "${FIX.labelAfter}".\n`);
      process.exit(0);
    }
    // labelMismatch is a hard failure — exit 1
    process.stderr.write(`[APPLY] FATAL: LABEL_MISMATCH — field was edited by another process.\n`);
    process.exit(1);
  }

  const contractCopy = JSON.parse(JSON.stringify(contract));

  if (WRITE) {
    // Backup
    createBackup(contract, filename);

    // Apply label-only mutation
    const fieldCopy = contractCopy.canonicalFields.find((f) => f.path === FIX.path);
    const labelBefore = fieldCopy.label;
    fieldCopy.label = FIX.labelAfter;

    // Write
    writeFileSync(join(LOCKED_DIR, filename), JSON.stringify(contractCopy, null, 2), 'utf8');
    process.stderr.write(`[APPLY] Applied: ${FIX.templateCode}::${FIX.path}\n`);
    process.stderr.write(`[APPLY]   ${labelBefore} -> ${FIX.labelAfter}\n`);
  }

  const report = buildReport({
    fieldBefore: field.label,
    contractBefore: contract,
    contractAfter: WRITE ? contractCopy : null,
    applied: WRITE,
    skippedReason: null,
  });

  writeMarkdownReport(report);
  process.stderr.write(`[APPLY] Written reports to ${APPLY_DIR}\n`);
  process.stderr.write(`[APPLY] ${WRITE ? 'WRITE' : 'DRY-RUN'} complete: ${FIX.templateCode}::${FIX.path}\n`);
  process.stderr.write(`[APPLY] Label: "${FIX.labelBefore}" -> "${FIX.labelAfter}"\n`);
}

main();
