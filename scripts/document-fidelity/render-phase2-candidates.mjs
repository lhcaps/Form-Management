import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PDFParse } from '../../apps/api/node_modules/pdf-parse/dist/pdf-parse/esm/index.js';
import { readDocxParts } from './lib/docx-zip.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const SOFFICE = process.env.LIBREOFFICE_PATH ?? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
const CODES = [
  'BM-001', 'BM-136', 'BM-148', 'BM-156', 'BM-157', 'BM-168',
  'BM-171', 'BM-174', 'BM-181', 'BM-206', 'BM-213',
];
const OUT_ROOT = join(ROOT, '.tmp-document-fidelity-fix', 'candidate-render');
const MODEL_NUMBERS = Object.fromEntries(CODES.map((code) => [code, code === 'BM-001' ? 'Mẫu số 01/HS' : `Mẫu số ${code.slice(3)}`]));
const MANDATORY_TEXT = [
  'VIỆN KIỂM SÁT',
  'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
  'Độc lập - Tự do - Hạnh phúc',
];

function docxText(buffer) {
  const { parts } = readDocxParts(buffer);
  return parts
    .filter((part) => /^word\/(document|header\d*|footer\d*)\.xml$/u.test(part.name))
    .map((part) => (part.xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []).map((m) => m.replace(/<[^>]+>/g, '')).join(''))
    .join('');
}

function convertWithLibreOffice(code, docxPath, outDir) {
  mkdirSync(outDir, { recursive: true });
  const profilePath = join(OUT_ROOT, 'lo-profiles', code).replaceAll('\\', '/');
  const result = spawnSync(
    SOFFICE,
    [
      `-env:UserInstallation=${pathToFileURL(profilePath).href}`,
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      outDir,
      docxPath,
    ],
    { encoding: 'utf8', timeout: 120_000 },
  );
  const pdfPath = join(outDir, `${basename(docxPath, '.docx')}.pdf`);
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? '',
    pdfPath,
    pdfExists: existsSync(pdfPath),
  };
}

async function inspectPdf(pdfPath) {
  const parser = new PDFParse({ data: readFileSync(pdfPath) });
  try {
    const parsed = await parser.getText();
    return {
      text: parsed.text ?? '',
      pageCount: Array.isArray(parsed.pages) ? parsed.pages.length : 0,
    };
  } finally {
    await parser.destroy();
  }
}

mkdirSync(OUT_ROOT, { recursive: true });
const records = [];
for (const code of CODES) {
  const candidatePath = join(ROOT, '.tmp-document-fidelity-fix', code, `${code}_normalized.candidate.docx`);
  const outDir = join(OUT_ROOT, code, 'libreoffice');
  const conversion = convertWithLibreOffice(code, candidatePath, outDir);
  const record = { code, candidatePath: relative(ROOT, candidatePath).replaceAll('\\', '/'), conversion };
  if (!conversion.pdfExists) {
    records.push({ ...record, verdict: 'CANDIDATE_VISUAL_BLOCKED_P0', failures: ['PDF_NOT_CREATED'] });
    continue;
  }

  try {
    const inspected = await inspectPdf(conversion.pdfPath);
    const sourceText = docxText(readFileSync(candidatePath));
    const required = [MODEL_NUMBERS[code], ...MANDATORY_TEXT.filter((token) => sourceText.includes(token))];
    const missingTokens = required.filter((token) => !inspected.text.includes(token));
    const sourceMissing = MANDATORY_TEXT.filter((token) => !sourceText.includes(token));
    const baseRecord = {
      code,
      candidatePath: relative(ROOT, candidatePath).replaceAll('\\', '/'),
      conversion,
      pdfPath: relative(ROOT, conversion.pdfPath).replaceAll('\\', '/'),
      pageCount: inspected.pageCount,
      extractedTextLength: inspected.text.length,
      requiredTokens: required,
      missingTokens,
      sourceAbsentTokens: sourceMissing,
    };
    if (missingTokens.length === 0 && inspected.pageCount > 0) {
      records.push({ ...baseRecord, verdict: 'CANDIDATE_VISUAL_PASS' });
    } else if (missingTokens.length > 0 && missingTokens.every((token) => sourceMissing.includes(token))) {
      records.push({ ...baseRecord, verdict: 'CANDIDATE_VISUAL_PASS_WITH_P2', note: 'Token absent from authoritative source; omitted from PDF by structural design.' });
    } else {
      records.push({ ...baseRecord, verdict: 'CANDIDATE_VISUAL_BLOCKED_P1' });
    }
  } catch (error) {
    records.push({
      code,
      candidatePath: relative(ROOT, candidatePath).replaceAll('\\', '/'),
      conversion,
      verdict: 'CANDIDATE_VISUAL_BLOCKED_P0',
      failures: [error instanceof Error ? error.message : String(error)],
    });
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  sofficePath: SOFFICE,
  records,
  passCount: records.filter((record) => record.verdict === 'CANDIDATE_VISUAL_PASS').length,
  blockedCount: records.filter((record) => record.verdict !== 'CANDIDATE_VISUAL_PASS').length,
};
const outputPath = join(OUT_ROOT, 'candidate-render-results.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify({
  outputPath: relative(ROOT, outputPath).replaceAll('\\', '/'),
  passCount: output.passCount,
  blockedCount: output.blockedCount,
  verdicts: Object.fromEntries(records.map((record) => [record.code, record.verdict])),
}, null, 2));
process.exitCode = output.blockedCount === 0 ? 0 : 1;
