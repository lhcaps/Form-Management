/**
 * PR6G.1 — DOCX Parts Inspection: footnote extractor.
 *
 * Reads `word/footnotes.xml` and returns one `DocxFootnoteEntry` per
 * real footnote (separator / continuationSeparator entries are
 * filtered out).
 *
 * Footnotes vs endnotes share the SAME structural shape — they only
 * differ in the root/child element name (`footnotes`/`footnote` vs
 * `endnotes`/`endnote`). The shared low-level parsing lives in this
 * file (footnotes) and is re-used by `./endnote-extractor.ts` via the
 * private `extractNotes(kind, …)` helper.
 *
 * @module docx-inspection/footnote-extractor
 */

import type { DocxFootnoteEntry } from './docx-part-types';
import { extractNotes } from './extract-notes-internals';

/**
 * Extract every real footnote from `word/footnotes.xml`.
 *
 * Empty / undefined input returns an empty array. The audit harness
 * distinguishes "no footnotes part" (part absent) from "empty
 * footnotes part" by inspecting the part list separately.
 */
export function extractFootnotes(
  footnotesXml: string | undefined,
): DocxFootnoteEntry[] {
  return extractNotes(footnotesXml, 'footnote');
}
