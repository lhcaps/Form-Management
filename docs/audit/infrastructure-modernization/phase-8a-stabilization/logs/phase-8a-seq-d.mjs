#!/usr/bin/env node
/**
 * Phase 8A — Stage 5 — Sequence D (full wrappers).
 *
 * Runs:
 *   - `pnpm verify:full`  twice with fresh temp roots
 *   - `pnpm verify:ci`    twice with fresh temp roots
 *
 * Both are captured unfiltered with real exit codes. Their wrapper
 * "truthfulness" is determined later, after we have the unfiltered exit codes
 * for each constituent script in the chain.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createRunId, createRunTempDir, runUnfiltered, cleanupRunTempDir,
} from './phase-8a-repro-harness.mjs';

const LOG_DIR = join(process.cwd(), 'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs');
const SUMMARY_PATH = join(LOG_DIR, 'seq-d-summary.json');

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

async function runWrapper(label, script, runId, tempDir) {
  const meta = runUnfiltered({ command: 'pnpm', args: ['run', script], runId, tempDir });
  const stdout = readFileSync(meta.stdoutPath, 'utf8');
  const stderr = readFileSync(meta.stderrPath, 'utf8');
  const summary = summarizeJest(stdout, stderr);
  const rec = {
    sequence: 'D',
    label,
    script,
    runId,
    tempDir,
    exitCode: meta.exitCode,
    durationMs: meta.durationMs,
    stdoutBytes: meta.stdoutBytes,
    stderrBytes: meta.stderrBytes,
    tempDirInventory: meta.tempDirInventory,
    suiteLine: summary.suiteLine,
    testLine: summary.testLine,
    failFileCount: summary.failFiles.length,
    failFiles: summary.failFiles.slice(0, 20),
    enoentCount: summary.enoent.length,
    enoentFirstFive: summary.enoent.slice(0, 5),
    stdoutPath: meta.stdoutPath,
    stderrPath: meta.stderrPath,
    metaPath: meta.metaPath,
  };
  process.stdout.write(`[seq-d ${label} ${runId}] exit=${meta.exitCode} dur=${meta.durationMs}ms enoent=${rec.enoentCount}\n`);
  return rec;
}

async function main() {
  const runs = [];
  for (let i = 1; i <= 2; i += 1) {
    const runId = createRunId();
    const tempDir = createRunTempDir(runId);
    runs.push(await runWrapper(`verify:full #${i}`, 'verify:full', runId, tempDir));
    cleanupRunTempDir(runId);
  }
  for (let i = 1; i <= 2; i += 1) {
    const runId = createRunId();
    const tempDir = createRunTempDir(runId);
    runs.push(await runWrapper(`verify:ci #${i}`, 'verify:ci', runId, tempDir));
    cleanupRunTempDir(runId);
  }
  const summary = {
    sequence: 'D — full wrappers',
    capturedAt: new Date().toISOString(),
    runs,
  };
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  process.stdout.write(`[seq-d] summary written to ${SUMMARY_PATH}\n`);
}

main().catch((err) => { process.stderr.write(String(err) + '\n'); process.exit(2); });