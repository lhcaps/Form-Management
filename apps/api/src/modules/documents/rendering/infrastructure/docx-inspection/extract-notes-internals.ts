/**
 * PR6G.1 — DOCX Parts Inspection: shared internals for footnote and
 * endnote extraction.
 *
 * Footnotes and endnotes have identical OOXML structure; only the
 * element name differs (`footnote` vs `endnote`, root
 * `footnotes` vs `endnotes`). This file holds the once-written
 * parsing logic so the two public entry points
 * (`./docx-inspection-footnote-extractor.ts`,
 * `./docx-inspection-endnote-extractor.ts`) stay tiny.
 *
 * NOT exported from the package surface — only the two named
 * extractors above re-export `extractNotes` indirectly through their
 * public functions.
 *
 * @module docx-inspection/extract-notes-internals
 */

import type { DocxFootnoteEntry } from './docx-part-types';
import { extractFirstRunStyleHint } from './docx-style-run-reader';
import {
  extractIdAttribute,
  extractTypeAttribute,
  extractVisibleText,
  extractWordElements,
  normalizeWhitespace,
} from './docx-text-extractor';

/** Footnote vs endnote discriminator. */
export type NoteKind = 'footnote' | 'endnote';

/**
 * Filter out separator / continuationSeparator boilerplate. Real
 * notes either omit `w:type` or carry a custom type (e.g. "user").
 * Word ALWAYS emits two separator entries with `w:id="-1"` and
 * `w:id="0"`; we treat either signal as a separator.
 */
function isSeparatorNote(elementXml: string): boolean {
  const type = extractTypeAttribute(elementXml);
  if (type === 'separator' || type === 'continuationSeparator') return true;
  const id = extractIdAttribute(elementXml);
  if (id === '-1' || id === '0') return true;
  return false;
}

/** Strip the opening and closing `<w:note …>` / `</w:note>` tags. */
function readNoteBody(elementXml: string): string {
  const openEnd = elementXml.indexOf('>') + 1;
  const closeStart = elementXml.lastIndexOf('</');
  if (openEnd <= 0 || closeStart < 0 || closeStart <= openEnd) return '';
  return elementXml.slice(openEnd, closeStart);
}

/**
 * Build the public `DocxFootnoteEntry` shape for one note.
 * Returns `null` when the element has no `w:id` (malformed OOXML).
 */
function buildEntry(
  elementXml: string,
  markerIndex: number,
): DocxFootnoteEntry | null {
  const id = extractIdAttribute(elementXml);
  if (id === null) return null;
  const bodyXml = readNoteBody(elementXml);
  const text = extractVisibleText(bodyXml);
  const normalizedText = normalizeWhitespace(text);
  const runStyleHints = extractFirstRunStyleHint(bodyXml);
  return {
    id,
    marker: String(markerIndex),
    text,
    normalizedText,
    runStyleHints,
  };
}

/**
 * Internal extractor shared by footnotes and endnotes. Counts real
 * notes in source order, starting marker at 1 (matching Word's
 * user-visible numbering for the standard case).
 */
export function extractNotes(
  notesXml: string | undefined,
  kind: NoteKind,
): DocxFootnoteEntry[] {
  if (!notesXml) return [];
  const elements = extractWordElements(notesXml, kind);
  const out: DocxFootnoteEntry[] = [];
  let marker = 0;
  for (const elementXml of elements) {
    if (isSeparatorNote(elementXml)) continue;
    marker += 1;
    const entry = buildEntry(elementXml, marker);
    if (entry !== null) out.push(entry);
  }
  return out;
}
