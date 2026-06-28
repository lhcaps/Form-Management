#!/usr/bin/env node
/**
 * apply-safe-label-only.mjs
 *
 * Generic SAFE_LABEL_ONLY patch runner.
 * Usage:
 *   node scripts/audit/apply-safe-label-only.mjs <BM>          # dry-run
 *   node scripts/audit/apply-safe-label-only.mjs <BM> --write  # apply
 *
 * Prerequisites:
 *   docs/audit/per-form-render-accurate/<BM>/approved/decisions.approved.json
 *
 * Guards:
 *   - Exact templateCode match
 *   - Exact full sourceId match
 *   - Expected counts for canonicalFields / docxSlots / renderBindings
 *   - Pre-count === expectedCounts
 *   - Post-count === pre-count
 *   - Exact path per canonicalField
 *   - Exact old label match per canonicalField
 *   - Only canonicalFields[].label targets allowed
 *   - No docxSlots changes
 *   - No renderBindings changes
 *   - No path changes
 *   - No field count changes
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const [, , rawBm, writeFlag] = process.argv;

if (!rawBm) {
  console.error('Usage: node apply-safe-label-only.mjs <BM> [--write]');
  console.error('Example: node apply-safe-label-only.mjs BM-001');
  console.error('         node apply-safe-label-only.mjs BM-001 --write');
  process.exit(1);
}

const bm = rawBm.trim();
const isWrite = writeFlag === '--write';

if (isWrite) {
  console.log('⚠️  WRITE MODE — changes will be applied to disk');
} else {
  console.log('🔍 DRY-RUN MODE — no changes written');
}

// ── paths ──────────────────────────────────────────────────────────────────

const baseDir = resolve(process.cwd());
const decisionPath = join(baseDir, 'docs', 'audit', 'per-form-render-accurate', bm,
  'approved', 'decisions.approved.json');
const contractDir = join(baseDir, 'docs', 'audit', 'docx', 'contracts', 'locked');
const backupDir = join(baseDir, 'docs', 'audit', 'per-form-render-accurate', bm, 'backups');

// ── load approved decision ──────────────────────────────────────────────────

if (!existsSync(decisionPath)) {
  console.error(`❌ Approved decision not found: ${decisionPath}`);
  process.exit(1);
}

let approved;
try {
  approved = JSON.parse(readFileSync(decisionPath, 'utf8'));
} catch (err) {
  console.error(`❌ Failed to parse decision file: ${err.message}`);
  process.exit(1);
}

// ── guard: templateCode ────────────────────────────────────────────────────

if (bm !== approved.templateCode) {
  console.error(`❌ Template code mismatch. Argument="${bm}", Approved="${approved.templateCode}"`);
  process.exit(1);
}

// ── guard: sourceId exact match ───────────────────────────────────────────

const contractFiles = readdirSync(contractDir).filter(f =>
  f.startsWith(`${bm}__`) && f.endsWith('.contract.locked.json')
);

if (contractFiles.length === 0) {
  console.error(`❌ No contract found for ${bm} in ${contractDir}`);
  process.exit(1);
}

if (contractFiles.length > 1) {
  console.error(`❌ Multiple contracts found for ${bm}: ${contractFiles.join(', ')}`);
  process.exit(1);
}

const contractFile = contractFiles[0];
const contractPath = join(contractDir, contractFile);
const contractSourceId = contractFile.replace('.contract.locked.json', '');

if (contractSourceId !== approved.sourceId) {
  console.error(`❌ SourceId mismatch. Contract="${contractSourceId}", Approved="${approved.sourceId}"`);
  process.exit(1);
}

// ── load contract ──────────────────────────────────────────────────────────

let contract;
try {
  contract = JSON.parse(readFileSync(contractPath, 'utf8'));
} catch (err) {
  console.error(`❌ Failed to parse contract: ${err.message}`);
  process.exit(1);
}

// ── guard: templateCode exact ──────────────────────────────────────────────

if (contract.templateCode !== approved.templateCode) {
  console.error(`❌ Contract templateCode mismatch: "${contract.templateCode}" !== "${approved.templateCode}"`);
  process.exit(1);
}

// ── guard: sourceId exact ─────────────────────────────────────────────────

if (contract.sourceId !== approved.sourceId) {
  console.error(`❌ Contract sourceId mismatch: "${contract.sourceId}" !== "${approved.sourceId}"`);
  process.exit(1);
}

// ── guard: patch type ─────────────────────────────────────────────────────

if (approved.patchType !== 'SAFE_LABEL_ONLY') {
  console.error(`❌ Only SAFE_LABEL_ONLY is supported. Got: "${approved.patchType}"`);
  process.exit(1);
}

// ── guard: expected counts ─────────────────────────────────────────────────

const preCounts = {
  canonicalFields: (contract.canonicalFields ?? []).length,
  docxSlots: (contract.docxSlots ?? []).length,
  renderBindings: (contract.renderBindings ?? []).length,
};

const expected = approved.expectedCounts ?? {};

for (const key of ['canonicalFields', 'docxSlots', 'renderBindings']) {
  if (preCounts[key] !== expected[key]) {
    console.error(`❌ Pre-apply ${key} count mismatch. Contract=${preCounts[key]}, Expected=${expected[key]}`);
    process.exit(1);
  }
}

// ── guard: no duplicate approved paths ────────────────────────────────────

const approvedPaths = new Set();
const duplicatePaths = new Set();
for (const change of (approved.changes ?? [])) {
  if (approvedPaths.has(change.path)) duplicatePaths.add(change.path);
  approvedPaths.add(change.path);
}
if (duplicatePaths.size > 0) {
  console.error(`❌ Duplicate approved paths: ${[...duplicatePaths].join(', ')}`);
  process.exit(1);
}

// ── guard: build lookup of canonicalFields by index ────────────────────────

const cfByIndex = {};
const cfByPath = {};
let duplicateIndices = false;
for (let i = 0; i < (contract.canonicalFields ?? []).length; i++) {
  const f = contract.canonicalFields[i];
  if (cfByIndex[i] !== undefined) duplicateIndices = true;
  cfByIndex[i] = f;
  if (cfByPath[f.path] !== undefined) duplicateIndices = true;
  cfByPath[f.path] = f;
}
if (duplicateIndices) {
  console.error('❌ Duplicate canonicalFields indices detected');
  process.exit(1);
}

// ── validate each change ───────────────────────────────────────────────────

const changes = approved.changes ?? [];
const labelEdits = [];   // { index, oldLabel, newLabel, path }
let abortReason = null;

for (const change of changes) {
  const idx = change.canonicalFieldIndex;
  const field = cfByIndex[idx];

  if (!field) {
    abortReason = `canonicalFields[${idx}] does not exist`;
    break;
  }

  if (field.path !== change.path) {
    abortReason = `canonicalFields[${idx}].path mismatch. Contract="${field.path}", Approved="${change.path}"`;
    break;
  }

  if (field.label !== change.oldValue) {
    abortReason = `canonicalFields[${idx}].label mismatch. Contract="${field.label}", Approved oldValue="${change.oldValue}"`;
    break;
  }

  // Target must be canonicalFields label
  if (!change.target?.startsWith('canonicalFields[') || !change.target?.endsWith('.label')) {
    abortReason = `Invalid target "${change.target}" — only canonicalFields[].label is allowed`;
    break;
  }

  labelEdits.push({ index: idx, oldLabel: field.label, newLabel: change.newValue, path: change.path });
}

if (abortReason) {
  console.error(`❌ Guard failed: ${abortReason}`);
  process.exit(1);
}

// ── simulate changes ───────────────────────────────────────────────────────

const patched = JSON.parse(JSON.stringify(contract));
let actualEdits = 0;
for (const edit of labelEdits) {
  if (patched.canonicalFields[edit.index].label === edit.oldLabel) {
    patched.canonicalFields[edit.index].label = edit.newLabel;
    actualEdits++;
  }
}

function collectJsonDiffs(before, after, path = '') {
  if (Object.is(before, after)) return [];

  if (Array.isArray(before) || Array.isArray(after)) {
    if (!Array.isArray(before) || !Array.isArray(after)) {
      return [{ path, before, after }];
    }
    if (before.length !== after.length) {
      return [{ path: path ? `${path}.length` : 'length', before: before.length, after: after.length }];
    }

    const diffs = [];
    for (let index = 0; index < before.length; index += 1) {
      diffs.push(...collectJsonDiffs(before[index], after[index], path ? `${path}[${index}]` : `[${index}]`));
    }
    return diffs;
  }

  if (
    before &&
    after &&
    typeof before === 'object' &&
    typeof after === 'object'
  ) {
    const diffs = [];
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    for (const key of keys) {
      diffs.push(...collectJsonDiffs(before[key], after[key], path ? `${path}.${key}` : key));
    }
    return diffs;
  }

  return [{ path, before, after }];
}

const changedJsonPaths = collectJsonDiffs(contract, patched).map((diff) => diff.path);
const allowedJsonPaths = new Set(labelEdits.map((edit) => `canonicalFields[${edit.index}].label`));
const disallowedJsonPaths = changedJsonPaths.filter((path) => !allowedJsonPaths.has(path));
if (disallowedJsonPaths.length > 0) {
  console.error('Deep diff guard failed: only approved canonicalFields[].label paths may change.');
  console.error(`Disallowed changed paths: ${disallowedJsonPaths.join(', ')}`);
  process.exit(1);
}
const deepDiffAllowedOnly = true;

// ── dry-run output ─────────────────────────────────────────────────────────

console.log('\n════ DRY-RUN SUMMARY ════');
console.log(`  BM:              ${bm}`);
console.log(`  sourceId:        ${contract.sourceId}`);
console.log(`  Contract:        ${contractFile}`);
console.log(`  Changes:         ${actualEdits} label edit(s)`);
console.log(`  Array:           canonicalFields only`);
console.log(`  ── Pre counts ─────────────────────`);
console.log(`  canonicalFields: ${preCounts.canonicalFields}`);
console.log(`  docxSlots:       ${preCounts.docxSlots}`);
console.log(`  renderBindings:  ${preCounts.renderBindings}`);
console.log(`  ── Changes ────────────────────────`);
for (const edit of labelEdits) {
  console.log(`  [${edit.index}] ${edit.path}`);
  console.log(`         "${edit.oldLabel}" → "${edit.newLabel}"`);
}
console.log(`  ── Deltas ────────────────────────`);
console.log(`  canonicalFields: ${preCounts.canonicalFields} → ${(patched.canonicalFields ?? []).length} (no change)`);
console.log(`  docxSlots:       ${preCounts.docxSlots} → ${(patched.docxSlots ?? []).length} (no change)`);
console.log(`  renderBindings:  ${preCounts.renderBindings} → ${(patched.renderBindings ?? []).length} (no change)`);
console.log(`  ── Safety ────────────────────────`);
console.log(`  docxSlots changed:   0`);
console.log(`  renderBindings:     0`);
console.log(`  paths changed:      0`);
console.log(`  fields added:       0`);
console.log(`  fields removed:     0`);
console.log(`  DOCX touched:       0`);
console.log(`  source touched:     0`);
console.log(`  compiled edited:    0`);
console.log(`  deep-diff allowed:  ${deepDiffAllowedOnly ? 'PASS' : 'FAIL'}`);
console.log(`  errors:             0`);

// ── write mode ─────────────────────────────────────────────────────────────

if (!isWrite) {
  console.log('\n✅ Dry-run passed. Run with --write to apply.');
  process.exit(0);
}

// ── write: backup ──────────────────────────────────────────────────────────

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = join(backupDir, timestamp);
const contractBackup = join(backupPath, contractFile);

console.log(`\n📦 Creating backup: ${contractBackup}`);
try {
  mkdirSync(backupPath, { recursive: true });
  cpSync(contractPath, contractBackup, { preserveTimestamps: true });
} catch (err) {
  console.error(`❌ Backup failed: ${err.message}`);
  process.exit(1);
}

// Compute original SHA256
const originalContent = readFileSync(contractPath, 'utf8');
const sha256 = createHash('sha256').update(originalContent).digest('hex');

// ── write: apply ───────────────────────────────────────────────────────────

console.log(`\n✏️  Writing contract: ${contractPath}`);
try {
  writeFileSync(contractPath, JSON.stringify(patched, null, 2), 'utf8');
} catch (err) {
  console.error(`❌ Write failed: ${err.message}`);
  console.error('   Restoring backup...');
  try { cpSync(contractBackup, contractPath, { preserveTimestamps: true }); } catch (_) {}
  process.exit(1);
}

// Verify post-count
const postContract = JSON.parse(readFileSync(contractPath, 'utf8'));
const postCounts = {
  canonicalFields: (postContract.canonicalFields ?? []).length,
  docxSlots: (postContract.docxSlots ?? []).length,
  renderBindings: (postContract.renderBindings ?? []).length,
};
for (const key of ['canonicalFields', 'docxSlots', 'renderBindings']) {
  if (postCounts[key] !== preCounts[key]) {
    console.error(`❌ Post-count mismatch for ${key}: expected=${preCounts[key]}, got=${postCounts[key]}`);
    console.error('   Restoring backup...');
    try { cpSync(contractBackup, contractPath, { preserveTimestamps: true }); } catch (_) {}
    process.exit(1);
  }
}

// Verify labels were written
let verifyEdits = 0;
for (const edit of labelEdits) {
  if (postContract.canonicalFields[edit.index].label === edit.newLabel) verifyEdits++;
}
if (verifyEdits !== labelEdits.length) {
  console.error(`❌ Verification failed: only ${verifyEdits}/${labelEdits.length} edits confirmed`);
  console.error('   Restoring backup...');
  try { cpSync(contractBackup, contractPath, { preserveTimestamps: true }); } catch (_) {}
  process.exit(1);
}

// ── write: manifest ────────────────────────────────────────────────────────

const manifest = {
  templateCode: approved.templateCode,
  sourceId: approved.sourceId,
  originalContractPath: contractPath,
  backupFilePath: contractBackup,
  backupSha256: sha256,
  timestamp,
  approvedCommand: approved.approvalCommand,
  expectedChangesCount: labelEdits.length,
  actualChangesCount: verifyEdits,
  deepDiffAllowedOnly,
  changedJsonPaths,
  changes: labelEdits.map(e => ({ index: e.index, path: e.path, oldLabel: e.oldLabel, newLabel: e.newLabel })),
};

writeFileSync(join(backupPath, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

// ── generate reports ───────────────────────────────────────────────────────

const reportDir = join(baseDir, 'docs', 'audit', 'per-form-render-accurate', bm, 'apply-reports');
mkdirSync(reportDir, { recursive: true });

const applyReport = {
  schemaVersion: '1.0',
  task: 'SAFE_LABEL_ONLY_APPLY',
  appliedAt: new Date().toISOString(),
  approvalCommand: approved.approvalCommand,
  templateCode: approved.templateCode,
  sourceId: approved.sourceId,
  patchType: approved.patchType,
  dryRun: { passed: true, edits: labelEdits.length },
  deepDiffAllowedOnly,
  changedJsonPaths,
  write: {
    backupPath: contractBackup,
    contractModified: contractFile,
    labelEditsApplied: verifyEdits,
  },
  preCounts,
  postCounts,
  safety: approved.safety,
  deferredCleanup: approved.deferredCleanup,
  changes: labelEdits.map(e => ({
    canonicalFieldIndex: e.index,
    path: e.path,
    oldLabel: e.oldLabel,
    newLabel: e.newLabel,
  })),
};

writeFileSync(join(reportDir, 'apply.latest.json'), JSON.stringify(applyReport, null, 2), 'utf8');

const applyMd = `# Apply Report — ${bm} SAFE_LABEL_ONLY

Applied: ${new Date().toISOString()}
Approval: \`${approved.approvalCommand}\`

## Write Result

| Field | Value |
|-------|-------|
| Contract | \`${contractFile}\` |
| Label edits applied | **${verifyEdits}** |
| Backup | \`${contractBackup}\` |
| SHA256 | \`${sha256}\` |

## Changes Applied

| # | Index | Path | Old Label | New Label |
|---|-------|------|-----------|-----------|
${labelEdits.map((e, i) => `| ${i + 1} | ${e.index} | \`${e.path}\` | \`${e.oldLabel}\` | **${e.newLabel}** |`).join('\n')}

## Counts

| Array | Pre | Post |
|-------|-----|------|
| canonicalFields | ${preCounts.canonicalFields} | ${postCounts.canonicalFields} |
| docxSlots | ${preCounts.docxSlots} | ${postCounts.docxSlots} |
| renderBindings | ${preCounts.renderBindings} | ${postCounts.renderBindings} |

## Safety

docxSlots: ❌ NOT modified · renderBindings: ❌ NOT modified · paths: ❌ NOT modified

Deep diff guard: **PASS**

Changed JSON paths:
${changedJsonPaths.map((path) => `- \`${path}\``).join('\n')}
`;

writeFileSync(join(reportDir, 'apply.latest.md'), applyMd, 'utf8');

// closure report
const closureDir = join(baseDir, 'docs', 'audit', 'per-form-render-accurate', bm, 'closure');
mkdirSync(closureDir, { recursive: true });

const closureReport = {
  schemaVersion: '1.0',
  task: 'SAFE_LABEL_ONLY_CLOSURE',
  closedAt: new Date().toISOString(),
  templateCode: approved.templateCode,
  sourceId: approved.sourceId,
  status: 'APPLIED',
  patchType: approved.patchType,
  labelsChanged: verifyEdits,
  expectedBadLabelDelta: approved.expectedAuditDeltas?.BAD_LABEL ?? -(labelEdits.length),
  expectedUiVisibleDelta: approved.expectedAuditDeltas?.UI_VISIBLE_BAD_METADATA ?? -(labelEdits.length),
  renderOutputChanged: false,
  deepDiffAllowedOnly,
  changedJsonPaths,
  docxSlotsChanged: 0,
  renderBindingsChanged: 0,
  pathsChanged: 0,
  fieldsAdded: 0,
  fieldsRemoved: 0,
  docxTouched: 0,
  sourceTouched: 0,
  compiledArtifactsEdited: 0,
  backupPath: contractBackup,
};

writeFileSync(join(closureDir, 'closure.latest.json'), JSON.stringify(closureReport, null, 2), 'utf8');

const closureMd = `# Closure Report — ${bm} SAFE_LABEL_ONLY

Closed: ${new Date().toISOString()}
Status: **APPLIED**

## Summary

| Metric | Value |
|--------|-------|
| Labels changed | ${verifyEdits} |
| Expected BAD_LABEL delta | **${closureReport.expectedBadLabelDelta}** |
| Expected UI_VISIBLE delta | **${closureReport.expectedUiVisibleDelta}** |
| Render output changed | ❌ No |
| docxSlots changed | 0 |
| renderBindings changed | 0 |
| paths changed | 0 |
| Backup | \`${contractBackup}\` |

## Changes

${labelEdits.map((e, i) => `| ${i + 1} | \`${e.path}\` | \`${e.oldLabel}\` → **${e.newLabel}** |`).join('\n')}

## Next

Await audit validation before declaring closure confirmed.
`;

writeFileSync(join(closureDir, 'closure.latest.md'), closureMd, 'utf8');

console.log(`\n✅ Write complete. Reports generated.`);
console.log(`   Backup:   ${contractBackup}`);
console.log(`   Reports:  ${reportDir}`);
console.log(`            ${closureDir}`);
console.log(`\n   ⚠️  Run validation: node scripts/audit/audit-forms-root-cause.mjs --template-code ${bm}`);
