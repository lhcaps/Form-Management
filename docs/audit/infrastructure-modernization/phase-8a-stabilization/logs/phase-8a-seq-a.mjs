#!/usr/bin/env node
/**
 * Phase 8A — Stage 5 — Sequence A (baseline API tests).
 *
 * Runs `pnpm test:api` three times with separate temp roots and unfiltered
 * stdout/stderr. Records each run's exit code, duration, suite/test counts,
 * and temp-dir inventory.
 *
 * Output:
 *   docs/audit/infrastructure-modernization/phase-8a-stabilization/logs/seq-a-<runId>.json
 *   ...one file per run plus a combined summary
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createRunId, createRunTempDir, runUnfiltered, cleanupRunTempDir,
} from './phase-8a-repro-harness.mjs';

const HARNESS_LOG_DIR = join(process.cwd(), 'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs');
const SUMMARY_PATH = join(HARNESS_LOG_DIR, 'seq-a-summary.json');

function summarizeStdout(stdout, stderr) {
  // Jest prints the summary lines on stderr (PASS/FAIL/Test Suites/Tests/...).
  // We scan both streams unfiltered.
  const combined = `${stdout}\n${stderr}`;
  const out = { suiteLine: null, testLine: null, passLine: null, failLine: null, enoent: [] };
  for (const line of combined.split(/\r?\n/)) {
    const m = line.match(/^(Test Suites:|Tests:|Snapshots:|Time:|Ran all test suites\.)\s*(.*)$/);
    if (m) {
      if (m[1].startsWith('Test Suites')) out.suiteLine = `${m[1]} ${m[2]}`.trim();
      else if (m[1].startsWith('Tests')) out.testLine = `${m[1]} ${m[2]}`.trim();
    }
    if (/^PASS\b/.test(line)) out.passLine = out.passLine ?? line.trim();
    if (/^FAIL\b/.test(line)) {
      if (!out.failLine) out.failLine = [];
      out.failLine.push(line.trim());
    }
    if (/ENOENT/.test(line)) out.enoent.push(line.trim());
  }
  return out;
}

async function oneRun(idx) {
  const runId = createRunId();
  const tempDir = createRunTempDir(runId);
  process.stdout.write(`[seq-a #${idx}] runId=${runId} tempDir=${tempDir}\n`);
  const meta = runUnfiltered({
    command: 'pnpm',
    args: ['--filter', 'api', 'test', '--runInBand'],
    tempDir,
    runId,
  });
  const stdout = readFileSync(meta.stdoutPath, 'utf8');
  const stderr = readFileSync(meta.stderrPath, 'utf8');
  const summary = summarizeStdout(stdout, stderr);
  const runRecord = {
    sequence: 'A',
    idx,
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
    passLine: summary.passLine,
    failLineCount: summary.failLine?.length ?? 0,
    enoentCount: summary.enoent.length,
    enoentFirstFive: summary.enoent.slice(0, 5),
    stdoutPath: meta.stdoutPath,
    stderrPath: meta.stderrPath,
    metaPath: meta.metaPath,
  };
  writeFileSync(join(HARNESS_LOG_DIR, `seq-a-${runId}.json`), JSON.stringify(runRecord, null, 2));
  const clean = cleanupRunTempDir(runId);
  process.stdout.write(`[seq-a #${idx}] exitCode=${meta.exitCode} dur=${meta.durationMs}ms fail=${runRecord.failLineCount} enoent=${runRecord.enoentCount} cleaned=${clean.ok}\n`);
  return runRecord;
}

async function main() {
  const runs = [];
  for (let i = 1; i <= 3; i += 1) {
    runs.push(await oneRun(i));
  }
  const summary = {
    sequence: 'A — baseline API tests',
    capturedAt: new Date().toISOString(),
    runsCount: runs.length,
    runs,
    summary: {
      allExitCodeZero: runs.every((r) => r.exitCode === 0),
      maxDurationMs: Math.max(...runs.map((r) => r.durationMs)),
      minDurationMs: Math.min(...runs.map((r) => r.durationMs)),
      totalEnoent: runs.reduce((acc, r) => acc + r.enoentCount, 0),
      totalFailLines: runs.reduce((acc, r) => acc + r.failLineCount, 0),
    },
  };
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  process.stdout.write(`[seq-a] summary written to ${SUMMARY_PATH}\n`);
}

main().catch((err) => { process.stderr.write(String(err) + '\n'); process.exit(2); });