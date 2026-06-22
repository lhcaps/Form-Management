import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-021/BM-021_normalized.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

// Find all mustache placeholders
const mustacheMatches = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)];
console.log("Mustache placeholders:", mustacheMatches.length);
for (const m of mustacheMatches) {
  console.log("  {{" + m[1] + "}}");
}

// Find unresolved ellipsis
const ellipsisMatches = [...docXml.matchAll(/[…._]{3,}/g)];
console.log("\nUnresolved ellipsis:", ellipsisMatches.length);
for (const m of ellipsisMatches) {
  console.log("  raw:", JSON.stringify(m[0]));
}

// Find all <w:t> tags
const tMatches = [...docXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)];
console.log("\nAll text runs with ellipsis:");
for (const m of tMatches) {
  const content = m[1];
  if (/[…._]{3,}/.test(content)) {
    console.log("  " + JSON.stringify(content.slice(0, 100)));
  }
}
