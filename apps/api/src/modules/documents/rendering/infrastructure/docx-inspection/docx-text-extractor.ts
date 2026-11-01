/**
 * PR6G.1 — DOCX Parts Inspection: low-level XML→text primitives.
 *
 * Every extractor in this directory (`footnote-extractor`,
 * `header-footer-extractor`, etc.) calls `extractVisibleText` /
 * `extractWordElements` here. Centralising the regexes means:
 *   - Vietnamese diacritics behave identically across every part.
 *   - Whitespace rules are consistent: tabs become `\t`, line breaks
 *     become `\n`, intervening runs are separated by a single space
 *     only when no structural break exists between them.
 *   - A change in extraction rules (e.g. we need to honour `<w:noBreakHyphen/>`)
 *     is one edit instead of N.
 *
 * This module is deliberately DOM-free. The project already uses
 * `@xmldom/xmldom` in places, but DOCX text extraction is small enough
 * that a regex pass over the part is faster, has no namespace-decl
 * surprises, and produces deterministic output even when the source
 * part is slightly malformed (which real-world DOCX templates often
 * are).
 *
 * What this module does NOT do:
 *   - It does NOT open the ZIP. The reader (`docx-package-reader.ts`)
 *     does that.
 *   - It does NOT decide which `<w:t>` runs are "visible". Visibility
 *     is decided at the extractor's call site (e.g. a footnote
 *     extractor filters out separator entries before calling here).
 *
 * @module docx-inspection/docx-text-extractor
 */

/**
 * Decode the standard OOXML XML entities into their literal characters.
 *
 * Word always emits `<`, `>`, `&`, `"`, `'` as entities inside `<w:t>`.
 * We do NOT touch numeric character references or HTML entities beyond
 * the five above — DOCX never emits them inside visible text.
 */
export function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Concatenate every `<w:t …>…</w:t>` text node in the given XML, in
 * document order, with tabs and line breaks inserted when the matching
 * structural elements appear BETWEEN the text nodes.
 *
 * Rules:
 *   - `<w:t>…</w:t>` → its inner text (XML-decoded).
 *   - `<w:tab/>`, `<w:tab …/>` → single `\t` character.
 *   - `<w:br/>`, `<w:br …/>`, `<w:cr/>` → single `\n` character.
 *   - When the regex walker crosses non-text, non-break elements, the
 *     next `<w:t>` run is separated by a SINGLE space IF the gap was
 *     whitespace-only. This is what users see when Word renders
 *     "Hello<w:r>…</w:t>" adjacent to "<w:t>world</w:t>".
 *   - Adjacent `<w:t>` runs that share the same parent paragraph
 *     produce a joined text WITHOUT a separator (Word treats them as
 *     one run). We mirror that.
 *
 * The output preserves Vietnamese diacritics byte-for-byte; we never
 * NFKD-normalize or strip combining marks.
 */
export function extractVisibleText(xml: string): string {
  if (!xml) return '';
  // A single pass over the XML, walking either <w:t>…</w:t> blocks or
  // the inline break tags. We use a combined regex with alternation.
  // Capturing groups: 1 = w:t inner, 2 = w:tab marker, 3 = w:br/w:cr marker.
  const combined =
    /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^/>]*\/>|<w:tab\s*\/+>|<w:br\b[^/>]*\/>|<w:br\s*\/+>|<w:cr\b[^/>]*\/>|<w:cr\s*\/+>/g;
  let out = '';
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = combined.exec(xml)) !== null) {
    // Detect whitespace-only gap between last output and this match.
    // If the gap is non-empty and contains only whitespace, insert ONE
    // space; otherwise insert nothing (so paragraph / run breaks are
    // explicit `<w:br/>` markers, not implicit spaces).
    const gap = xml.slice(lastIndex, m.index);
    if (gap.length > 0) {
      if (/^[\s]+$/u.test(gap)) {
        // Avoid leading spaces before the very first token.
        if (out.length > 0 && !out.endsWith('\n') && !out.endsWith('\t')) {
          out += ' ';
        }
      }
    }
    if (m[1] !== undefined) {
      out += decodeXmlEntities(m[1]);
    } else if (m[2] !== undefined) {
      out += '\t';
    } else if (m[3] !== undefined) {
      out += '\n';
    }
    lastIndex = m.index + m[0].length;
  }
  return out;
}

/**
 * Normalize visible text for assertion comparisons.
 *
 * Rules:
 *   - Collapse every run of whitespace (incl. tabs/newlines) to a single
 *     space, EXCEPT that a single newline is preserved as-is so the
 *     caller can distinguish paragraph boundaries.
 *   - Trim leading/trailing whitespace.
 *   - Keep all other characters (Vietnamese diacritics, numbers,
 *     punctuation) unchanged.
 *
 * The output is what BM-001 footnote/content assertions compare
 * against expected phrases. If a future PR needs a stricter NFKD form
 * or lower-case folding, expose them as separate helpers so the
 * default behaviour stays simple and easy to reason about.
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return '';
  return (
    text
      // 1. Collapse runs of spaces/tabs to a single space, but leave a
      //    single \n intact (so paragraph breaks remain visible).
      .replace(/[ \t]+/g, ' ')
      // 2. Collapse runs of newlines to a single newline.
      .replace(/\n[ \t\n]*/g, '\n')
      .trim()
  );
}

/**
 * Extract every occurrence of `<w:tagName …>…</w:tagName>` from the
 * given XML, returning the raw inner strings (no attribute parsing).
 *
 * Use this when an extractor needs the entire element body to scan
 * for nested runs (e.g. a footnote extractor reading `<w:footnote>`
 * paragraphs). For text-only inspection use `extractVisibleText` —
 * it is faster and emits canonical whitespace.
 */
export function extractWordElements(xml: string, tagName: string): string[] {
  if (!xml) return [];
  const re = new RegExp(`<w:${tagName}\\b[\\s\\S]*?<\\/w:${tagName}>`, 'g');
  return xml.match(re) ?? [];
}

/**
 * Extract every `<w:r …>…</w:r>` run whose inner text is non-empty.
 *
 * This is the building block the footnote extractor uses to compute
 * `runStyleHints`. Returns the raw run XML so the caller can run
 * `extractVisibleText` and `extractRunStyleHint` on it independently.
 */
export function extractVisibleRuns(xml: string): string[] {
  const runs = extractWordElements(xml, 'r');
  return runs.filter((runXml) => extractVisibleText(runXml).length > 0);
}

/**
 * Look up the `w:id` attribute on a `<w:footnote …>` / `<w:endnote …>` /
 * `<w:comment …>` opening tag.
 *
 * Returns the raw string value (could be "-1" for separators). Never
 * returns `undefined` for a well-formed match; returns `null` only when
 * the element has no `w:id` attribute, which would be malformed OOXML.
 */
export function extractIdAttribute(elementXml: string): string | null {
  const m = /<w:(?:footnote|endnote|comment)\b[^>]*\bw:id="([^"]+)"/u.exec(
    elementXml,
  );
  return m ? (m[1] ?? null) : null;
}

/**
 * Look up the `w:type` attribute on a `<w:footnote …>` / `<w:endnote …>`
 * opening tag. Returns the raw value (e.g. `"separator"`,
 * `"continuationSeparator"`) or `null` when no type is declared.
 */
export function extractTypeAttribute(elementXml: string): string | null {
  const m = /<w:(?:footnote|endnote)\b[^>]*\bw:type="([^"]+)"/u.exec(
    elementXml,
  );
  return m ? (m[1] ?? null) : null;
}

// Re-export for module ergonomics so callers can do
// `import { textUtils } from './docx-text-extractor'`.
export const textUtils = {
  decodeXmlEntities,
  extractVisibleText,
  normalizeWhitespace,
  extractWordElements,
  extractVisibleRuns,
  extractIdAttribute,
  extractTypeAttribute,
} as const;
