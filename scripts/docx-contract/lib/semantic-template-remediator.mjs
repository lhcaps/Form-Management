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

const BM058_SOURCE = Object.freeze({
  detentionDuration:
    "Thời hạn tạm hoãn xuất cảnh {{measure.exitPostponementDurationText}} kể từ {{measure.exitPostponementFromDateText}} đến {{measure.exitPostponementToDateText}}.",
});

const BM213_SOURCE = Object.freeze({
  agency: "VIỆN KIỂM SÁT … .................................................",
  documentCode: "Số: …/YC-VKS…-…",
  issueDate: "…, ngày … tháng … năm 20…",
  official: "VIỆN TRƯỞNG VIỆN KIỂM SÁT2…",
  identity:
    "Họ tên:......................................................................................... Giới tính:………",
  otherName:
    "Tên gọi khác: …………...........................................................................................",
  birth:
    "Sinh ngày ............ tháng ............ năm ...................... tại:…………………….. …...",
  nationality:
    "Quốc tịch: .............................................; Dân tộc: ......................; Tôn giáo:… …...",
  occupation:
    "Nghề nghiệp:.............................................................................................................",
  identityDocument:
    "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân:……..…………..",
  identityIssue:
    "Cấp ngày............ tháng ............ năm ................... Nơi cấp:………………..……...",
  permanentAddress: "Nơi thường trú: ……………………………………………………………………",
  temporaryAddress: "Nơi tạm trú: ………………………………………………………………………..",
  currentAddress: "Nơi ở hiện tại: ……………………………………………………………………..",
  context:
    "là bị hại/người làm chứng trong vụ án… có thông tin/hình ảnh/… cá nhân đã/đang/có nguy cơ bị phát tán trên không gian mạng, ảnh hưởng nghiêm trọng đến quyền riêng tư, danh dự, nhân phẩm và quyền lợi ích hợp pháp của người chưa thành niên theo quy định pháp luật,",
  article1:
    "1. Cơ quan, người có thẩm quyền… áp dụng các biện pháp kỹ thuật để bảo vệ thông tin cá nhân, danh dự, nhân phẩm của người chưa thành niên là bị hại/người làm chứng bị phát tán trên không gian mạng.",
  resultDeadline:
    "Cơ quan, người có thẩm quyền7… thông báo kết quả thực hiện cho Viện kiểm sát2 … trước … giờ … ngày … tháng … năm ….",
  article2:
    "2. Cơ quan/tổ chức/cá nhân liên quan… phối hợp chặt chẽ với7… trong việc rà soát, cung cấp thông tin, phát hiện và xử lý hành vi phát tán trái pháp luật thông tin/hình ảnh/… cá nhân của người chưa thành niên để bảo đảm quyền và lợi hợp pháp của người chưa thành niên./.",
  primaryRecipient: "- 5…;",
  investigationRecipient: "- 7…;",
  otherRecipients: "- 8…;",
  archive: "- Lưu: HSVV/VA, HSKS, VP.",
  signature: "……………………………..",
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

const BM058_REPLACEMENTS = Object.freeze([
  {
    id: "detention-duration",
    source: BM058_SOURCE.detentionDuration,
    lines: [
      "Thời hạn tạm giam {{measure.detentionDurationText}} kể từ {{measure.detentionFromDateText}} đến {{measure.detentionToDateText}}.",
    ],
  },
]);

const BM213_REPLACEMENTS = Object.freeze([
  {
    id: "agency",
    source: BM213_SOURCE.agency,
    lines: ["{{agency.parentName}} {{agency.name}}"],
  },
  {
    id: "document-code",
    source: BM213_SOURCE.documentCode,
    lines: ["Số: {{document.documentCode}}"],
  },
  {
    id: "issue-date",
    source: BM213_SOURCE.issueDate,
    lines: ["{{document.issuePlaceAndDateLine}}"],
  },
  {
    id: "official",
    source: BM213_SOURCE.official,
    lines: ["{{official.issuerTitle}}"],
  },
  {
    id: "identity",
    source: BM213_SOURCE.identity,
    lines: [
      "Họ tên: {{person.fullName}} Giới tính: {{person.genderLabel}}",
    ],
  },
  {
    id: "other-name",
    source: BM213_SOURCE.otherName,
    lines: ["Tên gọi khác: {{person.otherName}}"],
  },
  {
    id: "birth",
    source: BM213_SOURCE.birth,
    lines: [
      "Sinh ngày {{person.dateOfBirthText}} tại: {{person.placeOfBirth}}",
    ],
  },
  {
    id: "nationality",
    source: BM213_SOURCE.nationality,
    lines: [
      "Quốc tịch: {{person.nationality}}; Dân tộc: {{person.ethnicity}}; Tôn giáo: {{person.religion}}",
    ],
  },
  {
    id: "occupation",
    source: BM213_SOURCE.occupation,
    lines: ["Nghề nghiệp: {{person.occupation}}"],
  },
  {
    id: "identity-document",
    source: BM213_SOURCE.identityDocument,
    lines: [
      "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân: {{person.identityDocumentLine}}",
    ],
  },
  {
    id: "identity-issue",
    source: BM213_SOURCE.identityIssue,
    lines: ["{{person.identityIssueLine}}"],
  },
  {
    id: "permanent-address",
    source: BM213_SOURCE.permanentAddress,
    lines: ["Nơi thường trú: {{person.permanentAddress}}"],
  },
  {
    id: "temporary-address",
    source: BM213_SOURCE.temporaryAddress,
    lines: ["Nơi tạm trú: {{person.temporaryAddress}}"],
  },
  {
    id: "current-address",
    source: BM213_SOURCE.currentAddress,
    lines: ["Nơi ở hiện tại: {{person.currentAddress}}"],
  },
  {
    id: "context",
    source: BM213_SOURCE.context,
    lines: ["{{juvenileProtection.contextLine}}"],
  },
  {
    id: "article-1",
    source: BM213_SOURCE.article1,
    lines: ["1. {{juvenileProtection.article1Line}}"],
  },
  {
    id: "result-deadline",
    source: BM213_SOURCE.resultDeadline,
    lines: ["{{juvenileProtection.resultDeadlineLine}}"],
  },
  {
    id: "article-2",
    source: BM213_SOURCE.article2,
    lines: ["2. {{juvenileProtection.article2Line}}"],
  },
  {
    id: "primary-recipient",
    source: BM213_SOURCE.primaryRecipient,
    lines: ["- {{recipients.primaryLine}};"],
  },
  {
    id: "investigation-recipient",
    source: BM213_SOURCE.investigationRecipient,
    lines: ["- {{recipients.investigationAuthorityLine}};"],
  },
  {
    id: "other-recipients",
    source: BM213_SOURCE.otherRecipients,
    lines: ["- {{recipients.otherRecipientsLine}};"],
  },
  {
    id: "archive",
    source: BM213_SOURCE.archive,
    lines: ["- {{recipients.archiveLine}}."],
  },
  {
    id: "signature",
    source: BM213_SOURCE.signature,
    lines: ["{{signature.signerName}}"],
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
  "BM-058": {
    replacements: BM058_REPLACEMENTS,
    requiredOutputs: [
      "{{measure.detentionDurationText}}",
      "{{measure.detentionFromDateText}}",
      "{{measure.detentionToDateText}}",
    ],
  },
  "BM-213": {
    replacements: BM213_REPLACEMENTS,
    requiredOutputs: [
      "{{agency.parentName}}",
      "{{agency.name}}",
      "{{document.documentCode}}",
      "{{document.issuePlaceAndDateLine}}",
      "{{official.issuerTitle}}",
      "{{person.fullName}}",
      "{{person.genderLabel}}",
      "{{person.otherName}}",
      "{{person.dateOfBirthText}}",
      "{{person.placeOfBirth}}",
      "{{person.nationality}}",
      "{{person.ethnicity}}",
      "{{person.religion}}",
      "{{person.occupation}}",
      "{{person.identityDocumentLine}}",
      "{{person.identityIssueLine}}",
      "{{person.permanentAddress}}",
      "{{person.temporaryAddress}}",
      "{{person.currentAddress}}",
      "{{juvenileProtection.contextLine}}",
      "{{juvenileProtection.article1Line}}",
      "{{juvenileProtection.resultDeadlineLine}}",
      "{{juvenileProtection.article2Line}}",
      "{{recipients.primaryLine}}",
      "{{recipients.investigationAuthorityLine}}",
      "{{recipients.otherRecipientsLine}}",
      "{{recipients.archiveLine}}",
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
