/**
 * LibreOffice visual promotion gate for runtime rollout batches.
 *
 * The gate renders both R1 and R2 DOCX files in isolated LibreOffice profiles,
 * extracts PDF text, and records hashes, page counts, legal-face checks, and
 * visible R1/R2 sentinel changes. A form passes only when both revisions pass.
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

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
const DEFAULT_BATCH = 'B1A_READY_SIMPLE';
const SELECTION_FILE_FLAG = (process.argv.find((arg) => arg.startsWith('--selection-file=')) || '')
  .split('=')[1];
const TIMEOUT_MS = Number(process.env.LIBREOFFICE_TIMEOUT_MS || 120_000);
const DECLARED_BINARY_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function fileSha256(filePath) {
  return sha256(await readFile(filePath));
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    const child = spawn(command, args, {
      cwd: options.cwd || REPO_ROOT,
      windowsHide: true,
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => { stderr += error.message; });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, options.timeoutMs || TIMEOUT_MS);
    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({
        command: [command, ...args].map((part) => JSON.stringify(part)).join(' '),
        startedAt,
        finishedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startedMs,
        exitCode,
        timedOut,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

async function resolveLibreOffice() {
  const probes = [];
  const pathProbe = await run('where.exe', ['soffice.exe'], { timeoutMs: 10_000 });
  probes.push({ kind: 'PATH_LOOKUP', ...pathProbe });
  const pathCandidate = pathProbe.exitCode === 0
    ? pathProbe.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean)
    : null;

  const repositoryCandidates = [];
  for (const candidate of [
    path.join(REPO_ROOT, 'tools', 'libreoffice', 'program', 'soffice.exe'),
    path.join(REPO_ROOT, '.tools', 'libreoffice', 'program', 'soffice.exe'),
    path.join(REPO_ROOT, 'vendor', 'libreoffice', 'program', 'soffice.exe'),
  ]) {
    repositoryCandidates.push(candidate);
    probes.push({ kind: 'REPOSITORY_BINARY', path: candidate, exists: existsSync(candidate) });
  }

  for (const candidate of DECLARED_BINARY_PATHS) {
    probes.push({ kind: 'DECLARED_BINARY', path: candidate, exists: existsSync(candidate) });
  }

  const selected = [pathCandidate, ...DECLARED_BINARY_PATHS, ...repositoryCandidates]
    .filter(Boolean)
    .find((candidate) => existsSync(candidate));
  if (!selected) {
    return { available: false, selected: null, version: null, versionCommand: null, probes };
  }

  const versionCommand = await run(selected, ['--headless', '--version'], { timeoutMs: 20_000 });
  const version = versionCommand.stdout || versionCommand.stderr || 'VERSION_OUTPUT_EMPTY';
  probes.push({ kind: 'VERSION_ONLY', path: selected, ...versionCommand });
  return {
    // On Windows, LibreOffice can create a background soffice process for
    // `--version` and never close its console handle. The actual conversion
    // below uses a fresh isolated user profile and is the authoritative
    // executability check; do not suppress all visual evidence solely because
    // this informational probe timed out.
    available: true,
    selected,
    version,
    versionCommand,
    probes,
  };
}

async function loadPdfParser() {
  const requireFromApi = createRequire(path.join(REPO_ROOT, 'apps', 'api', 'package.json'));
  const resolved = requireFromApi.resolve('pdf-parse');
  const module = await import(pathToFileURL(resolved).href);
  if (typeof module.PDFParse !== 'function') {
    throw new Error(`pdf-parse at ${resolved} does not export PDFParse`);
  }
  return module.PDFParse;
}

async function inspectPdf(PDFParse, pdfPath) {
  const parser = new PDFParse({ data: await readFile(pdfPath) });
  try {
    const extracted = await parser.getText();
    // `pdf-parse` v2 consumes the document during getInfo() on some PDFs,
    // leaving a subsequent getText() empty. Read text once and derive the
    // page count from that same result.
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

function visibleChangedValues(runtimeRecord) {
  const changed = [];
  for (const [key, r1Value] of Object.entries(runtimeRecord.r1Input || {})) {
    const r2Value = runtimeRecord.r2Input?.[key];
    if (String(r1Value) !== String(r2Value)) {
      changed.push({ key, r1: String(r1Value), r2: String(r2Value) });
    }
  }
  return changed;
}

function inspectLegalFace({ code, manifestEntry, runtimeRecord, r1Text, r2Text }) {
  const changedValues = visibleChangedValues(runtimeRecord);
  const visibleChanges = changedValues.filter(
    ({ r1, r2 }) => r1Text.includes(r1) && r2Text.includes(r2),
  );
  // Suppress false-positive stale-R1 detection on 1-3 digit numeric values;
  // require word-boundary match for them since "42" / "12" commonly appear
  // in legal text or as PDF text-extraction artifacts ("R2 4 2 0 26").
  const isShortNumeric = (v) => /^-?\d{1,3}$/.test(String(v).trim());
  const countWholeNumber = (text, value) => {
    const re = new RegExp(`\\b${value}\\b`, 'g');
    return [...text.matchAll(re)].length;
  };
  const staleR1Values = changedValues
    .filter(({ key, r1 }) => {
      const value = String(r1);
      if (!value || value.length === 0) return false;
      if (isShortNumeric(value)) {
        // A derived adapter component can change in the render model without
        // having its own placeholder. Do not mistake an unrelated static
        // model number for a stale rendered value.
        if (!(runtimeRecord.placeholderKeys || []).includes(key)) return false;
        // Model numbers and fixed legal citations often contain short
        // numerals in both revisions. A value is stale only when R2 retains
        // at least as many occurrences as R1, not merely when it occurs in
        // static text.
        const r1Occurrences = countWholeNumber(r1Text, value);
        if (r1Occurrences === 0) return false;
        return countWholeNumber(r2Text, value) >= r1Occurrences;
      }
      return r2Text.includes(value);
    })
    .map(({ r1 }) => String(r1));
  const modelNumber = String(manifestEntry?.EXPECTED_MODEL_NUMBER || code.replace('BM-', ''));
  const circularNumber = String(manifestEntry?.EXPECTED_CIRCULAR_NUMBER || '03/2026/TT-VKSTC');
  const combinedText = `${r1Text}\n${r2Text}`;
  // DOCX source contracts commonly use either `10/HS` or `010/HS` for the
  // same legal model. Compare the numeric component semantically while
  // retaining the mandatory suffix; this does not accept a different form.
  const modelMatch = modelNumber.match(/^(\d+)(\/.*)$/);
  const hasModelNumber = modelMatch
    ? new RegExp(`\\b0*${Number(modelMatch[1])}${modelMatch[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(combinedText)
    : combinedText.includes(modelNumber);
  const hasSignatureSlots = (runtimeRecord.placeholderKeys || []).some((key) =>
    key.startsWith('signature.') || key.startsWith('footer.'),
  );
  const signatureVisible = !hasSignatureSlots || changedValues
    .filter(({ key }) => key.startsWith('signature.') || key.startsWith('footer.'))
    .some(({ r1, r2 }) => r1Text.includes(r1) && r2Text.includes(r2));

  return {
    legalHeader: {
      pass: hasModelNumber && combinedText.includes(circularNumber),
      expectedModelNumber: modelNumber,
      expectedCircularNumber: circularNumber,
    },
    titleAndBody: {
      pass: r1Text.length >= 100 && r2Text.length >= 100,
      r1TextLength: r1Text.length,
      r2TextLength: r2Text.length,
    },
    signatureAndFooter: {
      applicable: hasSignatureSlots,
      pass: signatureVisible,
    },
    r2VisibleChanges: {
      pass: visibleChanges.length > 0,
      verifiedKeys: visibleChanges.map(({ key }) => key),
    },
    changedR1ValuesAbsentFromR2: {
      pass: staleR1Values.length === 0,
      staleValues: staleR1Values,
    },
  };
}

async function convertRevision({ soffice, code, revision, inputPath, outputRoot, PDFParse }) {
  const revisionDir = path.join(outputRoot, code, revision);
  const profileDir = path.join(outputRoot, '.lo-profiles', `${code}-${revision}`);
  await rm(revisionDir, { recursive: true, force: true });
  await rm(profileDir, { recursive: true, force: true });
  await mkdir(revisionDir, { recursive: true });
  await mkdir(profileDir, { recursive: true });
  const profileUrl = pathToFileURL(profileDir).href;
  const commandResult = await run(soffice, [
    '--headless',
    '--nologo',
    '--nodefault',
    '--nolockcheck',
    '--norestore',
    `-env:UserInstallation=${profileUrl}`,
    '--convert-to',
    'pdf:writer_pdf_Export',
    '--outdir',
    revisionDir,
    inputPath,
  ]);
  const pdfPath = path.join(revisionDir, `${revision}.pdf`);
  const exists = existsSync(pdfPath);
  if (commandResult.exitCode !== 0 || !exists) {
    return {
      status: 'FAIL',
      inputPath,
      inputDocxSha256: existsSync(inputPath) ? await fileSha256(inputPath) : null,
      pdfPath: null,
      commandResult,
      reason: !exists ? 'OUTPUT_PDF_MISSING' : 'LIBREOFFICE_NON_ZERO_EXIT',
    };
  }
  const pdfInfo = await inspectPdf(PDFParse, pdfPath);
  const pdfStat = await stat(pdfPath);
  return {
    status: pdfInfo.pageCount > 0 && pdfInfo.text.length > 0 ? 'PASS' : 'FAIL',
    inputPath,
    inputDocxSha256: await fileSha256(inputPath),
    pdfPath,
    outputPdfSha256: await fileSha256(pdfPath),
    outputPdfBytes: pdfStat.size,
    pageCount: pdfInfo.pageCount,
    extractedText: pdfInfo.text,
    commandResult,
    reason: pdfInfo.pageCount > 0 && pdfInfo.text.length > 0 ? null : 'PDF_TEXT_OR_PAGE_COUNT_EMPTY',
  };
}

async function main() {
  const batchName = SELECTION_FILE_FLAG
    ? path.basename(SELECTION_FILE_FLAG, path.extname(SELECTION_FILE_FLAG))
    : (process.argv.find((arg) => arg.startsWith('--batch=')) || '').split('=')[1] || DEFAULT_BATCH;
  const source = SELECTION_FILE_FLAG
    ? JSON.parse(await readFile(path.resolve(REPO_ROOT, SELECTION_FILE_FLAG), 'utf8'))
    : JSON.parse(await readFile(path.join(ROLLOUT_DIR, 'batches', `${batchName}.json`), 'utf8'));
  const sourceForms = SELECTION_FILE_FLAG
    ? (source.forms || []).map((form) => form.code)
    : (source.forms || []);
  const requestedForms = [...new Set(sourceForms)].sort();
  const duplicates = sourceForms.filter((code, index, all) => all.indexOf(code) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Batch ${batchName} contains duplicate form codes: ${duplicates.join(', ')}`);
  }
  const runtime = JSON.parse(await readFile(path.join(ROLLOUT_DIR, 'runtime-render-results.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(ROLLOUT_DIR, 'authoritative-213-manifest.json'), 'utf8'));
  const runtimeByCode = new Map((runtime.results || []).map((record) => [record.bmCode, record]));
  const manifestByCode = new Map((manifest.entries || []).map((entry) => [entry.FORM_CODE, entry]));
  const libreOffice = await resolveLibreOffice();
  const outputRoot = path.join(ROLLOUT_DIR, 'libreoffice');
  await mkdir(outputRoot, { recursive: true });

  const summary = {
    schema: 'qllaw.runtime_rollout.libreoffice_visual/v2',
    batch: batchName,
    startedAt: new Date().toISOString(),
    probe: libreOffice,
    forms: [],
  };

  if (!libreOffice.available) {
    summary.finishedAt = new Date().toISOString();
    summary.counts = { total: requestedForms.length, loPass: 0, fail: 0, unavailable: requestedForms.length };
    summary.forms = requestedForms.map((formCode) => ({
      formCode,
      promotionStatus: 'RUNTIME_CANDIDATE_WORD_VERIFIED',
      status: 'UNAVAILABLE',
      reason: 'LIBREOFFICE_UNAVAILABLE_AFTER_DECLARED_PROBES',
    }));
    await writeFile(
      path.join(ROLLOUT_DIR, 'libreoffice-visual-results.json'),
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    console.error('LibreOffice unavailable after PATH, declared-path, repository, and version probes.');
    process.exit(1);
  }

  const PDFParse = await loadPdfParser();
  for (const code of requestedForms) {
    const runtimeRecord = runtimeByCode.get(code);
    const manifestEntry = manifestByCode.get(code);
    if (!runtimeRecord || !manifestEntry) {
      summary.forms.push({ formCode: code, status: 'FAIL', reason: 'RUNTIME_OR_MANIFEST_RECORD_MISSING' });
      continue;
    }
    const formDir = path.join(ROLLOUT_DIR, 'forms', code);
    const r1 = await convertRevision({
      soffice: libreOffice.selected,
      code,
      revision: 'R1',
      inputPath: path.join(formDir, 'R1.docx'),
      outputRoot,
      PDFParse,
    });
    const r2 = await convertRevision({
      soffice: libreOffice.selected,
      code,
      revision: 'R2',
      inputPath: path.join(formDir, 'R2.docx'),
      outputRoot,
      PDFParse,
    });
    const inspections = r1.status === 'PASS' && r2.status === 'PASS'
      ? inspectLegalFace({
          code,
          manifestEntry,
          runtimeRecord,
          r1Text: r1.extractedText,
          r2Text: r2.extractedText,
        })
      : null;
    const inspectionPass = inspections != null && Object.values(inspections).every((check) => check.pass);
    const status = r1.status === 'PASS' && r2.status === 'PASS' && inspectionPass ? 'PASS' : 'FAIL';
    summary.forms.push({
      formCode: code,
      status,
      promotionStatus: status === 'PASS' ? 'VISUAL_GATES_VERIFIED' : 'RUNTIME_CANDIDATE_WORD_VERIFIED',
      libreOfficeVersion: libreOffice.version,
      r1,
      r2,
      inspections,
    });
    console.log(`${code}: ${status} (R1 pages=${r1.pageCount || 0}, R2 pages=${r2.pageCount || 0})`);
  }

  summary.finishedAt = new Date().toISOString();
  summary.counts = {
    total: summary.forms.length,
    loPass: summary.forms.filter((form) => form.status === 'PASS').length,
    fail: summary.forms.filter((form) => form.status === 'FAIL').length,
    unavailable: summary.forms.filter((form) => form.status === 'UNAVAILABLE').length,
  };
  await writeFile(
    path.join(ROLLOUT_DIR, 'libreoffice-visual-results.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(`LibreOffice visual: ${summary.counts.loPass}/${summary.counts.total} PASS`);
  process.exit(summary.counts.loPass === summary.counts.total ? 0 : 1);
}

main().catch((error) => {
  console.error(`FATAL: ${error.stack || error.message}`);
  process.exit(1);
});
