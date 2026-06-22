import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/58-Lệnh tạm giam.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

// Count ALL ellipsis spans from ALL <w:t> runs (including text boxes)
const allRuns = [...docXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu)];
let pureCount = 0, mixedCount = 0, noEllipsis = 0;
for (const run of allRuns) {
  const content = run[1];
  const trimmed = content.trim();
  if (/^[…\.\_]+$/.test(trimmed)) {
    pureCount++;
  } else {
    const spans = (content.match(/[…\.\_]{3,}/g) ?? []).length;
    if (spans > 0) mixedCount += spans;
    else noEllipsis++;
  }
}
console.log("Pure ellipsis runs:", pureCount);
console.log("Mixed ellipsis spans:", mixedCount);
console.log("Runs without ellipsis:", noEllipsis);
console.log("Total expected mustaches:", pureCount + mixedCount);
console.log("Mustaches in normalized:", [...docXml.matchAll(/\{\{[^}]+\}\}/g)].length);
