import fs from "node:fs";
import PizZip from "pizzip";

// BM-051: check the draft contract for hints
const drafts = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts")
  .filter(f => f.startsWith("BM-051__") && f.endsWith(".contract.draft.json"));
if (drafts.length > 0) {
  const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/" + drafts[0], "utf8"));
  console.log("BM-051 slots:", c.docxSlots.map(s => s.slotId + " | " + (s.evidence?.textBefore || "").slice(0, 40)));
}

// BM-186: also check
const drafts186 = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts")
  .filter(f => f.startsWith("BM-186__") && f.endsWith(".contract.draft.json"));
if (drafts186.length > 0) {
  const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/" + drafts186[0], "utf8"));
  console.log("\nBM-186 slots:", c.docxSlots.map(s => s.slotId + " | " + (s.evidence?.textBefore || "").slice(0, 40)));
}

// Check how many generic mustaches each of these 64 BMs have
const DOCX_OUT = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx";
const totalGeneric = [];
for (let i = 1; i <= 213; i++) {
  const code = "BM-" + String(i).padStart(3, "0");
  const normPath = `${DOCX_OUT}/${code}/${code}_normalized.docx`;
  if (!fs.existsSync(normPath)) continue;
  const buf = fs.readFileSync(normPath);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();
  const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)];
  const generic = musts.filter(m => /^[a-z]+\.field\d+$/i.test(m[1]));
  if (generic.length > 0) {
    const fp = `D:/Study/Project/QLLaw-main/apps/web/src/components/documents/${code.toLowerCase()}-form-inputs.tsx`;
    const usesGeneric = fs.existsSync(fp) && fs.readFileSync(fp, "utf8").includes("GenericTemplateFormInputsPanel");
    totalGeneric.push({ code, generic: generic.length, total: musts.length, usesGeneric });
  }
}
console.log("\nAll BMs with generic mustaches:");
console.log("Uses GenericTemplate:", totalGeneric.filter(b => b.usesGeneric).length);
console.log("Without GenericTemplate:", totalGeneric.filter(b => !b.usesGeneric).length);
console.log("Total generic mustaches:", totalGeneric.reduce((a, b) => a + b.generic, 0));
