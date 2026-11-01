/**
 * BM-166 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-166 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: QĐ trả hồ sơ vụ án để điều tra lại
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS via Batch 8 source/render smoke
 * only. Browser/demo/preview/DOCX/fidelity/visual/human evidence
 * remains NOT_RUN for Batch 8.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM166_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description: "Cơ quan cấp trên, Viện kiểm sát ban hành, số quyết định, chủ thể ban hành và ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description: "Căn cứ Bộ luật Tố tụng hình sự và căn cứ Bản án/Quyết định của Tòa án làm cơ sở trả hồ sơ để điều tra lại.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description: "Điều 1 nêu nội dung trả hồ sơ vụ án để điều tra lại; Điều 2 nêu yêu cầu tiến hành điều tra lại theo quy định.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description: "Cơ quan điều tra nhận hồ sơ và nơi lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký quyết định.",
  },
] as const;

const BM166_FIELDS = {
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
    placeholder: "55/QĐ-VKS",
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
    placeholder: "Căn cứ Điều 41 và Điều 174 Bộ luật Tố tụng hình sự",
  },
  "returnInvestigation.courtDecisionLegalBasisLine": {
    label: "Căn cứ Bản án/Quyết định của Tòa án",
    placeholder: "Căn cứ Bản án số 18/HS-ST ngày 25/02/2026 của Tòa án nhân dân Thành phố Hà Nội về việc hủy Bản án sơ thẩm để điều tra lại",
  },
  "returnInvestigation.article1Line": {
    label: "Điều 1 - Nội dung trả hồ sơ",
    placeholder: "Điều 1. Trả hồ sơ vụ án để điều tra lại.",
  },
  "returnInvestigation.article2Line": {
    label: "Điều 2 - Yêu cầu",
    placeholder: "Điều 2. Yêu cầu tiến hành điều tra lại vụ án theo quy định của Bộ luật Tố tụng hình sự.",
  },
  "recipients.line1": {
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
    placeholder: "Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Ngô Quang Hưng",
  },
} as const;

const BM166_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "55/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 41 và Điều 174 Bộ luật Tố tụng hình sự",
  "returnInvestigation.courtDecisionLegalBasisLine": "Căn cứ Bản án số 18/HS-ST ngày 25/02/2026 của Tòa án nhân dân Thành phố Hà Nội về việc hủy Bản án sơ thẩm để điều tra lại",
  "returnInvestigation.article1Line": "Điều 1. Trả hồ sơ vụ án hình sự số 12/HS-ST về tội trộm cắp tài sản quy định tại khoản 1 Điều 173 của Bộ luật Hình sự cho Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội để điều tra lại. Thời hạn điều tra lại được tính từ khi Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội nhận hồ sơ vụ án và Quyết định này.",
  "returnInvestigation.article2Line": "Điều 2. Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội tiến hành điều tra lại vụ án theo quy định của Bộ luật Tố tụng hình sự.",
  "recipients.line1": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội (để điều tra lại)",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Ngô Quang Hưng",
} as const;

const BM166_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-166",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-166 runtime-ux batch 8 curated source-render profile`,
  sections: BM166_SECTIONS,
  fields: BM166_FIELDS,
  demo: BM166_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM166_RUNTIME_UX_PROFILE);
