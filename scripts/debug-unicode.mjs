import { readFileSync } from 'node:fs';
// Read the script to check the Đ character
const script = readFileSync('scripts/debug-char2.mjs', 'utf8');
// Find the Đ in the script
const idx = script.indexOf('Đ');
if (idx !== -1) {
  console.log('Script Đ char code:', script[idx].charCodeAt(0));
  console.log('Expected 272, got:', script[idx].charCodeAt(0));
}

// Try with explicit Unicode
const dStroke = '\u0110';
console.log('\\u0110 test:', dStroke.charCodeAt(0));

// Check if Vietnamese Đ is different
const vietnameseD = '\u0110'; // U+0110
const dStroke2 = '\u0110';
console.log('Same?:', vietnameseD === dStroke2);

// Let me also check the file content directly
const fileSrc = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const fileDIdx = fileSrc.indexOf('Đ');
if (fileDIdx !== -1) {
  console.log('File Đ char:', fileSrc[fileDIdx].charCodeAt(0));
  const scriptD = script[idx];
  console.log('Script Đ char:', scriptD ? scriptD.charCodeAt(0) : 'not found');
}
