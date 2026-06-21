import PizZip from "pizzip";

const PARAGRAPH_PATTERN = /<w:p\b[\s\S]*?<\/w:p>/gu;
const TEXT_PATTERN = /<w:t\b[^>]*>[\s\S]*?<\/w:t>/gu;

const BM019_SOURCE = Object.freeze({
  agency: "VIỆN KIỂM SÁT … .................................................",
  documentCode: "Số: …/YC-VKS…-…",
  issueDate: "…, ngày … tháng … năm 20…",
  official: "VIỆN TRƯỞNG VIỆN KIỂM SÁT2…",
  consideration:
    "Xét thấy Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm … của5… về tội … quy định tại khoản ... Điều … của Bộ luật Hình sự, ngoài tội phạm đã khởi tố còn có căn cứ xác định dấu hiệu của tội … quy định tại khoản ... Điều … của Bộ luật Hình sự nhưng chưa được khởi tố,",
  request:
    "Cơ quan, người có thẩm quyền5… ra Quyết định bổ sung Quyết định khởi tố vụ án hình sự về tội … quy định tại khoản ... Điều … của Bộ luật Hình sự, để tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự./.",
  recipient: "- 5...;",
  archive: "- Lưu: HSVA, HSKS, VP.",
  signature: "6………………..……………",
});

const BM020_SOURCE = Object.freeze({
  agency: "VIỆN KIỂM SÁT … .................................................",
  documentCode: "Số: …/YC-VKS…-…",
  issueDate: "…, ngày … tháng … năm 20...",
  official: "VIỆN TRƯỞNG VIỆN KIỂM SÁT2…",
  reason:
    "Xét Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm … (Quyết định thay đổi/bổ sung Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm …, nếu có) của6… về tội … quy định tại khoản … Điều … của Bộ luật Hình sự/Quyết định không khởi tố vụ án hình sự số … ngày … tháng … năm … của6… là không có căn cứ và trái pháp luật;",
  article1:
    "Điều 1. Cơ quan, người có thẩm quyền6… ra Quyết định hủy bỏ Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm … của6… về tội … quy định tại khoản … Điều … của Bộ luật Hình sự/Quyết định không khởi tố vụ án hình sự số … ngày … tháng … năm … của6….",
  article2:
    "Điều 2. Yêu cầu cơ quan, người có thẩm quyền6... tiếp tục giải quyết nguồn tin về tội phạm theo quy định của Bộ luật Tố tụng hình sự/ra Quyết định khởi tố vụ án hình sự./.",
  recipient: "- 6…;",
  archive: "- Lưu: HSVV/VA, HSKS, VP.",
  signature: "7………………………………",
});

const BM019_REPLACEMENTS = Object.freeze([
  {
    id: "agency",
    source: BM019_SOURCE.agency,
    lines: ["{{agency.parentName}} {{agency.name}}"],
  },
  {
    id: "document-code",
    source: BM019_SOURCE.documentCode,
    lines: ["Số: {{document.documentCode}}"],
  },
  {
    id: "issue-date",
    source: BM019_SOURCE.issueDate,
    lines: ["{{document.issuePlaceAndDateLine}}"],
  },
  {
    id: "official",
    source: BM019_SOURCE.official,
    lines: ["{{official.issuerTitle}}"],
  },
  {
    id: "consideration",
    source: BM019_SOURCE.consideration,
    lines: [
      "Xét thấy Quyết định khởi tố vụ án hình sự số {{initiationRequest.originatingDecisionCode}} ngày {{initiationRequest.originatingDecisionDateText}} của {{initiationRequest.originatingIssuerName}} về tội {{initiationRequest.originalOffenseName}} quy định tại {{initiationRequest.originalLegalArticle}} của Bộ luật Hình sự, ngoài tội phạm đã khởi tố còn có căn cứ xác định dấu hiệu của tội {{initiationRequest.additionalOffenseName}} quy định tại {{initiationRequest.additionalLegalArticle}} của Bộ luật Hình sự nhưng chưa được khởi tố,",
    ],
  },
  {
    id: "request",
    source: BM019_SOURCE.request,
    lines: [
      "{{initiationRequest.orderedAuthorityName}} ra Quyết định bổ sung Quyết định khởi tố vụ án hình sự về tội {{initiationRequest.additionalOffenseName}} quy định tại {{initiationRequest.additionalLegalArticle}} của Bộ luật Hình sự, để tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự./.",
    ],
  },
  {
    id: "recipient",
    source: BM019_SOURCE.recipient,
    lines: ["- {{initiationRequest.orderedAuthorityName}};"],
  },
  {
    id: "archive",
    source: BM019_SOURCE.archive,
    lines: ["- {{recipients.archiveLine}}."],
  },
  {
    id: "signature",
    source: BM019_SOURCE.signature,
    lines: [
      "{{signature.signMode}}",
      "{{signature.positionTitle}}",
      "{{signature.signerName}}",
    ],
  },
]);

const BM020_REPLACEMENTS = Object.freeze([
  {
    id: "agency",
    source: BM020_SOURCE.agency,
    lines: ["{{agency.parentName}} {{agency.name}}"],
  },
  {
    id: "document-code",
    source: BM020_SOURCE.documentCode,
    lines: ["Số: {{document.documentCode}}"],
  },
  {
    id: "issue-date",
    source: BM020_SOURCE.issueDate,
    lines: ["{{document.issuePlaceAndDateLine}}"],
  },
  {
    id: "official",
    source: BM020_SOURCE.official,
    lines: ["{{official.issuerTitle}}"],
  },
  {
    id: "reason",
    source: BM020_SOURCE.reason,
    lines: ["{{initiationRequest.reasonLine}}"],
  },
  {
    id: "article-1",
    source: BM020_SOURCE.article1,
    lines: ["Điều 1. {{initiationRequest.article1Line}}"],
  },
  {
    id: "article-2",
    source: BM020_SOURCE.article2,
    lines: ["Điều 2. {{initiationRequest.article2Line}}"],
  },
  {
    id: "recipient",
    source: BM020_SOURCE.recipient,
    lines: ["- {{initiationRequest.orderedAuthorityName}};"],
  },
  {
    id: "archive",
    source: BM020_SOURCE.archive,
    lines: ["- {{recipients.archiveLine}}."],
  },
  {
    id: "signature",
    source: BM020_SOURCE.signature,
    lines: [
      "{{signature.signMode}}",
      "{{signature.positionTitle}}",
      "{{signature.signerName}}",
    ],
  },
]);

const TEMPLATE_CONFIG = Object.freeze({
  "BM-019": {
    replacements: BM019_REPLACEMENTS,
    requiredOutputs: [
      "{{agency.parentName}}",
      "{{agency.name}}",
      "{{document.documentCode}}",
      "{{document.issuePlaceAndDateLine}}",
      "{{official.issuerTitle}}",
      "{{initiationRequest.originatingDecisionCode}}",
      "{{initiationRequest.originatingDecisionDateText}}",
      "{{initiationRequest.originatingIssuerName}}",
      "{{initiationRequest.originalOffenseName}}",
      "{{initiationRequest.originalLegalArticle}}",
      "{{initiationRequest.additionalOffenseName}}",
      "{{initiationRequest.additionalLegalArticle}}",
      "{{initiationRequest.orderedAuthorityName}}",
      "{{recipients.archiveLine}}",
      "{{signature.signMode}}",
      "{{signature.positionTitle}}",
      "{{signature.signerName}}",
    ],
  },
  "BM-020": {
    replacements: BM020_REPLACEMENTS,
    requiredOutputs: [
      "{{agency.parentName}}",
      "{{agency.name}}",
      "{{document.documentCode}}",
      "{{document.issuePlaceAndDateLine}}",
      "{{official.issuerTitle}}",
      "{{initiationRequest.reasonLine}}",
      "{{initiationRequest.article1Line}}",
      "{{initiationRequest.article2Line}}",
      "{{initiationRequest.orderedAuthorityName}}",
      "{{recipients.archiveLine}}",
      "{{signature.signMode}}",
      "{{signature.positionTitle}}",
      "{{signature.signerName}}",
    ],
  },
});

function decodeXml(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function encodeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function visibleText(paragraphXml) {
  return decodeXml(
    paragraphXml
      .replace(/<w:tab\/?>/gu, "\t")
      .replace(/<w:br\/?>/gu, "\n")
      .replace(/<[^>]+>/gu, ""),
  )
    .replace(/\s+/gu, " ")
    .trim();
}

function setParagraphText(paragraphXml, text) {
  let textIndex = 0;
  const remediated = paragraphXml.replace(TEXT_PATTERN, (textXml) => {
    const replacement = textIndex === 0 ? encodeXml(text) : "";
    textIndex += 1;
    return `<w:t xml:space="preserve">${replacement}</w:t>`;
  });

  if (textIndex === 0) {
    throw new Error(
      "Semantic remediation failed: matched paragraph has no w:t text run.",
    );
  }
  return remediated;
}

function replaceRequiredParagraph(documentXml, templateCode, replacement) {
  const matches = [...documentXml.matchAll(PARAGRAPH_PATTERN)].filter(
    (match) => visibleText(match[0]) === replacement.source,
  );

  if (matches.length === 0) {
    throw new Error(
      `${templateCode} required paragraph was not found for ${replacement.id}.`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `${templateCode} required paragraph is ambiguous for ${replacement.id}.`,
    );
  }

  const sourceParagraph = matches[0][0];
  const replacementXml = replacement.lines
    .map((line) => setParagraphText(sourceParagraph, line))
    .join("");
  return documentXml.replace(sourceParagraph, replacementXml);
}

function isFullyRemediated(documentXml, requiredOutputs) {
  return requiredOutputs.every((placeholder) =>
    documentXml.includes(placeholder),
  );
}

/**
 * Applies reviewed semantic placeholder remediation to one supported template.
 */
export function remediateSemanticTemplate(templateCode, docxBuffer) {
  const config = TEMPLATE_CONFIG[templateCode];
  if (!config) {
    throw new Error(
      `Unsupported semantic remediation template: ${templateCode}`,
    );
  }

  const zip = new PizZip(docxBuffer);
  const documentPart = zip.file("word/document.xml");
  if (!documentPart) {
    throw new Error(
      `${templateCode} semantic remediation failed: DOCX package is missing word/document.xml.`,
    );
  }

  let documentXml = documentPart.asText();
  if (isFullyRemediated(documentXml, config.requiredOutputs)) {
    return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  }

  for (const replacement of config.replacements) {
    documentXml = replaceRequiredParagraph(
      documentXml,
      templateCode,
      replacement,
    );
  }

  if (!isFullyRemediated(documentXml, config.requiredOutputs)) {
    throw new Error(
      `${templateCode} semantic remediation failed: required placeholders are incomplete.`,
    );
  }

  zip.file("word/document.xml", documentXml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
