import PizZip from 'pizzip';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function discoverDocx(code) {
  const path = join(process.cwd(), 'storage/templates/normalized-docx', code, `${code}_normalized.docx`);
  const buf = readFileSync(path);
  const zip = new PizZip(buf);
  const docEntry = zip.file(/^word\/document\.xml$/)[0];
  if (!docEntry) return [];
  const xml = docEntry.asText();
  const pattern = /\{\{([^}]+)\}\}/g;
  const found = [];
  const seen = new Set();
  let m;
  while ((m = pattern.exec(xml)) !== null) {
    const p = m[1].trim();
    if (!seen.has(p)) { seen.add(p); found.push(p); }
  }
  return found;
}

const contractsDir = join(process.cwd(), 'docs/audit/docx/contracts');

for (const code of ['BM-031', 'BM-044', 'BM-056', 'BM-059']) {
  const docxPaths = discoverDocx(code);
  const docxSet = new Set(docxPaths);
  const contractFiles = readdirSync(contractsDir).filter(
    f => f.startsWith(code + '__') && f.endsWith('.contract.draft.json')
  );
  if (contractFiles.length !== 1) { console.log(`${code}: no contract`); continue; }
  const c = JSON.parse(readFileSync(join(contractsDir, contractFiles[0]), 'utf8'));
  const cfPaths = (c.canonicalFields || []).map(f => f.path);

  console.log(`\n=== ${code} ===`);
  console.log(`DOCX placeholders (${docxPaths.length}):`);
  docxPaths.forEach(p => console.log(`  ${p}`));
  console.log(`\nContract fields (${cfPaths.length}):`);
  cfPaths.forEach(p => console.log(`  ${p}`));

  // Find extra fields in contract
  const extra = cfPaths.filter(p => !docxSet.has(p));
  const missing = docxPaths.filter(p => !cfPaths.includes(p));
  if (extra.length > 0) {
    console.log(`\n  EXTRA in contract (not in DOCX):`);
    extra.forEach(p => console.log(`    + ${p}`));
  }
  if (missing.length > 0) {
    console.log(`\n  MISSING from contract (in DOCX but not contract):`);
    missing.forEach(p => console.log(`    - ${p}`));
  }
  if (extra.length === 0 && missing.length === 0) {
    console.log(`\n  PERFECT MATCH (regex may differ)`);
  }
}
