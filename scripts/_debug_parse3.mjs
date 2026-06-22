import fs from "node:fs";

const content = fs.readFileSync(
  "D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-021-form-inputs.tsx",
  "utf8"
);
const raw = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

// Find ALL BmField occurrences
let pos = 0;
let count = 0;
while (pos < raw.length && count < 20) {
  const idx = raw.indexOf("<BmField", pos);
  if (idx < 0) break;

  // Find the self-closing > for this tag
  let closeIdx = -1;
  let inQuote = false;
  let quoteChar = "";
  for (let i = idx + 1; i < raw.length; i++) {
    const ch = raw[i];
    if (!inQuote && (ch === '"' || ch === "'")) {
      inQuote = true;
      quoteChar = ch;
    } else if (inQuote && ch === quoteChar) {
      inQuote = false;
      quoteChar = "";
    } else if (!inQuote && ch === ">") {
      closeIdx = i;
      break;
    }
  }

  if (closeIdx < 0) {
    console.log(`BmField #${count + 1} at ${idx}: no closing >`);
    pos = idx + 1;
    count++;
    continue;
  }

  const tagContent = raw.slice(idx + 1, closeIdx);
  const tagMatch = tagContent.match(/^(\w+)\s+(.+)/s);
  const componentName = tagMatch ? tagMatch[1] : "(none)";
  const attrs = tagMatch ? tagMatch[2] : "";

  const nameMatch = attrs.match(/\bname=["']([^"']+)["']/i);
  const labelMatch = attrs.match(/\blabel=["']([^"']+)["']/i);

  console.log(`\n--- BmField #${count + 1} ---`);
  console.log("Component:", componentName);
  console.log("Attrs (first 200):", attrs.slice(0, 200));
  console.log("name:", nameMatch ? nameMatch[1] : "NOT FOUND");
  console.log("label:", labelMatch ? labelMatch[1] : "NOT FOUND");

  pos = closeIdx + 1;
  count++;
}
