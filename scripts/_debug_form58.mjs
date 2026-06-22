import fs from "node:fs";

// Check form inputs for BM-058 and BM-072
function checkForm(code) {
  const fp = `D:/Study/Project/QLLaw-main/apps/web/src/components/documents/${code.toLowerCase()}-form-inputs.tsx`;
  if (!fs.existsSync(fp)) { console.log(code + ": NOT FOUND"); return; }
  const content = fs.readFileSync(fp, "utf8");
  const fields = [];
  let sectionTitle = "default";
  const lines = content.split("\n");
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const secMatch = line.match(/<BmFormSection\s+title\s*=\s*["']([^"']+)["']/i);
    if (secMatch) { sectionTitle = secMatch[1].trim(); continue; }
    const tagMatch = line.match(/<BmField(Text|Date|Textarea|Select)/);
    if (tagMatch) {
      let tagEnd = li;
      let tagContent = line;
      while (tagEnd < lines.length && !tagContent.includes("/>") && !tagContent.includes("</BmField")) {
        tagEnd++;
        if (tagEnd < lines.length) tagContent += "\n" + lines[tagEnd];
      }
      const lm = tagContent.match(/label\s*=\s*["']([^"']+)["']/);
      const ltm = tagContent.match(/label\s*=\s*\{\`([^`]+)\`\}/);
      let label = lm ? lm[1] : ltm ? ltm[1] : null;
      if (label) label = label.replace(/\$\{[^}]+\}/g, "…").trim();
      if (label) fields.push({ section: sectionTitle, label });
      li = tagEnd;
    }
  }
  console.log(code + " form fields (" + fields.length + "):");
  fields.forEach((f, i) => console.log("  [" + i + "] " + f.section + " | " + f.label));
}

checkForm("BM-058");
console.log();
checkForm("BM-072");
