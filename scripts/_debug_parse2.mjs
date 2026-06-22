import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";

// Simulate the exact parseFormInputs function from the script
const FORM_DIR = "D:/Study/Project/QLLaw-main/apps/web/src/components/documents";

function parseFormInputs(code) {
  const fp = path.join(FORM_DIR, code.toLowerCase() + "-form-inputs.tsx");
  console.log("Trying:", fp);
  console.log("Exists:", fs.existsSync(fp));
  if (!fs.existsSync(fp)) return null;
  const content = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const fields = [];
  let sectionTitle = "default";

  const lines = content.split("\n");
  for (const line of lines) {
    const secMatch = line.match(/<BmFormSection\s+title\s*=\s*["']([^"']+)["']/i);
    if (secMatch) { sectionTitle = secMatch[1].trim(); continue; }

    const fieldMatch = line.match(/<BmField(Text|Date|Textarea|Select)\s+([^>]+)>/);
    if (fieldMatch) {
      const attrs = fieldMatch[2];
      const lm = attrs.match(/label\s*=\s*["']([^"']+)["']/);
      const ltm = attrs.match(/label\s*=\s*\{\`([^`]+)\`\}/);
      let label = lm ? lm[1] : ltm ? ltm[1] : null;
      if (label) label = label.replace(/\$\{[^}]+\}/g, "…").trim();
      if (label) fields.push({ section: sectionTitle, label });
    }
  }
  console.log("Fields found:", fields.length);
  return fields.length > 0 ? fields : null;
}

const result = parseFormInputs("BM-004");
console.log("\nResult:", result ? result.slice(0, 3) : null);

// Also check a mustaches test
const docxFile = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-004/BM-004_normalized.docx";
const exists = fs.existsSync(docxFile);
console.log("\nDOCX exists:", exists);
if (exists) {
  const buf = fs.readFileSync(docxFile);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml")?.asText() || "";
  const mustRe = /\{\{([^}]+)\}\}/g;
  let match;
  let count = 0;
  while ((match = mustRe.exec(docXml)) !== null) count++;
  console.log("Mustaches in DOCX:", count);
  // Show first 3 mustaches with context
  const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].slice(0, 3);
  for (const m of musts) {
    const pos = docXml.indexOf(m[0]);
    const ctx = docXml.slice(Math.max(0, pos - 80), pos + m[0].length + 20).replace(/<[^>]+>/g, " ");
    console.log("  " + m[1].trim() + " ... " + ctx.replace(/\s+/g, " ").trim());
  }
}
