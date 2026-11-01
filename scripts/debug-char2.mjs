import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
// Find the Đ in "Đã lưu"
const idx = src.indexOf('Đã lưu');
console.log('Index of Đã lưu:', idx);
if (idx !== -1) {
  console.log('Context:', JSON.stringify(src.slice(idx - 10, idx + 30)));
  console.log('Char at idx:', src[idx], src[idx].charCodeAt(0));
  console.log('Expected Đ char code:', 'Đ'.charCodeAt(0));
  // Try different Đ
  const dChar = '\u0110'; // U+0110 Latin Capital Letter D with stroke
  console.log('U+0110 Latin D with stroke char code:', dChar.charCodeAt(0));
}
