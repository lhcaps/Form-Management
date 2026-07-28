import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Find setMessage before Đã lưu
const dauLuuIdx = src.indexOf("Đã lưu");
console.log('dauLuuIdx:', dauLuuIdx);

// Search 100 chars back
const searchArea = src.slice(dauLuuIdx - 100, dauLuuIdx);
console.log('Search area:', JSON.stringify(searchArea));

// Find setMessage
const setMsgMatch = searchArea.match(/setMessage\s*\(/);
if (setMsgMatch) {
  console.log('Found setMessage at offset:', setMsgMatch.index, 'in searchArea');
  console.log('Absolute position:', dauLuuIdx - 100 + setMsgMatch.index);
  console.log('Context:', JSON.stringify(searchArea.slice(setMsgMatch.index, setMsgMatch.index + 20)));
}
