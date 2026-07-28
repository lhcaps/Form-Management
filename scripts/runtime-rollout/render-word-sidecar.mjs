/**
 * render-word-sidecar.mjs — Node orchestrator for the Word COM sidecar.
 *
 * For each (input DOCX, output PDF) pair:
 *   - spawn cscript.exe in a child process
 *   - pass absolute paths
 *   - capture stdout (JSON status line)
 *   - wait bounded timeout
 *   - if timed out, kill ONLY the execution-owned cscript process
 *   - never enumerate or kill unrelated Word sessions
 *
 * Inputs are JSON:
 *   [
 *     { "input": "C:/path/in.docx", "output": "C:/path/out.pdf" },
 *     ...
 *   ]
 *
 * Output:
 *   - Per-job JSON written to output/<job>.json
 *   - Summary JSON written to summary.json
 */

import { spawn, execFile } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SIDECAR_JS = path.join(__dirname, 'word-sidecar', 'WordSidecar.js');
const CSCRIPT = process.env.CSCRIPT || 'cscript.exe';

const TIMEOUT_MS = Number(process.env.WORD_SIDECAR_TIMEOUT_MS || 60_000);

async function runOne({ input, output }) {
  const startedAt = Date.now();
  const job = {
    input,
    output,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: null,
    elapsedMs: null,
    ok: false,
    error: null,
    method: 'word.com',
    exitCode: null,
    stdout: '',
    timedOut: false,
  };

  return new Promise((resolve) => {
    if (!existsSync(SIDECAR_JS)) {
      job.error = `sidecar missing: ${SIDECAR_JS}`;
      job.finishedAt = new Date().toISOString();
      resolve(job);
      return;
    }
    if (!existsSync(input)) {
      job.error = `input not found: ${input}`;
      job.finishedAt = new Date().toISOString();
      resolve(job);
      return;
    }

    // cscript args:
    //   //nologo           suppress banner
    //   //E:JScript        explicitly use JScript
    //   <sidecar.js>      script
    //   <input>           arg 0 -> WScript.Arguments(0)
    //   <output>          arg 1 -> WScript.Arguments(1)
    const args = ['//nologo', '//E:JScript', SIDECAR_JS, input, output];
    const child = spawn(CSCRIPT, args, { windowsHide: true });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', (e) => { job.error = e.message; });

    const timer = setTimeout(() => {
      job.timedOut = true;
      job.error = `timeout after ${TIMEOUT_MS}ms`;
      // Kill ONLY the execution-owned child. Do not touch other processes.
      try {
        execFile('taskkill.exe', ['/F', '/PID', String(child.pid), '/T'], () => {});
      } catch (_) {}
    }, TIMEOUT_MS);

    child.on('close', (code) => {
      clearTimeout(timer);
      job.exitCode = code;
      job.stdout = out.trim();
      const elapsed = Date.now() - startedAt;
      job.elapsedMs = elapsed;
      job.finishedAt = new Date().toISOString();
      if (job.error == null) {
        try {
          const parsed = JSON.parse(out.trim().split(/\r?\n/).filter(Boolean).pop() || '{}');
          job.ok = parsed.ok === true;
          if (!job.ok) job.error = parsed.error || 'unknown sidecar failure';
        } catch (e) {
          job.error = `failed to parse sidecar stdout: ${e.message}; raw=${out.slice(0, 500)}`;
        }
      }
      resolve(job);
    });
  });
}

async function main() {
  const listArg = process.argv[2];
  if (!listArg) {
    console.error('usage: node render-word-sidecar.mjs <jobs.json>');
    process.exit(2);
  }
  const jobs = JSON.parse(await readFile(listArg, 'utf8'));
  const outDir = path.join(REPO_ROOT, 'docs', 'audit', 'final-213-customer-ready', 'runtime-rollout', 'word-sidecar');
  await mkdir(outDir, { recursive: true });

  const summary = {
    schema: 'qllaw.213.word_sidecar/v1',
    startedAt: new Date().toISOString(),
    timeoutMs: TIMEOUT_MS,
    cscript: CSCRIPT,
    jobs: [],
  };

  for (const j of jobs) {
    const r = await runOne(j);
    summary.jobs.push(r);
    const safeName = `${path.basename(j.input, '.docx')}.json`;
    await writeFile(path.join(outDir, safeName), JSON.stringify(r, null, 2));
    const status = r.ok ? 'OK' : 'FAIL';
    console.log(`[${status}] ${j.input} -> ${j.output} (${r.elapsedMs}ms${r.timedOut ? ' TIMEOUT' : ''})`);
  }

  summary.finishedAt = new Date().toISOString();
  summary.counts = {
    total: summary.jobs.length,
    ok: summary.jobs.filter((j) => j.ok).length,
    fail: summary.jobs.filter((j) => !j.ok).length,
    timeout: summary.jobs.filter((j) => j.timedOut).length,
  };
  await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log(`\nSummary: ${summary.counts.ok}/${summary.counts.total} ok (${summary.counts.timeout} timeout)`);
  // Fail-closed: exit non-zero unless every job succeeded
  process.exit(summary.counts.ok === summary.counts.total ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});