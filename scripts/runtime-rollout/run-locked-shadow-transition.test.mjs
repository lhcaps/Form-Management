import { deepEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';

import { buildShadowTransition } from './run-locked-shadow-transition.mjs';

test('shadow transition has exactly 213 rows', () => {
  const { rows } = buildShadowTransition();
  deepEqual(rows.length, 213);
});

test('every row has the required columns', () => {
  const { rows } = buildShadowTransition();
  const required = ['FORM_CODE', 'LEGACY_PRIMARY_VERDICT', 'LOCKED_PRIMARY_VERDICT', 'LEGACY_REQUIRED_FIELD_COUNT', 'LOCKED_REQUIRED_FIELD_COUNT', 'LEGACY_DEBT_KEYS', 'LOCKED_BLOCKERS', 'CHANGED_REASON', 'SAFE_TO_CUTOVER'];
  for (const row of rows) for (const col of required) ok(col in row, `${row.FORM_CODE} missing ${col}`);
});

test('safe + unsafe counts sum to 213', () => {
  const { summary } = buildShadowTransition();
  deepEqual(summary.safeToCutoverCount + summary.unsafeCount, 213);
});

test('forms with required field count drop are unsafe (hard reject)', () => {
  const { rows } = buildShadowTransition();
  for (const row of rows) {
    if (row.LOCKED_REQUIRED_FIELD_COUNT < row.LEGACY_REQUIRED_FIELD_COUNT) {
      ok(row.SAFE_TO_CUTOVER === false, `${row.FORM_CODE} drops required fields but is marked safe`);
    }
  }
});
