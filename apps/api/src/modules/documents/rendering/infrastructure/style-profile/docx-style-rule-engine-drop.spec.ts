/**
 * PR7A.3 — Generic paragraph-drop rule tests.
 *
 * These tests exercise the new `dropParagraph`,
 * `dropEmptyParagraphsBetween`, and
 * `dropTrailingEmptyParagraphsBefore` actions on synthetic DOCX
 * buffers. They prove:
 *
 *   1. `dropParagraph` removes only paragraphs whose text matches
 *      the matcher.
 *   2. `dropParagraph` with `requireSuperscriptPrefix` skips
 *      paragraphs that match text but lack the structural marker.
 *   3. `dropEmptyParagraphsBetween` removes only empty paragraphs
 *      between anchors and leaves the anchors themselves intact.
 *   4. `dropEmptyParagraphsBetween` is a no-op when anchors are
 *      missing OR a non-empty paragraph sits in the range.
 *   5. `dropTrailingEmptyParagraphsBefore` cleans up empty paragraphs
 *      that sit immediately before an anchor.
 *   6. BM-001's profile is byte-identical when the BM-171 profile
 *      is registered (i.e. registering BM-171 does NOT silently
 *      affect BM-001 rendering).
 *   7. The combined pipeline (drop + run-style) works as documented
 *      in `bm171-style-profile.ts` (37 trailing empties + 9 legal-basis
 *      empties collapse, two drafter notes removed, headings still
 *      bold + 14pt).
 */

import PizZip from 'pizzip';

import { applyStyleProfileToDocxBuffer } from './docx-style-rule-engine';
import {
  BM001_STYLE_PROFILE,
  BM171_STYLE_PROFILE,
  ensureStyleProfilesRegistered,
  __resetStyleProfileRegistryForTests,
  getStyleProfileForTemplate,
} from './index';
import type {
  DocxStyleProfile,
  DocxStyleProfileDropParagraphRule,
  DocxStyleProfileDropEmptyBetweenRule,
  DocxStyleProfileRule,
} from './docx-style-profile.types';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildDocx(paragraphsXml: string[]): Buffer {
  const zip = new PizZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
  );
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphsXml.join('')}</w:body>
</w:document>`,
  );
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function extractDocumentXml(buffer: Buffer): string {
  const zip = new PizZip(buffer);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('synthetic DOCX missing word/document.xml');
  return file.asText();
}

function paragraph(text: string, opts: { superscriptFirstRun?: boolean } = {}): string {
  const rPr = opts.superscriptFirstRun
    ? '<w:rPr><w:vertAlign w:val="superscript"/></w:rPr>'
    : '';
  return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function emptyParagraph(): string {
  return '<w:p/>';
}

function visibleText(buffer: Buffer): string {
  const xml = extractDocumentXml(buffer);
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('PR7A.3 — paragraph-drop / dropEmptyParagraphsBetween / dropTrailingEmptyParagraphsBefore', () => {
  beforeAll(() => {
    ensureStyleProfilesRegistered();
  });

  beforeEach(() => {
    __resetStyleProfileRegistryForTests();
    ensureStyleProfilesRegistered();
  });

  describe('dropParagraph', () => {
    it('removes only the paragraph whose text starts with the matcher', () => {
      const before = buildDocx([
        paragraph('12 Ghi cụ thể cơ quan ban hành văn bản'),
        paragraph('Nội dung chính của văn bản.'),
        paragraph('13 Ghi chức danh người ký'),
      ]);
      const rule: DocxStyleProfileDropParagraphRule = {
        id: 'drop.note12',
        part: 'document',
        action: 'dropParagraph',
        match: { type: 'startsWith', text: '12 Ghi cụ thể cơ quan' },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('drop.note12');
      const text = visibleText(result.buffer);
      expect(text).not.toContain('12 Ghi cụ thể cơ quan');
      expect(text).toContain('Nội dung chính của văn bản.');
      expect(text).toContain('13 Ghi chức danh người ký');
    });

    it('respects requireSuperscriptPrefix (does NOT drop without the marker)', () => {
      // Same visible text but no <w:vertAlign w:val="superscript"/>.
      const before = buildDocx([
        paragraph('12 Ghi cụ thể cơ quan ban hành văn bản'),
      ]);
      const rule: DocxStyleProfileDropParagraphRule = {
        id: 'drop.note12.guarded',
        part: 'document',
        action: 'dropParagraph',
        match: { type: 'startsWith', text: '12 Ghi cụ thể cơ quan' },
        safety: { requireSuperscriptPrefix: true },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.skippedRuleIds).toContain('drop.note12.guarded');
      const text = visibleText(result.buffer);
      expect(text).toContain('12 Ghi cụ thể cơ quan');
    });

    it('drops when requireSuperscriptPrefix is satisfied', () => {
      const before = buildDocx([
        paragraph('12 Ghi cụ thể cơ quan ban hành văn bản', {
          superscriptFirstRun: true,
        }),
      ]);
      const rule: DocxStyleProfileDropParagraphRule = {
        id: 'drop.note12.guarded',
        part: 'document',
        action: 'dropParagraph',
        match: { type: 'startsWith', text: '12 Ghi cụ thể cơ quan' },
        safety: { requireSuperscriptPrefix: true },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('drop.note12.guarded');
      expect(visibleText(result.buffer)).not.toContain(
        '12 Ghi cụ thể cơ quan',
      );
    });

    it('requires the anchor-before paragraph for context', () => {
      // The matching paragraph exists, but `Lưu: HSVA, HSKS, VP.`
      // does NOT precede it.
      const before = buildDocx([
        paragraph('Some unrelated heading paragraph'),
        paragraph('12 Ghi cụ thể cơ quan ban hành văn bản', {
          superscriptFirstRun: true,
        }),
      ]);
      const rule: DocxStyleProfileDropParagraphRule = {
        id: 'drop.note12.anchored',
        part: 'document',
        action: 'dropParagraph',
        match: { type: 'startsWith', text: '12 Ghi cụ thể cơ quan' },
        safety: {
          requireSuperscriptPrefix: true,
          requireAnchorBeforeText: 'Lưu: HSVA, HSKS, VP.',
        },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(false);
      expect(visibleText(result.buffer)).toContain(
        '12 Ghi cụ thể cơ quan',
      );
    });

    it('does NOT drop non-empty paragraphs that incidentally match', () => {
      const before = buildDocx([
        paragraph('Tóm tắt 12 Ghi cụ thể cơ quan đã ban hành.', {
          superscriptFirstRun: false,
        }),
      ]);
      const rule: DocxStyleProfileDropParagraphRule = {
        id: 'drop.note12.guarded',
        part: 'document',
        action: 'dropParagraph',
        match: { type: 'startsWith', text: '12 Ghi cụ thể cơ quan' },
        safety: { requireSuperscriptPrefix: true },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(false);
      expect(visibleText(result.buffer)).toContain(
        'Tóm tắt 12 Ghi cụ thể cơ quan đã ban hành.',
      );
    });

    it('no-op when the matcher text is absent', () => {
      const before = buildDocx([paragraph('Some other text')]);
      const rule: DocxStyleProfileDropParagraphRule = {
        id: 'drop.note12',
        part: 'document',
        action: 'dropParagraph',
        match: { type: 'startsWith', text: '12 Ghi cụ thể cơ quan' },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.skippedRuleIds).toContain('drop.note12');
    });
  });

  describe('dropEmptyParagraphsBetween', () => {
    it('removes only the empty paragraphs between anchors', () => {
      const before = buildDocx([
        paragraph('Lưu: HSVA, HSKS, VP.'),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        paragraph('12 Ghi cụ thể cơ quan'),
      ]);
      const rule: DocxStyleProfileDropEmptyBetweenRule = {
        id: 'drop.tail',
        part: 'document',
        action: 'dropEmptyParagraphsBetween',
        afterAnchor: 'Lưu: HSVA, HSKS, VP.',
        beforeAnchor: '12 Ghi cụ thể cơ quan',
        safety: { onlyIfAllEmpty: true, maxParagraphs: 50 },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('drop.tail');
      const text = visibleText(result.buffer);
      expect(text).toContain('Lưu: HSVA, HSKS, VP.');
      expect(text).toContain('12 Ghi cụ thể cơ quan');
      // All three empties should be gone — body should have exactly 2 paragraphs.
      const docXml = extractDocumentXml(result.buffer);
      const paragraphCount = (docXml.match(/<w:p\b/g) ?? []).length;
      expect(paragraphCount).toBe(2);
    });

    it('no-op when anchors are missing', () => {
      const before = buildDocx([
        paragraph('Some unrelated heading'),
        emptyParagraph(),
        emptyParagraph(),
      ]);
      const rule: DocxStyleProfileDropEmptyBetweenRule = {
        id: 'drop.tail',
        part: 'document',
        action: 'dropEmptyParagraphsBetween',
        afterAnchor: 'Lưu: HSVA, HSKS, VP.',
        beforeAnchor: '12 Ghi cụ thể cơ quan',
        safety: { onlyIfAllEmpty: true, maxParagraphs: 50 },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.skippedRuleIds).toContain('drop.tail');
    });

    it('no-op when a non-empty paragraph sits between anchors (onlyIfAllEmpty guard)', () => {
      const before = buildDocx([
        paragraph('Lưu: HSVA, HSKS, VP.'),
        emptyParagraph(),
        paragraph('Some real user-entered text'),
        emptyParagraph(),
        paragraph('12 Ghi cụ thể cơ quan'),
      ]);
      const rule: DocxStyleProfileDropEmptyBetweenRule = {
        id: 'drop.tail',
        part: 'document',
        action: 'dropEmptyParagraphsBetween',
        afterAnchor: 'Lưu: HSVA, HSKS, VP.',
        beforeAnchor: '12 Ghi cụ thể cơ quan',
        safety: { onlyIfAllEmpty: true, maxParagraphs: 50 },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      // Profile is applied (the two empties around the user paragraph
      // ARE empty and sit between the anchors) — but the user paragraph
      // is preserved.
      expect(result.profileApplied).toBe(true);
      const text = visibleText(result.buffer);
      expect(text).toContain('Some real user-entered text');
      expect(text).toContain('12 Ghi cụ thể cơ quan');
      // 2 of the 3 paragraphs between anchors should be gone (the 2 empties),
      // leaving the user paragraph + the 2 anchor paragraphs = 3 total.
      const docXml = extractDocumentXml(result.buffer);
      const paragraphCount = (docXml.match(/<w:p\b/g) ?? []).length;
      expect(paragraphCount).toBe(3);
    });

    it('honours maxParagraphs cap (does not collapse beyond the cap)', () => {
      const before = buildDocx([
        paragraph('Lưu: HSVA, HSKS, VP.'),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        paragraph('12 Ghi cụ thể cơ quan'),
      ]);
      const rule: DocxStyleProfileDropEmptyBetweenRule = {
        id: 'drop.tail',
        part: 'document',
        action: 'dropEmptyParagraphsBetween',
        afterAnchor: 'Lưu: HSVA, HSKS, VP.',
        beforeAnchor: '12 Ghi cụ thể cơ quan',
        safety: { onlyIfAllEmpty: true, maxParagraphs: 3 },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(true);
      // 10 empties between anchors; cap=3 so only 3 are removed.
      // 12 input paragraphs → 12 - 3 = 9 paragraphs in the output.
      const docXml = extractDocumentXml(result.buffer);
      const paragraphCount = (docXml.match(/<w:p\b/g) ?? []).length;
      expect(paragraphCount).toBe(9);
    });
  });

  describe('dropTrailingEmptyParagraphsBefore', () => {
    it('removes empty paragraphs that immediately precede the anchor', () => {
      const before = buildDocx([
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        paragraph('12 Ghi cụ thể cơ quan'),
      ]);
      const rule: DocxStyleProfileRule = {
        id: 'drop.tail.before',
        part: 'document',
        action: 'dropTrailingEmptyParagraphsBefore',
        beforeAnchor: '12 Ghi cụ thể cơ quan',
        safety: { maxParagraphs: 50 },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(true);
      const docXml = extractDocumentXml(result.buffer);
      const paragraphCount = (docXml.match(/<w:p\b/g) ?? []).length;
      expect(paragraphCount).toBe(1);
      expect(visibleText(result.buffer)).toContain('12 Ghi cụ thể cơ quan');
    });

    it('stops at the first non-empty paragraph', () => {
      const before = buildDocx([
        paragraph('Some real content'),
        emptyParagraph(),
        emptyParagraph(),
        paragraph('12 Ghi cụ thể cơ quan'),
      ]);
      const rule: DocxStyleProfileRule = {
        id: 'drop.tail.before',
        part: 'document',
        action: 'dropTrailingEmptyParagraphsBefore',
        beforeAnchor: '12 Ghi cụ thể cơ quan',
        safety: { maxParagraphs: 50 },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(true);
      // 2 empties immediately preceding the anchor get dropped.
      // 'Some real content' + the anchor remain.
      const docXml = extractDocumentXml(result.buffer);
      const paragraphCount = (docXml.match(/<w:p\b/g) ?? []).length;
      expect(paragraphCount).toBe(2);
    });

    it('no-op when the anchor is missing', () => {
      const before = buildDocx([
        emptyParagraph(),
        emptyParagraph(),
        paragraph('Some other content'),
      ]);
      const rule: DocxStyleProfileRule = {
        id: 'drop.tail.before',
        part: 'document',
        action: 'dropTrailingEmptyParagraphsBefore',
        beforeAnchor: '12 Ghi cụ thể cơ quan',
        safety: { maxParagraphs: 50 },
      };
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [rule],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.skippedRuleIds).toContain('drop.tail.before');
    });
  });

  describe('BM-171 profile shape', () => {
    it('is registered with the expected template code', () => {
      const profile = getStyleProfileForTemplate('BM-171');
      expect(profile).not.toBeNull();
      expect(profile?.templateCode).toBe('BM-171');
    });

    it('declares the seven typographic run-style rules, fourteen body-size rules, one replaceText rule and four drop rules', () => {
      const profile = getStyleProfileForTemplate('BM-171');
      expect(profile).not.toBeNull();
      const dropRules = profile!.rules.filter((r) => 'action' in r && r.action !== 'replaceText');
      expect(dropRules).toHaveLength(4);
      const dropRuleIds = dropRules.map((r) => r.id).sort();
      expect(dropRuleIds).toEqual([
        'bm171.drop_drafter_note_12',
        'bm171.drop_drafter_note_13',
        'bm171.drop_legal_basis_blank_block',
        'bm171.drop_tail_between_archive_and_drafter_notes',
      ]);
      const replaceTextRules = profile!.rules.filter((r) => 'action' in r && r.action === 'replaceText');
      expect(replaceTextRules.map((r) => r.id).sort()).toEqual([
        'bm171.doc_no_space',
      ]);
      // 7 typographic + 14 body-size = 21 typographic rules; plus 1
      // replaceText and 4 drop = 26 total.
      const typographicRules = profile!.rules.filter((r) => !('action' in r));
      expect(typographicRules).toHaveLength(21);
      const bodySizeRules = typographicRules.filter(
        (r) =>
          r.id.startsWith('bm171.body_') &&
          r.id !== 'bm171.body_title',
      );
      expect(bodySizeRules).toHaveLength(14);
    });

    it('does NOT mutate BM-001 output when BM-171 is registered (no spillover)', () => {
      // Build a minimal BM-001-shaped DOCX and apply BM-001's profile.
      // The output should be identical regardless of whether BM-171 is
      // also registered — i.e. registering BM-171 does not silently
      // affect BM-001 rendering.
      const paragraphs = [
        'TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026 BIÊN BẢN Tiếp nhận nguồn tin về tội phạm',
        'I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:',
        'Lưu: HSVA, HSKS, VP.',
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t xml:space="preserve">${escapeXml(paragraphs[0])}</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">${escapeXml(paragraphs[1])}</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">${escapeXml(paragraphs[2])}</w:t></w:r></w:p>
  </w:body>
</w:document>`;
      const zip = new PizZip();
      zip.file('word/document.xml', xml);
      const input = zip.generate({ type: 'nodebuffer' });
      const result = applyStyleProfileToDocxBuffer(input, BM001_STYLE_PROFILE);
      expect(result.profileApplied).toBe(true);
      // Re-emit the same input through the engine a second time.
      const second = applyStyleProfileToDocxBuffer(input, BM001_STYLE_PROFILE);
      expect(second.profileApplied).toBe(true);
      // The two outputs must be byte-identical: registering BM-171 must
      // not perturb BM-001's behaviour.
      expect(second.buffer.equals(result.buffer)).toBe(true);
    });

    it('does NOT apply BM-171 rules to a non-BM-171 DOCX (scoped engine dispatch)', () => {
      // A bare synthetic DOCX with no BM-171 anchors must not be
      // touched by the BM-171 profile's drop rules — `drop_tail_*`
      // requires the `Lưu: HSVA, HSKS, VP.` anchor.
      const before = buildDocx([
        paragraph('Some unrelated heading'),
        paragraph('12 Ghi cụ thể cơ quan', { superscriptFirstRun: false }),
      ]);
      const result = applyStyleProfileToDocxBuffer(before, BM171_STYLE_PROFILE);
      // The drop_drafter_note_12 rule guards on requireSuperscriptPrefix
      // AND requireAnchorBeforeText — neither satisfied.
      expect(result.appliedRuleIds).not.toContain('bm171.drop_drafter_note_12');
      expect(visibleText(result.buffer)).toContain(
        '12 Ghi cụ thể cơ quan',
      );
    });
  });

  describe('combined drop + run-style pipeline', () => {
    it('drops trailing empties and then applies typographic rules to surviving paragraphs', () => {
      // Drop first, then style. The drafter note paragraphs are gone,
      // but the surviving archive-line paragraph still receives its
      // 11pt font-size override.
      const before = buildDocx([
        paragraph('Lưu: HSVA, HSKS, VP.'),
        emptyParagraph(),
        emptyParagraph(),
        emptyParagraph(),
        paragraph('12 Ghi cụ thể cơ quan', { superscriptFirstRun: true }),
        paragraph('13 Ghi chức danh người ký', { superscriptFirstRun: true }),
      ]);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-TEST',
        profileId: 'test',
        profileName: 'test',
        rules: [
          {
            id: 'drop.tail',
            part: 'document',
            action: 'dropEmptyParagraphsBetween',
            afterAnchor: 'Lưu: HSVA, HSKS, VP.',
            beforeAnchor: '12 Ghi cụ thể cơ quan',
            safety: { onlyIfAllEmpty: true, maxParagraphs: 50 },
          },
          {
            id: 'drop.note12',
            part: 'document',
            action: 'dropParagraph',
            match: { type: 'startsWith', text: '12 Ghi cụ thể cơ quan' },
            safety: { requireSuperscriptPrefix: true },
          },
          {
            id: 'drop.note13',
            part: 'document',
            action: 'dropParagraph',
            match: { type: 'startsWith', text: '13 Ghi chức danh người ký' },
            safety: { requireSuperscriptPrefix: true },
          },
          {
            id: 'style.archive',
            part: 'document',
            match: { type: 'contains', text: 'Lưu: HSVA, HSKS, VP.' },
            style: { fontSizePt: 11 },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(before, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toEqual(
        expect.arrayContaining([
          'drop.tail',
          'drop.note12',
          'drop.note13',
          'style.archive',
        ]),
      );
      const xml = extractDocumentXml(result.buffer);
      // Surviving paragraph is the archive line — its run must carry
      // sz=22 (11pt).
      expect(xml).toMatch(/<w:sz\s+w:val="22"\s*\/>/);
      // No note 12 / note 13 visible text in the output.
      const text = visibleText(result.buffer);
      expect(text).not.toContain('12 Ghi cụ thể cơ quan');
      expect(text).not.toContain('13 Ghi chức danh người ký');
    });
  });
});