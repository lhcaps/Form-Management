/**
 * B1 sub-batch split based on slot inventory verdicts.
 *
 *   B1A_READY_SIMPLE       - PASS_RUNTIME_MAPPING (or CONTRACT_MAPPING_DEFECT with
 *                            all contract fields covered by template compounds)
 *   B1B_NEEDS_FAMILY_ADAPTER - SOURCE_SLOT_DEBT (template lacks some contract fields
 *                            but template structure exists; family adapter may help)
 *   B1C_SOURCE_DEBT        - SLOT_INVENTORY_MISMATCH (matchedCount==0: template and
 *                            contract were authored against different sources)
 *   B1C_PLACEHOLDERLESS    - NO_RUNTIME_SLOTS / NORMALIZATION_NOT_RUN (no template)
 */

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

const SUMMARY = path.join(ROLLOUT_DIR, 'slot-inventory-summary.json');
const BATCHES_DIR = path.join(ROLLOUT_DIR, 'batches');

async function main() {
  if (!fssync.existsSync(SUMMARY)) {
    console.error(`Missing ${SUMMARY}. Run build-slot-inventory.mjs first.`);
    process.exit(1);
  }
  await fssync.promises.mkdir(BATCHES_DIR, { recursive: true });

  const summary = JSON.parse(await readFile(SUMMARY, 'utf8'));

  const B1A = [];
  const B1B = [];
  const B1C = [];
  for (const r of summary.results) {
    if (r.verdict === 'PASS_RUNTIME_MAPPING' || r.verdict === 'CONTRACT_MAPPING_DEFECT') {
      B1A.push(r.formCode);
    } else if (r.verdict === 'SOURCE_SLOT_DEBT') {
      B1B.push(r.formCode);
    } else if (
      r.verdict === 'SLOT_INVENTORY_MISMATCH' ||
      r.verdict === 'NO_RUNTIME_SLOTS' ||
      r.verdict === 'NORMALIZATION_NOT_RUN'
    ) {
      B1C.push(r.formCode);
    }
  }

  const batches = {
    schema: 'qllaw.213.b1_subbatch_split/v1',
    generatedAt: 'PHASE5_RUN_TOKEN',
    counts: {
      B1A_READY_SIMPLE: B1A.length,
      B1B_NEEDS_FAMILY_ADAPTER: B1B.length,
      B1C_SOURCE_DEBT: B1C.length,
    },
    B1A_READY_SIMPLE: B1A,
    B1B_NEEDS_FAMILY_ADAPTER: B1B,
    B1C_SOURCE_DEBT: B1C,
  };

  await writeFile(path.join(BATCHES_DIR, 'B1A_READY_SIMPLE.json'), JSON.stringify({ forms: B1A }, null, 2));
  await writeFile(path.join(BATCHES_DIR, 'B1B_NEEDS_FAMILY_ADAPTER.json'), JSON.stringify({ forms: B1B }, null, 2));
  await writeFile(path.join(BATCHES_DIR, 'B1C_SOURCE_DEBT.json'), JSON.stringify({ forms: B1C }, null, 2));
  await writeFile(path.join(ROLLOUT_DIR, 'b1-subbatch-split.json'), JSON.stringify(batches, null, 2));

  console.log(
    `OK: B1 split. B1A=${B1A.length} B1B=${B1B.length} B1C=${B1C.length}`,
  );
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});