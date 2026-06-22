import { readFileSync, writeFileSync } from 'node:fs';

const base = process.cwd();

const fixes = [
  {
    code: 'BM-031',
    file: 'docs/audit/docx/contracts/BM-031__ec3276d1eebe.contract.draft.json',
    duplicates: ['agency.bodyName', 'agency.bodyName'],
  },
  {
    code: 'BM-044',
    file: 'docs/audit/docx/contracts/BM-044__8552b13c78ff.contract.draft.json',
    duplicates: ['agency.parentNameUpper', 'agency.parentNameUpper'],
  },
  {
    code: 'BM-056',
    file: 'docs/audit/docx/contracts/BM-056__eea9a3391f5f.contract.draft.json',
    duplicates: ['person.religion', 'person.religion'],
  },
  {
    code: 'BM-059',
    file: 'docs/audit/docx/contracts/BM-059__4cdec41fdb1d.contract.draft.json',
    duplicates: ['recipients.personLine', 'recipients.personLine'],
  },
];

for (const fix of fixes) {
  const contract = JSON.parse(readFileSync(fix.file, 'utf8'));

  // Find duplicate indices in canonicalFields (last occurrence of each duplicate)
  const dupSet = new Set(fix.duplicates);
  const toRemove = new Set();
  for (const path of dupSet) {
    const indices = contract.canonicalFields
      .map((f, i) => f.path === path ? i : -1)
      .filter(i => i !== -1);
    if (indices.length >= 2) {
      // Remove all but the first
      indices.slice(1).forEach(i => toRemove.add(i));
    }
  }

  if (toRemove.size === 0) {
    console.log(`${fix.code}: no duplicates found`);
    continue;
  }

  const sortedRemove = [...toRemove].sort((a, b) => b - a);

  // Remove duplicates from each array
  for (const idx of sortedRemove) {
    contract.canonicalFields.splice(idx, 1);
    contract.docxSlots.splice(idx, 1);
    contract.renderBindings.splice(idx, 1);
  }

  const cfLen = contract.canonicalFields.length;
  const slotLen = contract.docxSlots.length;
  const bindLen = contract.renderBindings.length;
  console.log(`${fix.code}: removed ${toRemove.size} duplicate(s). cf=${cfLen} slot=${slotLen} bind=${bindLen}`);

  writeFileSync(fix.file, JSON.stringify(contract, null, 2));
}

console.log('Done.');
