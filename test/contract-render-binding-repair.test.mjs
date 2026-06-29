import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  applyRenderBindingRepair,
  fieldDescriptor,
  labelForPath,
} from '../scripts/audit/lib/contract-render-binding-repair.mjs';

test('labelForPath resolves known Vietnamese labels for render repair fields', () => {
  assert.equal(labelForPath('reception.startedAtDay'), 'Ngày bắt đầu tiếp nhận');
  assert.equal(labelForPath('recipients.personLine6'), 'Người nhận (dòng 6)');
  assert.equal(labelForPath('person.idNumber'), 'Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu');
});

test('fieldDescriptor uses textarea for long narrative fields', () => {
  assert.deepEqual(
    {
      uiComponent: fieldDescriptor('crimeReport.content').uiComponent,
      label: fieldDescriptor('crimeReport.content').label,
      source: fieldDescriptor('document.issueDate').source,
    },
    {
      uiComponent: 'textarea',
      label: 'Nội dung nguồn tin, vụ việc',
      source: 'systemDate',
    },
  );
});

test('applyRenderBindingRepair adds missing field, slot, and binding once', () => {
  const input = {
    templateCode: 'BM-999',
    canonicalFields: [],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [
      { slotId: 'sourceTransfer.attachedItemsDescription', reason: 'old taxonomy' },
    ],
  };

  const { contract, changes } = applyRenderBindingRepair(input, {
    add: [{ slotId: 'sourceTransfer.attachedItemsDescription' }],
  });

  assert.deepEqual(changes.addedFields, ['sourceTransfer.attachedItemsDescription']);
  assert.deepEqual(changes.addedSlots, ['sourceTransfer.attachedItemsDescription']);
  assert.deepEqual(changes.addedBindings, ['sourceTransfer.attachedItemsDescription']);
  assert.equal(contract.canonicalFields[0].uiComponent, 'textarea');
  assert.equal(contract.docxSlots[0].slotType, 'multilineText');
  assert.equal(contract.renderBindings[0].from, 'sourceTransfer.attachedItemsDescription');
  assert.deepEqual(contract.rejectedCandidates, []);
});

test('applyRenderBindingRepair binds suffixed DOCX slot from canonical field and removes extra slot', () => {
  const input = {
    templateCode: 'BM-999',
    canonicalFields: [
      {
        path: 'document.fullDocumentCode',
        type: 'string',
        label: 'Số văn bản',
        source: 'manual',
        required: false,
        uiComponent: 'text',
        reviewRequired: false,
      },
    ],
    docxSlots: [{ slotId: 'document.fullDocumentCode', label: 'Số văn bản' }],
    renderBindings: [
      {
        slotId: 'document.fullDocumentCode',
        from: 'document.fullDocumentCode',
        transform: 'identity',
        fallback: '',
      },
    ],
  };

  const { contract, changes } = applyRenderBindingRepair(input, {
    removeSlotIds: ['document.fullDocumentCode'],
    add: [{ slotId: 'document.fullDocumentCode8', from: 'document.fullDocumentCode' }],
  });

  assert.deepEqual(changes.removedSlots, ['document.fullDocumentCode']);
  assert.deepEqual(changes.addedSlots, ['document.fullDocumentCode8']);
  assert.deepEqual(contract.canonicalFields.map((field) => field.path), [
    'document.fullDocumentCode',
  ]);
  assert.deepEqual(contract.docxSlots.map((slot) => slot.slotId), [
    'document.fullDocumentCode8',
  ]);
  assert.deepEqual(contract.renderBindings.map((binding) => [binding.slotId, binding.from]), [
    ['document.fullDocumentCode8', 'document.fullDocumentCode'],
  ]);
});

test('legacy render repair script does not carry blocked render-only shortcuts', () => {
  const source = readFileSync('scripts/audit/apply-render-binding-repair-v1.mjs', 'utf8');

  assert.equal(
    source.includes("slotId: 'recipients.personLine6'"),
    false,
    'BM-052 recipients.personLine6 must be semantically split from source DOCX, not added as one repeated field',
  );
  assert.equal(
    source.includes("slotId: 'recipients.personLine5'"),
    false,
    'BM-062 recipients.personLine5 must be semantically split from source DOCX, not added as one repeated field',
  );
  assert.equal(
    source.includes("slotId: 'document.fullDocumentCode8'"),
    false,
    'BM-063 document.fullDocumentCode8 must not be rebound to document.fullDocumentCode',
  );
  assert.equal(
    source.includes("slotId: 'recipients.personLine4'"),
    false,
    'BM-066 recipients.personLine4 must be semantically split from source DOCX, not added as one repeated field',
  );
});
