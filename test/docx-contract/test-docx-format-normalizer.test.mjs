import assert from 'node:assert/strict';
import test from 'node:test';
import PizZip from 'pizzip';
import { normalizeDocxBaseTypography } from '../../scripts/docx-contract/lib/docx-format-normalizer.mjs';

function makeDocx() {
  const zip = new PizZip();
  zip.file(
    'word/styles.xml',
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr>' +
      '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>' +
      '</w:rPr></w:rPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">' +
      '<w:name w:val="Normal"/><w:rPr>' +
      '<w:rFonts w:ascii=".VnTime;Times New Roman" w:hAnsi=".VnTime;Times New Roman"/>' +
      '<w:sz w:val="28"/><w:szCs w:val="24"/>' +
      '</w:rPr></w:style></w:styles>',
  );
  zip.file(
    'word/document.xml',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>',
  );
  zip.file('word/header1.xml', '<w:hdr>HEADER SENTINEL</w:hdr>');
  return zip.generate({ type: 'nodebuffer' });
}

test('normalizes the DOCX base typography without dropping package parts', () => {
  const normalized = normalizeDocxBaseTypography(makeDocx(), {
    fontFamily: 'Times New Roman',
    fontSizeHalfPoints: 26,
  });
  const zip = new PizZip(normalized);
  const styles = zip.file('word/styles.xml')?.asText() ?? '';

  assert.match(styles, /w:styleId="Normal"/u);
  assert.match(styles, /w:ascii="Times New Roman"/u);
  assert.match(styles, /<w:sz w:val="26"\/>/u);
  assert.match(styles, /<w:szCs w:val="26"\/>/u);
  assert.doesNotMatch(styles, /\.VnTime/u);
  assert.equal(zip.file('word/header1.xml')?.asText(), '<w:hdr>HEADER SENTINEL</w:hdr>');
});
