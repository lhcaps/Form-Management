import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const match = src.match(/setMessage[^"]*"([^"]+)"/);
if (match) {
  console.log('First setMessage arg:', match[1]);
  console.log('Char codes:', [...match[1]].map(c => c.charCodeAt(0)));
}

// Check the regex pattern bytes
const pattern = /Đ/;
const pattern2 = /Đ/;
console.log('Pattern bytes:', [...'Đ'].map(c => c.charCodeAt(0)));
console.log('Đ in file bytes:', [...'Đ'].map(c => c.charCodeAt(0)));
