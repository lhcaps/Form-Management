import fs from "node:fs";
import PizZip from "pizzip";
import path from "node:path";

const __dirname = path.dirname(fs.realpathSync(".")); // won't work, use process.cwd()
const DOCX_OUT = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058";
const files = fs.readdirSync(DOCX_OUT).filter((f) => f.endsWith(".docx")).sort();
console.log("Files:", files);

// Use the LO-converted file (not normalized)
const loFile = files.find((f) => f.includes("-") && !f.includes("normalized"));
const docxPath = path.join(DOCX_OUT, loFile ?? files[files.length - 1]);
console.log("Reading:", docxPath);

const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

function stripXmlTags(xml) {
  return xml.replace(/<[^>]+>/g, "");
}

// Count in paragraphs
const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu;
let paraCount = 0, paraPos = 0;
let m;
while ((m = paraRe.exec(docXml)) !== null) {
  const rawPara = m[0];
  const text = stripXmlTags(rawPara).replace(/\s+/g, " ").trim();
  if (!/[…._]{3,}/.test(text)) continue;
  paraPos++;
  const tRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu;
  let tMatch;
  while ((tMatch = tRe.exec(rawPara)) !== null) {
    const runText = tMatch[1];
    const ellipsisRe = /[…\.\_]{3,}/g;
    let eMatch;
    while ((eMatch = ellipsisRe.exec(runText)) !== null) paraCount++;
  }
}
console.log("\nParagraph ellipsis spans:", paraCount, "(in", paraPos, "paragraphs)");

// Count in text boxes (wps:txbx)
const txbxRe = /<wps:txbx>([\s\S]*?)<\/wps:txbx>/gu;
let txbxCount = 0, txbxPos = 0;
let tx;
while ((tx = txbxRe.exec(docXml)) !== null) {
  const content = tx[1];
  const text = stripXmlTags(content).replace(/\s+/g, " ").trim();
  if (!/[…._]{3,}/.test(text)) continue;
  txbxPos++;
  const tRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu;
  let tMatch;
  while ((tMatch = tRe.exec(content)) !== null) {
    const runText = tMatch[1];
    const ellipsisRe = /[…\.\_]{3,}/g;
    let eMatch;
    while ((eMatch = ellipsisRe.exec(runText)) !== null) txbxCount++;
  }
}
console.log("Text box ellipsis spans:", txbxCount, "(in", txbxPos, "text boxes)");

console.log("\nTotal ellipsis spans:", paraCount + txbxCount);
console.log("Mustaches:", [...docXml.matchAll(/\{\{[^}]+\}\}/g)].length);
