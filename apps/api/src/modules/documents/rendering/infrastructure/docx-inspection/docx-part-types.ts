/**
 * PR6G.1 — DOCX Parts Inspection: shared type contracts.
 *
 * This module is the single source of truth for the runtime shape of a
 * DOCX "parts inspection" result. Every other file in
 * `./docx-inspection/*` (reader, extractor, tests) imports from here.
 *
 * Why a dedicated type file:
 *   - The downstream `bm-final-audit` harness (PR6G.2) needs to consume
 *     `DocxPackageInspection` without importing the file that produces it.
 *   - The audit artifacts in `docs/audit/docx-parts/...` are written
 *     directly from these shapes; a single, frozen struct lets us
 *     version the artifact format independently of any extraction
 *     implementation changes.
 *   - Tests assert against the type fields, not against XML strings.
 *
 * Field-level conventions:
 *   - `text`         → the joined, raw concatenation of every visible
 *                      `<w:t>` text node, in document order. Tabs are
 *                      preserved as `\t`, line breaks as `\n`. Whitespace
 *                      between text nodes is collapsed to a single space
 *                      ONLY when there is no intervening `<w:tab/>` /
 *                      `<w:br/>` / `<w:cr/>` element.
 *   - `normalizedText` → the `text` after `normalizeWhitespace()` (see
 *                      `docx-text-extractor.ts`): collapse runs of
 *                      whitespace to a single space, trim edges. The
 *                      normalized form is what assertion code compares
 *                      against expected phrases.
 *   - `id` on footnote/endnote/comment entries → the raw `w:id="..."`
 *                      attribute as a string. Numeric IDs are not
 *                      coerced because Word uses `-1` and `0` for
 *                      separator/continuationSeparator entries.
 *   - `marker`        → the user-visible number Word renders in the
 *                      body for that note. Derived by counting
 *                      non-separator notes in source order, starting at
 *                      1. If the source already provides an explicit
 *                      `<w:footnoteRef/>` we use that, but for the
 *                      common case where the marker is implicit we
 *                      compute it deterministically.
 *   - `relationships` → the parsed list of every `<Relationship>` from
 *                      `word/_rels/document.xml.rels`. Stored as an
 *                      opaque shape because rels metadata is rarely
 *                      asserted on directly; the field exists so callers
 *                      can correlate a part (e.g. a header) back to the
 *                      document section that references it.
 *
 * NOT in this file:
 *   - The actual `extract` functions (see `docx-package-reader.ts`).
 *   - The string-parsing regexes (see `docx-text-extractor.ts`).
 *
 * @module docx-inspection/docx-part-types
 */

/**
 * A single footnote or endnote extracted from `word/footnotes.xml` /
 * `word/endnotes.xml`.
 *
 * The `text` is the joined visible text of the note's body. Notes whose
 * `w:type` is `separator` or `continuationSeparator` (i.e. the
 * mechanical separators Word emits at the bottom of every page) are
 * NEVER included in this shape; they are filtered out by the extractor.
 *
 * If the source DOCX omits footnotes.xml entirely, `extractFootnotes`
 * returns an empty array and the inspection reports
 * `footnotes: NOT_APPLICABLE` at the harness level.
 */
export interface DocxFootnoteEntry {
  /** Raw `w:id` attribute (e.g. "2", "-1", "0"). Always a string. */
  id: string;
  /** User-visible marker number ("1", "2", …) — counting non-separators. */
  marker: string;
  /** Joined raw text of the note body, with tab/break markers preserved. */
  text: string;
  /** Whitespace-collapsed, edge-trimmed form of `text`. */
  normalizedText: string;
  /**
   * Minimal run-style hint for the first non-empty visible run. Useful
   * for "is this footnote bold?" style checks. Null when the note has
   * no visible text.
   */
  runStyleHints: ReadonlyArray<DocxRunStyleHint>;
}

/**
 * A comment extracted from `word/comments.xml`. Comments have the same
 * structural shape as footnotes/endnotes from an extraction standpoint,
 * so we reuse `DocxFootnoteEntry` but expose author/date when present.
 */
export interface DocxCommentEntry {
  id: string;
  /** Comment author (`w:author` attribute). Optional. */
  author?: string;
  /** Comment initials (`w:initials` attribute). Optional. */
  initials?: string;
  /** Comment date (`w:date` attribute). Optional. */
  date?: string;
  text: string;
  normalizedText: string;
}

/**
 * Minimal style hint for a `<w:r>` element. We do NOT return the entire
 * `<w:rPr>` block — that would be too coupled to OOXML details.
 *
 * Returned shape is intentionally narrow: callers wanting richer
 * inspection can re-parse the raw XML via `extractWordElements`.
 */
export interface DocxRunStyleHint {
  /** Bold on this run (`<w:b/>`). */
  bold?: boolean;
  /** Italic on this run (`<w:i/>`). */
  italic?: boolean;
  /** Underline on this run (`<w:u .../>`). */
  underline?: boolean;
  /** Font size in half-points (so 14pt = `28`). Optional. */
  sizeHalfPoints?: number;
  /** Complex-script font size in half-points. Optional. */
  sizeHalfPointsCs?: number;
  /** Explicit run color (`<w:color w:val="...">`), e.g. "000000". Optional. */
  color?: string;
  /** Run typeface (`<w:rFonts w:ascii="..."/>`), e.g. "Times New Roman". Optional. */
  asciiFont?: string;
}

/**
 * Header or footer part extracted from `word/header[1-N].xml` /
 * `word/footer[1-N].xml`. N is bounded by `MAX_HEADER_FOOTER_PARTS`
 * (see `docx-package-reader.ts`).
 */
export interface DocxHeaderFooterPart {
  /** Exact part name (e.g. "word/header1.xml"). */
  partName: string;
  /** Joined raw text of the header/footer body. */
  text: string;
  /** Whitespace-collapsed form. */
  normalizedText: string;
  /**
   * Relationship `Id` from `word/_rels/document.xml.rels` that points
   * TO this header/footer part. Useful for cross-referencing the part
   * to the section that uses it.
   */
  relationshipId?: string;
}

/**
 * Top-level DOCX package inspection result.
 *
 * Produced by `inspectDocxPackage(buffer)`. Every field is present even
 * if the corresponding DOCX part is absent — the absent case is
 * reflected by `exists: false` or an empty array, never by an
 * `undefined` value. This is what downstream harness code relies on.
 */
export interface DocxPackageInspection {
  /** Schema version of THIS inspection shape. Bump on breaking changes. */
  schemaVersion: '1';

  /** Source DOCX byte size, when available (for diagnostic logs). */
  sourceBytes?: number;

  /** Source DOCX part list (every entry in the underlying zip). */
  partList: ReadonlyArray<string>;

  /**
   * Main document body text. `exists: true` for any valid DOCX;
   * `false` only if `word/document.xml` is genuinely missing, which is
   * a malformed-package failure surfaced by `inspectDocxPackage`.
   */
  mainDocument: DocxMainDocumentSection;

  /** Header parts (sorted by part name for determinism). */
  headers: ReadonlyArray<DocxHeaderFooterPart>;

  /** Footer parts (sorted by part name). */
  footers: ReadonlyArray<DocxHeaderFooterPart>;

  /** Footnote parts (real notes only — separator entries are filtered). */
  footnotes: ReadonlyArray<DocxFootnoteEntry>;

  /** Endnote parts (real notes only). */
  endnotes: ReadonlyArray<DocxFootnoteEntry>;

  /** Comment parts (empty array if `word/comments.xml` is absent). */
  comments: ReadonlyArray<DocxCommentEntry>;

  /** Styles part existence. */
  styles: { partName: string; exists: boolean };

  /** Settings part existence. */
  settings: { partName: string; exists: boolean };

  /**
   * Relationships from `word/_rels/document.xml.rels`. Opaque shape;
   * callers should treat the inner fields as the source rels file
   * declares them. We deliberately do NOT normalize the rels schema
   * here so a future rev of the spec can be read without re-versioning
   * `DocxPackageInspection`.
   */
  relationships: ReadonlyArray<unknown>;
}

export interface DocxMainDocumentSection {
  /** Exact part name ("word/document.xml"). */
  partName: string;
  /** Raw joined text. */
  text: string;
  /** Normalized text (whitespace-collapsed, trimmed). */
  normalizedText: string;
  /** Always `true` for a well-formed DOCX; included for symmetry. */
  exists: boolean;
}
