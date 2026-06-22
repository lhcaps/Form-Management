import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const base = process.cwd();

const restore = {
  'BM-031': {
    path: 'agency.bodyName',
    label: 'Tên Viện kiểm sát trong thân văn bản',
    section: 'Cơ quan và văn bản',
    uiComponent: 'text',
    required: true,
    sample: 'Viện kiểm sát nhân dân khu vực 7',
    insertAfter: 'document.issuePlaceAndDateLine',
  },
  'BM-044': {
    path: 'agency.parentNameUpper',
    label: 'Cơ quan cấp trên (viết hoa)',
    section: 'Cơ quan và văn bản',
    uiComponent: 'text',
    required: true,
    sample: 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
    insertAfter: null,
  },
  'BM-056': {
    path: 'person.religion',
    label: 'Tôn giáo',
    section: 'Thông tin người bị can',
    uiComponent: 'text',
    required: false,
    sample: 'Không',
    insertAfter: 'person.ethnicity',
  },
  'BM-059': {
    path: 'recipients.personLine',
    label: 'Nơi nhận - Người bị tạm giam',
    section: 'Nơi nhận',
    uiComponent: 'text',
    required: true,
    sample: '- Lê Thị Hoa (bị can);',
    insertAfter: 'measure.detentionExtensionArticle2Line',
  },
};

function slotTypeFor(uiComponent) {
  if (uiComponent === 'textarea') return 'multilineText';
  if (uiComponent === 'date') return 'date';
  if (uiComponent === 'number') return 'number';
  if (uiComponent === 'table') return 'table';
  if (uiComponent?.startsWith('signature')) return 'signature';
  return 'text';
}

for (const [code, info] of Object.entries(restore)) {
  // Update profile
  const profilePath = `${base}/scripts/form-refinement/profiles/${code}.json`;
  const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
  const newFieldEntry = {
    label: info.label,
    section: info.section,
    uiComponent: info.uiComponent,
    required: info.required,
    sample: info.sample,
  };

  const fields = profile.fields;
  if (info.insertAfter) {
    const keys = Object.keys(fields);
    const insertIdx = keys.indexOf(info.insertAfter) + 1;
    const newFields = {};
    for (let i = 0; i < keys.length; i++) {
      newFields[keys[i]] = fields[keys[i]];
      if (i === insertIdx - 1) newFields[info.path] = newFieldEntry;
    }
    profile.fields = newFields;
  } else {
    profile.fields = { [info.path]: newFieldEntry, ...fields };
  }
  writeFileSync(profilePath, JSON.stringify(profile, null, 2));
  console.log(`${code}: profile restored "${info.path}"`);

  // Update contract
  const contractsDir = `${base}/docs/audit/docx/contracts`;
  const contractFiles = readdirSync(contractsDir).filter(
    f => f.startsWith(code + '__') && f.endsWith('.contract.draft.json')
  );
  if (contractFiles.length !== 1) { console.log(`${code}: no contract`); continue; }

  const contractPath = `${contractsDir}/${contractFiles[0]}`;
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  const slotType = slotTypeFor(info.uiComponent);

  const cfIdx = info.insertAfter
    ? contract.canonicalFields.findIndex(f => f.path === info.insertAfter) + 1
    : 0;

  const newCf = {
    path: info.path,
    label: info.label,
    type: slotType,
    uiComponent: info.uiComponent,
    required: info.required,
    source: 'unknown',
    reviewRequired: true,
  };
  contract.canonicalFields.splice(cfIdx, 0, newCf);

  const newSlot = {
    slotId: info.path,
    slotType,
    required: info.required,
    reviewRequired: true,
  };
  contract.docxSlots.splice(cfIdx, 0, newSlot);

  const newBinding = {
    slotId: info.path,
    fieldPath: info.path,
    from: info.path,
    transform: '',
    fallback: '',
    reviewRequired: true,
  };
  contract.renderBindings.splice(cfIdx, 0, newBinding);

  writeFileSync(contractPath, JSON.stringify(contract, null, 2));
  console.log(`${code}: contract restored "${info.path}"`);
}

console.log('\nDone.');
