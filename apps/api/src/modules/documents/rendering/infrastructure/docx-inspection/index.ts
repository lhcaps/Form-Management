/**
 * PR6G.1 — DOCX Parts Inspection: public API barrel.
 *
 * Callers (the future `bm-final-audit` harness in PR6G.2, the BM-001
 * footnote preservation spec, etc.) should import from this file
 * rather than the individual extractor modules. Centralising the
 * export surface lets us refactor internals without touching every
 * downstream spec.
 *
 * Public surface:
 *   - Types: `DocxPackageInspection`, `DocxFootnoteEntry`,
 *     `DocxCommentEntry`, `DocxHeaderFooterPart`,
 *     `DocxMainDocumentSection`, `DocxRunStyleHint`.
 *   - Functions: `inspectDocxPackage`,
 *     `readFootnotesFromDocx`, `readEndnotesFromDocx`,
 *     `extractFootnotes`, `extractEndnotes`, `extractComments`,
 *     `extractHeaders`, `extractFooters`,
 *     `extractVisibleText`, `normalizeWhitespace`.
 *
 * @module docx-inspection
 */

export type {
  DocxPackageInspection,
  DocxFootnoteEntry,
  DocxCommentEntry,
  DocxHeaderFooterPart,
  DocxMainDocumentSection,
  DocxRunStyleHint,
} from './docx-part-types';

export {
  inspectDocxPackage,
  readFootnotesFromDocx,
  readEndnotesFromDocx,
} from './docx-package-reader';

export { extractFootnotes } from './footnote-extractor';
export { extractEndnotes } from './endnote-extractor';
export { extractComments } from './comment-extractor';
export {
  extractHeaders,
  extractFooters,
  MAX_HEADER_FOOTER_PARTS,
} from './header-footer-extractor';

export {
  extractVisibleText,
  normalizeWhitespace,
  decodeXmlEntities,
  extractWordElements,
  extractVisibleRuns,
  extractIdAttribute,
  extractTypeAttribute,
} from './docx-text-extractor';
