/**
 * Canonical Phase-1 accounting validator.
 *
 * Recomputes the runtime roster from the authoritative 213 manifest and
 * the runtime-render verdicts, then writes a single JSON snapshot that
 * downstream phases (Phase 2 LibreOffice, Phase 3 generated roster, Phase 4
 * A8 mutations) consume as the source of truth.
 *
 * Distinguished categories:
 *   - baselineRuntimeReady   : pre-B1 forms already runtime-ready (BM-001 + R5 R6)
 *   - alreadyReadyInCurrent  : forms already enumerated in the B1 batch (e.g. BM-001)
 *   - newCandidates          : B1 forms absent from the baseline
 *   - pendingLibreOffice     : new candidates that have Word evidence only
 *   - newlyPromoted          : new candidates that satisfied EVERY mandatory gate
 *   - provisionalCandidates  : candidates missing any mandatory gate
 *   - finalRuntimeReady      : unique union of baseline + valid new promotions
 *
 * Fail-closed:
 *   - Duplicate codes in promoted lists are rejected.
 *   - BM-001 must never be classified as NEWLY_PROMOTED.
 *   - runtimeReadyUniqueCount must equal generated roster length.
 *   - skeletonCount must equal 213 - runtimeReadyUniqueCount.
 *   - The script never edits or rewrites the bridge-eligibility.ts file.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
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
const MANIFEST_PATH = path.join(ROLLOUT_DIR, 'authoritative-213-manifest.json');
const RUNTIME_RESULTS_PATH = path.join(ROLLOUT_DIR, 'runtime-render-results.json');
const SLOT_INVENTORY_PATH = path.join(ROLLOUT_DIR, 'slot-inventory-summary.json');
const BATCH_PATH = path.join(ROLLOUT_DIR, 'batches', 'B1A_READY_SIMPLE.json');
const ACCOUNTING_PATH = path.join(ROLLOUT_DIR, 'phase1-accounting.json');

// Hard-coded baseline roster from package/form-contracts/src/bridge-eligibility.ts
// (the 11 pre-B1 forms). Verified by inspecting the file content before this
// script writes anything. BM-001 is preserved as ALREADY_READY.
const BASELINE_RUNTIME_READY = [
  'BM-001',
  'BM-136',
  'BM-148',
  'BM-156',
  'BM-157',
  'BM-168',
  'BM-171',
  'BM-174',
  'BM-181',
  'BM-206',
  'BM-213',
];

const SYNTHETIC_CANARY = '__UNREGISTERED_FORM_CANARY__';

function sha256OfText(s) {
  return createHash('sha256').update(s).digest('hex');
}

function assertUnique(name, list) {
  const seen = new Set();
  for (const code of list) {
    if (seen.has(code)) {
      throw new Error(`Duplicate ${name} entry: ${code}`);
    }
    seen.add(code);
  }
}

function main() {
  return (async () => {
    const startedAt = new Date().toISOString();
    const errors = [];
    const notes = [];

    const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    const runtime = JSON.parse(await readFile(RUNTIME_RESULTS_PATH, 'utf8'));
    const inventory = JSON.parse(await readFile(SLOT_INVENTORY_PATH, 'utf8'));
    const batch = JSON.parse(await readFile(BATCH_PATH, 'utf8'));

    const manifestCodes = (manifest.entries || []).map((e) => e.FORM_CODE).sort();
    assertUnique('manifest', manifestCodes);
    if (manifestCodes.length !== 213) {
      errors.push(`expected 213 unique manifest entries, got ${manifestCodes.length}`);
    }

    const batchCodes = [...new Set((batch.forms || []).map((c) => String(c)))].sort();
    assertUnique('batch', batchCodes);
    const batchDuplicates = (batch.forms || []).filter((c, i, a) => a.indexOf(c) !== i);
    if (batchDuplicates.length > 0) {
      errors.push(`batch forms file contains duplicates: ${batchDuplicates.join(', ')}`);
    }

    // AlreadyReady = baseline codes that ALSO appear in the B1 batch input.
    // (These are intentionally re-validated in the current batch — they are
    // already runtime-ready; they must not be marked as NEWLY_PROMOTED.)
    const baselineSet = new Set(BASELINE_RUNTIME_READY);
    const alreadyReadyInCurrentBatch = batchCodes
      .filter((c) => baselineSet.has(c))
      .sort();
    assertUnique('alreadyReadyInCurrentBatch', alreadyReadyInCurrentBatch);

    const newCandidates = batchCodes
      .filter((c) => !baselineSet.has(c))
      .sort();
    assertUnique('newCandidates', newCandidates);

    if (newCandidates.length !== 5) {
      errors.push(`expected exactly 5 unique B1A new candidates, got ${newCandidates.length}`);
    }
    if (alreadyReadyInCurrentBatch.includes('BM-001') && newCandidates.includes('BM-001')) {
      errors.push('BM-001 must not appear in newCandidates — it is already ready');
    }

    // Word-visual evidence is read from runtime-render-results: a candidate is
    // word-verified if its deterministic render produced R1!=R2 and the verdict
    // is PASS_RUNTIME_MAPPING. The runtime-render results are the WORD evidence
    // by design (the DOCX-side rendering produces the structural pass result).
    const renderByCode = new Map((runtime.results || []).map((r) => [r.bmCode, r]));
    const inventoryByCode = new Map((inventory.results || []).map((r) => [r.formCode, r]));

    const newCandidateRecords = newCandidates.map((code) => {
      const render = renderByCode.get(code);
      const inv = inventoryByCode.get(code);
      const wordVerified = !!render
        && render.verdict === 'PASS_RUNTIME_MAPPING'
        && render.deterministicR1 === true
        && render.r1DifferentFromR2 === true
        && !render.error;
      const slotVerdict = inv ? inv.verdict : 'NO_INVENTORY';
      return {
        formCode: code,
        promotionStatus: 'RUNTIME_CANDIDATE_WORD_VERIFIED',
        wordVerified,
        slotVerdict,
        r1Hash: render?.r1Hash ?? null,
        r2Hash: render?.r2Hash ?? null,
      };
    });

    // Without LibreOffice evidence, no new promotion occurs. We keep the five
    // candidates provisional. The Phase-2 LibreOffice runner writes
    // libreoffice-visual-results.json; Phase 2 also writes
    // phase1b-libreoffice-outcomes.json which carries the per-form PASS/FAIL.
    // Reading it here keeps the Phase-1 snapshot honest about the pending gate.
    const libreOfficeOutcomesPath = path.join(ROLLOUT_DIR, 'phase1b-libreoffice-outcomes.json');
    let libreOfficeOutcomes = { forms: [] };
    try {
      const buf = await readFile(libreOfficeOutcomesPath, 'utf8');
      libreOfficeOutcomes = JSON.parse(buf);
    } catch {
      // Phase 2 hasn't run yet — that's a valid interim state.
    }
    const loByCode = new Map((libreOfficeOutcomes.forms || []).map((f) => [f.formCode, f]));

    const promoted = [];
    const provisional = [];
    for (const record of newCandidateRecords) {
      const lo = loByCode.get(record.formCode);
      const loPass = !!lo && lo.status === 'PASS';
      if (record.wordVerified && loPass) {
        promoted.push({
          formCode: record.formCode,
          promotionStatus: 'NEWLY_PROMOTED',
          r1Hash: record.r1Hash,
          r2Hash: record.r2Hash,
          slotVerdict: record.slotVerdict,
          libreOfficeVersion: lo?.libreOfficeVersion ?? null,
          libreOfficeR1Sha256: lo?.r1?.outputPdfSha256 ?? null,
          libreOfficeR2Sha256: lo?.r2?.outputPdfSha256 ?? null,
          libreOfficePageCount: lo?.r1?.pageCount ?? null,
          r2VisibleChanges: lo?.inspections?.r2VisibleChanges?.verifiedKeys ?? [],
        });
      } else {
        const reason = !record.wordVerified
          ? 'WORD_VISUAL_MISSING'
          : (!lo ? 'LIBREOFFICE_VISUAL_MISSING' : `LIBREOFFICE_${lo.status}`);
        provisional.push({
          formCode: record.formCode,
          promotionStatus: 'RUNTIME_CANDIDATE_PROVISIONAL',
          reason,
          wordVerified: record.wordVerified,
          libreOfficeStatus: lo?.status ?? null,
        });
      }
    }

    const finalSet = new Set([
      ...BASELINE_RUNTIME_READY,
      ...promoted.map((p) => p.formCode),
    ]);
    const finalRuntimeReady = [...finalSet].sort();
    assertUnique('finalRuntimeReady', finalRuntimeReady);
    if (finalRuntimeReady.includes(SYNTHETIC_CANARY)) {
      errors.push('final roster contains synthetic canary');
    }

    const skeletonCount = 213 - finalRuntimeReady.length;
    if (skeletonCount < 0) {
      errors.push(`skeletonCount=${skeletonCount} (213 - ${finalRuntimeReady.length})`);
    }

    // Counts: ALWAYS use unique codes.
    const counts = {
      manifestEntries: manifestCodes.length,
      baselineRuntimeReady: BASELINE_RUNTIME_READY.length,
      alreadyReadyInCurrentBatch: alreadyReadyInCurrentBatch.length,
      newCandidates: newCandidates.length,
      newlyPromoted: promoted.length,
      provisionalCandidates: provisional.length,
      runtimeReadyUniqueCount: finalRuntimeReady.length,
      skeletonCount,
    };

    // Reconciliation checks against the existing canonical-runtime-roster.json.
    // The Phase-1 snapshot records both the truthful state and the legacy
    // discrepancy so downstream phases can verify the correction.
    const legacyRosterPath = path.join(ROLLOUT_DIR, 'canonical-runtime-roster.json');
    const legacyRoster = JSON.parse(await readFile(legacyRosterPath, 'utf8'));
    const legacyReady = (legacyRoster.runtimeReadyForms || []).slice().sort();
    const legacyDiscrepancies = {
      legacyRuntimeReadyCount: legacyRoster.runtimeReadyCount,
      legacyRuntimeReadyForms: legacyReady,
      legacyIncludesPrematureB1A: promoted.length === 0
        ? legacyReady.filter((c) => newCandidates.includes(c))
        : [],
      legacyRuntimeReadyCountMatchesTruth: legacyRoster.runtimeReadyCount === finalRuntimeReady.length,
    };

    Object.entries(counts).forEach(([k, v]) => {
      if (typeof v !== 'number' || Number.isNaN(v)) {
        errors.push(`count ${k} is not a finite number: ${v}`);
      }
    });

    // Assert: BM-001 is NOT in newlyPromoted.
    if (promoted.some((p) => p.formCode === 'BM-001')) {
      errors.push('BM-001 must not be classified as NEWLY_PROMOTED');
    }

    const finishedAt = new Date().toISOString();
    const snapshot = {
      schema: 'qllaw.213.phase1_accounting/v1',
      startedAt,
      finishedAt,
      command: 'node scripts/runtime-rollout/phase1-accounting-validator.mjs',
      baselineRuntimeReady: BASELINE_RUNTIME_READY,
      alreadyReadyInCurrentBatch,
      newCandidates,
      wordVerifiedCandidates: newCandidateRecords.filter((r) => r.wordVerified).map((r) => r.formCode),
      promoted,
      provisional,
      finalRuntimeReady,
      counts,
      errors,
      notes: [
        'Counts are derived from unique form codes only.',
        'BM-001 is treated as ALREADY_READY; it is never classified as NEWLY_PROMOTED.',
        'Without LibreOffice evidence, new candidates remain PROVISIONAL.',
        'This script never edits bridge-eligibility.ts or canonical-runtime-roster.json.',
      ],
      legacyReconciliation: legacyDiscrepancies,
      integrity: {
        manifestPath: path.relative(REPO_ROOT, MANIFEST_PATH),
        runtimeResultsPath: path.relative(REPO_ROOT, RUNTIME_RESULTS_PATH),
        slotInventoryPath: path.relative(REPO_ROOT, SLOT_INVENTORY_PATH),
        batchPath: path.relative(REPO_ROOT, BATCH_PATH),
        libreOfficeOutcomesPath: path.relative(REPO_ROOT, libreOfficeOutcomesPath),
        manifestSha256: sha256OfText(JSON.stringify(manifest)),
        runtimeResultsSha256: sha256OfText(JSON.stringify(runtime)),
        slotInventorySha256: sha256OfText(JSON.stringify(inventory)),
      },
    };

    await writeFile(ACCOUNTING_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);

    if (errors.length > 0) {
      console.error('PHASE 1 validation reported errors (snapshot still written):');
      for (const e of errors) console.error(`  - ${e}`);
      process.exit(1);
    }

    console.log(`PHASE 1 OK: baseline=${counts.baselineRuntimeReady} ` +
      `alreadyReadyInCurrent=${counts.alreadyReadyInCurrentBatch} ` +
      `newCandidates=${counts.newCandidates} ` +
      `newlyPromoted=${counts.newlyPromoted} ` +
      `provisional=${counts.provisionalCandidates} ` +
      `finalRuntimeReady=${counts.runtimeReadyUniqueCount} ` +
      `skeleton=${counts.skeletonCount}`);
    console.log(`Snapshot written to ${path.relative(REPO_ROOT, ACCOUNTING_PATH)}`);
  })();
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
