import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout');
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
async function main() {
  const mapping = await readJson(path.join(OUT, 'legal-semantic-mapping-v2-all.json'));
  const targets = await readJson(path.join(OUT, 'docx-structural-targets-213.json'));
  const rows = mapping.mappings || [];
  const reviewDir = path.join(OUT, 'reviews-v2/batch-01'); await mkdir(reviewDir, { recursive: true });
  const review = { schema: 'qllaw.213.recipe_review/v2', reviewable: false, status: 'BLOCKED_BY_EVIDENCE_PIPELINE_GAPS', reason: 'No proposed recipe has complete contract metadata and authoritative source evidence; no human decision is requested.', items: [] };
  await Promise.all([
    writeFile(path.join(reviewDir, 'review.json'), `${JSON.stringify(review, null, 2)}\n`),
    writeFile(path.join(reviewDir, 'recipe-previews.json'), `${JSON.stringify({ status: review.status, previews: [] }, null, 2)}\n`),
    writeFile(path.join(reviewDir, 'exact-decisions-required.json'), `${JSON.stringify({ status: review.status, decisionsRequired: [] }, null, 2)}\n`),
    writeFile(path.join(reviewDir, 'source-evidence.json'), `${JSON.stringify({ status: review.status, targetsAvailable: targets.targets?.length || 0, evidenceForReviewItems: [] }, null, 2)}\n`),
    writeFile(path.join(reviewDir, 'review.md'), '# Mapping v2 — Batch 01\n\nNo legal review is requested. The batch is blocked because no proposed recipe has both complete declaring contract metadata and authoritative source provenance.\n'),
  ]);
  for (const code of ['BM-019', 'BM-020', 'BM-050']) {
    const formRows = rows.filter((r) => r.FORM_CODE === code);
    const formTargets = (targets.targets || []).filter((t) => t.FORM_CODE === code);
    const forensic = { PREVIOUS_PASS_CLAIM: 'UNTRUSTED_V1_OR_HISTORICAL_CLAIM_NOT_ACCEPTED', CONTRACT_FIELDS: formRows.map((r) => ({ key: r.CONTRACT_KEY, metadataStatus: r.CONTRACT_METADATA_STATUS })), ACTUAL_SOURCE_TARGETS: formTargets, MISSING_METADATA: formRows.filter((r) => r.CONTRACT_METADATA_STATUS !== 'COMPLETE').map((r) => r.CONTRACT_KEY), INVALID_PREVIOUS_MAPPING: 'V1 frozen; no mapping is imported.', AVAILABLE_RECIPE_OPTIONS: [], ROLE_OR_TYPE_CONFLICT: 'Not assessed until declaring metadata and authoritative source are complete.', R1_EXPECTATION: 'NOT_EXECUTABLE', R2_EXPECTATION: 'NOT_EXECUTABLE', REQUIRED_REMEDIATION: ['resolve declaring contract metadata', 'resolve authoritative source provenance', 'create source-grounded recipe', 'prove R1/R2, Word and LibreOffice'], CURRENT_VERDICT: 'FAIL_CLOSED_EVIDENCE_PIPELINE_GAP' };
    const dir = path.join(OUT, 'forms', code); await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'semantic-forensic.json'), `${JSON.stringify(forensic, null, 2)}\n`);
  }
  console.log('OK: v2 review blocked honestly and BM-019/BM-020/BM-050 forensic reports written.');
}
main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
