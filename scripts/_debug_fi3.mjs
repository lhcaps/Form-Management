import fs from "node:fs";

// Check BM-004 BmFormSection structure
const content = fs.readFileSync("D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-004-form-inputs.tsx", "utf8").replace(/\r\n/g, "\n");

// Find all BmFormSection tags and their following BmField usages
const sectionRe = /<BmFormSection\s+title\s*=\s*["']([^"']+)["']/gi;
const fieldRe = /<BmField(Text|Date|Textarea|Select)\s+([^>]+)>/g;

let currentSection = null;
let fieldIndex = 0;

let sectionMatch;
while ((sectionMatch = sectionRe.exec(content)) !== null) {
  const sectionTitle = sectionMatch[1];
  currentSection = sectionTitle;
  console.log("\nSECTION: " + sectionTitle);

  // Now find BmField tags that follow this section
  const posAfterSection = sectionMatch.index + sectionMatch[0].length;
  const nextSection = content.indexOf("<BmFormSection", posAfterSection);
  const sectionEnd = nextSection > 0 ? nextSection : content.length;
  const sectionContent = content.slice(posAfterSection, sectionEnd);

  let fieldMatch;
  while ((fieldMatch = fieldRe.exec(sectionContent)) !== null) {
    const attrs = fieldMatch[2];
    const labelMatch = attrs.match(/label\s*=\s*["']([^"']+)["']/);
    const labelTplMatch = attrs.match(/label\s*=\s*\{\`([^`]+)\`\}/);
    const label = labelMatch ? labelMatch[1] : labelTplMatch ? "`" + labelTplMatch[1] + "`" : "NO LABEL";
    fieldIndex++;
    console.log("  " + fieldIndex + ". [" + fieldMatch[1] + "] " + label);
  }
}
