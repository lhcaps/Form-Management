const fs = require("node:fs");
const csv = fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/form-authoring-baselines/matrix.csv", "utf8");
const lines = csv.trim().split("\n");
const headers = lines[0].match(/("([^"]+)")/g).map(h => h.replace(/^"|"$/g, ""));

const gradeIdx = headers.indexOf("Base grade");
const issuesIdx = headers.indexOf("Issues");
const warnIdx = headers.indexOf("Warnings");

let locked = 0, failed = 0;
const failedRows = [];

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  const grade = row[gradeIdx] || "";
  const issues = row[issuesIdx] || "";
  const warnings = row[warnIdx] || "";

  if (grade === "LOCKED_VERIFIED") {
    locked++;
  } else {
    failed++;
    if (failedRows.length < 20) {
      failedRows.push({ bm: row[headers.indexOf("BM")], grade, issues, warnings });
    }
  }
}

console.log("LOCKED_VERIFIED: " + locked);
console.log("FAILED/OTHER: " + failed);
console.log("\nFirst failed rows:");
failedRows.forEach(r => console.log("  " + r.bm + ": " + r.grade + " | issues=" + r.issues + " | warn=" + r.warnings));

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
