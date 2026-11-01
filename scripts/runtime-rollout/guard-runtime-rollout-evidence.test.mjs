/**
 * CLI / behavioral tests for the A8 runtime-rollout evidence guard.
 *
 * Run with:   node --test scripts/runtime-rollout/guard-runtime-rollout-evidence.test.mjs
 *
 * These tests cover the failure paths called out in the A8 brief:
 *   - missing args (no --evidence-dir, no --repo-root)
 *   - nonexistent evidence directory
 *   - malformed path (path exists but is not a directory)
 *   - malformed JSON inside the evidence folder
 *   - unexpected schema in any evidence file
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GUARD = path.join(__dirname, 'guard-runtime-rollout-evidence.mjs');
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Locate the real positive-baseline evidence folder so the unexpected-schema
// test can build on a known-good baseline and mutate exactly one field.
const POSITIVE_EVIDENCE = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);

function run(args, { cwd = REPO_ROOT } = {}) {
  return spawnSync('node', [GUARD, ...args], { encoding: 'utf8', cwd });
}

// ---------------------------------------------------------------------------
// CLI surface
// ---------------------------------------------------------------------------

test('CLI: no args exits 2 (USAGE)', () => {
  const r = run([]);
  assert.equal(r.status, 2, `expected exit 2, got ${r.status}; stderr=${r.stderr}`);
  assert.match(r.stderr, /USAGE/);
});

test('CLI: only --evidence-dir exits 2 (USAGE)', () => {
  const r = run(['--evidence-dir', POSITIVE_EVIDENCE]);
  assert.equal(r.status, 2, `expected exit 2, got ${r.status}; stderr=${r.stderr}`);
  assert.match(r.stderr, /USAGE/);
});

test('CLI: only --repo-root exits 2 (USAGE)', () => {
  const r = run(['--repo-root', REPO_ROOT]);
  assert.equal(r.status, 2, `expected exit 2, got ${r.status}; stderr=${r.stderr}`);
  assert.match(r.stderr, /USAGE/);
});

test('CLI: --help prints usage and exits 0', () => {
  const r = run(['--help']);
  assert.equal(r.status, 0, `expected exit 0, got ${r.status}`);
  assert.match(r.stdout, /--evidence-dir/);
});

test('CLI: unknown flag exits 2 (USAGE)', () => {
  const r = run(['--evidence-dir', POSITIVE_EVIDENCE, '--repo-root', REPO_ROOT, '--bogus']);
  assert.equal(r.status, 2, `expected exit 2, got ${r.status}; stderr=${r.stderr}`);
  assert.match(r.stderr, /unknown argument: --bogus/);
});

// ---------------------------------------------------------------------------
// Environment errors
// ---------------------------------------------------------------------------

test('CLI: nonexistent evidence directory exits 3 (ENVIRONMENT)', () => {
  const r = run([
    '--evidence-dir',
    path.join(REPO_ROOT, 'definitely-not-a-real-path-xyz'),
    '--repo-root',
    REPO_ROOT,
  ]);
  assert.equal(r.status, 3, `expected exit 3, got ${r.status}; stderr=${r.stderr}`);
  assert.match(r.stderr, /ENVIRONMENT/);
});

test('CLI: malformed path (a regular file, not a directory) exits 3', () => {
  // Use the README.md as the "evidence dir" - it exists but is not a directory.
  const file = path.join(REPO_ROOT, 'README.md');
  if (!existsSync(file)) {
    // README.md not present in this repo - skip silently.
    return;
  }
  const r = run(['--evidence-dir', file, '--repo-root', REPO_ROOT]);
  assert.equal(r.status, 3, `expected exit 3, got ${r.status}; stderr=${r.stderr}`);
  assert.match(r.stderr, /ENVIRONMENT/);
});

// ---------------------------------------------------------------------------
// Invariant failures (run-guard correctness)
// ---------------------------------------------------------------------------

test('runGuard: passes against the real positive baseline', async () => {
  // Importing the guard directly avoids spawning another node process.
  const { runGuard } = await import('./guard-runtime-rollout-evidence.mjs');
  const result = await runGuard({
    evidenceDir: POSITIVE_EVIDENCE,
    repoRoot: REPO_ROOT,
  });
  assert.equal(result.passed, true, `baseline should pass; errors=${JSON.stringify(result.errors)}`);
});

test('runGuard: malformed JSON in canonical-runtime-roster.json fails-closed', async () => {
  // Stage a temp directory that copies the positive baseline and then
  // overwrites exactly one evidence file with a malformed payload.
  const tmp = mkdtempSync(path.join(tmpdir(), 'a8-guard-malformed-'));
  try {
    // Copy each baseline artifact into the temp folder.
    const artifacts = [
      'authoritative-213-manifest.json',
      'legal-header-213-matrix.json',
      'technical-family-clusters.json',
      'render-readiness-213-matrix.json',
      'source-hash-baseline.json',
      'command-log.json',
      'runtime-render-results.json',
      'word-visual-results.json',
      'libreoffice-visual-results.json',
      'canonical-runtime-roster.json',
      'phase1-accounting.json',
      'phase1b-libreoffice-outcomes.json',
      'runtime-readiness.generated.json',
      'slot-inventory-summary.json',
      'legal-header-candidates.json',
    ];
    const { cpSync, copyFileSync } = await import('node:fs');
    for (const f of artifacts) {
      const src = path.join(POSITIVE_EVIDENCE, f);
      const dst = path.join(tmp, f);
      if (existsSync(src)) copyFileSync(src, dst);
    }
    const wordSidecarSrc = path.join(POSITIVE_EVIDENCE, 'word-sidecar');
    if (existsSync(wordSidecarSrc)) cpSync(wordSidecarSrc, path.join(tmp, 'word-sidecar'), { recursive: true });
    for (const f of [
      'packages/form-contracts/src/bridge-eligibility.ts',
      'packages/form-contracts/src/runtime-readiness.generated.ts',
    ]) {
      const src = path.join(REPO_ROOT, f);
      const dst = path.join(tmp, path.basename(f));
      if (existsSync(src)) copyFileSync(src, dst);
    }

    // Corrupt exactly one file.
    writeFileSync(path.join(tmp, 'canonical-runtime-roster.json'), '{ not valid json');

    const { runGuard } = await import('./guard-runtime-rollout-evidence.mjs');
    const result = await runGuard({ evidenceDir: tmp, repoRoot: REPO_ROOT });
    assert.equal(result.passed, false, 'malformed JSON must fail-closed');
    assert.ok(
      result.errors.some((e) => /canonical-runtime-roster.*malformed/i.test(e)),
      `expected a canonical-runtime-roster malformed error, got: ${JSON.stringify(result.errors)}`,
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('runGuard: unexpected schema in phase1-accounting.json fails-closed', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'a8-guard-schema-'));
  try {
    const { cpSync, copyFileSync } = await import('node:fs');
    const artifacts = [
      'authoritative-213-manifest.json',
      'legal-header-213-matrix.json',
      'technical-family-clusters.json',
      'render-readiness-213-matrix.json',
      'source-hash-baseline.json',
      'command-log.json',
      'runtime-render-results.json',
      'word-visual-results.json',
      'libreoffice-visual-results.json',
      'canonical-runtime-roster.json',
      'phase1-accounting.json',
      'phase1b-libreoffice-outcomes.json',
      'runtime-readiness.generated.json',
      'slot-inventory-summary.json',
      'legal-header-candidates.json',
    ];
    for (const f of artifacts) {
      const src = path.join(POSITIVE_EVIDENCE, f);
      const dst = path.join(tmp, f);
      if (existsSync(src)) copyFileSync(src, dst);
    }
    const wordSidecarSrc = path.join(POSITIVE_EVIDENCE, 'word-sidecar');
    if (existsSync(wordSidecarSrc)) cpSync(wordSidecarSrc, path.join(tmp, 'word-sidecar'), { recursive: true });
    for (const f of [
      'packages/form-contracts/src/bridge-eligibility.ts',
      'packages/form-contracts/src/runtime-readiness.generated.ts',
    ]) {
      const src = path.join(REPO_ROOT, f);
      const dst = path.join(tmp, path.basename(f));
      if (existsSync(src)) copyFileSync(src, dst);
    }

    // Rewrite phase1-accounting.json with a wrong schema.
    const wrong = {
      schema: 'qllaw.213.phase1_accounting/v0', // WRONG
      finalRuntimeReady: ['BM-001'],
      counts: { runtimeReadyUniqueCount: 1, skeletonCount: 212, newlyPromoted: 0 },
      promoted: [],
      provisional: [],
    };
    writeFileSync(path.join(tmp, 'phase1-accounting.json'), JSON.stringify(wrong, null, 2));

    const { runGuard } = await import('./guard-runtime-rollout-evidence.mjs');
    const result = await runGuard({ evidenceDir: tmp, repoRoot: REPO_ROOT });
    assert.equal(result.passed, false, 'unexpected schema must fail-closed');
    assert.ok(
      result.errors.some((e) => /phase1-accounting.*schema mismatch/i.test(e)),
      `expected a phase1-accounting schema error, got: ${JSON.stringify(result.errors)}`,
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('runGuard: missing canonical-runtime-roster.json fails-closed', async () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'a8-guard-missing-'));
  try {
    mkdirSync(tmp, { recursive: true });
    const { runGuard } = await import('./guard-runtime-rollout-evidence.mjs');
    const result = await runGuard({ evidenceDir: tmp, repoRoot: REPO_ROOT });
    assert.equal(result.passed, false, 'empty evidence dir must fail-closed');
    assert.ok(result.errors.length > 0, 'expected at least one error');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI: empty evidence dir exits 1', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'a8-guard-empty-'));
  try {
    const r = run(['--evidence-dir', tmp, '--repo-root', REPO_ROOT, '--quiet']);
    assert.equal(r.status, 1, `expected exit 1, got ${r.status}; stderr=${r.stderr}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI: --json output is well-formed JSON on success', () => {
  const r = run([
    '--evidence-dir', POSITIVE_EVIDENCE,
    '--repo-root', REPO_ROOT,
    '--json',
    '--quiet',
  ]);
  assert.equal(r.status, 0, `expected exit 0, got ${r.status}; stderr=${r.stderr}`);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.passed, true);
  assert.equal(parsed.schema, 'qllaw.a8.guard_runtime_rollout_evidence/v1');
});