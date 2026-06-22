const fs = require("node:fs");
const PizZip = require("pizzip");

// BM-004: show every mustache in DOCX order
const buf = fs.readFileSync("D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-004/BM-004_normalized.docx");
const zip = new PizZip(buf);
const xml = zip.file("word/document.xml").asText();

// Show paragraph context for each mustache
const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
let m;
let count = 0;
while ((m = paraRe.exec(xml)) !== null) {
  const para = m[0];
  if (!para.includes("{{")) continue;
  const text = [...para.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(r => r[1]).join("");
  const stripped = text.replace(/\s+/g, " ").trim();
  const musts = [...para.matchAll(/\{\{([^}]+)\}\}/g)].map(r => r[1]);
  count++;
  console.log("P" + count + ": \"" + stripped.slice(0, 100) + "\" => " + musts.join(", "));
}

// Also show contract slots
const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked/BM-004__2775520fd22c.contract.locked.json", "utf8"));
console.log("\nContract slots (" + c.docxSlots.length + "):");
c.docxSlots.forEach((s, i) => console.log("  [" + i + "] " + s.slotId));
