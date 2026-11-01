// Phase 6 — accounting cutover tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { buildAccountingCutover } from './cutover-accounting-consumers.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/accounting-consumer-cutover.json');

test('cutover runs without error', () => {
  const { report } = buildAccountingCutover();
  assert.ok(report, 'report produced');
});

test('all 5 accounting consumers report locked-authority-active', () => {
  const { report } = buildAccountingCutover();
  assert.equal(report.consumerCount, 5);
  assert.equal(report.lockedAuthorityActive, 5);
  assert.equal(report.legacyAuthorityActive, 0);
  assert.equal(report.mixedAuthority, 0);
  assert.equal(report.bypass, 0);
  assert.equal(report.cutoverSucceeded, true);
});

test('locked-derived totals match 213/2497/2497/2497', () => {
  const report = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  const { totalForms, totalFields, totalSlots, totalBindings } = report.lockedDerivedTotals;
  assert.equal(totalForms, 213);
  assert.equal(totalFields, 2497);
  assert.equal(totalSlots, 2497);
  assert.equal(totalBindings, 2497);
});

test('no consumer consumes semantic mapping v1', () => {
  const report = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  for (const c of report.consumers) {
    assert.equal(c.v1_mapping_consumed, false, `${c.CONSUMER} must not consume v1 mapping`);
  }
});

test('no consumer uses deprecated .fields/.slots/.bindings alias', () => {
  const report = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  for (const c of report.consumers) {
    assert.equal(c.deprecated_alias_used, false, `${c.CONSUMER} must not use deprecated alias`);
  }
});
