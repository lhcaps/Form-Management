import fs from "node:fs";
import PizZip from "pizzip";

// Check what evidence.textBefore contains in draft contracts for GenericTemplate BMs
const codes = ["BM-051", "BM-186", "BM-194"];
for (const code of codes) {
  const drafts = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts")
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.draft.json"));
  if (drafts.length === 0) continue;
  const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/" + drafts[0], "utf8"));
  console.log("\n" + code + " slots:");
  for (const slot of c.docxSlots) {
    const tb = slot.evidence?.textBefore || slot.context || "";
    console.log("  " + slot.slotId + " | " + tb.slice(0, 60));
  }
}

// Also check: can we extract paragraph text from the DOCX using the paragraph index from contract?
// The contract has location.blockId like "P0001", "P0002"
console.log("\n\nBM-051: checking DOCX paragraph text for blockId reference");
const buf = fs.readFileSync("D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-051/BM-051_normalized.docx");
const zip = new PizZip(buf);
const docXml = zip.file("word/document.xml").asText();
const paras = [...docXml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)];
console.log("Total paragraphs:", paras.length);
// Show first paragraph text
if (paras.length > 0) {
  const text = [...paras[0][0].matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(r => r[1]).join("");
  console.log("P1 text:", text.replace(/\s+/g, " ").trim().slice(0, 100));
}
if (paras.length > 1) {
  const text = [...paras[1][0].matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(r => r[1]).join("");
  console.log("P2 text:", text.replace(/\s+/g, " ").trim().slice(0, 100));
}
