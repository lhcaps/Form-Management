import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const searchTerm = 'Đã lưu';
const idx = src.indexOf(searchTerm);
console.log('Found at:', idx);

// Build regex piece by piece
console.log('\nPiece by piece:');
console.log('1. /setMessage\\s*\\(/:', /setMessage\s*\(/s.test(src));
console.log('2. + "Đã lưu":', /setMessage\s*\([^)]*Đã lưu/s.test(src));

// The [^"]* after might be the issue - does it contain any " chars?
const contentBetween = src.slice(src.indexOf('setMessage('), idx);
console.log('\n3. Content between setMessage( and Đã lưu:', JSON.stringify(contentBetween.slice(-30)));

// Count " chars in the setMessage call
const setMsgStart = src.indexOf('setMessage(');
const endQuote = src.indexOf('"', idx);
const between = src.slice(setMsgStart, endQuote);
console.log('4. Quotes in between:', (between.match(/"/g) || []).length);

// The real issue: the [^"]* pattern in my regex requires a closing "
// But the file has setMessage(\r\n        "\r\n        "Đã lưu...

// Let me check: after Đã lưu, is there a closing "?
const afterD = src.slice(idx, idx + 100);
console.log('\n5. After Đã lưu:', JSON.stringify(afterD.slice(0, 50)));
console.log('6. Index of closing ":', afterD.indexOf('"'));
