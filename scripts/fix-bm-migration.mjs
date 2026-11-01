#!/usr/bin/env node
/**
 * Fix the broken migration: `try {\nawait saveDocumentFormInputs(...)` → `try {\n  await saveDocumentFormInputs(...);`
 * Also fix `}setMessage(` → `}\n  setMessage(` etc.
 * Also fix missing `const response = await saveDocumentFormInputs` → `const response = await saveDocumentFormInputs`.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "apps/web/src/components/documents";

function listBmPanelFiles(dir) {
  return readdirSync(dir)
    .filter((f) => /^bm-\d{3}-form-inputs\.tsx$/.test(f))
    .map((f) => join(dir, f));
}

function fixFile(path) {
  let src = readFileSync(path, "utf8");
  const orig = src;

  // Fix 1: `try {\nawait saveDocumentFormInputs` → `try {\n  await saveDocumentFormInputs(...);`
  // The problem is `try {` followed by the call without proper separation.
  src = src.replace(
    /try \{\nawait (saveDocumentFormInputs\([^)]+\)\))/g,
    "try {\n  await $1;",
  );

  // Fix 2: `});setMessage(` → `});\n  setMessage(`
  src = src.replace(/\}\);(\s*\n?\s*set\w+)/g, "});\n$1");

  // Fix 3: `}catch(` → `}\n  catch(`
  src = src.replace(/\}(\s*catch\s*\()/g, "}\n$1");

  // Fix 4: `}finally(` → `}\n  finally(`
  src = src.replace(/\}(\s*finally\s*\()/g, "}\n$1");

  // Fix 5: `const response = await await saveDocumentFormInputs` → `const response = await saveDocumentFormInputs`
  src = src.replace(/await await (saveDocumentFormInputs)/g, "await $1");

  // Fix 6: `try {\n  await saveDocumentFormInputs(...)}` (no semicolon, next line is setMessage)
  // Already handled by Fix 1

  if (src !== orig) {
    writeFileSync(path, src, "utf8");
    return { fixed: true, path };
  }
  return { fixed: false };
}

const files = listBmPanelFiles(ROOT);
let fixed = 0;
let unchanged = 0;
for (const f of files) {
  const r = fixFile(f);
  if (r.fixed) {
    console.log(`fixed ${f}`);
    fixed += 1;
  } else {
    unchanged += 1;
  }
}
console.log(`\n${fixed} file(s) fixed, ${unchanged} unchanged.`);