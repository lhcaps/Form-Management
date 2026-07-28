/**
 * Build Word COM sidecar jobs from a checked-in rollout selection.
 *
 * This deliberately consumes the selection JSON rather than duplicating form
 * codes in a shell command. It produces R1/R2 DOCX-to-PDF jobs only when the
 * generated runtime artifacts exist.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const selectionArg = (process.argv.find((arg) => arg.startsWith('--selection-file=')) || '')
  .split('=')[1];
const rosterArg = (process.argv.find((arg) => arg.startsWith('--runtime-roster=')) || '')
  .split('=')[1];

if (Boolean(selectionArg) === Boolean(rosterArg)) {
  throw new Error('usage: node build-word-sidecar-jobs.mjs (--selection-file=<path> | --runtime-roster=<path>)');
}

const inputPath = path.resolve(REPO_ROOT, selectionArg || rosterArg);
const input = JSON.parse(await readFile(inputPath, 'utf8'));
const codes = selectionArg
  ? (input.forms || []).map((form) => form.code).filter(Boolean)
  : (input.runtimeReadyFormCodes || []).filter(Boolean);
if (new Set(codes).size !== codes.length) throw new Error('selection contains duplicate form codes');

const rolloutDir = path.join(REPO_ROOT, 'docs', 'audit', 'final-213-customer-ready', 'runtime-rollout');
const outputDir = path.join(rolloutDir, 'word-sidecar', selectionArg ? 'phase4b' : 'runtime-roster');
const jobs = [];
const missing = [];
for (const code of codes) {
  for (const revision of ['R1', 'R2']) {
    const input = path.join(rolloutDir, 'forms', code, `${revision}.docx`);
    if (!existsSync(input)) {
      missing.push(`${code}/${revision}`);
      continue;
    }
    jobs.push({ input, output: path.join(outputDir, `${code}-${revision}.pdf`) });
  }
}
if (missing.length > 0) throw new Error(`missing generated DOCX: ${missing.join(', ')}`);

await mkdir(outputDir, { recursive: true });
const jobsPath = path.join(outputDir, 'jobs.json');
await writeFile(jobsPath, `${JSON.stringify(jobs, null, 2)}\n`);
console.log(JSON.stringify({ input: inputPath, forms: codes.length, jobs: jobs.length, jobsPath }, null, 2));
