import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const URL = '`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`';
const urlIdx = src.indexOf(URL);
const awaitFetchIdx = src.lastIndexOf('await fetch(', urlIdx);
console.log('urlIdx:', urlIdx, 'awaitFetchIdx:', awaitFetchIdx);

// Check successSetMsgMatch
const successSetMsgMatch = src.match(/\n(\s*)setMessage\s*\(\s*["'][^"'`]*Đã lưu[^"'`]*["']\s*\)/);
console.log('successSetMsgMatch:', successSetMsgMatch ? 'FOUND at ' + successSetMsgMatch.index : 'NOT FOUND');
