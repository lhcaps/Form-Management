import fs from "node:fs";
import path from "node:path";

// Test form input parsing for BM-004
const code = "BM-004";
const fp = path.join("D:/Study/Project/QLLaw-main/apps/web/src/components/documents", code.toLowerCase() + "-form-inputs.tsx");
console.log("File:", fp);
console.log("Exists:", fs.existsSync(fp));

if (fs.existsSync(fp)) {
  const content = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  console.log("Length:", content.length);

  // Try to find BmField tags
  const bmFieldMatches = [...content.matchAll(/<BmField/gi)];
  console.log("BmField tags:", bmFieldMatches.length);

  // Try different patterns
  const fieldMatches = [...content.matchAll(/<[Bb]m[Ff]ield/gi)];
  console.log("Any BmField:", fieldMatches.length);

  // Check for section-based fields
  const sectionMatches = [...content.matchAll(/updateSection\s*\(/gi)];
  console.log("updateSection calls:", sectionMatches.length);

  // Try field-like patterns
  const nameMatches = [...content.matchAll(/name\s*=\s*["']([^"']+)["']/gi)];
  console.log("name= patterns:", nameMatches.slice(0, 5));

  // Check what tags are used
  const allTags = [...content.matchAll(/<(Bm[A-Z][a-zA-Z]+)/g)];
  const tagCounts = {};
  for (const m of allTags) {
    tagCounts[m[1]] = (tagCounts[m[1]] || 0) + 1;
  }
  console.log("\nBm component tags:", JSON.stringify(tagCounts, null, 2));

  // Check if there's a different field pattern
  const fieldPatternMatches = [...content.matchAll(/BmFieldDate|BmFieldText|BmFieldTextarea|BmFieldSelect/gi)];
  console.log("\nBmFieldDate/Text/etc:", fieldPatternMatches.length);

  // Show first 500 chars
  console.log("\nFirst 500 chars:");
  console.log(content.slice(0, 500));
}
