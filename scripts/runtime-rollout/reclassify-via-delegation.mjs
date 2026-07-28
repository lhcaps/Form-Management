/**
 * Reclassify the 62 GenericTemplateFormInputsPanel forms using the
 * delegation-aware contract extractor. Writes an updated
 * `slot-inventory-summary.json` (and per-form files) where the 62 forms are
 * reclassified into PASS_RUNTIME_MAPPING / CONTRACT_MAPPING_DEFECT /
 * SOURCE_SLOT_DEBT — never back into CONTRACT_SOURCE_STUB_GAP. Preserves
 * the source-hash invariants.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import * as fssync from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);
const SLOT_INVENTORY_SUMMARY = path.join(ROLLOUT_DIR, 'slot-inventory-summary.json');
const DELEGATION_PATH = path.join(ROLLOUT_DIR, 'contract-delegation-62.json');
const SLOT_DIR = path.join(ROLLOUT_DIR, 'slot-inventory');

function sha256OfText(s) {
  return createHash('sha256').update(s).digest('hex');
}

async function main() {
  const inventory = JSON.parse(await readFile(SLOT_INVENTORY_SUMMARY, 'utf8'));
  const delegation = JSON.parse(await readFile(DELEGATION_PATH, 'utf8'));
  const delegationByCode = new Map((delegation.records || []).map((r) => [r.formCode, r]));

  const oldCounts = inventory.counts;
  const newCounts = {
    PASS_RUNTIME_MAPPING: 0,
    NO_RUNTIME_SLOTS: 0,
    NORMALIZATION_NOT_RUN: 0,
    SLOT_INVENTORY_MISMATCH: 0,
    SOURCE_SLOT_DEBT: 0,
    CONTRACT_MAPPING_DEFECT: 0,
    CONTRACT_SOURCE_STUB_GAP: 0,
  };

  let reclassified = 0;
  for (const row of inventory.results) {
    const dg = delegationByCode.get(row.formCode);
    if (!dg) {
      newCounts[row.verdict] = (newCounts[row.verdict] || 0) + 1;
      continue;
    }
    const newVerdict = dg.verdict;
    if (newVerdict !== row.verdict) {
      row.previousVerdict = row.verdict;
      row.verdict = newVerdict;
      row.reclassifiedAt = new Date().toISOString();
      row.reclassificationReason = `DELEGATION_AWARE_EXTRACTION:${dg.reason ?? 'OK'}`;
      reclassified += 1;
    }
    newCounts[newVerdict] = (newCounts[newVerdict] || 0) + 1;
  }

  inventory.counts = newCounts;
  inventory.delegationAwareExtraction = {
    schema: 'qllaw.213.delegation_aware_extraction/v1',
    finishedAt: new Date().toISOString(),
    sourceFile: path.relative(REPO_ROOT, DELEGATION_PATH),
    sourceSha256: sha256OfText(JSON.stringify(delegation)),
    reclassified,
    oldCounts,
    newCounts,
  };

  await writeFile(SLOT_INVENTORY_SUMMARY, `${JSON.stringify(inventory, null, 2)}\n`);
  for (const row of inventory.results) {
    const slotPath = path.join(SLOT_DIR, `${row.formCode}.json`);
    if (fssync.existsSync(slotPath)) {
      await writeFile(slotPath, `${JSON.stringify(row, null, 2)}\n`);
    }
  }

  console.log(`OK: reclassified ${reclassified} forms via delegation-aware extraction`);
  console.log(`  Old counts: ${JSON.stringify(oldCounts)}`);
  console.log(`  New counts: ${JSON.stringify(newCounts)}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
