import PizZip from "pizzip";

const RUN_PATTERN = /<w:r\b[\s\S]*?<\/w:r>/gu;
const PARAGRAPH_PATTERN = /<w:p\b[\s\S]*?<\/w:p>/gu;
const TEXTBOX_PATTERN = /<w:txbxContent\b[\s\S]*?<\/w:txbxContent>/gu;
const COLOR_PATTERN = /<w:color\b[^>]*(?:\/>|>[\s\S]*?<\/w:color>)/u;

function setRunColor(runXml, color) {
  if (!/<w:t\b/u.test(runXml)) return runXml;

  if (COLOR_PATTERN.test(runXml)) {
    return runXml.replace(COLOR_PATTERN, `<w:color w:val="${color}"/>`);
  }

  if (/<w:rPr\b[^>]*\/>/u.test(runXml)) {
    return runXml.replace(
      /<w:rPr\b[^>]*\/>/u,
      `<w:rPr><w:color w:val="${color}"/></w:rPr>`,
    );
  }

  if (/<w:rPr\b[^>]*>/u.test(runXml)) {
    return runXml.replace("</w:rPr>", `<w:color w:val="${color}"/></w:rPr>`);
  }

  return runXml.replace(
    /<w:r\b([^>]*)>/u,
    `<w:r$1><w:rPr><w:color w:val="${color}"/></w:rPr>`,
  );
}

function colorTextRuns(containerXml, color) {
  return containerXml.replace(RUN_PATTERN, (runXml) =>
    setRunColor(runXml, color),
  );
}

function replaceIdentifiedContainer(
  documentXml,
  pattern,
  predicate,
  transform,
  missingMessage,
) {
  let found = false;
  const remediated = documentXml.replace(pattern, (containerXml) => {
    if (found || !predicate(containerXml)) return containerXml;
    found = true;
    return transform(containerXml);
  });

  if (!found) throw new Error(missingMessage);
  return remediated;
}

/**
 * Applies the reviewed BM-001 presentation corrections without changing
 * unrelated legal content or DOCX package parts.
 */
export function remediateBm001Template(docxBuffer) {
  const zip = new PizZip(docxBuffer);
  const documentPart = zip.file("word/document.xml");

  if (!documentPart) {
    throw new Error(
      "BM-001 remediation failed: DOCX package is missing word/document.xml.",
    );
  }

  let documentXml = documentPart.asText();
  documentXml = replaceIdentifiedContainer(
    documentXml,
    PARAGRAPH_PATTERN,
    (paragraphXml) => paragraphXml.includes("{{receiver.fullName}}"),
    (paragraphXml) => colorTextRuns(paragraphXml, "000000"),
    "BM-001 remediation failed: receiver identity paragraph containing {{receiver.fullName}} was not found.",
  );
  documentXml = replaceIdentifiedContainer(
    documentXml,
    TEXTBOX_PATTERN,
    (textboxXml) => textboxXml.includes("Mẫu số 01/HS"),
    (textboxXml) => colorTextRuns(textboxXml, "000000"),
    "BM-001 remediation failed: top-right Mẫu số 01/HS textbox was not found.",
  );

  zip.file("word/document.xml", documentXml);
  return zip.generate({ type: "nodebuffer" });
}
