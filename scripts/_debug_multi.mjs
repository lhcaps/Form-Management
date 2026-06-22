import fs from "node:fs";
import PizZip from "pizzip";

// Check a few BMs: BM-004, BM-058, BM-072 to verify positional mapping
function checkBM(code) {
  const buf = fs.readFileSync(`D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/${code}/${code}_normalized.docx`);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();

  // Count generic mustaches in paragraphs
  const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  const mustaches = [];
  let m;
  while ((m = paraRe.exec(docXml)) !== null) {
    const para = m[0];
    if (!para.includes("{{")) continue;
    const text = [...para.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(r => r[1]).join("");
    const stripped = text.replace(/\s+/g, " ").trim();
    const musts = [...para.matchAll(/\{\{([^}]+)\}\}/g)].map(r => r[1]);
    for (const must of musts) {
      mustaches.push({ mustache: must, text: stripped.slice(0, 80) });
    }
  }
  console.log(code + ": " + mustaches.length + " mustaches");
  mustaches.slice(0, 15).forEach((item, i) => {
    console.log("  [" + i + "] {{" + item.mustache + "}} in \"" + item.text + "\"");
  });
}

checkBM("BM-004");
console.log();
checkBM("BM-058");
console.log();
checkBM("BM-072");
