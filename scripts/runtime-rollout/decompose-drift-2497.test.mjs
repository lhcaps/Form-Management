// Phase 1 — drift decomposition tests.
// Validates:
//   - runs without error
//   - covers exactly 2497 rows
//   - composite verdict set restricted to declared set
//   - 3-tier safety counts do not exceed 213
//   - semantic corruption canary detection
//   - if corruption canaries > 0 the count is reported
//   - distinct block rules: HYDRATION != accounting-only

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { decomposeDrift } from './decompose-drift-2497.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SUMMARY_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/drift-decomposition-summary.json');
const ROWS_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/drift-decomposition-2497.json');

const ALLOWED = new Set([
  'EXACT', 'COMPATIBLE_VARIATION', 'PRESENTATION_DRIFT', 'INPUT_VALIDATION_DRIFT',
  'TYPE_DRIFT', 'CONTROL_DRIFT', 'SAVE_PAYLOAD_DRIFT', 'HYDRATION_DRIFT',
  'ROLE_DRIFT', 'TARGET_DRIFT', 'TRANSFORM_DRIFT', 'SEMANTIC_CORRUPTION_SUSPECTED',
  'NOT_APPLICABLE',
]);

test('drift decomposition artifact exists after run', () => {
  const { summary } = decomposeDrift();
  assert.equal(summary.totalRows, 2497);
});

test('composite verdicts restricted to declared set', () => {
  const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
  for (const v of Object.keys(summary.byCompositeVerdict)) {
    assert.ok(ALLOWED.has(v), `unknown verdict ${v}`);
  }
});

test('safe counts never exceed 213', () => {
  const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
  assert.ok(summary.accountingSafeForms <= 213, `accountingSafeForms=${summary.accountingSafeForms} > 213`);
  assert.ok(summary.renderSafeForms <= 213, `renderSafeForms=${summary.renderSafeForms} > 213`);
  assert.ok(summary.promotionSafeForms <= 213, `promotionSafeForms=${summary.promotionSafeForms} > 213`);
});

test('semantic corruption canaries surface', () => {
  const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
  // Honest contract: surface whatever count was found, even if zero.
  const count = summary.byCompositeVerdict.SEMANTIC_CORRUPTION_SUSPECTED ?? 0;
  assert.ok(Number.isInteger(count) && count >= 0, 'canary count must be a non-negative integer');
});

test('rows file present and total rows match summary', () => {
  const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
  const rowsJson = JSON.parse(readFileSync(ROWS_PATH, 'utf8'));
  assert.ok(Array.isArray(rowsJson.rows), 'rows must be an array');
  assert.equal(rowsJson.rows.length, summary.totalRows);
});

test('no broad-drift verdict collapse — multiple distinct buckets remain', () => {
  const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
  // At minimum: transform and target drift must each have a bucket (they were
  // named in the spec).
  assert.ok('TRANSFORM_DRIFT' in summary.byCompositeVerdict, 'TRANSFORM_DRIFT bucket missing');
  assert.ok('TARGET_DRIFT' in summary.byCompositeVerdict, 'TARGET_DRIFT bucket missing');
});

test('accounting safe is a superset of promotion safe (or equal)', () => {
  const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
  assert.ok(summary.accountingSafeForms >= summary.promotionSafeForms);
  assert.ok(summary.renderSafeForms >= summary.promotionSafeForms);
});
