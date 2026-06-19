import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import PizZip from "pizzip";
import { remediateBm001Template } from "../../scripts/docx-contract/lib/bm001-template-remediator.mjs";

const DOCUMENT_OPEN =
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:v="urn:schemas-microsoft-com:vml"><w:body>';
const DOCUMENT_CLOSE = "</w:body></w:document>";

function makeDocx(documentXml) {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file("word/document.xml", documentXml);
  zip.file(
    "word/styles.xml",
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri"/>' +
      "</w:rPr></w:rPrDefault></w:docDefaults>" +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">' +
      '<w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="28"/>' +
      '<w:szCs w:val="28"/></w:rPr></w:style></w:styles>',
  );
  zip.file("word/header1.xml", "<w:hdr>SENTINEL</w:hdr>");
  return zip.generate({ type: "nodebuffer" });
}

function extractParagraphContaining(documentXml, text) {
  return (
    documentXml
      .match(/<w:p\b[\s\S]*?<\/w:p>/gu)
      ?.find((paragraph) => paragraph.includes(text)) ?? ""
  );
}

function extractFormNote(documentXml) {
  return (
    documentXml
      .match(/<w:txbxContent\b[\s\S]*?<\/w:txbxContent>/gu)
      ?.find((textbox) => textbox.includes("Mẫu số 01/HS")) ?? ""
  );
}

test("remediates only the BM-001 receiver line and form-note textbox", () => {
  const input = makeDocx(
    DOCUMENT_OPEN +
      '<w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Tôi: </w:t></w:r>' +
      '<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>{{receiver.fullName}}</w:t></w:r>' +
      '<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>;</w:t></w:r></w:p>' +
      '<w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>UNRELATED RED</w:t></w:r></w:p>' +
      "<w:pict><v:shape><v:textbox><w:txbxContent>" +
      '<w:p><w:r><w:rPr><w:b/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>' +
      "<w:t>Mẫu số 01/HS</w:t></w:r></w:p>" +
      '<w:p><w:r><w:rPr><w:i/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>' +
      "<w:t>(Ban hành theo Thông tư số 03/2026/TT-VKSTC)</w:t></w:r></w:p>" +
      "</w:txbxContent></v:textbox></v:shape></w:pict>" +
      DOCUMENT_CLOSE,
  );

  const remediated = remediateBm001Template(input);
  const zip = new PizZip(remediated);
  const documentXml = zip.file("word/document.xml")?.asText() ?? "";
  const receiverParagraph = extractParagraphContaining(
    documentXml,
    "receiver.fullName",
  );
  const unrelatedParagraph = extractParagraphContaining(
    documentXml,
    "UNRELATED RED",
  );
  const formNote = extractFormNote(documentXml);

  assert.doesNotMatch(receiverParagraph, /w:val="FF0000"/u);
  assert.equal(
    (receiverParagraph.match(/<w:color w:val="000000"\/>/gu) ?? []).length,
    3,
  );
  assert.match(unrelatedParagraph, /w:val="FF0000"/u);
  assert.equal(
    (formNote.match(/<w:color w:val="000000"\/>/gu) ?? []).length,
    2,
  );
  assert.equal((formNote.match(/<w:sz w:val="16"\/>/gu) ?? []).length, 2);
  assert.equal(
    zip.file("word/header1.xml")?.asText(),
    "<w:hdr>SENTINEL</w:hdr>",
  );
});

test("remediates the checked-in BM-001 normalized template", () => {
  const templatePath = join(
    process.cwd(),
    "storage",
    "templates",
    "normalized-docx",
    "BM-001",
    "BM-001_normalized.docx",
  );
  const remediated = remediateBm001Template(readFileSync(templatePath));
  const documentXml =
    new PizZip(remediated).file("word/document.xml")?.asText() ?? "";
  const receiverParagraph = extractParagraphContaining(
    documentXml,
    "receiver.fullName",
  );
  const formNote = extractFormNote(documentXml);

  assert.ok(receiverParagraph, "receiver identity paragraph must exist");
  assert.doesNotMatch(receiverParagraph, /w:val="FF0000"/u);
  assert.match(receiverParagraph, /w:val="000000"/u);
  assert.ok(formNote, "Mẫu số 01/HS textbox must exist");
  assert.doesNotMatch(formNote, /w:color[^>]*w:val="(?:auto|FFFFFF)"/iu);
  assert.match(formNote, /w:val="000000"/u);
  assert.match(formNote, /<w:sz w:val="16"\/>/u);
});

test("normalization CLI applies BM-001 remediation only when explicitly selected", () => {
  const workDir = mkdtempSync(join(tmpdir(), "qllaw-bm001-normalize-"));
  const inputPath = join(workDir, "input.docx");
  const outputPath = join(workDir, "output.docx");

  try {
    writeFileSync(
      inputPath,
      makeDocx(
        DOCUMENT_OPEN +
          '<w:p><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Tôi: </w:t></w:r>' +
          '<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>{{receiver.fullName}}</w:t></w:r></w:p>' +
          "<w:pict><v:shape><v:textbox><w:txbxContent>" +
          '<w:p><w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>' +
          "<w:t>Mẫu số 01/HS</w:t></w:r></w:p>" +
          "</w:txbxContent></v:textbox></v:shape></w:pict>" +
          DOCUMENT_CLOSE,
      ),
    );

    execFileSync(
      process.execPath,
      [
        "scripts/docx-contract/normalize-docx-format.mjs",
        inputPath,
        outputPath,
        "--template-code",
        "BM-001",
      ],
      { cwd: process.cwd(), stdio: "pipe" },
    );

    const outputXml =
      new PizZip(readFileSync(outputPath))
        .file("word/document.xml")
        ?.asText() ?? "";
    const receiverParagraph = extractParagraphContaining(
      outputXml,
      "receiver.fullName",
    );

    assert.doesNotMatch(receiverParagraph, /w:val="FF0000"/u);
    assert.match(receiverParagraph, /w:val="000000"/u);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
