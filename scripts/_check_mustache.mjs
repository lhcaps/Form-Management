import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-021/BM-021_normalized.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

const mustaches = [...docXml.matchAll(/\{\{[^}]+\}\}/g)];
console.log("Mustache count:", mustaches.length);
for (const m of mustaches) {
  console.log("  " + m[0]);
}

const PLACEHOLDER_PATTERN = /\{\{([^{}]+)\}\}|\{([^{}]{3,})\}\}/g;
const matches = [...docXml.matchAll(PLACEHOLDER_PATTERN)];
console.log("\nPattern matches:", matches.length);
for (const m of matches) {
  console.log("  path:", JSON.stringify(m[1] ?? m[2]));
}
