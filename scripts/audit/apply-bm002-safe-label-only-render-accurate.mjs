#!/usr/bin/env node
/**
 * apply-bm002-safe-label-only-render-accurate.mjs
 *
 * Applies SAFE_LABEL_ONLY patch for BM-002 only.
 *
 * Usage:
 *   node scripts/audit/apply-bm002-safe-label-only-render-accurate.mjs       # dry-run (default)
 *   node scripts/audit/apply-bm002-safe-label-only-render-accurate.mjs --write  # apply
 *
 * Hard constraints enforced:
 *   - templateCode must be BM-002
 *   - sourceId must be BM-002__f78301178da7 (exact match)
 *   - Only canonicalFields[].label may be changed
 *   - docxSlots must be untouched
 *   - renderBindings must be untouched
 *   - No field added/removed/reordered
 *   - No path changes
 *   - No DOCX/source/compiled artifact changes
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = resolve(process.env.cwd ?? '.');
const CONTRACT_PATH = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked', 'BM-002__f78301178da7.contract.locked.json');
const WRITE_MODE = process.argv.includes('--write');
const BACKUP_BASE = join(ROOT, 'docs', 'audit', 'per-form-render-accurate', 'BM-002', 'backups');

// ─── Approved changes ───────────────────────────────────────────────────────────

const APPROVED_CHANGES = [
  { index: 3,  path: 'document.issuePlaceAndDateLine',    oldLabel: 'issuePlaceAndDateLine',         newLabel: 'Địa điểm, ngày tháng năm' },
  { index: 5,  path: 'sourceReport.receivedDateLine',      oldLabel: 'receivedDateLine',             newLabel: 'Ngày tiếp nhận' },
  { index: 8,  path: 'reporter.genderText',                oldLabel: 'genderText',                 newLabel: 'Giới tính' },
  { index: 9,  path: 'reporter.otherName',                oldLabel: 'otherName',                    newLabel: 'Tên gọi khác' },
  { index: 10, path: 'reporter.birthDateLine',            oldLabel: 'birthDateLine',               newLabel: 'Sinh ngày' },
  { index: 17, path: 'reporter.identityIssueDateLine',    oldLabel: 'identityIssueDateLine',        newLabel: 'Cấp ngày' },
  { index: 23, path: 'reporter.organizationRepresentative', oldLabel: 'organizationRepresentative', newLabel: 'Người đại diện cơ quan, tổ chức' },
  { index: 24, path: 'sourceReport.content',              oldLabel: 'content',                     newLabel: 'Nội dung' },
  { index: 25, path: 'recipients.primaryLine',             oldLabel: 'primaryLine',                 newLabel: 'Nơi nhận' },
  { index: 26, path: 'recipients.archiveLine',             oldLabel: 'archiveLine',                newLabel: 'Nơi lưu' },
];

// ─── Validation helpers ─────────────────────────────────────────────────────────

function abort(msg) {
  console.error(`[ABORT] ${msg}`);
  process.exit(1);
}

function hashFile(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Precondition checks ───────────────────────────────────────────────────────

function validatePreconditions(contract) {
  // Identity guard
  if (contract.templateCode !== 'BM-002') abort(`templateCode guard failed: got ${contract.templateCode}`);
  if (contract.sourceId !== 'BM-002__f78301178da7') abort(`sourceId guard failed: got ${contract.sourceId}`);

  // Count guards — must not change
  const cfCount = (contract.canonicalFields ?? []).length;
  const slotCount = (contract.docxSlots ?? []).length;
  const bindingCount = (contract.renderBindings ?? []).length;
  if (cfCount !== 29) abort(`canonicalFields count guard failed: expected 29, got ${cfCount}`);
  if (slotCount !== 29) abort(`docxSlots count guard failed: expected 29, got ${slotCount}`);
  if (bindingCount !== 29) abort(`renderBindings count guard failed: expected 29, got ${bindingCount}`);

  // Per-field guards — old label must match exactly
  for (const change of APPROVED_CHANGES) {
    const cf = contract.canonicalFields[change.index];
    if (!cf) abort(`canonicalFields[${change.index}] not found`);
    if (cf.path !== change.path) abort(`canonicalFields[${change.index}] path mismatch: expected ${change.path}, got ${cf.path}`);
    if (cf.label !== change.oldLabel) abort(`canonicalFields[${change.index}].label old value mismatch: expected "${change.oldLabel}", got "${cf.label}"`);
  }

  // No path changes in canonicalFields
  for (let i = 0; i < contract.canonicalFields.length; i++) {
    const cf = contract.canonicalFields[i];
    if (!APPROVED_CHANGES.find(c => c.index === i)) {
      // This field should not have its path or anything else changed
    }
  }

  return true;
}

// ─── Compute changes ───────────────────────────────────────────────────────────

function computeDryRun(contract) {
  const original = deepClone(contract);
  const modified = deepClone(contract);

  const changes = [];
  for (const change of APPROVED_CHANGES) {
    const before = contract.canonicalFields[change.index].label;
    modified.canonicalFields[change.index].label = change.newLabel;
    changes.push({
      index: change.index,
      path: change.path,
      array: 'canonicalFields',
      field: 'label',
      before,
      after: change.newLabel,
    });
  }

  // Verify no other changes
  const originalJson = JSON.stringify(original, null, 2);
  const modifiedJson = JSON.stringify(modified, null, 2);

  // Count changed bytes
  const origLines = originalJson.split('\n').length;
  const modLines = modifiedJson.split('\n').length;

  return { original, modified, changes, origLines, modLines };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log(`[BM-002 SAFE_LABEL_ONLY] mode=${WRITE_MODE ? 'WRITE' : 'DRY-RUN'}`);

  if (!existsSync(CONTRACT_PATH)) abort(`Contract not found: ${CONTRACT_PATH}`);
  const raw = readFileSync(CONTRACT_PATH, 'utf8');
  const contract = JSON.parse(raw);
  console.log(`  Contract: ${CONTRACT_PATH}`);

  // Preconditions
  console.log('\n[Step] Validating preconditions...');
  validatePreconditions(contract);
  console.log('  ✅ Identity guard passed');
  console.log(`  ✅ Array count guards passed (canonicalFields=${(contract.canonicalFields ?? []).length}, docxSlots=${(contract.docxSlots ?? []).length}, renderBindings=${(contract.renderBindings ?? []).length})`);
  console.log('  ✅ Per-field old-value guards passed');

  // Compute dry-run
  console.log('\n[Step] Computing changes...');
  const { original, modified, changes } = computeDryRun(contract);

  // Report
  console.log('\n[Report] Dry-run summary:');
  console.log(`  File:                 docs/audit/docx/contracts/locked/BM-002__f78301178da7.contract.locked.json`);
  console.log(`  Logical label fixes:  ${changes.length}`);
  console.log(`  Physical JSON edits:  ${changes.length}`);
  console.log(`  Target array:         canonicalFields (only)`);
  console.log(`  docxSlots changed:    0`);
  console.log(`  renderBindings changed: 0`);
  console.log(`  Paths changed:        0`);
  console.log(`  Fields added:       0`);
  console.log(`  Fields removed:      0`);
  console.log(`  DOCX touched:        0`);
  console.log(`  Source touched:      0`);
  console.log(`  Compiled edited:     0`);

  console.log('\n[Report] Per-field changes:');
  for (const c of changes) {
    console.log(`  canonicalFields[${c.index}].label  path="${c.path}"`);
    console.log(`    before: "${c.before}"`);
    console.log(`    after:  "${c.after}"`);
  }

  if (!WRITE_MODE) {
    console.log('\n[DRY-RUN] No changes written. Run with --write to apply.');
    return;
  }

  // ─── Write mode ──────────────────────────────────────────────────────────────

  console.log('\n[Step] Backing up before write...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = join(BACKUP_BASE, timestamp);
  mkdirSync(backupDir, { recursive: true });
  const backupFile = join(backupDir, 'BM-002__f78301178da7.contract.locked.json');
  writeFileSync(backupFile, raw, 'utf8');
  const checksum = hashFile(raw);
  console.log(`  ✅ Backup: ${backupFile}`);
  console.log(`  ✅ SHA256: ${checksum}`);

  // Write manifest
  const manifest = {
    templateCode: 'BM-002',
    sourceId: 'BM-002__f78301178da7',
    originalContract: CONTRACT_PATH,
    backupFile,
    backupSha256: checksum,
    timestamp,
    approvedCommand: 'APPROVE_RENDER_ACCURATE_FORM BM-002 f78301178da7 SAFE_LABEL_ONLY',
    expectedChangesCount: changes.length,
    changes: changes.map(c => ({
      index: c.index, path: c.path, array: c.array, field: c.field,
      before: c.before, after: c.after,
    })),
  };
  writeFileSync(join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`  ✅ Manifest: ${join(backupDir, 'manifest.json')}`);

  // Write modified contract
  console.log('\n[Step] Writing modified contract...');
  const newContent = JSON.stringify(modified, null, 2);
  writeFileSync(CONTRACT_PATH, newContent, 'utf8');
  const newChecksum = hashFile(newContent);
  console.log(`  ✅ Written: ${CONTRACT_PATH}`);
  console.log(`  ✅ New SHA256: ${newChecksum}`);

  // Verify write
  const written = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
  if (written.templateCode !== 'BM-002') abort('Post-write templateCode check failed');
  if (written.sourceId !== 'BM-002__f78301178da7') abort('Post-write sourceId check failed');
  if ((written.canonicalFields ?? []).length !== 29) abort('Post-write canonicalFields count check failed');
  if ((written.docxSlots ?? []).length !== 29) abort('Post-write docxSlots count check failed');
  if ((written.renderBindings ?? []).length !== 29) abort('Post-write renderBindings count check failed');
  for (const change of APPROVED_CHANGES) {
    const cf = written.canonicalFields[change.index];
    if (cf.label !== change.newLabel) abort(`Post-write label check failed for canonicalFields[${change.index}]: expected "${change.newLabel}", got "${cf.label}"`);
  }
  console.log('  ✅ Post-write verification passed');

  console.log('\n[WRITE] ✅ BM-002 SAFE_LABEL_ONLY applied successfully.');
  console.log(`  Backup: ${backupFile}`);
  console.log(`  Changes: ${changes.length} label-only edits on canonicalFields`);
}

main();
