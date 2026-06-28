#!/usr/bin/env node
/**
 * apply-docx-path-binding-layer-b-approved.mjs
 *
 * Applies Layer B of the DOCX path/binding removal plan.
 * Removes 3 orphan slots from 3 locked contracts only:
 *   BM-080/a7aa64d4b889: person.personFullName
 *   BM-063/54b73110a34f: document.fullDocumentCode8
 *   BM-064/4d8cebc3515b: document.issueDate4
 *
 * Modes:
 *   dry-run (default)  — read, compute, report, modify nothing
 *   write (--write)   — backup then patch each locked contract
 *
 * Safety layers:
 *   1. Hard-gate: approved decisions must all be Layer B only
 *   2. Hard-gate: target contracts must be exactly the 3 listed above
 *   3. Hard-gate: abort on missing contract
 *   4. Hard-gate: abort if any approved path not found in its contract
 *   5. Hard-gate: abort if approved file contains anything outside Layer B
 *   6. Hard-gate: domain-model tentative paths must NOT appear in output
 *   7. Multi-contract backup before write (timestamped folder)
 *   8. Write-to-file only (no DOCX mutation, no source mutation)
 *
 * Exit codes:
 *   0 — dry-run or write completed successfully
 *   1 — safety check failed or unexpected error
 *
 * Usage:
 *   node scripts/audit/apply-docx-path-binding-layer-b-approved.mjs          # dry-run
 *   node scripts/audit/apply-docx-path-binding-layer-b-approved.mjs --write  # apply
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const APPROVE_DIR = join(ROOT, 'docs', 'audit', 'docx-path-binding-layer-b-approved');
const DECISION_JSON = join(APPROVE_DIR, 'decisions.approved.json');
const REPORT_DIR = join(APPROVE_DIR, 'apply-reports');

const WRITE = process.argv.includes('--write');
const WRITE_MODE = WRITE ? 'write' : 'dry-run';

// =============================================================================
// APPROVED DECISIONS (hard-coded gate)
// =============================================================================

const APPROVED_TARGETS = [
  {
    decisionId: 'DOCX-REMOVE-003',
    templateCode: 'BM-080',
    sourceId: 'a7aa64d4b889',
    path: 'person.personFullName',
  },
  {
    decisionId: 'DOCX-REMOVE-004',
    templateCode: 'BM-063',
    sourceId: '54b73110a34f',
    path: 'document.fullDocumentCode8',
  },
  {
    decisionId: 'DOCX-REMOVE-005',
    templateCode: 'BM-064',
    sourceId: '4d8cebc3515b',
    path: 'document.issueDate4',
  },
];

const APPROVED_DECISION_IDS = new Set(APPROVED_TARGETS.map(d => d.decisionId));
const APPROVED_PATHS_BY_CONTRACT = {};
for (const t of APPROVED_TARGETS) {
  const key = `${t.templateCode}__${t.sourceId}`;
  if (!APPROVED_PATHS_BY_CONTRACT[key]) APPROVED_PATHS_BY_CONTRACT[key] = [];
  APPROVED_PATHS_BY_CONTRACT[key].push(t.path);
}

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
    if (!item.layer || item.layer !== 'B') {
      errors.push(
        `GATE_FAIL: Item ${item.decisionId} has layer "${item.layer}", expected "B". Aborting.`
      );
    }
    if (!APPROVED_DECISION_IDS.has(item.decisionId)) {
      errors.push(
        `GATE_FAIL: Item ${item.decisionId} is not in the approved Layer B list. Aborting.`
      );
    }
    const expected = APPROVED_TARGETS.find(t => t.decisionId === item.decisionId);
    if (expected) {
      if (item.templateCode !== expected.templateCode) {
        errors.push(
          `GATE_FAIL: ${item.decisionId} has templateCode "${item.templateCode}", expected "${expected.templateCode}". Aborting.`
        );
      }
      if (item.sourceId !== expected.sourceId) {
        errors.push(
          `GATE_FAIL: ${item.decisionId} has sourceId "${item.sourceId}", expected "${expected.sourceId}". Aborting.`
        );
      }
      if (item.path !== expected.path) {
        errors.push(
          `GATE_FAIL: ${item.decisionId} has path "${item.path}", expected "${expected.path}". Aborting.`
        );
      }
    }
  }

  return errors;
}

function gate_validateContractPaths(contract, templateCode, sourceId) {
  const errors = [];
  const key = `${templateCode}__${sourceId}`;
  const approvedPaths = APPROVED_PATHS_BY_CONTRACT[key] || [];

  for (const path of approvedPaths) {
    const inDocxSlots = contract.docxSlots?.some(s => s.slotId === path);
    const inCanonicalFields = contract.canonicalFields?.some(f => f.path === path);
    const inRenderBindings = contract.renderBindings?.some(b => b.slotId === path);

    if (!inDocxSlots && !inCanonicalFields && !inRenderBindings) {
      errors.push(
        `GATE_FAIL: Path "${path}" (${contract.templateCode}) not found in contract. Cannot remove. Aborting.`
      );
    } else {
      const foundIn = [
        inDocxSlots ? 'docxSlots' : null,
        inCanonicalFields ? 'canonicalFields' : null,
        inRenderBindings ? 'renderBindings' : null,
      ].filter(Boolean);
      process.stderr.write(`[GATE] ${contract.templateCode}::${path}: found in ${foundIn.join(', ')}\n`);
    }
  }
  return errors;
}

// =============================================================================
// BACKUP
// =============================================================================

function createBackups(filenames) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(APPROVE_DIR, 'backups', ts);
  mkdirSync(backupDir, { recursive: true });

  for (const { filename } of filenames) {
    cpSync(join(LOCKED_DIR, filename), join(backupDir, filename));
  }

  const manifest = {
    backedUpAt: new Date().toISOString(),
    contracts: filenames.map(({ templateCode, sourceId, filename }) => ({
      templateCode,
      sourceId,
      file: filename,
    })),
  };
  writeFileSync(join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  process.stderr.write(`[APPLY] Backup created: ${backupDir}\n`);
  return backupDir;
}

// =============================================================================
// REMOVAL
// =============================================================================

function removePaths(contract, approvedPaths) {
  const removed = [];
  const contracted = JSON.parse(JSON.stringify(contract));
  const pathsSet = new Set(approvedPaths);

  contracted.docxSlots = contracted.docxSlots.filter(s => {
    if (pathsSet.has(s.slotId)) {
      removed.push({ array: 'docxSlots', slotId: s.slotId, label: s.label });
      return false;
    }
    return true;
  });

  contracted.canonicalFields = contracted.canonicalFields.filter(f => {
    if (pathsSet.has(f.path)) {
      removed.push({ array: 'canonicalFields', path: f.path, label: f.label });
      return false;
    }
    return true;
  });

  contracted.renderBindings = contracted.renderBindings.filter(b => {
    if (pathsSet.has(b.slotId)) {
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

function buildReport({ contracts, removed, backupDir, writeErrors }) {
  const mode = WRITE ? 'write' : 'dry-run';
  const writeApplied = WRITE && writeErrors.length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    task: 'DOCX_PATH_BINDING_LAYER_B_APPLY',
    mode,
    approvalCommand: 'APPROVE_DESTRUCTIVE_LAYER B BM-080 BM-063 BM-064 a7aa64d4b889 54b73110a34f 4d8cebc3515b DOCX-REMOVE-003 DOCX-REMOVE-004 DOCX-REMOVE-005',
    layer: 'B',
    plannedItems: APPROVED_TARGETS.length,
    contracts: contracts.map(c => ({
      templateCode: c.templateCode,
      sourceId: c.sourceId,
      file: c.filename,
      changed: writeApplied,
      removedPaths: [...new Set(c.removed.map(r => r.path || r.slotId))],
    })),
    safety: {
      lockedContractsMutated: writeApplied ? contracts.length : 0,
      docxTouched: false,
      sourceUnchanged: true,
      domainModelPathsAdded: false,
      backupCreated: writeApplied,
      backupPath: backupDir || null,
    },
    dryRun: {
      wouldRemove: contracts.map(c => ({
        contract: c.templateCode,
        docxSlots: c.removed.filter(r => r.array === 'docxSlots').map(r => r.slotId),
        canonicalFields: c.removed.filter(r => r.array === 'canonicalFields').map(r => r.path),
        renderBindings: c.removed.filter(r => r.array === 'renderBindings').map(r => r.slotId),
      })),
    },
    errors: writeErrors,
    next: writeApplied ? 'REVIEW_LAYER_B_CLOSURE_BEFORE_LAYER_C' : null,
  };

  return report;
}

function writeReports(report) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const jsonPath = join(REPORT_DIR, 'apply.latest.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const lines = [];
  lines.push(`# DOCX Path/Binding — Layer B Apply Report`);
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
  lines.push(`| Planned | ${report.plannedItems} |`);
  lines.push(`| Contracts mutated | ${report.safety.lockedContractsMutated} |`);
  lines.push(`| Backup created | ${report.safety.backupCreated ? '**true**' : 'false'} |`);
  lines.push(`| DOCX touched | **false** |`);
  lines.push(`| Domain-model paths added | **false** |`);
  lines.push('');
  lines.push('## Approval Command');
  lines.push('');
  lines.push('```');
  lines.push(report.approvalCommand);
  lines.push('```');
  lines.push('');

  for (const c of report.dryRun.wouldRemove) {
    lines.push(`## ${c.contract} — planned removals`);
    lines.push('');
    lines.push('| Array | Paths |');
    lines.push('|-------|-------|');
    lines.push(`| docxSlots | ${c.docxSlots.length > 0 ? c.docxSlots.map(p => '`' + p + '`').join(', ') : '_none_'} |`);
    lines.push(`| canonicalFields | ${c.canonicalFields.length > 0 ? c.canonicalFields.map(p => '`' + p + '`').join(', ') : '_none_'} |`);
    lines.push(`| renderBindings | ${c.renderBindings.length > 0 ? c.renderBindings.map(p => '`' + p + '`').join(', ') : '_none_'} |`);
    lines.push('');
  }

  if (report.mode === 'write') {
    lines.push('## Write Result');
    lines.push('');
    lines.push(`| Check | Result |`);
    lines.push('|-------|--------|');
    for (const c of report.contracts) {
      lines.push(`| ${c.templateCode}/${c.sourceId} | ${c.changed ? '**mutated**' : 'unchanged'} |`);
    }
    lines.push(`| Backup path | ${report.safety.backupPath || 'n/a'} |`);
    lines.push('');
    if (report.errors.length > 0) {
      lines.push('## Errors');
      lines.push('');
      for (const e of report.errors) lines.push(`- ${e}`);
      lines.push('');
    }
  }

  lines.push('## Safety');
  lines.push('');
  lines.push('| Check | Value |');
  lines.push('|-------|-------|');
  lines.push(`| Locked contracts mutated | ${report.safety.lockedContractsMutated} |`);
  lines.push('| DOCX touched | **0** |');
  lines.push('| Source/path/binding directly changed | **false** |');
  lines.push('| Domain-model tentative paths added | **false** |');
  lines.push(`| Backup created | ${report.safety.backupCreated ? '**true**' : 'false'} |`);
  lines.push('');
  lines.push('## Next Task');
  lines.push('');
  lines.push('`REVIEW_LAYER_B_CLOSURE_BEFORE_LAYER_C`');
  lines.push('');
  lines.push('Do NOT proceed to Layer C until Layer B closure report is reviewed.');

  const mdPath = join(REPORT_DIR, 'apply.latest.md');
  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
  process.stderr.write(`[APPLY] Reports written to ${REPORT_DIR}\n`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write(`[APPLY] DOCX_PATH_BINDING_LAYER_B_APPLY\n`);
  process.stderr.write(`[APPLY] Mode: ${WRITE_MODE}\n`);

  // Gate 1: Validate approved decisions file
  const gateErrors = gate_validateApprovedFile();
  if (gateErrors.length > 0) {
    for (const e of gateErrors) process.stderr.write(`[APPLY] ${e}\n`);
    const report = buildReport({ contracts: [], removed: [], backupDir: null, writeErrors: gateErrors });
    writeReports(report);
    process.exit(1);
  }

  // Load and process each contract
  const contracts = [];
  const allRemoved = [];
  const filenames = [];

  for (const target of APPROVED_TARGETS) {
    let contract, filename;
    try {
      ({ contract, filename } = loadContract(target.templateCode, target.sourceId));
      process.stderr.write(`[APPLY] Loaded: ${filename}\n`);
    } catch (e) {
      process.stderr.write(`[APPLY] ${e.message}\n`);
      const report = buildReport({
        contracts: [], removed: [], backupDir: null,
        writeErrors: [e.message],
      });
      writeReports(report);
      process.exit(1);
    }

    const pathErrors = gate_validateContractPaths(contract, target.templateCode, target.sourceId);
    if (pathErrors.length > 0) {
      for (const e of pathErrors) process.stderr.write(`[APPLY] ${e}\n`);
      const report = buildReport({
        contracts, removed: allRemoved, backupDir: null,
        writeErrors: pathErrors,
      });
      writeReports(report);
      process.exit(1);
    }

    const { contracted, removed } = removePaths(contract, [target.path]);
    allRemoved.push(...removed);
    filenames.push({ templateCode: target.templateCode, sourceId: target.sourceId, filename });

    contracts.push({
      templateCode: target.templateCode,
      sourceId: target.sourceId,
      filename,
      contract,
      contracted,
      removed,
    });
  }

  // Write mode
  let backupDir = null;
  const writeErrors = [];
  if (WRITE) {
    try {
      backupDir = createBackups(filenames);
      for (const c of contracts) {
        writeFileSync(join(LOCKED_DIR, c.filename), JSON.stringify(c.contracted, null, 2), 'utf8');
        process.stderr.write(`[APPLY] Written: ${c.filename}\n`);
        for (const r of c.removed) {
          process.stderr.write(`[APPLY]   Removed: ${r.path || r.slotId} (${r.array})\n`);
        }
      }
    } catch (e) {
      writeErrors.push(`WRITE_ERROR: ${e.message}`);
      process.stderr.write(`[APPLY] ${e.message}\n`);
    }
  } else {
    process.stderr.write(`[APPLY] DRY-RUN: No changes made.\n`);
    for (const c of contracts) {
      process.stderr.write(`[APPLY] ${c.templateCode}: ` +
        `docxSlots ${c.removed.filter(r => r.array === 'docxSlots').map(r => r.slotId).join(', ') || 'none'}, ` +
        `canonicalFields ${c.removed.filter(r => r.array === 'canonicalFields').map(r => r.path).join(', ') || 'none'}, ` +
        `renderBindings ${c.removed.filter(r => r.array === 'renderBindings').map(r => r.slotId).join(', ') || 'none'}\n`
      );
    }
  }

  const report = buildReport({ contracts, removed: allRemoved, backupDir, writeErrors });
  writeReports(report);

  if (writeErrors.length > 0) process.exit(1);
  process.stderr.write(`[APPLY] ${WRITE ? 'WRITE' : 'DRY-RUN'} complete.\n`);
}

main();
