import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertSafeResourceNames,
  evaluateGateResult,
  runWithCleanup,
} from '../scripts/audit/migration-regression-gate.mjs';

const ciWorkflow = await readFile(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
);

const passingResult = () => ({
  emptyDatabase: true,
  firstDeployExit: 0,
  secondDeployExit: 0,
  failedMigrationRows: 0,
  statusExit: 0,
  schemaParity: true,
  cleanup: {
    containerRemoveExit: 0,
    networkRemoveExit: 0,
    volumeRemoveExit: 0,
    leftovers: [],
  },
});

test('a child migration failure is non-zero and cleanup always executes', async () => {
  let cleanupCalls = 0;
  const lifecycle = await runWithCleanup(
    async () => {
      throw new Error('simulated child migration failure');
    },
    async () => {
      cleanupCalls += 1;
      return passingResult().cleanup;
    },
  );

  assert.equal(cleanupCalls, 1);
  assert.match(lifecycle.error.message, /child migration failure/u);

  const result = passingResult();
  result.firstDeployExit = 1;
  result.cleanup = lifecycle.cleanup;
  assert.equal(evaluateGateResult(result).exitCode, 1);
});

test('success requires both deploys, status, parity, failed-row check, and cleanup', () => {
  assert.deepEqual(evaluateGateResult(passingResult()), {
    pass: true,
    exitCode: 0,
    failures: [],
  });

  for (const [field, badValue] of [
    ['firstDeployExit', 1],
    ['secondDeployExit', 1],
    ['statusExit', 1],
    ['schemaParity', false],
    ['failedMigrationRows', 1],
  ]) {
    const result = passingResult();
    result[field] = badValue;
    assert.equal(evaluateGateResult(result).exitCode, 1, field);
  }

  const cleanupFailure = passingResult();
  cleanupFailure.cleanup.volumeRemoveExit = 1;
  assert.equal(evaluateGateResult(cleanupFailure).exitCode, 1);
});

test('known persistent resource names are rejected', () => {
  assert.throws(
    () => assertSafeResourceNames({
      container: 'quanlyvks-mariadb',
      network: 'phase8b-safe-net',
      volume: 'phase8b-safe-data',
    }),
    /persistent resource name/u,
  );
  assert.throws(
    () => assertSafeResourceNames({
      container: 'phase8b-migration-gate-safe-db',
      network: 'phase8b-migration-gate-safe-net',
      volume: 'quanlyvks_mariadb_data',
    }),
    /persistent resource name/u,
  );
  assert.doesNotThrow(() => assertSafeResourceNames({
    container: 'phase8b-migration-gate-a-db',
    network: 'phase8b-migration-gate-a-net',
    volume: 'phase8b-migration-gate-a-data',
  }));
});

test('CI runs the gate with frozen dependencies, timeout, and failure evidence', () => {
  const job = ciWorkflow.match(
    /  migration-regression-gate:[\s\S]*?(?=\n  docker-production-build:)/u,
  )?.[0];
  assert.ok(job, 'migration-regression-gate job is present');
  assert.match(job, /timeout-minutes: 15/u);
  assert.match(job, /pnpm install --frozen-lockfile/u);
  assert.match(job, /node scripts\/audit\/migration-regression-gate\.mjs/u);
  assert.match(job, /if: always\(\)/u);
  assert.match(job, /actions\/upload-artifact@v4/u);
  assert.doesNotMatch(job, /continue-on-error/u);
});
