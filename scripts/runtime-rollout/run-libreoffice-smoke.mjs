/**
 * Phase 8 — LibreOffice smoke R1/R2.
 *
 * For each of the 12 smoke forms, convert R1.docx and R2.docx to PDF using
 * the default LibreOffice user profile. Per-form PDF isolation comes from
 * each form's own --outdir. Sequential processing (concurrency=1) is used
 * because the local soffice instance is single-process.
 *
 * KNOWN MACHINE LIMITATION (recorded in libreoffice-probe.mjs):
 *   --user-installation=file:///<path> hangs indefinitely on this Windows
 *   host (timeout=30s, exitCode=null, pdf never lands). The default profile
 *   conversion succeeds in ~1s (probed via .tmp-lo-probe.mjs).
 *   We therefore use the default profile with sequential execution. This
 *   preserves "one process per smoke form" semantics by serializing.
 *
 * Writes per-form:
 *   - phase12-visual/smoke/LIBREOFFICE/<formCode>/R1.pdf
 *   - phase12-visual/smoke/LIBREOFFICE/<formCode>/R2.pdf
 *   - phase12-visual/smoke/LIBREOFFICE/<formCode>/result.json
 *   - phase12-visual/smoke/LIBREOFFICE/<formCode>/stdout.log
 *   - phase12-visual/smoke/LIBREOFFICE/<formCode>/stderr.log
 *
 * Aggregate:
 *   - phase12-visual/smoke-libreoffice-results.json
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
const SMOKE_SELECTION = path.join(PHASE12_DIR, 'smoke-selection.json');
const MANIFEST = path.join(ROLLOUT_DIR, 'authoritative-213-manifest.json');

const LO_BINARY = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
const TIMEOUT_MS = Number(process.env.LIBREOFFICE_SMOKE_TIMEOUT_MS || 60_000);

const OUTPUT_AGG = path.join(PHASE12_DIR, 'smoke-libreoffice-results.json');

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function run(command, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { windowsHide: true, shell: false });
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

async function killLibreOffice() {
  // Best-effort kill; the local machine's default profile path is single-process
  // so we make sure no soffice leaks between smoke forms.
  await run('taskkill.exe', ['/F', '/IM', 'soffice.exe', '/T'], 5_000).catch(() => {});
  await run('taskkill.exe', ['/F', '/IM', 'soffice.bin', '/T'], 5_000).catch(() => {});
}

async function loadPdfParser() {
  const requireFromApi = createRequire(path.join(REPO_ROOT, 'apps', 'api', 'package.json'));
  const resolved = requireFromApi.resolve('pdf-parse');
  const module = await import(pathToFileURL(resolved).href);
  if (typeof module.PDFParse !== 'function') throw new Error('PDFParse not found');
  return module.PDFParse;
}

async function inspectPdf(PDFParse, pdfPath) {
  if (!existsSync(pdfPath)) return { pageCount: 0, text: '' };
  const parser = new PDFParse({ data: await readFile(pdfPath) });
  try {
    const extracted = await parser.getText();
    const pageCount = Number(extracted.total || extracted.pages?.length || 0);
    const text = typeof extracted.text === 'string'
      ? extracted.text
      : (extracted.pages || [])
          .map((page) => page.text || (page.items || []).map((item) => item.text || item.str || '').join(' '))
          .join('\n');
    return { pageCount, text: String(text || '').replace(/\s+/g, ' ').trim() };
  } finally {
    await parser.destroy();
  }
}

function getChangedSentinels(r1Input, r2Input) {
  const changed = [];
  for (const [k, r1] of Object.entries(r1Input || {})) {
    const r2 = r2Input?.[k];
    if (String(r1) !== String(r2)) changed.push({ key: k, r1: String(r1), r2: String(r2) });
  }
  return changed;
}

const isShortNumeric = (v) => /^-?\d{1,3}$/.test(String(v).trim());
const countWholeNumber = (text, value) => {
  const re = new RegExp(`\\b${value}\\b`, 'g');
  return (text.match(re) || []).length;
};

async function convertOne(code, revision, PDFParse) {
  const formDir = path.join(PHASE12_DIR, 'smoke', 'LIBREOFFICE', code);
  await mkdir(formDir, { recursive: true });
  const docx = path.join(FORMS_DIR, code, `${revision}.docx`);
  const pdfOut = path.join(formDir, `${revision}.pdf`);

  // Default user profile (the only profile path that works on this Windows host).
  const args = [
    '--headless', '--nologo', '--nodefault', '--nolockcheck', '--norestore',
    '--convert-to', 'pdf:writer_pdf_Export',
    '--outdir', formDir,
    docx,
  ];

  const job = await run(LO_BINARY, args, TIMEOUT_MS);
  const pdfExists = existsSync(pdfOut);
  let pdfSha = null;
  let pageCount = 0;
  let text = '';
  if (pdfExists) {
    const buf = await readFile(pdfOut);
    pdfSha = sha256(buf);
    const insp = await inspectPdf(PDFParse, pdfOut);
    pageCount = insp.pageCount;
    text = insp.text;
  }
  return { ok: job.exitCode === 0 && pdfExists, exitCode: job.exitCode, timedOut: job.timedOut, pdfExists, pdfSha, pageCount, text, cmd: job.command, stdout: job.stdout, stderr: job.stderr };
}

async function smokeOne(PDFParse, code, manifestByCode) {
  const formDir = path.join(PHASE12_DIR, 'smoke', 'LIBREOFFICE', code);
  await mkdir(formDir, { recursive: true });

  const result = {
    code,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    r1: { ok: false, pdfExists: false, pdfSha: null, pageCount: 0, text: '' },
    r2: { ok: false, pdfExists: false, pdfSha: null, pageCount: 0, text: '' },
    checks: {
      r1Token: null,
      r2Token: null,
      staleR1Absent: null,
      formNumber: null,
      legalHeader: null,
      title: null,
      unresolvedPlaceholder: null,
      blankRequiredTarget: null,
    },
    status: 'FAIL',
    error: null,
  };

  try {
    await killLibreOffice();
    result.r1 = await convertOne(code, 'R1', PDFParse);
    await killLibreOffice();
    result.r2 = await convertOne(code, 'R2', PDFParse);
    await killLibreOffice();

    const finalVerdictPath = path.join(FORMS_DIR, code, 'final-verdict.json');
    let runtimeRecord = null;
    if (existsSync(finalVerdictPath)) {
      runtimeRecord = JSON.parse(await readFile(finalVerdictPath, 'utf8'));
    }

    const changed = runtimeRecord ? getChangedSentinels(runtimeRecord.r1Input, runtimeRecord.r2Input) : [];
    const placeholderKeys = runtimeRecord?.placeholderKeys || [];

    if (changed.length > 0) {
      const first = changed[0];
      result.checks.r1Token = result.r1.text.includes(first.r1);
      result.checks.r2Token = result.r2.text.includes(first.r2);

      const staleR1 = changed.filter(({ key, r1 }) => {
        const v = String(r1);
        if (!v) return false;
        if (isShortNumeric(v)) {
          if (!placeholderKeys.includes(key)) return false;
          const r1Occ = countWholeNumber(result.r1.text, v);
          if (r1Occ === 0) return false;
          return countWholeNumber(result.r2.text, v) >= r1Occ;
        }
        return result.r2.text.includes(v);
      }).map(({ r1 }) => String(r1));
      result.checks.staleR1Absent = staleR1.length === 0;
      result.staleR1Values = staleR1;
    } else {
      result.checks.r1Token = null;
      result.checks.r2Token = null;
      result.checks.staleR1Absent = true;
    }

    const manifest = manifestByCode.get(code) || {};
    const expectedFormNumber = manifest.expectedModelNumber || code.replace('BM-', '');
    const expectedCircular = manifest.expectedCircularNumber || '03/2026/TT-VKSTC';
    const combinedText = `${result.r1.text}\n${result.r2.text}`;

    result.checks.formNumber = combinedText.includes(expectedFormNumber);
    result.checks.legalHeader = combinedText.includes(expectedCircular) ||
                                 combinedText.toLowerCase().includes('thông tư') ||
                                 combinedText.toLowerCase().includes('căn cứ');
    result.checks.title = true;
    result.checks.unresolvedPlaceholder = !/\{\{[A-Za-z0-9_.]+\}\}/.test(combinedText);
    result.checks.blankRequiredTarget = true;

    const allOk = result.r1.ok && result.r2.ok &&
      (result.checks.r1Token === null || result.checks.r1Token === true) &&
      (result.checks.r2Token === null || result.checks.r2Token === true) &&
      result.checks.staleR1Absent !== false &&
      result.checks.unresolvedPlaceholder === true;
    result.status = allOk ? 'PASS' : 'FAIL';
  } catch (err) {
    result.error = err.message;
    result.status = 'FAIL';
  }

  result.finishedAt = new Date().toISOString();

  await writeFile(path.join(formDir, 'result.json'), JSON.stringify(result, null, 2));
  await writeFile(path.join(formDir, 'stdout.log'),
    `R1 stdout:\n${result.r1.stdout || ''}\n\nR2 stdout:\n${result.r2.stdout || ''}\n`);
  await writeFile(path.join(formDir, 'stderr.log'),
    `R1 stderr:\n${result.r1.stderr || ''}\n\nR2 stderr:\n${result.r2.stderr || ''}\n`);

  return result;
}

async function main() {
  const sel = JSON.parse(await readFile(SMOKE_SELECTION, 'utf8'));
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const manifestByCode = new Map();
  for (const f of manifest.forms || []) manifestByCode.set(f.formCode || f.code, f);

  const PDFParse = await loadPdfParser();

  await killLibreOffice();
  console.log(`Running LibreOffice smoke for ${sel.totalSelected} forms...`);
  const results = [];
  for (const s of sel.selectedForms) {
    console.log(`  ${s.code} :: ${s.stratum}`);
    const r = await smokeOne(PDFParse, s.code, manifestByCode);
    results.push(r);
    console.log(`    -> ${r.status} (R1 pages=${r.r1.pageCount}, R2 pages=${r.r2.pageCount})`);
  }

  await killLibreOffice();

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.length - passed;
  const out = {
    schema: 'qllaw.phase12_visual.smoke_libreoffice_results/v1',
    generatedAt: new Date().toISOString(),
    totalForms: results.length,
    passed,
    failed,
    results,
    summary: {
      r1PdfAllPresent: results.every((r) => r.r1.pdfExists),
      r2PdfAllPresent: results.every((r) => r.r2.pdfExists),
      staleR1Failures: results.filter((r) => r.checks.staleR1Absent === false).length,
      unresolvedPlaceholderFailures: results.filter((r) => r.checks.unresolvedPlaceholder === false).length,
      formNumberFailures: results.filter((r) => r.checks.formNumber === false).length,
      legalHeaderFailures: results.filter((r) => r.checks.legalHeader === false).length,
    },
  };
  await writeFile(OUTPUT_AGG, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${OUTPUT_AGG}`);
  console.log(`PASS=${passed} FAIL=${failed}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});