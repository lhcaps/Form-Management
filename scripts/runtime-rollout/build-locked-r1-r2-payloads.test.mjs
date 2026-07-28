import { deepEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { buildAllPayloads } from './build-locked-r1-r2-payloads.mjs';

test('payload generator produces R1/R2/validation for all 213 forms', () => {
  const { totalForms } = buildAllPayloads();
  deepEqual(totalForms, 213);
});

test('every form has R1-input.json, R2-input.json, payload-validation.json', () => {
  const root = 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads';
  for (let i = 1; i <= 213; i += 1) {
    const code = `BM-${String(i).padStart(3, '0')}`;
    const dir = path.join(root, code);
    ok(existsSync(path.join(dir, 'R1-input.json')), `${code}/R1-input.json missing`);
    ok(existsSync(path.join(dir, 'R2-input.json')), `${code}/R2-input.json missing`);
    ok(existsSync(path.join(dir, 'payload-validation.json')), `${code}/payload-validation.json missing`);
  }
});

test('every form has allValid=true, r1r2Different=true, noCollisions=true', () => {
  const root = 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads';
  for (let i = 1; i <= 213; i += 1) {
    const code = `BM-${String(i).padStart(3, '0')}`;
    const validation = JSON.parse(readFileSync(path.join(root, code, 'payload-validation.json'), 'utf8'));
    ok(validation.r1r2Different, `${code} R1==R2 somewhere`);
    ok(validation.noCollisions, `${code} has colliding R1 values`);
    for (const f of validation.fields) {
      if (!f.isStatic) {
        ok(f.r1Valid, `${code}.${f.path} R1 invalid: ${f.r1Reason}`);
        ok(f.r2Valid, `${code}.${f.path} R2 invalid: ${f.r2Reason}`);
      }
    }
  }
});

test('R1 and R2 differ for non-static fields', () => {
  const root = 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads';
  const r1 = JSON.parse(readFileSync(path.join(root, 'BM-001', 'R1-input.json'), 'utf8'));
  const r2 = JSON.parse(readFileSync(path.join(root, 'BM-001', 'R2-input.json'), 'utf8'));
  const allKeys = new Set([...Object.keys(r1), ...Object.keys(r2)]);
  for (const key of allKeys) {
    if (r1[key] === undefined || r2[key] === undefined) continue;
    ok(JSON.stringify(r1[key]) !== JSON.stringify(r2[key]), `BM-001.${key} R1==R2`);
  }
});
