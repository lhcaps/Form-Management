#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { remediateBm001Template } from "./lib/bm001-template-remediator.mjs";
import { normalizeDocxBaseTypography } from "./lib/docx-format-normalizer.mjs";
import { normalizeLegalHeader } from "../document-fidelity/normalize-legal-header.mjs";

const VALID_STRATEGIES = new Set(["auto", "family-a", "family-b", "skip"]);

function parseArguments(argv) {
  const positional = [];
  let templateCode = "";
  let legalHeaderStrategy = "auto";

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

    if (argument.startsWith("--legal-header-strategy=")) {
      const value = argument.slice("--legal-header-strategy=".length).trim();
      if (!VALID_STRATEGIES.has(value)) {
        throw new Error(
          "--legal-header-strategy must be one of: " +
            Array.from(VALID_STRATEGIES).join(", "),
        );
      }
      legalHeaderStrategy = value;
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
    legalHeaderStrategy,
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

if (options.templateCode && options.legalHeaderStrategy !== "skip") {
  try {
    const result = normalizeLegalHeader(normalized, {
      templateCode: options.templateCode,
      strategy: options.legalHeaderStrategy,
    });
    normalized = result.buffer;
    console.log(
      `[normalize-format] legal-header normalized: ${result.familyBefore} -> ${result.familyAfter} (strategy=${options.legalHeaderStrategy})`,
    );
  } catch (err) {
    // Fail closed: refuse to write a half-normalized DOCX. Re-throw so the
    // caller's pipeline can decide whether to abort or fall back.
    console.error(
      `[normalize-format] legal-header normalization failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(2);
  }
}

if (options.templateCode === "BM-001") {
  normalized = remediateBm001Template(normalized);
}

writeFileSync(resolvedOutput, normalized);
console.log(
  `[normalize-format] ${resolvedOutput}${options.templateCode ? ` (${options.templateCode})` : ""}`,
);
