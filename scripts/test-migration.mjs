#!/usr/bin/env node
// Test migration on a single file (dry-run output to stdout).
import { readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2];

const FETCH_HEAD_RE =
  /^(?<lead>\s*(?:const\s+\w+\s*=\s*)?)await\s+fetch\s*\(\s*`\$\{API_BASE_URL\}\/documents\/generated\/\$\{documentId\}\/form-inputs`\s*,/m;

function findMatchingBrace(src, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const src = readFileSync(target, "utf8");
const headMatch = src.match(FETCH_HEAD_RE);
if (!headMatch) {
  console.log("NO MATCH");
  process.exit(1);
}

const headIdx = src.indexOf(headMatch[0]);
const lead = headMatch.groups?.lead ?? "";
const fetchStartIdx = headIdx + lead.length;

let i = fetchStartIdx + "await fetch(".length;
while (i < src.length && /\s/.test(src[i])) i += 1;
while (i < src.length && src[i] !== ",") i += 1;
i += 1;
while (i < src.length && /\s/.test(src[i])) i += 1;
const braceStart = i;
const braceEnd = findMatchingBrace(src, braceStart);

const initInner = src.slice(braceStart + 1, braceEnd);
const bodyMatch = initInner.match(/body\s*:\s*JSON\.stringify\(([\s\S]*?)\)\s*,?\s*$/);
const bodyExpr = bodyMatch ? bodyMatch[1].trim() : null;

console.log("lead:", JSON.stringify(lead));
console.log("bodyExpr:", JSON.stringify(bodyExpr));
console.log("init inner (first 200):", initInner.slice(0, 200));
console.log("");

let j = braceEnd + 1;
while (j < src.length && /\s/.test(src[j])) j += 1;
const fetchEnd = j + 1;

let k = fetchEnd;
while (k < src.length && (src[k] === " " || src[k] === "\t")) k += 1;
if (src[k] === ";") k += 1;

let afterEnd = k;
while (afterEnd < src.length && /\s/.test(src[afterEnd])) afterEnd += 1;

const remaining = src.slice(afterEnd);
const postMatch = remaining.match(/^if\s*\(\s*!\s*response\.ok\s*\)\s*\{/);

console.log("postMatch:", postMatch ? "FOUND" : "NOT FOUND");

let consumed = afterEnd;
if (postMatch) {
  const ifBraceStart = afterEnd + postMatch[0].length - 1;
  const ifBraceEnd = findMatchingBrace(src, ifBraceStart);
  if (ifBraceEnd !== -1) {
    consumed = ifBraceEnd + 1;
    while (consumed < src.length && /\s/.test(src[consumed])) consumed += 1;
    if (src[consumed] === ";") consumed += 1;
    while (consumed < src.length && /\s/.test(src[consumed])) consumed += 1;
  }
}

console.log("fetchStartIdx:", fetchStartIdx);
console.log("consumed:", consumed);
console.log("");
console.log("--- before block ---");
console.log(src.slice(fetchStartIdx, k));
console.log("--- consumed ---");
console.log(src.slice(k, consumed));