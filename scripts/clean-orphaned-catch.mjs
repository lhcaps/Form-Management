#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "D:/Study/Project/QLLaw-main/apps/web/src/components/documents";

function listBmPanelFiles(dir) {
  return readdirSync(dir)
    .filter((f) => /^bm-\d{3}-form-inputs\.tsx$/.test(f))
    .map((f) => join(dir, f));
}

function cleanOrphanedCatch(path) {
  let src = readFileSync(path, "utf8");
  const orig = src;

  let changes = 0;

  // Find all requestSave function definitions
  const funcPattern = /async function requestSave\([^)]+\)[^{]*\{[^}]*await saveDocumentFormInputs[^}]*\}\s*catch\s*\(/g;
  let match;

  while ((match = funcPattern.exec(src)) !== null) {
    const funcStart = match.index;
    const funcEnd = match.index + match[0].length;

    // Find the start of catch block
    const catchIdx = src.indexOf("catch", funcEnd);
    if (catchIdx === -1) break;

    // Find catch's opening brace
    const catchBraceOpen = src.indexOf("{", catchIdx);
    if (catchBraceOpen === -1) break;

    // Find matching closing brace for catch block
    let depth = 0;
    let catchClose = -1;
    for (let i = catchBraceOpen; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") { depth--; if (depth === 0) { catchClose = i; break; } }
    }

    if (catchClose === -1) break;

    // Find the function's closing brace (the one before catch)
    const funcClose = src.lastIndexOf("}", catchIdx);

    // Check if this is the orphaned pattern
    const between = src.slice(funcEnd, funcClose);
    if (between.includes("function ") || between.includes("=>") || between.includes("try")) break;

    // Remove from function close } to end of catch block
    src = src.slice(0, funcClose + 1) + "\n" + src.slice(catchClose + 1);
    changes++;
    funcPattern.lastIndex = 0;
  }

  if (changes > 0) {
    writeFileSync(path, src, "utf8");
    console.log("cleaned " + changes + " orphaned catch blocks in " + path);
    return { cleaned: changes };
  }
  return { cleaned: 0 };
}

const files = listBmPanelFiles(ROOT);
let totalCleaned = 0;
for (const f of files) {
  const result = cleanOrphanedCatch(f);
  if (result.cleaned > 0) totalCleaned += result.cleaned;
}
console.log("Total cleaned: " + totalCleaned);
