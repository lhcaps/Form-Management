import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  SEMANTIC_RENORMALIZATIONS,
  buildReplacementIndex,
  replaceIndexedOccurrences,
  syncContract,
  taxonomyNamespaceForPath,
} from '../scripts/audit/apply-docx-source-semantic-renormalization.mjs';

const fieldTaxonomy = JSON.parse(readFileSync('docs/contracts/field-taxonomy.json', 'utf8'));
const namespaces = new Set(Object.keys(fieldTaxonomy.namespaces));

test('source-backed renormalization maps every replacement into field taxonomy', () => {
  for (const [templateCode, replacements] of Object.entries(SEMANTIC_RENORMALIZATIONS)) {
    assert.ok(replacements.length > 0, `${templateCode} must have replacements`);
    for (const replacement of replacements) {
      assert.ok(
        namespaces.has(taxonomyNamespaceForPath(replacement.to)),
        `${templateCode} replacement ${replacement.to} must use a known namespace`,
      );
    }
  }
});

test('source-backed renormalization never binds blocked repeated placeholders as one field', () => {
  const index = buildReplacementIndex(SEMANTIC_RENORMALIZATIONS);

  assert.deepEqual(
    index['BM-052']['recipients.personLine6'].map((item) => item.to),
    [
      'person.otherName',
      'person.birthInfoLine',
      'person.nationalityEthnicityReligionLine',
    ],
  );
  assert.notEqual(
    index['BM-063']['document.fullDocumentCode8'].some(
      (item) => item.to === 'document.fullDocumentCode',
    ),
    true,
    'BM-063 document.fullDocumentCode8 must not be rebound to the formal document code',
  );
  assert.equal(
    new Set(index['BM-066']['recipients.personLine4'].map((item) => item.to)).size,
    index['BM-066']['recipients.personLine4'].length,
    'BM-066 recipients.personLine4 occurrences must split to distinct semantic fields',
  );
});

test('source-backed sync removes canonical fields that are no longer render-bound', () => {
  const next = syncContract(
    {
      canonicalFields: [
        { path: 'legacy.detached', label: 'Legacy detached', source: 'manual' },
        { path: 'person.fullName', label: 'Full name', source: 'manual' },
      ],
      docxSlots: [
        { slotId: 'legacy.detached' },
        { slotId: 'person.fullName' },
      ],
      renderBindings: [
        { slotId: 'legacy.detached', from: 'legacy.detached' },
        { slotId: 'person.fullName', from: 'person.fullName' },
      ],
      extractionSource: { sha256: 'old' },
    },
    [
      {
        to: 'person.fullName',
        label: 'Full name',
        source: 'manual',
        section: 'Person',
      },
    ],
    new Set(['person.fullName']),
    '{{person.fullName}}',
    'new-sha',
    '2026-06-29T00:00:00.000Z',
  );

  assert.deepEqual(next.canonicalFields.map((field) => field.path), ['person.fullName']);
  assert.deepEqual(next.docxSlots.map((slot) => slot.slotId), ['person.fullName']);
  assert.deepEqual(next.renderBindings.map((binding) => binding.slotId), ['person.fullName']);
  assert.equal(next.renderRepairEvidence.changes.removedFields, 1);
});

test('source-backed replacement is idempotent after placeholders were already renamed', () => {
  const result = replaceIndexedOccurrences('{{person.fullName}}', [
    {
      from: 'legacy.detached',
      occurrenceIndex: 0,
      to: 'person.fullName',
    },
  ]);

  assert.equal(result.documentXml, '{{person.fullName}}');
  assert.deepEqual(result.applied, []);
});
