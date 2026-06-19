#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeDocxBaseTypography } from './lib/docx-format-normalizer.mjs';

const inputPath = process.argv[2];
const outputArgument = process.argv[3];

if (!inputPath) {
  console.error(
    'Usage: node scripts/docx-contract/normalize-docx-format.mjs <input.docx> [output.docx]',
  );
  process.exit(1);
}

const resolvedInput = resolve(inputPath);
const resolvedOutput = resolve(outputArgument ?? inputPath);
const normalized = normalizeDocxBaseTypography(readFileSync(resolvedInput), {
  fontFamily: 'Times New Roman',
  fontSizeHalfPoints: 26,
});

writeFileSync(resolvedOutput, normalized);
console.log(`[normalize-format] ${resolvedOutput}`);
