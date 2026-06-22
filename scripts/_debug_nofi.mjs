import fs from "node:fs";
import PizZip from "pizzip";

// Check which BMs have form-inputs files vs which don't
const FORM_DIR = "D:/Study/Project/QLLaw-main/apps/web/src/components/documents";
const files = fs.readdirSync(FORM_DIR).filter(f => f.endsWith("-form-inputs.tsx"));
console.log("Total form-inputs.tsx files:", files.length);
const haveFI = new Set(files.map(f => f.replace("-form-inputs.tsx", "").toUpperCase()));
console.log("Sample:", [...haveFI].slice(0, 10));

// Count generic mustaches after fix
const DOCX_OUT = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx";
let totalWithGeneric = 0;
let totalMustaches = 0;
let totalGeneric = 0;
for (let i = 1; i <= 213; i++) {
  const code = "BM-" + String(i).padStart(3, "0");
  const normPath = `${DOCX_OUT}/${code}/${code}_normalized.docx`;
  if (!fs.existsSync(normPath)) continue;
  const buf = fs.readFileSync(normPath);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();
  const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)];
  const generic = musts.filter(m => /^[a-z]+\.field\d+$/i.test(m[1]));
  totalMustaches += musts.length;
  totalGeneric += generic.length;
  if (generic.length > 0) totalWithGeneric++;
}
console.log("\nAfter positional fix:");
console.log("BMs with generic mustaches:", totalWithGeneric);
console.log("Total generic mustaches remaining:", totalGeneric);
console.log("Total mustaches:", totalMustaches);
