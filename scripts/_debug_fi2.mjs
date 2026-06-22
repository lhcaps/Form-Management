import fs from "node:fs";
import path from "node:path";

// Check BmField structure in BM-004
const content = fs.readFileSync("D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-004-form-inputs.tsx", "utf8").replace(/\r\n/g, "\n");

// Find all BmField* component usages
const bmFieldRe = /<BmField(Text|Date|Textarea|Select)\s+([^>]+)>/g;
let m;
while ((m = bmFieldRe.exec(content)) !== null) {
  const attrs = m[2];
  const fieldMatch = attrs.match(/field\s*=\s*["']([^"']+)["']/);
  const labelMatch = attrs.match(/label\s*=\s*["']([^"']+)["']/);
  const labelTplMatch = attrs.match(/label\s*=\s*\{\`([^`]+)\`\}/);
  console.log(m[1], "|", fieldMatch ? fieldMatch[1] : "NO FIELD", "|", labelMatch ? labelMatch[1] : labelTplMatch ? "`" + labelTplMatch[1] + "`" : "NO LABEL");
}
