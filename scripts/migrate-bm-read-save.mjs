#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "D:/Study/Project/QLLaw-main/apps/web/src/components/documents";

function listBmPanelFiles(dir) {
  return readdirSync(dir)
    .filter((f) => /^bm-\d{3}-form-inputs\.tsx$/.test(f))
    .map((f) => join(dir, f));
}

function migrateFile(path) {
  let src = readFileSync(path, "utf8");
  const orig = src;
  let changed = false;

  // Add imports if needed
  const dfaImport = /import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/document-form-api["']\s*;/;
  const hasDfaImport = dfaImport.test(src);

  const importSnippet = `import { getDocumentRenderPayload, saveDocumentFormInputs } from "@/lib/document-form-api";`;

  // === READ PATH: Replace render-payload fetch with getDocumentRenderPayload ===
  // Pattern: fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, ...)
  const readPattern = /fetch\s*\(\s*`\$\{API_BASE_URL\}\/documents\/generated\/\$\{documentId\}\/render-payload`\s*,\s*\{[^}]*\}\s*\)/s;
  const readMatch = src.match(readPattern);

  if (readMatch) {
    // Find the load function context
    const loadFnStart = src.lastIndexOf("async function load()", readMatch.index);
    const loadFnEnd = src.indexOf("}", readMatch.index) + 1;

    // Extract indentation
    const lineStart = src.lastIndexOf("\n", readMatch.index) + 1;
    const indent = src.slice(lineStart, readMatch.index).match(/^(\s*)/)?.[1] || "        ";

    // Replace with getDocumentRenderPayload
    const replacement = `${indent}const payload = await getDocumentRenderPayload<JsonObject>(documentId);`;
    src = src.slice(0, loadFnStart) + src.slice(loadFnStart, readMatch.index) + replacement + src.slice(readMatch.index + readMatch[0].length);
    changed = true;
  }

  // === SAVE PATH: Replace form-inputs fetch with saveDocumentFormInputs ===
  // Pattern: fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, { method: "POST", ... })
  const savePattern = /fetch\s*\(\s*`\$\{API_BASE_URL\}\/documents\/generated\/\$\{documentId\}\/form-inputs`\s*,\s*\{\s*method:\s*["']POST["'][^}]+\}[^}]*\}/s;
  const saveMatch = src.match(savePattern);

  if (saveMatch) {
    // Find the handleSave function context
    const handleSaveStart = src.lastIndexOf("async function handleSave()", saveMatch.index);

    // Extract indentation
    const lineStart = src.lastIndexOf("\n", saveMatch.index) + 1;
    const indent = src.slice(lineStart, saveMatch.index).match(/^(\s*)/)?.[1] || "        ";

    // Replace with saveDocumentFormInputs
    const replacement = `${indent}await saveDocumentFormInputs(documentId, body);`;
    src = src.slice(0, handleSaveStart) + src.slice(handleSaveStart, saveMatch.index) + replacement + src.slice(saveMatch.index + saveMatch[0].length);
    changed = true;
  }

  // Add import if needed
  if (changed && !hasDfaImport) {
    const insertPoint = src.match(/^import\s+[^;]+;\s*$/m);
    if (insertPoint) {
      const insertAt = insertPoint.index + insertPoint[0].length;
      src = src.slice(0, insertAt) + "\n" + importSnippet + src.slice(insertAt);
    }
  }

  if (src !== orig) {
    writeFileSync(path, src, "utf8");
    return { migrated: true };
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
