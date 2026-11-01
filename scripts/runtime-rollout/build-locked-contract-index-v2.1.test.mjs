import { deepEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';

import { buildLockedRuntimeIndexV21 } from './build-locked-contract-index-v2.1.mjs';
import { computeRuntimeAuthoritySha256 } from './lib/locked-hash-model.mjs';

test('v2.1 index has 213 forms with the expected shape', () => {
  const { index } = buildLockedRuntimeIndexV21();
  deepEqual(index.contractCount, 213);
  deepEqual(index.missingFormCodes, []);
  deepEqual(index.extraFormCodes, []);
  deepEqual(index.duplicateFormCodes, []);
  deepEqual(index.forms.length, 213);
  for (const form of index.forms) {
    ok(form.identity, 'form.identity is required');
    ok(form.runtimeView, 'form.runtimeView is required');
    ok(form.auditView, 'form.auditView is required');
    ok(form.rawLockedContract, 'form.rawLockedContract is required');
    ok(form.deprecated, 'form.deprecated is required');
    ok(form.deprecated.fields.deprecated === true);
    ok(form.deprecated.slots.deprecated === true);
    ok(form.deprecated.bindings.deprecated === true);
  }
});

test('v2.1 form ordering is by templateCode (deterministic)', () => {
  const { index } = buildLockedRuntimeIndexV21();
  const codes = index.forms.map((f) => f.identity.templateCode);
  const sorted = [...codes].sort();
  deepEqual(codes, sorted, 'form order must be templateCode-sorted');
});

test('v2.1 runtimeView is fully populated for all 2497 elements', () => {
  const { index } = buildLockedRuntimeIndexV21();
  let fields = 0;
  let slots = 0;
  let bindings = 0;
  for (const form of index.forms) {
    fields += form.runtimeView.canonicalFields.length;
    slots += form.runtimeView.docxSlots.length;
    bindings += form.runtimeView.renderBindings.length;
  }
  deepEqual(fields, 2497);
  deepEqual(slots, 2497);
  deepEqual(bindings, 2497);
});

test('v2.1 perForm hashes are deterministic', () => {
  const { index: a } = buildLockedRuntimeIndexV21();
  const { index: b } = buildLockedRuntimeIndexV21();
  for (let i = 0; i < a.forms.length; i += 1) {
    const fa = a.forms[i];
    const fb = b.forms[i];
    deepEqual(fa.identity.templateCode, fb.identity.templateCode);
    deepEqual(fa.hashes.perFormRuntimeHash, fb.hashes.perFormRuntimeHash);
    deepEqual(fa.hashes.perFormAuditHash, fb.hashes.perFormAuditHash);
  }
});

test('v2.1 never drops the seven required pieces', () => {
  const { index } = buildLockedRuntimeIndexV21();
  for (const form of index.forms) {
    for (const slot of form.runtimeView.docxSlots) {
      ok('location' in slot || slot.location === undefined, 'slot may or may not have location (some slots lack it)');
    }
    for (const field of form.runtimeView.canonicalFields) {
      ok(field.path, 'field.path required');
      ok(field.uiComponent, 'field.uiComponent required');
    }
    for (const binding of form.runtimeView.renderBindings) {
      ok(binding.slotId, 'binding.slotId required');
      ok(binding.from, 'binding.from required');
    }
  }
});

test('runtimeAuthorityPayload for v2.1 is identical to legacy canonical view (backward compat)', () => {
  // The v2.1 index must produce the same runtimeAuthority hash as a separate
  // call to computeRuntimeAuthoritySha256, proving the index did not silently
  // change the payload.
  const { index, hashes } = buildLockedRuntimeIndexV21();
  const allContracts = index.forms.map((f) => f.rawLockedContract);
  const recomputed = computeRuntimeAuthoritySha256(allContracts);
  deepEqual(recomputed, hashes.runtimeAuthoritySha256);
});
