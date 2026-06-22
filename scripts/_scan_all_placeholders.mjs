#!/usr/bin/env node

import PizZip from "pizzip";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PLACEHOLDER_PATTERN = /\{\{([^{}]+)\}\}|\{([^{}]{3,})\}\}/g;

function plainTextFromXml(value) {
  return value.replace(/<[^>]+>/gu, " ");
}

const repoRoot = "D:\\Study\\Project\\QLLaw-main";

// Already profiled BMs (from scripts/form-refinement/profiles/)
const profiledCodes = new Set([
  "BM-001","BM-002","BM-003","BM-005","BM-006","BM-007","BM-008","BM-009","BM-010",
  "BM-011","BM-012","BM-014","BM-015","BM-016","BM-017","BM-018","BM-019","BM-020",
  "BM-023","BM-030","BM-031","BM-033","BM-037","BM-038","BM-039","BM-040","BM-042",
  "BM-043","BM-044","BM-045","BM-046","BM-047","BM-053","BM-054","BM-055","BM-056",
  "BM-057","BM-058","BM-059","BM-070","BM-071","BM-085","BM-086","BM-090","BM-097",
  "BM-103","BM-104","BM-141","BM-144","BM-145","BM-146","BM-148","BM-150","BM-156",
  "BM-159","BM-166","BM-168","BM-169","BM-170","BM-171","BM-172","BM-173",
]);

const categorized = { mustache: [], ellipsisOnly: [], empty: [], error: [] };

for (let i = 1; i <= 213; i++) {
  const code = `BM-${String(i).padStart(3, "0")}`;
  const docxPath = join(
    repoRoot,
    "storage",
    "templates",
    "normalized-docx",
    code,
    `${code}_normalized.docx`
  );

  try {
    const buffer = readFileSync(docxPath);
    const zip = new PizZip(buffer);
    const documentXml = zip.file("word/document.xml")?.asText() ?? "";

    if (!documentXml) {
      categorized.empty.push(code);
      continue;
    }

    const paragraphs = [...documentXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/gu)];
    const orderedPaths = [];
    const occurrencesByPath = new Map();

    paragraphs.forEach((match, index) => {
      const context = plainTextFromXml(match[0]).replace(/\s+/gu, " ").trim();
      for (const placeholder of context.matchAll(PLACEHOLDER_PATTERN)) {
        const path = (placeholder[1] ?? placeholder[2] ?? "").trim();
        if (!path) continue;
        if (!occurrencesByPath.has(path)) {
          orderedPaths.push(path);
          occurrencesByPath.set(path, []);
        }
        occurrencesByPath.get(path).push({ blockId: `P${String(index + 1).padStart(4, "0")}`, context });
      }
    });

    const ellipsisCount = (plainTextFromXml(documentXml).match(/\u2026/g) || []).length;

    if (orderedPaths.length === 0 && ellipsisCount > 0) {
      categorized.ellipsisOnly.push({ code, ellipsisCount });
    } else if (orderedPaths.length === 0 && ellipsisCount === 0) {
      categorized.empty.push(code);
    } else {
      categorized.mustache.push({ code, count: orderedPaths.length, profiled: profiledCodes.has(code) });
    }
  } catch (err) {
    categorized.error.push({ code, error: err.message });
  }
}

console.log("=== CATEGORIZATION ===\n");
console.log(`Mustache placeholders: ${categorized.mustache.length}`);
console.log(`Ellipsis-only: ${categorized.ellipsisOnly.length}`);
console.log(`Empty/error: ${categorized.empty.length + categorized.error.length}`);

console.log("\n--- MUSTACHE (can be refined) ---");
const unrefined = categorized.mustache.filter(x => !x.profiled);
console.log(`Already profiled: ${categorized.mustache.length - unrefined.length}`);
console.log(`Still need profiles: ${unrefined.length}`);
for (const item of unrefined) {
  console.log(`  ${item.code} (${item.count} placeholders)`);
}

console.log("\n--- ELLIPSIS-ONLY (need DOCX remediation) ---");
for (const item of categorized.ellipsisOnly) {
  console.log(`  ${item.code} (${item.ellipsisCount} ellipsis chars)`);
}

console.log("\n--- EMPTY/ERROR ---");
for (const code of categorized.empty) {
  console.log(`  ${code} (empty)`);
}
for (const item of categorized.error) {
  console.log(`  ${item.code} (ERROR: ${item.error})`);
}
