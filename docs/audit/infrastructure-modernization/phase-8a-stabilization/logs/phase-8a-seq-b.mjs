#!/usr/bin/env node
/**
 * Phase 8A — Stage 5 — Sequence B (inventory then API tests).
 *
 * For 3 cycles, runs:
 *   1. `pnpm audit:docx-slot-inventory` (with fresh temp root)
 *   2. `pnpm test:api` (with fresh temp root)
 *
 * Records exit codes, durations, ENOENT counts and inventory presence.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createRunId, createRunTempDir, runUnfiltered, cleanupRunTempDir,
} from './phase-8a-repro-harness.mjs';

const LOG_DIR = join(process.cwd(), 'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs');
const SUMMARY_PATH = join(LOG_DIR, 'seq-b-summary.json');

function summarizeJest(stdout) {
  const out = { suiteLine: null, testLine: null, failLine: null, enoent: [] };
  const fails = [];
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.match(/^(Test Suites:|Tests:|Snapshots:)\s*(.*)$/);
    if (m) {
      if (m[1].startsWith('Test Suites')) out.suiteLine = `${m[1]} ${m[2]}`;
      else if (m[1].startsWith('Tests')) out.testLine = `${m[1]} ${m[2]}`;
    }
    if (/^FAIL\b/.test(line)) fails.push(line.trim());
    if (/ENOENT/.test(line)) out.enoent.push(line.trim());
  }
  out.failLine = fails.length === 0 ? null : fails;
  return out;
}

async function runOne(command, args, runId, tempDir) {
  const meta = runUnfiltered({ command, args, runId, tempDir });
  const stdout = readFileSync(meta.stdoutPath, 'utf8');
  const stderr = readFileSync(meta.stderrPath, 'utf8');
  return {
    runId,
    tempDir,
    exitCode: meta.exitCode,
    durationMs: meta.durationMs,
    stdoutBytes: meta.stdoutBytes,
    stderrBytes: meta.stderrBytes,
    tempDirInventory: meta.tempDirInventory,
    stdoutPath: meta.stdoutPath,
    stderrPath: meta.stderrPath,
    metaPath: meta.metaPath,
  };
}

async function cycle(idx) {
  const runIdInventory = createRunId();
  const tempDirInventory = createRunTempDir(runIdInventory);
  const invRecord = await runOne('pnpm', ['audit:docx-slot-inventory'], runIdInventory, tempDirInventory);
  cleanupRunTempDir(runIdInventory);

  const runIdApi = createRunId();
  const tempDirApi = createRunTempDir(runIdApi);
  const apiRecord = await runOne('pnpm', ['--filter', 'api', 'test', '--runInBand'], runIdApi, tempDirApi);
  const stdout = readFileSync(apiRecord.stdoutPath, 'utf8');
  const stderr = readFileSync(apiRecord.stderrPath, 'utf8');
  const summary = summarizeJest(stdout, stderr);
  apiRecord.suiteLine = summary.suiteLine;
  apiRecord.testLine = summary.testLine;
  apiRecord.failLineCount = summary.failLine?.length ?? 0;
  apiRecord.enoentCount = summary.enoent.length;
  apiRecord.enoentFirstFive = summary.enoent.slice(0, 5);
  cleanupRunTempDir(runIdApi);

  const cycleRecord = {
    cycle: idx,
    inventory: invRecord,
    api: apiRecord,
    inventoryExitOk: invRecord.exitCode === 0,
    apiExitOk: apiRecord.exitCode === 0,
  };
  writeFileSync(join(LOG_DIR, `seq-b-cycle${idx}-${runIdApi}.json`), JSON.stringify(cycleRecord, null, 2));
  process.stdout.write(`[seq-b cycle ${idx}] inv.exit=${invRecord.exitCode} api.exit=${apiRecord.exitCode} fail=${apiRecord.failLineCount} enoent=${apiRecord.enoentCount}\n`);
  return cycleRecord;
}

async function main() {
  const cycles = [];
  for (let i = 1; i <= 3; i += 1) cycles.push(await cycle(i));
  const summary = {
    sequence: 'B — inventory then API tests',
    capturedAt: new Date().toISOString(),
    cycles,
    observations: {
      inventoryAlwaysExitZero: cycles.every((c) => c.inventoryExitOk),
      apiAlwaysExitZero: cycles.every((c) => c.apiExitOk),
      inventoryCausedFailure: cycles.every((c) => c.api.failLineCount > 0),
      cycles,
    },
  };
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  process.stdout.write(`[seq-b] summary written to ${SUMMARY_PATH}\n`);
}

main().catch((err) => { process.stderr.write(String(err) + '\n'); process.exit(2); });