import fs from "node:fs";
import PizZip from "pizzip";
import path from "node:path";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/58-Lệnh tạm giam.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

function stripXmlTags(xml) {
  return xml.replace(/<[^>]+>/g, "");
}

// Check all text box patterns
const patterns = [
  "<wps:txbx>",
  "<w:txbxContent>",
  "<mc:AlternateContent>",
  "<w:drawing>",
];

for (const p of patterns) {
  const count = (docXml.match(new RegExp(p, "g")) ?? []).length;
  console.log(p + ":", count, "occurrences");
}

// Show the wps:txbx content
const wpsRe = /<wps:txbx>([\s\S]*?)<\/wps:txbx>/gu;
let tx;
while ((tx = wpsRe.exec(docXml)) !== null) {
  const content = tx[1];
  const text = stripXmlTags(content).replace(/\s+/g, " ").trim();
  console.log("\nwps:txbx content:", JSON.stringify(text.slice(0, 150)));
  const runs = [...content.matchAll(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/gu)];
  for (const run of runs) {
    const text = run[0].replace(/<[^>]+>/g, "");
    if (/[…._]{3,}/.test(text)) {
      console.log("  ELLIPSIS RUN:", JSON.stringify(text));
    }
  }
}

// Check w:txbxContent
const txbxRe = /<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/gu;
let t;
while ((t = txbxRe.exec(docXml)) !== null) {
  const content = t[1];
  const text = stripXmlTags(content).replace(/\s+/g, " ").trim();
  console.log("\nw:txbxContent:", JSON.stringify(text.slice(0, 150)));
  const runs = [...content.matchAll(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/gu)];
  for (const run of runs) {
    const text = run[0].replace(/<[^>]+>/g, "");
    if (/[…._]{3,}/.test(text)) {
      console.log("  ELLIPSIS RUN:", JSON.stringify(text));
    }
  }
}
