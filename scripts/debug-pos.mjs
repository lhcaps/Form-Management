import { readFileSync } from 'node:fs';
const src = readFileSync('apps/web/src/components/documents/bm-005-form-inputs.tsx', 'utf8');
const URL = '`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`';
const urlIdx = src.indexOf(URL);
console.log('urlIdx:', urlIdx);
const awaitFetchIdx = src.lastIndexOf('await fetch(', urlIdx);
console.log('awaitFetchIdx:', awaitFetchIdx);
console.log('context around awaitFetchIdx:', JSON.stringify(src.slice(Math.max(0,awaitFetchIdx-30), awaitFetchIdx+20)));

// Find init close brace
let i = urlIdx + 1;
while (i < src.length && src[i] !== '`') i++;
const closeBacktick = i;
i = closeBacktick + 1;
while (i < src.length && (/\s/.test(src[i]) || src[i] === ',')) i++;
console.log('char after backtick/comma:', JSON.stringify(src[i]), 'at', i);
if (src[i] === '{') {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) {
      console.log('initClose:', j, 'initContent:', JSON.stringify(src.slice(i, j+1)));
      const initClose = j;
      // Now find fetchClose
      let fc = initClose + 1;
      while (fc < src.length && (/\s/.test(src[fc]) || src[fc] === ',')) fc++;
      console.log('fetchClose target:', JSON.stringify(src[fc]), 'at', fc);
      console.log('src[fc-5..fc+10]:', JSON.stringify(src.slice(fc-5, fc+10)));
      break;
    } }
  }
}
