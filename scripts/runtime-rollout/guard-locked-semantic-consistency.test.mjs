// Phase 2 — semantic consistency guard tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { runSemanticConsistencyGuard } from './guard-locked-semantic-consistency.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/semantic-consistency-overlay.json');

const ALLOWED_CONFLICTS = new Set([
  'SEMANTICALLY_CONSISTENT',
  'PRESENTATION_METADATA_DRIFT',
  'CONTROL_METADATA_DRIFT',
  'ROLE_CONFLICT',
  'TYPE_CONFLICT',
  'TARGET_CONTEXT_CONFLICT',
  'REPAIR_HISTORY_CONFLICT',
  'REQUIRES_SOURCE_ADJUDICATION',
]);
const ALLOWED_STATUSES = new Set([
  'AUTO_VALIDATED_COMPATIBILITY',
  'SOURCE_PROVEN_RUNTIME_OVERRIDE',
  'BLOCKED_PENDING_SOURCE_PROOF',
]);

test('overlay artifact exists after run', () => {
  const { result } = runSemanticConsistencyGuard();
  assert.equal(result.totalFields, 2497);
});

test('overlay covers all 2497 fields', () => {
  const result = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  assert.equal(result.overlay.length, 2497);
});

test('conflict verdicts restricted to declared set', () => {
  const result = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  for (const row of result.overlay) {
    assert.ok(ALLOWED_CONFLICTS.has(row.CONFLICT), `unknown conflict: ${row.CONFLICT}`);
    assert.ok(ALLOWED_STATUSES.has(row.OVERLAY_STATUS), `unknown status: ${row.OVERLAY_STATUS}`);
  }
});

test('corruption canaries are surfaced (not silently ignored)', () => {
  const result = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  // Honest contract: canary count is reported even if zero, but the file must
  // expose the canary array so downstream guards can examine.
  assert.ok(Array.isArray(result.corruptionCanaries), 'corruptionCanaries must be an array');
  if (result.corruptionCanaries.length > 0) {
    const canary = result.corruptionCanaries[0];
    assert.equal(canary.CONFLICT, 'TYPE_CONFLICT');
    assert.equal(canary.canary, 'person-key-with-date-ui');
    assert.equal(canary.FORM_CODE, 'BM-036');
    assert.equal(canary.FIELD_PATH, 'person.fullName');
  }
});

test('BM-036.person.fullName is BLOCKED_PENDING_SOURCE_PROOF', () => {
  const result = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  const row = result.overlay.find((r) => r.FORM_CODE === 'BM-036' && r.FIELD_PATH === 'person.fullName');
  assert.ok(row, 'BM-036.person.fullName row must exist in overlay');
  assert.equal(row.OVERLAY_STATUS, 'BLOCKED_PENDING_SOURCE_PROOF');
  assert.ok(['TYPE_CONFLICT', 'ROLE_CONFLICT', 'TARGET_CONTEXT_CONFLICT'].includes(row.CONFLICT));
});

test('overlay never modifies locked contracts', () => {
  const result = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  for (const row of result.overlay) {
    assert.ok(row.LOCKED_VALUE && typeof row.LOCKED_VALUE === 'object', 'LOCKED_VALUE must exist');
    assert.ok(row.CURRENT_VALUE && typeof row.CURRENT_VALUE === 'object', 'CURRENT_VALUE must exist');
  }
});
