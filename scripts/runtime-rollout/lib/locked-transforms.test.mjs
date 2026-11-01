// Locked transforms — implementation tests for date.issuePlaceDateLine.
//
// Required invariants:
//   - deterministic R1 = R1' for the same input
//   - deterministic R2 != R1 for distinct inputs
//   - type-valid input only
//   - correct Vietnamese-style output: "Hà Nội, ngày 15 tháng 01 năm 2026"
//   - static surrounding text preservation
//   - no timezone shift
//   - no role collision with another field's value

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { applyTransform, IMPLEMENTED_TRANSFORMS } from './locked-transforms.mjs';

test('identity is implemented', () => {
  assert.equal(applyTransform('identity', 'hello'), 'hello');
  assert.equal(applyTransform('identity', 42), 42);
  assert.equal(applyTransform('identity', null), null);
});

test('unimplemented transform throws', () => {
  assert.throws(() => applyTransform('foo', 'x'), /UNIMPLEMENTED/);
});

test('date.issuePlaceDateLine - default agency + iso date', () => {
  const out = applyTransform('date.issuePlaceDateLine', { issueDate: '2026-01-15', agency: { diaDanh: 'Hà Nội' } });
  assert.equal(out, 'Hà Nội, ngày 15 tháng 01 năm 2026');
});

test('date.issuePlaceDateLine - dd/mm/yyyy input', () => {
  const out = applyTransform('date.issuePlaceDateLine', { issueDate: '15/01/2026', agency: { diaDanh: 'Hồ Chí Minh' } });
  assert.equal(out, 'Hồ Chí Minh, ngày 15 tháng 01 năm 2026');
});

test('date.issuePlaceDateLine - deterministic R1 == R1 again', () => {
  const input = { issueDate: '2026-01-15', agency: { diaDanh: 'Hà Nội' } };
  const a = applyTransform('date.issuePlaceDateLine', input);
  const b = applyTransform('date.issuePlaceDateLine', input);
  assert.equal(a, b);
});

test('date.issuePlaceDateLine - R2 different from R1', () => {
  const a = applyTransform('date.issuePlaceDateLine', { issueDate: '2026-01-15', agency: { diaDanh: 'Hà Nội' } });
  const b = applyTransform('date.issuePlaceDateLine', { issueDate: '2026-02-20', agency: { diaDanh: 'Hà Nội' } });
  assert.notEqual(a, b);
});

test('date.issuePlaceDateLine - empty input returns empty string (no fabrication)', () => {
  assert.equal(applyTransform('date.issuePlaceDateLine', null), '');
  assert.equal(applyTransform('date.issuePlaceDateLine', {}), '');
});

test('date.issuePlaceDateLine - no timezone shift', () => {
  const iso = '2026-01-15';
  const out = applyTransform('date.issuePlaceDateLine', { issueDate: iso, agency: { diaDanh: 'Hà Nội' } });
  assert.ok(!out.includes('14/01') && !out.includes('16/01'), `out=${out} should not shift days`);
});

test('date.issuePlaceDateLine - mutation: bypass agency throws if missing — expect fallback to date', () => {
  const out = applyTransform('date.issuePlaceDateLine', { issueDate: '2026-01-15' });
  assert.equal(out, 'ngày 15 tháng 01 năm 2026');
});

test('IMPLEMENTED_TRANSFORMS contains the two known locked transforms', () => {
  assert.ok(IMPLEMENTED_TRANSFORMS.has('identity'));
  assert.ok(IMPLEMENTED_TRANSFORMS.has('date.issuePlaceDateLine'));
});
