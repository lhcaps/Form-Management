#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { remediateBm031Template } from "./lib/bm031-template-remediator.mjs";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath) {
  throw new Error(
    "Usage: node scripts/docx-contract/remediate-bm031-template.mjs <input.docx> [output.docx]",
  );
}

const resolvedInput = resolve(inputPath);
const resolvedOutput = resolve(outputPath ?? inputPath);
const remediated = remediateBm031Template(readFileSync(resolvedInput));

writeFileSync(resolvedOutput, remediated);
console.log(`[remediate-bm031] ${resolvedOutput}`);
