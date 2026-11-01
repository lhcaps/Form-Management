// PR7A.2 — DOCX body layout inspector
// Walks the rendered and source word/document.xml, finds:
//  1. Empty paragraphs (no <w:r>) and paragraphs with only whitespace
//  2. The structural anchors: "QUYẾT ĐỊNH", "TRẢ LẠI TÀI SẢN", "Nơi nhận", "Lưu:", notes "12" and "13"
//  3. Page-break / lastRenderedPageBreak markers
//  4. Page setup
//
// Dumps both reports as JSON so the triage doc can quote exact counts.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd(), '..', '..');
const SOURCE_XML_PATH = resolve(
  REPO_ROOT,
  'docs',
  'audit',
  'unified-bm-workspace',
  '_pr7a2-triage',
  'source-document.xml',
);
const RENDERED_XML_PATH = resolve(
  REPO_ROOT,
  'docs',
  'audit',
  'unified-bm-workspace',
  '_pr7a2-triage',
  'rendered-document.xml',
);

function analyze(label, xmlPath) {
  const xml = readFileSync(xmlPath, 'utf8');
  const paraMatches = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];
  const paragraphs = paraMatches.map((p, idx) => {
    const hasRun = /<w:r\b/.test(p);
    const textMatches = [...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]);
    const text = textMatches.join('');
    return { idx, hasRun, text };
  });
  const emptyOrBlank = paragraphs.filter((p) => !p.hasRun || p.text.trim() === '');
  const anchor = (needle) => paragraphs.find((p) => p.text.includes(needle));

  return {
    label,
    filePath: xmlPath,
    xmlByteLength: xml.length,
    paragraphCount: paragraphs.length,
    emptyParagraphCount: emptyOrBlank.length,
    paragraphSample: paragraphs.slice(0, 50).map((p) => ({
      idx: p.idx,
      hasRun: p.hasRun,
      textPreview: p.text.slice(0, 80),
    })),
    emptyParagraphIndices: emptyOrBlank.slice(0, 60).map((p) => p.idx),
    anchors: {
      quyetDinh: anchor('QUYẾT ĐỊNH')?.idx ?? null,
      traLaiTaiSan: anchor('TRẢ LẠI TÀI SẢN')?.idx ?? null,
      noiNhan: anchor('Nơi nhận')?.idx ?? null,
      luu: anchor('Lưu:')?.idx ?? null,
      note12: anchor('12')?.idx ?? null,
      note13: anchor('13')?.idx ?? null,
    },
    pageBreaks: {
      explicitBrPageType: (xml.match(/<w:br w:type="page"\s*\/>/g) ?? []).length,
      lastRenderedPageBreak: (xml.match(/<w:lastRenderedPageBreak\/>/g) ?? []).length,
      pageBreakBefore: (xml.match(/<w:pageBreakBefore\s*\/>/g) ?? []).length,
    },
    pageSetupMatch: xml.match(/<w:pgSz[^>]*\/>/)?.[0] ?? null,
    pageMarginMatch: xml.match(/<w:pgMar[^>]*\/>/)?.[0] ?? null,
    documentBody: paragraphs
      .filter((p) => p.hasRun && p.text.trim() !== '')
      .slice(0, 80)
      .map((p) => ({ idx: p.idx, text: p.text.slice(0, 100) })),
  };
}

const sourceReport = analyze('SOURCE_NORMALIZED', SOURCE_XML_PATH);
const renderedReport = analyze('RENDERED_CANONICAL', RENDERED_XML_PATH);

const outDir = resolve(
  REPO_ROOT,
  'docs',
  'audit',
  'unified-bm-workspace',
  '_pr7a2-triage',
);
writeFileSync(
  resolve(outDir, 'source-body-layout.json'),
  `${JSON.stringify(sourceReport, null, 2)}\n`,
);
writeFileSync(
  resolve(outDir, 'rendered-body-layout.json'),
  `${JSON.stringify(renderedReport, null, 2)}\n`,
);

console.log('SOURCE:');
console.log('  paragraphs:', sourceReport.paragraphCount);
console.log('  empty/blank paragraphs:', sourceReport.emptyParagraphCount);
console.log('  anchors:', sourceReport.anchors);
console.log('  page breaks:', sourceReport.pageBreaks);
console.log('  pgSz:', sourceReport.pageSetupMatch);
console.log('  pgMar:', sourceReport.pageMarginMatch);
console.log('');
console.log('RENDERED:');
console.log('  paragraphs:', renderedReport.paragraphCount);
console.log('  empty/blank paragraphs:', renderedReport.emptyParagraphCount);
console.log('  anchors:', renderedReport.anchors);
console.log('  page breaks:', renderedReport.pageBreaks);
console.log('  pgSz:', renderedReport.pageSetupMatch);
console.log('  pgMar:', renderedReport.pageMarginMatch);
console.log('');
console.log('first 30 source non-empty paragraphs:');
sourceReport.documentBody.slice(0, 30).forEach((p) =>
  console.log(`  [${p.idx}] ${p.text}`),
);
console.log('');
console.log('first 30 rendered non-empty paragraphs:');
renderedReport.documentBody.slice(0, 30).forEach((p) =>
  console.log(`  [${p.idx}] ${p.text}`),
);