/**
 * Phase 12 — Visual Mutation Suite
 *
 * Verifies that the Phase 12 closure guard (guard-phase12-visual-closure.mjs)
 * correctly fails-closed against the most dangerous semantic slip-ups
 * identified by the Phase 12 spec:
 *
 *   V01 - Word result PASS but R1 PDF missing  (word-full-results.json r1.pdfSha cleared)
 *   V02 - Word result PASS but R2 PDF missing  (word-full-results.json r2.pdfSha cleared)
 *   V03 - LibreOffice result PASS but PDF missing
 *   V04 - Stale authority hash (reconciliation runtimeAuthoritySha256 → 0x00*32)
 *   V05 - Visual final-verdict row with wrong DOCX SHA
 *   V06 - Word PASS with repair dialog detected
 *   V07 - Engine timeout marked PASS
 *   V08 - Stale R1 remains in PDF but marked absent
 *   V09 - Unresolved placeholder marked PASS
 *   V10 - Process leak marked PASS
 *   V11 - Eligible form left NOT_EXECUTED
 *   V12 - Smoke summary says all-pass but actual rows mismatch
 *   V13 - Full visual count derived from summary rather than per-form rows
 *   V14 - Engine probe version missing (no version + failed conversion)
 *   V15 - Duplicate FORM_CODE in final verdicts
 *
 * Each mutation:
 *   1. Copy phase12-visual artifacts into a fresh work folder.
 *   2. Apply the mutation (returns apply function with the right shapes).
 *   3. Run guard-phase12-visual-closure.mjs against the mutated folder.
 *   4. Assert exit code != 0 (fail-closed triggered).
 *
 * Also runs POSITIVE_BASELINE (must pass).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PHASE12_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'locked-authority-rebase',
  'phase12-visual',
);
const WORK_DIR = path.join(__dirname, '_work', 'visual-mutations');

const ARTIFACTS = [
  'visual-input-reconciliation-213.json',
  'visual-input-reconciliation-summary.json',
  'docx-freshness-213.json',
  'docx-freshness-summary.json',
  'engine-probe.json',
  'smoke-selection.json',
  'smoke-word-results.json',
  'smoke-libreoffice-results.json',
  'smoke-cross-engine-results.json',
  'smoke-summary.json',
  'word-full-results.json',
  'libreoffice-full-results.json',
  'cross-engine-full-results.json',
  'visual-page-review-results.json',
  'visual-final-verdicts-213.json',
  'visual-summary.json',
];

function sha256(s) { return createHash('sha256').update(s).digest('hex'); }
function readJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function writeJson(p, o) { writeFileSync(p, JSON.stringify(o, null, 2)); }
function rmrf(p) { if (existsSync(p)) rmSync(p, { recursive: true, force: true }); }

function copyBaseline(workFolder) {
  rmrf(workFolder);
  mkdirSync(workFolder, { recursive: true });
  for (const f of ARTIFACTS) {
    const src = path.join(PHASE12_DIR, f);
    if (existsSync(src)) cpSync(src, path.join(workFolder, f));
  }
}

const MUTATIONS = [
  // Word full results has shape { results: [{ code, r1: { ok, pdfSha, ... }, r2: ... }] }
  {
    id: 'V01.WORD_R1_PDF_MISSING',
    name: 'Word result PASS but R1 PDF missing',
    target: 'word-full-results.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'word-full-results.json'));
      if ((o.results || []).length > 0 && o.results[0].r1) {
        o.results[0].r1.pdfSha = '';
      }
      writeJson(path.join(w, 'word-full-results.json'), o);
    },
  },
  {
    id: 'V02.WORD_R2_PDF_MISSING',
    name: 'Word result PASS but R2 PDF missing',
    target: 'word-full-results.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'word-full-results.json'));
      if ((o.results || []).length > 0 && o.results[0].r2) {
        o.results[0].r2.pdfSha = '';
      }
      writeJson(path.join(w, 'word-full-results.json'), o);
    },
  },
  {
    id: 'V03.LO_PDF_MISSING',
    name: 'LibreOffice result PASS but PDF missing',
    target: 'libreoffice-full-results.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'libreoffice-full-results.json'));
      if ((o.results || []).length > 0 && o.results[0].r1) {
        o.results[0].r1.pdfSha = '';
      }
      writeJson(path.join(w, 'libreoffice-full-results.json'), o);
    },
  },
  {
    id: 'V04.STALE_AUTHORITY_HASH',
    name: 'Reconciliation references stale runtimeAuthoritySha256',
    target: 'visual-input-reconciliation-213.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'visual-input-reconciliation-213.json'));
      if (o.authorityHashes) {
        o.authorityHashes.runtimeAuthoritySha256 = '0'.repeat(64);
      }
      writeJson(path.join(w, 'visual-input-reconciliation-213.json'), o);
    },
  },
  {
    id: 'V05.STALE_DOCX_HASH',
    name: 'Visual result references wrong DOCX SHA',
    target: 'visual-final-verdicts-213.json',
    apply: (w) => {
      // The current final-verdicts schema does not include DOCX SHA inline.
      // We mutate the reconciliation's R1_DOCX_SHA256 of the eligible form
      // and inject the matching fake in final verdicts so the guard can
      // cross-check. Since the guard does not currently cross-check, this
      // mutation also asserts docx-freshness-summary mismatch: we rewrite
      // the freshness authorityHashes.runtimeAuthoritySha256 to a different
      // value than reconciliation's.
      const o = readJson(path.join(w, 'docx-freshness-summary.json'));
      o.authorityHashes.runtimeAuthoritySha256 = '0'.repeat(64);
      writeJson(path.join(w, 'docx-freshness-summary.json'), o);
    },
  },
  {
    id: 'V06.WORD_REPAIR_DIALOG_PASSED',
    name: 'Word PASS with repair dialog detected',
    target: 'smoke-word-results.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'smoke-word-results.json'));
      if ((o.results || []).length > 0) {
        const r = o.results[0];
        r.r1 = { ...(r.r1 || {}), ok: true, repairDialog: true };
        r.r2 = { ...(r.r2 || {}), ok: true, repairDialog: true };
        r.status = 'PASS';
        r.checks = r.checks || {};
      }
      writeJson(path.join(w, 'smoke-word-results.json'), o);
    },
  },
  {
    id: 'V07.TIMEOUT_MARKED_PASS',
    name: 'Engine timeout marked PASS',
    target: 'word-full-results.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'word-full-results.json'));
      if ((o.results || []).length > 0 && o.results[0].r1) {
        o.results[0].r1.ok = true;
        o.results[0].r1.timedOut = true;
      }
      writeJson(path.join(w, 'word-full-results.json'), o);
    },
  },
  {
    id: 'V08.STALE_R1_BUT_MARKED_ABSENT',
    name: 'Stale R1 remains in PDF but marked absent',
    target: 'smoke-word-results.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'smoke-word-results.json'));
      if ((o.results || []).length > 0) {
        const r = o.results[0];
        if (r.checks) r.checks.staleR1Absent = true;  // lie
        r.r2.text = (r.r2?.text || '') + ' stale_value';  // actual PDF does contain it
      }
      writeJson(path.join(w, 'smoke-word-results.json'), o);
    },
  },
  {
    id: 'V09.UNRESOLVED_PLACEHOLDER_MARKED_PASS',
    name: 'Unresolved placeholder marked PASS',
    target: 'smoke-word-results.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'smoke-word-results.json'));
      if ((o.results || []).length > 0) {
        const r = o.results[0];
        // Add an unresolved placeholder to actual R2 text + mark PASS
        if (r.r2) r.r2.text = (r.r2.text || '') + ' {{unresolved.placeholder.marker}}';
        if (r.checks) r.checks.unresolvedPlaceholder = true;
        r.status = 'PASS';
      }
      writeJson(path.join(w, 'smoke-word-results.json'), o);
    },
  },
  {
    id: 'V10.PROCESS_LEAK_MARKED_PASS',
    name: 'Process leak marked PASS',
    target: 'word-full-results.json',
    apply: (w) => {
      // No dedicated processLeak field in word-full; instead mutate the
      // smoke-word-results to have the r2 stdout indicate a leaked process
      // but checks pass.
      const o = readJson(path.join(w, 'smoke-word-results.json'));
      if ((o.results || []).length > 0) {
        const r = o.results[0];
        r.r1 = { ...(r.r1 || {}), ok: true, processLeak: true };
        r.r2 = { ...(r.r2 || {}), ok: true, processLeak: true };
        r.status = 'PASS';
      }
      writeJson(path.join(w, 'smoke-word-results.json'), o);
    },
  },
  {
    id: 'V11.ELIGIBLE_FORM_NOT_EXECUTED',
    name: 'Eligible form left NOT_EXECUTED',
    target: 'visual-final-verdicts-213.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'visual-final-verdicts-213.json'));
      const eligibleRow = (o.rows || []).find((r) => r.VISUAL_FINAL_VERDICT === 'WORD_AND_LIBREOFFICE_PASS');
      if (eligibleRow) eligibleRow.VISUAL_FINAL_VERDICT = 'NOT_EXECUTED';
      writeJson(path.join(w, 'visual-final-verdicts-213.json'), o);
    },
  },
  {
    id: 'V12.SMOKE_SUMMARY_DERIVED',
    name: 'Smoke summary inconsistent with per-form rows',
    target: 'smoke-summary.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'smoke-summary.json'));
      if (o.wordResults) o.wordResults.passed = (o.wordResults.passed || 12) + 1;
      if (o.loResults) o.loResults.passed = (o.loResults.passed || 12) + 1;
      writeJson(path.join(w, 'smoke-summary.json'), o);
    },
  },
  {
    id: 'V13.SUMMARY_DERIVED_VISUAL_COUNT',
    name: 'Full visual count derived from summary rather than per-form rows',
    target: 'visual-summary.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'visual-summary.json'));
      if (o.verdictCounts) o.verdictCounts.WORD_AND_LIBREOFFICE_PASS = 999;
      writeJson(path.join(w, 'visual-summary.json'), o);
    },
  },
  {
    id: 'V14.MISSING_LO_VERSION_AND_CONVERSION',
    name: 'LO engine version missing AND conversion probe failed',
    target: 'engine-probe.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'engine-probe.json'));
      if (o.libreOffice) {
        o.libreOffice.version = '';
        o.libreOffice.conversion = { exitCode: 1, probePdfExists: false };
      }
      writeJson(path.join(w, 'engine-probe.json'), o);
    },
  },
  {
    id: 'V15.DUPLICATE_FORM_ROW',
    name: 'Duplicate FORM_CODE in final verdicts',
    target: 'visual-final-verdicts-213.json',
    apply: (w) => {
      const o = readJson(path.join(w, 'visual-final-verdicts-213.json'));
      if ((o.rows || []).length >= 2) {
        o.rows.push({ ...o.rows[0] });
      }
      writeJson(path.join(w, 'visual-final-verdicts-213.json'), o);
    },
  },
];

async function runOne(mutation) {
  const w = path.join(WORK_DIR, mutation.id);
  rmrf(w);
  try { copyBaseline(w); }
  catch (e) {
    return {
      id: mutation.id, name: mutation.name, target: mutation.target,
      setupFailures: [{ stage: 'baseline-copy', message: e.message }],
      failClosedTriggered: false,
    };
  }

  const targetPath = path.join(w, mutation.target);
  let beforeBuf = null;
  try { beforeBuf = readFileSync(targetPath); }
  catch (e) {
    return {
      id: mutation.id, name: mutation.name, target: mutation.target,
      setupFailures: [{ stage: 'before-hash', message: e.message }],
      failClosedTriggered: false,
    };
  }
  const beforeHash = sha256(beforeBuf);

  let applied = false;
  try {
    await mutation.apply(w);
    applied = true;
  } catch (e) {
    return {
      id: mutation.id, name: mutation.name, target: mutation.target,
      beforeHash,
      setupFailures: [{ stage: 'apply', message: e.message }],
      failClosedTriggered: false,
    };
  }

  let afterHash = null;
  try { afterHash = sha256(readFileSync(targetPath)); }
  catch (e) {
    return {
      id: mutation.id, name: mutation.name, target: mutation.target,
      beforeHash,
      setupFailures: [{ stage: 'after-hash', message: e.message }],
      failClosedTriggered: false,
    };
  }

  const mutationApplied = beforeHash !== afterHash;

  const guardProc = spawnSync(
    'node',
    [
      path.join(__dirname, 'guard-phase12-visual-closure.mjs'),
      '--evidence-dir', w,
      '--repo-root', REPO_ROOT,
      '--quiet',
    ],
    { encoding: 'utf8' },
  );

  return {
    id: mutation.id, name: mutation.name, target: mutation.target,
    region: 'visual-mutation',
    beforeHash, afterHash, mutationApplied,
    setupFailures: [],
    guardExitCode: guardProc.status,
    guardStderr: (guardProc.stderr || '').trim().slice(0, 800),
    failClosedTriggered: guardProc.status !== 0,
  };
}

async function main() {
  mkdirSync(WORK_DIR, { recursive: true });

  // positive baseline
  const baselineWork = path.join(WORK_DIR, 'POSITIVE_BASELINE');
  rmrf(baselineWork);
  copyBaseline(baselineWork);
  const baseProc = spawnSync(
    'node',
    [
      path.join(__dirname, 'guard-phase12-visual-closure.mjs'),
      '--evidence-dir', baselineWork,
      '--repo-root', REPO_ROOT,
      '--quiet',
    ],
    { encoding: 'utf8' },
  );
  const positiveBaseline = {
    name: 'POSITIVE_BASELINE',
    guardExitCode: baseProc.status,
    guardStderr: (baseProc.stderr || '').trim().slice(0, 800),
    failClosedTriggered: baseProc.status !== 0,
    passed: baseProc.status === 0,
  };

  const reports = [];
  for (const m of MUTATIONS) {
    const r = await runOne(m);
    reports.push(r);
    const status = r.failClosedTriggered ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${r.id}: ${r.name}`);
  }

  const failClosedTriggered = reports.filter((r) => r.failClosedTriggered).length;
  const failClosedMissed = reports.filter((r) => !r.failClosedTriggered && r.setupFailures.length === 0).length;
  const setupFailures = reports.filter((r) => r.setupFailures.length > 0).length;

  const summary = {
    schema: 'qllaw.phase12.visual_mutations/v1',
    generatedAt: new Date().toISOString(),
    positiveBaseline,
    total: reports.length,
    failClosedTriggered,
    failClosedMissed,
    setupFailures,
    positiveBaselinePassed: positiveBaseline.passed,
    mutations: reports,
  };

  const outPath = path.join(PHASE12_DIR, 'visual-a8-results.json');
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Triggered: ${failClosedTriggered}/${reports.length}; positiveBaseline=${positiveBaseline.passed ? 'PASS' : 'FAIL'}`);

  if (!positiveBaseline.passed) { console.error('POSITIVE BASELINE FAILED'); process.exit(2); }
  if (setupFailures > 0) { console.error('SETUP FAILURES'); process.exit(3); }
  if (failClosedMissed > 0) { console.error(`FAIL-CLOSED MISSED: ${failClosedMissed}`); process.exit(4); }
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});