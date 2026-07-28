import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Test the full regex
const regex = /"Đã lưu/s;
console.log('Test on file:', regex.test(src));
console.log('Test without /s:', /"Đã lưu/.test(src));

// Find all occurrences
const idx = src.indexOf('Đã lưu');
console.log('indexOf:', idx);

// Try exec
const match = regex.exec(src);
console.log('exec:', match ? 'FOUND at ' + match.index : 'NOT FOUND');

// Try match
const allMatch = src.match(/"Đã lưu"/s);
console.log('match:', allMatch);

// Test with the script's actual regex
const scriptRegex = /\n(\s*)setMessage\s*\(\s*"[^"]*Đã lưu[^"]*"\s*\)/s;
const scriptMatch = scriptRegex.exec(src);
console.log('\nScript regex exec:', scriptMatch ? 'FOUND at ' + scriptMatch.index : 'NOT FOUND');

// Try simpler
const simple = /setMessage[^"]*"Đã lưu/s;
console.log('Simple regex:', simple.test(src));

// Check if the issue is with the \s in the character class
// \s matches [\t\n\v\f\r ], but [^"] should match everything except "
const r1 = /setMessage\s*\([^"]*"Đã lưu/s;
console.log('With [^"]:', r1.test(src));

// Try [^"]+ instead of [^"]*
const r2 = /setMessage\s*\([^"]*"Đã lưu[^"]*"\s*\)/s;
console.log('With [^"]* at end:', r2.test(src));

// What if the issue is whitespace?
const ws = src.slice(15970, 16010);
console.log('\nChars around setMessage:');
for (let i = 0; i < ws.length; i++) {
  console.log('  ', i, ':', JSON.stringify(ws[i]), ws[i].charCodeAt(0));
}
