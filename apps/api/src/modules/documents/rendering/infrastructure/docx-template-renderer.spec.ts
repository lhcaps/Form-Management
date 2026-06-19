import PizZip from 'pizzip';
import {
  auditDocxPackageIntegrity,
  renderDocxTemplate,
} from './docx-template-renderer';

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>`;

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:r><w:t>{{person.fullName}}</w:t></w:r></w:p>
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId3"/>
      <w:titlePg/>
    </w:sectPr>
  </w:body>
</w:document>`;

function makeTemplate(): Buffer {
  const zip = new PizZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES);
  zip.file('_rels/.rels', ROOT_RELS);
  zip.file('word/document.xml', DOCUMENT_XML);
  zip.file('word/_rels/document.xml.rels', DOCUMENT_RELS);
  zip.file(
    'word/styles.xml',
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal"/></w:styles>',
  );
  zip.file(
    'word/settings.xml',
    '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:evenAndOddHeaders/></w:settings>',
  );
  zip.file(
    'word/header1.xml',
    '<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>HEADER SENTINEL</w:t></w:r></w:p></w:hdr>',
  );
  return zip.generate({ type: 'nodebuffer' });
}

describe('renderDocxTemplate', () => {
  it('preserves the full DOCX package while replacing document bindings', () => {
    const rendered = renderDocxTemplate(
      makeTemplate(),
      new Map([['person.fullName', 'Nguyễn Văn A']]),
    );
    const zip = new PizZip(rendered);

    expect(zip.file('word/document.xml')?.asText()).toContain('Nguyễn Văn A');
    expect(zip.file('word/document.xml')?.asText()).not.toContain(
      '{{person.fullName}}',
    );
    expect(zip.file('word/styles.xml')?.asText()).toContain('Normal');
    expect(zip.file('word/settings.xml')?.asText()).toContain(
      'evenAndOddHeaders',
    );
    expect(zip.file('word/header1.xml')?.asText()).toContain(
      'HEADER SENTINEL',
    );
    expect(zip.file('word/_rels/document.xml.rels')?.asText()).toContain(
      'relationships/header',
    );
  });

  it('reports a missing package part as an integrity failure', () => {
    const template = makeTemplate();
    const renderedZip = new PizZip(
      renderDocxTemplate(
        template,
        new Map([['person.fullName', 'Nguyễn Văn A']]),
      ),
    );
    renderedZip.remove('word/styles.xml');

    const integrity = auditDocxPackageIntegrity(
      template,
      renderedZip.generate({ type: 'nodebuffer' }),
    );

    expect(integrity.status).toBe('fail');
    expect(integrity.missingParts).toContain('word/styles.xml');
  });

  it('passes when rendering changes only document content', () => {
    const template = makeTemplate();
    const rendered = renderDocxTemplate(
      template,
      new Map([['person.fullName', 'Nguyễn Văn A']]),
    );

    const integrity = auditDocxPackageIntegrity(template, rendered);

    expect(integrity.status).toBe('pass');
    expect(integrity.missingParts).toHaveLength(0);
    expect(integrity.changedPreservedParts).toHaveLength(0);
  });
});
