import fs from "node:fs";
import PizZip from "pizzip";

// BM-004: Check exactly what mustaches exist vs contract slots
const code = "BM-004";
const normFile = `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/${code}/${code}_normalized.docx`;
const buf = fs.readFileSync(normFile);
const zip = new PizZip(buf);
const docXml = zip.file("word/document.xml").asText();

const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());
console.log("DOCX mustaches (" + musts.length + "):");
musts.forEach((m, i) => console.log("  [" + i + "] " + m));

const drafts = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts")
  .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/" + drafts[0], "utf8"));
console.log("\nContract slots (" + c.docxSlots.length + "):");
c.docxSlots.forEach((s, i) => console.log("  [" + i + "] " + s.slotId));
