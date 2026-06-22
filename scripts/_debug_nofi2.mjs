import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";

// Find which BMs have form-inputs but still report NOMAP
const FORM_DIR = "D:/Study/Project/QLLaw-main/apps/web/src/components/documents";
const files = fs.readdirSync(FORM_DIR).filter(f => f.endsWith("-form-inputs.tsx"));
const allFI = new Set(files.map(f => f.replace("-form-inputs.tsx", "").toUpperCase()));

const DOCX_OUT = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx";
const needFix = [];

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
    const hasFI = allFI.has(code);
    const fiPath = path.join(FORM_DIR, code.toLowerCase() + "-form-inputs.tsx");
    const exists = fs.existsSync(fiPath);
    needFix.push({ code, generic: generic.length, total: musts.length, hasFI, fiExists: exists });
  }
}

console.log("BMs still needing fix:", needFix.length);
console.log("\nFirst 10:");
for (const bm of needFix.slice(0, 10)) {
  console.log("  " + bm.code + ": " + bm.generic + "/" + bm.total + " generic, FI=" + bm.hasFI + ", exists=" + bm.fiExists);
}

// Check why BM-162 still has generic (it showed as NOMAP before)
const bm162 = needFix.find(b => b.code === "BM-162");
console.log("\nBM-162:", bm162);

// Read BM-162 form-inputs to see what tags it uses
if (bm162) {
  const fp = path.join(FORM_DIR, "bm-162-form-inputs.tsx");
  const content = fs.readFileSync(fp, "utf8");
  console.log("\nBM-162 file length:", content.length);
  const bmFieldTags = [...content.matchAll(/<BmField/gi)];
  console.log("BmField occurrences:", bmFieldTags.length);
  const fieldTags = [...content.matchAll(/<[Ff]ield/gi)];
  console.log("Field occurrences:", fieldTags.length);
  console.log("First 200 chars:", content.slice(0, 200));
}
