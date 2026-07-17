#!/usr/bin/env node
import { readFileSync } from "node:fs";

const src = readFileSync("apps/web/src/components/documents/bm-005-form-inputs.tsx", "utf8");

const URL_TEMPLATE = "`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`";
const urlIdx = src.indexOf(URL_TEMPLATE);

// After URL backtick, find init object's closing brace
let j = urlIdx + 1;
while (j < src.length && src[j] !== "`") j++;
const urlCloseBacktick = j;

j = urlCloseBacktick + 1;
while (j < src.length && (/\s/.test(src[j]) || src[j] === ",")) j++;
const initBraceStart = j; // position of '{'
let depth = 0;
let k = j;
while (k < src.length) {
  if (src[k] === "{") depth++;
  else if (src[k] === "}") { depth--; if (depth === 0) break; }
  k++;
}
const initCloseBrace = k;

// Skip }, whitespace, , whitespace to find fetch's closing )
k++;
while (k < src.length && (/\s/.test(src[k]) || src[k] === ",")) k++;
if (src[k] !== ")") { console.log("Expected ')', got:", src[k]); process.exit(1); }
const fetchCloseParen = k;

// Walk backward to matching '('
let depth2 = 0;
let m = fetchCloseParen - 1;
while (m >= 0) {
  if (src[m] === ")") depth2++;
  else if (src[m] === "(") { depth2--; if (depth2 === 0) break; }
  m--;
}
const fetchOpenParen = m;
console.log("fetchOpenParen:", fetchOpenParen, "char:", JSON.stringify(src[fetchOpenParen]));
console.log("at fetchOpenParen:", JSON.stringify(src.slice(fetchOpenParen, fetchOpenParen + 30)));

// Find statement start: scan backward from fetchOpenParen
// The pattern is: "const xxx = await fetch(" or just "await fetch("
// Find the last "await " before fetchOpenParen
const beforeFetch = src.slice(0, fetchOpenParen);
const lastAwaitIdx = beforeFetch.lastIndexOf("await ");
console.log("last await at:", lastAwaitIdx, "char:", JSON.stringify(src[lastAwaitIdx]));
// Make sure this "await " is actually right before "fetch("
if (!src.slice(lastAwaitIdx, fetchOpenParen).match(/await\s+$/)) {
  console.log("NOT immediately before fetch(");
} else {
  console.log("Good: immediately before fetch(");
}

// Now find the start of the line containing lastAwaitIdx
const lineStart = src.lastIndexOf("\n", lastAwaitIdx - 1) + 1;
console.log("lineStart:", lineStart);
console.log("at lineStart:", JSON.stringify(src.slice(lineStart, lineStart + 50)));

// But also check if there's a "const xxx = " before "await"
const beforeLine = src.slice(lineStart, lastAwaitIdx);
console.log("before 'await' on that line:", JSON.stringify(beforeLine));
const hasConst = /const\s+\w+\s*=\s*$/.test(beforeLine);
console.log("has 'const xxx = ':", hasConst);
const stmtStart = hasConst ? lineStart : lastAwaitIdx;
console.log("stmtStart:", stmtStart);