import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');

// Find the success setMessage by walking through the file
const setMsgStart = src.indexOf('setMessage(');
console.log('setMessage( at:', setMsgStart);

// Walk through, tracking paren depth
let i = setMsgStart + 'setMessage('.length;
let depth = 1; // Already inside the first paren
let foundDauLuu = false;
let inString = false;
let stringChar = '';

while (i < src.length && depth > 0) {
  const c = src[i];

  if (!inString) {
    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringChar = c;
    } else if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) {
        console.log('setMessage(...) ends at:', i, 'char:', JSON.stringify(src[i]));
        break;
      }
    }
  } else {
    if (c === stringChar && src[i-1] !== '\\') {
      inString = false;
    } else if (c === '\\' && src[i-1] === '\\') {
      // escaped backslash
    }
  }

  // Check for Đã lưu (using indexOf for reliability)
  if (!inString && !foundDauLuu && src.slice(i, i + 7) === 'Đã lưu') {
    foundDauLuu = true;
    console.log('Found Đã lưu at:', i);
  }

  i++;
}

console.log('Final i:', i);
console.log('Content around end:', JSON.stringify(src.slice(Math.max(0, i-30), i+30)));
