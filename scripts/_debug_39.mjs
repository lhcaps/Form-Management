import fs from "node:fs";
import PizZip from "pizzip";

// Analyze each problematic BM
const PROBLEMATIC = ["BM-002","BM-004","BM-021","BM-031","BM-036","BM-044","BM-054","BM-139","BM-156","BM-159"];

for (const code of PROBLEMATIC) {
  const normFile = `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/${code}/${code}_normalized.docx`;
  if (!fs.existsSync(normFile)) { console.log(code + ": NO DOCX"); continue; }

  const buf = fs.readFileSync(normFile);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();
  const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());

  const lockedFiles = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked")
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (lockedFiles.length === 0) { console.log(code + ": NO LOCKED"); continue; }
  const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked/" + lockedFiles[0], "utf8"));
  const slotIds = (c.docxSlots || []).map(s => s.slotId);

  const inDocxNotContract = musts.filter(m => !slotIds.includes(m));
  const inContractNotDocx = slotIds.filter(s => !musts.includes(s));

  console.log("\n" + code + ": DOCX=" + musts.length + " slots=" + slotIds.length);
  if (inDocxNotContract.length > 0) {
    console.log("  IN DOCX NOT CONTRACT (" + inDocxNotContract.length + "):");
    inDocxNotContract.forEach(m => console.log("    {{" + m + "}}"));
  }
  if (inContractNotDocx.length > 0) {
    console.log("  IN CONTRACT NOT DOCX (" + inContractNotDocx.length + "):");
    inContractNotDocx.forEach(s => console.log("    " + s));
  }
  if (inDocxNotContract.length === 0 && inContractNotDocx.length === 0) {
    console.log("  Counts differ but content same! DOCX has duplicate mustaches?");
    const unique = [...new Set(musts)];
    console.log("  Unique in DOCX: " + unique.length);
    console.log("  Slots: " + slotIds.length);
  }
}
