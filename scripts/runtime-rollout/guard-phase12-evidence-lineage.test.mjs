/**
 * Unit tests for guard-phase12-evidence-lineage.mjs.
 *
 * Uses Node's built-in test runner. Each test seeds a fake phase13-browser/
 * tree under tmp/ and asserts the guard's verdict.
 *
 * Run with:
 *   node --test guard-phase12-evidence-lineage.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const GUARD = path.join(REPO_ROOT, 'scripts', 'runtime-rollout', 'guard-phase12-evidence-lineage.mjs');

function makePhase13Dir() {
  const tmp = mkdtempSync(path.join(tmpdir(), 'phase12-guard-'));
  const phase13 = path.join(tmp, 'phase13-browser');
  mkdirSync(phase13, { recursive: true });
  return { tmp, phase13 };
}

function writeJson(p, obj) {
  writeFileSync(p, JSON.stringify(obj, null, 2));
}

function buildPositiveLineage(phase13Dir, opts = {}) {
  const lineage = {
    schema: 'qllaw.phase13.phase12_lineage/v1',
    generatedAt: new Date().toISOString(),
    repoRoot: REPO_ROOT,
    phase13Dir: path.relative(REPO_ROOT, phase13Dir),
    runnerHashes: {
      'run-libreoffice-smoke.mjs': { path: 'scripts/runtime-rollout/run-libreoffice-smoke.mjs', sha256: 'abc123', exists: true },
    },
    artifacts: [
      {
        ARTIFACT_PATH: 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual/smoke-libreoffice-results.json',
        ARTIFACT_SHA256: 'sha',
        RUNNER_PATH: 'scripts/runtime-rollout/run-libreoffice-smoke.mjs',
        RUNNER_SHA256: 'abc123',
        AUTHORITY_HASH: 'auth',
        INPUT_MANIFEST_SHA256: 'in',
        STARTED_AT: null,
        COMPLETED_AT: null,
        WRITTEN_AT: new Date().toISOString(),
        ENGINE: 'libreoffice',
        ENGINE_VERSION: null,
        FORMS_ATTEMPTED: 12,
        FORMS_PASSED: 12,
        PROCESS_OWNER_ID: null,
        FINAL_WRITE_CONFIRMED: true,
        CLOSURE_INCLUDED: false,
        ARTIFACT_BYTES: 1000,
      },
    ],
    authorityHash: 'auth',
    inputManifestSha256: 'in',
    inputManifestFiles: 10,
  };
  writeJson(path.join(phase13Dir, 'phase12-lineage.json'), lineage);

  const forensic = {
    schema: 'qllaw.phase13.task97715_forensic/v1',
    generatedAt: new Date().toISOString(),
    verdict: opts.forensicVerdict || 'PHASE12_LINEAGE_CONFIRMED',
    authoritativeArtifactMtimesChanged: opts.postClosure || [],
    temporaryArtifactPresent: opts.tmpPresent !== undefined ? opts.tmpPresent : false,
    evidence: { tmpFiles: opts.tmpFiles || [], tmpDirs: opts.tmpDirs || [], closureMtime: new Date().toISOString() },
    ownedProcessStillRunning: { libreOfficeRunning: opts.loRunning || 0 },
  };
  writeJson(path.join(phase13Dir, 'background-task-97715-forensic.json'), forensic);

  return { lineage, forensic };
}

function runGuard(phase13Dir) {
  try {
    const out = execFileSync('node', [GUARD, '--phase13-dir', phase13Dir], { encoding: 'utf8' });
    return { exitCode: 0, stdout: out };
  } catch (err) {
    return { exitCode: err.status ?? 1, stdout: (err.stdout || '') + (err.stderr || '') };
  }
}

test('positive baseline: PHASE12_LINEAGE_CONFIRMED', () => {
  const { tmp, phase13 } = makePhase13Dir();
  try {
    buildPositiveLineage(phase13);
    const r = runGuard(phase13);
    assert.equal(r.exitCode, 0, `expected exit 0, got ${r.exitCode}: ${r.stdout}`);
    assert.match(r.stdout, /"verdict": "PHASE12_LINEAGE_CONFIRMED"/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('detects: forensic verdict REGRESSION', () => {
  const { tmp, phase13 } = makePhase13Dir();
  try {
    buildPositiveLineage(phase13, { forensicVerdict: 'PHASE12_LINEAGE_REGRESSION' });
    const r = runGuard(phase13);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /background task 97715 verdict/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('detects: post-closure authoritative artifact mtime change', () => {
  const { tmp, phase13 } = makePhase13Dir();
  try {
    buildPositiveLineage(phase13, {
      postClosure: [{ name: 'smoke-libreoffice-results.json', mtime: new Date().toISOString() }],
    });
    const r = runGuard(phase13);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /modified post-closure/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('detects: missing artifact SHA', () => {
  const { tmp, phase13 } = makePhase13Dir();
  try {
    const { lineage } = buildPositiveLineage(phase13);
    lineage.artifacts[0].ARTIFACT_SHA256 = null;
    writeJson(path.join(phase13, 'phase12-lineage.json'), lineage);
    const r = runGuard(phase13);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /missing SHA256/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('detects: FINAL_WRITE_CONFIRMED false', () => {
  const { tmp, phase13 } = makePhase13Dir();
  try {
    const { lineage } = buildPositiveLineage(phase13);
    lineage.artifacts[0].FINAL_WRITE_CONFIRMED = false;
    writeJson(path.join(phase13, 'phase12-lineage.json'), lineage);
    const r = runGuard(phase13);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /FINAL_WRITE_CONFIRMED false/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('accepts: temporary artifacts accounted for by forensic', () => {
  const { tmp, phase13 } = makePhase13Dir();
  try {
    buildPositiveLineage(phase13, {
      tmpPresent: true,
      tmpFiles: ['.tmp-p12-lo-smoke.log'],
      postClosure: [],
    });
    const r = runGuard(phase13);
    assert.equal(r.exitCode, 0, `expected exit 0, got ${r.exitCode}: ${r.stdout}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('detects: temporary artifact unaccounted', () => {
  const { tmp, phase13 } = makePhase13Dir();
  try {
    buildPositiveLineage(phase13, {
      tmpPresent: true,
      tmpFiles: [],
      tmpDirs: [],
    });
    const r = runGuard(phase13);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /without accounting/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('detects: missing lineage file', () => {
  const { tmp, phase13 } = makePhase13Dir();
  try {
    const r = runGuard(phase13);
    assert.equal(r.exitCode, 1);
    assert.match(r.stdout, /phase12-lineage.json missing/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});