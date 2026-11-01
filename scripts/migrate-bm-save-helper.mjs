#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "D:/Study/Project/QLLaw-main/apps/web/src/components/documents";

function listBmPanelFiles(dir) {
  return readdirSync(dir)
    .filter((f) => /^bm-\d{3}-form-inputs\.tsx$/.test(f))
    .map((f) => join(dir, f));
}

function findMatchingBrace(src, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function findMatchingParen(src, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function findMatchingQuote(src, startIdx) {
  const quote = src[startIdx];
  let i = startIdx + 1;
  while (i < src.length) {
    if (src[i] === quote && src[i-1] !== "\\") return i;
    i++;
  }
  return -1;
}

function migrateFile(path) {
  let src = readFileSync(path, "utf8");
  const orig = src;

  const URL = '`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`';
  const urlIdx = src.indexOf(URL);
  if (urlIdx === -1) return { skipped: true };

  const awaitFetchIdx = src.lastIndexOf("await fetch(", urlIdx);
  if (awaitFetchIdx === -1) return { skipped: true };

  // === Step 1: Extract body expression ===
  let i = urlIdx + 1;
  while (i < src.length && src[i] !== "`") i++;
  const closeBacktick = i;
  i = closeBacktick + 1;
  while (i < src.length && (/\s/.test(src[i]) || src[i] === ",")) i++;
  if (src[i] !== "{") return { skipped: true };
  const initOpen = i;
  const initClose = findMatchingBrace(src, initOpen);
  if (initClose === -1) return { skipped: true };

  const initInner = src.slice(initOpen + 1, initClose);
  const bodyMatch = initInner.match(/body\s*:\s*JSON\.stringify\s*\(\s*([\s\S]*?)\s*\)\s*,?\s*$/);
  if (!bodyMatch) return { skipped: true };
  const bodyExpr = bodyMatch[1].trim();

  i = initClose + 1;
  while (i < src.length && (/\s/.test(src[i]) || src[i] === ",")) i++;
  const fetchClose = i;

  // === Step 2: Find statement start and indentation ===
  let stmtStart = awaitFetchIdx;
  while (stmtStart > 0 && src[stmtStart - 1] !== "\n" && src[stmtStart - 1] !== "\r") stmtStart--;
  const prefix = src.slice(stmtStart, awaitFetchIdx);
  const indentMatch = prefix.match(/^(\s*)[\w\s]*=\s*$/);
  const indent = indentMatch ? indentMatch[1] : prefix.replace(/^(\s*).*/, "$1");

  // === Step 3: Find setMessage call with success message ===
  // Find the success message text
  const dauLuuIdx = src.indexOf("Đã lưu");
  if (dauLuuIdx === -1) return { skipped: true };

  // Walk backward to find the start of the setMessage call
  let searchBack = dauLuuIdx;
  while (searchBack > 0) {
    const slice = src.slice(Math.max(0, searchBack - 50), searchBack);
    const setMsgMatch = slice.match(/setMessage\s*\(/);
    if (setMsgMatch) {
      const setMsgStart = Math.max(0, searchBack - 50) + setMsgMatch.index;
      // Verify Đã lưu is within this setMessage call
      const closeParen = findMatchingParen(src, setMsgStart);
      if (closeParen !== -1 && dauLuuIdx < closeParen) {
        // Walk forward from setMsgStart to find the closing paren
        const setMsgClose = closeParen;
        // Find the statement containing setMessage
        let finalStmtStart = setMsgStart;
        while (finalStmtStart > 0 && src[finalStmtStart - 1] !== "\n") finalStmtStart--;
        let finalStmtEnd = setMsgClose + 1;
        while (finalStmtEnd < src.length && (/\s/.test(src[finalStmtEnd]) || src[finalStmtEnd] === ";")) finalStmtEnd++;

        // Build replacement
        const replacement = indent + "await saveDocumentFormInputs(documentId, " + bodyExpr + ");";
        src = src.slice(0, stmtStart) + replacement + src.slice(finalStmtEnd);

        // Fix imports
        const importRe = /import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/document-form-api["']\s*;/;
        if (importRe.test(src)) {
          const m = src.match(importRe);
          const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
          if (!names.includes("saveDocumentFormInputs")) {
            names.push("saveDocumentFormInputs");
            names.sort();
            src = src.replace(importRe, `import { ${names.join(", ")} } from "@/lib/document-form-api";`);
          }
        } else {
          const firstImport = src.match(/^import\s+[^;]+;\s*$/m);
          if (firstImport) {
            const insertAt = firstImport.index + firstImport[0].length;
            src = src.slice(0, insertAt) + "\nimport { saveDocumentFormInputs } from \"@/lib/document-form-api\";" + src.slice(insertAt);
          }
        }

        // Remove unused API_BASE_URL
        const apiBaseCount = (src.match(/\bAPI_BASE_URL\b/g) || []).length;
        if (apiBaseCount <= 1) {
          src = src.replace(/^const\s+API_BASE_URL\s*=\s*[\s\S]*?;\s*\n/m, "");
        }

        if (src !== orig) {
          writeFileSync(path, src, "utf8");
          return { migrated: true };
        }
        return { skipped: true };
      }
    }
    // Move back another 50 chars
    if (searchBack - 50 < 0) break;
    searchBack -= 50;
  }
  return { skipped: true };
}

const files = listBmPanelFiles(ROOT);
let migrated = 0, skipped = 0, errors = 0;
for (const f of files) {
  try {
    const r = migrateFile(f);
    if (r.migrated) { migrated++; console.log("migrated " + f); }
    else skipped++;
  } catch (err) {
    errors++;
    console.error("ERROR " + f + ": " + err.message);
  }
}
console.log("\n" + migrated + " migrated, " + skipped + " skipped, " + errors + " errors.");
