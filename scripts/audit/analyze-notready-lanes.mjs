import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, '..', '..', 'docs', 'audit', '213-docx-fidelity-board', 'per-bm.csv');
const csv = readFileSync(csvPath, 'utf8');

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

const header = parseCsvLine(csv.split('\n')[0]);
const lines = csv.split('\n').slice(1).filter(l => l.trim());

// Get rows by lane
const pathDomainRows = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[2] === 'PATH_DOMAIN_BINDING';
});

// Sample 5 forms from PATH_DOMAIN_BINDING lane
console.log('PATH_DOMAIN_BINDING: ' + pathDomainRows.length + ' forms');
console.log('Sample forms (first 5):');
pathDomainRows.slice(0, 5).forEach(l => {
  const cols = parseCsvLine(l);
  console.log('\n  ' + cols[0] + ' - ' + cols[1]);
  console.log('  Completion: ' + cols[4] + ' | Quality: ' + cols[8] + ' | Render: ' + cols[10]);
  console.log('  Root issues: ' + cols[5] + ' | FAIL: ' + cols[6] + ' | REVIEW: ' + cols[7]);
  console.log('  Baseline findings: ' + cols[9]);
  console.log('  Next action: ' + cols[11]);
});

// Check the LEGAL_REVIEW lane
const legalRows = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[2] === 'LEGAL_REVIEW';
});
console.log('\n\nLEGAL_REVIEW: ' + legalRows.length + ' forms');
legalRows.forEach(l => {
  const cols = parseCsvLine(l);
  console.log('  ' + cols[0] + ' | ' + cols[1]);
  console.log('    Completion: ' + cols[4] + ' | Quality: ' + cols[8] + ' | Render: ' + cols[10]);
  console.log('    Root issues: ' + cols[5]);
});

// Check SOURCE_POLICY lane
const sourcePolicyRows = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[2] === 'SOURCE_POLICY';
});
console.log('\n\nSOURCE_POLICY: ' + sourcePolicyRows.length + ' forms');
sourcePolicyRows.slice(0, 5).forEach(l => {
  const cols = parseCsvLine(l);
  console.log('  ' + cols[0] + ' | ' + cols[1]);
  console.log('    Quality: ' + cols[8]);
});
