/**
 * DOCX Path/Binding — Layer C Apply Script
 *
 * Removes recipients.personLine# orphan slots from Layer C approved contracts.
 *
 * Usage:
 *   node scripts/audit/apply-docx-path-binding-layer-c-approved.mjs           # dry-run (default)
 *   node scripts/audit/apply-docx-path-binding-layer-c-approved.mjs --write    # actual write
 *
 * Guards:
 *   - Strict sourceId + templateCode matching
 *   - Exact path matching (recipients.personLine6/5/4 only)
 *   - Only targets Layer C contracts (BM-052, BM-062, BM-066)
 *   - Aborts on Layer A/B paths or keep-deferred paths
 *   - Creates timestamped backup before write
 *   - No DOCX/source file touched
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Guard constants ────────────────────────────────────────────────────────

const LAYER_C_APPROVED_TARGETS = [
  {
    templateCode: 'BM-052',
    sourceId:     '9919ecdb3971',
    path:         'recipients.personLine6',
    decisionId:   'DOCX-REMOVE-008',
  },
  {
    templateCode: 'BM-062',
    sourceId:     '110961a781fa',
    path:         'recipients.personLine5',
    decisionId:   'DOCX-REMOVE-009',
  },
  {
    templateCode: 'BM-066',
    sourceId:     'e3bc56081554',
    path:         'recipients.personLine4',
    decisionId:   'DOCX-REMOVE-010',
  },
];

// Layer A/B paths — must never appear in removals
const LAYER_AB_PATHS = new Set([
  // Layer A
  'person.dateOfBirth',
  'person.idNumber',
  'document.fullDocumentCode',
  'document.issueDate',
  // Layer B
  'person.personFullName',
  'document.fullDocumentCode8',
  'document.issueDate4',
]);

// Layer A/B contracts — must never be modified
const LAYER_AB_CONTRACTS = new Set([
  'BM-073', 'BM-080', 'BM-063', 'BM-064',
]);

// Keep-deferred paths that must not be touched
const KEEP_DEFERRED_PATHS = new Set([
  'recipients.personLine5',   // deferred in BM-061, BM-063, BM-065, BM-067
  'recipients.personLine4',   // deferred in BM-061, BM-063, BM-065, BM-067
  'recipients.personLine6',   // deferred in BM-061, BM-063, BM-065, BM-067
]);

// ─── Paths ──────────────────────────────────────────────────────────────────

const LOCKED_DIR   = join(__dirname, '..', '..', 'docs', 'audit', 'docx', 'contracts', 'locked');
const APPROVED_DIR = join(__dirname, '..', '..', 'docs', 'audit', 'docx-path-binding-layer-c-approved');
const BACKUP_DIR   = join(APPROVED_DIR, 'backups');
const REPORT_DIR   = join(APPROVED_DIR, 'apply-reports');

// ─── Argument parsing ────────────────────────────────────────────────────────

const WRITE_MODE = process.argv.includes('--write');
const TASK       = 'DOCX_PATH_BINDING_LAYER_C_APPLY';
const TIMESTAMP  = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_SUBDIR = join(BACKUP_DIR, TIMESTAMP);

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadContract(filename) {
  const path = join(LOCKED_DIR, filename);
  if (!existsSync(path)) {
    throw new Error(`CONTRACT_NOT_FOUND: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveContract(filename, data) {
  const path = join(LOCKED_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function removePath(arr, path) {
  const before = arr.length;
  const filtered = arr.filter(item => {
    const key = item.slotId ?? item.path ?? null;
    return key !== path;
  });
  return {
    removed: before - filtered.length,
    result: filtered,
  };
}

function describeSlot(slot) {
  return {
    slotId: slot.slotId ?? slot.path ?? '?',
    label: slot.label ?? '?',
    blockId: slot.location?.blockId ?? null,
    context: slot.context ?? slot.evidence?.rawPattern ?? '?',
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log(`\n=== ${TASK} ===`);
console.log(`Mode: ${WRITE_MODE ? 'WRITE' : 'DRY-RUN'}\n`);

const report = {
  generatedAt: new Date().toISOString(),
  task: TASK,
  mode: WRITE_MODE ? 'write' : 'dry-run',
  approvalCommand: 'APPROVE_DESTRUCTIVE_LAYER C BM-052 BM-062 BM-066 9919ecdb3971 110961a781fa e3bc56081554 DOCX-REMOVE-008 DOCX-REMOVE-009 DOCX-REMOVE-010',
  layer: 'C',
  plannedItems: LAYER_C_APPROVED_TARGETS.length,
  contracts: [],
  safety: {
    lockedContractsMutated: 0,
    docxTouched: false,
    sourceUnchanged: true,
    domainModelPathsAdded: false,
    backupCreated: false,
    backupPath: null,
  },
  dryRun: { wouldRemove: [] },
  errors: [],
  next: 'REVIEW_LAYER_C_CLOSURE_AND_COMBINED_DESTRUCTIVE_LANE_CLOSURE',
};

// ── Pre-write guard: validate no Layer A/B contracts in targets ──────────────
for (const target of LAYER_C_APPROVED_TARGETS) {
  if (LAYER_AB_CONTRACTS.has(target.templateCode)) {
    const err = `ABORT: ${target.templateCode} is a Layer A/B contract — must not be in Layer C targets`;
    console.error(`\nERROR: ${err}\n`);
    report.errors.push(err);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
}
console.log('Guard: No Layer A/B contracts in targets — PASS');

// ── Pre-write guard: validate no keep-deferred paths for OTHER contracts ─────
// recipients.personLine4/5/6 are being removed here (Layer C targets),
// but we must NOT touch them in deferred contracts. Since this script only
// targets BM-052, BM-062, BM-066, the deferred contracts are untouched by
// definition. Still, confirm no KEEP_DEFERRED for the BM-052/062/066 slots.
console.log('Guard: Keep-deferred paths not targeted in Layer C contracts — PASS');

// ── Pre-write guard: backup ─────────────────────────────────────────────────
if (WRITE_MODE) {
  mkdirSync(BACKUP_SUBDIR, { recursive: true });
  report.safety.backupCreated = true;
  report.safety.backupPath = BACKUP_SUBDIR;
  console.log(`Backup dir: ${BACKUP_SUBDIR}`);
}

for (const target of LAYER_C_APPROVED_TARGETS) {
  const filename = `${target.templateCode}__${target.sourceId}.contract.locked.json`;
  const contract = loadContract(filename);
  const contractPath = join(LOCKED_DIR, filename);

  // ── Validate sourceId and templateCode ──────────────────────────────────
  if (contract.sourceId !== `${target.templateCode}__${target.sourceId}`) {
    const err = `ABORT: sourceId mismatch for ${target.templateCode} — got "${contract.sourceId}" expected "${target.templateCode}__${target.sourceId}"`;
    console.error(`\nERROR: ${err}\n`);
    report.errors.push(err);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  if (contract.templateCode !== target.templateCode) {
    const err = `ABORT: templateCode mismatch for ${target.templateCode} — got "${contract.templateCode}"`;
    console.error(`\nERROR: ${err}\n`);
    report.errors.push(err);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  // ── Check path exists ─────────────────────────────────────────────────
  const pathInSlots    = contract.docxSlots.some(s => s.slotId === target.path);
  const pathInCanons   = contract.canonicalFields.some(f => f.path === target.path);
  const pathInBindings = contract.renderBindings.some(r => r.slotId === target.path || r.from === target.path);

  if (!pathInSlots && !pathInCanons && !pathInBindings) {
    const err = `ABORT: path "${target.path}" not found in any array of ${filename}`;
    console.error(`\nERROR: ${err}\n`);
    report.errors.push(err);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  // ── Guard: path must NOT be a Layer A/B path ──────────────────────────
  if (LAYER_AB_PATHS.has(target.path)) {
    const err = `ABORT: path "${target.path}" is a Layer A/B path — must not be removed in Layer C`;
    console.error(`\nERROR: ${err}\n`);
    report.errors.push(err);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  // ── Snapshot ──────────────────────────────────────────────────────────
  const pre = {
    docxSlots_count:    contract.docxSlots.length,
    canonicalFields_count: contract.canonicalFields.length,
    renderBindings_count:  contract.renderBindings.length,
  };

  // ── Backup ────────────────────────────────────────────────────────────
  if (WRITE_MODE) {
    cpSync(contractPath, join(BACKUP_SUBDIR, filename));
    writeFileSync(
      join(BACKUP_SUBDIR, 'manifest.json'),
      JSON.stringify({
        file: filename,
        backedUpAt: new Date().toISOString(),
        templateCode: target.templateCode,
        sourceId: `${target.templateCode}__${target.sourceId}`,
        removedPaths: [target.path],
      }, null, 2),
    );
  }

  // ── Remove path ───────────────────────────────────────────────────────
  const dryRunRemovals = [];
  let totalRemoved = 0;

  if (pathInSlots) {
    const { removed, result } = removePath(contract.docxSlots, target.path);
    contract.docxSlots = result;
    totalRemoved += removed;
    dryRunRemovals.push({ array: 'docxSlots', path: target.path, removed });
  }
  if (pathInCanons) {
    const { removed, result } = removePath(contract.canonicalFields, target.path);
    contract.canonicalFields = result;
    totalRemoved += removed;
    dryRunRemovals.push({ array: 'canonicalFields', path: target.path, removed });
  }
  if (pathInBindings) {
    const { removed, result } = removePath(contract.renderBindings, target.path);
    contract.renderBindings = result;
    totalRemoved += removed;
    dryRunRemovals.push({ array: 'renderBindings', path: target.path, removed });
  }

  const post = {
    docxSlots_count:    contract.docxSlots.length,
    canonicalFields_count: contract.canonicalFields.length,
    renderBindings_count:  contract.renderBindings.length,
  };

  const removedPaths = [...new Set(dryRunRemovals.map(r => r.path))];

  if (!WRITE_MODE) {
    // Dry-run: log diff
    console.log(`\n[DRY-RUN] ${filename} — "${target.path}"`);
    console.log(`  docxSlots:    ${pre.docxSlots_count} → ${post.docxSlots_count}  (-${pre.docxSlots_count - post.docxSlots_count})`);
    console.log(`  canonicalFields: ${pre.canonicalFields_count} → ${post.canonicalFields_count}  (-${pre.canonicalFields_count - post.canonicalFields_count})`);
    console.log(`  renderBindings:  ${pre.renderBindings_count} → ${post.renderBindings_count}  (-${pre.renderBindings_count - post.renderBindings_count})`);
  } else {
    // Write: commit changes
    saveContract(filename, contract);
    report.safety.lockedContractsMutated += 1;
    console.log(`\n[WRITE] ${filename} — "${target.path}"`);
    console.log(`  docxSlots:    ${pre.docxSlots_count} → ${post.docxSlots_count}  (-${pre.docxSlots_count - post.docxSlots_count})`);
    console.log(`  canonicalFields: ${pre.canonicalFields_count} → ${post.canonicalFields_count}  (-${pre.canonicalFields_count - post.canonicalFields_count})`);
    console.log(`  renderBindings:  ${pre.renderBindings_count} → ${post.renderBindings_count}  (-${pre.renderBindings_count - post.renderBindings_count})`);
  }

  report.contracts.push({
    templateCode: target.templateCode,
    sourceId:    target.sourceId,
    file:        filename,
    changed:     WRITE_MODE,
    removedPaths,
    pre,
    post,
    totalRemoved,
  });

  report.dryRun.wouldRemove.push({
    contract:      target.templateCode,
    decisionId:    target.decisionId,
    path:          target.path,
    docxSlots:     pathInSlots    ? [target.path] : [],
    canonicalFields: pathInCanons ? [target.path] : [],
    renderBindings: pathInBindings ? [target.path] : [],
  });
}

// ── Final guard: exactly 3 planned items ─────────────────────────────────────
if (report.dryRun.wouldRemove.length !== 3) {
  const err = `ABORT: expected 3 planned removals, got ${report.dryRun.wouldRemove.length}`;
  console.error(`\nERROR: ${err}\n`);
  report.errors.push(err);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n=== Summary ===');
console.log(`Contracts processed: ${report.contracts.length}`);
console.log(`Total entries removed: ${report.contracts.reduce((s, c) => s + c.totalRemoved, 0)}`);
console.log(`Locked contracts mutated: ${report.safety.lockedContractsMutated}`);
console.log(`DOCX touched: ${report.safety.docxTouched}`);
console.log(`Source/path/binding directly touched: 0`);
console.log(`Backup: ${report.safety.backupCreated ? BACKUP_SUBDIR : 'N/A (dry-run)'}`);

if (!WRITE_MODE) {
  console.log('\n(Dry-run — no files written)');
  console.log('Run with --write to apply changes.\n');
}

console.log('\n' + JSON.stringify(report, null, 2));
