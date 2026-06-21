import PizZip from "pizzip";

const PARAGRAPH_PATTERN = /<w:p\b[\s\S]*?<\/w:p>/gu;

function visibleText(containerXml) {
  return containerXml
    .replace(/<w:tab\/>/gu, "\t")
    .replace(/<w:br\/>/gu, "\n")
    .replace(/<[^>]+>/gu, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * BM-031 needs separate agency values: the header uses the uppercase agency
 * name while the issuing-authority sentence uses the body-cased agency name.
 */
export function remediateBm031Template(docxBuffer) {
  const zip = new PizZip(docxBuffer);
  const documentPart = zip.file("word/document.xml");

  if (!documentPart) {
    throw new Error(
      "BM-031 remediation failed: DOCX package is missing word/document.xml.",
    );
  }

  const documentXml = documentPart.asText();
  const paragraphs = documentXml.match(PARAGRAPH_PATTERN) ?? [];
  const hasBodySentence = paragraphs.some((paragraphXml) =>
    visibleText(paragraphXml).includes("{{agency.bodyName}}"),
  );
  if (!hasBodySentence) {
    throw new Error(
      "BM-031 remediation failed: body agency placeholder was not found.",
    );
  }

  const alreadyRemediated = paragraphs.some(
    (paragraphXml) => visibleText(paragraphXml) === "{{agency.name}}",
  );
  if (alreadyRemediated) {
    return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  }

  let replaced = false;
  const remediatedXml = documentXml.replace(
    PARAGRAPH_PATTERN,
    (paragraphXml) => {
      if (
        replaced ||
        visibleText(paragraphXml) !== "{{agency.bodyName}}"
      ) {
        return paragraphXml;
      }
      replaced = true;
      return paragraphXml.replace(
        "{{agency.bodyName}}",
        "{{agency.name}}",
      );
    },
  );

  if (!replaced) {
    throw new Error(
      "BM-031 remediation failed: standalone header {{agency.bodyName}} paragraph was not found.",
    );
  }

  zip.file("word/document.xml", remediatedXml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
