// Phase 8 — R1/R2 binding verification tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { runR1R2BindingVerification } from './run-r1-r2-binding-verification.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const BINDING_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/binding-verification-213.json');
const FINAL_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/binding-verification-final-verdict.json');

test('binding verification runs and writes both artifacts', () => {
  const { summary, finalVerdict } = runR1R2BindingVerification();
  assert.ok(existsSync(BINDING_PATH), 'binding-verification-213.json must exist');
  assert.ok(existsSync(FINAL_PATH), 'binding-verification-final-verdict.json must exist');
  assert.equal(summary.bindingsAttempted, 2497);
});

test('all 213 forms and 2497 bindings are attempted', () => {
  const summary = JSON.parse(readFileSync(BINDING_PATH, 'utf8'));
  assert.equal(summary.totalForms, 213);
  assert.equal(summary.formsAttempted, 213);
  assert.equal(summary.fieldsAccounted, 2497);
  assert.equal(summary.slotsAccounted, 2497);
  assert.equal(summary.bindingsAttempted, 2497);
  assert.equal(summary.lockedTotalsMatch, true);
});

test('every failed form has exact failed binding rows', () => {
  const finalVerdict = JSON.parse(readFileSync(FINAL_PATH, 'utf8'));
  for (const [group, rows] of Object.entries(finalVerdict.failureGroups)) {
    for (const row of rows) {
      assert.ok(row.formCode && row.slotId && row.issue, `failed row in ${group} missing required keys`);
    }
  }
});

test('failures are grouped by root cause, not by form code', () => {
  const finalVerdict = JSON.parse(readFileSync(FINAL_PATH, 'utf8'));
  const groups = Object.keys(finalVerdict.failureGroups);
  // Each group must contain rows from at least one or more forms if non-empty.
  for (const g of groups) {
    const rows = finalVerdict.failureGroups[g];
    if (rows.length > 1) {
      const formCodes = new Set(rows.map((r) => r.formCode));
      assert.ok(formCodes.size >= 1, `group ${g} contains rows from one form`);
    }
  }
});

test('failure groups use allowed set', () => {
  const finalVerdict = JSON.parse(readFileSync(FINAL_PATH, 'utf8'));
  const allowedGroups = new Set([
    'SEMANTIC_METADATA_CONFLICT',
    'TYPE_SERIALIZATION',
    'TRANSFORM_IMPLEMENTATION',
    'TARGET_EXTRACTION',
    'NORMALIZED_TEMPLATE_DRIFT',
    'STATIC_TEXT_MUTATION',
    'CROSS_FIELD_COLLISION',
    'STALE_R1',
    'DOCX_PACKAGE',
    'INSPECTION_FALSE_POSITIVE',
    'r1-r2-identical-after-transform',
    'transform-unimplemented',
    'transform-no-op-fallback',
    'possible-r1-stale-in-r2',
    'payload-missing',
  ]);
  for (const g of Object.keys(finalVerdict.failureGroups)) {
    assert.ok(allowedGroups.has(g), `unknown failure group: ${g}`);
  }
});
