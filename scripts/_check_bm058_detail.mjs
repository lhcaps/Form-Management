import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/BM-058_normalized.docx";
const zip = new PizZip(fs.readFileSync(docxPath));

// List all files in the docx
const entries = Object.keys(zip.files);
console.log("Files in DOCX:");
for (const e of entries) console.log("  " + e);

// Check for ellipsis in document.xml
const docXml = zip.file("word/document.xml")?.asText() ?? "";
const allXml = entries
  .filter((e) => e.startsWith("word/"))
  .map((e) => ({ name: e, content: zip.files[e]?.asText() ?? "" }));

for (const { name, content } of allXml) {
  const ellipses = [...content.matchAll(/[…._]{3,}/g)];
  if (ellipses.length > 0) {
    console.log(`\nEllipsis in ${name}: ${ellipses.length}`);
    for (const m of ellipses) {
      const idx = content.indexOf(m[0]);
      const ctx = content.slice(Math.max(0, idx - 40), idx + m[0].length + 40);
      console.log("  " + JSON.stringify(ctx).slice(0, 120));
    }
  }
}

// Also count mustaches
const mustaches = [...docXml.matchAll(/\{\{[^}]+\}\}/g)];
console.log("\nMustache in document.xml:", mustaches.length);
for (const m of mustaches) console.log("  " + m[0]);
