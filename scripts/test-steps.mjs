import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Get exact context around position 15995
console.log('Around 15995:', JSON.stringify(src.slice(15980, 16020)));

// Try the regex step by step
console.log('\nStep 1 - Match setMessage with any quote:');
const r1 = /setMessage\s*\(/;
console.log('setMessage(:', r1.test(src));

console.log('\nStep 2 - Match with double quote before Đã lưu:');
const r2 = /setMessage\s*\([^"]*"Đã lưu/s;
console.log('Match:', r2.test(src));

console.log('\nStep 3 - Full regex:');
const r3 = /\n(\s*)setMessage\s*\(\s*"[^"]*Đã lưu[^"]*"\s*\)/s;
console.log('Full match:', r3.test(src));

// Try with explicit Unicode chars
const str = 'setMessage(\n        "Đã lưu dữ liệu"\n      )';
console.log('\nTest string:', JSON.stringify(str));
console.log('Regex test on string:', r3.test(str));
