import fs from "node:fs";
import path from "node:path";

// Check BmField tag structure in BM-004
const content = fs.readFileSync("D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-004-form-inputs.tsx", "utf8");

// Find BmFieldText tags - they might be multi-line
const idx = content.indexOf("<BmFieldText");
const snippet = content.slice(idx, idx + 300);
console.log("First BmFieldText:\n" + snippet);
