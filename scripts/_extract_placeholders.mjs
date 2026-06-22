#!/usr/bin/env node

import PizZip from "pizzip";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PLACEHOLDER_PATTERN = /\{\{([^{}]+)\}\}|\{([^{}]{3,})\}\}/g;

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function decodeXml(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function plainTextFromXml(value) {
  return decodeXml(value.replace(/<[^>]+>/gu, ""));
}

const repoRoot = "D:\\Study\\Project\\QLLaw-main";

const codes = process.argv.slice(2);
if (codes.length === 0) {
  console.log("Usage: node _extract-placeholders.mjs BM-021 BM-022 ...");
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

    const paragraphs = [
      ...documentXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/gu),
    ];

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
        occurrencesByPath.get(path).push({
          blockId: `P${String(index + 1).padStart(4, "0")}`,
          context,
        });
      }
    });

    if (orderedPaths.length === 0) {
      console.log(`${code}: NO PLACEHOLDERS found`);
      continue;
    }

    console.log(`\n=== ${code} (${orderedPaths.length} placeholders) ===`);
    console.log(`SHA256: ${sha256(buffer)}`);
    for (const path of orderedPaths) {
      const occs = occurrencesByPath.get(path);
      console.log(`  ${path} (${occs.length} occurrence(s))`);
      for (const occ of occs.slice(0, 2)) {
        console.log(`    Block: ${occ.blockId}`);
        console.log(`    Context: "${occ.context.slice(0, 120)}"`);
      }
    }
  } catch (err) {
    console.log(`${code}: ERROR - ${err.message}`);
  }
}
