import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('accepts current LibreOffice visual v2 evidence when its form statuses match counts', () => {
  const result = spawnSync('node', ['scripts/runtime-rollout/guard-runtime-rollout-evidence.mjs', '--evidence-dir', 'docs/audit/final-213-customer-ready/runtime-rollout', '--repo-root', '.', '--quiet'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
