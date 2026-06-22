import PizZip from "pizzip";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCX_OUT = path.join(__dirname, "..", "storage/templates/normalized-docx");

for (const code of ["BM-054", "BM-159"]) {
  const docxPath = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(docxPath)) { console.log(code + ": no DOCX"); continue; }

  const zip = new PizZip(fs.readFileSync(docxPath));
  const xml = zip.file("word/document.xml")?.asText() || "";
  const mustaches = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());
  const unique = [...new Set(mustaches)];

  console.log("\n=== " + code + " ===");
  unique.forEach((m, i) => console.log("  " + (i+1) + ". " + m));
}
