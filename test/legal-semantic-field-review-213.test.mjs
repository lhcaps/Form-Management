import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';

import PizZip from 'pizzip';

import {
  buildLegalSemanticFieldReview,
  csvEscape,
  dispositionForField,
  writeLegalSemanticFieldReview,
} from '../scripts/audit/build-legal-semantic-field-review-213.mjs';

function makeRoot() {
  return mkdtempSync(join(tmpdir(), 'qllaw-legal-review-'));
}

async function writeContract(root, contract) {
  const dir = join(root, 'docs', 'audit', 'docx', 'contracts', 'locked');
  await mkdir(dir, { recursive: true });
  writeFileSync(
    join(dir, `${contract.templateCode}__fixture.contract.locked.json`),
    `${JSON.stringify(contract, null, 2)}\n`,
  );
}

async function writeNormalizedDocx(root, templateCode, xml) {
  const dir = join(root, 'storage', 'templates', 'normalized-docx', templateCode);
  await mkdir(dir, { recursive: true });
  const zip = new PizZip();
  zip.file('word/document.xml', xml);
  writeFileSync(
    join(dir, `${templateCode}_normalized.docx`),
    zip.generate({ type: 'nodebuffer' }),
  );
}

test('buildLegalSemanticFieldReview emits one row per reviewRequired canonical field', async () => {
  const root = makeRoot();
  try {
    await writeContract(root, {
      templateCode: 'BM-999',
      canonicalFields: [
        {
          path: 'document.fullDocumentCode',
          label: 'Document code',
          source: 'manual',
          required: false,
          uiComponent: 'text',
          reviewRequired: true,
          reviewEvidence: { context: 'So: {{document.fullDocumentCode}}' },
        },
        {
          path: 'document.alreadyReviewed',
          label: 'Reviewed',
          source: 'manual',
          required: false,
          uiComponent: 'text',
          reviewRequired: false,
        },
      ],
      docxSlots: [
        {
          slotId: 'document.fullDocumentCode',
          context: 'So: {{document.fullDocumentCode}}',
          evidence: {
            rawPattern: '{{document.fullDocumentCode}}',
            textBefore: 'So:',
            textAfter: '',
          },
        },
      ],
      renderBindings: [
        {
          slotId: 'document.fullDocumentCode',
          from: 'document.fullDocumentCode',
          transform: 'identity',
          fallback: '',
        },
      ],
    });

    const review = await buildLegalSemanticFieldReview(root, {
      generatedAt: '2026-06-29T00:00:00.000Z',
    });

    assert.equal(review.summary.totalLockedForms, 1);
    assert.equal(review.summary.totalCanonicalFields, 2);
    assert.equal(review.summary.reviewRequiredFields, 1);
    assert.equal(review.summary.formsNeedingReview, 1);
    assert.equal(review.rows.length, 1);
    assert.equal(review.rows[0].templateCode, 'BM-999');
    assert.equal(review.rows[0].fieldPath, 'document.fullDocumentCode');
    assert.equal(review.rows[0].docxSlotSlotId, 'document.fullDocumentCode');
    assert.equal(review.rows[0].docxSlotEvidenceRawPattern, '{{document.fullDocumentCode}}');
    assert.equal(review.rows[0].disposition, 'APPROVE_AS_IS');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('buildLegalSemanticFieldReview records actual DOCX token context for semantic evidence', async () => {
  const root = makeRoot();
  try {
    await writeContract(root, {
      templateCode: 'BM-998',
      canonicalFields: [
        {
          path: 'document.soQuyet',
          label: 'Slot from Wave 02 DOCX remediation',
          source: 'manual',
          required: false,
          uiComponent: 'text',
          reviewRequired: true,
        },
      ],
      docxSlots: [
        {
          slotId: 'document.soQuyet',
          context: 'Legacy: {{document.field1}}',
          evidence: {
            rawPattern: '{{document.field1}}',
            textBefore: 'Legacy:',
            textAfter: '',
          },
        },
      ],
      renderBindings: [
        {
          slotId: 'document.soQuyet',
          from: 'document.soQuyet',
          transform: 'identity',
          fallback: '',
        },
      ],
    });
    const noisyRun = `<w:rPr><w:rFonts w:ascii="${'Times New Roman '.repeat(
      40,
    )}"/></w:rPr>`;
    await writeNormalizedDocx(
      root,
      'BM-998',
      [
        '<w:document><w:body><w:p><w:r>',
        noisyRun,
        '<w:t>',
        'Số: {{ document.soQuyet }} ngày ban hành quyết định.',
        '</w:t></w:r></w:p></w:body></w:document>',
      ].join(''),
    );

    const review = await buildLegalSemanticFieldReview(root, {
      generatedAt: '2026-06-29T00:00:00.000Z',
    });

    assert.equal(review.rows.length, 1);
    assert.equal(review.rows[0].actualDocxHasSemanticToken, true);
    assert.equal(review.rows[0].actualDocxEvidenceRawPattern, '{{ document.soQuyet }}');
    assert.equal(review.rows[0].actualDocxEvidenceTextBefore, 'Số:');
    assert.equal(review.rows[0].actualDocxEvidenceTextAfter, 'ngày ban hành quyết định.');
    assert.match(review.rows[0].actualDocxContext, /Số: \{\{ document\.soQuyet \}\} ngày/);
    assert.doesNotMatch(review.rows[0].actualDocxContext, /Times New Roman|w:/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('buildLegalSemanticFieldReview emits rows for slot-only reviewRequired flags', async () => {
  const root = makeRoot();
  try {
    await writeContract(root, {
      templateCode: 'BM-997',
      canonicalFields: [
        {
          path: 'document.documentCode',
          label: 'So van ban',
          source: 'manual',
          required: false,
          uiComponent: 'text',
          reviewRequired: false,
        },
      ],
      docxSlots: [
        {
          slotId: 'document.documentCode',
          reviewRequired: true,
          context: 'So: {{document.documentCode}}',
          evidence: {
            rawPattern: '{{document.field1}}',
            textBefore: 'So:',
            textAfter: '',
          },
        },
      ],
      renderBindings: [
        {
          slotId: 'document.documentCode',
          from: 'document.documentCode',
          transform: 'identity',
          fallback: '',
          reviewRequired: false,
        },
      ],
    });
    await writeNormalizedDocx(
      root,
      'BM-997',
      '<w:document><w:body><w:p><w:r><w:t>So: {{document.documentCode}}</w:t></w:r></w:p></w:body></w:document>',
    );

    const review = await buildLegalSemanticFieldReview(root, {
      generatedAt: '2026-06-29T00:00:00.000Z',
    });

    assert.equal(review.summary.reviewRequiredFields, 1);
    assert.equal(review.rows[0].fieldPath, 'document.documentCode');
    assert.equal(review.rows[0].fieldReviewRequired, false);
    assert.equal(review.rows[0].docxSlot.reviewRequired, true);
    assert.equal(review.rows[0].actualDocxHasSemanticToken, true);
    assert.equal(review.rows[0].disposition, 'APPROVE_AS_IS');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('dispositionForField keeps generic or weakly evidenced fields under human review', () => {
  const result = dispositionForField({
    field: {
      path: 'document.field1',
      label: 'Blank',
      source: 'manual',
      required: false,
      uiComponent: 'text',
      reviewRequired: true,
    },
    slot: {
      slotId: 'document.field1',
      context: '{{document.field1}}',
      evidence: { rawPattern: '{{document.field1}}' },
    },
    binding: { slotId: 'document.field1', from: 'document.field1' },
  });

  assert.equal(result.disposition, 'NEEDS_HUMAN_REVIEW');
  assert.equal(result.confidence, 'LOW');
  assert.match(result.notes, /generic path/);
});

test('dispositionForField proposes textarea for long narrative fields', () => {
  const result = dispositionForField({
    field: {
      path: 'legalBasis.legalBasisLine',
      label: 'Legal basis',
      source: 'manual',
      required: false,
      uiComponent: 'text',
      reviewRequired: true,
    },
    slot: {
      slotId: 'legalBasis.legalBasisLine',
      context: 'Legal basis: {{legalBasis.legalBasisLine}}',
      evidence: { rawPattern: '{{legalBasis.legalBasisLine}}' },
    },
    binding: {
      slotId: 'legalBasis.legalBasisLine',
      from: 'legalBasis.legalBasisLine',
    },
  });

  assert.equal(result.disposition, 'FIX_UI_COMPONENT');
  assert.equal(result.confidence, 'MEDIUM');
  assert.equal(result.proposedUiComponent, 'textarea');
});

test('dispositionForField accepts stale rawPattern when actual DOCX has semantic token', () => {
  const result = dispositionForField({
    field: {
      path: 'document.fullDocumentCode',
      label: 'Document code',
      source: 'manual',
      required: false,
      uiComponent: 'text',
      reviewRequired: true,
    },
    slot: {
      slotId: 'document.fullDocumentCode',
      context: 'No. {{document.fullDocumentCode}}',
      evidence: { rawPattern: '{{document.field1}}' },
    },
    binding: {
      slotId: 'document.fullDocumentCode',
      from: 'document.fullDocumentCode',
    },
    actualDocxHasSemanticToken: true,
  });

  assert.equal(result.disposition, 'APPROVE_AS_IS');
  assert.equal(result.confidence, 'HIGH');
  assert.match(result.notes, /actual DOCX token present/);
});

test('dispositionForField treats wave-remediation placeholder labels as generic', () => {
  const result = dispositionForField({
    field: {
      path: 'document.fullDocumentCode',
      label: 'Slot from Wave 02 DOCX remediation',
      source: 'manual',
      required: false,
      uiComponent: 'text',
      reviewRequired: true,
    },
    slot: {
      slotId: 'document.fullDocumentCode',
      context: 'No. {{document.fullDocumentCode}}',
      evidence: { rawPattern: '{{document.fullDocumentCode}}' },
    },
    binding: {
      slotId: 'document.fullDocumentCode',
      from: 'document.fullDocumentCode',
    },
    actualDocxHasSemanticToken: true,
  });

  assert.equal(result.disposition, 'FIX_LABEL');
  assert.equal(result.confidence, 'MEDIUM');
});

test('writeLegalSemanticFieldReview writes JSON, Markdown, and CSV artifacts', async () => {
  const root = makeRoot();
  try {
    await writeContract(root, {
      templateCode: 'BM-999',
      canonicalFields: [
        {
          path: 'document.summaryLine',
          label: 'Summary line',
          source: 'manual',
          required: false,
          uiComponent: 'textarea',
          reviewRequired: true,
        },
      ],
      docxSlots: [
        {
          slotId: 'document.summaryLine',
          context: 'Summary: {{document.summaryLine}}',
          evidence: {
            rawPattern: '{{document.summaryLine}}',
            textBefore: 'Summary:',
            textAfter: '',
          },
        },
      ],
      renderBindings: [
        {
          slotId: 'document.summaryLine',
          from: 'document.summaryLine',
          transform: 'identity',
          fallback: '',
        },
      ],
    });

    const review = await buildLegalSemanticFieldReview(root, {
      generatedAt: '2026-06-29T00:00:00.000Z',
    });
    const paths = await writeLegalSemanticFieldReview(root, review, {
      outDir: join(root, 'docs', 'audit', 'legal-semantic-field-review-213'),
    });

    assert.equal(JSON.parse(readFileSync(paths.jsonPath, 'utf8')).rows.length, 1);
    assert.match(readFileSync(paths.mdPath, 'utf8'), /Legal Semantic Field Review 213/);
    const csv = readFileSync(paths.csvPath, 'utf8');
    assert.match(csv, /^templateCode,lockedContractPath,field.path/m);
    assert.match(csv, /BM-999/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('csvEscape quotes commas, quotes, and newlines', () => {
  assert.equal(csvEscape('plain'), 'plain');
  assert.equal(csvEscape('a,b'), '"a,b"');
  assert.equal(csvEscape('a"b'), '"a""b"');
  assert.equal(csvEscape('a\nb'), '"a\nb"');
});
