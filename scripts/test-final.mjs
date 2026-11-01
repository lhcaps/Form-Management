import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const testStr = src.slice(15994, 15994 + 50);

// Try different regex approaches
console.log('Test string:', JSON.stringify(testStr.slice(0, 30)));

// With /s flag
console.log('\nWith /s:');
console.log('/"Đã lưu/:', /"Đã lưu/s.test(testStr));
console.log('/"Đã lưu/ without /s:', /"Đã lưu/.test(testStr));

// With [\s\S] to match any char
console.log('\nWith [\\s\\S]:');
console.log('/"[\s\S]*Đã lưu[\s\S]*"/:', /"[\s\S]*Đã lưu[\s\S]*"/.test(testStr));

// Test if Đ matches itself
console.log('\nDirect char match:');
const d1 = testStr.includes('Đ');
const d2 = testStr.includes('Đ'.charAt(0));
console.log('testStr.includes("Đ"):', d1);

// Try splitting by Đ
const parts = testStr.split('Đ');
console.log('Split by Đ:', parts.length, 'parts');

// Try indexOf
const idx = testStr.indexOf('Đ');
console.log('indexOf Đ:', idx, 'char at idx:', testStr[idx], testStr[idx]?.charCodeAt(0));

// Try regex match
const re = /Đ/;
const match = testStr.match(re);
console.log('Regex /Đ/:', match);

// Try global
const re2 = /Đ/g;
const matches = testStr.match(re2);
console.log('Regex /Đ/g:', matches);
