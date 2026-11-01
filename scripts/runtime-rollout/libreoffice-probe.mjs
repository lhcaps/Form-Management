/**
 * LibreOffice probe — verifies that soffice.exe is usable for headless
 * DOCX→PDF conversion.
 *
 * Notes from the local environment (2026-07-26):
 *   - `C:\Program Files\LibreOffice\program\soffice.exe --headless --version`
 *     exits 0 with stdout = "LibreOffice <ver>" but takes ~3s on Windows.
 *   - Passing `-env:UserInstallation=...` against an unwritable target on this
 *     machine truncates stdout/stderr to empty and the convert still appears
 *     to succeed, but the output PDF never lands. The reliable path is to
 *     NOT pass UserInstallation and rely on the default user profile.
 *
 * This probe writes a JSON inventory record at
 * docs/audit/final-213-customer-ready/runtime-rollout/libreoffice-probe.json
 * that downstream phases can consume without re-probing.
 */

import { spawn } from 'node:child_process';
import { existsSync, statSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);
const PROBE_PATH = path.join(ROLLOUT_DIR, 'libreoffice-probe.json');

const DECLARED_BINARY_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

function run(command, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      windowsHide: true,
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.stdout.on('data', (b) => { stdout += b.toString(); });
    child.stderr.on('data', (b) => { stderr += b.toString(); });
    child.on('error', (e) => { stderr += e.message; });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        command: [command, ...args].join(' '),
        exitCode: code,
        timedOut,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

function makeProbeEnv() {
  // Ensure no stale UserInstallation override leaks from the calling shell.
  const env = { ...process.env };
  delete env.LibreOffice_UserInstallation;
  return env;
}

async function main() {
  const probes = [];
  const pathProbe = await run('where.exe', ['soffice.exe'], 10_000);
  probes.push({ kind: 'PATH_LOOKUP', ...pathProbe });

  const candidates = [];
  if (pathProbe.exitCode === 0) {
    candidates.push(...pathProbe.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
  }
  candidates.push(...DECLARED_BINARY_PATHS);

  const deduped = [];
  for (const c of candidates) if (!deduped.includes(c)) deduped.push(c);

  const binaryChecks = [];
  let selected = null;
  for (const binary of deduped) {
    const exists = existsSync(binary);
    const size = exists ? statSync(binary).size : null;
    binaryChecks.push({ binary, exists, size });
    if (exists && !selected) selected = binary;
  }
  probes.push({ kind: 'BINARY_INSPECTION', checks: binaryChecks });

  if (!selected) {
    const summary = {
      schema: 'qllaw.213.libreoffice_probe/v1',
      finishedAt: new Date().toISOString(),
      available: false,
      selected: null,
      reason: 'NO_BINARY_RESOLVED',
      probes,
    };
    await writeFile(PROBE_PATH, `${JSON.stringify(summary, null, 2)}\n`);
    console.error('LibreOffice unavailable: no working binary resolved.');
    process.exit(1);
  }

  // The version probe on this machine often takes longer than 30s for the
  // very first invocation (user-profile materialization). It is also known
  // to write its banner to the console handle, not to stdout, when launched
  // via spawn (without a TTY). We therefore treat a version timeout as
  // "unknown" rather than "unavailable" — the conversion probe is the
  // authoritative signal.
  const versionProbe = await run(selected, ['--headless', '--version'], 60_000);
  probes.push({ kind: 'VERSION_ONLY', ...versionProbe });
  const version = versionProbe.stdout || versionProbe.stderr || 'VERSION_OUTPUT_EMPTY';

  // Conversion probe: take a real B1A R1.docx and convert to PDF.
  const candidateCodes = ['BM-001', 'BM-002', 'BM-008', 'BM-010', 'BM-012', 'BM-172'];
  let inputPath = null;
  for (const code of candidateCodes) {
    const p = path.join(ROLLOUT_DIR, 'forms', code, 'R1.docx');
    if (existsSync(p)) { inputPath = p; break; }
  }

  const conversions = [];
  if (inputPath) {
    const outDir = path.join(ROLLOUT_DIR, '.tmp-lo-out', String(Date.now()));
    mkdirSync(outDir, { recursive: true });
    const args = [
      '--headless',
      '--nologo',
      '--nodefault',
      '--nolockcheck',
      '--norestore',
      '--convert-to',
      'pdf:writer_pdf_Export',
      '--outdir',
      outDir,
      inputPath,
    ];
    const result = await run(selected, args, 240_000);
    const expectedPdf = path.join(outDir, 'R1.pdf');
    const pdfExists = existsSync(expectedPdf);
    const pdfSize = pdfExists ? statSync(expectedPdf).size : null;
    conversions.push({
      inputPath,
      outDir,
      command: `${selected} ${args.map((a) => (a.includes(' ') ? JSON.stringify(a) : a)).join(' ')}`,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      stdout: result.stdout,
      stderr: result.stderr,
      pdfExists,
      pdfSize,
    });
  }

  // OK is gated by the conversion probe (which produces a verifiable PDF).
  // A successful conversion is the strongest possible signal that LibreOffice
  // is functional. Version probe success is informational.
  const ok = conversions.some((c) => c.pdfExists);
  const summary = {
    schema: 'qllaw.213.libreoffice_probe/v1',
    finishedAt: new Date().toISOString(),
    available: ok,
    selected,
    version,
    probes,
    conversions,
    notes: [
      'Resolution order: PATH → declared-installation paths → version probe succeeds.',
      'UserInstallation override is intentionally omitted; default profile is used.',
      'Version probe tolerates blank stdout (LibreOffice on Windows sometimes writes to the console handle only).',
      'A pdfExists=false with exit=0 indicates the convert command "claimed success" but produced no PDF — fail-closed.',
    ],
  };
  await writeFile(PROBE_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  if (!ok) {
    console.error('LibreOffice probe failed: see libreoffice-probe.json');
    process.exit(1);
  }
  console.log(`OK: ${selected} available; version=${summary.version}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
