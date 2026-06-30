import { readFileSync } from 'fs';
import { join } from 'path';

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const csv = readFileSync(join(process.cwd(), 'docs', 'audit', 'sot-rebase-v1', 'per-bm.csv'), 'utf8');
const lines = csv.split('\n').slice(1).filter(l => l.trim());

const readyForms = ['BM-001','BM-002','BM-005','BM-006','BM-008','BM-012','BM-015',
  'BM-017','BM-019','BM-065','BM-067','BM-079','BM-089','BM-124','BM-141','BM-144','BM-168'];

console.log('READY_FORMS status from per-bm.csv:');
readyForms.forEach(bm => {
  const row = lines.find(l => parseCsvLine(l)[0] === bm);
  if (row) {
    const cols = parseCsvLine(row);
    console.log(`  ${bm}: HIGH=${cols[4]} MED=${cols[5]} otrong=${cols[6]} raw=${cols[7]}`);
  }
});
