import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/BM-058_normalized.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

const ellipses = [...docXml.matchAll(/[…._]{3,}/g)];
console.log("Ellipsis residual:", ellipses.length);
for (const m of ellipses.slice(0, 10)) {
  const idx = docXml.indexOf(m[0]);
  const ctx = docXml.slice(Math.max(0, idx - 60), idx + m[0].length + 60);
  console.log("  " + JSON.stringify(ctx.replace(/<[^>]+>/g, " ")).slice(0, 120));
}

const mustaches = [...docXml.matchAll(/\{\{[^}]+\}\}/g)];
console.log("\nMustache:", mustaches.length);
for (const m of mustaches.slice(0, 10)) console.log("  " + m[0]);
