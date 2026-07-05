/**
 * PR6G.4 — Generic Style Profile Engine: shared types.
 *
 * The style profile engine is a config-driven post-processor that runs
 * AFTER Docxtemplater has filled the DOCX template. It applies typographic
 * rules (bold / italic / font size / complex-script font size) to
 * specific run-level targets inside `word/document.xml` (and later
 * header / footer / footnote / endnote parts) based on a per-template
 * profile.
 *
 * Rules live in BM-specific profile config, not in the engine. The
 * engine itself is a generic runner that:
 *
 *   1. Looks up the profile by `templateCode` from a registry.
 *   2. If no profile is registered for `templateCode`, returns the
 *      input buffer byte-identical (no-op contract).
 *   3. Walks each targeted part, finds paragraphs whose visible text
 *      matches a rule's matcher, splits runs as needed, and applies
 *      the rule's style overrides via run-property mutations.
 *   4. Re-emits the DOCX zip and returns the new buffer.
 *
 * @module rendering/infrastructure/style-profile
 */

export type DocxStyleProfilePart =
  | 'document'
  | 'header'
  | 'footer'
  | 'footnote'
  | 'endnote';

export type DocxStyleProfileMatch =
  | { type: 'exactText'; text: string }
  | { type: 'startsWith'; text: string }
  | { type: 'contains'; text: string };

export type DocxStyleProfileStyle = {
  bold?: boolean;
  italic?: boolean;
  /** Font size in points (e.g. 14). Half-points is computed internally. */
  fontSizePt?: number;
  /** Font size in half-points (e.g. 28 = 14pt). Use this for exact sz val. */
  fontSizeHalfPt?: number;
};

/**
 * PR7A.3 — guard rails for paragraph-removal rules.
 *
 * Drop rules (`dropParagraph` / `dropEmptyParagraphsBetween` /
 * `dropTrailingEmptyParagraphsBefore`) live ONLY on the BM-171
 * style-profile and ONLY on the `document` part for now. The
 * safety guard rails below prevent accidental collateral damage:
 *
 * - `requireSuperscriptPrefix`: the matched paragraph's first
 *   `<w:r>` must carry `<w:vertAlign w:val="superscript"/>`. Used
 *   to discriminate drafter notes 12 / 13 (superscript markers)
 *   from any user-provided rendered text that happens to share
 *   the prefix substring.
 *
 * - `requireAnchorAfterText` / `requireAnchorBeforeText`:
 *   the rule only fires if the matched paragraph sits between
 *   (or after / before) paragraphs whose visible text equals one
 *   of the given strings. Anchors are matched with the same
 *   whitespace-normalised `contains` semantics the run-style
 *   engine uses.
 *
 * - `maxParagraphs`: cap on how many paragraphs the rule can
 *   remove in one pass. Guards against accidentally wiping a
 *   big section if a future template reorders anchors.
 *
 * - `onlyIfAllEmpty`: when true, the rule refuses to remove any
 *   paragraph whose joined visible text has any non-whitespace
 *   character. This is the safety backbone of every empty-paragraph
 *   suppression rule.
 *
 * - `keepTrailingPunctuationParagraphs`: when true, paragraphs
 *   whose ONLY non-empty content is punctuation characters
 *   (e.g. `.`, `:`, `,`, `;`) are kept. Defaults to false to
 *   match BM-171's actual layout, but exposed for BM-001 and
 *   future templates.
 */
export type DocxStyleProfileSafety = {
  requireSuperscriptPrefix?: boolean;
  requireAnchorAfterText?: string;
  requireAnchorBeforeText?: string;
  maxParagraphs?: number;
  onlyIfAllEmpty?: boolean;
  keepTrailingPunctuationParagraphs?: boolean;
};

/**
 * Run-style rule (existing). Applies typographic properties to
 * the matched substring inside the matched paragraph.
 */
export type DocxStyleProfileRunStyleRule = {
  id: string;
  part: DocxStyleProfilePart;
  match: DocxStyleProfileMatch;
  style: DocxStyleProfileStyle;
};

/**
 * Drop-paragraph rule (PR7A.3).
 *
 * Removes entire `<w:p>` paragraphs from `word/document.xml`
 * (or the targeted part) when they match. The matcher selects
 * a paragraph by its visible text (whitespace-normalised); the
 * safety guard rails filter out paragraphs that may incidentally
 * match but are not actually intended to be dropped.
 *
 * Drop rules emit warnings (NOT throws) when the rule does not
 * match in a given render — this preserves the existing logging
 * semantics. They participate in the `appliedRuleIds` /
 * `skippedRuleIds` accounting the same way run-style rules do.
 */
export type DocxStyleProfileDropParagraphRule = {
  id: string;
  part: DocxStyleProfilePart;
  action: 'dropParagraph';
  match: DocxStyleProfileMatch;
  safety?: DocxStyleProfileSafety;
};

/**
 * Drop-empty-paragraphs-between rule (PR7A.3).
 *
 * Walks the body in source order, finds the first paragraph whose
 * visible text `contains` `afterAnchor`, then walks forward
 * counting paragraphs until one whose visible text `contains`
 * `beforeAnchor` is reached. Every paragraph BETWEEN them whose
 * joined text is empty / whitespace-only is removed, capped by
 * `maxParagraphs`. If either anchor is missing, the rule is a
 * no-op (and emits a warning). Anchors themselves are NEVER
 * removed.
 */
export type DocxStyleProfileDropEmptyBetweenRule = {
  id: string;
  part: 'document';
  action: 'dropEmptyParagraphsBetween';
  afterAnchor: string;
  beforeAnchor: string;
  safety?: DocxStyleProfileSafety;
};

/**
 * Drop-trailing-empty-paragraphs-before rule (PR7A.3).
 *
 * Walks the body in reverse, finds the first paragraph whose
 * visible text `contains` `beforeAnchor`, then walks backward
 * removing empty paragraphs until a non-empty paragraph or
 * `maxParagraphs` is reached. If `beforeAnchor` is missing, the
 * rule is a no-op (and emits a warning). `beforeAnchor` itself
 * is NEVER removed.
 */
export type DocxStyleProfileDropTrailingEmptyRule = {
  id: string;
  part: 'document';
  action: 'dropTrailingEmptyParagraphsBefore';
  beforeAnchor: string;
  safety?: DocxStyleProfileSafety;
};

export type DocxStyleProfileRule =
  | DocxStyleProfileRunStyleRule
  | DocxStyleProfileDropParagraphRule
  | DocxStyleProfileDropEmptyBetweenRule
  | DocxStyleProfileDropTrailingEmptyRule;

export type DocxStyleProfile = {
  templateCode: string;
  /** Profile identity for audit / debug. */
  profileId: string;
  profileName: string;
  rules: DocxStyleProfileRule[];
};

export type StyleApplicationResult = {
  templateCode: string;
  profileApplied: boolean;
  appliedRuleIds: string[];
  skippedRuleIds: string[];
  warnings: string[];
  /** When `profileApplied` is false, the buffer is the input reference. */
  buffer: Buffer;
};
