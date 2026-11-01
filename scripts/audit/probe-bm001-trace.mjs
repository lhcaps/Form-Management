import { readFileSync } from "node:fs";

const src = readFileSync("apps/web/src/lib/form-flight/profiles/bm001.ts", "utf8");

function extractBalancedBlock(source, startIndex) {
  let depth = 0;
  let i = startIndex;
  let inString = null;
  while (i < source.length) {
    const ch = source[i];
    if (inString) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      i += 1;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, i + 1);
    }
    i += 1;
  }
  throw new Error("Unbalanced at depth " + depth);
}

const demoMatch = src.match(/const BM001_DEMO\s*=\s*\{/);
const startIdx = demoMatch.index + demoMatch[0].length - 1;
console.log("demo startIdx:", startIdx, "char:", JSON.stringify(src[startIdx]));

try {
  const block = extractBalancedBlock(src, startIdx);
  console.log("BLOCK LEN:", block.length);
  console.log("BLOCK LAST 80:", JSON.stringify(block.slice(-80)));
  // Count entries using a simpler scan
  const inner = block.slice(1, -1);
  const lines = inner.split("\n");
  let count = 0;
  for (const ln of lines) {
    if (/"[^"]+"\s*:/.test(ln) || /\w+\.\w+\s*:/.test(ln)) {
      count += 1;
    }
  }
  console.log("key entries counted:", count);
  console.log("first 4 lines:");
  for (let i = 0; i < Math.min(4, lines.length); i++) console.log("  >", lines[i]);
} catch (e) {
  console.error("THREW:", e.message);
}