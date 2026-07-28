import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const fileContent = 'Đã lưu';
const scriptContent = 'Đã lưu';

console.log('File Đã char codes:', [...fileContent].map(c => c.charCodeAt(0)));
console.log('Script Đã char codes:', [...scriptContent].map(c => c.charCodeAt(0)));

// The file has U+00E3 (ã with tilde, Portuguese)
// The script has U+0103 (ã with breve, Vietnamese)

// Test with the actual file characters
const idx = src.indexOf(fileContent);
console.log('\nUsing file chars, indexOf:', idx);

// Test with script chars
console.log('Using script chars, indexOf:', src.indexOf(scriptContent));

// The fix: use file chars or use \u escapes
// ã (Vietnamese) = U+0103
// ã (Portuguese) = U+00E3
// ư (Vietnamese) = U+01B0
// Đ (Vietnamese) = U+0110

const vietRegex = /setMessage\s*\(\s*"\u0110\u00E3 l\u01B0u[^"]*"\s*\)/s;
console.log('\nUsing \\u escapes:', vietRegex.test(src));
