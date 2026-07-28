/**
 * Phase 5 — Probe visual engines.
 *
 * Probes:
 *  - Microsoft Word (via COM): locate WINWORD.EXE through COM registration,
 *    run a minimal DOCX→PDF probe via the existing WordSidecar.js.
 *  - LibreOffice: soffice.exe at C:\Program Files\LibreOffice\program\soffice.exe
 *    (primary), PATH lookup (secondary).
 *
 * Writes:
 *   - phase12-visual/engine-probe.json
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractZip } from './lib/docx-zip.mjs';

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
const PHASE12_DIR = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'phase12-visual');
const FORMS_DIR = path.join(ROLLOUT_DIR, 'forms');

const WORD_CANDIDATES = [
  'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
  'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
  'C:\\Program Files\\Microsoft Office\\Office16\\WINWORD.EXE',
  'C:\\Program Files (x86)\\Microsoft Office\\Office16\\WINWORD.EXE',
  'C:\\Program Files\\Microsoft Office\\Office15\\WINWORD.EXE',
];
const LO_CANDIDATES = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

const OUTPUT = path.join(PHASE12_DIR, 'engine-probe.json');

function run(command, args, timeoutMs, env = process.env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      windowsHide: true,
      shell: false,
      env,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill(); } catch (_) {}
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

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function probeLibreOffice() {
  const probe = {
    kind: 'LIBREOFFICE',
    selected: null,
    version: null,
    versionCommand: null,
    pathProbes: [],
    candidates: [],
    conversion: null,
    status: 'LIBREOFFICE_UNAVAILABLE',
    errors: [],
  };

  // PATH lookup
  const pathProbe = await run('where.exe', ['soffice.exe'], 10_000);
  probe.pathProbes.push(pathProbe);
  const pathCandidates = pathProbe.exitCode === 0
    ? pathProbe.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : [];

  for (const binary of [...new Set([...pathCandidates, ...LO_CANDIDATES])]) {
    const exists = existsSync(binary);
    const size = exists ? statSync(binary).size : null;
    probe.candidates.push({ binary, exists, size });
    if (exists && !probe.selected) probe.selected = binary;
  }

  if (!probe.selected) {
    probe.errors.push('No soffice.exe candidate resolved.');
    return probe;
  }

  // Version probe — tolerant of blank output on Windows.
  const versionCmd = await run(probe.selected, ['--headless', '--version'], 20_000);
  probe.versionCommand = versionCmd;
  probe.version = versionCmd.stdout || versionCmd.stderr || 'VERSION_OUTPUT_EMPTY';

  // Conversion probe — use the smallest known-good DOCX on disk: BM-001/R1.docx
  const probeDocx = path.join(FORMS_DIR, 'BM-001', 'R1.docx');
  if (!existsSync(probeDocx)) {
    probe.status = 'LIBREOFFICE_BOOT_FAILURE';
    probe.errors.push(`Probe DOCX missing: ${probeDocx}`);
    return probe;
  }

  const tmpOutDir = path.join(ROLLOUT_DIR, '.tmp-p12-engine-probe-lo');
  await rm(tmpOutDir, { recursive: true, force: true });
  await mkdir(tmpOutDir, { recursive: true });

  const args = [
    '--headless',
    '--nologo',
    '--nodefault',
    '--nolockcheck',
    '--norestore',
    '--convert-to', 'pdf:writer_pdf_Export',
    '--outdir', tmpOutDir,
    probeDocx,
  ];

  const conv = await run(probe.selected, args, 60_000);
  const probePdfPath = path.join(tmpOutDir, 'R1.pdf');
  const probePdfExists = existsSync(probePdfPath);
  const probePdfSize = probePdfExists ? statSync(probePdfPath).size : null;
  probe.conversion = {
    command: conv.command,
    exitCode: conv.exitCode,
    timedOut: conv.timedOut,
    stdout: conv.stdout,
    stderr: conv.stderr,
    probePdfPath,
    probePdfExists,
    probePdfSize,
  };

  if (conv.exitCode === 0 && probePdfExists && probePdfSize > 0) {
    probe.status = 'LIBREOFFICE_AVAILABLE';
  } else {
    probe.status = 'LIBREOFFICE_BOOT_FAILURE';
    probe.errors.push(`Conversion exitCode=${conv.exitCode} pdfExists=${probePdfExists}`);
  }

  return probe;
}

async function probeWord() {
  const probe = {
    kind: 'WORD',
    selected: null,
    comRegistrationFound: false,
    versionCommand: null,
    candidates: [],
    sidecarProbe: null,
    status: 'WORD_UNAVAILABLE',
    errors: [],
  };

  // 1. Try COM registration lookup via reg.exe
  const regQuery = await run(
    'reg.exe',
    ['query', 'HKCR\\Word.Application\\CLSID', '/ve'],
    10_000,
  );
  probe.comRegistrationFound = regQuery.exitCode === 0;
  probe.errors.push(`reg.exe exitCode=${regQuery.exitCode} stdout=${regQuery.stdout?.slice(0, 80)}`);

  // 2. Try candidates
  for (const binary of WORD_CANDIDATES) {
    const exists = existsSync(binary);
    const size = exists ? statSync(binary).size : null;
    probe.candidates.push({ binary, exists, size });
    if (exists && !probe.selected) probe.selected = binary;
  }

  // 3. Run a sidecar probe if WINWORD.EXE is found
  if (!probe.selected) {
    probe.status = probe.comRegistrationFound ? 'WORD_COM_FAILURE' : 'WORD_UNAVAILABLE';
    probe.errors.push('No WINWORD.EXE candidate resolved.');
    return probe;
  }

  // Probe docx
  const probeDocx = path.join(FORMS_DIR, 'BM-001', 'R1.docx');
  if (!existsSync(probeDocx)) {
    probe.status = 'WORD_COM_FAILURE';
    probe.errors.push(`Probe DOCX missing: ${probeDocx}`);
    return probe;
  }

  const probePdfPath = path.join(ROLLOUT_DIR, '.tmp-p12-engine-probe-word', 'R1.pdf');
  await rm(path.dirname(probePdfPath), { recursive: true, force: true });
  await mkdir(path.dirname(probePdfPath), { recursive: true });

  const SIDECAR = path.join(__dirname, 'word-sidecar', 'WordSidecar.js');
  const sidecarProbe = await run(
    'cscript.exe',
    ['//nologo', '//E:JScript', SIDECAR, probeDocx, probePdfPath],
    90_000,
  );
  let parsedStatus = null;
  try {
    const lines = sidecarProbe.stdout.split(/\r?\n/).filter(Boolean);
    if (lines.length) parsedStatus = JSON.parse(lines[lines.length - 1]);
  } catch (_) {}

  const probePdfExists = existsSync(probePdfPath);
  const probePdfSize = probePdfExists ? statSync(probePdfPath).size : null;

  probe.sidecarProbe = {
    command: sidecarProbe.command,
    exitCode: sidecarProbe.exitCode,
    timedOut: sidecarProbe.timedOut,
    stdout: sidecarProbe.stdout,
    stderr: sidecarProbe.stderr,
    parsedStatus,
    probePdfPath,
    probePdfExists,
    probePdfSize,
  };

  if (sidecarProbe.exitCode === 0 && parsedStatus && parsedStatus.ok === true && probePdfExists && probePdfSize > 0) {
    probe.status = 'WORD_AVAILABLE';
  } else {
    probe.status = sidecarProbe.timedOut ? 'WORD_COM_FAILURE' : 'WORD_COM_FAILURE';
  }

  return probe;
}

async function main() {
  console.log('Probing Word...');
  const word = await probeWord();
  console.log('Probing LibreOffice...');
  const libreOffice = await probeLibreOffice();

  const out = {
    schema: 'qllaw.phase12_visual.engine_probe/v1',
    generatedAt: new Date().toISOString(),
    word,
    libreOffice,
    summary: {
      wordStatus: word.status,
      libreOfficeStatus: libreOffice.status,
      anyEngineAvailable: word.status === 'WORD_AVAILABLE' || libreOffice.status === 'LIBREOFFICE_AVAILABLE',
    },
  };
  await writeFile(OUTPUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${OUTPUT}`);
  console.log(`Word: ${word.status}, LO: ${libreOffice.status}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});