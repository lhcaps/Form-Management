const fs = require("node:fs");
const csv = fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/form-authoring-baselines/matrix.csv", "utf8");
const lines = csv.trim().split("\n");
const headers = lines[0].match(/("([^"]+)")/g).map(h => h.replace(/^"|"$/g, ""));

const warnIdx = headers.indexOf("Warnings");
const issuesIdx = headers.indexOf("Issues");
const unknownIdx = headers.indexOf("Unknown");
const reviewIdx = headers.indexOf("Review required");
const bmIdx = headers.indexOf("BM");

let hasIssues = 0;
let total = lines.length - 1;

for (let i = 1; i < lines.length; i++) {
  // CSV parsing: handle quoted fields
  const row = parseCSVLine(lines[i]);
  const warnings = row[warnIdx] || "";
  const issues = row[issuesIdx] || "";
  const unknown = row[unknownIdx] || "0";
  const review = row[reviewIdx] || "0";

  if (warnings || issues || parseInt(unknown) > 0 || parseInt(review) > 0) {
    hasIssues++;
    if (hasIssues <= 10) {
      console.log(row[bmIdx] + ": warnings=[" + warnings + "] issues=[" + issues + "] unknown=" + unknown + " review=" + review);
    }
  }
}

console.log("\nTotal with warnings/issues: " + hasIssues + " / " + total);
console.log("Status: " + (hasIssues === 0 ? "CLEAN" : "NEEDS_ATTENTION"));

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
