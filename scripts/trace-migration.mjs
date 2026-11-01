#!/usr/bin/env node
// Dry-run: migrate bm-005 to temp, then compare with original
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "apps/web/src/components/documents";

function listBmPanelFiles(dir) {
  return readdirSync(dir)
    .filter((f) => /^bm-\d{3}-form-inputs\.tsx$/.test(f))
    .map((f) => join(dir, f));
}

function findMatchingBrace(src, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractBodyExpr(initInner) {
  const bodyMatch = initInner.match(/body\s*:\s*JSON\.stringify\(([\s\S]*?)\)\s*,?\s*$/);
  if (!bodyMatch) return null;
  return bodyMatch[1].trim();
}

function migrateFile(path) {
  const src = readFileSync(path, "utf8");

  const FETCH_HEAD_RE =
    /^(?<lead>\s*(?:const\s+\w+\s*=\s*)?)await\s+fetch\s*\(\s*`\$\{API_BASE_URL\}\/documents\/generated\/\$\{documentId\}\/form-inputs`\s*,/m;

  const headMatch = src.match(FETCH_HEAD_RE);
  if (!headMatch) return { skipped: true };

  const headIdx = src.indexOf(headMatch[0]);
  const lead = headMatch.groups?.lead ?? "";
  const fetchStartIdx = headIdx + lead.length;

  let i = fetchStartIdx + "await fetch(".length;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  while (i < src.length && src[i] !== ",") i += 1;
  i += 1;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  if (src[i] !== "{") return { skipped: true };
  const braceStart = i;
  const braceEnd = findMatchingBrace(src, braceStart);
  if (braceEnd === -1) return { skipped: true };

  const initInner = src.slice(braceStart + 1, braceEnd);
  const bodyExpr = extractBodyExpr(initInner);
  if (!bodyExpr) return { skipped: true };

  let j = braceEnd + 1;
  while (j < src.length && /\s/.test(src[j])) j += 1;
  if (src[j] === ",") j += 1;
  while (j < src.length && /\s/.test(src[j])) j += 1;
  if (src[j] !== ")") return { skipped: true };
  const fetchEnd = j + 1;

  let k = fetchEnd;
  while (k < src.length && (src[k] === " " || src[k] === "\t")) k += 1;
  if (src[k] === ";") k += 1;

  let afterEnd = k;
  while (afterEnd < src.length && /\s/.test(src[afterEnd])) afterEnd += 1;

  let consumed = afterEnd;
  const remaining = src.slice(afterEnd);
  const postMatch = remaining.match(/^if\s*\(\s*!\s*response\.ok\s*\)\s*\{/);
  if (postMatch) {
    const ifBraceStart = afterEnd + postMatch[0].length - 1;
    const ifBraceEnd = findMatchingBrace(src, ifBraceStart);
    if (ifBraceEnd !== -1) {
      consumed = ifBraceEnd + 1;
      while (consumed < src.length && /\s/.test(src[consumed])) consumed += 1;
      if (src[consumed] === ";") consumed += 1;
      while (consumed < src.length && /\s/.test(src[consumed])) consumed += 1;
      // Absorb `const savedPayload = (await response.json()) as RenderPayload;`
      const afterSavedPayload = consumed;
      const nextLineMatch = src.slice(afterSavedPayload).match(
        /^[ \t]*const\s+savedPayload\s*=\s*\(\s*await\s+response\.json\(\)\s*\)[^;]*;/,
      );
      if (nextLineMatch) {
        consumed = afterSavedPayload + nextLineMatch[0].length;
        while (consumed < src.length && /\s/.test(src[consumed])) consumed += 1;
        // Also absorb the adjacent `setForm(normalizeFormInputs(savedPayload));` line.
        const afterSetForm = consumed;
        const setFormMatch = src.slice(afterSetForm).match(
          /^[ \t]*setForm\s*\(\s*normalizeFormInputs\s*\(\s*savedPayload\s*\)\s*\)\s*;/,
        );
        if (setFormMatch) {
          consumed = afterSetForm + setFormMatch[0].length;
          while (consumed < src.length && /\s/.test(src[consumed])) consumed += 1;
        }
      }
    }
  }

  const replacement = `await saveDocumentFormInputs(documentId, ${bodyExpr});`;

  let next =
    src.slice(0, fetchStartIdx) +
    replacement +
    src.slice(consumed);

  // Fix imports
  const importLineRe = /import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/document-form-api["']\s*;/;
  if (importLineRe.test(next)) {
    const m = next.match(importLineRe);
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.includes("saveDocumentFormInputs")) {
      names.push("saveDocumentFormInputs");
      names.sort();
      const newImport = `import { ${names.join(", ")} } from "@/lib/document-form-api";`;
      next = next.replace(importLineRe, newImport);
    }
  } else {
    const firstImportRe = /^import\s+[^;]+;\s*$/m;
    const fm = next.match(firstImportRe);
    const insertAt = fm ? fm.index + fm[0].length : 0;
    const insert = `\nimport { saveDocumentFormInputs } from "@/lib/document-form-api";`;
    next = next.slice(0, insertAt) + insert + next.slice(insertAt);
  }

  // Remove unused API_BASE_URL constant
  const remainingApiBase = (next.match(/\bAPI_BASE_URL\b/g) || []).length;
  if (remainingApiBase <= 1) {
    next = next.replace(/^const\s+API_BASE_URL\s*=\s*[\s\S]*?;\s*\n/m, "");
  }

  // Remove unused response.text() lines
  next = next.replace(/^\s*const\s+\w+\s*=\s*await\s+response\.text\(\)\s*;\s*\n/m, "");

  return { migrated: next !== src, path, src, next };
}

const target = process.argv[2] || join(ROOT, "bm-005-form-inputs.tsx");
const r = migrateFile(target);

if (r.skipped) {
  console.log("SKIPPED:", target);
  process.exit(1);
}

const outPath = target + ".migrated.tmp";
writeFileSync(outPath, r.next, "utf8");
console.log("Written to:", outPath);
console.log("Original line count:", r.src.split("\n").length);
console.log("Migrated line count:", r.next.split("\n").length);

// Show context around the replaced section
const lines = r.src.split("\n");
const lines2 = r.next.split("\n");
const fetchLineIdx = lines.findIndex(l => l.includes("await fetch("));
console.log("\n=== DIFF around replaced block (original lines " + (fetchLineIdx + 1) + "–" + (fetchLineIdx + 25) + ") ===");
for (let i = Math.max(0, fetchLineIdx - 2); i < Math.min(lines.length, fetchLineIdx + 25); i++) {
  const l2 = lines2[i] ?? "(deleted)";
  if (lines[i] !== l2) {
    console.log(`- ${(i + 1)}: ${lines[i]}`);
    console.log(`+ ${(i + 1)}: ${l2}`);
  } else {
    console.log(`  ${(i + 1)}: ${l2}`);
  }
}

// Verify key checks
console.log("\n=== VERIFICATION ===");
console.log("has saveDocumentFormInputs:", r.next.includes("saveDocumentFormInputs"));
console.log("has raw fetch:", r.next.includes("await fetch("));
console.log("has API_BASE_URL:", r.next.includes("API_BASE_URL"));
console.log("has response.json:", r.next.includes("response.json"));
