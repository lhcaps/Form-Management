import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-021/21-QĐ không khởi tố vụ án hình sự.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

const tRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
let count = 0;
let m;
const positions = [];
while ((m = tRe.exec(docXml)) !== null) {
  const content = m[1];
  if (/[…._]{3,}/.test(content)) {
    count++;
    positions.push({ idx: count, content: content.slice(0, 100) });
    console.log(`${count}: ${JSON.stringify(content.slice(0, 100))}`);
  }
}
console.log(`\nTotal: ${count} text runs with ellipsis`);

// Also check paragraph structure
const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu;
let pCount = 0;
let pm;
while ((pm = paraRe.exec(docXml)) !== null) {
  const text = pm[0].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (/[…._]{3,}/.test(text)) {
    pCount++;
    console.log(`\nPara ${pCount}: ${text.slice(0, 120)}`);
  }
}
console.log(`\nTotal paragraphs with ellipsis: ${pCount}`);
