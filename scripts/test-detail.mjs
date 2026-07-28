import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Get context around position 14638 (where single quote match was found)
console.log('Context at 14638:', JSON.stringify(src.slice(14600, 14700)));

// Also check what's at 15995 (where Đã lưu is)
console.log('\nContext at 15995:', JSON.stringify(src.slice(15950, 16050)));

// Try simple substring match
const target = 'setMessage(\n        "Đã lưu';
console.log('\nSimple indexOf:', src.indexOf(target));

// Try with explicit quote character
const withDouble = /setMessage\([^)]*"Đã lưu/s;
const withSingle = /setMessage\([^)]*'Đã lưu/s;
console.log('\nWith double quote:', withDouble.test(src));
console.log('With single quote:', withSingle.test(src));
