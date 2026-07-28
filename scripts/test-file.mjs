import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const regex1 = /\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/s;
const match = regex1.exec(src);
console.log('Match:', match ? 'FOUND at ' + match.index : 'NOT FOUND');
