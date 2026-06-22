import { readFileSync, writeFileSync } from 'node:fs';

const base = process.cwd();

// Patches: for each contract, find the field by path and update it in place
const patches = [
  {
    code: 'BM-031',
    file: 'docs/audit/docx/contracts/BM-031__ec3276d1eebe.contract.draft.json',
    fieldPath: 'agency.bodyName',
    updates: {
      cf: { type: 'text', required: true },
      slot: { required: true },
      binding: { from: 'agency.bodyName', transform: 'identity' },
    },
  },
  {
    code: 'BM-044',
    file: 'docs/audit/docx/contracts/BM-044__8552b13c78ff.contract.draft.json',
    fieldPath: 'agency.parentNameUpper',
    updates: {
      cf: { type: 'text', required: true },
      slot: { required: true },
      binding: { from: 'agency.parentNameUpper', transform: 'identity' },
    },
  },
  {
    code: 'BM-056',
    file: 'docs/audit/docx/contracts/BM-056__eea9a3391f5f.contract.draft.json',
    fieldPath: 'person.religion',
    updates: {
      cf: { type: 'text', required: false },
      slot: { required: false },
      binding: { from: 'person.religion', transform: 'identity' },
    },
  },
  {
    code: 'BM-059',
    file: 'docs/audit/docx/contracts/BM-059__4cdec41fdb1d.contract.draft.json',
    fieldPath: 'recipients.personLine',
    updates: {
      cf: { type: 'text', required: true },
      slot: { required: true },
      binding: { from: 'recipients.personLine', transform: 'identity' },
    },
  },
];

let fixed = 0;
for (const patch of patches) {
  const contract = JSON.parse(readFileSync(patch.file, 'utf8'));

  // Update canonicalFields
  const cfIdx = contract.canonicalFields.findIndex(f => f.path === patch.fieldPath);
  if (cfIdx === -1) { console.log(`${patch.code}: cf not found`); continue; }
  if (contract.canonicalFields[cfIdx].type === patch.updates.cf.type) {
    console.log(`${patch.code}: cf[${cfIdx}] already has type='${patch.updates.cf.type}', skipping`);
  } else {
    Object.assign(contract.canonicalFields[cfIdx], patch.updates.cf);
    console.log(`${patch.code}: cf[${cfIdx}] ${patch.fieldPath} updated with type/required`);
  }

  // Update docxSlots
  const slotIdx = contract.docxSlots.findIndex(s => s.slotId === patch.fieldPath);
  if (slotIdx === -1) { console.log(`${patch.code}: slot not found`); continue; }
  if (contract.docxSlots[slotIdx].required === patch.updates.slot.required) {
    console.log(`${patch.code}: slot[${slotIdx}] already has required=${patch.updates.slot.required}, skipping`);
  } else {
    Object.assign(contract.docxSlots[slotIdx], patch.updates.slot);
    console.log(`${patch.code}: slot[${slotIdx}] ${patch.fieldPath} updated with required`);
  }

  // Update renderBindings
  const bindIdx = contract.renderBindings.findIndex(b => b.slotId === patch.fieldPath);
  if (bindIdx === -1) { console.log(`${patch.code}: binding not found`); continue; }
  if (contract.renderBindings[bindIdx].from === patch.updates.binding.from) {
    console.log(`${patch.code}: binding[${bindIdx}] already has from='${patch.updates.binding.from}', skipping`);
  } else {
    Object.assign(contract.renderBindings[bindIdx], patch.updates.binding);
    console.log(`${patch.code}: binding[${bindIdx}] ${patch.fieldPath} updated with from/transform`);
  }

  // Verify counts still match
  const cfLen = contract.canonicalFields.length;
  const slotLen = contract.docxSlots.length;
  const bindLen = contract.renderBindings.length;
  if (cfLen !== slotLen || slotLen !== bindLen) {
    console.log(`  WARNING: count mismatch cf=${cfLen} slot=${slotLen} bind=${bindLen}`);
  }

  writeFileSync(patch.file, JSON.stringify(contract, null, 2));
  fixed++;
}

console.log(`\nPatched ${fixed} contracts.`);
