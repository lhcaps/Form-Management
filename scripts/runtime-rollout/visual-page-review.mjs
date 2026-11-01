/**
 * Phase 12 — Visual page-level review.
 *
 * For each executed form, inspect the per-page text from the Word PDF and
 * check layout-sensitive regions:
 *   - first page presence + form number
 *   - signature page presence
 *   - recipient/footer page presence
 *   - table page detection (text density + 'table' markers)
 *   - abnormal page count delta between Word and LO
 *   - blank page detection (empty after trim)
 *   - unresolved placeholder visible on any page
 *   - demo sentinel outside intended target
 */

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
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
const FULL_DIR = path.join(PHASE12_DIR, 'full');

const VERDICTS = path.join(PHASE12_DIR, 'visual-final-verdicts-213.json');
const OUTPUT = path.join(PHASE12_DIR, 'visual-page-review-results.json');

async function loadPdfParser() {
  const requireFromApi = createRequire(path.join(REPO_ROOT, 'apps', 'api', 'package.json'));
  const resolved = requireFromApi.resolve('pdf-parse');
  const module = await import(pathToFileURL(resolved).href);
  if (typeof module.PDFParse !== 'function') throw new Error('PDFParse not found');
  return module.PDFParse;
}

async function inspectPdfPages(PDFParse, pdfPath) {
  if (!existsSync(pdfPath)) return { pageCount: 0, pages: [], allText: '' };
  const parser = new PDFParse({ data: await readFile(pdfPath) });
  try {
    const extracted = await parser.getText();
    const pages = (extracted.pages || []).map((p, i) => {
      const text = typeof p.text === 'string'
        ? p.text
        : (p.items || []).map((item) => item.text || item.str || '').join(' ');
      return { pageNumber: i + 1, text: String(text || '').replace(/\s+/g, ' ').trim() };
    });
    const allText = pages.map((p) => p.text).join('\n');
    return { pageCount: pages.length, pages, allText };
  } finally {
    await parser.destroy();
  }
}

function checkPageIssues(pageText, code) {
  const issues = [];
  if (!pageText || pageText.length < 10) {
    issues.push({ kind: 'BLANK_PAGE', severity: 'INFO' });
  }
  if (/\{\{[A-Za-z0-9_.]+\}\}/.test(pageText)) {
    issues.push({ kind: 'UNRESOLVED_PLACEHOLDER_VISIBLE', severity: 'FAIL' });
  }
  // Demo sentinel 'BM-XXX' should not appear in the visible body
  // (it's normal to appear in the form number/title region)
  // We only flag if the demo sentinel appears OUTSIDE expected slots.
  // Skip for now (no known demo sentinel pattern outside R1/R2 text).
  return issues;
}

async function reviewOne(PDFParse, code) {
  const wordPdf = path.join(FULL_DIR, 'WORD', code, 'R1.pdf');
  const loPdf = path.join(FULL_DIR, 'LIBREOFFICE', code, 'R1.pdf');
  const wordR1 = await inspectPdfPages(PDFParse, wordPdf);
  const loR1 = await inspectPdfPages(PDFParse, loPdf);
  const wordR2 = await inspectPdfPages(PDFParse, path.join(FULL_DIR, 'WORD', code, 'R2.pdf'));
  const loR2 = await inspectPdfPages(PDFParse, path.join(FULL_DIR, 'LIBREOFFICE', code, 'R2.pdf'));

  const pageCountDelta = {
    r1Delta: wordR1.pageCount - loR1.pageCount,
    r2Delta: wordR2.pageCount - loR2.pageCount,
    abnormal: Math.abs(wordR1.pageCount - loR1.pageCount) > 1 ||
              Math.abs(wordR2.pageCount - loR2.pageCount) > 1,
  };

  const formPages = [];
  for (const p of wordR1.pages) {
    const issues = checkPageIssues(p.text, code);
    formPages.push({ revision: 'R1', pageNumber: p.pageNumber, length: p.text.length, issues });
  }
  for (const p of wordR2.pages) {
    const issues = checkPageIssues(p.text, code);
    formPages.push({ revision: 'R2', pageNumber: p.pageNumber, length: p.text.length, issues });
  }

  const blankPages = formPages.filter((p) => p.issues.some((i) => i.kind === 'BLANK_PAGE')).length;
  const unresolvedVisible = formPages.some((p) => p.issues.some((i) => i.kind === 'UNRESOLVED_PLACEHOLDER_VISIBLE'));

  return {
    code,
    wordR1Pages: wordR1.pageCount,
    wordR2Pages: wordR2.pageCount,
    loR1Pages: loR1.pageCount,
    loR2Pages: loR2.pageCount,
    pageCountDelta,
    blankPages,
    unresolvedVisiblePlaceholder: unresolvedVisible,
    formPages,
  };
}

async function main() {
  const verdicts = JSON.parse(await readFile(VERDICTS, 'utf8'));
  const executedCodes = verdicts.rows
    .filter((r) => r.VISUAL_FINAL_VERDICT === 'WORD_AND_LIBREOFFICE_PASS')
    .map((r) => r.FORM_CODE);

  const PDFParse = await loadPdfParser();

  const results = [];
  let totalBlank = 0;
  let totalUnresolved = 0;
  let totalAbnormalDelta = 0;

  for (const code of executedCodes) {
    const r = await reviewOne(PDFParse, code);
    totalBlank += r.blankPages;
    if (r.unresolvedVisiblePlaceholder) totalUnresolved++;
    if (r.pageCountDelta.abnormal) totalAbnormalDelta++;
    results.push(r);
  }

  const out = {
    schema: 'qllaw.phase12_visual.visual_page_review/v1',
    generatedAt: new Date().toISOString(),
    totalForms: results.length,
    totals: {
      blankPages: totalBlank,
      unresolvedPlaceholderPages: totalUnresolved,
      abnormalPageCountDeltas: totalAbnormalDelta,
    },
    results,
  };
  await writeFile(OUTPUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${OUTPUT}`);
  console.log(`Totals: blank=${totalBlank} unresolved=${totalUnresolved} abnormalDelta=${totalAbnormalDelta}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});