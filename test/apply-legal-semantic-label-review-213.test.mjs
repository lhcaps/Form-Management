import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';

import {
  applyLegalSemanticLabelReview,
  buildLabelReviewEvidence,
  DEFAULT_LABEL_DECISIONS,
} from '../scripts/audit/apply-legal-semantic-label-review-213.mjs';

function makeRoot() {
  return mkdtempSync(join(tmpdir(), 'qllaw-apply-label-review-'));
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test('applyLegalSemanticLabelReview fixes only curated label decisions with actual DOCX evidence', async () => {
  const root = makeRoot();
  try {
    const contractPath = join(
      root,
      'docs',
      'audit',
      'docx',
      'contracts',
      'locked',
      'BM-999__fixture.contract.locked.json',
    );
    const reviewPath = join(root, 'docs', 'audit', 'legal-semantic-field-review-213', 'latest.json');
    await writeJson(contractPath, {
      templateCode: 'BM-999',
      canonicalFields: [
        {
          path: 'document.soQuyet',
          label: 'Slot from Wave 02 DOCX remediation',
          source: 'manual',
          required: false,
          uiComponent: 'text',
          reviewRequired: true,
        },
        {
          path: 'document.ngayBan',
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
          reviewRequired: true,
          context: 'Legacy: {{document.field1}}',
        },
        {
          slotId: 'document.ngayBan',
          reviewRequired: true,
          context: 'Legacy: {{document.field2}}',
        },
      ],
      renderBindings: [
        {
          slotId: 'document.soQuyet',
          from: 'document.soQuyet',
          reviewRequired: true,
        },
        {
          slotId: 'document.ngayBan',
          from: 'document.ngayBan',
          reviewRequired: true,
        },
      ],
    });
    await writeJson(reviewPath, {
      rows: [
        {
          templateCode: 'BM-999',
          lockedContractPath: 'docs/audit/docx/contracts/locked/BM-999__fixture.contract.locked.json',
          fieldPath: 'document.soQuyet',
          fieldLabel: 'Slot from Wave 02 DOCX remediation',
          docxSlotSlotId: 'document.soQuyet',
          actualDocxHasSemanticToken: true,
          actualDocxContext: 'Quyet dinh so {{document.soQuyet}} ngay ...',
          actualDocxEvidenceRawPattern: '{{document.soQuyet}}',
          confidence: 'MEDIUM',
          disposition: 'FIX_LABEL',
        },
        {
          templateCode: 'BM-999',
          lockedContractPath: 'docs/audit/docx/contracts/locked/BM-999__fixture.contract.locked.json',
          fieldPath: 'document.ngayBan',
          fieldLabel: 'Slot from Wave 02 DOCX remediation',
          docxSlotSlotId: 'document.ngayBan',
          actualDocxHasSemanticToken: false,
          confidence: 'MEDIUM',
          disposition: 'FIX_LABEL',
        },
      ],
    });

    const result = await applyLegalSemanticLabelReview(root, {
      reviewPath,
      reviewedAt: '2026-06-29T00:00:00.000Z',
      reviewedBy: 'Codex legal semantic label review',
      labelDecisions: {
        'document.soQuyet': {
          label: 'So quyet dinh',
          rationale: 'Path and DOCX context identify a decision number field.',
        },
        'document.ngayBan': {
          label: 'Ngay ban hanh',
          rationale: 'Path identifies issue date.',
        },
      },
      write: true,
      report: false,
    });

    assert.deepEqual(result.summary, {
      scannedRows: 2,
      eligibleRows: 1,
      contractsChanged: 1,
      labelsFixed: 1,
      skippedRows: 1,
    });
    const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
    assert.equal(contract.canonicalFields[0].label, 'So quyet dinh');
    assert.equal(contract.canonicalFields[0].reviewRequired, false);
    assert.equal(contract.canonicalFields[0].reviewEvidence.newLabel, 'So quyet dinh');
    assert.equal(contract.docxSlots[0].reviewRequired, false);
    assert.equal(contract.renderBindings[0].reviewRequired, false);
    assert.equal(contract.canonicalFields[1].label, 'Slot from Wave 02 DOCX remediation');
    assert.equal(contract.canonicalFields[1].reviewRequired, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('buildLabelReviewEvidence records old and new labels with actual DOCX context', () => {
  const evidence = buildLabelReviewEvidence(
    {
      disposition: 'FIX_LABEL',
      confidence: 'MEDIUM',
      fieldLabel: 'Slot from Wave 02 DOCX remediation',
      docxSlotSlotId: 'document.soQuyet',
      actualDocxContext: 'Quyet dinh so {{document.soQuyet}} ngay ...',
      actualDocxEvidenceRawPattern: '{{document.soQuyet}}',
    },
    {
      label: 'So quyet dinh',
      rationale: 'Path and DOCX context identify a decision number field.',
    },
    '2026-06-29T00:00:00.000Z',
    'Codex legal semantic label review',
  );

  assert.deepEqual(evidence, {
    reviewedAt: '2026-06-29T00:00:00.000Z',
    reviewedBy: 'Codex legal semantic label review',
    disposition: 'FIX_LABEL',
    confidence: 'MEDIUM',
    oldLabel: 'Slot from Wave 02 DOCX remediation',
    newLabel: 'So quyet dinh',
    docxSlotId: 'document.soQuyet',
    actualDocxContext: 'Quyet dinh so {{document.soQuyet}} ngay ...',
    actualDocxRawPattern: '{{document.soQuyet}}',
    rationale: 'Path and DOCX context identify a decision number field.',
  });
});

test('applyLegalSemanticLabelReview supports template-specific label decisions', async () => {
  const root = makeRoot();
  try {
    const contractPath = join(
      root,
      'docs',
      'audit',
      'docx',
      'contracts',
      'locked',
      'BM-998__fixture.contract.locked.json',
    );
    const reviewPath = join(root, 'docs', 'audit', 'legal-semantic-field-review-213', 'latest.json');
    await writeJson(contractPath, {
      templateCode: 'BM-998',
      canonicalFields: [
        {
          path: 'signature.cheDo',
          label: 'Slot from Wave 02 DOCX remediation',
          source: 'manual',
          required: false,
          uiComponent: 'text',
          reviewRequired: true,
        },
      ],
      docxSlots: [{ slotId: 'signature.cheDo', reviewRequired: true }],
      renderBindings: [
        {
          slotId: 'signature.cheDo',
          from: 'signature.cheDo',
          reviewRequired: true,
        },
      ],
    });
    await writeJson(reviewPath, {
      rows: [
        {
          templateCode: 'BM-998',
          lockedContractPath: 'docs/audit/docx/contracts/locked/BM-998__fixture.contract.locked.json',
          fieldPath: 'signature.cheDo',
          fieldLabel: 'Slot from Wave 02 DOCX remediation',
          docxSlotSlotId: 'signature.cheDo',
          actualDocxHasSemanticToken: true,
          actualDocxContext: 'Noi thuong tru: {{signature.cheDo}}',
          actualDocxEvidenceRawPattern: '{{signature.cheDo}}',
          confidence: 'MEDIUM',
          disposition: 'FIX_LABEL',
        },
      ],
    });

    const result = await applyLegalSemanticLabelReview(root, {
      reviewPath,
      reviewedAt: '2026-06-29T00:00:00.000Z',
      labelDecisions: {
        'BM-998:signature.cheDo': {
          label: 'Noi thuong tru',
          rationale: 'Template-specific context labels this field as permanent address.',
        },
      },
      write: true,
      report: false,
    });

    assert.equal(result.summary.labelsFixed, 1);
    const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
    assert.equal(contract.canonicalFields[0].label, 'Noi thuong tru');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('DEFAULT_LABEL_DECISIONS includes high-volume reviewed label paths', () => {
  assert.equal(DEFAULT_LABEL_DECISIONS['document.soQuyet']?.label, 'Số quyết định');
  assert.equal(DEFAULT_LABEL_DECISIONS['document.ngayBan']?.label, 'Ngày ban hành');
  assert.equal(DEFAULT_LABEL_DECISIONS['agency.diaDanh']?.label, 'Địa danh');
});
