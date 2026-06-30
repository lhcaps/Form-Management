import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import PizZip from "pizzip";

import { remediateBm031Template } from "../../scripts/docx-contract/lib/bm031-template-remediator.mjs";

const DOCUMENT_OPEN =
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>';
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
      "<w:szCs w:val=\"28\"/></w:rPr></w:style></w:styles>",
  );
  return zip.generate({ type: "nodebuffer" });
}

test("BM-031 remediation separates the uppercase header agency from the body agency name", () => {
  const input = makeDocx(
    DOCUMENT_OPEN +
      '<w:p><w:r><w:t>{{agency.parentName}}</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>{{agency.bodyName}}</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>Viện trưởng </w:t></w:r>' +
      '<w:r><w:t>{{agency.bodyName}</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p>' +
      DOCUMENT_CLOSE,
  );
  const remediated = remediateBm031Template(input);
  const zip = new PizZip(remediated);
  const documentXml = zip.file("word/document.xml")?.asText() ?? "";

  assert.equal(
    (documentXml.match(/\{\{agency\.name\}\}/gu) ?? []).length,
    1,
  );
  assert.equal(
    (documentXml.match(/\{\{agency\.bodyName\}\}/gu) ?? []).length,
    0,
  );
  assert.match(documentXml, /\{\{agency\.bodyName\}<\/w:t>[\s\S]*?<w:t>\}/u);
  assert.match(zip.file("word/styles.xml")?.asText() ?? "", /Calibri/u);
});

test("BM-031 remediation updates the checked-in normalized template header only", () => {
  const templatePath = join(
    process.cwd(),
    "storage",
    "templates",
    "normalized-docx",
    "BM-031",
    "BM-031_normalized.docx",
  );
  const remediated = remediateBm031Template(readFileSync(templatePath));
  const documentXml =
    new PizZip(remediated).file("word/document.xml")?.asText() ?? "";

  assert.match(documentXml, /\{\{agency\.name\}\}/u);
  assert.equal(
    (documentXml.match(/\{\{agency\.name\}\}/gu) ?? []).length,
    1,
  );
  assert.equal(
    (documentXml.match(/\{\{agency\.bodyName\}\}/gu) ?? []).length,
    1,
  );
  assert.doesNotMatch(
    documentXml,
    /\{\{agency\.bodyName\}<\/w:t>[\s\S]*?<w:t>\}/u,
  );
});

test("BM-031 remediation CLI updates the requested DOCX without typography normalization", () => {
  const workDir = mkdtempSync(join(tmpdir(), "qllaw-bm031-normalize-"));
  const inputPath = join(workDir, "input.docx");
  const outputPath = join(workDir, "output.docx");

  try {
    writeFileSync(
      inputPath,
      makeDocx(
        DOCUMENT_OPEN +
          '<w:p><w:r><w:t>{{agency.bodyName}}</w:t></w:r></w:p>' +
          '<w:p><w:r><w:t>Viện trưởng </w:t></w:r>' +
          '<w:r><w:t>{{agency.bodyName}</w:t></w:r><w:r><w:t>}</w:t></w:r></w:p>' +
          DOCUMENT_CLOSE,
      ),
    );

    execFileSync(
      process.execPath,
      [
        "scripts/docx-contract/remediate-bm031-template.mjs",
        inputPath,
        outputPath,
      ],
      { cwd: process.cwd(), stdio: "pipe" },
    );

    const outputXml =
      new PizZip(readFileSync(outputPath))
        .file("word/document.xml")
        ?.asText() ?? "";

    assert.match(outputXml, /\{\{agency\.name\}\}/u);
    assert.match(outputXml, /\{\{agency\.bodyName\}<\/w:t>[\s\S]*?<w:t>\}/u);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
