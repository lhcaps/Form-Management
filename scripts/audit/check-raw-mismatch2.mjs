import { readFileSync } from 'fs';
import { join } from 'path';

const raw = JSON.parse(
  readFileSync(join(process.cwd(), 'docs', 'audit', 'sot-rebase-v1', 'raw-pattern-mismatch.latest.json'), 'utf8')
);

console.log('Total RAW_PATTERN_MISMATCH:', raw.length);
console.log('Sample (first 10):');
raw.slice(0, 10).forEach(i => {
  console.log(`  ${i.slotId || i.path}: expected=${i.expected} actual=${i.actual} generic=${i.generic}`);
});

// Check how many are generic vs non-generic
const generic = raw.filter(i => i.generic === true);
const nonGeneric = raw.filter(i => i.generic === false);
console.log('\nGeneric:', generic.length, '| Non-generic:', nonGeneric.length);

// Check READY_FORMS
const readyForms = ['BM-001','BM-002','BM-005','BM-006','BM-008','BM-012','BM-015',
  'BM-017','BM-019','BM-065','BM-067','BM-079','BM-089','BM-124','BM-141','BM-144','BM-168'];
const readyIssues = raw.filter(i => i.templateCode && readyForms.includes(i.templateCode));
console.log('\nRAW_PATTERN in READY_FORMS:', readyIssues.length);
readyIssues.slice(0, 5).forEach(i => {
  console.log(`  ${i.templateCode}: ${i.slotId || i.path} | generic=${i.generic}`);
});
