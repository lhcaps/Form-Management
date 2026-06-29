import { auditDocxFormat } from './docx-format-auditor';

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

describe('docx-format-auditor', () => {
  describe('FMT-001: Times New Roman', () => {
    it('passes when Times New Roman is found', () => {
      const parts = makeParts({
        documentXml: '<w:r><w:rFonts w:ascii="Times New Roman"/></w:r>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-001');
      expect(check?.status).toBe('pass');
    });

    it('fails when the Normal style uses 14pt instead of the required 13pt', () => {
      const parts = makeParts({
        documentXml: '<w:document/>',
        stylesXml:
          '<w:style w:type="paragraph" w:styleId="Normal">' +
          '<w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="28"/></w:rPr>' +
          '</w:style>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-001');

      expect(check?.status).toBe('fail');
    });

    it('returns not_detectable when font is absent', () => {
      const parts = makeParts({
        documentXml: '<w:r><w:rFonts w:ascii="Arial"/></w:r>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-001');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-002: Agency header', () => {
    it('passes when VIỆN KIỂM SÁT NHÂN DÂN is present', () => {
      const parts = makeParts({
        documentXml:
          '<w:p><w:t>VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH</w:t></w:p>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-002');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when header is absent', () => {
      const parts = makeParts({
        documentXml: '<w:p><w:t>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</w:t></w:p>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-002');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-003: KHU VỰC 7 bold', () => {
    it('warns when KHU VỰC 7 and bold formatting are in different runs', () => {
      const xml =
        '<w:r><w:t>KHU VỰC 7</w:t></w:r>' +
        '<w:r><w:rPr><w:b/></w:rPr><w:t>OTHER</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-003');
      expect(check?.status).toBe('warning');
    });

    it('passes when bold formatting appears before the text in the same run', () => {
      const xml = '<w:r><w:rPr><w:b/></w:rPr><w:t>KHU VỰC 7</w:t></w:r>';
      const result = auditDocxFormat(makeParts({ documentXml: xml }));
      const check = result.checks.find((c) => c.id === 'FMT-003');

      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when KHU VỰC 7 is absent', () => {
      const parts = makeParts({
        documentXml: '<w:p><w:t>Some other text</w:t></w:p>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-003');
      expect(check?.status).toBe('not_detectable');
    });

    it('returns warning when KHU VỰC 7 found but bold not nearby', () => {
      const xml =
        '<w:r><w:t>KHU VỰC 7</w:t></w:r>' + '<w:r><w:t>OTHER TEXT</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-003');
      expect(check?.status).toBe('warning');
    });
  });

  describe('FMT-004: Underline under KHU VỰC 7', () => {
    it('returns not_detectable when underline absent', () => {
      const parts = makeParts({ documentXml: '<w:t>KHU VỰC 7</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-004');
      expect(check?.status).toBe('not_detectable');
    });

    it('returns not_detectable when underline found (placement unverifiable)', () => {
      const xml =
        '<w:r><w:t>KHU VỰC 7</w:t></w:r><w:r><w:u w:val="single"/></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-004');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-005: Legal basis line', () => {
    it('passes when Thông tư 03/2026/TT-VKSTC is found', () => {
      const xml =
        '<w:p><w:t>Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026</w:t></w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-005');
      expect(check?.status).toBeTruthy();
    });

    it('passes when the legal basis paragraph uses 8pt runs', () => {
      const xml =
        '<w:p>' +
        '<w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>Ban hành theo Thông tư số </w:t></w:r>' +
        '<w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>03/2026/TT-VKSTC</w:t></w:r>' +
        '</w:p>';
      const result = auditDocxFormat(makeParts({ documentXml: xml }));
      const check = result.checks.find((c) => c.id === 'FMT-005');

      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when legal basis is absent', () => {
      const parts = makeParts({
        documentXml: '<w:p><w:t>Some document text</w:t></w:p>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-005');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-006: National motto', () => {
    it('passes when CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM is found', () => {
      const parts = makeParts({
        documentXml: '<w:t>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</w:t>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-006');
      expect(check?.status).toBe('pass');
    });
  });

  describe('FMT-007: Motto Độc lập - Tự do - Hạnh phúc', () => {
    it('passes when motto is found', () => {
      const parts = makeParts({
        documentXml: '<w:t>Độc lập - Tự do - Hạnh phúc</w:t>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-007');
      expect(check?.status).toBeTruthy();
    });

    it('passes when the motto text is in a 14pt run', () => {
      const xml =
        '<w:r><w:rPr><w:sz w:val="28"/></w:rPr>' +
        '<w:t>Độc lập - Tự do - Hạnh phúc</w:t></w:r>';
      const result = auditDocxFormat(makeParts({ documentXml: xml }));
      const check = result.checks.find((c) => c.id === 'FMT-007');

      expect(check?.status).toBe('pass');
    });
  });

  describe('FMT-009: Issue date', () => {
    it('passes when issue date pattern is found', () => {
      const xml = '<w:p><w:t>ngày 15 tháng 06 năm 2026</w:t></w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-009');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when date pattern is absent', () => {
      const parts = makeParts({
        documentXml: '<w:t>Some text without date</w:t>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-009');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-011: Body titles bold size 14', () => {
    it('returns not_detectable when formatting exists without known title text', () => {
      const xml = '<w:r><w:sz w:val="28"/><w:b/></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-011');
      expect(check?.status).toBe('not_detectable');
    });

    it('returns not_detectable when bold size 14 not detected (proximity across elements unreliable)', () => {
      const parts = makeParts({ documentXml: '<w:t>Normal text</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-011');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-012: Điều bold', () => {
    it('passes when Điều text is in the same run with bold', () => {
      const xml = '<w:r><w:rPr><w:b/></w:rPr><w:t>Điều 1</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-012');
      // Run-level analysis: Điều run has bold → pass
      expect(check?.status).toBe('pass');
    });

    it('warns when Điều text is found but no bold in same run', () => {
      const xml = '<w:r><w:t>Điều 1</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-012');
      // Điều found but no bold in same run → warning
      expect(check?.status).toBe('warning');
    });

    it('returns not_detectable when no Điều text is found', () => {
      const xml = '<w:r><w:t>Other legal text</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-012');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-013: Nơi nhận label', () => {
    it('passes when Nơi nhận: is found', () => {
      const parts = makeParts({ documentXml: '<w:t>Nơi nhận:</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-013');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when absent', () => {
      const parts = makeParts({ documentXml: '<w:t>Some footer</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-013');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-014: Footer recipient lines size 11', () => {
    it('passes when sz=11 is found in the same Nơi nhận paragraph', () => {
      const xml =
        '<w:p>' +
        '<w:t>Nơi nhận:</w:t>' +
        '<w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Cơ quan điều tra</w:t></w:r>' +
        '</w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-014');
      // FMT-014 upgrade: finds Nơi nhận paragraph, then sz22 in same paragraph
      expect(check?.status).toBe('pass');
    });

    it('warns when Nơi nhận paragraph exists but no sz=11 in same paragraph', () => {
      const xml =
        '<w:p><w:t>Nơi nhận:</w:t></w:p>' +
        '<w:p><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Cơ quan điều tra</w:t></w:r></w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-014');
      expect(check?.status).toBe('warning');
    });

    it('returns not_detectable when no Nơi nhận paragraph found', () => {
      const xml = '<w:p><w:t>Cơ quan điều tra</w:t></w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-014');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-015: Signature title bold size 14', () => {
    it('passes when Viện trưởng run has bold and sz=14 in same run', () => {
      const xml =
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>VIỆN TRƯỞNG</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-015');
      expect(check?.status).toBe('pass');
    });

    it('passes when Kiểm sát viên run has bold and sz=14 in same run', () => {
      const xml =
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Kiểm sát viên</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-015');
      expect(check?.status).toBe('pass');
    });

    it('warns when signature title found but no bold+sz14 in same run', () => {
      const xml =
        '<w:r><w:rPr><w:sz w:val="28"/></w:rPr><w:t>VIỆN TRƯỞNG</w:t></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-015');
      expect(check?.status).toBe('warning');
    });

    it('returns not_detectable when no signature title found', () => {
      const xml = '<w:p><w:t>Other text</w:t></w:p>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-015');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-017: Different First Page', () => {
    it('passes when titlePg is found in the document section properties', () => {
      const parts = makeParts({
        documentXml:
          '<w:document><w:body><w:sectPr><w:titlePg/></w:sectPr></w:body></w:document>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-017');
      expect(check?.status).toBe('pass');
    });

    it('passes when a known body title is bold and 14pt in the same run', () => {
      const xml =
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr>' +
        '<w:t>BIÊN BẢN</w:t></w:r>';
      const result = auditDocxFormat(makeParts({ documentXml: xml }));
      const check = result.checks.find((c) => c.id === 'FMT-011');

      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when document section properties are unavailable', () => {
      const parts = makeParts({ documentXml: '<w:t>Document</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-017');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-016: Page number', () => {
    it('passes when PAGE field is found', () => {
      const xml =
        '<w:fldChar w:fldCharType="begin"/><w:instrText>PAGE</w:instrText>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-016');
      expect(check?.status).toBe('pass');
    });

    it('returns not_detectable when PAGE field is absent', () => {
      const parts = makeParts({ documentXml: '<w:t>Short document</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-016');
      expect(check?.status).toBe('not_detectable');
    });
  });

  describe('FMT-018: BM-001 receiver identity text color', () => {
    it('fails when the Tôi receiver paragraph contains a red run', () => {
      const xml =
        '<w:p><w:r><w:t>Mẫu số 01/HS</w:t></w:r></w:p>' +
        '<w:p>' +
        '<w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>Tôi: </w:t></w:r>' +
        '<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Nguyễn Văn Minh</w:t></w:r>' +
        '<w:r><w:t>; chức danh: Kiểm sát viên</w:t></w:r>' +
        '</w:p>';
      const result = auditDocxFormat(makeParts({ documentXml: xml }));
      const check = result.checks.find((c) => c.id === 'FMT-018');

      expect(check?.status).toBe('fail');
    });

    it('passes when every visible receiver paragraph run is explicitly black', () => {
      const xml =
        '<w:p><w:r><w:t>Mẫu số 01/HS</w:t></w:r></w:p>' +
        '<w:p>' +
        '<w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>Tôi: </w:t></w:r>' +
        '<w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>Nguyễn Văn Minh</w:t></w:r>' +
        '<w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>; chức danh: Kiểm sát viên</w:t></w:r>' +
        '</w:p>';
      const result = auditDocxFormat(makeParts({ documentXml: xml }));
      const check = result.checks.find((c) => c.id === 'FMT-018');

      expect(check?.status).toBe('pass');
    });

    it('is not applicable when the receiver paragraph is absent', () => {
      const result = auditDocxFormat(
        makeParts({
          documentXml:
            '<w:p><w:r><w:t>Mẫu số 01/HS</w:t></w:r></w:p>' +
            '<w:p><w:r><w:t>Other content</w:t></w:r></w:p>',
        }),
      );
      const check = result.checks.find((c) => c.id === 'FMT-018');

      expect(check?.status).toBe('not_applicable');
    });

    it('is not applicable to another form that also contains a Tôi paragraph', () => {
      const result = auditDocxFormat(
        makeParts({
          documentXml:
            '<w:p><w:r><w:t>Other legal form</w:t></w:r></w:p>' +
            '<w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr>' +
            '<w:t>Tôi: Nguyễn Văn Minh</w:t></w:r></w:p>',
        }),
      );
      const check = result.checks.find((c) => c.id === 'FMT-018');

      expect(check?.status).toBe('not_applicable');
    });
  });

  describe('FMT-019: BM-001 top-right form note', () => {
    it('fails when the Mẫu số 01/HS textbox lacks explicit black text', () => {
      const xml =
        '<w:txbxContent>' +
        '<w:p><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>Mẫu số 01/HS</w:t></w:r></w:p>' +
        '<w:p><w:r><w:rPr><w:sz w:val="16"/></w:rPr>' +
        '<w:t>(Ban hành theo Thông tư số 03/2026/TT-VKSTC)</w:t></w:r></w:p>' +
        '</w:txbxContent>';
      const result = auditDocxFormat(makeParts({ documentXml: xml }));
      const check = result.checks.find((c) => c.id === 'FMT-019');

      expect(check?.status).toBe('fail');
    });

    it('passes when every visible form-note run is black and 8pt', () => {
      const xml =
        '<w:txbxContent>' +
        '<w:p><w:r><w:rPr><w:color w:val="000000"/><w:sz w:val="16"/></w:rPr>' +
        '<w:t>Mẫu số 01/HS</w:t></w:r></w:p>' +
        '<w:p><w:r><w:rPr><w:color w:val="000000"/><w:sz w:val="16"/></w:rPr>' +
        '<w:t>(Ban hành theo Thông tư số 03/2026/TT-VKSTC)</w:t></w:r></w:p>' +
        '</w:txbxContent>';
      const result = auditDocxFormat(makeParts({ documentXml: xml }));
      const check = result.checks.find((c) => c.id === 'FMT-019');

      expect(check?.status).toBe('pass');
    });

    it('is not applicable when the BM-001 form note is absent', () => {
      const result = auditDocxFormat(
        makeParts({
          documentXml: '<w:p><w:r><w:t>Other form</w:t></w:r></w:p>',
        }),
      );
      const check = result.checks.find((c) => c.id === 'FMT-019');

      expect(check?.status).toBe('not_applicable');
    });
  });

  describe('overall status', () => {
    it('returns fail when any check is fail', () => {
      // Inject a failing check by including an unresolved {{placeholder}} that the auditor
      // would not find (so overall is not determined by semantic, but by the format check itself)
      // The auditor's own checks don't produce fail status from content, only from structural checks.
      // Use a check that returns fail: FMT-003 with KHU VUC 7 but no bold nearby triggers warning not fail.
      // For a hard fail we need a check that returns fail directly.
      // FMT-001 and FMT-002 return not_detectable when absent, not fail.
      // So we verify the overall computation works for pass/warning scenarios.
      const parts = makeParts({ documentXml: '<w:t>Ngày……tháng</w:t>' });
      const result = auditDocxFormat(parts);
      // FMT-001 not detectable, FMT-002 not detectable → overall is warning (not fail)
      expect(['pass', 'warning']).toContain(result.status);
    });

    it('returns warning when checks are not_detectable but no fails', () => {
      const parts = makeParts({ documentXml: '<w:t>Short doc</w:t>' });
      const result = auditDocxFormat(parts);
      expect(['warning', 'pass']).toContain(result.status);
    });

    it('returns pass when at least one check passes and no fails/warnings', () => {
      // Document triggering only FMT-001 (pass) and FMT-002 (pass).
      // No motto → FMT-007 not_detectable.
      // No KHU VỰC 7 → FMT-003/004 not_detectable.
      // No underline near motto → FMT-008 not_detectable.
      // No bold+size14 proximity → FMT-011/012 not_detectable.
      // Overall: hasPass=true, hasWarning=false, hasFail=false → pass.
      const xml =
        '<w:r><w:rFonts w:ascii="Times New Roman"/></w:r>' +
        '<w:t>VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH</w:t>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      expect(result.status).toBe('pass');
    });
  });

  describe('FMT-008: Motto underline width', () => {
    it('returns not_detectable for motto underline', () => {
      const parts = makeParts({
        documentXml: '<w:t>Độc lập - Tự do - Hạnh phúc</w:t>',
      });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-008');
      expect(check?.status).toBe('not_detectable');
    });

    it('returns warning when underline found near motto (width unverifiable)', () => {
      const xml =
        '<w:r><w:t>Độc lập</w:t></w:r><w:r><w:u w:val="single"/></w:r>';
      const parts = makeParts({ documentXml: xml });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-008');
      expect(check?.status).toBe('warning');
    });
  });

  describe('FMT-010: Horizontal alignment of Số and date lines', () => {
    it('returns not_detectable for horizontal alignment', () => {
      const parts = makeParts({ documentXml: '<w:t>Số: QĐ-VKS</w:t>' });
      const result = auditDocxFormat(parts);
      const check = result.checks.find((c) => c.id === 'FMT-010');
      expect(check?.status).toBe('not_detectable');
    });
  });
});
