/**
 * Tests for the Phase 12 visual closure guard.
 *
 * Strategy:
 *   - Spawn the guard against a known-good evidence dir (the live phase12-visual
 *     directory) → expect exit 0.
 *   - Spawn it against an empty work dir  → expect exit 1.
 *   - Apply a small set of mutations to a copy of the live evidence, then
 *     run the guard → expect exit 1.
 *
 * These are end-to-end shell tests (Node spawnSync) rather than unit tests so
 * they exercise exactly the same code path that the closure guard uses.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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
const WORK_DIR = path.join(__dirname, '_work', 'guard-tests');
const GUARD = path.join(__dirname, 'guard-phase12-visual-closure.mjs');

const PHASE12_ARTIFACTS = [
  'visual-input-reconciliation-213.json',
  'visual-input-reconciliation-summary.json',
  'docx-freshness-summary.json',
  'docx-freshness-213.json',
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

function runGuard(evidenceDir) {
  return spawnSync(
    'node',
    [GUARD, '--evidence-dir', evidenceDir, '--repo-root', REPO_ROOT, '--quiet'],
    { encoding: 'utf8' },
  );
}

function makeBaseline(workFolder) {
  rmSync(workFolder, { recursive: true, force: true });
  mkdirSync(workFolder, { recursive: true });
  for (const f of PHASE12_ARTIFACTS) {
    const src = path.join(PHASE12_DIR, f);
    if (existsSync(src)) {
      copyFileSync(src, path.join(workFolder, f));
    }
  }
}

test('POSITIVE: live phase12-visual evidence passes the guard', () => {
  const proc = runGuard(PHASE12_DIR);
  if (proc.status !== 0) {
    throw new Error(`guard exited ${proc.status}\nstdout=${proc.stdout}\nstderr=${proc.stderr}`);
  }
});

test('NEGATIVE: missing reconciliation file fails closed', () => {
  const w = path.join(WORK_DIR, 'missing-reconciliation');
  mkdirSync(w, { recursive: true });
  // Copy everything except the reconciliation file
  for (const f of PHASE12_ARTIFACTS) {
    if (f === 'visual-input-reconciliation-213.json') continue;
    copyFileSync(path.join(PHASE12_DIR, f), path.join(w, f));
  }
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed but passed');
  }
});

test('NEGATIVE: blank final verdict fails closed', () => {
  const w = path.join(WORK_DIR, 'blank-verdict');
  makeBaseline(w);
  const file = path.join(w, 'visual-final-verdicts-213.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  obj.rows[0].VISUAL_FINAL_VERDICT = '';
  writeFileSync(file, JSON.stringify(obj, null, 2));
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed (blank verdict) but passed');
  }
});

test('NEGATIVE: eligible form left NOT_EXECUTED fails closed', () => {
  const w = path.join(WORK_DIR, 'not-executed');
  makeBaseline(w);
  const file = path.join(w, 'visual-final-verdicts-213.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  const eligible = obj.rows.find((r) => r.VISUAL_FINAL_VERDICT === 'WORD_AND_LIBREOFFICE_PASS');
  if (!eligible) throw new Error('test setup: no eligible form found in evidence');
  eligible.VISUAL_FINAL_VERDICT = 'NOT_EXECUTED';
  writeFileSync(file, JSON.stringify(obj, null, 2));
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed (eligible left NOT_EXECUTED) but passed');
  }
});

test('NEGATIVE: stale authority hash fails closed', () => {
  const w = path.join(WORK_DIR, 'stale-auth');
  makeBaseline(w);
  const file = path.join(w, 'visual-input-reconciliation-213.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  obj.authorityHashes.runtimeAuthoritySha256 = '0'.repeat(64);
  writeFileSync(file, JSON.stringify(obj, null, 2));
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed (stale authority hash) but passed');
  }
});

test('NEGATIVE: smoke summary inconsistent with per-form rows fails closed', () => {
  const w = path.join(WORK_DIR, 'smoke-inconsistent');
  makeBaseline(w);
  const file = path.join(w, 'smoke-summary.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  obj.wordResults.passed = 999;
  obj.wordResults.total = 999;
  obj.loResults.passed = 999;
  obj.loResults.total = 999;
  obj.totalForms = 999;
  writeFileSync(file, JSON.stringify(obj, null, 2));
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed (smoke summary inconsistency) but passed');
  }
});

test('NEGATIVE: summary verdict counts derived from summary rather than rows fails closed', () => {
  const w = path.join(WORK_DIR, 'summary-derived');
  makeBaseline(w);
  const file = path.join(w, 'visual-summary.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  obj.verdictCounts.WORD_AND_LIBREOFFICE_PASS = 999;
  writeFileSync(file, JSON.stringify(obj, null, 2));
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed (summary-derived count) but passed');
  }
});

test('NEGATIVE: missing LO engine version + missing conversion probe fails closed', () => {
  const w = path.join(WORK_DIR, 'missing-lo');
  makeBaseline(w);
  const file = path.join(w, 'engine-probe.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  obj.libreOffice.version = '';
  obj.libreOffice.conversion = { exitCode: 1, probePdfExists: false };
  writeFileSync(file, JSON.stringify(obj, null, 2));
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed (LO version missing & conversion failed) but passed');
  }
});

test('NEGATIVE: word full results with timedOut PASS fails closed', () => {
  const w = path.join(WORK_DIR, 'word-timedout');
  makeBaseline(w);
  const file = path.join(w, 'word-full-results.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  obj.results[0].r1.timedOut = true;
  obj.results[0].r1.ok = true;
  writeFileSync(file, JSON.stringify(obj, null, 2));
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed (timedOut PASS) but passed');
  }
});

test('NEGATIVE: 250 rows (extra row) fails closed', () => {
  const w = path.join(WORK_DIR, 'extra-row');
  makeBaseline(w);
  const file = path.join(w, 'visual-final-verdicts-213.json');
  const obj = JSON.parse(readFileSync(file, 'utf8'));
  obj.rows.push({ ...obj.rows[0], FORM_CODE: 'BM-XYZ' });
  writeFileSync(file, JSON.stringify(obj, null, 2));
  const proc = runGuard(w);
  if (proc.status === 0) {
    throw new Error('guard should have failed (extra row) but passed');
  }
});