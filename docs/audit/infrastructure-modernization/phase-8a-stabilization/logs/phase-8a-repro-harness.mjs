#!/usr/bin/env node
/**
 * Phase 8A — Stage 4 — Clean reproduction harness.
 *
 * Provides:
 *   - createRunId()                 — unique-per-run id (timestamp + counter + git HEAD short)
 *   - createRunTempDir()            — creates `<os.tmpdir>/qllaw-phase8a-<runId>` and returns path
 *   - buildShellEnv()               — process-scoped TEMP/TMP/TMPDIR override map for a child process
 *   - runUnfiltered(cmd, args, opts)— runs cmd with TEMP/TMP/TMPDIR override, captures full stdout+stderr
 *                                     to separate files under logs/, preserves real exit code
 *
 * Storage layout for each run:
 *   docs/audit/infrastructure-modernization/phase-8a-stabilization/logs/<command>-<runId>-<ts>.stdout.txt
 *   docs/audit/infrastructure-modernization/phase-8a-stabilization/logs/<command>-<runId>-<ts>.stderr.txt
 *   docs/audit/infrastructure-modernization/phase-8a-stabilization/logs/<command>-<runId>-<ts>.meta.json
 *
 * Files in the temp directory are inventoried in the .meta.json under
 * `tempDirInventory` after the run completes.
 *
 * The script never deletes anything outside `qllaw-phase8a-<runId>` and never
 * modifies any source file in the repository.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = process.cwd();
const PHASE_LOG_DIR = join(REPO_ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs');

mkdirSync(PHASE_LOG_DIR, { recursive: true });

let counter = 0;

export function getRepoRoot() { return REPO_ROOT; }
export function getPhaseLogDir() { return PHASE_LOG_DIR; }

export function getHeadShort() {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' });
  return (r.stdout ?? '').trim() || 'unknown-head';
}

export function createRunId() {
  const now = new Date();
  const isoLike = now.toISOString().replace(/[-:T]/g, '').replace(/\..*$/, '').slice(0, 14);
  const c = String(++counter).padStart(3, '0');
  return `run-${isoLike}-${getHeadShort()}-${c}`;
}

export function createRunTempDir(runId) {
  const prefix = join(tmpdir(), `qllaw-phase8a-${runId}-`);
  const dir = mkdtempSync(prefix);
  return dir;
}

export function buildShellEnv(tempDir) {
  const env = { ...process.env };
  env.TEMP = tempDir;
  env.TMP = tempDir;
  env.TMPDIR = tempDir;
  // pnpm + npm + jest on Windows all honour TEMP; the trio above covers every
  // consumer we have observed (os.tmpdir() in node, pnpm tmpdir, jest cache).
  return env;
}

function inventory(tempDir) {
  const out = [];
  let total = 0;
  let count = 0;
  try {
    for (const name of readdirSync(tempDir)) {
      const full = join(tempDir, name);
      try {
        const st = statSync(full);
        out.push({ name, kind: st.isDirectory() ? 'dir' : 'file', size: st.size });
        total += st.size;
        count += 1;
      } catch { /* entry vanished — fine */ }
    }
  } catch { /* tempDir might already be gone */ }
  return { entries: out, totalBytes: total, entryCount: count };
}

export function runUnfiltered({ command, args = [], cwd = REPO_ROOT, tempDir, runId, extraEnv = {} }) {
  if (!runId) runId = createRunId();
  if (!tempDir) tempDir = createRunTempDir(runId);

  const env = { ...buildShellEnv(tempDir), ...extraEnv };

  const tsSafe = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `${command}-${runId}-${tsSafe}`;
  const stdoutPath = join(PHASE_LOG_DIR, `${baseName}.stdout.txt`);
  const stderrPath = join(PHASE_LOG_DIR, `${baseName}.stderr.txt`);
  const metaPath = join(PHASE_LOG_DIR, `${baseName}.meta.json`);

  const start = Date.now();
  // On Windows, pnpm/npm/npx/yarn/jest/etc. are .cmd shims. spawnSync with
  // shell:false does NOT resolve them, and even resolving to the .cmd path
  // gives EINVAL. The only way to invoke a .cmd shim from Node while
  // preserving the real exit code (and without piping through any filter)
  // is `cmd.exe /c <shim> ...`. That gives an unfiltered stream that we
  // write straight to disk.
  const isWin = process.platform === 'win32';
  let cmdToRun;
  let finalArgs;
  if (isWin) {
    cmdToRun = process.env.ComSpec || 'cmd.exe';
    finalArgs = ['/c', command, ...args];
  } else {
    cmdToRun = command;
    finalArgs = args;
  }
  const r = spawnSync(cmdToRun, finalArgs, {
    cwd,
    env,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    maxBuffer: 256 * 1024 * 1024,
  });
  const end = Date.now();

  const stdout = r.stdout ?? '';
  const stderr = r.stderr ?? '';

  // Always write full stdout/stderr unfiltered. Never pipe through Select-String,
  // head, or anything that closes the stream early.
  writeFileSync(stdoutPath, stdout);
  writeFileSync(stderrPath, stderr);

  const inv = inventory(tempDir);

  const meta = {
    command,
    args,
    cwd,
    runId,
    tempDir,
    startIso: new Date(start).toISOString(),
    endIso: new Date(end).toISOString(),
    durationMs: end - start,
    exitCode: r.status,
    signal: r.signal,
    error: r.error ? String(r.error) : null,
    envOverride: { TEMP: env.TEMP, TMP: env.TMP, TMPDIR: env.TMPDIR },
    stdoutPath,
    stderrPath,
    stdoutBytes: stdout.length,
    stderrBytes: stderr.length,
    tempDirInventory: inv,
  };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  return meta;
}

export function cleanupRunTempDir(runId) {
  // Only delete directories we own (named qllaw-phase8a-<runId>-*).
  const prefix = `qllaw-phase8a-${runId}-`;
  const dir = join(tmpdir(), prefix);
  try {
    rmSync(dir, { recursive: true, force: true });
    return { cleaned: dir, ok: true };
  } catch (err) {
    return { cleaned: dir, ok: false, error: String(err) };
  }
}