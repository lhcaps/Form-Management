/**
 * PR6G.1 — DOCX Parts Inspection: comment extractor.
 *
 * Reads `word/comments.xml` and returns one `DocxCommentEntry` per
 * comment. Comments share their structural shape with footnotes —
 * `<w:comments>` root, one `<w:comment>` child per comment, with
 * `w:id`, `w:author`, `w:date`, and `w:initials` attributes. Comments
 * are NEVER separator boilerplate (Word does not emit separators in
 * the comments part), so every `<w:comment>` is a real comment.
 *
 * @module docx-inspection/comment-extractor
 */

import type { DocxCommentEntry } from './docx-part-types';
import {
  extractIdAttribute,
  extractVisibleText,
  extractWordElements,
  normalizeWhitespace,
} from './docx-text-extractor';

const COMMENT_ATTR_RE = /<w:comment\b[^>]*>/u;
const W_AUTHOR_RE = /\bw:author="([^"]*)"/u;
const W_INITIALS_RE = /\bw:initials="([^"]*)"/u;
const W_DATE_RE = /\bw:date="([^"]*)"/u;

/** Parse `w:author`, `w:initials`, `w:date` from a `<w:comment …>` open tag. */
function readCommentMetadata(
  elementXml: string,
): Pick<DocxCommentEntry, 'author' | 'initials' | 'date'> {
  const meta: Pick<DocxCommentEntry, 'author' | 'initials' | 'date'> = {};
  const openTagMatch = COMMENT_ATTR_RE.exec(elementXml);
  if (!openTagMatch) return meta;
  const openTag = openTagMatch[0];
  const authorMatch = W_AUTHOR_RE.exec(openTag);
  if (authorMatch && authorMatch[1]) meta.author = authorMatch[1];
  const initialsMatch = W_INITIALS_RE.exec(openTag);
  if (initialsMatch && initialsMatch[1]) meta.initials = initialsMatch[1];
  const dateMatch = W_DATE_RE.exec(openTag);
  if (dateMatch && dateMatch[1]) meta.date = dateMatch[1];
  return meta;
}

/** Strip the `<w:comment …>` and `</w:comment>` tags, returning the inner body. */
function readCommentBody(elementXml: string): string {
  const openEnd = elementXml.indexOf('>') + 1;
  const closeStart = elementXml.lastIndexOf('</');
  if (openEnd <= 0 || closeStart < 0 || closeStart <= openEnd) return '';
  return elementXml.slice(openEnd, closeStart);
}

/**
 * Extract every comment from `word/comments.xml`. Empty / undefined
 * input returns an empty array. The audit harness distinguishes
 * "no comments part" from "empty comments part" via the part-list read.
 */
export function extractComments(
  commentsXml: string | undefined,
): DocxCommentEntry[] {
  if (!commentsXml) return [];
  const elements = extractWordElements(commentsXml, 'comment');
  const out: DocxCommentEntry[] = [];
  for (const elementXml of elements) {
    const id = extractIdAttribute(elementXml);
    if (id === null) continue;
    const bodyXml = readCommentBody(elementXml);
    const text = extractVisibleText(bodyXml);
    const meta = readCommentMetadata(elementXml);
    out.push({
      id,
      text,
      normalizedText: normalizeWhitespace(text),
      ...meta,
    });
  }
  return out;
}
