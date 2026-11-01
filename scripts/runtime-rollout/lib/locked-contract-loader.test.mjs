import assert from 'node:assert/strict';
import test from 'node:test';

import { loadLockedContractCorpus } from './locked-contract-loader.mjs';

test('loads the complete locked 213-form corpus with canonical slot, field, and binding totals', () => {
  const corpus = loadLockedContractCorpus();

  assert.equal(corpus.contracts.length, 213);
  assert.deepEqual(corpus.totals, { slots: 2497, fields: 2497, bindings: 2497 });
  assert.equal(corpus.contracts[0].templateCode, 'BM-001');
  assert.equal(corpus.contracts.at(-1).templateCode, 'BM-213');
});
