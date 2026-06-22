import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/58-Lệnh tạm giam.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

// Test: does extractEllipsisFromDocx logic find text box ellipsis?
function stripXmlTags(xml) {
  return xml.replace(/<[^>]+>/g, "");
}

const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu;
const positions = [];
let m;
let paraIndex = 0;

while ((m = paraRe.exec(docXml)) !== null) {
  paraIndex++;
  const rawPara = m[0];
  const text = stripXmlTags(rawPara).replace(/\s+/g, " ").trim();
  if (!/[…._]{3,}/.test(text)) continue;

  const blockId = `P${String(paraIndex).padStart(4, "0")}`;

  const tRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu;
  let tMatch;
  while ((tMatch = tRe.exec(rawPara)) !== null) {
    const runText = tMatch[1];
    const ellipsisRe = /[…\.\_]{3,}/g;
    let eMatch;
    while ((eMatch = ellipsisRe.exec(runText)) !== null) {
      positions.push({ blockId, runText: eMatch[0], paraText: text });
    }
  }
}

console.log("Positions found:", positions.length);
for (const p of positions) {
  console.log("  " + p.blockId + ": " + JSON.stringify(p.runText) + " in " + JSON.stringify(p.paraText.slice(0, 60)));
}
