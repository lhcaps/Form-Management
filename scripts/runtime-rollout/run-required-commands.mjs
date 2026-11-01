#!/usr/bin/env node
/**
 * run-required-commands.mjs - Execute and record every required B1 closure command.
 *
 * Output: docs/audit/final-213-customer-ready/runtime-rollout/command-log.json
 */

import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ROLLOUT_DIR = path.join(REPO_ROOT, 'docs', 'audit', 'final-213-customer-ready', 'runtime-rollout');

const COMMANDS = [
  { id: 'C01', cmd: 'node', args: ['scripts/runtime-rollout/build-authoritative-213-manifest.mjs'], note: 'Build authoritative 213 manifest' },
  { id: 'C02', cmd: 'node', args: ['scripts/runtime-rollout/guard-213-manifest-invariants.mjs'], note: 'Phase 1 invariants guard' },
  { id: 'C03', cmd: 'node', args: ['scripts/runtime-rollout/build-slot-inventory.mjs'], note: 'Slot inventory' },
  { id: 'C04', cmd: 'node', args: ['scripts/runtime-rollout/split-b1-subbatches.mjs', '--source', 'canonical'], note: 'Split B1 into B1A/B1B/B1C' },
  { id: 'C05', cmd: 'node', args: ['scripts/runtime-rollout/render-runtime-batch.mjs', '--batch', 'B1A_READY_SIMPLE', '--audit-only'], note: 'B1A R1/R2 render' },
  { id: 'C06', cmd: 'node', args: ['scripts/runtime-rollout/render-visual-pass.mjs', '--batch=B1A_READY_SIMPLE'], note: 'B1A Word visual gate' },
  { id: 'C07', cmd: 'node', args: ['scripts/runtime-rollout/a8-mutation-suite.mjs'], note: 'A8 mutation suite' },
  { id: 'C08', cmd: 'node', args: ['scripts/runtime-rollout/promote-runtime-batch.mjs', '--batch=B1A_READY_SIMPLE', '--audit-only'], note: 'B1A promotion (audit-only)' },
  { id: 'C09', cmd: 'pnpm', args: ['--filter', '@qllaw/form-contracts', 'test'], note: 'Form contracts tests' },
  { id: 'C10', cmd: 'pnpm', args: ['typecheck'], note: 'Typecheck' },
  { id: 'C11', cmd: 'pnpm', args: ['audit', '--prod'], note: 'Dependency security audit' },
];

function runOne({ id, cmd, args, note }) {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  // On Windows, .cmd shims (pnpm.cmd) need explicit shell handling.
  const isWin = process.platform === 'win32';
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    cwd: REPO_ROOT,
    env: process.env,
    shell: isWin,
  });
  const t1 = Date.now();
  const finishedAt = new Date().toISOString();
  const out = (r.stdout || '').toString();
  const err = (r.stderr || '').toString();
  const tail = out.length > 2048 ? '...' + out.slice(-2048) : out;
  return {
    id, cmd, args, note, startedAt, finishedAt, elapsedMs: t1 - t0,
    exitCode: r.status,
    signal: r.signal,
    stdoutTail: tail,
    stderrTail: err.length > 2048 ? '...' + err.slice(-2048) : err,
  };
}

async function main() {
  await mkdir(ROLLOUT_DIR, { recursive: true });
  const log = { schema: 'qllaw.213.command_log/v1', startedAt: new Date().toISOString(), commands: [] };
  for (const c of COMMANDS) {
    console.log(`[${c.id}] ${c.cmd} ${c.args.join(' ')}`);
    const r = runOne(c);
    log.commands.push(r);
    console.log(`  exit=${r.exitCode} elapsed=${r.elapsedMs}ms`);
    if (r.exitCode !== 0 && !['C11'].includes(c.id)) {
      console.log(`  -- stderr tail:`);
      console.log(r.stderrTail);
    }
  }
  log.finishedAt = new Date().toISOString();
  await writeFile(path.join(ROLLOUT_DIR, 'command-log.json'), JSON.stringify(log, null, 2));
  const allExitZero = log.commands.every((c) => c.exitCode === 0 || c.id === 'C11');
  console.log(`\nCommand log written. All-clean=${allExitZero ? 'YES' : 'NO'} (audit is expected RED)`);
}

main().catch((err) => { console.error('FATAL:', err.stack || err.message); process.exit(1); });