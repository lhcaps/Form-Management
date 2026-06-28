#!/usr/bin/env node
/**
 * apply-docx-path-binding-layer-a-approved.mjs
 *
 * Applies Layer A of the DOCX path/binding removal plan.
 * Removes 4 orphan slots from BM-073/e412fccad227 locked contract only.
 *
 * Layer A scope:
 *   - BM-073 / e412fccad227 only
 *   - Remove: person.dateOfBirth, person.idNumber, document.fullDocumentCode, document.issueDate
 *
 * Modes:
 *   dry-run (default) — read, compute, report, modify nothing
 *   write (--write)  — backup then patch the locked contract
 *
 * Safety layers:
 *   1. Hard-gate: approved decisions must all be Layer A only
 *   2. Hard-gate: target contract must be exactly BM-073/e412fccad227
 *   3. Hard-gate: abort on missing contract
 *   4. Hard-gate: abort if any approved path not found in contract
 *   5. Hard-gate: abort if approved file contains anything outside Layer A
 *   6. Backup before write (timestamped folder)
 *   7. Write-to-file only (no DOCX mutation, no source mutation)
 *
 * Exit codes:
 *   0 — dry-run or write completed successfully
 *   1 — safety check failed or unexpected error
 *
 * Usage:
 *   node scripts/audit/apply-docx-path-binding-layer-a-approved.mjs          # dry-run
 *   node scripts/audit/apply-docx-path-binding-layer-a-approved.mjs --write  # apply
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const APPROVE_DIR = join(ROOT, 'docs', 'audit', 'docx-path-binding-layer-a-approved');
const DECISION_JSON = join(APPROVE_DIR, 'decisions.approved.json');
const REPORT_DIR = join(APPROVE_DIR, 'apply-reports');

const WRITE = process.argv.includes('--write');
const WRITE_MODE = WRITE ? 'write' : 'dry-run';

// =============================================================================
// APPROVED DECISIONS (hard-coded gate)
// =============================================================================

const APPROVED_LAYER_A_DECISIONS = [
  { decisionId: 'DOCX-REMOVE-001', templateCode: 'BM-073', sourceId: 'e412fccad227', path: 'person.dateOfBirth' },
  { decisionId: 'DOCX-REMOVE-002', templateCode: 'BM-073', sourceId: 'e412fccad227', path: 'person.idNumber' },
  { decisionId: 'DOCX-REMOVE-006', templateCode: 'BM-073', sourceId: 'e412fccad227', path: 'document.fullDocumentCode' },
  { decisionId: 'DOCX-REMOVE-007', templateCode: 'BM-073', sourceId: 'e412fccad227', path: 'document.issueDate' },
];

const APPROVED_DECISION_IDS = new Set(APPROVED_LAYER_A_DECISIONS.map(d => d.decisionId));
const APPROVED_PATHS = new Set(APPROVED_LAYER_A_DECISIONS.map(d => d.path));
const APPROVED_SOURCE_ID = 'e412fccad227';
const APPROVED_TEMPLATE_CODE = 'BM-073';

// =============================================================================
// CONTRACT LOADING
// =============================================================================

function loadContract(templateCode, sourceId) {
  const filename = `${templateCode}__${sourceId}.contract.locked.json`;
  const filepath = join(LOCKED_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error(`Contract file not found: ${filepath}`);
  }
  return { contract: JSON.parse(readFileSync(filepath, 'utf8')), filename };
}

// =============================================================================
// SAFETY GATES
// =============================================================================

function gate_validateApprovedFile() {
  const errors = [];

  if (!existsSync(DECISION_JSON)) {
    errors.push(`GATE_FAIL: Approved decisions file not found: ${DECISION_JSON}`);
    return errors;
  }

  let approvedData;
  try {
    approvedData = JSON.parse(readFileSync(DECISION_JSON, 'utf8'));
  } catch {
    errors.push(`GATE_FAIL: Could not parse approved decisions JSON: ${DECISION_JSON}`);
    return errors;
  }

  if (!approvedData.items || !Array.isArray(approvedData.items)) {
    errors.push(`GATE_FAIL: Approved decisions file has no items array`);
    return errors;
  }

  for (const item of approvedData.items) {
    if (!item.layer || item.layer !== 'A') {
      errors.push(
        `GATE_FAIL: Item ${item.decisionId} has layer "${item.layer}", expected "A". Aborting.`
      );
    }
    if (!APPROVED_DECISION_IDS.has(item.decisionId)) {
      errors.push(
        `GATE_FAIL: Item ${item.decisionId} is not in the approved Layer A list. Aborting.`
      );
    }
    if (item.templateCode !== APPROVED_TEMPLATE_CODE) {
      errors.push(
        `GATE_FAIL: Item ${item.decisionId} has templateCode "${item.templateCode}", expected "${APPROVED_TEMPLATE_CODE}". Aborting.`
      );
    }
    if (item.sourceId !== APPROVED_SOURCE_ID) {
      errors.push(
        `GATE_FAIL: Item ${item.decisionId} has sourceId "${item.sourceId}", expected "${APPROVED_SOURCE_ID}". Aborting.`
      );
    }
  }

  return errors;
}

function gate_validateContractPaths(contract) {
  const errors = [];
  for (const item of APPROVED_LAYER_A_DECISIONS) {
    const inDocxSlots = contract.docxSlots?.some(s => s.slotId === item.path);
    const inCanonicalFields = contract.canonicalFields?.some(f => f.path === item.path);
    const inRenderBindings = contract.renderBindings?.some(b => b.slotId === item.path);

    if (!inDocxSlots && !inCanonicalFields && !inRenderBindings) {
      errors.push(
        `GATE_FAIL: Path "${item.path}" (${item.decisionId}) not found in contract. Cannot remove. Aborting.`
      );
    } else {
      const foundIn = [
        inDocxSlots ? 'docxSlots' : null,
        inCanonicalFields ? 'canonicalFields' : null,
        inRenderBindings ? 'renderBindings' : null,
      ].filter(Boolean);
      process.stderr.write(`[GATE] ${item.decisionId}: ${item.path} found in ${foundIn.join(', ')}\n`);
    }
  }
  return errors;
}

// =============================================================================
// BACKUP
// =============================================================================

function createBackup(filename) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(APPROVE_DIR, 'backups', ts);
  mkdirSync(backupDir, { recursive: true });
  const dest = join(backupDir, filename);
  cpSync(join(LOCKED_DIR, filename), dest);
  writeFileSync(
    join(backupDir, 'manifest.json'),
    JSON.stringify({
      file: filename,
      backedUpAt: new Date().toISOString(),
      templateCode: APPROVED_TEMPLATE_CODE,
      sourceId: APPROVED_SOURCE_ID,
      removedPaths: [...APPROVED_PATHS],
    }, null, 2),
    'utf8'
  );
  process.stderr.write(`[APPLY] Backup created: ${backupDir}\n`);
  return backupDir;
}

// =============================================================================
// REMOVAL
// =============================================================================

function removePaths(contract) {
  const removed = [];
  const contracted = JSON.parse(JSON.stringify(contract));

  contracted.docxSlots = contracted.docxSlots.filter(s => {
    if (APPROVED_PATHS.has(s.slotId)) {
      removed.push({ array: 'docxSlots', slotId: s.slotId, label: s.label });
      return false;
    }
    return true;
  });

  contracted.canonicalFields = contracted.canonicalFields.filter(f => {
    if (APPROVED_PATHS.has(f.path)) {
      removed.push({ array: 'canonicalFields', path: f.path, label: f.label });
      return false;
    }
    return true;
  });

  contracted.renderBindings = contracted.renderBindings.filter(b => {
    if (APPROVED_PATHS.has(b.slotId)) {
      removed.push({ array: 'renderBindings', slotId: b.slotId });
      return false;
    }
    return true;
  });

  return { contracted, removed };
}

// =============================================================================
// REPORTING
// =============================================================================

function buildReport({ contract, contracted, removed, backupDir, writeErrors }) {
  const mode = WRITE ? 'write' : 'dry-run';
  const writeApplied = WRITE && writeErrors.length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    task: 'DOCX_PATH_BINDING_LAYER_A_APPLY',
    mode,
    approvalCommand: 'APPROVE_DESTRUCTIVE_LAYER A BM-073 e412fccad227 DOCX-REMOVE-001 DOCX-REMOVE-002 DOCX-REMOVE-006 DOCX-REMOVE-007',
    layer: 'A',
    target: {
      templateCode: APPROVED_TEMPLATE_CODE,
      sourceId: APPROVED_SOURCE_ID,
    },
    plannedItems: APPROVED_LAYER_A_DECISIONS.length,
    removedPaths: [...new Set(removed.map(r => r.path || r.slotId))],
    removalDetail: removed,
    contracts: [{
      templateCode: APPROVED_TEMPLATE_CODE,
      sourceId: APPROVED_SOURCE_ID,
      file: `${APPROVED_TEMPLATE_CODE}__${APPROVED_SOURCE_ID}.contract.locked.json`,
      changed: writeApplied,
    }],
    safety: {
      lockedContractMutated: writeApplied,
      docxTouched: false,
      sourceUnchanged: true,
      backupCreated: writeApplied,
      backupPath: backupDir || null,
    },
    dryRun: {
      wouldRemove: {
        docxSlots: removed.filter(r => r.array === 'docxSlots').map(r => r.slotId),
        canonicalFields: removed.filter(r => r.array === 'canonicalFields').map(r => r.path),
        renderBindings: removed.filter(r => r.array === 'renderBindings').map(r => r.slotId),
      },
      wouldMutate: writeErrors.length === 0,
    },
    errors: writeErrors,
    next: writeApplied ? 'REVIEW_LAYER_A_CLOSURE_BEFORE_LAYER_B' : null,
  };

  return report;
}

function writeReports(report) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const jsonPath = join(REPORT_DIR, 'apply.latest.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const lines = [];
  lines.push(`# DOCX Path/Binding — Layer A Apply Report`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Mode: **${report.mode}**`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Task | ${report.task} |`);
  lines.push(`| Layer | ${report.layer} |`);
  lines.push(`| Target | ${report.target.templateCode} / ${report.target.sourceId} |`);
  lines.push(`| Planned | ${report.plannedItems} |`);
  lines.push(`| Removed | ${report.removedPaths.length} |`);
  lines.push(`| Locked contract mutated | ${report.safety.lockedContractMutated ? '**true**' : 'false'} |`);
  lines.push(`| Backup created | ${report.safety.backupCreated ? '**true**' : 'false'} |`);
  lines.push('');
  lines.push('## Approval Command');
  lines.push('');
  lines.push('```');
  lines.push(report.approvalCommand);
  lines.push('```');
  lines.push('');
  lines.push('## Dry-Run Plan');
  lines.push('');
  lines.push('| Array | Paths to remove |');
  lines.push('|-------|----------------|');
  for (const [array, paths] of Object.entries(report.dryRun.wouldRemove)) {
    lines.push(`| ${array} | ${paths.length > 0 ? paths.map(p => '`' + p + '`').join(', ') : '_none_'} |`);
  }
  lines.push('');

  if (report.mode === 'write') {
    lines.push('## Write Result');
    lines.push('');
    lines.push(`| Check | Result |`);
    lines.push('|-------|--------|');
    lines.push(`| Contract file | ${report.contracts[0].file} |`);
    lines.push(`| Locked contract mutated | ${report.safety.lockedContractMutated ? '**true**' : 'false'} |`);
    lines.push(`| Backup path | ${report.safety.backupPath || 'n/a'} |`);
    lines.push(`| DOCX touched | **false** |`);
    lines.push(`| Source changed | **false** |`);
    lines.push('');

    if (report.errors.length > 0) {
      lines.push('## Errors');
      lines.push('');
      for (const e of report.errors) {
        lines.push(`- ${e}`);
      }
      lines.push('');
    }
  }

  lines.push('## Safety');
  lines.push('');
  lines.push('| Check | Value |');
  lines.push('|-------|-------|');
  lines.push(`| Locked contract mutated | ${report.safety.lockedContractMutated ? '**true**' : 'false'} |`);
  lines.push('| DOCX touched | **false** |');
  lines.push(`| Source/path/binding directly changed | **false** |`);
  lines.push(`| Layer B/C touched | **false** |`);
  lines.push(`| Backup created | ${report.safety.backupCreated ? '**true**' : 'false'} |`);
  lines.push('');

  lines.push('## Next Task');
  lines.push('');
  lines.push('`REVIEW_LAYER_A_CLOSURE_BEFORE_LAYER_B`');
  lines.push('');
  lines.push('Do NOT proceed to Layer B until Layer A closure report is reviewed.');

  const mdPath = join(REPORT_DIR, 'apply.latest.md');
  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');

  process.stderr.write(`[APPLY] Reports written to ${REPORT_DIR}\n`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write(`[APPLY] DOCX_PATH_BINDING_LAYER_A_APPLY\n`);
  process.stderr.write(`[APPLY] Mode: ${WRITE_MODE}\n`);

  // Gate 1: Validate approved decisions file
  const gateErrors = gate_validateApprovedFile();
  if (gateErrors.length > 0) {
    for (const e of gateErrors) process.stderr.write(`[APPLY] ${e}\n`);
    const report = buildReport({
      contract: null, contracted: null, removed: [], backupDir: null,
      writeErrors: gateErrors,
    });
    writeReports(report);
    process.exit(1);
  }

  // Gate 2: Load contract
  let contract, filename;
  try {
    ({ contract, filename } = loadContract(APPROVED_TEMPLATE_CODE, APPROVED_SOURCE_ID));
    process.stderr.write(`[APPLY] Loaded contract: ${filename}\n`);
  } catch (e) {
    process.stderr.write(`[APPLY] ${e.message}\n`);
    const report = buildReport({
      contract: null, contracted: null, removed: [], backupDir: null,
      writeErrors: [e.message],
    });
    writeReports(report);
    process.exit(1);
  }

  // Gate 3: Validate all paths exist in contract
  const pathErrors = gate_validateContractPaths(contract);
  if (pathErrors.length > 0) {
    for (const e of pathErrors) process.stderr.write(`[APPLY] ${e}\n`);
    const report = buildReport({
      contract, contracted: null, removed: [], backupDir: null,
      writeErrors: pathErrors,
    });
    writeReports(report);
    process.exit(1);
  }

  // Compute removal
  const { contracted, removed } = removePaths(contract);

  // Write mode
  let backupDir = null;
  const writeErrors = [];
  if (WRITE) {
    try {
      backupDir = createBackup(filename);
      writeFileSync(join(LOCKED_DIR, filename), JSON.stringify(contracted, null, 2), 'utf8');
      process.stderr.write(`[APPLY] Written: ${filename}\n`);
      for (const item of APPROVED_LAYER_A_DECISIONS) {
        process.stderr.write(`[APPLY]   Removed: ${item.path} (${item.decisionId})\n`);
      }
    } catch (e) {
      writeErrors.push(`WRITE_ERROR: ${e.message}`);
      process.stderr.write(`[APPLY] ${e.message}\n`);
    }
  } else {
    process.stderr.write(`[APPLY] DRY-RUN: No changes made.\n`);
    process.stderr.write(`[APPLY] Would remove from docxSlots: ${removed.filter(r => r.array === 'docxSlots').map(r => r.slotId).join(', ') || 'none'}\n`);
    process.stderr.write(`[APPLY] Would remove from canonicalFields: ${removed.filter(r => r.array === 'canonicalFields').map(r => r.path).join(', ') || 'none'}\n`);
    process.stderr.write(`[APPLY] Would remove from renderBindings: ${removed.filter(r => r.array === 'renderBindings').map(r => r.slotId).join(', ') || 'none'}\n`);
  }

  const report = buildReport({ contract, contracted, removed, backupDir, writeErrors });
  writeReports(report);

  if (writeErrors.length > 0) {
    process.exit(1);
  }

  process.stderr.write(`[APPLY] ${WRITE ? 'WRITE' : 'DRY-RUN'} complete. Reports at ${REPORT_DIR}\n`);
}

main();
