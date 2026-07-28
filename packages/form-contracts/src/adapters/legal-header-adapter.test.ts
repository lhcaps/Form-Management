import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { LegalHeaderAdapter } from './legal-header-adapter';
import type { FormRenderContext, SourceTargetIdentity } from '../source-slot-family-adapter';

function target(path: string): SourceTargetIdentity {
  return {
    docxPart: 'word/document.xml',
    path,
    occurrenceIndex: 0,
    structuralContext: 'paragraph',
    sourceTextPreview: `{{${path.replace('/', '.')}}}`,
    sourceHash: 'test-source',
    renderStrategy: 'INLINE_REPLACE',
  };
}

test('LEGAL_HEADER maps only present agency source targets without fabrication', () => {
  const adapter = new LegalHeaderAdapter();
  const context: FormRenderContext = {
    formCode: 'BM-TEST',
    family: 'LEGAL_HEADER',
    formInputs: {
      'agency.name': 'VKSND quận A',
      'agency.parentName': 'VKSND tối cao',
      'agency.nameUpper': 'VKSND QUẬN A',
    },
    sourceTargets: [target('agency/name'), target('agency/parentName')],
  };

  const values = adapter.buildRenderValues(context);
  assert.deepEqual(values.map((value) => value.key), ['agency.name', 'agency.parentName']);
  assert.equal(values[0]?.value, 'VKSND quận A');
  assert.equal(values[1]?.value, 'VKSND tối cao');
  assert.equal(values.some((value) => value.key === 'agency.nameUpper'), false);
});

test('LEGAL_HEADER fails validation when a required mapped agency value is absent', () => {
  const adapter = new LegalHeaderAdapter();
  const result = adapter.validateMapping({
    formCode: 'BM-TEST',
    family: 'LEGAL_HEADER',
    contractFields: [{ key: 'agency.name', required: true }],
    sourceTargets: [target('agency/name')],
    renderValues: [],
  });

  assert.equal(result.kind, 'FAIL');
  if (result.kind === 'FAIL') assert.deepEqual(result.missingRequired, ['agency.name']);
});
