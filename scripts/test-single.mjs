#!/usr/bin/env node
import { readFileSync } from "node:fs";

const src = readFileSync("D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-005-form-inputs.tsx", "utf8");

const URL = "`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`";
const urlIdx = src.indexOf(URL);
const awaitFetchIdx = src.lastIndexOf("await fetch(", urlIdx);

console.log("urlIdx:", urlIdx, "awaitFetchIdx:", awaitFetchIdx);

// The line is: "      const response = await fetch("
// awaitFetchIdx = position of 'a' in "await fetch("
// We need to replace from the start of "await" to after the closing ")"
// Result should be: "      await saveDocumentFormInputs(...);"
// NOT: "      const response = await saveDocumentFormInputs(...)"

// So we replace from awaitFetchIdx (start of "await") to fetchClose+1 (past ')')
// And the replacement is "await saveDocumentFormInputs(...)"

// But wait — there's no "const response = " before "await" in some files!
// Let me check: does the file use `const response = await fetch` or just `await fetch`?
const lineStart = src.lastIndexOf("\n", awaitFetchIdx - 1) + 1;
const lineContent = src.slice(lineStart, awaitFetchIdx);
console.log("lineContent:", JSON.stringify(lineContent));
console.log("has 'const ':", lineContent.includes("const "));

// So we need:
// If "const " before await: replace from lineStart (before "const") to after ")"
// If no "const ": replace from awaitFetchIdx to after ")"

// The indent is the leading whitespace
const indentMatch = lineContent.match(/^(\s*)/);
const indent = indentMatch ? indentMatch[1] : "";
console.log("indent:", JSON.stringify(indent));

// So the correct replacement target:
// stmtStart = awaitFetchIdx (start of "await")
// stmtEnd = fetchClose + 1
// replacement = indent + "await saveDocumentFormInputs(documentId, body);"
// BUT this removes "const response = " which is what we want!

console.log("\nCorrect approach:");
console.log("Replace from awaitFetchIdx to fetchClose+1");
console.log("Replacement:", JSON.stringify(indent + "await saveDocumentFormInputs(documentId, body);"));