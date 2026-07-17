#!/usr/bin/env node
/**
 * Phase 8A — Stage 5 — Sequence C (focused failing suites).
 *
 * Runs each known-failing suite independently 3 times with separate temp roots.
 * Then runs them in the order jest encounters them under `--runInBand`.
 *
 * Suites (resolved relative to apps/api):
 *   - representative-bms-render
 *   - docxtemplater-contract-render-engine-style-profile
 *   - docxtemplater-contract-render-engine-bm171-style-profile
 *   - docx-inspection-rendered-preservation
 *   - pr6g31-bm001-rendered-docx-parity
 *   - pr6g31-bm001-shared-mapping-parity
 *   - pr6g31-bm171-rendered-docx-parity
 *   - docxtemplater-contract-render-engine
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createRunId, createRunTempDir, runUnfiltered, cleanupRunTempDir,
} from './phase-8a-repro-harness.mjs';

const LOG_DIR = join(process.cwd(), 'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs');
const SUMMARY_PATH = join(LOG_DIR, 'seq-c-summary.json');

const SUITES = [
  ['representative-bms-render', 'apps/api/src/modules/documents/rendering/infrastructure/representative-bms-render.spec.ts'],
  ['docxtemplater-style-profile', 'apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-style-profile.spec.ts'],
  ['docxtemplater-bm171-style-profile', 'apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-bm171-style-profile.spec.ts'],
  ['docx-inspection-rendered-preservation', 'apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/docx-inspection-rendered-preservation.spec.ts'],
  ['pr6g31-bm001-rendered-docx-parity', 'apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-rendered-docx-parity.spec.ts'],
  ['pr6g31-bm001-shared-mapping-parity', 'apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-shared-mapping-parity.spec.ts'],
  ['pr6g31-bm171-rendered-docx-parity', 'apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts'],
  ['docxtemplater-contract-render-engine', 'apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.spec.ts'],
];

function summarizeJest(stdout, stderr) {
  const out = { suiteLine: null, testLine: null, failFiles: [], enoent: [] };
  const combined = `${stdout}\n${stderr}`;
  for (const line of combined.split(/\r?\n/)) {
    const m = line.match(/^(Test Suites:|Tests:|Snapshots:)\s*(.*)$/);
    if (m) {
      if (m[1].startsWith('Test Suites')) out.suiteLine = `${m[1]} ${m[2]}`.trim();
      else if (m[1].startsWith('Tests')) out.testLine = `${m[1]} ${m[2]}`.trim();
    }
    if (/^FAIL\b/.test(line)) out.failFiles.push(line.trim());
    if (/ENOENT/.test(line)) out.enoent.push(line.trim());
  }
  return out;
}

async function runSuite(label, file, runId, tempDir) {
  const meta = runUnfiltered({
    command: 'pnpm',
    args: ['--filter', 'api', 'exec', 'jest', '--runInBand', '--colors=false', file],
    runId,
    tempDir,
  });
  const stdout = readFileSync(meta.stdoutPath, 'utf8');
  const stderr = readFileSync(meta.stderrPath, 'utf8');
  const summary = summarizeJest(stdout, stderr);
  const rec = {
    sequence: 'C',
    label,
    file,
    runId,
    tempDir,
    exitCode: meta.exitCode,
    durationMs: meta.durationMs,
    signal: meta.signal,
    error: meta.error,
    stdoutBytes: meta.stdoutBytes,
    stderrBytes: meta.stderrBytes,
    tempDirInventory: meta.tempDirInventory,
    suiteLine: summary.suiteLine,
    testLine: summary.testLine,
    failFileCount: summary.failFiles.length,
    failFiles: summary.failFiles.slice(0, 5),
    enoentCount: summary.enoent.length,
    enoentFirstFive: summary.enoent.slice(0, 5),
    stdoutPath: meta.stdoutPath,
    stderrPath: meta.stderrPath,
    metaPath: meta.metaPath,
  };
  process.stdout.write(`[seq-c ${label} ${runId}] exit=${meta.exitCode} dur=${meta.durationMs}ms failFiles=${rec.failFileCount} enoent=${rec.enoentCount}\n`);
  return rec;
}

async function main() {
  const runs = [];
  // 1) Each suite independently 3 times.
  for (const [label, file] of SUITES) {
    for (let i = 1; i <= 3; i += 1) {
      const runId = createRunId();
      const tempDir = createRunTempDir(runId);
      const rec = await runSuite(label, file, runId, tempDir);
      writeFileSync(join(LOG_DIR, `seq-c-${label}-${i}-${runId}.json`), JSON.stringify(rec, null, 2));
      runs.push(rec);
      cleanupRunTempDir(runId);
    }
  }

  // 2) All suites in order under --runInBand (one combined run, fresh temp root).
  const combinedRunId = createRunId();
  const combinedTempDir = createRunTempDir(combinedRunId);
  const combined = await runUnfiltered({
    command: 'pnpm',
    args: ['--filter', 'api', 'exec', 'jest', '--runInBand', '--colors=false', ...SUITES.map(([, f]) => f)],
    runId: combinedRunId,
    tempDir: combinedTempDir,
  });
  const combinedStdout = readFileSync(combined.stdoutPath, 'utf8');
  const combinedStderr = readFileSync(combined.stderrPath, 'utf8');
  const combinedSummary = summarizeJest(combinedStdout, combinedStderr);
  const combinedRec = {
    sequence: 'C-combined',
    label: 'all-suites-in-order',
    files: SUITES.map(([, f]) => f),
    runId: combinedRunId,
    tempDir: combinedTempDir,
    exitCode: combined.exitCode,
    durationMs: combined.durationMs,
    suiteLine: combinedSummary.suiteLine,
    testLine: combinedSummary.testLine,
    failFileCount: combinedSummary.failFiles.length,
    failFiles: combinedSummary.failFiles.slice(0, 10),
    enoentCount: combinedSummary.enoent.length,
    enoentFirstFive: combinedSummary.enoent.slice(0, 5),
    stdoutPath: combined.stdoutPath,
    stderrPath: combined.stderrPath,
  };
  writeFileSync(join(LOG_DIR, `seq-c-combined-${combinedRunId}.json`), JSON.stringify(combinedRec, null, 2));
  cleanupRunTempDir(combinedRunId);

  const summary = {
    sequence: 'C — focused failing suites',
    capturedAt: new Date().toISOString(),
    suites: SUITES.map(([l, f]) => ({ label: l, file: f })),
    runs,
    combined: combinedRec,
  };
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  process.stdout.write(`[seq-c] summary written to ${SUMMARY_PATH}\n`);
}

main().catch((err) => { process.stderr.write(String(err) + '\n'); process.exit(2); });