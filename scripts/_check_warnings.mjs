import fs from "node:fs";

const csv = fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/form-authoring-baselines/matrix.csv", "utf8");
const lines = csv.trim().split("\n");
const headers = lines[0].match(/("([^"]+)")/g).map(h => h.replace(/^"|"$/g, ""));

const warnIdx = headers.indexOf("Warnings");
const bmIdx = headers.indexOf("BM");

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  const warnings = row[warnIdx] || "";
  if (warnings) {
    console.log(row[bmIdx] + ": " + warnings);
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
