import fs from "node:fs";
import PizZip from "pizzip";

const docxPath = "D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/BM-058_normalized.docx";
const zip = new PizZip(fs.readFileSync(docxPath));
const docXml = zip.file("word/document.xml")?.asText() ?? "";

// Find all text boxes and their content
const txbxMatches = [...docXml.matchAll(/<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/gu)];
console.log("Text boxes found:", txbxMatches.length);
for (let i = 0; i < txbxMatches.length; i++) {
  const content = txbxMatches[i][1];
  const stripped = content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (/[…._]{3,}/.test(stripped)) {
    console.log(`\nText box ${i + 1} (has ellipsis):`);
    console.log("  " + stripped.slice(0, 200));
    // Show runs
    const runs = [...content.matchAll(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/gu)];
    for (const run of runs) {
      const text = run[0].replace(/<[^>]+>/g, "");
      if (/[…._]{3,}/.test(text)) {
        console.log("  ELLIPSIS RUN:", JSON.stringify(text));
      }
    }
  }
}

// Also check wps:txbx
const wpsMatches = [...docXml.matchAll(/<wps:txbx>([\s\S]*?)<\/wps:txbx>/gu)];
console.log("\nwps:txbx found:", wpsMatches.length);
for (let i = 0; i < wpsMatches.length; i++) {
  const content = wpsMatches[i][1];
  const stripped = content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (/[…._]{3,}/.test(stripped)) {
    console.log(`\nwps:txbx ${i + 1} (has ellipsis):`);
    console.log("  " + stripped.slice(0, 200));
  }
}
