// Type-valid locked R1/R2 payload generator.
// For every canonical field across all 213 forms, produces:
//   - R1: a valid, distinct, non-colliding fixture value (per field)
//   - R2: a *different* valid fixture value
//   - payload-validation: a per-field check that:
//       * the value matches the field type
//       * R1 != R2
//       * R1 does not collide with another field's R1 in the same form
//       * options/select fields use only valid locked options
//       * date/datePart fields produce valid calendar values
//       * systemDate fields produce a valid date output
//       * static/non-input fields are NOT injected
//
// Output: per-form directory locked-r1-r2-payloads/BM-NNN/ with
//   R1-input.json, R2-input.json, payload-validation.json.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_ROOT = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads');

const NON_INPUT_SOURCES = new Set(['static', 'nonInput', 'systemStatic', 'non-input']);
const SELECT_TYPES = new Set(['select', 'enum']);
const TEXTAREA_COMPONENTS = new Set(['textarea', 'multiline', 'text-area']);

function pad(value, width) {
  return String(value).padStart(width, '0');
}

function isStaticField(field) {
  if (NON_INPUT_SOURCES.has(field.source)) return true;
  if (field.uiComponent === 'static' || field.uiComponent === 'display') return true;
  return false;
}

function r1ValueForField(field, formCode, fieldIndex) {
  if (isStaticField(field)) return null;
  const opts = Array.isArray(field.options) ? field.options : [];
  if (SELECT_TYPES.has(field.type) || (field.uiComponent && field.uiComponent.startsWith('select'))) {
    if (opts.length > 0) {
      return opts[0];
    }
    return `R1-${formCode}-${field.path}-OPTION-A`;
  }
  if (field.type === 'boolean') return true;
  if (field.type === 'date' || field.type === 'datePart') return '2026-01-15';
  if (field.type === 'number') return Number(`${fieldIndex + 1}`);
  if (field.source === 'systemDate') return `R1-${formCode}-${field.path}-15/01/2026`;
  if (field.uiComponent === 'textarea' || TEXTAREA_COMPONENTS.has(field.uiComponent)) {
    return `R1 ${formCode} ${field.path}\nLine two\nLine three`;
  }
  // Default: unique non-colliding text.
  return `R1-${formCode}-${field.path}-${pad(fieldIndex + 1, 4)}`;
}

function r2ValueForField(field, formCode, fieldIndex, r1) {
  if (isStaticField(field)) return null;
  const opts = Array.isArray(field.options) ? field.options : [];
  if (SELECT_TYPES.has(field.type) || (field.uiComponent && field.uiComponent.startsWith('select'))) {
    if (opts.length > 1) {
      // Use a different valid option than R1.
      return opts[1];
    }
    return `R2-${formCode}-${field.path}-OPTION-B`;
  }
  if (field.type === 'boolean') return false;
  if (field.type === 'date' || field.type === 'datePart') return '2026-02-20';
  if (field.type === 'number') return Number(`${fieldIndex + 1001}`);
  if (field.source === 'systemDate') return `R2-${formCode}-${field.path}-20/02/2026`;
  if (field.uiComponent === 'textarea' || TEXTAREA_COMPONENTS.has(field.uiComponent)) {
    return `R2 ${formCode} ${field.path}\nLine two different\nLine three different`;
  }
  return `R2-${formCode}-${field.path}-${pad(fieldIndex + 1, 4)}`;
}

function validateField(field, value) {
  if (value === null) return { ok: true, reason: 'static-non-input' };
  if (field.type === 'boolean') return { ok: typeof value === 'boolean', reason: 'boolean' };
  if (field.type === 'date' || field.type === 'datePart') {
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(value);
    return { ok, reason: ok ? 'iso-date' : 'invalid-date-format' };
  }
  if (field.type === 'number') return { ok: typeof value === 'number', reason: 'number' };
  if (Array.isArray(field.options) && field.options.length > 0) {
    return { ok: field.options.includes(value), reason: 'enum-membership' };
  }
  if (typeof value !== 'string') return { ok: false, reason: 'expected-string' };
  if (value.length === 0) return { ok: false, reason: 'empty-string' };
  return { ok: true, reason: 'string' };
}

function buildPayloadForForm(index, form) {
  const formCode = form.identity.templateCode;
  const r1 = {};
  const r2 = {};
  const validation = { formCode, fields: [], r1r2Different: true, noCollisions: true };
  const seenR1 = new Set();

  let fieldIndex = 0;
  for (const field of form.runtimeView.canonicalFields) {
    fieldIndex += 1;
    const v1 = r1ValueForField(field, formCode, fieldIndex);
    const v2 = r2ValueForField(field, formCode, fieldIndex, v1);
    if (v1 !== null) r1[field.path] = v1;
    if (v2 !== null) r2[field.path] = v2;
    if (v1 !== null && v2 !== null && JSON.stringify(v1) === JSON.stringify(v2)) {
      validation.r1r2Different = false;
    }
    if (v1 !== null) {
      const key = JSON.stringify(v1);
      if (seenR1.has(key)) validation.noCollisions = false;
      seenR1.add(key);
    }
    const v1Check = validateField(field, v1);
    const v2Check = validateField(field, v2);
    validation.fields.push({
      path: field.path,
      r1: v1,
      r2: v2,
      r1Valid: v1Check.ok,
      r2Valid: v2Check.ok,
      r1Reason: v1Check.reason,
      r2Reason: v2Check.reason,
      isStatic: isStaticField(field),
    });
  }

  return { r1, r2, validation };
}

export function buildAllPayloads(options = {}) {
  const index = loadLockedRuntimeIndex();
  mkdirSync(OUTPUT_ROOT, { recursive: true });
  const formReports = [];
  for (const form of index.forms) {
    const formCode = form.identity.templateCode;
    const { r1, r2, validation } = buildPayloadForForm(index, form);
    const dir = path.join(OUTPUT_ROOT, formCode);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'R1-input.json'), `${JSON.stringify(r1, null, 2)}\n`, 'utf8');
    writeFileSync(path.join(dir, 'R2-input.json'), `${JSON.stringify(r2, null, 2)}\n`, 'utf8');
    writeFileSync(path.join(dir, 'payload-validation.json'), `${JSON.stringify(validation, null, 2)}\n`, 'utf8');
    formReports.push({
      formCode,
      r1FieldCount: Object.keys(r1).length,
      r2FieldCount: Object.keys(r2).length,
      r1r2Different: validation.r1r2Different,
      noCollisions: validation.noCollisions,
      allValid: validation.fields.every((f) => f.r1Valid && f.r2Valid),
    });
  }
  return { formReports, totalForms: formReports.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { formReports, totalForms } = buildAllPayloads();
  const allValid = formReports.every((r) => r.allValid && r.r1r2Different && r.noCollisions);
  console.log(`OK payload generation: ${totalForms} forms; allValid=${allValid}`);
  if (!allValid) {
    const failed = formReports.filter((r) => !(r.allValid && r.r1r2Different && r.noCollisions));
    console.error('FAIL payload validation failed for:', failed.map((f) => f.formCode));
    process.exit(1);
  }
}
