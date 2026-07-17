import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const URL = '`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`';
console.log('URL:', URL);
const urlIdx = src.indexOf(URL);
console.log('urlIdx:', urlIdx);
if (urlIdx !== -1) {
  console.log('context:', JSON.stringify(src.slice(urlIdx-20, urlIdx+50)));
} else {
  // Try to find similar
  const idx = src.indexOf('/documents/generated/${documentId}/form-inputs');
  console.log('idx without backticks:', idx);
  if (idx !== -1) {
    console.log('context:', JSON.stringify(src.slice(idx-20, idx+50)));
  }
}
