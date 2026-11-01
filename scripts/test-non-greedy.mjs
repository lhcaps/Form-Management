import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Try non-greedy
const r1 = /\n(\s*)setMessage\s*\(\s*"[^"]*?Đã lưu[^"]*?"\s*\)/s;
console.log('Non-greedy:', r1.test(src));

// Try with \s instead of literal space
const r2 = /\n(\s*)setMessage\s*\(\s*"[^\"]*Đã lưu[^\"]*"\s*\)/s;
console.log('Escaped quotes:', r2.test(src));

// Try without quotes in char class - use [^)]* instead
const r3 = /\n(\s*)setMessage\s*\(\s*"[^)]*Đã lưu[^)]*"\s*\)/s;
console.log('Char class [^)]:', r3.test(src));

// Try with explicit hex
const r4 = /setMessage\s*\(\s*"[^\u0022]*Đã lưu[^\u0022]*"\s*\)/s;
console.log('With \\u0022:', r4.test(src));

// Try matching just the string part
const r5 = /"[^"]*Đã lưu[^"]*"/s;
const match = r5.exec(src);
console.log('\nSimple string match:', match ? 'FOUND at ' + match.index + ': ' + JSON.stringify(match[0]) : 'NOT FOUND');

// Check if there are other quotes
const allQuotes = src.match(/"[^"]*Đã lưu[^"]*"/g);
console.log('All matches:', allQuotes);
