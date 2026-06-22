import fs from "node:fs";
import path from "node:path";

// Step by step debug of parseFormInputs for BM-004
const code = "BM-004";
const fp = path.join("D:/Study/Project/QLLaw-main/apps/web/src/components/documents", code.toLowerCase() + "-form-inputs.tsx");

const content = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
console.log("File:", fp);
console.log("Exists:", fs.existsSync(fp));
console.log("Content length:", content.length);
console.log("First 50 lines:");

const lines = content.split("\n");
lines.slice(0, 50).forEach((l, i) => {
  if (l.includes("BmField")) {
    console.log("  LINE " + i + ": " + l.trim().slice(0, 120));
  }
});

// Test the regex
const fieldRe = /<BmField(Text|Date|Textarea|Select)\s+([^>]+)>/g;
const matches = [...content.matchAll(fieldRe)];
console.log("\nBmField matches:", matches.length);

// Test the section regex
const secRe = /<BmFormSection\s+title\s*=\s*["']([^"']+)["']/gi;
const secMatches = [...content.matchAll(secRe)];
console.log("BmFormSection matches:", secMatches.length);
console.log("Section titles:", secMatches.map(m => m[1]));
