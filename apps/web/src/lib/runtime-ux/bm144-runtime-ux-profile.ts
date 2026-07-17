/**
 * BM-144 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-144 profile to a
 * curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS requires source/render smoke +
 * Batch 7 curation only. Browser/demo/preview/DOCX/fidelity/visual/
 * human evidence remains NOT_RUN for Batch 7.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM144_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
  },
] as const;

const BM144_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Nhap noi dung",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "21/QĐ-VKSKV7",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Thành phố Hà Nội, ngày 04 tháng 3 năm 2026",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng",
  },
  "prosecutionExtension.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  },
  "prosecutionExtension.caseDecisionLegalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder: "Căn cứ Quyết định số 12/HSKT ngày 15/02/2026",
  },
  "prosecutionExtension.accusedDecisionLegalBasisLine": {
    label: "Căn cứ quyết định khởi tố bị can",
    placeholder: "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  },
  "prosecutionExtension.investigationConclusionLegalBasisLine": {
    label: "Căn cứ Kết luận điều tra",
    placeholder: "Căn cứ Kết luận điều tra số 25/KLĐT ngày 01/03/2026",
  },
  "prosecutionExtension.reasonLine": {
    label: "Lý do gia hạn",
    placeholder: "Nhap noi dung",
  },
  "prosecutionExtension.article1Line": {
    label: "Điều 1 - Nội dung quyết định",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "recipients.investigatingAgencyLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  },
  "recipients.accusedLine": {
    label: "Nơi nhận - Bị can",
    placeholder: "Bị can Trần Văn Bình (đang bị tạm giam)",
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
    placeholder: "Trần Thị Hồng Nhung",
  },
} as const;

const BM144_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "prosecutionExtension.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "prosecutionExtension.caseDecisionLegalBasisLine": "Căn cứ Quyết định số 12/HSKT ngày 15/02/2026",
  "prosecutionExtension.accusedDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  "prosecutionExtension.investigationConclusionLegalBasisLine": "Căn cứ Kết luận điều tra số 25/KLĐT ngày 01/03/2026",
  "prosecutionExtension.reasonLine": "Tran Van Binh",
  "prosecutionExtension.article1Line": "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  "recipients.investigatingAgencyLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.accusedLine": "Bị can Trần Văn Bình (đang bị tạm giam tại Trại tạm giam Công an Thành phố Hà Nội)",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Trần Thị Hồng Nhung",
} as const;

const BM144_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-144",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-144 runtime-ux batch 7 curated source-render profile`,
  sections: BM144_SECTIONS,
  fields: BM144_FIELDS,
  demo: BM144_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM144_RUNTIME_UX_PROFILE);
