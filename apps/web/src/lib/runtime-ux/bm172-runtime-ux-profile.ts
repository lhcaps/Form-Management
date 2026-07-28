/**
 * BM-172 runtime-ux curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-172 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, source-aligned section descriptions, and safe
 * demo data.
 *
 * Form title: Quyết định hủy bỏ Quyết định trả lại tài sản
 *
 * Source evidence:
 *   docs/audit/docx/extracted/BM-172__e3a3eb687d2f.extract.md
 *   (extractHeading = "HỦY BỎ QUYẾT ĐỊNH TRẢ LẠI TÀI SẢN" anchored on P0011,
 *    legal basis "Căn cứ các điều 41, 106 và 165" anchored on P0013)
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Curation scope (allowed):
 *   - Section descriptions (aligned with extract paragraphs P0011–P0069)
 *   - Field labels and placeholders (already source-aligned)
 *   - Phantom section id correction (no phantom "section-nguoi-nhan-tai-san")
 *
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled contract section IDs (`section-thong-tin-nguoi-nhan-tai-san` stays)
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM172_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Dòng VIỆN KIỂM SÁT, CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập – Tự do – Hạnh phúc; số QĐ, địa danh, ngày tháng năm ban hành (P0001–P0009).",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Căn cứ Điều 41, 106 và 165 Bộ luật Tố tụng hình sự (P0013); Quyết định khởi tố vụ án (P0014), Quyết định khởi tố bị can (P0027), xét Quyết định trả lại tài sản bị khiếu nại (P0041–P0047).",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Nhận thấy việc trả lại tài sản là không có căn cứ và trái pháp luật (P0047); Điều 1 — Hủy bỏ Quyết định trả lại tài sản (P0049–P0054); Điều 2 — Yêu cầu thu hồi tài sản theo quy định (P0055–P0057); Điều 3 — Yêu cầu cá nhân/tổ chức thi hành Quyết định và trả lại tài sản (P0058–P0069).",
  },
  {
    sectionId: "section-thong-tin-nguoi-nhan-tai-san",
    title: "Thông tin người nhận tài sản",
    description:
      "Họ tên, giới tính, tên gọi khác, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, số CCCD/Hộ chiếu, ngày cấp, nơi cấp, nơi thường trú, tạm trú, hiện tại của người nhận tài sản (P0058–P0068).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Cơ quan, đơn vị thi hành, người nhận tài sản và lưu hồ sơ HSVA, HSKS, VP (P0070–P0073).",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Chức danh, họ tên người ký, đóng dấu Viện kiểm sát (P0074); Mẫu số 172/HS — ban hành theo Thông tư số /2026/TT-VKSTC (P0087–P0089).",
  },
] as const;

const BM172_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao",
  },
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "82/QĐ-VKS",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội, ngày 04 tháng 3 năm 2026",
  },
  "official.issuerTitle": {
    label: "Chức danh ban hành",
    placeholder: "Viện trưởng",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 41, 106 và 165 của Bộ luật Tố tụng hình sự",
  },
  "propertyReturnCancellation.caseInitiationLine": {
    label: "Căn cứ khởi tố vụ án",
    placeholder: "Căn cứ Quyết định khởi tố vụ án số 11/QĐ-KTVA ngày 12/02/2026",
  },
  "propertyReturnCancellation.defendantInitiationLine": {
    label: "Căn cứ khởi tố bị can",
    placeholder: "Căn cứ Quyết định khởi tố bị can số 20/QĐ-KT ngày 19/02/2026",
  },
  "propertyReturnCancellation.propertyReturnDecisionReviewLine": {
    label: "Căn cứ xem xét quyết định trả lại tài sản",
    placeholder: "Xét thấy Quyết định trả lại tài sản số 70/QĐ-VKS có nội dung trái pháp luật",
  },
  "propertyReturnCancellation.unlawfulReasonLine": {
    label: "Lý do trái pháp luật",
    placeholder: "Quyết định trả lại tài sản vi phạm Điều 106 BLTTHS",
  },
  "propertyReturnCancellation.article1Line": {
    label: "Điều 1 - Hủy bỏ quyết định",
    placeholder: "Điều 1. Hủy bỏ Quyết định trả lại tài sản số 70/QĐ-VKS ngày 28/02/2026.",
  },
  "propertyReturnCancellation.article2Line": {
    label: "Điều 2 - Yêu cầu xử lý lại",
    placeholder: "Điều 2. Yêu cầu Cơ quan Cảnh sát điều tra ban hành quyết định trả lại tài sản mới.",
  },
  "propertyReturnCancellation.article3RequestLine": {
    label: "Điều 3 - Yêu cầu cung cấp thông tin",
    placeholder: "Điều 3. Yêu cầu người nhận tài sản cung cấp đầy đủ thông tin để xác minh.",
  },
  "propertyRecipient.gender": {
    label: "Giới tính",
    placeholder: "Nam",
  },
  "propertyRecipient.aliasName": {
    label: "Bí danh/Tên gọi khác",
    placeholder: "Không có",
  },
  "propertyRecipient.birthDateLine": {
    label: "Ngày sinh",
    placeholder: "ngày 12 tháng 5 năm 1986",
  },
  "propertyRecipient.birthPlace": {
    label: "Nơi sinh",
    placeholder: "Thành phố Hà Nội",
  },
  "propertyRecipient.nationality": {
    label: "Quốc tịch",
    placeholder: "Việt Nam",
  },
  "propertyRecipient.ethnicity": {
    label: "Dân tộc",
    placeholder: "Kinh",
  },
  "propertyRecipient.religion": {
    label: "Tôn giáo",
    placeholder: "Không",
  },
  "propertyRecipient.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Kỹ sư",
  },
  "propertyRecipient.identityNumber": {
    label: "Số CCCD/CMND",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 001086123456 is a format-shaped synthetic test value, not derived from any real customer/case data.
    placeholder: "001086123456",
  },
  "propertyRecipient.identityIssueDateLine": {
    label: "Ngày cấp CCCD",
    placeholder: "ngày 15 tháng 8 năm 2021",
  },
  "propertyRecipient.identityIssuePlace": {
    label: "Nơi cấp CCCD",
    placeholder: "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
  },
  "propertyRecipient.permanentResidence": {
    label: "Nơi đăng ký thường trú",
    placeholder: "Số 25 phố Lê Duẩn, quận 1, Thành phố Hồ Chí Minh",
  },
  "propertyRecipient.temporaryResidence": {
    label: "Nơi tạm trú",
    placeholder: "Số 12 phố Tràng Tiền, quận Hoàn Kiếm, Hà Nội",
  },
  "propertyRecipient.currentResidence": {
    label: "Nơi ở hiện nay",
    placeholder: "Số 12 phố Tràng Tiền, quận Hoàn Kiếm, Hà Nội",
  },
  "propertyReturnCancellation.article3ExecutionLine": {
    label: "Điều 3 - Yêu cầu thi hành",
    placeholder: "Giao Cơ quan Cảnh sát điều tra tổ chức thi hành theo quy định.",
  },
  "recipients.primaryLine": {
    label: "Nơi nhận",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  },
  "recipients.propertyRecipientLine": {
    label: "Nơi nhận - Người nhận tài sản",
    placeholder: "Ông Đặng Hữu Phúc",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký số",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Phó Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Anh",
  },
} as const;

const BM172_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "82/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Phó Viện trưởng Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 41, 106 và 165 của Bộ luật Tố tụng hình sự",
  "propertyReturnCancellation.caseInitiationLine": "Căn cứ Quyết định khởi tố vụ án số 11/QĐ-KTVA ngày 12/02/2026",
  "propertyReturnCancellation.defendantInitiationLine": "Căn cứ Quyết định khởi tố bị can số 20/QĐ-KT ngày 19/02/2026",
  "propertyReturnCancellation.propertyReturnDecisionReviewLine": "Xét thấy Quyết định trả lại tài sản số 70/QĐ-VKS có nội dung trái pháp luật",
  "propertyReturnCancellation.unlawfulReasonLine": "Quyết định trả lại tài sản vi phạm Điều 106 BLTTHS",
  "propertyReturnCancellation.article1Line": "Điều 1. Hủy bỏ Quyết định trả lại tài sản số 70/QĐ-VKS ngày 28/02/2026.",
  "propertyReturnCancellation.article2Line": "Điều 2. Yêu cầu Cơ quan Cảnh sát điều tra ban hành quyết định trả lại tài sản mới.",
  "propertyReturnCancellation.article3RequestLine": "Điều 3. Yêu cầu người nhận tài sản cung cấp đầy đủ thông tin để xác minh.",
  "propertyRecipient.gender": "Nam",
  "propertyRecipient.aliasName": "Không có",
  "propertyRecipient.birthDateLine": "ngày 12 tháng 5 năm 1986",
  "propertyRecipient.birthPlace": "Thành phố Hà Nội",
  "propertyRecipient.nationality": "Việt Nam",
  "propertyRecipient.ethnicity": "Kinh",
  "propertyRecipient.religion": "Không",
  "propertyRecipient.occupation": "Kỹ sư",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 001086123456 is a format-shaped synthetic test value, not derived from any real customer/case data.
  "propertyRecipient.identityNumber": "001086123456",
  "propertyRecipient.identityIssueDateLine": "ngày 15 tháng 8 năm 2021",
  "propertyRecipient.identityIssuePlace": "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
  "propertyRecipient.permanentResidence": "Số 25 phố Lê Duẩn, quận 1, Thành phố Hồ Chí Minh",
  "propertyRecipient.temporaryResidence": "Số 12 phố Tràng Tiền, quận Hoàn Kiếm, Hà Nội",
  "propertyRecipient.currentResidence": "Số 12 phố Tràng Tiền, quận Hoàn Kiếm, Hà Nội",
  "propertyReturnCancellation.article3ExecutionLine": "Giao Cơ quan Cảnh sát điều tra tổ chức thi hành theo quy định.",
  "recipients.primaryLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội (để thi hành)",
  "recipients.propertyRecipientLine": "Ông Đặng Hữu Phúc (để biết)",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Anh",
} as const;

const BM172_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-172",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-172 runtime-ux tài-sản-huỷ-bỏ curated source-render profile`,
  sections: BM172_SECTIONS,
  fields: BM172_FIELDS,
  demo: BM172_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM172_RUNTIME_UX_PROFILE);
