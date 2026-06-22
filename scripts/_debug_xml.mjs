import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-021/BM-021_normalized.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

// Find paragraphs containing ellipsis
const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu;
let count = 0;
let m;
while ((m = paraRe.exec(docXml)) !== null) {
  const text = m[0].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (/[…._]{3,}/.test(text)) {
    count++;
    console.log(`\n=== Para ${count} (${text.length} chars) ===`);
    console.log(text.slice(0, 200));

    // Show raw XML structure
    // Find all runs in this paragraph
    const runRe = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
    let r;
    let runCount = 0;
    while ((r = runRe.exec(m[0])) !== null) {
      runCount++;
      const runText = r[0].replace(/<[^>]+>/g, "");
      const hasEllipsis = /[…._]{3,}/.test(runText);
      console.log(`  Run ${runCount}: [${runText.slice(0, 80)}]${hasEllipsis ? " ***ELLIPSIS***" : ""}`);
    }

    if (count >= 10) break;
  }
}
console.log(`\nTotal paragraphs with ellipsis: ${count}`);
