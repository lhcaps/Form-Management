import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('accepts a real adapter-mediated PASS_COMPOUND_MAPPING as a verdict flip', () => {
  const result = spawnSync('node', ['scripts/runtime-rollout/guard-adapter-runtime-wiring.mjs'], {
    cwd: process.cwd(), encoding: 'utf8', timeout: 60_000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
