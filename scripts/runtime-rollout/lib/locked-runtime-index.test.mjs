import { deepEqual, ok, rejects, throws } from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import path from 'node:path';

import {
  assertCurrentCorpusParity,
  assertCurrentNormalizedSourceParity,
  assertNoDeprecatedAliasUse,
  clearCachedIndex,
  enumerateLockedIndex,
  getLockedBindingByField,
  getLockedBindingBySlot,
  getLockedField,
  getLockedForm,
  getLockedSlot,
  loadLockedRuntimeIndex,
  validateLockedRuntimeIndex,
} from './locked-runtime-index.mjs';

test('loadLockedRuntimeIndex returns 213 forms with the expected schema', () => {
  clearCachedIndex();
  const index = loadLockedRuntimeIndex();
  deepEqual(index.contractCount, 213);
  deepEqual(index.schema, 'qllaw.213.locked_contract_runtime_index/v2.1');
});

test('every form has runtimeView, auditView, rawLockedContract, deprecated', () => {
  const index = loadLockedRuntimeIndex();
  for (const form of index.forms) {
    ok(form.runtimeView, `${form.identity.templateCode} missing runtimeView`);
    ok(form.auditView, `${form.identity.templateCode} missing auditView`);
    ok(form.rawLockedContract, `${form.identity.templateCode} missing rawLockedContract`);
    ok(form.deprecated && form.deprecated.fields && form.deprecated.fields.deprecated === true);
  }
});

test('enumerateLockedIndex reports 2497 fields / 2497 slots / 2497 bindings', () => {
  const index = loadLockedRuntimeIndex();
  const { fields, slots, bindings } = enumerateLockedIndex(index);
  deepEqual(fields.length, 2497);
  deepEqual(slots.length, 2497);
  deepEqual(bindings.length, 2497);
});

test('getLockedForm/getLockedField/getLockedSlot/getLockedBindingBySlot all work', () => {
  const index = loadLockedRuntimeIndex();
  const form = getLockedForm(index, 'BM-001');
  deepEqual(form.identity.templateCode, 'BM-001');
  const field = getLockedField(index, 'BM-001', form.runtimeView.canonicalFields[0].path);
  ok(field.path);
  const slot = getLockedSlot(index, 'BM-001', form.runtimeView.docxSlots[0].slotId);
  ok(slot.slotId);
  const binding = getLockedBindingBySlot(index, 'BM-001', slot.slotId);
  deepEqual(binding.slotId, slot.slotId);
  const bindingByField = getLockedBindingByField(index, 'BM-001', binding.from);
  deepEqual(bindingByField.slotId, binding.slotId);
});

test('getLockedForm throws for unknown code (fail closed)', async () => {
  const index = loadLockedRuntimeIndex();
  // BM-999 is malformed (must be BM-XXX with exactly 3 digits).
  await rejects(async () => getLockedForm(index, 'BM-999'), /FAIL_CLOSED/);
  await rejects(async () => getLockedForm(index, 'not-a-code'), /FAIL_CLOSED/);
  // BM-321 is well-formed but does not exist in 213 forms.
  await rejects(async () => getLockedForm(index, 'BM-321'), /FAIL_CLOSED/);
});

test('assertNoDeprecatedAliasUse fails when alias key is present', () => {
  throws(() => assertNoDeprecatedAliasUse(['runtimeView', 'fields']), /FAIL_CLOSED/);
  throws(() => assertNoDeprecatedAliasUse(['slots']), /FAIL_CLOSED/);
  assertNoDeprecatedAliasUse(['runtimeView', 'auditView']);
});

test('assertCurrentCorpusParity passes against the on-disk corpus', () => {
  const index = loadLockedRuntimeIndex();
  const result = assertCurrentCorpusParity(index);
  ok(result.ok);
  deepEqual(result.actual, index.hashes.corpusByteSha256);
});

test('assertCurrentCorpusParity fails when corpus byte is tampered', () => {
  // Copy the locked corpus to a tmp dir, change one file, expect failure.
  const tmpDir = mkdtempSync(`${tmpdir()}/qllaw-loader-`);
  try {
    const src = 'docs/audit/docx/contracts/locked';
    const files = readdirSync(src).filter((f) => f.endsWith('.contract.locked.json'));
    for (const f of files) {
      writeFileSync(path.join(tmpDir, f), readFileSync(path.join(src, f)));
    }
    const index = loadLockedRuntimeIndex();
    // First sanity check: tmpDir matches the index because the bytes are identical copies.
    assertCurrentCorpusParity(index, { contractsDir: tmpDir });
    // Now mutate one byte.
    const target = path.join(tmpDir, files[0]);
    const before = readFileSync(target, 'utf8');
    writeFileSync(target, before + ' ');
    throws(() => assertCurrentCorpusParity(index, { contractsDir: tmpDir }), /FAIL_CLOSED/);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('validateLockedRuntimeIndex is the canonical safe entry', () => {
  clearCachedIndex();
  const { ok: result, index } = validateLockedRuntimeIndex();
  ok(result === true);
  ok(index.contractCount === 213);
});
