import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import PizZip from "pizzip";

const REPO_ROOT = "D:/Study/Project/QLLaw-main";
const SOFFICE = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
const DOCX_OUT_DIR = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");

// Find BM-021 source DOC
const docsDir = path.join(REPO_ROOT, "docs", "Biểu mẫu", "Full", "0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC");
const entries = fs.readdirSync(docsDir, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const name = entry.name.toLowerCase();
  const bmNum = 21;
  if (name.startsWith(String(bmNum).padStart(2, "0")) || name.startsWith(String(bmNum).padStart(3, "0"))) {
    const subDir = path.join(docsDir, entry.name);
    const files = fs.readdirSync(subDir).filter((f) => f.match(/\.(docx?|DOCX?)$/));
    console.log("Files in subdir:", files);
    for (const file of files) {
      const fullPath = path.join(subDir, file);
      const ext = path.extname(file).toLowerCase();
      console.log(`Found: ${file} (${ext})`);
      const outDir = path.join(DOCX_OUT_DIR, "BM-021");
      fs.mkdirSync(outDir, { recursive: true });
      console.log("Converting...");
      try {
        execSync(
          `"${SOFFICE}" --headless --convert-to docx --outdir "${outDir}" "${fullPath}"`,
          { cwd: outDir, stdio: ["pipe", "pipe", "pipe"], timeout: 60000, env: { ...process.env, HOME: process.env.TEMP ?? "/tmp" } }
        );
        console.log("Conversion done");
        const outFiles = fs.readdirSync(outDir);
        console.log("Output files:", outFiles);
        const docxFile = path.join(outDir, outFiles.find(f => f.endsWith(".docx")) ?? "");
        if (fs.existsSync(docxFile)) {
          const zip = new PizZip(fs.readFileSync(docxFile));
          const docXml = zip.file("word/document.xml")?.asText() ?? "";
          const paras = [...docXml.matchAll(/(?s)<w:p\b[^>]*>.*?<\/w:p>/g)];
          console.log(`Paragraphs in converted DOCX: ${paras.length}`);
          // Show first 5 paragraphs' text
          for (let i = 0; i < Math.min(10, paras.length); i++) {
            const text = paras[i][0].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
            if (text.length > 0) console.log(`  P${i+1}: ${text.slice(0, 100)}`);
          }
          // Check ellipsis
          const hasEllipsis = /[…._]{3,}/.test(docXml);
          const hasMustache = /\{\{[^}]+\}\}/.test(docXml);
          console.log(`Has ellipsis: ${hasEllipsis}, Has mustache: ${hasMustache}`);
        }
      } catch(e) {
        console.error("Error:", e.message);
      }
    }
  }
}
