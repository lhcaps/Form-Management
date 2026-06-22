import fs from "node:fs";
import PizZip from "pizzip";

// Check full paragraph text around the first mustache in BM-004
const buf = fs.readFileSync("D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-004/BM-004_normalized.docx");
const zip = new PizZip(buf);
const docXml = zip.file("word/document.xml").asText();

// Find all paragraphs and extract their full text
const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
let m;
let count = 0;
while ((m = paraRe.exec(docXml)) !== null) {
  const para = m[0];
  if (para.includes("{{")) {
    // Extract all text from this paragraph
    const textRuns = [...para.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(r => r[1]).join("");
    const stripped = textRuns.replace(/\s+/g, " ").trim();
    if (stripped) {
      count++;
      console.log("P" + count + ": " + stripped.slice(0, 200));
    }
    if (count >= 20) break;
  }
}
