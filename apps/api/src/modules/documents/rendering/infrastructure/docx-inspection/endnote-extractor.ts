/**
 * PR6G.1 — DOCX Parts Inspection: endnote extractor.
 *
 * Reads `word/endnotes.xml` and returns one `DocxFootnoteEntry` per
 * real endnote (separator / continuationSeparator entries are
 * filtered out). The shared parsing logic lives in
 * `./extract-notes-internals.ts` so we do not duplicate the marker
 * counting / style-hint / ID extraction.
 *
 * @module docx-inspection/endnote-extractor
 */

import type { DocxFootnoteEntry } from './docx-part-types';
import { extractNotes } from './extract-notes-internals';

/**
 * Extract every real endnote from `word/endnotes.xml`. Empty /
 * undefined input returns an empty array; the audit harness reports
 * `endnotes: NOT_APPLICABLE` when the part file is also absent.
 */
export function extractEndnotes(
  endnotesXml: string | undefined,
): DocxFootnoteEntry[] {
  return extractNotes(endnotesXml, 'endnote');
}
