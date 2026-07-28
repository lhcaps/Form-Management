import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

const dauLuuIdx = src.indexOf("Đã lưu");
console.log('dauLuuIdx:', dauLuuIdx);

let searchBack = dauLuuIdx;
let iterations = 0;
while (searchBack > 0) {
  const slice = src.slice(searchBack - 10, searchBack);
  const match = slice.match(/setMessage\s*\(/);
  if (match) {
    console.log('Found at searchBack:', searchBack, 'iterations:', iterations);
    console.log('Slice:', JSON.stringify(slice));
    break;
  }
  searchBack--;
  iterations++;
  if (iterations >= 25) {
    console.log('Stopped after', iterations, 'iterations. Last slice:', JSON.stringify(src.slice(searchBack - 10, searchBack)));
    break;
  }
}
