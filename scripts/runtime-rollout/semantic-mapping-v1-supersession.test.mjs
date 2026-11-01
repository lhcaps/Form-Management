import test from 'node:test';
import assert from 'node:assert/strict';

import { assertV1IsNonExecutable } from './semantic-mapping-v1-supersession.mjs';

test('rejects a v1 mapping package that lacks explicit supersession metadata', () => {
  assert.throws(
    () => assertV1IsNonExecutable({ schema: 'qllaw.213.legal_semantic_mapping/v1' }),
    /SUPERSEDED_UNTRUSTED_V1/,
  );
});

test('accepts a v1 package explicitly frozen for v2 replacement', () => {
  assert.doesNotThrow(() => assertV1IsNonExecutable({
    status: 'SUPERSEDED_UNTRUSTED_V1', executable: false, reviewable: false,
    supersededBy: 'qllaw.213.legal_semantic_mapping/v2',
  }));
});
