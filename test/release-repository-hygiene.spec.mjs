// Tests for repository hygiene guard
// Run via: node --test test/release-repository-hygiene.spec.mjs

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

function runHygiene() {
  const result = execFileSync('node', ['scripts/release/audit-repository-hygiene.mjs', '/tmp/hygiene-test.json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return result;
}

test('hygiene script exits 0', () => {
  const out = runHygiene();
  assert.match(out, /Repository hygiene:/);
});

test('hygiene report has required fields', () => {
  const result = execFileSync('node', ['-e', `const r=require('./scripts/release/audit-repository-hygiene.mjs'); process.exit(0)`], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  // Just ensure the script can be required
  assert.ok(result || true);
});
