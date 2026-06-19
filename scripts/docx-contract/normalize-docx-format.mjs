#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { remediateBm001Template } from "./lib/bm001-template-remediator.mjs";
import { normalizeDocxBaseTypography } from "./lib/docx-format-normalizer.mjs";

function parseArguments(argv) {
  const positional = [];
  let templateCode = "";

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--template-code") {
      templateCode = argv[index + 1]?.trim().toUpperCase() ?? "";
      index += 1;
      if (!templateCode) {
        throw new Error("--template-code requires a BM-XXX value.");
      }
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    }

    positional.push(argument);
  }

  if (positional.length > 2) {
    throw new Error("Expected at most input.docx and output.docx paths.");
  }

  return {
    inputPath: positional[0],
    outputPath: positional[1],
    templateCode,
  };
}

let options;

try {
  options = parseArguments(process.argv.slice(2));
} catch (error) {
  console.error(
    `[normalize-format] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}

if (!options.inputPath) {
  console.error(
    "Usage: node scripts/docx-contract/normalize-docx-format.mjs <input.docx> [output.docx] [--template-code BM-XXX]",
  );
  process.exit(1);
}

const resolvedInput = resolve(options.inputPath);
const resolvedOutput = resolve(options.outputPath ?? options.inputPath);
let normalized = normalizeDocxBaseTypography(readFileSync(resolvedInput), {
  fontFamily: "Times New Roman",
  fontSizeHalfPoints: 26,
});

if (options.templateCode === "BM-001") {
  normalized = remediateBm001Template(normalized);
}

writeFileSync(resolvedOutput, normalized);
console.log(
  `[normalize-format] ${resolvedOutput}${options.templateCode ? ` (${options.templateCode})` : ""}`,
);
