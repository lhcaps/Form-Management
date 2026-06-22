import fs from "node:fs";

// BM-051: check what tags it uses
const fp = "D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-051-form-inputs.tsx";
const c = fs.readFileSync(fp, "utf8");
console.log("Length:", c.length);
console.log("BmField:", (c.match(/<BmField/g) || []).length);
console.log("Field:", (c.match(/<Field\b/g) || []).length);
console.log("FormField:", (c.match(/<FormField/g) || []).length);
console.log("TextField:", (c.match(/<TextField/g) || []).length);
console.log("Uses GenericTemplate:", c.includes("GenericTemplateFormInputsPanel"));

// Show first 400 chars
console.log("\nFirst 400 chars:");
console.log(c.slice(0, 400));

// Check if there's any Field-like pattern
const patterns = ["BmField", "Field", "Input", "Textarea", "DateInput", "Select"];
for (const p of patterns) {
  const count = (c.match(new RegExp("<" + p, "g")) || []).length;
  if (count > 0) console.log("<" + p + ": " + count);
}
