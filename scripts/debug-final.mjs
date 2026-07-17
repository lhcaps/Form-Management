import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Find position of Đã lưu
const targetIdx = src.indexOf('Đã lưu');
console.log('Đã lưu at:', targetIdx);

// Try the exact regex from my script
const regex1 = /\n(\s*)setMessage\s*\(\s*["'][^"'`]*Đã lưu[^"'`]*["']\s*\)/;
const match1 = src.match(regex1);
console.log('Regex 1 result:', match1);

// Try without backtick exclusion
const regex2 = /\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/;
const match2 = src.match(regex2);
console.log('Regex 2 result:', match2);

// Try simpler
const regex3 = /setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/;
const match3 = src.match(regex3);
console.log('Regex 3 result:', match3 ? 'found at ' + match3.index : 'not found');

// Try to debug by searching manually
const searchStr = 'Đã lưu';
let searchIdx = 0;
while (true) {
  const found = src.indexOf(searchStr, searchIdx);
  if (found === -1) break;
  console.log('Found Đã lưu at:', found, 'context:', JSON.stringify(src.slice(Math.max(0, found-20), found+20)));
  searchIdx = found + 1;
}
