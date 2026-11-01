/**
 * BM-170 runtime-ux curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-170 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, source-aligned section descriptions, and safe
 * demo data.
 *
 * Form title: Quyết định hủy bỏ Quyết định xử lý vật chứng
 *
 * Source evidence:
 *   docs/audit/docx/extracted/BM-170__c8f50b0e9f5b.extract.md
 *   (extractHeading = "HỦY BỎ QUYẾT ĐỊNH XỬ LÝ VẬT CHỨNG" anchored on P0011,
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
 *   - Section descriptions (aligned with extract paragraphs P0011–P0061)
 *   - Field labels and placeholders (already source-aligned)
 *   - Phantom section id correction (no phantom "section-noi-dung-quyet-dinh")
 *
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled contract section IDs (`section-noi-dung-quyet-inh` stays)
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM170_SECTIONS = [
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
      "Căn cứ Điều 41, 106 và 165 Bộ luật Tố tụng hình sự (P0013); Quyết định khởi tố vụ án (P0014), Quyết định khởi tố bị can (P0027), xét Quyết định xử lý vật chứng bị khiếu nại (P0041–P0046).",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Nhận thấy Quyết định xử lý vật chứng là không có căn cứ và trái pháp luật (P0046); Điều 1 — Hủy bỏ Quyết định xử lý vật chứng (P0048–P0052); Điều 2 — Yêu cầu tiếp tục giải quyết vụ án theo đúng quy định (P0053–P0054).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Cơ quan, đơn vị thi hành và lưu hồ sơ HSVA, HSKS, VP (P0056–P0058).",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Chức danh, họ tên người ký, đóng dấu Viện kiểm sát (P0059); Mẫu số 170/HS — ban hành theo Thông tư số /2026/TT-VKSTC (P0073–P0075).",
  },
] as const;

const BM170_FIELDS = {
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
    placeholder: "75/QĐ-VKS",
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
  "evidenceHandlingCancellation.caseInitiationLine": {
    label: "Căn cứ khởi tố vụ án",
    placeholder: "Căn cứ Quyết định khởi tố vụ án số 10/QĐ-KTVA ngày 10/02/2026",
  },
  "evidenceHandlingCancellation.defendantInitiationLine": {
    label: "Căn cứ khởi tố bị can",
    placeholder: "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  },
  "evidenceHandlingCancellation.evidenceHandlingDecisionReviewLine": {
    label: "Căn cứ xem xét quyết định xử lý vật chứng",
    placeholder: "Xét thấy Quyết định xử lý vật chứng số 68/QĐ-VKS có nội dung trái pháp luật",
  },
  "evidenceHandlingCancellation.unlawfulReasonLine": {
    label: "Lý do trái pháp luật",
    placeholder: "Quyết định xử lý vật chứng vi phạm Điều 106 BLTTHS về thẩm quyền ban hành",
  },
  "evidenceHandlingCancellation.article1Line": {
    label: "Điều 1 - Hủy bỏ quyết định",
    placeholder: "Điều 1. Hủy bỏ Quyết định xử lý vật chứng số 68/QĐ-VKS ngày 28/02/2026.",
  },
  "evidenceHandlingCancellation.article2Line": {
    label: "Điều 2 - Yêu cầu xử lý lại",
    placeholder: "Điều 2. Yêu cầu Cơ quan Cảnh sát điều tra ban hành quyết định xử lý vật chứng mới theo đúng quy định.",
  },
  "recipients.primaryLine": {
    label: "Nơi nhận",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
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

const BM170_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "75/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Phó Viện trưởng Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 41, 106 và 165 của Bộ luật Tố tụng hình sự",
  "evidenceHandlingCancellation.caseInitiationLine": "Căn cứ Quyết định khởi tố vụ án số 10/QĐ-KTVA ngày 10/02/2026",
  "evidenceHandlingCancellation.defendantInitiationLine": "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  "evidenceHandlingCancellation.evidenceHandlingDecisionReviewLine": "Xét thấy Quyết định xử lý vật chứng số 68/QĐ-VKS có nội dung trái pháp luật",
  "evidenceHandlingCancellation.unlawfulReasonLine": "Quyết định xử lý vật chứng vi phạm Điều 106 BLTTHS về thẩm quyền ban hành",
  "evidenceHandlingCancellation.article1Line": "Điều 1. Hủy bỏ Quyết định xử lý vật chứng số 68/QĐ-VKS ngày 28/02/2026.",
  "evidenceHandlingCancellation.article2Line": "Điều 2. Yêu cầu Cơ quan Cảnh sát điều tra ban hành quyết định xử lý vật chứng mới theo đúng quy định.",
  "recipients.primaryLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội (để thi hành)",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Anh",
} as const;

const BM170_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-170",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-170 runtime-ux vật-chứng-huỷ-bỏ curated source-render profile`,
  sections: BM170_SECTIONS,
  fields: BM170_FIELDS,
  demo: BM170_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM170_RUNTIME_UX_PROFILE);
