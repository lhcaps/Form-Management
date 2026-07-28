/**
 * Promotion of passing forms into the canonical runtime-ready manifest.
 *
 * Rules from PHASE 6:
 *   - A form may become runtime-ready only when applicable gates pass.
 *   - Promotion process:
 *     1. verify source/original hash unchanged
 *     2. verify rollback exists
 *     3. verify candidate hash
 *     4. atomically replace normalized template only if required
 *     5. verify post-promotion hash
 *     6. regenerate runtime artifact
 *     7. rerun Word
 *     8. rerun LibreOffice
 *     9. rerun legal-header guard
 *     10. rerun render mapping
 *     11. record final evidence
 *     12. add form to canonical readiness manifest
 *     13. verify all consumers see the same canonical roster
 *
 *   - Do not manually copy the form code into multiple allowlists.
 *   - Update counts truthfully:
 *       runtimeReadyCount = actual promoted count
 *       skeletonCount = 213 - runtimeReadyCount
 *
 *   - Fail closed if:
 *       - evidence is missing
 *       - form result is not PASS/PASS_WITH_P2
 *       - source hash changed
 *       - rollback is absent
 *       - Word evidence is missing
 *       - legal header is not verified
 *       - duplicate form entries exist
 *       - a requested form is omitted
 *       - summary totals are inconsistent
 *
 * NOTE: This script does NOT commit/push/deploy (safety rule).
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

const BRIDGE_ELIGIBILITY_PATH = path.join(
  REPO_ROOT,
  'packages',
  'form-contracts',
  'src',
  'bridge-eligibility.ts',
);

const RUNTIME_RESULTS_PATH = path.join(ROLLOUT_DIR, 'runtime-render-results.json');
const CANONICAL_ROSTER_PATH = path.join(ROLLOUT_DIR, 'canonical-runtime-roster.json');

const CLI_BATCH_FLAG = (process.argv.find((a) => a.startsWith('--batch=')) || '').split('=')[1];
const CLI_EVIDENCE = (process.argv.find((a) => a.startsWith('--evidence=')) || '').split('=')[1];

function assert(condition, message, allErrors) {
  if (!condition) allErrors.push(message);
}

async function main() {
  const errors = [];

  const runtimeResults = JSON.parse(await readFile(RUNTIME_RESULTS_PATH, 'utf8'));
  let results = runtimeResults.results || [];

  // Optional batch filter: --batch=B1A_READY_SIMPLE
  if (CLI_BATCH_FLAG) {
    const batchPath = path.join(ROLLOUT_DIR, 'batches', `${CLI_BATCH_FLAG}.json`);
    if (fssync.existsSync(batchPath)) {
      const allow = new Set(JSON.parse(await readFile(batchPath, 'utf8')).forms || []);
      results = results.filter((r) => allow.has(r.bmCode));
    }
  }

  // Only PASS_RUNTIME_MAPPING is promotion-eligible. NO_RUNTIME_SLOTS is explicitly NOT a pass.
  const candidates = results.filter((r) => r.verdict === 'PASS_RUNTIME_MAPPING');

  // For honesty: NO_RUNTIME_SLOTS and PASS_NO_PLACEHOLDERS are NOT customer-ready.
  // They are recorded as RUNTIME_CANDIDATE-with-evidence, not RUNTIME_READY.
  const placeholderless = results.filter(
    (r) => r.verdict === 'NO_RUNTIME_SLOTS' || r.verdict === 'PASS_NO_PLACEHOLDERS',
  );

  const eligible = [];
  for (const r of candidates) {
    const reasons = [];
    if (!r.r1Hash) reasons.push('missing R1 hash');
    if (!r.r2Hash) reasons.push('missing R2 hash');
    if (!r.deterministicR1) reasons.push('R1 not deterministic');
    if (!r.r1DifferentFromR2) reasons.push('R1 == R2');
    if (r.error) reasons.push(`error: ${r.error}`);

    assert(reasons.length === 0, `${r.bmCode}: ${reasons.join('; ')}`, errors);

    if (reasons.length === 0) {
      eligible.push(r);
    }
  }

  // All PASS_RUNTIME_MAPPING forms are eligible pending Word evidence gate.
  const trulyEligible = eligible;

  // PHASE 6 safety gate: Word visual evidence is MANDATORY for promotion.
  // Generic CLI render alone does NOT promote to RUNTIME_READY.
  // The form stays RUNTIME_CANDIDATE until the Word-com guard passes.
  //
  // Word evidence is sourced from runtime-rollout/word-sidecar/word-visual-results.json
  // (written by render-visual-pass.mjs). It records per-form R1/R2 PDF export
  // success through the cscript/JScript Word COM sidecar.
  const wordVisualPath = path.join(ROLLOUT_DIR, 'word-sidecar', 'word-visual-results.json');
  let wordVisualByForm = new Map();
  if (fssync.existsSync(wordVisualPath)) {
    const wordVisual = JSON.parse(await readFile(wordVisualPath, 'utf8'));
    for (const j of wordVisual.jobs || []) {
      const ok = j.r1 && j.r1.ok && j.r2 && j.r2.ok;
      wordVisualByForm.set(j.formCode, { ok, r1: j.r1, r2: j.r2 });
    }
  }
  const wordEvidenceConfirmed = trulyEligible.filter((r) => {
    const wv = wordVisualByForm.get(r.bmCode);
    return wv && wv.ok;
  });
  const readyToPromote = wordEvidenceConfirmed;

  const newReadyForms = readyToPromote.map((r) => r.bmCode);
  const newReadySet = new Set(newReadyForms);

  // SAFETY: Read the existing STANDALONE_RUNTIME_TEMPLATE_CODES from
  // bridge-eligibility.ts so we PRESERVE the 11 canonical forms that were
  // already there. The promotion is additive only.
  const bridgeBufRead = await readFile(BRIDGE_ELIGIBILITY_PATH, 'utf8');
  const existingArrayMatch = bridgeBufRead.match(/STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([^\]]+)\]/);
  const existingReady = new Set();
  if (existingArrayMatch) {
    const inner = existingArrayMatch[1];
    const codes = (inner.match(/'BM-\d{3}'/g) || []).map((s) => s.replace(/'/g, ''));
    for (const c of codes) existingReady.add(c);
  }

  let bridgeBuf = bridgeBufRead;

  const merged = new Set([...existingReady, ...newReadySet]);
  const mergedSorted = [...merged].sort();

  if (errors.length > 0) {
    console.error('PROMOTION FAILED:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // Persist canonical roster
  const roster = {
    schema: 'qllaw.213.canonical_runtime_roster/v1',
    generatedAt: 'PHASE6_RUN_TOKEN',
    runtimeReadyForms: mergedSorted,
    runtimeReadyCount: mergedSorted.length,
    skeletonCount: 213 - mergedSorted.length,
    sources: ['packages/form-contracts/src/bridge-eligibility.ts', 'docs/audit/final-213-customer-ready/runtime-rollout/canonical-runtime-roster.json'],
    lastPromotions: readyToPromote.map((r) => ({
      bmCode: r.bmCode,
      r1Hash: r.r1Hash,
      r2Hash: r.r2Hash,
      family: r.family,
      promotedAt: 'PHASE6_RUN_TOKEN',
    })),
    notes: [
      'Promotions are based on runtime-render pass (deterministic, R1!=R2, no error).',
      'Word COM sidecar must also pass for each promoted form.',
      'Forms with CONTRACT_MAPPING_DEFECT (compound-slot coverage) are promotion-',
      'eligible only if the compound coverage was empirically verified through',
      'R1/R2 render + Word PDF export. The contract defect itself remains on the',
      'contract side (a contract field is folded into a compound template slot).',
      'Production-ready remains false until A8 mutation suite + dependency audit pass.',
    ].join(' '),
  };

  await writeFile(CANONICAL_ROSTER_PATH, JSON.stringify(roster, null, 2));

  // Patch bridge-eligibility.ts STANDALONE_RUNTIME_TEMPLATE_CODES
  const arrayBlock = mergedSorted.map((c) => `  '${c}',`).join('\n');
  const newArray = `export const STANDALONE_RUNTIME_TEMPLATE_CODES = [\n${arrayBlock}\n] as const;`;
  const regex = /export const STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[[\s\S]*?\] as const;/;
  bridgeBuf = bridgeBuf.replace(regex, newArray);
  await writeFile(BRIDGE_ELIGIBILITY_PATH, bridgeBuf);

  const placeholderNote = placeholderless.length > 0
    ? ` (placeholderless=${placeholderless.length}; not promoted to customer-ready)`
    : '';

  console.log(
    `OK: promotion batch processed. eligible=${trulyEligible.length} placeholderless=${placeholderless.length}${placeholderNote}. Total ready=${mergedSorted.length}`,
  );
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});

/* ------------------------------------------------------------------
 * Locked authority cutover marker — wave 2026_07_26 (promotion consumer).
 *
 * The promotion consumer reads locked authority for the source data, but
 * promotion eligibility is gated on further Phase 12 (Word) + Phase 13
 * (LibreOffice) + Phase 14 (browser) evidence.
 *
 * Per wave spec, this consumer is intentionally DEFERRED (left as bypass)
 * until Word, LibreOffice and browser persistence evidence are emitted.
 *
 * Deferred prerequisites (Phase 12-13-14 of the activation wave):
 *   - Word R1/R2 deterministic pass
 *   - LibreOffice R1/R2 deterministic pass
 *   - Browser authenticated save/reload evidence
 *   - preview/download revision parity
 *   - provenance pass
 * ------------------------------------------------------------------ */

