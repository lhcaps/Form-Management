import fs from "node:fs";

// Check BM-027 form type definition and field usage
const c = fs.readFileSync("D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-027-form-inputs.tsx", "utf8");

// Find the form type
const typeMatch = c.match(/type Bm027Form\s*=\s*\{[\s\S]*?\n\}/);
if (typeMatch) console.log("Form type:\n" + typeMatch[0].slice(0, 1000));

// Find Field usages
const fieldUsages = [...c.matchAll(/<Field\s+label\s*=\s*["']([^"']+)["']\s+value\s*=\s*\{form\.(\w+)\.(\w+)\}/g)];
console.log("\nField usages:", fieldUsages.length);
fieldUsages.slice(0, 20).forEach(m => console.log("  " + m[1] + " => " + m[2] + " (form." + m[2] + "." + m[3] + ")"));

// Check what approach these use vs the BmField approach
console.log("\nBmFormSection:", (c.match(/<BmFormSection/g) || []).length);
console.log("BmField usage:", (c.match(/<BmField/g) || []).length);
console.log("Field usage:", (c.match(/<Field\b/g) || []).length);
