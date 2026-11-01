import { deepEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';

import { buildLockedAuthorityCrosswalk } from './build-locked-authority-crosswalk.mjs';

test('crosswalk examines exactly 2497 locked fields', () => {
  const result = buildLockedAuthorityCrosswalk();
  deepEqual(result.fieldsExamined, 2497);
});

test('crosswalk has exactly 2497 rows', () => {
  const result = buildLockedAuthorityCrosswalk();
  deepEqual(result.rows.length, 2497);
});

test('every crosswalk row has the required columns', () => {
  const result = buildLockedAuthorityCrosswalk();
  const required = ['FORM_CODE', 'LOCKED_FIELD_PATH', 'LOCKED_REQUIRED', 'LOCKED_SOURCE', 'LOCKED_TYPE', 'LOCKED_UI_COMPONENT', 'LOCKED_SLOT_ID', 'LOCKED_SLOT_REQUIRED', 'LOCKED_TARGET_EVIDENCE', 'LOCKED_TRANSFORM', 'CURRENT_NORMALIZED_TARGET_FOUND', 'CURRENT_TARGET_COUNT', 'COMPILED_FIELD_PRESENT', 'COMPILED_FIELD_COMPATIBLE', 'PANEL_FIELD_PRESENT', 'PANEL_SAVES_FIELD', 'ADAPTER_REFERENCES_FIELD', 'ADAPTER_TARGET_MATCH', 'CROSSWALK_VERDICT', 'BLOCKING_REASON'];
  for (const row of result.rows) for (const col of required) ok(col in row, `${row.FORM_CODE}/${row.LOCKED_FIELD_PATH} missing ${col}`);
});

test('crosswalk verdicts come from the allowed set', () => {
  const result = buildLockedAuthorityCrosswalk();
  const allowed = new Set(['LOCKED_ALL_SURFACES_MATCH', 'LOCKED_TARGET_READY_COMPILED_DRIFT', 'LOCKED_TARGET_READY_PANEL_DRIFT', 'LOCKED_TARGET_READY_COMPILED_AND_PANEL_DRIFT', 'LOCKED_TARGET_PARTIAL_EVIDENCE', 'LOCKED_TARGET_MISSING', 'LOCKED_SOURCE_HASH_DRIFT', 'LOCKED_ADAPTER_TARGET_DRIFT', 'LOCKED_TRANSFORM_UNIMPLEMENTED', 'LOCKED_SCHEMA_CONFLICT']);
  for (const row of result.rows) ok(allowed.has(row.CROSSWALK_VERDICT), `verdict ${row.CROSSWALK_VERDICT} not allowed`);
});

test('crosswalk is deterministic (same data on second call)', () => {
  const a = buildLockedAuthorityCrosswalk();
  const b = buildLockedAuthorityCrosswalk();
  deepEqual(a.matched, b.matched);
  deepEqual(a.blocking, b.blocking);
});
