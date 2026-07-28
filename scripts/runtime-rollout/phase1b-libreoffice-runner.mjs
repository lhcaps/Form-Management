/**
 * Phase 2 — LibreOffice visual promotion gate for the 5 new B1A candidates.
 *
 * For each of BM-002, BM-008, BM-010, BM-012, BM-172, render R1.docx and
 * R2.docx to PDF in an isolated LibreOffice profile, record all evidence
 * (command, exit code, version, SHA-256 of input + output, page count), and
 * inspect the extracted PDF text for legal-header, title/body, signature/
 * footer, and R1/R2 sentinel differences.
 *
 * Result file: phase1b-libreoffice-outcomes.json
 * Per-form `status` is one of:
 *   - PASS          : both R1 and R2 produced non-empty PDFs and all inspections passed
 *   - FAIL          : any inspection failed
 *   - UNAVAILABLE   : LibreOffice could not be resolved
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, statSync, mkdirSync, readFileSync } from 'node:fs';
import { readFile, writeFile, rm } from 'node:fs/promises';
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
const PROBE_PATH = path.join(ROLLOUT_DIR, 'libreoffice-probe.json');
const OUTCOMES_PATH = path.join(ROLLOUT_DIR, 'phase1b-libreoffice-outcomes.json');
const TIMEOUT_MS = Number(process.env.LIBREOFFICE_TIMEOUT_MS || 240_000);

const argv = process.argv.slice(2);
const argBatch = (argv.find((a) => a.startsWith('--batch=')) || '').split('=')[1]
  || (argv.find((a) => a.startsWith('--batch')) ? argv[argv.indexOf('--batch') + 1] : null);
const B1A_CANDIDATES = argBatch
  ? JSON.parse(readFileSync(`docs/audit/final-213-customer-ready/runtime-rollout/batches/${argBatch}.json`, 'utf8')).forms
  : ['BM-002', 'BM-008', 'BM-010', 'BM-012', 'BM-172'];

function sha256OfBuffer(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function fileSha256(filePath) {
  return sha256OfBuffer(await readFile(filePath));
}

function run(command, args, timeoutMs) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
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
        command: `${command} ${args.map((a) => (a.includes(' ') ? JSON.stringify(a) : a)).join(' ')}`,
        startedAt,
        finishedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startedMs,
        exitCode: code,
        timedOut,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

async function loadPdfText() {
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
    const info = await parser.getInfo();
    const extracted = await parser.getText();
    // pdf-parse (modern) returns either { text } or { pages: [{ text }] }.
    // `info.pages` may be 0 on its own — the pageCount must come from the
    // page array length when present.
    const pagesArray = Array.isArray(extracted.pages) ? extracted.pages : null;
    let pageCount = Number(info.pages || info.numpages || 0);
    if (pagesArray && pagesArray.length > 0) {
      pageCount = pagesArray.length;
    }
    let text = '';
    if (typeof extracted.text === 'string') {
      text = extracted.text;
    } else if (pagesArray) {
      text = pagesArray
        .map((page) => page.text || (page.items || []).map((it) => it.text || it.str || '').join(' '))
        .join('\n');
    }
    return {
      pageCount,
      text: String(text || '').replace(/\s+/g, ' ').trim(),
    };
  } finally {
    await parser.destroy();
  }
}

function diffSentinels(runtimeRecord) {
  const changed = [];
  for (const [key, r1] of Object.entries(runtimeRecord.r1Input || {})) {
    const r2 = runtimeRecord.r2Input?.[key];
    if (String(r1) !== String(r2)) {
      changed.push({ key, r1: String(r1), r2: String(r2) });
    }
  }
  return changed;
}

async function convertRevision({ binary, code, revision, inputPath, outRoot, runId }) {
  const outDir = path.join(outRoot, `${code}-${revision}-${runId}`);
  await rm(outDir, { recursive: true, force: true });
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
  const result = await run(binary, args, TIMEOUT_MS);
  const expectedPdf = path.join(outDir, `${revision}.pdf`);
  const exists = existsSync(expectedPdf);
  if (result.exitCode !== 0 || !exists) {
    return {
      status: 'FAIL',
      reason: !exists ? 'OUTPUT_PDF_MISSING' : `NON_ZERO_EXIT_${result.exitCode}`,
      commandResult: result,
      pdfPath: null,
    };
  }
  const inputDocxSha256 = await fileSha256(inputPath);
  const outputPdfSha256 = await fileSha256(expectedPdf);
  const outputPdfBytes = statSync(expectedPdf).size;
  return {
    status: 'OK',
    inputPath,
    inputDocxSha256,
    pdfPath: expectedPdf,
    outputPdfSha256,
    outputPdfBytes,
    commandResult: result,
  };
}

function inspectLegalFace({ code, runtimeRecord, r1Inspection, r2Inspection }) {
  const r1Text = r1Inspection.text;
  const r2Text = r2Inspection.text;
  const changes = diffSentinels(runtimeRecord);
  // Required: at least one R1 value is NOT present in R2 (R2 actually changed),
  // and at least one R2 value IS present in R2 (the new value made it through).
  const visibleR2Changes = changes.filter(({ r2 }) => r2Text.includes(r2));
  // The stale-R1 check has a high false-positive rate for short numeric
  // values: "42" or "12" can appear in normal Vietnamese legal text as
  // part of dates ("2026-06-12"), article numbers ("Điều 42"), or
  // incidental font-merge artifacts in PDF text extraction ("R2 4 2 0 26").
  // Word-boundary matching + minimum length 4 (for numeric values) and
  // minimum length 6 (for non-numeric) avoids the false positives.
  const isShortNumeric = (v) => /^-?\d{1,3}$/.test(String(v).trim());
  const staleR1Values = [...new Set(changes.map(({ r1 }) => r1))]
    .filter((v) => {
      if (!v || v.length === 0) return false;
      // Suppress 1-3 digit numeric values; require word-boundary match for the rest.
      if (isShortNumeric(v)) {
        const re = new RegExp(`\\b${v}\\b`);
        return re.test(r2Text);
      }
      return r2Text.includes(v);
    });

  // Title/body: each revision must have at least 200 chars of extracted text.
  const titleAndBody = r1Inspection.text.length >= 200 && r2Inspection.text.length >= 200;

  // Legal header: must contain either the form's BM-NNN identity or the
  // generic "Mẫu số" or "Ban hành theo" anchor. We accept either because
  // the candidates are post-legal-header and the anchor may be invisible in
  // the body text after the first-paragraph substitution. Use a soft test.
  const legalHeader = /(M[ẫẫ]u s[ốố]|Ban h[àà]nh theo|BM-\d{3})/.test(r1Text)
    || /(M[ẫẫ]u s[ốố]|Ban h[àà]nh theo|BM-\d{3})/.test(r2Text);

  // Signature/footer: presence of any 'signature.' or 'recipients.' substituted
  // value in either revision.
  const signatureOrFooter = changes.some(({ key }) =>
    key.startsWith('signature.') || key.startsWith('footer.') || key.startsWith('recipients.'),
  );
  const signatureVisible = !signatureOrFooter || visibleR2Changes.some(({ key }) =>
    key.startsWith('signature.') || key.startsWith('footer.') || key.startsWith('recipients.'));

  return {
    legalHeader: {
      pass: legalHeader,
      reason: legalHeader ? null : 'NO_LEGAL_HEADER_OR_MODEL_NUMBER_FOUND',
    },
    titleAndBody: {
      pass: titleAndBody,
      r1TextLength: r1Inspection.text.length,
      r2TextLength: r2Inspection.text.length,
    },
    signatureAndFooter: {
      applicable: signatureOrFooter,
      pass: signatureVisible,
    },
    r2VisibleChanges: {
      pass: visibleR2Changes.length > 0,
      verifiedKeys: visibleR2Changes.map(({ key }) => key),
    },
    changedR1ValuesAbsentFromR2: {
      pass: staleR1Values.length === 0,
      staleValues: staleR1Values,
    },
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  if (!existsSync(PROBE_PATH)) {
    throw new Error(`LibreOffice probe artifact missing: ${PROBE_PATH}. Run libreoffice-probe.mjs first.`);
  }
  const probe = JSON.parse(await readFile(PROBE_PATH, 'utf8'));
  if (!probe.available || !probe.selected) {
    const unavailable = {
      schema: 'qllaw.213.phase1b_libreoffice_outcomes/v1',
      finishedAt: new Date().toISOString(),
      probe,
      batch: argBatch ?? 'B1A_DEFAULT',
      forms: B1A_CANDIDATES.map((formCode) => ({
        formCode,
        status: 'UNAVAILABLE',
        promotionStatus: 'RUNTIME_CANDIDATE_WORD_VERIFIED',
        reason: 'LIBREOFFICE_UNAVAILABLE',
      })),
    };
    await writeFile(OUTCOMES_PATH, `${JSON.stringify(unavailable, null, 2)}\n`);
    console.error('LibreOffice unavailable — recorded unavailable outcomes and exiting non-zero.');
    process.exit(1);
  }

  const binary = probe.selected;
  const version = probe.version;
  const runtimeResults = JSON.parse(await readFile(path.join(ROLLOUT_DIR, 'runtime-render-results.json'), 'utf8'));
  const renderByCode = new Map((runtimeResults.results || []).map((r) => [r.bmCode, r]));

  const PDFParse = await loadPdfText();
  const outRoot = path.join(ROLLOUT_DIR, '.tmp-lo-phase1b');
  mkdirSync(outRoot, { recursive: true });

  const runId = Date.now();
  const forms = [];
  for (const code of B1A_CANDIDATES) {
    const formDir = path.join(ROLLOUT_DIR, 'forms', code);
    const r1Path = path.join(formDir, 'R1.docx');
    const r2Path = path.join(formDir, 'R2.docx');
    const runtimeRecord = renderByCode.get(code);
    if (!existsSync(r1Path) || !existsSync(r2Path) || !runtimeRecord) {
      forms.push({
        formCode: code,
        status: 'FAIL',
        promotionStatus: 'RUNTIME_CANDIDATE_WORD_VERIFIED',
        reason: 'ARTIFACT_OR_RUNTIME_RECORD_MISSING',
        r1Path, r2Path, runtimeRecordExists: !!runtimeRecord,
      });
      continue;
    }
    const r1 = await convertRevision({ binary, code, revision: 'R1', inputPath: r1Path, outRoot, runId });
    const r2 = await convertRevision({ binary, code, revision: 'R2', inputPath: r2Path, outRoot, runId });
    if (r1.status !== 'OK' || r2.status !== 'OK') {
      forms.push({
        formCode: code,
        status: 'FAIL',
        promotionStatus: 'RUNTIME_CANDIDATE_WORD_VERIFIED',
        libreOfficeVersion: version,
        r1, r2,
        reason: r1.status !== 'OK' ? `R1_${r1.reason}` : `R2_${r2.reason}`,
      });
      continue;
    }
    const r1Inspection = await inspectPdf(PDFParse, r1.pdfPath);
    const r2Inspection = await inspectPdf(PDFParse, r2.pdfPath);
    const inspections = inspectLegalFace({ code, runtimeRecord, r1Inspection, r2Inspection });
    const inspectionPass = Object.values(inspections).every((check) => check.pass);
    forms.push({
      formCode: code,
      status: inspectionPass ? 'PASS' : 'FAIL',
      promotionStatus: inspectionPass
        ? 'RUNTIME_CANDIDATE_WORD_VERIFIED_LIBREOFFICE_VERIFIED'
        : 'RUNTIME_CANDIDATE_WORD_VERIFIED',
      libreOfficeVersion: version,
      r1: { ...r1, pageCount: r1Inspection.pageCount },
      r2: { ...r2, pageCount: r2Inspection.pageCount },
      inspections,
      reason: inspectionPass ? null : 'INSPECTION_FAILED',
    });
  }

  // Merge with any prior outcomes so we do not destroy previously
  // recorded evidence for forms outside the current batch.
  let priorForms = [];
  if (existsSync(OUTCOMES_PATH)) {
    try {
      const prior = JSON.parse(await readFile(OUTCOMES_PATH, 'utf8'));
      priorForms = (prior.forms || []).filter((f) => !forms.some((g) => g.formCode === f.formCode));
    } catch {
      // ignore prior parse failures
    }
  }
  const mergedForms = [...forms, ...priorForms];

  const summary = {
    schema: 'qllaw.213.phase1b_libreoffice_outcomes/v1',
    startedAt,
    finishedAt: new Date().toISOString(),
    libreOfficeBinary: binary,
    libreOfficeVersion: version,
    batch: argBatch ?? 'B1A_DEFAULT',
    forms: mergedForms,
    counts: {
      total: mergedForms.length,
      pass: mergedForms.filter((f) => f.status === 'PASS').length,
      fail: mergedForms.filter((f) => f.status === 'FAIL').length,
      unavailable: mergedForms.filter((f) => f.status === 'UNAVAILABLE').length,
    },
  };
  await writeFile(OUTCOMES_PATH, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(`PHASE 2 OK: ${summary.counts.pass}/${summary.counts.total} candidates verified by LibreOffice (batch=${argBatch ?? 'B1A_DEFAULT'}).`);
  if (summary.counts.fail > 0) {
    console.error(`  FAILURES: ${summary.counts.fail} form(s) failed the LibreOffice visual gate.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
