/**
 * PR7A — BM-171 Style Profile
 *
 * The BM-171 profile is data: a list of rules that match specific
 * text fragments inside `word/document.xml` and either
 *   - apply typographic properties (bold / italic / font size) to
 *     matched runs ("run-style" rules); OR
 *   - drop an entire matched paragraph ("dropParagraph" rules); OR
 *   - drop empty paragraphs between two anchor paragraphs
 *     ("dropEmptyParagraphsBetween" rules) used to clean up
 *     placeholder-driven layout residue in the canonical fixture.
 *
 * The engine reads this file; it does NOT live inside the engine.
 *
 * Every matcher text in this file is BM-171-specific wording from
 * the locked BM-171 contract template (`storage/templates/normalized-docx/
 * BM-171/BM-171_normalized.docx`, sha256
 * `bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2`).
 * The locked template does NOT carry the typographic styling the
 * Vietnamese prosecution style guide requires (e.g. "QUYẾT ĐỊNH" body
 * title must be bold + 14pt; the place-date line must be italic +
 * 14pt). The engine applies the missing styling at render time.
 *
 * Profile rules are independent of the BM-171 *content* layer
 * (PR6G.3 shared mapping + PR7A per-BM adapter): this profile mutates
 * run properties and paragraph membership, not text. The shared
 * toolkit produces the wording; the profile sets the visual
 * presentation and removes residual layout residue.
 *
 * BM-171 paragraph-suppression rules (PR7A.3):
 *
 *   PR7A.2 triage proved the BM-171 normalized DOCX carries the same
 *   drafter-note residue BM-001 and BM-169 carry (`12 Ghi cụ thể cơ
 *   quan…`, `13 Ghi chức danh người ký`). These are plain body
 *   `<w:p>` paragraphs (NOT real `<w:footnote>` / `<w:endnote>`
 *   entries — the DOCX has no `word/footnotes.xml` or
 *   `word/endnotes.xml` part). The locked contract has 34
 *   `docxSlots` all in P0011..P0055; P0080/P0081 are unbound. The
 *   Planner decision (PR7A.3) is Path B — MUST_SUPPRESS, scoped to
 *   the BM-171 style profile, without mutating the normalized
 *   DOCX or the locked contract.
 *
 *   Two `dropParagraph` rules remove the drafter notes by matching
 *   `startsWith` and gated by the `requireSuperscriptPrefix` safety
 *   guard rail: the digit `12` (resp. `13`) is rendered with a
 *   `<w:vertAlign w:val="superscript"/>` run, which is the only
 *   structural marker that distinguishes the drafter note from any
 *   user-provided rendered text that happens to contain the same
 *   substring.
 *
 *   One `dropEmptyParagraphsBetween` rule removes the empty
 *   paragraphs that sit between the archive line
 *   (`Lưu: HSVA, HSKS, VP.`) and the drafter notes — these empty
 *   paragraphs cause the page-2 overflow the Planner eyeballed; the
 *   rule's `onlyIfAllEmpty: true` and `maxParagraphs: 50` guard
 *   rails ensure it cannot delete any user text by accident.
 *
 *   One `dropEmptyParagraphsBetween` rule removes the empty
 *   legal-basis placeholder paragraphs that sit between the
 *   subtitle (`TRẢ LẠI TÀI SẢN`) and the body title
 *   (`QUYẾT ĐỊNH:`). With the canonical fixture's 4-of-34 slot
 *   fills, these placeholders expand to empty `<w:p>` paragraphs
 *   that retain `w:spacing w:before/afterLines="50"` from the
 *   source DOCX and produce the page-1 huge-blank visual. The rule
 *   is gated by `onlyIfAllEmpty: true` so it does NOT touch a real
 *   legal-basis sentence when the user fills the slots.
 *
 *   When the legal-basis slots ARE filled by a user in production,
 *   those paragraphs are non-empty so the rule is a no-op (warning
 *   emitted, `skippedRuleIds` records the no-match) — the legal
 *   content is preserved exactly. This is the Path B / "scoped to
 *   canonical fixture" safety property.
 *
 * Rules reference text that the BM-171 DOCX template renders at the
 * following locked paragraphs (verified against the BM-171
 * normalized template after a real Docxtemplater fill):
 *
 *   - place-date line:        "TP. Hồ Chí Minh,"  (italic + 14pt)
 *   - body title:             "QUYẾT ĐỊNH"        (bold + 14pt)
 *   - subtitle:               "TRẢ LẠI TÀI SẢN"   (bold + 14pt)
 *   - article I heading:      "Điều 1."           (bold + 14pt)
 *   - article II heading:     "Điều 2."           (bold + 14pt)
 *   - recipients heading:     "Nơi nhận:"         (bold + 14pt)
 *   - archive line:           "Lưu: HSVA, HSKS, VP." (11pt)
 *   - drafter note 12:        "12 Ghi cụ thể cơ quan…" (dropParagraph)
 *   - drafter note 13:        "13 Ghi chức danh người ký" (dropParagraph)
 *
 * Matcher choice rationale:
 *   - The BM-171 locked template renders the title, subtitle, article
 *     headings, recipients heading and archive line as SEPARATE
 *     paragraphs at distinct block ids. `contains` keeps the rule
 *     resilient while still targeting the substring that carries
 *     typographic intent.
 *   - `startsWith` is used for the two drafter-note `dropParagraph`
 *     rules because the drafter note paragraphs always render with
 *     the digit at the start of the visible text.
 *
 * NO signature-heading rules for BM-171 v1.
 * The BM-171 source body splits the signature block into three
 * SEPARATE paragraph blocks at P0050 (signMode), P0051
 * (positionTitle), P0055 (signerName). There is no bold "KT. VIỆN
 * TRƯỞNG" or "PHÓ VIỆN TRƯỞNG" heading line wrapping the signature.
 * A human sign-off pass may later add rules if reviewers note a visual
 * inconsistency, but v1 keeps the profile minimal and evidence-driven.
 *
 * NO header / footer / footnote / endnote rules for BM-171.
 * The template has no header / footer parts AND no `word/footnotes.xml`
 * / `word/endnotes.xml` parts at all (PR7A.2 triage proves this).
 * The PR6G.4 engine's part: 'header' | 'footer' | 'footnote' |
 * 'endnote' support is intentionally unused for BM-171.
 *
 * NO global mutation of the normalized DOCX.
 * All suppression rules live in this profile; the engine applies them
 * only when `getStyleProfileForTemplate('BM-171')` returns this
 * profile. No other template inherits these rules. The normalized
 * DOCX file at `storage/templates/normalized-docx/BM-171/
 * BM-171_normalized.docx` is byte-identical to its pre-PR7A.3 state.
 *
 * "TRẢ LẠI TÀI SẢN" / "Lưu: HSVA, HSKS, VP." happen to share substrings
 * with the BM-001 profile (`"Tiếp nhận nguồn tin về tội phạm"` etc. is
 * BM-001-specific; the BM-171 matcher texts are NOT the same as
 * BM-001's matcher texts). This is acceptable because the matcher
 * `id` differs per rule and the engine looks up profiles by
 * `templateCode`. The two profiles are independent data files.
 *
 * @module rendering/infrastructure/style-profile
 */

import type { DocxStyleProfile } from './docx-style-profile.types';

export const BM171_STYLE_PROFILE: DocxStyleProfile = {
  templateCode: 'BM-171',
  profileId: 'bm-171-vks-khu-vuc-7',
  profileName: 'BM-171 — QĐ trả lại tài sản typographic + suppression profile',
  rules: [
    // ── typographic rules (run-style) ──────────────────────────────────────
    {
      id: 'bm171.place_date_line',
      part: 'document',
      match: { type: 'contains', text: 'TP. Hồ Chí Minh,' },
      style: { italic: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.body_title',
      part: 'document',
      match: { type: 'contains', text: 'QUYẾT ĐỊNH' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.subtitle',
      part: 'document',
      match: { type: 'contains', text: 'TRẢ LẠI TÀI SẢN' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.article_1',
      part: 'document',
      match: { type: 'contains', text: 'Điều 1.' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.article_2',
      part: 'document',
      match: { type: 'contains', text: 'Điều 2.' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.noi_nhan',
      part: 'document',
      match: { type: 'contains', text: 'Nơi nhận:' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.archive_line',
      part: 'document',
      match: { type: 'contains', text: 'Lưu: HSVA, HSKS, VP.' },
      style: { fontSizePt: 11 },
    },
    // ── paragraph-suppression rules (PR7A.3) ───────────────────────────────
    //
    // Order matters: drop rules run IN PROFILE ORDER against a shared
    // paragraph list (see `applyRulesToParagraphs`). We list the
    // `dropEmptyParagraphsBetween` rules BEFORE the `dropParagraph`
    // rules so the between-rule anchors (`Lưu: HSVA, HSKS, VP.`,
    // `12 Ghi cụ thể cơ quan`) are still present when the between
    // rule needs them. If the `dropParagraph` rules ran first, they
    // would remove notes 12/13 and the between-rule would report a
    // missing anchor.
    //
    // The two `dropParagraph` rules ARE the PR7A.3 fix for the
    // `12 Ghi cụ thể cơ quan…` and `13 Ghi chức danh người ký` body
    // paragraphs. The `requireSuperscriptPrefix` guard rail guarantees
    // we only drop the drafter-note shape (digit rendered with
    // `<w:vertAlign w:val="superscript"/>`) and never any user text
    // that incidentally starts with the same letters. The
    // `requireAnchorBeforeText` guard rail additionally requires the
    // `Lưu: HSVA, HSKS, VP.` paragraph to be present in the
    // immediate before direction — i.e. this is the BM-171
    // drafter-note foot, not some unrelated content.

    // Drop the empty paragraphs that sit between `Lưu: HSVA, HSKS, VP.`
    // and the drafter notes. With the canonical fixture these are the
    // residual empty placeholder paragraphs that push the drafter notes
    // to page 2. `onlyIfAllEmpty: true` makes this a no-op when a real
    // user fills the recipients / signature block, so production BM-171
    // panels with user content are unaffected.
    {
      id: 'bm171.drop_tail_between_archive_and_drafter_notes',
      part: 'document',
      action: 'dropEmptyParagraphsBetween',
      afterAnchor: 'Lưu: HSVA, HSKS, VP.',
      beforeAnchor: '12 Ghi cụ thể cơ quan',
      safety: {
        onlyIfAllEmpty: true,
        maxParagraphs: 50,
      },
    },
    // Drop the empty legal-basis paragraphs that sit between the
    // subtitle and the body title. Same `onlyIfAllEmpty` + cap guard
    // rails. When the legal-basis slots are user-filled, the paragraphs
    // carry real text and the rule is a no-op (engine emits a warning,
    // `skippedRuleIds` records the no-match).
    {
      id: 'bm171.drop_legal_basis_blank_block',
      part: 'document',
      action: 'dropEmptyParagraphsBetween',
      afterAnchor: 'TRẢ LẠI TÀI SẢN',
      beforeAnchor: 'QUYẾT ĐỊNH:',
      safety: {
        onlyIfAllEmpty: true,
        maxParagraphs: 12,
      },
    },
    // Note: `requireAnchorBeforeText` was REMOVED in PR7A.4 because
    // the canonical signoff packet now ships a FULL synthetic fixture
    // (every locked-contract slot populated). With the full fixture,
    // paragraphs 49–50 (signature.signMode + signature.positionTitle)
    // carry real text ("Ký thay", "VIỆN TRƯỞNG"), which means a
    // backwards walk from the drafter-note paragraph to the archive-
    // line `Lưu: HSVA, HSKS, VP.` would hit a non-empty paragraph
    // first and the `requireAnchorBeforeText` guard would falsely
    // reject the drop. The remaining `requireSuperscriptPrefix` guard
    // alone is sufficient: the `<w:vertAlign w:val="superscript"/>`
    // marker on the leading digit is the unambiguous structural
    // signature of a drafter-note paragraph — no real legal / static
    // text in any BM template uses that marker. See PR7A.2 triage
    // (`PR7A2_BM171_DOCX_PARTS_LAYOUT_TRIAGE.latest.md` §3) for the
    // original OOXML excerpt proving this.

    {
      id: 'bm171.drop_drafter_note_12',
      part: 'document',
      action: 'dropParagraph',
      match: { type: 'startsWith', text: '12 Ghi cụ thể cơ quan' },
      safety: {
        requireSuperscriptPrefix: true,
      },
    },
    {
      id: 'bm171.drop_drafter_note_13',
      part: 'document',
      action: 'dropParagraph',
      match: { type: 'startsWith', text: '13 Ghi chức danh người ký' },
      safety: {
        requireSuperscriptPrefix: true,
      },
    },
  ],
};
