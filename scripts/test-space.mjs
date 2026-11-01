import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Find Đã lưu (with space)
const idx = src.indexOf('Đã lưu');
console.log('Found Đã lưu (with space):', idx);
if (idx !== -1) {
  console.log('Context:', JSON.stringify(src.slice(idx - 10, idx + 30)));
}

// Find Đã lưu (no space)
const idx2 = src.indexOf('Đã lưu');
console.log('\nFound Đã lưu (no space):', idx2);
if (idx2 !== -1) {
  console.log('Context:', JSON.stringify(src.slice(idx2 - 10, idx2 + 30)));
}

// Now check the regex with space
const regex = /\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/s;
const match = regex.exec(src);
console.log('\nRegex with space:', match ? 'FOUND at ' + match.index : 'NOT FOUND');

// Also test with single quote
const regex2 = /\n(\s*)setMessage\s*\(\s*["'][^']*Đã lưu[^']*["']\s*\)/s;
const match2 = regex2.exec(src);
console.log('Regex with single quote:', match2 ? 'FOUND at ' + match2.index : 'NOT FOUND');
