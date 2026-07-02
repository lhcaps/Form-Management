/**
 * DOCX Style Audit Service — unit tests
 *
 * @module documents/style
 */

import {
  DocxStyleAuditService,
} from './docx-style-audit.service';
import { VKS_KHU_VUC_7_STYLE_PROFILE } from './vks-khu-vuc-7-style-profile';

function makeParts(
  overrides: Partial<{
    documentXml: string;
    stylesXml: string;
    settingsXml: string;
    headerXmls: string[];
    footerXmls: string[];
  }> = {},
) {
  return {
    documentXml: overrides.documentXml ?? '',
    stylesXml: overrides.stylesXml,
    settingsXml: overrides.settingsXml,
    headerXmls: overrides.headerXmls ?? [],
    footerXmls: overrides.footerXmls ?? [],
  };
}

describe('DocxStyleAuditService', () => {
  let service: DocxStyleAuditService;

  beforeEach(() => {
    service = new DocxStyleAuditService();
  });

  describe('auditDocxFromParts', () => {
    it('returns PASS when all major checks pass', async () => {
      const parts = makeParts({
        documentXml:
          '<w:r><w:rFonts w:ascii="Times New Roman"/></w:r>' +
          '<w:t>VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH</w:t>' +
          '<w:r><w:rPr><w:b/></w:rPr><w:t>KHU VỰC 7</w:t></w:r>' +
          '<w:t>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</w:t>' +
          '<w:t>Độc lập - Tự do - Hạnh phúc</w:t>' +
          '<w:p><w:t>ngày 15 tháng 06 năm 2026</w:t></w:p>' +
          '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>QUYẾT ĐỊNH</w:t></w:r>' +
          '<w:r><w:rPr><w:b/></w:rPr><w:t>Điều 1</w:t></w:r>' +
          '<w:t>Nơi nhận:</w:t>' +
          '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>VIỆN TRƯỞNG</w:t></w:r>',
        stylesXml:
          '<w:style w:type="paragraph" w:styleId="Normal">' +
          '<w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="26"/></w:rPr>' +
          '</w:style>',
        settingsXml:
          '<w:settings><w:defaultTabStop w:val="720"/></w:settings>',
      });

      const result = await service.auditDocxFromParts(parts);

      expect(result.status).toBe('PASS');
      expect(result.profileId).toBe('vks-khu-vuc-7');
      expect(result.profileName).toBe('Viện Kiểm Sát Nhân Dân Khu Vực 7');
      expect(result.findings).toBeDefined();
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('returns WARN when no checks pass and no fails exist', async () => {
      const parts = makeParts({
        documentXml: '<w:t>Completely unrelated content</w:t>',
      });

      const result = await service.auditDocxFromParts(parts);

      // No passes, no fails, no warnings → overall is WARN
      expect(result.status).toBe('WARN');
    });

    it('returns FAIL when a check fails', async () => {
      // FMT-001 with 14pt instead of 13pt triggers fail
      const parts = makeParts({
        documentXml: '<w:document/>',
        stylesXml:
          '<w:style w:type="paragraph" w:styleId="Normal">' +
          '<w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="28"/></w:rPr>' +
          '</w:style>',
      });

      const result = await service.auditDocxFromParts(parts);

      expect(result.status).toBe('FAIL');
    });

    it('includes recommendation for missing Different First Page', async () => {
      const parts = makeParts({
        documentXml: '<w:t>Document without titlePg</w:t>',
      });

      const result = await service.auditDocxFromParts(parts);
      const fmt017 = result.findings.find((f) => f.code === 'FMT-017');

      expect(fmt017?.recommendation).toContain('w:titlePg');
      expect(fmt017?.recommendation).toContain('section properties');
    });

    it('maps finding location correctly for each check type', async () => {
      const parts = makeParts({
        documentXml:
          '<w:t>VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH</w:t>' +
          '<w:t>Nơi nhận:</w:t>',
        settingsXml: '<w:settings/>',
      });

      const result = await service.auditDocxFromParts(parts);

      const headerFinding = result.findings.find((f) => f.code === 'FMT-002');
      const footerFinding = result.findings.find((f) => f.code === 'FMT-013');
      const settingsFinding = result.findings.find((f) => f.code === 'FMT-017');

      expect(headerFinding?.location).toBe('header');
      expect(footerFinding?.location).toBe('footer');
      expect(settingsFinding?.location).toBe('settings');
    });

    it('includes raw audit for tooling/debug', async () => {
      const parts = makeParts({
        documentXml: '<w:t>Test</w:t>',
      });

      const result = await service.auditDocxFromParts(parts);

      expect(result.rawAudit).toBeDefined();
      expect(result.rawAudit.checks).toBeDefined();
      expect(Array.isArray(result.rawAudit.checks)).toBe(true);
    });
  });
});

describe('VKS_KHU_VUC_7_STYLE_PROFILE', () => {
  it('exports profile with correct identity', () => {
    expect(VKS_KHU_VUC_7_STYLE_PROFILE.profileId).toBe('vks-khu-vuc-7');
    expect(VKS_KHU_VUC_7_STYLE_PROFILE.profileName).toBe(
      'Viện Kiểm Sát Nhân Dân Khu Vực 7',
    );
  });

  it('defines correct global font settings', () => {
    expect(VKS_KHU_VUC_7_STYLE_PROFILE.global.fontFamily).toBe('Times New Roman');
    expect(VKS_KHU_VUC_7_STYLE_PROFILE.global.baseFontSizeHalfPoints).toBe(26); // 13pt
  });

  it('defines header left agency text', () => {
    expect(VKS_KHU_VUC_7_STYLE_PROFILE.headerLeft.parentAgency.text).toBe(
      'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
    );
    expect(VKS_KHU_VUC_7_STYLE_PROFILE.headerLeft.issuingAgency.bold).toBe(true);
    expect(VKS_KHU_VUC_7_STYLE_PROFILE.headerLeft.issuingAgency.underlineUnder).toBe(
      'KHU VỰC 7',
    );
  });

  it('defines circular reference with correct size', () => {
    expect(
      VKS_KHU_VUC_7_STYLE_PROFILE.template.circularReference
        .fontSizeHalfPoints,
    ).toBe(16); // 8pt
    expect(
      VKS_KHU_VUC_7_STYLE_PROFILE.template.circularReference.text,
    ).toContain('Thông tư số 03/2026/TT-VKSTC');
  });

  it('defines footer recipient label as bold italic', () => {
    const footer = VKS_KHU_VUC_7_STYLE_PROFILE.footer.recipientLabel;
    expect(footer.bold).toBe(true);
    expect(footer.italic).toBe(true);
    expect(footer.fontSizeHalfPoints).toBe(24); // 12pt
  });

  it('defines signature title as bold size 14', () => {
    const sig = VKS_KHU_VUC_7_STYLE_PROFILE.footer.signatureTitle;
    expect(sig.bold).toBe(true);
    expect(sig.fontSizeHalfPoints).toBe(28); // 14pt
    expect(sig.examples).toContain('Viện trưởng');
    expect(sig.examples).toContain('Kiểm sát viên');
  });

  it('defines Different First Page as required', () => {
    expect(VKS_KHU_VUC_7_STYLE_PROFILE.page.differentFirstPage.required).toBe(true);
  });

  it('defines page numbering threshold', () => {
    expect(
      VKS_KHU_VUC_7_STYLE_PROFILE.page.pageNumbering
        .requiredWhenPageCountExceeds,
    ).toBe(2);
  });
});
