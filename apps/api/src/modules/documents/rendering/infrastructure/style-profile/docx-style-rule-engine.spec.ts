/**
 * PR6G.4 — Generic Style Profile Engine: unit tests.
 *
 * Scope:
 *   - No-op byte-identical contract when no profile is registered
 *     (covers the engine safety property documented in
 *     `docx-style-rule-engine.ts`).
 *   - BM-001 profile rules produce the documented style mutations in
 *     `word/document.xml`.
 *   - Run-splitting safety when matches span multiple `<w:t>` runs.
 *   - Profile registry re-registration behaviour.
 *   - Profile lookup returns null for unknown templates.
 *
 * The Docxtemplater integration test (engine + fill pipeline) lives
 * in `docxtemplater-contract-render-engine-style-profile.spec.ts`
 * so the engine can be tested without loading the locked BM-001
 * template.
 *
 * @module rendering/infrastructure/style-profile
 */

import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import PizZip from 'pizzip';

import { DocxtemplaterContractRenderEngine } from '../docxtemplater-contract-render-engine';
import { ContractRenderPlanBuilder } from '../../application/contract-render-plan.builder';
import { applyStyleProfileToDocxBuffer } from './docx-style-rule-engine';
import {
  __resetStyleProfileRegistryForTests,
  BM001_STYLE_PROFILE,
  ensureStyleProfilesRegistered,
  getStyleProfileForTemplate,
  listRegisteredTemplateCodes,
  registerStyleProfile,
} from './index';
import type { DocxStyleProfile } from './docx-style-profile.types';
import type { WorkspacePathsService } from '../../../../../infrastructure/paths/workspace-paths.service';

const REPO_ROOT = join(process.cwd(), '..', '..');

function buildMinimalDocumentXml(paragraphs: ReadonlyArray<string>): string {
  const paragraphsXml = paragraphs
    .map(
      (text) =>
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphsXml}</w:body>
</w:document>`;
}

function buildSyntheticDocx(
  paragraphs: ReadonlyArray<string>,
  options: { extras?: Record<string, string> } = {},
): Buffer {
  const zip = new PizZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
  zip.file('word/document.xml', buildMinimalDocumentXml(paragraphs));
  for (const [path, content] of Object.entries(options.extras ?? {})) {
    zip.file(path, content);
  }
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractDocumentXml(buffer: Buffer): string {
  const zip = new PizZip(buffer);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('synthetic DOCX missing word/document.xml');
  return file.asText();
}

function hasRunProperty(
  documentXml: string,
  matchedText: string,
  propertyTag: 'b' | 'i' | 'sz' | 'szCs',
  expectedValue?: string,
): boolean {
  // Locate a <w:t>…matchedText…</w:t> run, then walk back to its
  // containing <w:r> and assert the requested child is present.
  const escaped = escapeXml(matchedText);
  const runMatch = documentXml.match(
    new RegExp(`<w:r\\b[^>]*>([\\s\\S]*?)<\\/w:r>`, 'g'),
  );
  if (!runMatch) return false;
  for (const run of runMatch) {
    if (!run.includes(matchedText) && !run.includes(escaped)) continue;
    const propRegex = new RegExp(`<w:${propertyTag}\\b([^/>]*)\\/?>`);
    const match = run.match(propRegex);
    if (!match) continue;
    if (expectedValue === undefined) return true;
    const attrMatch = match[1].match(/w:val="([^"]+)"/);
    if (!attrMatch) return false;
    return attrMatch[1] === expectedValue;
  }
  return false;
}

function findRunFor(documentXml: string, matchedText: string): string | null {
  const escaped = escapeXml(matchedText);
  const runMatch = documentXml.match(
    new RegExp(`<w:r\\b[^>]*>[\\s\\S]*?<\\/w:r>`, 'g'),
  );
  if (!runMatch) return null;
  for (const run of runMatch) {
    if (run.includes(matchedText) || run.includes(escaped)) return run;
  }
  return null;
}

describe('PR6G.4 — Generic Style Profile Engine', () => {
  beforeAll(() => {
    ensureStyleProfilesRegistered();
  });

  beforeEach(() => {
    __resetStyleProfileRegistryForTests();
    ensureStyleProfilesRegistered();
  });

  describe('no-op safety contract', () => {
    it('returns input buffer byte-identical when no profile is provided', () => {
      const input = buildSyntheticDocx(['BIÊN BẢN', 'NGƯỜI TIẾP NHẬN']);
      const result = applyStyleProfileToDocxBuffer(input, null);
      expect(result.profileApplied).toBe(false);
      expect(result.buffer).toBe(input);
      expect(result.appliedRuleIds).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('returns input buffer byte-identical when profile has zero rules', () => {
      const input = buildSyntheticDocx(['BIÊN BẢN']);
      const emptyProfile: DocxStyleProfile = {
        templateCode: 'BM-999',
        profileId: 'empty',
        profileName: 'empty',
        rules: [],
      };
      const result = applyStyleProfileToDocxBuffer(input, emptyProfile);
      expect(result.profileApplied).toBe(false);
      expect(result.buffer).toBe(input);
    });

    it('returns input buffer byte-identical when no rule produces a match', () => {
      const input = buildSyntheticDocx(['Some unrelated paragraph']);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-999',
        profileId: 'no-match',
        profileName: 'no-match',
        rules: [
          {
            id: 'rule.bodyTitle',
            part: 'document',
            match: { type: 'exactText', text: 'BIÊN BẢN' },
            style: { bold: true, fontSizePt: 14 },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(input, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.buffer).toBe(input);
    });

    it('does not mutate input buffer when it produces a new DOCX', () => {
      const input = buildSyntheticDocx(['BIÊN BẢN']);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.bodyTitle',
            part: 'document',
            match: { type: 'exactText', text: 'BIÊN BẢN' },
            style: { bold: true, fontSizePt: 14 },
          },
        ],
      };
      const inputBytesBefore = input.toString('utf8');
      const result = applyStyleProfileToDocxBuffer(input, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.buffer).not.toBe(input);
      expect(input.toString('utf8')).toBe(inputBytesBefore);
    });
  });

  describe('BM-001 profile rules', () => {
    let renderedDocXml: string;
    let renderedBuffer: Buffer;

    beforeAll(() => {
      // The paragraphs below mirror the structural shape of the real
      // BM-001 rendered DOCX (verified in the integration spec):
      //   - body title / subtitle / place-date live in a single header
      //     paragraph;
      //   - heading I sits inside a paragraph that starts with
      //     "Là người đại diện...";
      //   - signature titles live in signature blocks that also
      //     contain other wording.
      // The engine must apply typographic overrides to the matched
      // SUBSTRING only, leaving surrounding text untouched.
      const paragraphs = [
        'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026 BIÊN BẢN Tiếp nhận nguồn tin về tội phạm',
        'Là người đại diện của cơ quan, tổ chức (nếu có):  I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM:',
        'II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có):',
        'Ngoài nguồn tin về tội phạm và tài liệu, đồ vật có liên quan đã nhận nêu trên chúng tôi không giao, nhận thêm bất cứ tài liệu, đồ vật nào khác. Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi 10:00 ngày 26 tháng 12 năm 2025. Biên bản này đã được đọc lại cho những người có tên trên nghe, công nhận đúng và cùng ký tên xác nhận dưới dây. Biên bản này được lập thành 02 bản, mỗi bên giữ 01 bản./.NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM',
        'NGƯỜI TIẾP NHẬN',
        'Lưu: HSVA, HSKS, VP.',
      ];
      const buffer = buildSyntheticDocx(paragraphs);
      const result = applyStyleProfileToDocxBuffer(buffer, BM001_STYLE_PROFILE);
      expect(result.profileApplied).toBe(true);
      renderedBuffer = result.buffer;
      renderedDocXml = extractDocumentXml(renderedBuffer);
    });

    it('applies italic + 14pt to the place-date line', () => {
      const placeDateRun = findRunFor(renderedDocXml, 'TP. Hồ Chí Minh,');
      expect(placeDateRun).not.toBeNull();
      expect(placeDateRun).toMatch(/<w:i\b/);
      expect(placeDateRun).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
      expect(placeDateRun).toMatch(/<w:szCs\s+w:val="28"\s*\/>/);
    });

    it('applies bold + 14pt to the body title "BIÊN BẢN"', () => {
      const run = findRunFor(renderedDocXml, 'BIÊN BẢN');
      expect(run).not.toBeNull();
      expect(run).toMatch(/<w:b\b/);
      expect(run).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
      expect(run).toMatch(/<w:szCs\s+w:val="28"\s*\/>/);
      expect(run).not.toMatch(/<w:i\b/);
    });

    it('applies bold + 14pt to the subtitle', () => {
      const run = findRunFor(
        renderedDocXml,
        'Tiếp nhận nguồn tin về tội phạm',
      );
      expect(run).not.toBeNull();
      expect(run).toMatch(/<w:b\b/);
      expect(run).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });

    it('applies bold + 14pt to heading I (startsWith "I. NỘI DUNG")', () => {
      const run = findRunFor(renderedDocXml, 'I. NỘI DUNG');
      expect(run).not.toBeNull();
      expect(run).toMatch(/<w:b\b/);
      expect(run).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });

    it('applies bold + 14pt to heading II (startsWith "II. CÁC TÀI LIỆU")', () => {
      const run = findRunFor(renderedDocXml, 'II. CÁC TÀI LIỆU');
      expect(run).not.toBeNull();
      expect(run).toMatch(/<w:b\b/);
      expect(run).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });

    it('applies bold + 14pt to the informant signature title', () => {
      const run = findRunFor(
        renderedDocXml,
        'NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM',
      );
      expect(run).not.toBeNull();
      expect(run).toMatch(/<w:b\b/);
      expect(run).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });

    it('applies bold + 14pt to the receiver signature title', () => {
      const run = findRunFor(renderedDocXml, 'NGƯỜI TIẾP NHẬN');
      expect(run).not.toBeNull();
      expect(run).toMatch(/<w:b\b/);
      expect(run).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });

    it('applies 11pt to the archive line and does NOT bold/italic it', () => {
      const run = findRunFor(renderedDocXml, 'Lưu: HSVA, HSKS, VP.');
      expect(run).not.toBeNull();
      expect(run).toMatch(/<w:sz\s+w:val="22"\s*\/>/);
      expect(run).toMatch(/<w:szCs\s+w:val="22"\s*\/>/);
      expect(run).not.toMatch(/<w:b\b/);
      expect(run).not.toMatch(/<w:i\b/);
    });

    it('does NOT modify a paragraph the profile has no rule for', () => {
      const run = findRunFor(
        renderedDocXml,
        'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
      );
      expect(run).not.toBeNull();
      expect(run).not.toMatch(/<w:b\b/);
      expect(run).not.toMatch(/<w:i\b/);
      expect(run).not.toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });
  });

  describe('matcher types', () => {
    it('supports contains-match across multiple paragraphs', () => {
      const buffer = buildSyntheticDocx([
        'Preamble paragraph',
        'Somewhere TP. Hồ Chí Minh, somewhere else',
        'Trailing paragraph',
      ]);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.placeDate',
            part: 'document',
            match: { type: 'contains', text: 'TP. Hồ Chí Minh,' },
            style: { italic: true, fontSizePt: 14 },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('rule.placeDate');
      const xml = extractDocumentXml(result.buffer);
      expect(xml).toMatch(/<w:i\b/);
      expect(xml).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });

    it('supports startsWith matcher', () => {
      const buffer = buildSyntheticDocx(['I. NỘI DUNG body text']);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.headingI',
            part: 'document',
            match: { type: 'startsWith', text: 'I. NỘI DUNG' },
            style: { bold: true, fontSizePt: 14 },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(true);
      const xml = extractDocumentXml(result.buffer);
      expect(xml).toMatch(/<w:b\b/);
    });

    it('supports exactText matcher (paragraph text must equal the match)', () => {
      const buffer = buildSyntheticDocx(['BIÊN BẢN']);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.title',
            part: 'document',
            match: { type: 'exactText', text: 'BIÊN BẢN' },
            style: { bold: true, fontSizePt: 14 },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(true);
      const xml = extractDocumentXml(result.buffer);
      expect(hasRunProperty(xml, 'BIÊN BẢN', 'b')).toBe(true);
    });

    it('rejects exactText when paragraph text has trailing characters', () => {
      const buffer = buildSyntheticDocx(['BIÊN BẢN — extended title']);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.title',
            part: 'document',
            match: { type: 'exactText', text: 'BIÊN BẢN' },
            style: { bold: true, fontSizePt: 14 },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.appliedRuleIds).toEqual([]);
    });
  });

  describe('run splitting', () => {
    it('preserves the matched fragment when target text is split across two runs', () => {
      const splitDocXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t xml:space="preserve">TP. Hồ Chí </w:t></w:r>
      <w:r><w:t xml:space="preserve">Minh, ngày 04 tháng 07 năm 2026</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
      const zip = new PizZip();
      zip.file('word/document.xml', splitDocXml);
      const buffer = zip.generate({ type: 'nodebuffer' });

      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.placeDate',
            part: 'document',
            match: { type: 'contains', text: 'TP. Hồ Chí Minh,' },
            style: { italic: true, fontSizePt: 14 },
          },
        ],
      };

      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(true);
      const xml = extractDocumentXml(result.buffer);
      // Visible text must still contain both halves and the date.
      const visible = concatRuns(xml);
      expect(visible).toContain('TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026');
      // The styled run must carry the italic + 14pt overrides.
      expect(xml).toMatch(/<w:i\b/);
      expect(xml).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });

    it('warns but does not throw when a contains-match falls outside any run (impossible under normal split)', () => {
      // Construct a paragraph where the contains text is only present
      // in the joined view but with raw <w:t> runs that mismatch the
      // joined index. The engine should still produce a stable buffer
      // (either applied or no-op), never throw.
      const oddDocXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t xml:space="preserve">unrelated</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
      const zip = new PizZip();
      zip.file('word/document.xml', oddDocXml);
      const buffer = zip.generate({ type: 'nodebuffer' });
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.never',
            part: 'document',
            match: { type: 'contains', text: 'BIÊN BẢN' },
            style: { bold: true },
          },
        ],
      };
      expect(() => applyStyleProfileToDocxBuffer(buffer, profile)).not.toThrow();
      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.skippedRuleIds).toContain('rule.never');
    });
  });

  describe('whitespace normalisation', () => {
    /**
     * DOCX paragraphs frequently interleave `<w:t>` runs with
     * `<w:br/>` and `<w:tab/>` elements. The engine's matcher must
     * collapse those whitespace runs so a rule authored against the
     * visible rendered text still matches.
     */
    function buildDocxWithBreak(
      beforeBreak: string,
      afterBreak: string,
    ): Buffer {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t xml:space="preserve">${escapeXml(beforeBreak)}</w:t></w:r>
      <w:r><w:br/></w:r>
      <w:r><w:t xml:space="preserve">${escapeXml(afterBreak)}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
      const zip = new PizZip();
      zip.file('word/document.xml', xml);
      return zip.generate({ type: 'nodebuffer' });
    }

    it('matches contains-rule across a <w:br/> element', () => {
      const buffer = buildDocxWithBreak(
        'NGƯỜI CUNG CẤP NGUỒN TIN ',
        'VỀ TỘI PHẠM',
      );
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.signature',
            part: 'document',
            match: {
              type: 'contains',
              text: 'NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM',
            },
            style: { bold: true, fontSizePt: 14 },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('rule.signature');
    });

    it('matches contains-rule across multiple whitespace characters', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t xml:space="preserve">NGƯỜI   CUNG </w:t></w:r>
      <w:r><w:t xml:space="preserve">CẤP NGUỒN TIN VỀ TỘI PHẠM</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
      const zip = new PizZip();
      zip.file('word/document.xml', xml);
      const buffer = zip.generate({ type: 'nodebuffer' });
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.signature',
            part: 'document',
            match: {
              type: 'contains',
              text: 'NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM',
            },
            style: { bold: true },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('rule.signature');
    });

    it('does not collapse whitespace inside exactText when the paragraph is identical post-collapse', () => {
      const buffer = buildDocxWithBreak('BIÊN BẢN', '');
      const profile: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'inline',
        profileName: 'inline',
        rules: [
          {
            id: 'rule.title',
            part: 'document',
            match: { type: 'exactText', text: 'BIÊN BẢN' },
            style: { bold: true },
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(buffer, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('rule.title');
    });
  });

  describe('registry semantics', () => {
    it('returns null when the template has no profile', () => {
      expect(getStyleProfileForTemplate('BM-NOT-REGISTERED')).toBeNull();
    });

    it('returns the BM-001 profile after registration', () => {
      const profile = getStyleProfileForTemplate('BM-001');
      expect(profile).not.toBeNull();
      expect(profile?.templateCode).toBe('BM-001');
    });

    it('overrides a profile when re-registered under the same code', () => {
      const override: DocxStyleProfile = {
        templateCode: 'BM-001',
        profileId: 'override',
        profileName: 'override',
        rules: [
          {
            id: 'rule.override',
            part: 'document',
            match: { type: 'exactText', text: 'OVERRIDDEN' },
            style: { bold: true },
          },
        ],
      };
      registerStyleProfile(override);
      const profile = getStyleProfileForTemplate('BM-001');
      expect(profile?.profileId).toBe('override');
      expect(profile?.rules[0].id).toBe('rule.override');
    });

    it('lists every registered template code (sorted)', () => {
      registerStyleProfile({
        templateCode: 'BM-AAA',
        profileId: 'a',
        profileName: 'a',
        rules: [],
      });
      registerStyleProfile({
        templateCode: 'BM-ZZZ',
        profileId: 'z',
        profileName: 'z',
        rules: [],
      });
      const codes = listRegisteredTemplateCodes();
      expect(codes).toContain('BM-001');
      expect(codes).toContain('BM-AAA');
      expect(codes).toContain('BM-ZZZ');
      const sorted = [...codes].sort();
      expect(codes).toEqual(sorted);
    });
  });

  // PR7B.1 — `replaceText` rule action.
  describe('PR7B.1 — replaceText rule action', () => {
    it('injects the missing space after `Số:` for the BM-171 documentCode paragraph', () => {
      const input = buildSyntheticDocx([
        'Số:01/QĐ-VKSKV7',
        'Some other paragraph that must NOT be touched',
      ]);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-PR7B',
        profileId: 'pr7b-replace-text',
        profileName: 'replace-text smoke',
        rules: [
          {
            id: 'doc_no_space',
            part: 'document',
            action: 'replaceText',
            paragraphMatch: '01/QĐ-VKSKV7',
            match: 'Số:01',
            replacement: 'Số: 01',
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(input, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('doc_no_space');
      const xml = extractDocumentXml(result.buffer);
      expect(concatRuns(xml)).toContain('Số: 01/QĐ-VKSKV7');
      // Untouched paragraph survives byte-identical
      expect(concatRuns(xml)).toContain(
        'Some other paragraph that must NOT be touched',
      );
    });

    it('records a warning and skips when no paragraph matches `paragraphMatch`', () => {
      const input = buildSyntheticDocx(['Unrelated body text']);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-PR7B-NOOP',
        profileId: 'no-match',
        profileName: 'no-match',
        rules: [
          {
            id: 'doc_no_space',
            part: 'document',
            action: 'replaceText',
            paragraphMatch: '01/QĐ-VKSKV7',
            match: 'Số:01',
            replacement: 'Số: 01',
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(input, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.skippedRuleIds).toContain('doc_no_space');
      expect(result.warnings.join('\n')).toMatch(/no paragraph matched/);
    });

    it('skips an empty `match` string with a warning (safety guard)', () => {
      const input = buildSyntheticDocx(['Số:01/QĐ-VKSKV7']);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-PR7B-EMPTY',
        profileId: 'empty-match',
        profileName: 'empty-match',
        rules: [
          {
            id: 'doc_no_space_empty',
            part: 'document',
            action: 'replaceText',
            paragraphMatch: 'Số:01',
            match: '',
            replacement: 'whatever',
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(input, profile);
      expect(result.profileApplied).toBe(false);
      expect(result.skippedRuleIds).toContain('doc_no_space_empty');
      expect(result.warnings.join('\n')).toMatch(/empty match string/);
    });

    it('runs replaceText BEFORE run-style rules so heading styling still fires after the rewrite', () => {
      const input = buildSyntheticDocx(['Số:01/QĐ-VKSKV7']);
      const profile: DocxStyleProfile = {
        templateCode: 'BM-PR7B-ORDER',
        profileId: 'order',
        profileName: 'order',
        rules: [
          // Run-style rule that targets the same paragraph and
          // bolds any `01/QĐ` substring. Must fire AFTER replaceText.
          {
            id: 'bold_doc_no',
            part: 'document',
            match: { type: 'contains', text: '01/QĐ' },
            style: { bold: true, fontSizePt: 14 },
          },
          {
            id: 'doc_no_space',
            part: 'document',
            action: 'replaceText',
            paragraphMatch: '01/QĐ-VKSKV7',
            match: 'Số:01',
            replacement: 'Số: 01',
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(input, profile);
      expect(result.profileApplied).toBe(true);
      expect(result.appliedRuleIds).toContain('doc_no_space');
      expect(result.appliedRuleIds).toContain('bold_doc_no');
      const xml = extractDocumentXml(result.buffer);
      expect(concatRuns(xml)).toContain('Số: 01/QĐ-VKSKV7');
    });

    it('does NOT duplicate the replacement when the match crosses run boundaries', () => {
      // The BM-171 normalized template splits `Số:{{document.documentCode}}`
      // into two runs: `Số:` and `01/QĐ-VKSKV7`. The cross-run match
      // `Số:01` was being replaced TWICE in the engine's first
      // implementation, producing `Số: 01Số: 01/QĐ-VKSKV7`. The fix
      // emits the replacement exactly once, attached to the FIRST
      // affected segment.
      const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>Số:</w:t></w:r>
      <w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>01/QĐ-VKSKV7</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
      const zip = new PizZip();
      zip.file('word/document.xml', docxXml);
      const input = zip.generate({ type: 'nodebuffer' });
      const profile: DocxStyleProfile = {
        templateCode: 'BM-PR7B-CROSSRUN',
        profileId: 'cross-run',
        profileName: 'cross-run replacement',
        rules: [
          {
            id: 'doc_no_space',
            part: 'document',
            action: 'replaceText',
            paragraphMatch: '01/QĐ-VKSKV7',
            match: 'Số:01',
            replacement: 'Số: 01',
          },
        ],
      };
      const result = applyStyleProfileToDocxBuffer(input, profile);
      expect(result.profileApplied).toBe(true);
      const xml = extractDocumentXml(result.buffer);
      expect(concatRuns(xml)).toBe('Số: 01/QĐ-VKSKV7');
      // No duplication: count occurrences of "Số: 01".
      const occurrences = (concatRuns(xml).match(/Số: 01/g) ?? []).length;
      expect(occurrences).toBe(1);
    });
  });
});

function concatRuns(documentXml: string): string {
  const matches = documentXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) ?? [];
  return matches
    .map((entry) => entry.replace(/<w:t\b[^>]*>/, '').replace(/<\/w:t>/, ''))
    .join('');
}