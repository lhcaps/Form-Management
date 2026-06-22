#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { remediateSemanticTemplate } from "./lib/semantic-template-remediator.mjs";

const [templateCode, inputArg, outputArg, ...extraArgs] = process.argv.slice(2);

if (!templateCode || !inputArg || !outputArg || extraArgs.length > 0) {
  throw new Error(
    "Usage: node scripts/docx-contract/remediate-semantic-template.mjs <BM-019|BM-020|BM-058|BM-213> <input.docx> <output.docx>",
  );
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const input = readFileSync(inputPath);
const remediated = remediateSemanticTemplate(templateCode, input);

writeFileSync(outputPath, remediated);
console.log(`[semantic-remediation] ${templateCode} -> ${outputPath}`);
