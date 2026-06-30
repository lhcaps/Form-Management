const DEFAULT_REVIEW = {
  reviewedBy: 'Codex Atlas render repair',
  reviewedAt: '2026-06-28T00:00:00.000Z',
  reviewKind: 'automated',
};

const PATH_LABELS = {
  'crimeReport.content': 'Nội dung nguồn tin, vụ việc',
  'crimeReport.attachedItemsDescription': 'Tài liệu, đồ vật kèm theo',
  'sourceTransfer.attachedItemsDescription': 'Tài liệu, đồ vật kèm theo',
  'reception.startedAtTimeText': 'Giờ bắt đầu tiếp nhận',
  'reception.startedAtDay': 'Ngày bắt đầu tiếp nhận',
  'reception.startedAtMonth': 'Tháng bắt đầu tiếp nhận',
  'reception.startedAtYear': 'Năm bắt đầu tiếp nhận',
  'reception.endedAtTimeText': 'Giờ kết thúc tiếp nhận',
  'reception.endedAtDay': 'Ngày kết thúc tiếp nhận',
  'reception.endedAtMonth': 'Tháng kết thúc tiếp nhận',
  'reception.endedAtYear': 'Năm kết thúc tiếp nhận',
  'reception.locationName': 'Địa điểm tiếp nhận',
  'recipients.personLine4': 'Người nhận (dòng 4)',
  'recipients.personLine5': 'Người nhận (dòng 5)',
  'recipients.personLine6': 'Người nhận (dòng 6)',
  'document.fullDocumentCode': 'Số văn bản',
  'document.fullDocumentCode2': 'Số văn bản',
  'document.fullDocumentCode8': 'Số văn bản',
  'document.issueDate': 'Ngày ban hành',
  'document.issueDate4': 'Ngày ban hành',
  'person.dateOfBirth': 'Ngày sinh',
  'person.idNumber': 'Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu',
  'person.fullName': 'Họ tên',
  'person.personFullName': 'Họ tên',
};

const PATH_SOURCE = {
  'reception.startedAtTimeText': 'manual',
  'reception.startedAtDay': 'manual',
  'reception.startedAtMonth': 'manual',
  'reception.startedAtYear': 'manual',
  'reception.endedAtTimeText': 'manual',
  'reception.endedAtDay': 'manual',
  'reception.endedAtMonth': 'manual',
  'reception.endedAtYear': 'manual',
  'reception.locationName': 'manual',
  'document.issueDate': 'systemDate',
};

const TEXTAREA_PATHS = new Set([
  'crimeReport.content',
  'crimeReport.attachedItemsDescription',
  'sourceTransfer.attachedItemsDescription',
]);

function uniqueBy(array, keyFn) {
  const seen = new Set();
  const next = [];
  for (const item of array) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}

export function labelForPath(path) {
  if (PATH_LABELS[path]) return PATH_LABELS[path];
  const tail = String(path).split('.').at(-1) || path;
  return tail
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function fieldDescriptor(path, overrides = {}) {
  const uiComponent = overrides.uiComponent ?? (TEXTAREA_PATHS.has(path) ? 'textarea' : 'text');
  return {
    path,
    type: 'string',
    label: overrides.label ?? labelForPath(path),
    source: overrides.source ?? PATH_SOURCE[path] ?? 'manual',
    required: overrides.required ?? false,
    uiComponent,
    ...(overrides.section ? { section: overrides.section } : {}),
    reviewRequired: overrides.reviewRequired ?? false,
    transform: overrides.transform ?? 'identity',
    reviewEvidence: overrides.reviewEvidence,
  };
}

export function slotDescriptor(slotId, overrides = {}) {
  return {
    slotId,
    location: overrides.location ?? {
      partName: 'word/document.xml',
      blockId: null,
      tableCellId: null,
    },
    context: overrides.context ?? `{{${slotId}}}`,
    label: overrides.label ?? labelForPath(slotId),
    slotType: overrides.slotType ?? (TEXTAREA_PATHS.has(slotId) ? 'multilineText' : 'text'),
    required: overrides.required ?? false,
    confidence: overrides.confidence ?? 1,
    evidence: overrides.evidence ?? {
      textBefore: overrides.textBefore ?? '',
      textAfter: overrides.textAfter ?? '',
      rawPattern: `{{${slotId}}}`,
    },
    reviewRequired: overrides.reviewRequired ?? false,
    reviewEvidence: overrides.reviewEvidence,
  };
}

export function bindingDescriptor(slotId, from, overrides = {}) {
  return {
    slotId,
    from,
    transform: overrides.transform ?? 'identity',
    fallback: overrides.fallback ?? '',
    reviewRequired: overrides.reviewRequired ?? false,
  };
}

function ensureField(contract, path, overrides, changes) {
  contract.canonicalFields ??= [];
  const existing = contract.canonicalFields.find((field) => field.path === path);
  if (existing) return existing;
  const field = fieldDescriptor(path, overrides);
  contract.canonicalFields.push(field);
  changes.addedFields.push(path);
  return field;
}

function ensureSlot(contract, slotId, overrides, changes) {
  contract.docxSlots ??= [];
  const existing = contract.docxSlots.find((slot) => slot.slotId === slotId);
  if (existing) return existing;
  const slot = slotDescriptor(slotId, overrides);
  contract.docxSlots.push(slot);
  changes.addedSlots.push(slotId);
  return slot;
}

function ensureBinding(contract, slotId, from, overrides, changes) {
  contract.renderBindings ??= [];
  const existing = contract.renderBindings.find((binding) => binding.slotId === slotId);
  if (existing) {
    if (existing.from !== from) {
      changes.updatedBindings.push({ slotId, fromBefore: existing.from, fromAfter: from });
      existing.from = from;
    }
    return existing;
  }
  const binding = bindingDescriptor(slotId, from, overrides);
  contract.renderBindings.push(binding);
  changes.addedBindings.push(slotId);
  return binding;
}

function removeSlotAndBinding(contract, slotId, changes) {
  const beforeSlots = contract.docxSlots?.length ?? 0;
  contract.docxSlots = (contract.docxSlots ?? []).filter((slot) => slot.slotId !== slotId);
  if ((contract.docxSlots?.length ?? 0) !== beforeSlots) {
    changes.removedSlots.push(slotId);
  }

  const beforeBindings = contract.renderBindings?.length ?? 0;
  contract.renderBindings = (contract.renderBindings ?? []).filter(
    (binding) => binding.slotId !== slotId,
  );
  if ((contract.renderBindings?.length ?? 0) !== beforeBindings) {
    changes.removedBindings.push(slotId);
  }
}

function removeUnboundFields(contract, paths, changes) {
  const boundFields = new Set((contract.renderBindings ?? []).map((binding) => binding.from));
  const remove = new Set(paths.filter((path) => !boundFields.has(path)));
  if (remove.size === 0) return;
  contract.canonicalFields = (contract.canonicalFields ?? []).filter((field) => {
    if (!remove.has(field.path)) return true;
    changes.removedFields.push(field.path);
    return false;
  });
}

export function applyRenderBindingRepair(inputContract, repair, options = {}) {
  const contract = structuredClone(inputContract);
  const meta = { ...DEFAULT_REVIEW, ...(options.meta ?? {}) };
  const changes = {
    addedFields: [],
    addedSlots: [],
    addedBindings: [],
    updatedBindings: [],
    removedFields: [],
    removedSlots: [],
    removedBindings: [],
    removedRejectedCandidates: [],
  };

  for (const slotId of repair.removeSlotIds ?? []) {
    removeSlotAndBinding(contract, slotId, changes);
  }

  for (const item of repair.add ?? []) {
    const from = item.from ?? item.slotId;
    ensureField(contract, from, item.field ?? {}, changes);
    ensureSlot(contract, item.slotId, item.slot ?? {}, changes);
    ensureBinding(contract, item.slotId, from, item.binding ?? {}, changes);
  }

  removeUnboundFields(contract, repair.removeFieldIfUnbound ?? [], changes);

  const repairedSlotIds = new Set([
    ...(repair.add ?? []).map((item) => item.slotId),
    ...(repair.removeSlotIds ?? []),
  ]);
  const beforeRejected = contract.rejectedCandidates?.length ?? 0;
  contract.rejectedCandidates = (contract.rejectedCandidates ?? []).filter(
    (candidate) => !repairedSlotIds.has(candidate.slotId),
  );
  const afterRejected = contract.rejectedCandidates.length;
  if (beforeRejected !== afterRejected) {
    changes.removedRejectedCandidates.push(beforeRejected - afterRejected);
  }

  contract.canonicalFields = uniqueBy(contract.canonicalFields ?? [], (field) => field.path);
  contract.docxSlots = uniqueBy(contract.docxSlots ?? [], (slot) => slot.slotId);
  contract.renderBindings = uniqueBy(contract.renderBindings ?? [], (binding) => binding.slotId);

  contract.reviewedBy = meta.reviewedBy;
  contract.reviewedAt = meta.reviewedAt;
  contract.reviewKind = meta.reviewKind;
  contract.renderRepairEvidence = {
    repairedAt: meta.reviewedAt,
    repairedBy: meta.reviewedBy,
    reason: repair.reason ?? 'Render fidelity binding repair',
    changes,
  };

  return { contract, changes };
}
