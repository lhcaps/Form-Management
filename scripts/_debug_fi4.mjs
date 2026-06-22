import fs from "node:fs";

// Check BM-021 form inputs to see the pattern (BM-021 has FI)
// Then check BM-004's EMPTY_FORM for field names
const bm021 = fs.readFileSync("D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-021-form-inputs.tsx", "utf8").replace(/\r\n/g, "\n");

// Find all BmField and BmFormSection
const sectionRe = /<BmFormSection\s+title\s*=\s*["']([^"']+)["']/gi;
const fieldRe = /<BmField(Text|Date|Textarea|Select)\s+([^>]+)>/g;

let currentSection = null;
let fieldIndex = 0;

let sectionMatch;
while ((sectionMatch = sectionRe.exec(bm021)) !== null) {
  const sectionTitle = sectionMatch[1];
  currentSection = sectionTitle;
  console.log("\nSECTION: " + sectionTitle);

  const posAfterSection = sectionMatch.index + sectionMatch[0].length;
  const nextSection = bm021.indexOf("<BmFormSection", posAfterSection);
  const sectionEnd = nextSection > 0 ? nextSection : bm021.length;
  const sectionContent = bm021.slice(posAfterSection, sectionEnd);

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
