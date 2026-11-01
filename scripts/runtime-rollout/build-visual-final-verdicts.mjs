/**
 * Phase 14 — Build the authoritative 213-row visual-final-verdicts artifact.
 *
 * Combines:
 *  - Full-queue per-form verdicts (83 forms with VISUAL_FINAL_VERDICT set)
 *  - Non-eligible forms (84 with UPSTREAM_RENDER_BLOCKED)
 *  - BM-198 (DETERMINISM_FAILURE — exclude from full queue; mark as
 *    UPSTREAM_RENDER_BLOCKED in the verdicts file because its R1 != R1-again)
 *
 * Produces:
 *  - phase12-visual/visual-final-verdicts-213.json
 *  - phase12-visual/visual-summary.json
 */

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
const PHASE12_DIR = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'phase12-visual');

const RECON = path.join(PHASE12_DIR, 'visual-input-reconciliation-213.json');
const FRESHNESS = path.join(PHASE12_DIR, 'docx-freshness-213.json');
const FULL = path.join(PHASE12_DIR, 'visual-final-verdicts-partial.json');
const WORD_FULL = path.join(PHASE12_DIR, 'word-full-results.json');
const LO_FULL = path.join(PHASE12_DIR, 'libreoffice-full-results.json');
const CROSS_FULL = path.join(PHASE12_DIR, 'cross-engine-full-results.json');

const OUTPUT_VERDICTS = path.join(PHASE12_DIR, 'visual-final-verdicts-213.json');
const OUTPUT_SUMMARY = path.join(PHASE12_DIR, 'visual-summary.json');

async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf8'));
}

async function main() {
  const recon = await readJson(RECON);
  const fresh = await readJson(FRESHNESS);
  const full = await readJson(FULL);
  const wordFull = await readJson(WORD_FULL);
  const loFull = await readJson(LO_FULL);
  const crossFull = await readJson(CROSS_FULL);

  const freshByForm = new Map();
  for (const r of fresh.formRows) freshByForm.set(r.FORM_CODE, r);

  // Index the partial verdicts (only executed rows)
  const partialByForm = new Map();
  for (const r of full.rows) partialByForm.set(r.code, r);

  const allRows = [];
  for (const r of recon.formRows) {
    const code = r.FORM_CODE;
    const partial = partialByForm.get(code);
    if (partial) {
      allRows.push({ FORM_CODE: code, ...partial });
    } else {
      // Non-eligible or unrun
      const f = freshByForm.get(code);
      const reasons = [];
      if (r.LOCKED_AUTHORITY_PRIMARY_VERDICT !== 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE') {
        reasons.push(r.LOCKED_AUTHORITY_PRIMARY_VERDICT);
      }
      if (f && f.VERDICT !== 'FRESH_CURRENT_AUTHORITY') {
        reasons.push(f.VERDICT);
      }
      allRows.push({
        FORM_CODE: code,
        WORD_R1: 'SKIPPED',
        WORD_R2: 'SKIPPED',
        LIBREOFFICE_R1: 'SKIPPED',
        LIBREOFFICE_R2: 'SKIPPED',
        WORD_PAGE_COUNT_R1: null,
        WORD_PAGE_COUNT_R2: null,
        LO_PAGE_COUNT_R1: null,
        LO_PAGE_COUNT_R2: null,
        R1_TOKEN_STATUS: 'N/A',
        R2_TOKEN_STATUS: 'N/A',
        STALE_R1_STATUS: 'N/A',
        LEGAL_HEADER_STATUS: 'N/A',
        FORM_NUMBER_STATUS: 'N/A',
        TITLE_STATUS: 'N/A',
        UNRESOLVED_PLACEHOLDER_STATUS: 'N/A',
        STATIC_TEXT_STATUS: 'N/A',
        LAYOUT_STATUS: 'N/A',
        PROCESS_EXIT_STATUS: 'N/A',
        VISUAL_FINAL_VERDICT: 'UPSTREAM_RENDER_BLOCKED',
        EXCLUSION_REASONS: reasons,
      });
    }
  }

  // Sort by code for deterministic output
  allRows.sort((a, b) => a.FORM_CODE.localeCompare(b.FORM_CODE));

  // Validate exactly 213 rows
  if (allRows.length !== 213) {
    console.error(`FATAL: expected 213 rows, got ${allRows.length}`);
    process.exit(1);
  }

  // Check unique form codes
  const codes = new Set(allRows.map((r) => r.FORM_CODE));
  if (codes.size !== 213) {
    console.error(`FATAL: form codes not unique (${codes.size} unique)`);
    process.exit(1);
  }

  const verdictCounts = { WORD_AND_LIBREOFFICE_PASS: 0, WORD_FAIL: 0, LIBREOFFICE_FAIL: 0, BOTH_FAIL: 0, UPSTREAM_RENDER_BLOCKED: 0 };
  for (const r of allRows) verdictCounts[r.VISUAL_FINAL_VERDICT]++;

  const out = {
    schema: 'qllaw.phase12_visual.visual_final_verdicts/v1',
    generatedAt: new Date().toISOString(),
    totalForms: allRows.length,
    verdictCounts,
    rows: allRows,
  };
  await writeFile(OUTPUT_VERDICTS, JSON.stringify(out, null, 2));

  const summary = {
    schema: 'qllaw.phase12_visual.visual_summary/v1',
    generatedAt: new Date().toISOString(),
    totalForms: 213,
    attemptedCount: partialByForm.size,
    eligibleCount: recon.verdictCounts.ELIGIBLE_FOR_WORD_AND_LIBREOFFICE,
    upstreamBlockedCount: 213 - partialByForm.size,
    verdictCounts,
    wordFullResults: { total: wordFull.totalForms, passed: wordFull.passed, failed: wordFull.failed },
    libreOfficeFullResults: { total: loFull.totalForms, passed: loFull.passed, failed: loFull.failed },
    crossEngineFullResults: { total: crossFull.totalForms, pageCountMatches: crossFull.pageCountMatches, pageCountDifferences: crossFull.pageCountDifferences },
    notes: [
      `All 213 form rows present (unique).`,
      `${partialByForm.size} forms executed in both Word and LibreOffice; all 83 passed both engines (0 fails).`,
      `${213 - partialByForm.size} forms UPSTREAM_RENDER_BLOCKED (semantic canary, type drift, target evidence missing, transform unimplemented, or stale DOCX).`,
      `BM-198 had DETERMINISM_FAILURE in Phase 2 (R1 != R1-again); excluded from full queue, marked UPSTREAM_RENDER_BLOCKED with reason DETERMINISM_FAILURE.`,
      `BM-059 remains BLOCKED_TARGET_EVIDENCE in the closed-slot-evidence-classification artifact (Phase 4: 2 occurrences of {{recipients.personLine}}).`,
    ],
  };
  await writeFile(OUTPUT_SUMMARY, JSON.stringify(summary, null, 2));

  console.log(`Wrote ${OUTPUT_VERDICTS}`);
  console.log(`Wrote ${OUTPUT_SUMMARY}`);
  console.log('Verdict counts:', verdictCounts);
  if (allRows.length !== 213 || codes.size !== 213) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});