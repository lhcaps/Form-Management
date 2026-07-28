import { readFileSync } from 'node:fs';

// Read the script
const script = readFileSync('scripts/migrate-bm-save-helper.mjs', 'utf8');
const file = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Find Đ in script
const scriptIdx = script.indexOf('Đã lưu');
if (scriptIdx !== -1) {
  const scriptChars = [...'Đã lưu'].map(c => c.charCodeAt(0));
  console.log('Script chars:', scriptChars);
}

// Find Đ in file
const fileIdx = file.indexOf('Đã lưu');
if (fileIdx !== -1) {
  const fileChars = [...'Đã lưu'].map(c => c.charCodeAt(0));
  console.log('File chars:', fileChars);
}

// Check the actual bytes
console.log('\nScript Đã lưu:');
for (let i = scriptIdx; i < scriptIdx + 6; i++) {
  console.log('  ', i - scriptIdx, ':', JSON.stringify(script[i]), script[i].charCodeAt(0));
}

console.log('\nFile Đã lưu:');
for (let i = fileIdx; i < fileIdx + 6; i++) {
  console.log('  ', i - fileIdx, ':', JSON.stringify(file[i]), file[i].charCodeAt(0));
}

// Test direct equality
const scriptChar = script[scriptIdx];
const fileChar = file[fileIdx];
console.log('\nScript Đ === File Đ:', scriptChar === fileChar);
console.log('Script ã === File ã:', script[scriptIdx + 1] === file[fileIdx + 1]);
