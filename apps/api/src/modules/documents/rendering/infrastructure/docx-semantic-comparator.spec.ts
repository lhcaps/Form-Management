import { compareDocxSemantic } from './docx-semantic-comparator';

describe('docx-semantic-comparator', () => {
  describe('missing expected text', () => {
    it('fails when expected text is missing from contract output', () => {
      const legacyXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';
      const contractXml = '<w:p><w:t></w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, [
        'Nguyễn Văn Minh',
      ]);

      expect(result.status).toBe('fail');
      expect(result.missingExpectedText).toContain('Nguyễn Văn Minh');
    });

    it('passes when all expected values are present', () => {
      const legacyXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';
      const contractXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, [
        'Nguyễn Văn Minh',
      ]);

      expect(result.status).toBe('pass');
      expect(result.missingExpectedText).toHaveLength(0);
    });
  });

  describe('unresolved placeholders', () => {
    it('fails on unresolved {{placeholder}} syntax', () => {
      const legacyXml = '<w:p><w:t>Hello</w:t></w:p>';
      const contractXml = '<w:p><w:t>{{receiver.fullName}}</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('fail');
      expect(result.unexpectedUnresolvedPlaceholders).toContain('{{receiver.fullName}}');
    });

    it('fails on unresolved {placeholder} syntax', () => {
      const legacyXml = '<w:p><w:t>Hello</w:t></w:p>';
      const contractXml = '<w:p><w:t>{informant.fullName}</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('fail');
      expect(result.unexpectedUnresolvedPlaceholders).toContain('{informant.fullName}');
    });

    it('passes on ellipsis (...) template markers without missing expected text', () => {
      const legacyXml = '<w:p><w:t>Ngày……tháng……năm</w:t></w:p>';
      const contractXml = '<w:p><w:t>Ngày……tháng……năm</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('pass');
      expect(result.unexpectedUnresolvedPlaceholders).toHaveLength(0);
    });

    it('warns on template with ellipsis when filled values change text length significantly', () => {
      const legacyXml = '<w:p><w:t>Ngày……tháng……năm</w:t></w:p>';
      const contractXml = '<w:p><w:t>Ngày 15 tháng 06 năm 2026</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, ['15', '06', '2026']);

      expect(result.status).toBe('warning');
    });
  });

  describe('whitespace differences', () => {
    it('passes when text differs only by whitespace', () => {
      const legacyXml = '<w:p><w:t>  Nguyễn   Văn   Minh  </w:t></w:p>';
      const contractXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, [
        'Nguyễn Văn Minh',
      ]);

      expect(result.status).toBe('pass');
    });
  });

  describe('length comparison', () => {
    it('warns when contract is significantly shorter', () => {
      const legacyXml = '<w:p><w:t>' + 'a'.repeat(500) + '</w:t></w:p>';
      const contractXml = '<w:p><w:t>abc</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('warning');
      expect(result.notes.some((n) => n.includes('shorter'))).toBe(true);
    });

    it('warns when contract is significantly longer', () => {
      const legacyXml = '<w:p><w:t>abc</w:t></w:p>';
      const contractXml = '<w:p><w:t>' + 'a'.repeat(500) + '</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('warning');
      expect(result.notes.some((n) => n.includes('longer'))).toBe(true);
    });
  });

  describe('entity encoding', () => {
    it('normalizes XML entities for comparison', () => {
      const legacyXml = '<w:p><w:t>Ngày &lt; 10</w:t></w:p>';
      const contractXml = '<w:p><w:t>Ngày &lt; 10</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, ['Ngày < 10']);

      expect(result.status).toBe('pass');
    });
  });

  describe('Vietnamese diacritics', () => {
    it('preserves Vietnamese diacritics in comparison', () => {
      const legacyXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';
      const contractXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, ['Nguyễn Văn Minh']);

      expect(result.status).toBe('pass');
      expect(result.missingExpectedText).toHaveLength(0);
    });

    it('fails when informant name with diacritics is missing', () => {
      const legacyXml = '<w:p><w:t>Trần Thị Lan</w:t></w:p>';
      const contractXml = '<w:p><w:t></w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, ['Trần Thị Lan']);

      expect(result.status).toBe('fail');
      expect(result.missingExpectedText).toContain('Trần Thị Lan');
    });

    it('preserves all Vietnamese diacritic characters in comparison', () => {
      const legacyXml = '<w:p><w:t>Nguyễn Thị Bé Na</w:t></w:p>';
      const contractXml = '<w:p><w:t>Nguyễn Thị Bé Na</w:t></w:p>';

      // All 5 standard diacritic characters: ă, â, đ, ê, ô
      const diacritics = ['Nguyễn', 'Thị', 'Bé', 'Na'];

      const result = compareDocxSemantic(legacyXml, contractXml, diacritics);

      expect(result.status).toBe('pass');
    });
  });

  describe('expectedText completeness', () => {
    it('fails when informant full name is missing from contract', () => {
      const legacyXml = '<w:p><w:t>Trần Thị Lan</w:t></w:p>';
      const contractXml = '<w:p><w:t></w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, ['Trần Thị Lan']);

      expect(result.status).toBe('fail');
      expect(result.missingExpectedText).toContain('Trần Thị Lan');
    });

    it('fails when sourceReport content is missing', () => {
      const legacyXml = '<w:p><w:t>Hành vi trộm cắp tài sản</w:t></w:p>';
      const contractXml = '<w:p><w:t></w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, ['Hành vi trộm cắp tài sản']);

      expect(result.status).toBe('fail');
      expect(result.missingExpectedText).toContain('Hành vi trộm cắp tài sản');
    });

    it('reports exact missing values', () => {
      const legacyXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';
      const contractXml = '<w:p><w:t></w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, [
        'Nguyễn Văn Minh',
        'Trần Thị Lan',
        '079090123456',
      ]);

      expect(result.status).toBe('fail');
      expect(result.missingExpectedText).toHaveLength(3);
      expect(result.missingExpectedText).toContain('Nguyễn Văn Minh');
      expect(result.missingExpectedText).toContain('Trần Thị Lan');
      expect(result.missingExpectedText).toContain('079090123456');
    });
  });

  describe('placeholder detection', () => {
    it('marks {{receiver.fullName}} as harmful unresolved placeholder', () => {
      const legacyXml = '<w:p><w:t>Nguyễn Văn Minh</w:t></w:p>';
      const contractXml = '<w:p><w:t>{{receiver.fullName}}</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('fail');
      expect(result.unexpectedUnresolvedPlaceholders).toContain('{{receiver.fullName}}');
    });

    it('marks {informant.fullName} (single brace) as harmful unresolved placeholder', () => {
      const legacyXml = '<w:p><w:t>Trần Thị Lan</w:t></w:p>';
      const contractXml = '<w:p><w:t>{informant.fullName}</w:t></w:p>';

      const result = compareDocxSemantic(legacyXml, contractXml, []);

      expect(result.status).toBe('fail');
      expect(result.unexpectedUnresolvedPlaceholders).toContain('{informant.fullName}');
    });
  });
});
