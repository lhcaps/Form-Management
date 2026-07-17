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

  // Find raw render-payload fetch pattern
  const fetchPattern = /fetch\s*\(\s*`\$\{(?:API_BASE_URL|apiBase)}\/documents\/generated\/\$\{documentId\}\/render-payload`/;
  const match = fetchPattern.exec(src);
  if (!match) return { skipped: true };

  const fetchStart = match.index;
  const fetchEnd = fetchStart + match[0].length;

  // Walk backward from fetchStart to find the beginning of the statement line
  let stmtStart = fetchStart;
  while (stmtStart > 0) {
    const c = src[stmtStart - 1];
    if (c === "\n" || c === "\r") break;
    stmtStart--;
  }

  // Extract indentation only (leading whitespace)
  const lineContent = src.slice(stmtStart, fetchStart);
  const indentMatch = lineContent.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "";

  // Walk forward from fetchEnd to find semicolon
  let stmtEnd = fetchEnd;
  while (stmtEnd < src.length && src[stmtEnd] !== ";") stmtEnd++;
  stmtEnd++;

  // Replace with readApi call
  const replacement = indent + "const response = await readApi(documentId);";
  src = src.slice(0, stmtStart) + replacement + src.slice(stmtEnd);

  // Add import if needed
  const importRe = /import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/api-client["']\s*;/;
  if (importRe.test(src)) {
    const m = importRe.exec(src);
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.includes("readApi")) {
      names.push("readApi");
      names.sort();
      src = src.replace(importRe, "import { " + names.join(", ") + " } from \"@/lib/api-client\";");
    }
  } else {
    const firstImport = src.match(/^import\s+[^;]+;\s*$/m);
    if (firstImport) {
      const insertAt = firstImport.index + firstImport[0].length;
      src = src.slice(0, insertAt) + "\nimport { readApi } from \"@/lib/api-client\";" + src.slice(insertAt);
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
