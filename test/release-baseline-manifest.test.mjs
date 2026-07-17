import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyReleasePath } from '../scripts/release/create-release-baseline-manifest.mjs';

test('classifies explicit local-only artifacts without ignoring release sources', () => {
  assert.equal(classifyReleasePath('.artifacts/docker.log'), 'LOCAL_ONLY');
  assert.equal(classifyReleasePath('verify-current-state.json'), 'LOCAL_ONLY');
  assert.equal(classifyReleasePath('quanlynew-main.zip'), 'LOCAL_ONLY');
  assert.equal(classifyReleasePath('storage/generated/output.docx'), 'LOCAL_ONLY');
  assert.equal(classifyReleasePath('apps/api/src/main.ts'), 'RELEASE');
  assert.equal(classifyReleasePath('storage/templates/normalized-docx/BM-001/BM-001_normalized.docx'), 'RELEASE');
});
