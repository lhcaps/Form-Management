import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const contractsDir = join(process.cwd(), 'docs/audit/docx/contracts');

const removals = {
  'BM-031': 'agency.bodyName',
  'BM-044': 'agency.parentNameUpper',
  'BM-056': 'person.religion',
  'BM-059': 'recipients.personLine',
};

for (const [code, fieldPath] of Object.entries(removals)) {
  const files = readdirSync(contractsDir).filter(
    f => f.startsWith(code + '__') && f.endsWith('.contract.draft.json')
  );
  if (files.length !== 1) { console.log(`${code}: no contract`); continue; }
  const path = join(contractsDir, files[0]);
  const c = JSON.parse(readFileSync(path, 'utf8'));

  const beforeFields = (c.canonicalFields || []).length;
  const beforeSlots = (c.docxSlots || []).length;
  const beforeBindings = (c.renderBindings || []).length;

  // Remove from canonicalFields
  c.canonicalFields = (c.canonicalFields || []).filter(f => f.path !== fieldPath);

  // Remove from docxSlots
  c.docxSlots = (c.docxSlots || []).filter(s => s.slotId !== fieldPath);

  // Remove from renderBindings (by fieldPath match)
  c.renderBindings = (c.renderBindings || []).filter(b =>
    b.fieldPath !== fieldPath && b.slotId !== fieldPath
  );

  // Skip formInputHints handling (structure varies)

  const afterFields = (c.canonicalFields || []).length;
  const afterSlots = (c.docxSlots || []).length;
  const afterBindings = (c.renderBindings || []).length;

  console.log(`${code}: removed "${fieldPath}"`);
  console.log(`  fields: ${beforeFields} -> ${afterFields}`);
  console.log(`  slots:  ${beforeSlots} -> ${afterSlots}`);
  console.log(`  bind:   ${beforeBindings} -> ${afterBindings}`);

  writeFileSync(path, JSON.stringify(c, null, 2), 'utf8');
}

console.log('\nDone.');
