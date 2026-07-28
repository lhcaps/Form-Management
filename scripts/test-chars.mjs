import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Find Đã lưu in the file
const idx = src.indexOf('Đã lưu');
console.log('Found at:', idx);
if (idx !== -1) {
  // Check each character
  console.log('Characters:');
  for (let i = idx; i < idx + 6; i++) {
    console.log('  char', i - idx, ':', JSON.stringify(src[i]), 'code:', src[i].charCodeAt(0));
  }
}

// Now test the regex with explicit chars
const char1 = '\u0110'; // Đ
const char2 = '\u00E3'; // ã
const char3 = '\u0129'; // ĩ (approximate for ư?)
const char4 = '\u1EE5'; // ữ

// Try finding with charCodeAt
console.log('\nDirect indexOf test:');
console.log('indexOf "\\u0110\\u00E3":', src.indexOf('\u0110\u00E3'));
console.log('indexOf "\\u0110ã":', src.indexOf('\u0110ã'));

// Try with trim
const trimmed = 'Đã lưu'.trim();
console.log('\nTrimmed:', JSON.stringify(trimmed));
console.log('Trimmed char codes:', [...trimmed].map(c => c.charCodeAt(0)));
