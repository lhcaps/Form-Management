import PizZip from 'pizzip';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function discoverDocx(code) {
  const path = join(process.cwd(), 'storage/templates/normalized-docx', code, `${code}_normalized.docx`);
  const buf = readFileSync(path);
  const zip = new PizZip(buf);
  const docEntry = zip.file(/^word\/document\.xml$/)[0];
  if (!docEntry) return { error: 'no word/document.xml' };
  const xml = docEntry.asText();
  const pattern = /\{\{([^}]+)\}\}/g;
  const found = [];
  const seen = new Set();
  let m;
  while ((m = pattern.exec(xml)) !== null) {
    const p = m[1].trim();
    if (!seen.has(p)) { seen.add(p); found.push(p); }
  }
  return { paths: found, count: found.length };
}

const contractsDir = join(process.cwd(), 'docs/audit/docx/contracts');

const refined = new Set([
  'BM-001','BM-002','BM-003',
  'BM-005','BM-006','BM-007','BM-008','BM-009','BM-010',
  'BM-011','BM-012','BM-014','BM-015','BM-016','BM-017','BM-018',
  'BM-023','BM-030','BM-031','BM-033',
  'BM-037','BM-038','BM-040','BM-042','BM-043','BM-044',
  'BM-045','BM-046','BM-047',
  'BM-053','BM-054','BM-055','BM-056','BM-057','BM-058','BM-059',
  'BM-070','BM-071','BM-085','BM-086','BM-090',
  'BM-097',
  'BM-103','BM-104',
  'BM-141','BM-144',
  'BM-145','BM-146','BM-148',
  'BM-150','BM-156','BM-159',
  'BM-166','BM-168','BM-169','BM-170',
  'BM-171','BM-172','BM-173',
]);

const base = join(process.cwd(), 'storage/templates/normalized-docx');
const dirs = readdirSync(base).filter(n => /^BM-\d{3}$/.test(n)).sort();

const generic_bms = [];
const no_docx = [];
const pass = [], fail = [];

for (const dir of dirs) {
  if (refined.has(dir)) continue;

  // Check docx
  const docx = discoverDocx(dir);
  if (docx.error || docx.count === 0) {
    no_docx.push(dir);
    continue;
  }

  // Check contract
  const contractFiles = readdirSync(contractsDir).filter(
    f => f.startsWith(dir + '__') && f.endsWith('.contract.draft.json')
  );
  if (contractFiles.length !== 1) continue;

  let generic = 0;
  let totalFields = 0;
  try {
    const c = JSON.parse(readFileSync(join(contractsDir, contractFiles[0]), 'utf8'));
    const fields = c.canonicalFields || [];
    totalFields = fields.length;
    generic = fields.filter(f => f.path.match(/^\w+\.field\d+$/)).length;
  } catch(e) {}

  if (generic > 0) {
    generic_bms.push({ code: dir, docx: docx.count, generic, totalFields });
  }
}

console.log(`=== BMs with DOCX placeholders but generic fields ===`);
generic_bms.sort((a,b) => a.generic - b.generic || b.docx - a.docx);
generic_bms.forEach(r => console.log(`  ${r.code}: docx=${r.docx} generic=${r.generic} cf=${r.totalFields}`));
console.log(`\nTotal: ${generic_bms.length} BMs, ${generic_bms.reduce((s,r) => s+r.generic, 0)} generic fields`);

console.log(`\n=== BMs with NO docx placeholders (need remediation) ===`);
no_docx.sort().forEach(c => console.log(`  ${c}`));
console.log(`\nTotal: ${no_docx.length} BMs`);
