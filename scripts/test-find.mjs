import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Find all setMessage occurrences
let idx = 0;
let count = 0;
while ((idx = src.indexOf('setMessage(', idx + 1)) !== -1) {
  count++;
  const after = src.slice(idx, idx + 50);
  console.log(count + '. at ' + idx + ':', JSON.stringify(after.slice(0, 40)));
}

// Now find the one with "Đã lưu"
const dauLuuIdx = src.indexOf('Đã lưu');
console.log('\n"Đã lưu" at:', dauLuuIdx);

// Find setMessage before this
let searchFrom = dauLuuIdx;
let setMsgIdx = src.lastIndexOf('setMessage(', searchFrom);
console.log('setMessage( before "Đã lưu":', setMsgIdx);

// Show context
console.log('\nContext around setMsgIdx:', JSON.stringify(src.slice(setMsgIdx, setMsgIdx + 80)));
