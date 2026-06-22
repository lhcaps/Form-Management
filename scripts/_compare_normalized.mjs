#!/usr/bin/env node

import PizZip from "pizzip";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PLACEHOLDER_PATTERN = /\{\{([^{}]+)\}\}|\{([^{}]{3,})\}\}/g;

function plainTextFromXml(value) {
  return value.replace(/<[^>]+>/gu, " ");
}

const repoRoot = "D:\\Study\\Project\\QLLaw-main";

const codes = process.argv.slice(2);
if (codes.length === 0) {
  console.log("Usage: node _compare_normalized.mjs BM-005 BM-021");
  process.exit(1);
}

for (const code of codes) {
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
      console.log(`${code}: NO word/document.xml`);
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

    console.log(`\n=== ${code} ===`);
    console.log(`  Mustache placeholders: ${orderedPaths.length}`);
    console.log(`  Ellipsis chars: ${ellipsisCount}`);
    if (orderedPaths.length > 0) {
      for (const path of orderedPaths.slice(0, 5)) {
        console.log(`    ${path}`);
      }
    }
  } catch (err) {
    console.log(`${code}: ERROR - ${err.message}`);
  }
}
