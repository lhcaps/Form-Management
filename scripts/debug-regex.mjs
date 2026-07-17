import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Test various regex patterns
console.log('Test 1 - with Đ:', /\n(\s*)setMessage\s*\(\s*["'][^"'`]*Đã lưu[^"'`]*["']\s*\)/.test(src));

// Try without backtick in char class
console.log('Test 2 - no backtick exclusion:', /\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/.test(src));

// Try simpler
console.log('Test 3 - simpler:', /setMessage\s*\(\s*["'][^"]*Đã lưu/.test(src));

// Find all setMessage
const matches = src.match(/setMessage\s*\(\s*["'][^"]*["']/g);
console.log('All setMessage calls:', matches);
