import assert from 'node:assert/strict';
import test from 'node:test';

import { profileLockedContractSchema } from './inspect-locked-contract-schema.mjs';

test('profiles every locked contract property without changing the corpus', () => {
  const profile = profileLockedContractSchema();

  assert.equal(profile.contractCount, 213);
  assert.equal(profile.properties['canonicalFields[].uiComponent'].presentCount, 2497);
  assert.equal(profile.properties['renderBindings[].transform'].presentCount, 2497);
  assert.ok(profile.properties['docxSlots[].location.partName']);
});
