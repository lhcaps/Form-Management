import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLockedContractIndex } from './build-locked-contract-index.mjs';

test('builds one deterministic authority entry for every locked contract', () => {
  const first = buildLockedContractIndex();
  const second = buildLockedContractIndex();

  assert.equal(first.contractCount, 213);
  assert.deepEqual(first.totals, { slots: 2497, fields: 2497, bindings: 2497 });
  assert.equal(first.canonicalHash, second.canonicalHash);
  assert.equal(first.forms['BM-001'].fields[0].path, 'document.issuePlaceDateLine');
  assert.equal(first.forms['BM-213'].templateCode, 'BM-213');
});

test('preserves each locked contract losslessly in the v2 runtime index', () => {
  const index = buildLockedContractIndex({ version: 'v2' });

  assert.equal(index.schemaVersion, 'qllaw.213.locked_contract_runtime_index/v2');
  assert.equal(index.forms['BM-001'].rawLockedContract.docxSlots[0].location.partName, 'word/document.xml');
  assert.equal(index.forms['BM-001'].contractFileSha256.length, 64);
  assert.equal(index.corpusFileSha256.length, 64);
});
