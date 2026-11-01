/**
 * PR6G.1 — DOCX Parts Inspection: package reader and public API.
 *
 * This is the SINGLE entry point that audit specs and the future
 * `bm-final-audit` harness (PR6G.2) consume. It opens a DOCX byte
 * buffer, walks the ZIP entries, dispatches to each per-part
 * extractor, and returns a frozen `DocxPackageInspection`.
 *
 * The reader is intentionally narrow:
 *   - It does NOT mutate the buffer (we never call `.generate()`).
 *   - It does NOT throw when optional parts are missing — those
 *     surface as empty arrays / `exists: false`.
 *   - It DOES throw when `word/document.xml` is missing, because that
 *     is a malformed-package failure that the caller cannot recover
 *     from (every other audit depends on the main body text).
 *
 * Why this is a separate module from `docx-format-auditor.ts`:
 *   - `docx-format-auditor.ts` already has a public function
 *     `extractOoxmlPartsFromDocx` that the legacy `docx-style-audit`
 *     service depends on. We do NOT want to change that function's
 *     shape (2 callers in `docx-style-audit.service.ts` and
 *     `docxtemplater-contract-render-engine.ts`). The new richer
 *     reader co-exists alongside it.
 *   - When PR6G.2 wants to consume footnotes/endnotes/comments from
 *     the same buffer it already pulls through
 *     `extractOoxmlPartsFromDocx`, it can call `inspectDocxPackage`
 *     and merge the results — both functions are pure.
 *
 * @module docx-inspection/docx-package-reader
 */

import PizZip from 'pizzip';

import { extractComments } from './comment-extractor';
import { extractEndnotes } from './endnote-extractor';
import { extractFootnotes } from './footnote-extractor';
import type {
  DocxHeaderFooterPart,
  DocxPackageInspection,
} from './docx-part-types';
import { extractFooters, extractHeaders } from './header-footer-extractor';
import { extractVisibleText, normalizeWhitespace } from './docx-text-extractor';

const DOCUMENT_RELS_PATH = 'word/_rels/document.xml.rels';
const DOCUMENT_XML_PATH = 'word/document.xml';
const FOOTNOTES_XML_PATH = 'word/footnotes.xml';
const ENDNOTES_XML_PATH = 'word/endnotes.xml';
const COMMENTS_XML_PATH = 'word/comments.xml';
const STYLES_XML_PATH = 'word/styles.xml';
const SETTINGS_XML_PATH = 'word/settings.xml';

/**
 * Read every Relationship element from `word/_rels/document.xml.rels`
 * (the document-level rels file). Returns an empty array when the file
 * is absent. We keep the raw element bodies because downstream
 * consumers (the header/footer rel index) only need to look at type,
 * target, and id.
 *
 * The regex deliberately accepts BOTH self-closing `<Relationship/>`
 * and pair `<Relationship>...</Relationship>` forms. The Type URL
 * contains `/` characters, so we cannot use a stricter `[^/>]` form.
 */
function readDocumentRelElements(zip: PizZip): ReadonlyArray<string> {
  const relsFile = zip.file(DOCUMENT_RELS_PATH);
  if (!relsFile) return [];
  const xml = relsFile.asText();
  const re = /<Relationship\b[^>]*\/?>/g;
  return xml.match(re) ?? [];
}

/**
 * Adapter that lets the header/footer extractor pull part text and
 * document rels from a PizZip without coupling it to the zip
 * implementation.
 */
function makePartReader(zip: PizZip, relElements: ReadonlyArray<string>) {
  return {
    readPartText(partName: string): string | undefined {
      const entry = zip.file(partName);
      if (!entry) return undefined;
      return entry.asText();
    },
    readDocumentRels(): ReadonlyArray<string> {
      return relElements;
    },
  };
}

/**
 * List every part name in the underlying DOCX zip, sorted
 * lexicographically. Sorted output keeps snapshots and audit artifacts
 * deterministic across runs.
 *
 * Filters out directory entries — PizZip's `Object.keys(zip.files)`
 * includes both files and directory entries (any key ending in `/`).
 * Audits operate on files only; directories are not interesting here.
 */
function listZipParts(zip: PizZip): ReadonlyArray<string> {
  return Object.keys(zip.files)
    .filter((name) => !name.endsWith('/'))
    .sort();
}

/**
 * Read `word/document.xml`, extracting visible text. Throws when the
 * part is missing — a DOCX without `word/document.xml` is not a DOCX.
 */
function readMainDocument(zip: PizZip): DocxPackageInspection['mainDocument'] {
  const entry = zip.file(DOCUMENT_XML_PATH);
  if (!entry) {
    throw new Error(
      `Malformed DOCX: ${DOCUMENT_XML_PATH} is missing from the archive.`,
    );
  }
  const xml = entry.asText();
  const text = extractVisibleText(xml);
  return {
    partName: DOCUMENT_XML_PATH,
    text,
    normalizedText: normalizeWhitespace(text),
    exists: true,
  };
}

/**
 * Inspect every relevant part of a DOCX byte buffer and return a
 * frozen, deterministic `DocxPackageInspection`.
 *
 * @param buffer  the raw bytes of a `.docx` file (zip archive).
 * @param options optional `{ sourceBytes?: number }` for diagnostic
 *                logging — defaults to `buffer.byteLength`.
 */
export function inspectDocxPackage(
  buffer: Buffer,
  options: { sourceBytes?: number } = {},
): DocxPackageInspection {
  const zip = new PizZip(buffer);

  const mainDocument = readMainDocument(zip);
  const footnotesXml = zip.file(FOOTNOTES_XML_PATH)?.asText();
  const endnotesXml = zip.file(ENDNOTES_XML_PATH)?.asText();
  const commentsXml = zip.file(COMMENTS_XML_PATH)?.asText();
  const stylesExists = zip.file(STYLES_XML_PATH) !== null;
  const settingsExists = zip.file(SETTINGS_XML_PATH) !== null;
  const relElements = readDocumentRelElements(zip);
  const partReader = makePartReader(zip, relElements);

  const headers: ReadonlyArray<DocxHeaderFooterPart> =
    extractHeaders(partReader);
  const footers: ReadonlyArray<DocxHeaderFooterPart> =
    extractFooters(partReader);

  const inspection: DocxPackageInspection = {
    schemaVersion: '1',
    sourceBytes: options.sourceBytes ?? buffer.byteLength,
    partList: listZipParts(zip),
    mainDocument,
    headers,
    footers,
    footnotes: extractFootnotes(footnotesXml),
    endnotes: extractEndnotes(endnotesXml),
    comments: extractComments(commentsXml),
    styles: { partName: STYLES_XML_PATH, exists: stylesExists },
    settings: { partName: SETTINGS_XML_PATH, exists: settingsExists },
    relationships: relElements,
  };

  // Freeze every nested array so downstream consumers can rely on
  // referential equality (handy for memoising audit results).
  // The Object.freeze calls below return Readonly<T> which widens the
  // inner element type to `unknown`; we restore the precise types
  // with explicit annotations on each property.
  const frozen: DocxPackageInspection = Object.freeze({
    ...inspection,
    partList: Object.freeze([...inspection.partList]) as ReadonlyArray<string>,
    headers: Object.freeze(
      inspection.headers.map(Object.freeze),
    ) as ReadonlyArray<DocxHeaderFooterPart>,
    footers: Object.freeze(
      inspection.footers.map(Object.freeze),
    ) as ReadonlyArray<DocxHeaderFooterPart>,
    footnotes: Object.freeze(
      inspection.footnotes.map(Object.freeze),
    ) as ReadonlyArray<DocxPackageInspection['footnotes'][number]>,
    endnotes: Object.freeze(
      inspection.endnotes.map(Object.freeze),
    ) as ReadonlyArray<DocxPackageInspection['endnotes'][number]>,
    comments: Object.freeze(
      inspection.comments.map(Object.freeze),
    ) as ReadonlyArray<DocxPackageInspection['comments'][number]>,
    relationships: Object.freeze([...inspection.relationships]),
  });
  return frozen;
}

/**
 * Convenience: read `word/footnotes.xml` from a DOCX buffer without
 * touching any other part. Faster than `inspectDocxPackage` when the
 * caller only needs footnote data (used by the BM-001 footnote
 * preservation spec).
 */
export function readFootnotesFromDocx(buffer: Buffer): string | undefined {
  const zip = new PizZip(buffer);
  return zip.file(FOOTNOTES_XML_PATH)?.asText();
}

/**
 * Convenience: read `word/endnotes.xml` from a DOCX buffer.
 */
export function readEndnotesFromDocx(buffer: Buffer): string | undefined {
  const zip = new PizZip(buffer);
  return zip.file(ENDNOTES_XML_PATH)?.asText();
}
