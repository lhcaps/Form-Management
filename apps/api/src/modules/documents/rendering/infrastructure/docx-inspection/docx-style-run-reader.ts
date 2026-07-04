/**
 * PR6G.1 — DOCX Parts Inspection: minimal `<w:rPr>` style reader.
 *
 * Purpose:
 *   The footnote / endnote / comment extractors need a tiny bit of
 *   style context per run (is the first visible run bold? what size?)
 *   so the audit harness can answer "did the run get post-processed?"
 *   without re-implementing OOXML rPr parsing three times.
 *
 *   The full rPr grammar is large (40+ child elements). This module
 *   intentionally reads ONLY the seven properties that the audit
 *   harness asks about. If a future audit needs more, add another
 *   targeted helper here; do not bolt on a generic OOXML parser.
 *
 * Properties read:
 *   - `<w:b/>` / `<w:b w:val="...">`           → bold (default true)
 *   - `<w:i/>` / `<w:i w:val="...">`           → italic (default true)
 *   - `<w:u w:val="...">`                       → underline (any non-"none")
 *   - `<w:sz w:val="NN"/>`                      → font size, half-points
 *   - `<w:szCs w:val="NN"/>`                    → complex-script size
 *   - `<w:color w:val="RRGGBB"/>`              → run color (hex)
 *   - `<w:rFonts w:ascii="..." .../>`           → ASCII typeface
 *
 * What is NOT read:
 *   - Highlighting, shading, theme colors, borders, tabs, language.
 *   - Paragraph-level rPr (we operate on `<w:r>` only).
 *
 * @module docx-inspection/docx-style-run-reader
 */

import type { DocxRunStyleHint } from './docx-part-types';

/**
 * Parse `<w:rPr>…</w:rPr>` and return the hint shape. The argument
 * MUST be a run element `<w:r …>…</w:r>` — we look for `<w:rPr>` inside
 * the first 4 KB of inner XML to avoid scanning large runs needlessly.
 *
 * Returns `null` when the run has no `<w:rPr>` block. Returns an empty
 * object `{}` when the rPr is empty. Both are valid OOXML.
 */
export function extractRunStyleHint(runXml: string): DocxRunStyleHint | null {
  // Restrict the search to the first 4 KB to keep the regex pass fast
  // on huge runs; in practice every rPr we care about is in the first
  // few hundred bytes.
  const head = runXml.length > 4096 ? runXml.slice(0, 4096) : runXml;
  const rPrMatch = /<w:rPr>([\s\S]*?)<\/w:rPr>/u.exec(head);
  if (!rPrMatch) return null;
  const rPr = rPrMatch[1] ?? '';

  const hint: DocxRunStyleHint = {};

  // <w:b/>  OR  <w:b w:val="true|1"/>   → bold true
  // <w:b w:val="false|0"/>             → bold false
  // We treat the absence of <w:b/> as "not set" (undefined), not as
  // bold=false, so callers can distinguish "not bold" from "no info".
  if (/<w:b\b/u.test(rPr)) {
    const m = /<w:b\b[^/>]*\bw:val="([^"]+)"/u.exec(rPr);
    const v = m ? (m[1] ?? '').toLowerCase() : 'true';
    hint.bold = !(v === 'false' || v === '0');
  }
  if (/<w:i\b/u.test(rPr)) {
    const m = /<w:i\b[^/>]*\bw:val="([^"]+)"/u.exec(rPr);
    const v = m ? (m[1] ?? '').toLowerCase() : 'true';
    hint.italic = !(v === 'false' || v === '0');
  }
  if (/<w:u\b/u.test(rPr)) {
    const m = /<w:u\b[^/>]*\bw:val="([^"]+)"/u.exec(rPr);
    const v = m ? (m[1] ?? '').toLowerCase() : '';
    // <w:u w:val="none"/> → no underline; any other value → underline.
    hint.underline = v !== 'none' && v !== '';
  }

  const szMatch = /<w:sz\b[^/>]*\bw:val="(\d+)"/u.exec(rPr);
  if (szMatch) {
    const n = Number(szMatch[1]);
    if (Number.isFinite(n) && n > 0) hint.sizeHalfPoints = n;
  }
  const szCsMatch = /<w:szCs\b[^/>]*\bw:val="(\d+)"/u.exec(rPr);
  if (szCsMatch) {
    const n = Number(szCsMatch[1]);
    if (Number.isFinite(n) && n > 0) hint.sizeHalfPointsCs = n;
  }
  const colorMatch = /<w:color\b[^/>]*\bw:val="([0-9A-Fa-f]{6})"/u.exec(rPr);
  if (colorMatch) hint.color = (colorMatch[1] ?? '').toLowerCase();
  const fontsMatch = /<w:rFonts\b[^/>]*\bw:ascii="([^"]+)"/u.exec(rPr);
  if (fontsMatch) hint.asciiFont = fontsMatch[1] ?? undefined;

  return hint;
}

/**
 * Compute style hints for the FIRST non-empty visible run in the
 * supplied XML element body. This is what the footnote extractor uses
 * to populate `runStyleHints[0]`.
 *
 * Returns an empty array when the element has no visible run — which
 * is the normal case for separator entries (they contain only the
 * `<w:separator/>` element, no `<w:t>` text).
 */
export function extractFirstRunStyleHint(
  elementBodyXml: string,
): ReadonlyArray<DocxRunStyleHint> {
  const runRe = /<w:r\b[\s\S]*?<\/w:r>/g;
  let m: RegExpExecArray | null;
  while ((m = runRe.exec(elementBodyXml)) !== null) {
    const runXml = m[0];
    // Cheap visible-text check: presence of at least one <w:t> node.
    if (!/<w:t\b/u.test(runXml)) continue;
    const hint = extractRunStyleHint(runXml);
    if (hint) return [hint];
  }
  return [];
}
