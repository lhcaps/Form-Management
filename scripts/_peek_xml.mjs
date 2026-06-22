#!/usr/bin/env node

import PizZip from "pizzip";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = "D:\\Study\\Project\\QLLaw-main";

const codes = process.argv.slice(2);
if (codes.length === 0) {
  console.log("Usage: node _peek_xml.mjs BM-021 ...");
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
      console.log(`\n=== ${code}: NO word/document.xml ===`);
      continue;
    }

    // Look for various placeholder-like patterns
    const textContent = documentXml.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ");

    console.log(`\n=== ${code} ===`);
    console.log(`Text length: ${textContent.length}`);

    // Check for specific patterns
    const patterns = {
      "dot-ellipsis": (textContent.match(/\.{3,}/gu) || []).length,
      "underline-underscore": (textContent.match(/_+/gu) || []).length,
      "w:t tags": (documentXml.match(/<w:t[^>]*>/gu) || []).length,
      "table rows": (documentXml.match(/<w:tr[ >]/gu) || []).length,
      "text runs": (documentXml.match(/<w:r[ >]/gu) || []).length,
    };

    for (const [k, v] of Object.entries(patterns)) {
      console.log(`  ${k}: ${v}`);
    }

    // Show first 500 chars of text content
    console.log(`  First 500 chars: "${textContent.slice(0, 500)}"`);

    // Show last 500 chars of text content
    console.log(`  Last 500 chars: "${textContent.slice(-500)}"`);

  } catch (err) {
    console.log(`${code}: ERROR - ${err.message}`);
  }
}
