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
  throw new Error("Unbalanced");
}

const demoMatch = src.match(/const BM001_DEMO\s*=\s*\{/);
const startIdx = demoMatch.index + demoMatch[0].length - 1;
console.log("startIdx char:", JSON.stringify(src[startIdx]));

try {
  const block = extractBalancedBlock(src, startIdx);
  console.log("BLOCK LENGTH:", block.length);
  console.log("BLOCK END:", JSON.stringify(block.slice(-50)));
  // Parse records
  const inner = block.slice(1, -1);
  const entryRe = /(\w+(?:\.\w+)+|"[^"]+")\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let count = 0;
  let m;
  while ((m = entryRe.exec(inner)) !== null) {
    count += 1;
    if (count <= 2) console.log("key:", m[1], "value (first 60):", m[2].slice(0, 60));
  }
  console.log("total entries parsed:", count);
} catch (e) {
  console.error("THREW:", e.message);
}