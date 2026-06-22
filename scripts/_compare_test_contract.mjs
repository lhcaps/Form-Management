import { readFileSync, readdirSync } from 'node:fs';

const testContent = readFileSync('test/form-contract-refinement.test.mjs', 'utf8');
const codes = ['BM-031', 'BM-044', 'BM-056', 'BM-059'];

for (const code of codes) {
  const lines = testContent.split('\n');
  let inBlock = false;
  const expected = [];
  for (const line of lines) {
    if (line.includes('"' + code + '"')) inBlock = true;
    if (inBlock) {
      const m = line.match(/^\s+"([^"]+)",?/);
      if (m) expected.push(m[1]);
      if (line.trim() === '],') { inBlock = false; break; }
    }
  }

  const contractFiles = readdirSync('docs/audit/docx/contracts')
    .filter(f => f.startsWith(code + '__') && f.endsWith('.contract.draft.json'));
  const c = JSON.parse(readFileSync('docs/audit/docx/contracts/' + contractFiles[0], 'utf8'));
  const actual = c.canonicalFields.map(f => f.path);

  console.log(`${code}: test=${expected.length} contract=${actual.length} match=${expected.length === actual.length}`);
  if (expected.length !== actual.length) {
    const missing = expected.filter(x => !actual.includes(x));
    const extra = actual.filter(x => !expected.includes(x));
    if (missing.length) console.log('  missing from contract: ' + missing.join(', '));
    if (extra.length) console.log('  extra in contract: ' + extra.join(', '));
  }
}
