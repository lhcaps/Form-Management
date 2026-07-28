/**
 * PR6G.4 — BM-001 Style Profile
 *
 * The BM-001 profile is data: a list of rules that match specific
 * text fragments inside `word/document.xml` and apply typographic
 * properties (bold / italic / font size). The engine reads this file;
 * it does NOT live inside the engine.
 *
 * Every string in this file is BM-001-specific wording from the
 * locked BM-001 contract template. The profile exists because the
 * locked template itself does NOT carry the typographic styling the
 * Vietnamese prosecution style guide requires (e.g. "BIÊN BẢN" body
 * title must be bold + 14pt; the place-date line must be italic +
 * 14pt). The engine applies the missing styling at render time.
 *
 * Profile rules are independent of the BM-001 *content* layer
 * (PR6G.3.1 shared mapping): this profile mutates run properties,
 * not text. The shared toolkit produces the wording; the profile
 * sets the visual presentation.
 *
 * Rules reference text that the BM-001 DOCX template renders at
 * the following locked paragraphs (verified against the BM-001
 * normalized template at `storage/templates/normalized-docx/BM-001/
 * BM-001_normalized.docx` after a real Docxtemplater fill):
 *
 *   - date/place line:        "TP. Hồ Chí Minh,"     (italic + 14pt)
 *   - body title:             "BIÊN BẢN"             (bold + 14pt)
 *   - subtitle:               "Tiếp nhận nguồn tin về tội phạm" (bold + 14pt)
 *   - heading I:              "I. NỘI DUNG"          (bold + 14pt)
 *   - heading II:             "II. CÁC TÀI LIỆU"     (bold + 14pt)
 *   - signature (informant):  "NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM" (bold + 14pt)
 *   - signature (receiver):   "NGƯỜI TIẾP NHẬN"      (bold + 14pt)
 *   - archive line:           "Lưu: HSVA, HSKS, VP." (11pt)
 *
 * Matcher choice rationale:
 *   - The BM-001 locked template renders headers, titles, headings,
 *     signature titles, and the archive line all inside LARGER
 *     paragraphs (e.g. the body title "BIÊN BẢN" sits inside a
 *     single concatenated header paragraph; the heading "I. NỘI DUNG"
 *     is appended to a paragraph that starts with "Là người đại
 *     diện..."). `exactText` and `startsWith` therefore do not match
 *     reliably across the BM-001 rendered output.
 *   - `contains` matching is used for every rule so the engine can
 *     target the relevant substring and split runs at the match
 *     boundaries, applying the typographic override ONLY to the
 *     matched fragment. This preserves the surrounding wording and
 *     any pre-existing run-property attributes the locked template
 *     carries.
 *   - The archive line is a small, mostly-isolated paragraph but
 *     `contains` keeps the rule resilient to trailing whitespace or
 *     punctuation changes the locked template might introduce.
 *
 * "Nơi nhận:" is NOT in this profile. The BM-001 locked template has
 * no "Nơi nhận:" block — the field is documented as
 * NOT_APPLICABLE_BY_TEMPLATE in the BM-001 final audit doc. The
 * profile must not invent one.
 *
 * @module rendering/infrastructure/style-profile
 */

import type { DocxStyleProfile } from './docx-style-profile.types';

export const BM001_STYLE_PROFILE: DocxStyleProfile = {
  templateCode: 'BM-001',
  profileId: 'bm-001-vks-khu-vuc-7',
  profileName: 'BM-001 — VKS Khu vực 7 typographic profile',
  rules: [
    {
      id: 'bm001.place_date_line',
      part: 'document',
      match: { type: 'contains', text: 'TP. Hồ Chí Minh,' },
      style: { italic: true, fontSizePt: 14 },
    },
    {
      id: 'bm001.body_title',
      part: 'document',
      match: { type: 'contains', text: 'BIÊN BẢN' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm001.subtitle',
      part: 'document',
      match: {
        type: 'contains',
        text: 'Tiếp nhận nguồn tin về tội phạm',
      },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm001.heading_i',
      part: 'document',
      match: { type: 'contains', text: 'I. NỘI DUNG' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm001.heading_ii',
      part: 'document',
      match: { type: 'contains', text: 'II. CÁC TÀI LIỆU' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm001.signature_informant',
      part: 'document',
      match: {
        type: 'contains',
        text: 'NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM',
      },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm001.signature_receiver',
      part: 'document',
      match: { type: 'contains', text: 'NGƯỜI TIẾP NHẬN' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm001.archive_line',
      part: 'document',
      match: { type: 'contains', text: 'Lưu: HSVA, HSKS, VP.' },
      style: { fontSizePt: 11 },
    },
  ],
};
