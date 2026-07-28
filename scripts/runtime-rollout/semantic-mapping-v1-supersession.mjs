import { readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout');
export const V1_SUPERSESSION = Object.freeze({
  status: 'SUPERSEDED_UNTRUSTED_V1',
  reason: 'Incomplete contract/source metadata and unsafe nearest-placeholder proposals',
  executable: false,
  reviewable: false,
  supersededBy: 'qllaw.213.legal_semantic_mapping/v2',
});

export function assertV1IsNonExecutable(value) {
  if (value?.status !== V1_SUPERSESSION.status || value?.executable !== false || value?.reviewable !== false || value?.supersededBy !== V1_SUPERSESSION.supersededBy) {
    throw new Error('SUPERSEDED_UNTRUSTED_V1 metadata is required; v1 may not be executed or reviewed');
  }
}

async function markJson(relative) {
  const target = path.join(OUT, relative);
  const json = JSON.parse(await readFile(target, 'utf8'));
  const marked = Array.isArray(json) ? { ...V1_SUPERSESSION, historicalRows: json } : { ...json, ...V1_SUPERSESSION };
  await writeFile(target, `${JSON.stringify(marked, null, 2)}\n`);
}

async function main() {
  await markJson('legal-semantic-mapping-all.json');
  await markJson('legal-semantic-mapping-summary.json');
  await markJson('mapping-review-priority.json');
  await markJson('reviews/batch-01/review.json');
  await writeFile(path.join(OUT, 'legal-semantic-mapping-review.csv.meta.json'), `${JSON.stringify(V1_SUPERSESSION, null, 2)}\n`);
  await writeFile(path.join(OUT, 'reviews/batch-01/SUPERSEDED.json'), `${JSON.stringify(V1_SUPERSESSION, null, 2)}\n`);
  console.log('OK: semantic mapping v1 marked SUPERSEDED_UNTRUSTED_V1 and blocked from execution.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
