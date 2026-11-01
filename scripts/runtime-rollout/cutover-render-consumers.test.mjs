// Phase 7 — render cutover tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { buildRenderCutover } from './cutover-render-consumers.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/render-consumer-cutover.json');

test('render cutover runs without error', () => {
  const { report } = buildRenderCutover();
  assert.ok(report);
});

test('all 2 render consumers are locked-authority-active', () => {
  const { report } = buildRenderCutover();
  assert.equal(report.consumerCount, 2);
  assert.equal(report.lockedAuthorityActive, 2);
  assert.equal(report.mixedAuthority, 0);
  assert.equal(report.bypass, 0);
  assert.equal(report.cutoverSucceeded, true);
});

test('no render consumer consumes v1 mapping', () => {
  const report = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  for (const c of report.consumers) {
    assert.equal(c.v1_mapping_consumed, false);
  }
});

test('behavioural proof: removing one binding changes inventory', () => {
  const report = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  const proof = report.behaviouralProof;
  assert.ok(proof);
  assert.ok(proof.cloneFieldCount < proof.originalFieldCount);
  assert.ok(proof.cloneBindingCount < proof.originalBindingCount);
  assert.equal(proof.behaviouralProofPassed, true);
});

test('locked totals reported match 213/2497/2497/2497', () => {
  const report = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  assert.equal(report.lockedTotals.totalForms, 213);
  assert.equal(report.lockedTotals.totalFields, 2497);
  assert.equal(report.lockedTotals.totalSlots, 2497);
  assert.equal(report.lockedTotals.totalBindings, 2497);
});
