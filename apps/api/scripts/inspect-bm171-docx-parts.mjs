#!/usr/bin/env node
/**
 * PR7A.2 — BM-171 DOCX parts + layout triage helper.
 *
 * Runs PR6G.1 inspectDocxPackage on both the normalized source DOCX
 * and the latest rendered DOCX, dumps the per-part state, and prints
 * the visible-text tail so we can decide whether notes "12" / "13"
 * are real footnotes/endnotes, instruction notes in the body, footers,
 * comments, or text-box content.
 *
 * Read-only. No mutation of locked contracts or templates.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import PizZip from 'pizzip';

import { inspectDocxPackage } from '../src/modules/documents/rendering/infrastructure/docx-inspection/docx-package-reader';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const SOURCE_DOCX = resolve(
  REPO_ROOT,
  'storage',
  'templates',
  'normalized-docx',
  'BM-171',
  'BM-171_normalized.docx',
);
const RENDERED_DOCX = resolve(
  REPO_ROOT,
  'docs',
  'audit',
  'bm-visual-signoff',
  'BM-171',
  'rendered.latest.docx',
);
const OUT_DIR = resolve(
  REPO_ROOT,
  'docs',
  'audit',
  'unified-bm-workspace',
  '_pr7a2-triage',
);

mkdirSync(OUT_DIR, { recursive: true });

function inspect(label, docxPath) {
  const buffer = readFileSync(docxPath);
  const inspection = inspectDocxPackage(buffer);
  const partsReport = {
    label,
    docxPath,
    byteLength: buffer.byteLength,
    partList: inspection.partList,
    mainDocument: {
      partName: inspection.mainDocument.partName,
      textLength: inspection.mainDocument.text.length,
      normalizedTextLength: inspection.mainDocument.normalizedText.length,
      tailText: inspection.mainDocument.normalizedText.slice(-1200),
    },
    headers: inspection.headers.map((h) => ({ partName: h.partName, textLength: h.text.length })),
    footers: inspection.footers.map((f) => ({ partName: f.partName, textLength: f.text.length })),
    footnotes: inspection.footnotes,
    endnotes: inspection.endnotes,
    comments: inspection.comments,
    stylesExists: inspection.styles.exists,
    settingsExists: inspection.settings.exists,
    relationshipCount: inspection.relationships.length,
  };
  return partsReport;
}

const sourceReport = inspect('SOURCE_NORMALIZED', SOURCE_DOCX);
const renderedReport = inspect('RENDERED_CANONICAL', RENDERED_DOCX);

writeFileSync(
  resolve(OUT_DIR, 'source-docx-parts.json'),
  `${JSON.stringify(sourceReport, null, 2)}\n`,
);
writeFileSync(
  resolve(OUT_DIR, 'rendered-docx-parts.json'),
  `${JSON.stringify(renderedReport, null, 2)}\n`,
);

// Also extract raw document.xml from each for diffability.
function rawDocXml(docxPath) {
  const zip = new PizZip(readFileSync(docxPath));
  return zip.file('word/document.xml')?.asText() ?? null;
}

const sourceDocXml = rawDocXml(SOURCE_DOCX);
const renderedDocXml = rawDocXml(RENDERED_DOCX);

if (sourceDocXml) {
  writeFileSync(resolve(OUT_DIR, 'source-document.xml'), sourceDocXml);
}
if (renderedDocXml) {
  writeFileSync(resolve(OUT_DIR, 'rendered-document.xml'), renderedDocXml);
}

// Quick sanity echo
console.log('[INFO] SOURCE byteLength:', sourceReport.byteLength);
console.log('[INFO] SOURCE parts:', sourceReport.partList.length);
console.log('[INFO] SOURCE footnotes:', sourceReport.footnotes.length);
console.log('[INFO] SOURCE endnotes:', sourceReport.endnotes.length);
console.log('[INFO] SOURCE headers:', sourceReport.headers.length);
console.log('[INFO] SOURCE footers:', sourceReport.footers.length);
console.log('[INFO] SOURCE comments:', sourceReport.comments.length);
console.log('[INFO] SOURCE tail (last 600 chars):');
console.log(sourceReport.mainDocument.tailText.slice(-600));
console.log('---');
console.log('[INFO] RENDERED byteLength:', renderedReport.byteLength);
console.log('[INFO] RENDERED parts:', renderedReport.partList.length);
console.log('[INFO] RENDERED footnotes:', renderedReport.footnotes.length);
console.log('[INFO] RENDERED endnotes:', renderedReport.endnotes.length);
console.log('[INFO] RENDERED headers:', renderedReport.headers.length);
console.log('[INFO] RENDERED footers:', renderedReport.footers.length);
console.log('[INFO] RENDERED comments:', renderedReport.comments.length);
console.log('[INFO] RENDERED tail (last 600 chars):');
console.log(renderedReport.mainDocument.tailText.slice(-600));