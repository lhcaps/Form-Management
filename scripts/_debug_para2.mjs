import fs from "node:fs";
import PizZip from "pizzip";

// Find full paragraph text containing mustaches in BM-004
const buf = fs.readFileSync("D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-004/BM-004_normalized.docx");
const zip = new PizZip(buf);
const docXml = zip.file("word/document.xml").asText();

// Show full XML of the first paragraph containing a mustache
const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
let m;
let count = 0;
while ((m = paraRe.exec(docXml)) !== null) {
  const para = m[0];
  if (para.includes("{{document.field1}}")) {
    console.log("Full XML of paragraph with {{document.field1}}:");
    console.log(para.slice(0, 2000));
    break;
  }
}

console.log("\n\n--- Full paragraph context for each mustache ---\n");

// Extract paragraphs with mustaches and their full text
count = 0;
const paraRe2 = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
while ((m = paraRe2.exec(docXml)) !== null) {
  const para = m[0];
  if (!para.includes("{{")) continue;
  const text = [...para.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(r => r[1]).join("");
  const stripped = text.replace(/\s+/g, " ").trim();
  const mustaches = [...para.matchAll(/\{\{([^}]+)\}\}/g)].map(r => r[1]);
  count++;
  console.log("Paragraph " + count + ": \"" + stripped.slice(0, 100) + "\"");
  console.log("  Mustaches:", mustaches.join(", "));
  if (count >= 15) break;
}
