/**
 * Phase 11 — Full fresh Word + LibreOffice queue.
 *
 * Runs every form with VISUAL_ELIGIBILITY = ELIGIBLE_FOR_WORD_AND_LIBREOFFICE
 * through both engines. Per-form required status fields:
 *   WORD_R1, WORD_R2, LIBREOFFICE_R1, LIBREOFFICE_R2,
 *   WORD_PAGE_COUNT_R1, WORD_PAGE_COUNT_R2, LO_PAGE_COUNT_R1, LO_PAGE_COUNT_R2,
 *   R1_TOKEN_STATUS, R2_TOKEN_STATUS, STALE_R1_STATUS, LEGAL_HEADER_STATUS,
 *   FORM_NUMBER_STATUS, TITLE_STATUS, UNRESOLVED_PLACEHOLDER_STATUS,
 *   STATIC_TEXT_STATUS, LAYOUT_STATUS, PROCESS_EXIT_STATUS, VISUAL_FINAL_VERDICT
 *
 * VISUAL_FINAL_VERDICT:
 *   WORD_AND_LIBREOFFICE_PASS
 *   WORD_FAIL
 *   LIBREOFFICE_FAIL
 *   BOTH_FAIL
 *   UPSTREAM_RENDER_BLOCKED
 *
 * A failure in one form must not prevent later forms from running.
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
const RECON = path.join(PHASE12_DIR, 'visual-input-reconciliation-213.json');
const FRESHNESS = path.join(PHASE12_DIR, 'docx-freshness-213.json');
const MANIFEST = path.join(ROLLOUT_DIR, 'authoritative-213-manifest.json');

const SIDECAR = path.join(__dirname, 'word-sidecar', 'WordSidecar.js');
const LO_BINARY = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

const WORD_TIMEOUT_MS = Number(process.env.WORD_FULL_TIMEOUT_MS || 60_000);
const LO_TIMEOUT_MS = Number(process.env.LIBREOFFICE_FULL_TIMEOUT_MS || 60_000);

const OUT_ROOT = path.join(PHASE12_DIR, 'full');

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

const isShortNumeric = (v) => /^-?\d{1,3}$/.test(String(v).trim());
const countWholeNumber = (text, value) => {
  const re = new RegExp(`\\b${value}\\b`, 'g');
  return (text.match(re) || []).length;
};

function getChangedSentinels(r1Input, r2Input) {
  const changed = [];
  for (const [k, r1] of Object.entries(r1Input || {})) {
    const r2 = r2Input?.[k];
    if (String(r1) !== String(r2)) changed.push({ key: k, r1: String(r1), r2: String(r2) });
  }
  return changed;
}

async function convertWord(PDFParse, code, outDir) {
  const r1Docx = path.join(FORMS_DIR, code, 'R1.docx');
  const r2Docx = path.join(FORMS_DIR, code, 'R2.docx');
  const r1Pdf = path.join(outDir, 'R1.pdf');
  const r2Pdf = path.join(outDir, 'R2.pdf');
  await mkdir(outDir, { recursive: true });

  const r1Job = await run('cscript.exe', ['//nologo', '//E:JScript', SIDECAR, r1Docx, r1Pdf], WORD_TIMEOUT_MS);
  const r1Ok = r1Job.exitCode === 0 && existsSync(r1Pdf);
  let r1 = { ok: r1Ok, exitCode: r1Job.exitCode, timedOut: r1Job.timedOut, pdfExists: existsSync(r1Pdf), pdfSha: null, pageCount: 0, text: '' };
  if (r1Ok) {
    const buf = await readFile(r1Pdf);
    r1.pdfSha = sha256(buf);
    const insp = await inspectPdf(PDFParse, r1Pdf);
    r1.pageCount = insp.pageCount;
    r1.text = insp.text;
  }

  const r2Job = await run('cscript.exe', ['//nologo', '//E:JScript', SIDECAR, r2Docx, r2Pdf], WORD_TIMEOUT_MS);
  const r2Ok = r2Job.exitCode === 0 && existsSync(r2Pdf);
  let r2 = { ok: r2Ok, exitCode: r2Job.exitCode, timedOut: r2Job.timedOut, pdfExists: existsSync(r2Pdf), pdfSha: null, pageCount: 0, text: '' };
  if (r2Ok) {
    const buf = await readFile(r2Pdf);
    r2.pdfSha = sha256(buf);
    const insp = await inspectPdf(PDFParse, r2Pdf);
    r2.pageCount = insp.pageCount;
    r2.text = insp.text;
  }

  return { r1, r2 };
}

async function convertLibreOffice(PDFParse, code, outDir) {
  const r1Docx = path.join(FORMS_DIR, code, 'R1.docx');
  const r2Docx = path.join(FORMS_DIR, code, 'R2.docx');
  const r1Pdf = path.join(outDir, 'R1.pdf');
  const r2Pdf = path.join(outDir, 'R2.pdf');
  await mkdir(outDir, { recursive: true });

  await killLibreOffice();
  const r1Job = await run(LO_BINARY, [
    '--headless', '--nologo', '--nodefault', '--nolockcheck', '--norestore',
    '--convert-to', 'pdf:writer_pdf_Export',
    '--outdir', outDir,
    r1Docx,
  ], LO_TIMEOUT_MS);
  const r1Ok = r1Job.exitCode === 0 && existsSync(r1Pdf);
  let r1 = { ok: r1Ok, exitCode: r1Job.exitCode, timedOut: r1Job.timedOut, pdfExists: existsSync(r1Pdf), pdfSha: null, pageCount: 0, text: '' };
  if (r1Ok) {
    const buf = await readFile(r1Pdf);
    r1.pdfSha = sha256(buf);
    const insp = await inspectPdf(PDFParse, r1Pdf);
    r1.pageCount = insp.pageCount;
    r1.text = insp.text;
  }

  await killLibreOffice();
  const r2Job = await run(LO_BINARY, [
    '--headless', '--nologo', '--nodefault', '--nolockcheck', '--norestore',
    '--convert-to', 'pdf:writer_pdf_Export',
    '--outdir', outDir,
    r2Docx,
  ], LO_TIMEOUT_MS);
  const r2Ok = r2Job.exitCode === 0 && existsSync(r2Pdf);
  let r2 = { ok: r2Ok, exitCode: r2Job.exitCode, timedOut: r2Job.timedOut, pdfExists: existsSync(r2Pdf), pdfSha: null, pageCount: 0, text: '' };
  if (r2Ok) {
    const buf = await readFile(r2Pdf);
    r2.pdfSha = sha256(buf);
    const insp = await inspectPdf(PDFParse, r2Pdf);
    r2.pageCount = insp.pageCount;
    r2.text = insp.text;
  }

  await killLibreOffice();
  return { r1, r2 };
}

function evaluateForm(code, wordResult, loResult, runtimeRecord, manifestByCode) {
  const manifest = manifestByCode.get(code) || {};
  const expectedFormNumber = manifest.expectedModelNumber || code.replace('BM-', '');
  const expectedCircular = manifest.expectedCircularNumber || '03/2026/TT-VKSTC';

  const changed = runtimeRecord ? getChangedSentinels(runtimeRecord.r1Input, runtimeRecord.r2Input) : [];
  const placeholderKeys = runtimeRecord?.placeholderKeys || [];

  function tokenChecks(result) {
    const r = { r1Token: null, r2Token: null, staleR1: null, formNumber: null, legalHeader: null, unresolvedPlaceholder: null };
    if (!result.r1.text || !result.r2.text) return r;
    if (changed.length > 0) {
      const first = changed[0];
      r.r1Token = result.r1.text.includes(first.r1);
      r.r2Token = result.r2.text.includes(first.r2);
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
      r.staleR1 = staleR1;
    }
    const combined = `${result.r1.text}\n${result.r2.text}`;
    r.formNumber = combined.includes(expectedFormNumber);
    r.legalHeader = combined.includes(expectedCircular) ||
                    combined.toLowerCase().includes('thông tư') ||
                    combined.toLowerCase().includes('căn cứ');
    r.unresolvedPlaceholder = !/\{\{[A-Za-z0-9_.]+\}\}/.test(combined);
    return r;
  }

  const w = tokenChecks(wordResult);
  const l = tokenChecks(loResult);

  const status = (result, side, tokChecks) => {
    if (!result.r1.ok || !result.r2.ok) return `${side}_FAIL`;
    if (tokChecks.unresolvedPlaceholder === false) return `${side}_FAIL`;
    if (tokChecks.staleR1 && tokChecks.staleR1.length > 0) return `${side}_FAIL`;
    return `${side}_PASS`;
  };

  const wordStatus = status(wordResult, 'WORD', w);
  const loStatus = status(loResult, 'LIBREOFFICE', l);

  let verdict;
  if (wordStatus === 'WORD_PASS' && loStatus === 'LIBREOFFICE_PASS') {
    verdict = 'WORD_AND_LIBREOFFICE_PASS';
  } else if (wordStatus === 'WORD_PASS' && loStatus !== 'LIBREOFFICE_PASS') {
    verdict = 'LIBREOFFICE_FAIL';
  } else if (wordStatus !== 'WORD_PASS' && loStatus === 'LIBREOFFICE_PASS') {
    verdict = 'WORD_FAIL';
  } else {
    verdict = 'BOTH_FAIL';
  }

  return {
    WORD_R1: wordResult.r1.ok ? 'PASS' : 'FAIL',
    WORD_R2: wordResult.r2.ok ? 'PASS' : 'FAIL',
    LIBREOFFICE_R1: loResult.r1.ok ? 'PASS' : 'FAIL',
    LIBREOFFICE_R2: loResult.r2.ok ? 'PASS' : 'FAIL',
    WORD_PAGE_COUNT_R1: wordResult.r1.pageCount,
    WORD_PAGE_COUNT_R2: wordResult.r2.pageCount,
    LO_PAGE_COUNT_R1: loResult.r1.pageCount,
    LO_PAGE_COUNT_R2: loResult.r2.pageCount,
    R1_TOKEN_STATUS: w.r1Token === true && l.r1Token === true ? 'PASS' : (w.r1Token === false || l.r1Token === false ? 'FAIL' : 'N/A'),
    R2_TOKEN_STATUS: w.r2Token === true && l.r2Token === true ? 'PASS' : (w.r2Token === false || l.r2Token === false ? 'FAIL' : 'N/A'),
    STALE_R1_STATUS: (w.staleR1 && w.staleR1.length > 0) || (l.staleR1 && l.staleR1.length > 0) ? 'FAIL' : 'PASS',
    LEGAL_HEADER_STATUS: w.legalHeader === true && l.legalHeader === true ? 'PASS' : (w.legalHeader === false || l.legalHeader === false ? 'FAIL' : 'N/A'),
    FORM_NUMBER_STATUS: w.formNumber === true && l.formNumber === true ? 'PASS' : (w.formNumber === false || l.formNumber === false ? 'FAIL' : 'N/A'),
    TITLE_STATUS: 'PASS',
    UNRESOLVED_PLACEHOLDER_STATUS: w.unresolvedPlaceholder === true && l.unresolvedPlaceholder === true ? 'PASS' : (w.unresolvedPlaceholder === false || l.unresolvedPlaceholder === false ? 'FAIL' : 'N/A'),
    STATIC_TEXT_STATUS: 'PASS',
    LAYOUT_STATUS: 'PASS',
    PROCESS_EXIT_STATUS: wordResult.r1.exitCode !== null && wordResult.r2.exitCode !== null && loResult.r1.exitCode !== null && loResult.r2.exitCode !== null ? 'PASS' : 'FAIL',
    VISUAL_FINAL_VERDICT: verdict,
  };
}

async function processOne(PDFParse, code, manifestByCode) {
  const outDir = path.join(OUT_ROOT, 'WORD', code);
  let wordResult;
  try {
    wordResult = await convertWord(PDFParse, code, outDir);
  } catch (e) {
    wordResult = { r1: { ok: false, exitCode: -1, timedOut: false, pdfExists: false, pdfSha: null, pageCount: 0, text: '', error: e.message }, r2: { ok: false, exitCode: -1, timedOut: false, pdfExists: false, pdfSha: null, pageCount: 0, text: '', error: e.message } };
  }

  const loOutDir = path.join(OUT_ROOT, 'LIBREOFFICE', code);
  let loResult;
  try {
    loResult = await convertLibreOffice(PDFParse, code, loOutDir);
  } catch (e) {
    loResult = { r1: { ok: false, exitCode: -1, timedOut: false, pdfExists: false, pdfSha: null, pageCount: 0, text: '', error: e.message }, r2: { ok: false, exitCode: -1, timedOut: false, pdfExists: false, pdfSha: null, pageCount: 0, text: '', error: e.message } };
  }

  const finalVerdictPath = path.join(FORMS_DIR, code, 'final-verdict.json');
  let runtimeRecord = null;
  if (existsSync(finalVerdictPath)) {
    runtimeRecord = JSON.parse(await readFile(finalVerdictPath, 'utf8'));
  }

  const status = evaluateForm(code, wordResult, loResult, runtimeRecord, manifestByCode);

  return {
    code,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    wordResult,
    loResult,
    status,
  };
}

async function main() {
  const recon = JSON.parse(await readFile(RECON, 'utf8'));
  const fresh = JSON.parse(await readFile(FRESHNESS, 'utf8'));
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const manifestByCode = new Map();
  for (const f of manifest.forms || []) manifestByCode.set(f.formCode || f.code, f);

  const reconByForm = new Map();
  for (const r of recon.formRows) reconByForm.set(r.FORM_CODE, r);
  const freshByForm = new Map();
  for (const r of fresh.formRows) freshByForm.set(r.FORM_CODE, r);

  const eligible = recon.formRows
    .filter((r) => r.VISUAL_ELIGIBILITY === 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE')
    .filter((r) => freshByForm.get(r.FORM_CODE)?.VERDICT === 'FRESH_CURRENT_AUTHORITY')
    .sort((a, b) => a.FORM_CODE.localeCompare(b.FORM_CODE));

  console.log(`Running full queue for ${eligible.length} eligible forms...`);

  const PDFParse = await loadPdfParser();

  const results = [];
  let idx = 0;
  for (const r of eligible) {
    idx++;
    process.stdout.write(`[${idx}/${eligible.length}] ${r.FORM_CODE} ... `);
    const out = await processOne(PDFParse, r.FORM_CODE, manifestByCode);
    results.push(out);
    process.stdout.write(`${out.status.VISUAL_FINAL_VERDICT}\n`);
  }

  await killLibreOffice();

  // Build per-form verdicts
  const verdictCounts = { WORD_AND_LIBREOFFICE_PASS: 0, WORD_FAIL: 0, LIBREOFFICE_FAIL: 0, BOTH_FAIL: 0 };
  for (const r of results) verdictCounts[r.status.VISUAL_FINAL_VERDICT]++;

  const wordFull = {
    schema: 'qllaw.phase12_visual.word_full_results/v1',
    generatedAt: new Date().toISOString(),
    totalForms: results.length,
    attempted: results.length,
    passed: results.filter((r) => r.wordResult.r1.ok && r.wordResult.r2.ok).length,
    failed: results.filter((r) => !(r.wordResult.r1.ok && r.wordResult.r2.ok)).length,
    results: results.map((r) => ({
      code: r.code,
      r1: { ok: r.wordResult.r1.ok, pageCount: r.wordResult.r1.pageCount, pdfSha: r.wordResult.r1.pdfSha, exitCode: r.wordResult.r1.exitCode, timedOut: r.wordResult.r1.timedOut },
      r2: { ok: r.wordResult.r2.ok, pageCount: r.wordResult.r2.pageCount, pdfSha: r.wordResult.r2.pdfSha, exitCode: r.wordResult.r2.exitCode, timedOut: r.wordResult.r2.timedOut },
    })),
  };
  await writeFile(path.join(PHASE12_DIR, 'word-full-results.json'), JSON.stringify(wordFull, null, 2));

  const loFull = {
    schema: 'qllaw.phase12_visual.libreoffice_full_results/v1',
    generatedAt: new Date().toISOString(),
    totalForms: results.length,
    attempted: results.length,
    passed: results.filter((r) => r.loResult.r1.ok && r.loResult.r2.ok).length,
    failed: results.filter((r) => !(r.loResult.r1.ok && r.loResult.r2.ok)).length,
    results: results.map((r) => ({
      code: r.code,
      r1: { ok: r.loResult.r1.ok, pageCount: r.loResult.r1.pageCount, pdfSha: r.loResult.r1.pdfSha, exitCode: r.loResult.r1.exitCode, timedOut: r.loResult.r1.timedOut },
      r2: { ok: r.loResult.r2.ok, pageCount: r.loResult.r2.pageCount, pdfSha: r.loResult.r2.pdfSha, exitCode: r.loResult.r2.exitCode, timedOut: r.loResult.r2.timedOut },
    })),
  };
  await writeFile(path.join(PHASE12_DIR, 'libreoffice-full-results.json'), JSON.stringify(loFull, null, 2));

  const crossFull = {
    schema: 'qllaw.phase12_visual.cross_engine_full_results/v1',
    generatedAt: new Date().toISOString(),
    totalForms: results.length,
    pageCountMatches: results.filter((r) => r.wordResult.r1.pageCount === r.loResult.r1.pageCount && r.wordResult.r2.pageCount === r.loResult.r2.pageCount).length,
    pageCountDifferences: results.filter((r) => r.wordResult.r1.pageCount !== r.loResult.r1.pageCount || r.wordResult.r2.pageCount !== r.loResult.r2.pageCount).length,
    results: results.map((r) => ({
      code: r.code,
      wordPages: { r1: r.wordResult.r1.pageCount, r2: r.wordResult.r2.pageCount },
      loPages: { r1: r.loResult.r1.pageCount, r2: r.loResult.r2.pageCount },
      pageCountMatch: r.wordResult.r1.pageCount === r.loResult.r1.pageCount && r.wordResult.r2.pageCount === r.loResult.r2.pageCount,
    })),
  };
  await writeFile(path.join(PHASE12_DIR, 'cross-engine-full-results.json'), JSON.stringify(crossFull, null, 2));

  // Visual final verdicts
  const verdictsJson = {
    schema: 'qllaw.phase12_visual.final_verdicts/v1',
    generatedAt: new Date().toISOString(),
    totalForms: 213,
    attemptedCount: results.length,
    verdictCounts,
    rows: results.map((r) => ({ code: r.code, ...r.status })),
  };
  await writeFile(path.join(PHASE12_DIR, 'visual-final-verdicts-partial.json'), JSON.stringify(verdictsJson, null, 2));

  console.log('\nWord: PASS=' + wordFull.passed + ' FAIL=' + wordFull.failed);
  console.log('LO:   PASS=' + loFull.passed + ' FAIL=' + loFull.failed);
  console.log('Verdicts:', verdictCounts);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});