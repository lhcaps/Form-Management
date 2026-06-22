import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import PizZip from "pizzip";

const REPO_ROOT = "D:/Study/Project/QLLaw-main";
const SOFFICE = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
const DOCX_OUT_DIR = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");

// Scan source docs for BM-021
const docsDir = path.join(REPO_ROOT, "docs", "Biểu mẫu", "Full", "0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC");
const entries = fs.readdirSync(docsDir, { withFileTypes: true });
let foundFile = null;

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const name = entry.name.toLowerCase();
  if (name.startsWith("21") || name.startsWith("021")) {
    const subDir = path.join(docsDir, entry.name);
    const files = fs.readdirSync(subDir).filter((f) => f.match(/\.(docx?|DOCX?)$/));
    console.log(`Folder: ${entry.name} -> Files: ${files.join(", ")}`);
    for (const file of files) {
      foundFile = path.join(subDir, file);
    }
  }
}

if (!foundFile) {
  console.log("No source file found for BM-021");
  process.exit(1);
}

console.log(`\nSource file: ${foundFile}`);
const ext = path.extname(foundFile).toLowerCase();

// Convert DOC → DOCX using LibreOffice
const outDir = path.join(DOCX_OUT_DIR, "BM-021");
fs.mkdirSync(outDir, { recursive: true });

console.log("Converting with LibreOffice...");
execSync(
  `"${SOFFICE}" --headless --convert-to docx --outdir "${outDir}" "${foundFile}"`,
  { cwd: outDir, stdio: ["pipe", "pipe", "pipe"], timeout: 120000, env: { ...process.env, HOME: process.env.TEMP ?? "/tmp" } }
);

const outFiles = fs.readdirSync(outDir).filter(f => f.endsWith(".docx"));
console.log(`Output files: ${outFiles.join(", ")}`);

for (const outFile of outFiles) {
  const docxPath = path.join(outDir, outFile);
  const zip = new PizZip(fs.readFileSync(docxPath));
  const docXml = zip.file("word/document.xml")?.asText() ?? "";

  const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  const paras = [];
  let m;
  while ((m = paraRe.exec(docXml)) !== null) {
    const text = m[0].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text.length > 0) paras.push(text);
  }

  console.log(`\n=== ${outFile} (${paras.length} paragraphs) ===`);
  for (let i = 0; i < Math.min(40, paras.length); i++) {
    const p = paras[i];
    const hasEllipsis = /[…._]{3,}/.test(p);
    const marker = hasEllipsis ? " ***" : "";
    console.log(`  ${p.slice(0, 120)}${marker}`);
  }

  const hasEllipsis = /[…._]{3,}/.test(docXml);
  const hasMustache = /\{\{[^}]+\}\}/.test(docXml);
  console.log(`\nHas ellipsis: ${hasEllipsis}, Has mustache: ${hasMustache}`);
}
