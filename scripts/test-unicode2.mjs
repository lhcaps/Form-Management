import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Get the exact Đ from the file
const fileD = src[src.indexOf('Đã lưu')];
console.log('File Đ:', fileD.charCodeAt(0));

// Get the Đ from the regex in the script
const script = readFileSync('scripts/migrate-bm-save-helper.mjs', 'utf8');
// Find Đ in the regex pattern
const scriptIdx = script.indexOf('Đã lưu');
if (scriptIdx !== -1) {
  const scriptD = script[scriptIdx];
  console.log('Script Đ:', scriptD.charCodeAt(0));
} else {
  console.log('Đ not found in script');
}

// Test with explicit char codes
const testStr = src.slice(15994, 15994 + 50);
console.log('\nTest string:', JSON.stringify(testStr));
const regex1 = /"Đã lưu dữ liệu"/s;
console.log('With literal:', regex1.test(testStr));

// Try with Unicode escapes
const test2 = '"' + '\u0110' + '\u00E3' + ' l\u01B0' + 'u d\u1EE5' + ' li\u1EC7u"';
console.log('\nWith escapes:', JSON.stringify(test2));
console.log('Test on file:', regex1.test(testStr));
