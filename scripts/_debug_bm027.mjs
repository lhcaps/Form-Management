import fs from "node:fs";
import path from "node:path";

// BM-027: has FI but NOMAP - check what tags it uses
const fp27 = "D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-027-form-inputs.tsx";
const c27 = fs.readFileSync(fp27, "utf8");
console.log("BM-027 file length:", c27.length);
console.log("BmField count:", (c27.match(/<BmField/g) || []).length);
console.log("First 300 chars:", c27.slice(0, 300));

// Check if it uses GenericTemplateFormInputsPanel
console.log("\nUses GenericTemplate:", c27.includes("GenericTemplateFormInputsPanel"));

// Check BmField usage in context
const lines = c27.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("BmField") || lines[i].includes("Field")) {
    console.log("LINE " + i + ": " + lines[i].trim().slice(0, 100));
    if (i > 5) break;
  }
}
