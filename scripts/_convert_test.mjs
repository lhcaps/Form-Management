import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import PizZip from "pizzip";

const REPO_ROOT = "D:/Study/Project/QLLaw-main";
const SOFFICE = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
const OUT_DIR = path.join(REPO_ROOT, "storage", "templates", "normalized-docx", "BM-021");

// Step 1: Find source DOC
const docsDir = path.join(REPO_ROOT, "docs", "Biểu mẫu", "Full", "0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC");
const entries = fs.readdirSync(docsDir, { withFileTypes: true });
let sourceDoc = null;

outer:
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const subDir = path.join(docsDir, entry.name);
  try {
    const files = fs.readdirSync(subDir);
    for (const file of files) {
      const fl = file.toLowerCase();
      if (fl.startsWith("21-") || fl.startsWith("21.")) {
        const ext = path.extname(file).toLowerCase();
        if (ext === ".doc" || ext === ".docx") {
          sourceDoc = path.join(subDir, file);
          break outer;
        }
      }
    }
  } catch { /* skip */ }
}

if (!sourceDoc) {
  console.error("Source DOC not found for BM-021");
  process.exit(1);
}

console.log("Source:", sourceDoc);

// Step 2: Convert with LibreOffice
fs.mkdirSync(OUT_DIR, { recursive: true });
console.log("Converting with LibreOffice...");

const sofficeArgs = [
  SOFFICE,
  "--headless",
  "--convert-to",
  "docx",
  "--outdir",
  OUT_DIR,
  sourceDoc,
];

try {
  execSync(`"${SOFFICE}" --headless --convert-to docx --outdir "${OUT_DIR}" "${sourceDoc}"`, {
    cwd: OUT_DIR,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 120000,
    env: { ...process.env, HOME: process.env.TEMP ?? "/tmp" },
  });
  console.log("Conversion complete");
} catch (e) {
  console.error("Conversion error:", e.message);
}

const outFiles = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".docx"));
console.log("Output files:", outFiles);

for (const outFile of outFiles) {
  const docxPath = path.join(OUT_DIR, outFile);
  const zip = new PizZip(fs.readFileSync(docxPath));
  const docXml = zip.file("word/document.xml")?.asText() ?? "";

  const paraRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  let paraCount = 0;
  const lines = [];
  let m;
  while ((m = paraRe.exec(docXml)) !== null) {
    const text = m[0].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text.length > 0) {
      paraCount++;
      if (paraCount <= 50) lines.push(text);
    }
  }

  console.log(`\n=== ${outFile} (${paraCount} non-empty paragraphs) ===`);
  for (const l of lines) {
    const hasEllipsis = /[…._]{3,}/.test(l);
    console.log((hasEllipsis ? "*** " : "    ") + l.slice(0, 100));
  }

  const hasEllipsis = /[…._]{3,}/.test(docXml);
  const hasMustache = /\{\{[^}]+\}\}/.test(docXml);
  console.log(`\nSummary: ellipsis=${hasEllipsis}, mustache=${hasMustache}`);
}
