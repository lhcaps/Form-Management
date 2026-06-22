import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/58-Lệnh tạm giam.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

function stripXmlTags(xml) {
  return xml.replace(/<[^>]+>/g, "");
}

// Option A: count text box paragraphs
const txbxRe = /<wps:txbx>([\s\S]*?)<\/wps:txbx>/gu;
let txbxParaCount = 0, txbxPureCount = 0, txbxMixedCount = 0;
let tx;
while ((tx = txbxRe.exec(docXml)) !== null) {
  const content = tx[1];
  // Text boxes contain w:p elements
  const pInTxbx = [...content.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/gu)];
  txbxParaCount += pInTxbx.length;
  for (const para of pInTxbx) {
    const text = stripXmlTags(para[0]).replace(/\s+/g, " ").trim();
    if (!/[…._]{3,}/.test(text)) continue;
    const tRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu;
    let tMatch;
    while ((tMatch = tRe.exec(para[0])) !== null) {
      const runText = tMatch[1];
      const trimmed = runText.trim();
      if (/^[…\.\_]+$/.test(trimmed)) txbxPureCount++;
      else {
        const spans = (runText.match(/[…\.\_]{3,}/g) ?? []).length;
        txbxMixedCount += spans;
      }
    }
  }
}
console.log("Option A (text box paragraphs):");
console.log("  Text box paragraphs:", txbxParaCount);
console.log("  Pure:", txbxPureCount, "Mixed spans:", txbxMixedCount);

// Option B: count all runs in text boxes directly
const allTxbxRunsRe = /<wps:txbx>([\s\S]*?)<\/wps:txbx>/gu;
let txbxAllPure = 0, txbxAllMixed = 0;
let tx2;
while ((tx2 = allTxbxRunsRe.exec(docXml)) !== null) {
  const content = tx2[1];
  const allRuns = [...content.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gu)];
  for (const run of allRuns) {
    const c = run[1];
    const trimmed = c.trim();
    if (/^[…\.\_]+$/.test(trimmed)) txbxAllPure++;
    else {
      const spans = (c.match(/[…\.\_]{3,}/g) ?? []).length;
      if (spans > 0) txbxAllMixed += spans;
    }
  }
}
console.log("\nOption B (all text box runs):");
console.log("  Pure:", txbxAllPure, "Mixed spans:", txbxAllMixed);
console.log("  Total:", txbxAllPure + txbxAllMixed);

// From paragraph counting
const paragraphPure = 7 - txbxAllPure;
const paragraphMixed = 15 - txbxAllMixed;
console.log("\nInferred paragraph counts (7-1, 15-2):");
console.log("  Pure:", paragraphPure, "Mixed spans:", paragraphMixed);
console.log("  Total:", paragraphPure + paragraphMixed);

// Total
console.log("\nTotal ellipsis spans:", (paragraphPure + paragraphMixed) + (txbxAllPure + txbxAllMixed));
