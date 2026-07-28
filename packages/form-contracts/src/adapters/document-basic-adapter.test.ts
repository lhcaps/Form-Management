import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { DocumentBasicAdapter } from './document-basic-adapter';
import type { FormRenderContext, SourceTargetIdentity } from '../source-slot-family-adapter';

const sourceTarget: SourceTargetIdentity = {
  docxPart: 'word/document.xml',
  path: 'document/documentCode',
  occurrenceIndex: 0,
  structuralContext: 'paragraph',
  sourceTextPreview: '{{document.documentCode}}',
  sourceHash: 'test-source',
  renderStrategy: 'INLINE_REPLACE',
};

test('DOCUMENT_BASIC maps documentCode only when its exact DOCX target is present', () => {
  const adapter = new DocumentBasicAdapter();
  const context: FormRenderContext = {
    formCode: 'BM-TEST',
    family: 'DOCUMENT_BASIC',
    formInputs: { 'document.documentCode': '123/QD-VKS' },
    sourceTargets: [sourceTarget],
  };
  const values = adapter.buildRenderValues(context);
  assert.equal(values.length, 1);
  assert.equal(values[0]?.key, 'document.documentCode');
  assert.equal(values[0]?.value, '123/QD-VKS');
});

test('DOCUMENT_BASIC fails a required mapping without a rendered source value', () => {
  const result = new DocumentBasicAdapter().validateMapping({
    formCode: 'BM-TEST',
    family: 'DOCUMENT_BASIC',
    contractFields: [{ key: 'document.documentCode', required: true }],
    sourceTargets: [sourceTarget],
    renderValues: [],
  });
  assert.equal(result.kind, 'FAIL');
});
