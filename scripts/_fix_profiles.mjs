import { readFileSync, writeFileSync } from 'node:fs';

const removals = {
  'BM-044': 'agency.parentNameUpper',
  'BM-056': 'person.religion',
  'BM-059': 'recipients.personLine',
};

for (const [code, fieldPath] of Object.entries(removals)) {
  const path = `scripts/form-refinement/profiles/${code}.json`;
  const c = JSON.parse(readFileSync(path, 'utf8'));
  if (!c.fields[fieldPath]) {
    console.log(`${code}: "${fieldPath}" not found in profile`);
    continue;
  }
  delete c.fields[fieldPath];
  console.log(`${code}: removed "${fieldPath}", now ${Object.keys(c.fields).length} fields`);
  writeFileSync(path, JSON.stringify(c, null, 2), 'utf8');
}
console.log('\nDone.');
