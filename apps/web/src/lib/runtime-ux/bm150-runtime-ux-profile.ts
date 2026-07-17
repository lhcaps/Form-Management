/**
 * BM-150 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-150 profile to a
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

const BM150_SECTIONS = [
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

const BM150_FIELDS = {
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
  "prosecutionCaseTermination.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  },
  "prosecutionCaseTermination.caseDecisionLegalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder: "Căn cứ Quyết định số 12/HSKT ngày 15/02/2026",
  },
  "prosecutionCaseTermination.accusedDecisionLegalBasisLine": {
    label: "Căn cứ quyết định khởi tố bị can",
    placeholder: "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  },
  "prosecutionCaseTermination.reasonLine": {
    label: "Lý do chấm dứt truy tố",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseTermination.article1Line": {
    label: "Điều 1 - Nội dung quyết định",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "prosecutionCaseTermination.article2Line": {
    label: "Điều 2 - Hậu quả pháp lý",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseTermination.article3Line": {
    label: "Điều 3 - Thông báo",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseTermination.article4Line": {
    label: "Điều 4 - Khiếu nại",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseTermination.superiorProcuracyRecipientLine": {
    label: "Nơi nhận - VKS cấp trên",
    placeholder: "Nhap noi dung",
  },
  "recipients.otherRecipientsLine": {
    label: "Nơi nhận - Cơ quan khác",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseTermination.accusedOrRepresentativeRecipientLine": {
    label: "Nơi nhận - Bị can/đại diện",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseTermination.investigationAuthorityRecipientLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseTermination.defenseCounselRecipientLine": {
    label: "Nơi nhận - Luật sư",
    placeholder: "Nhap noi dung",
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

const BM150_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "prosecutionCaseTermination.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "prosecutionCaseTermination.caseDecisionLegalBasisLine": "Căn cứ Quyết định số 12/HSKT ngày 15/02/2026",
  "prosecutionCaseTermination.accusedDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  "prosecutionCaseTermination.reasonLine": "Tran Van Binh",
  "prosecutionCaseTermination.article1Line": "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  "prosecutionCaseTermination.article2Line": "Tran Van Binh",
  "prosecutionCaseTermination.article3Line": "Tran Van Binh",
  "prosecutionCaseTermination.article4Line": "Tran Van Binh",
  "prosecutionCaseTermination.superiorProcuracyRecipientLine": "Tran Van Binh",
  "recipients.otherRecipientsLine": "Tran Van Binh",
  "prosecutionCaseTermination.accusedOrRepresentativeRecipientLine": "Tran Van Binh",
  "prosecutionCaseTermination.investigationAuthorityRecipientLine": "Tran Van Binh",
  "prosecutionCaseTermination.defenseCounselRecipientLine": "Tran Van Binh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Trần Thị Hồng Nhung",
} as const;

const BM150_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-150",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-150 runtime-ux batch 7 curated source-render profile`,
  sections: BM150_SECTIONS,
  fields: BM150_FIELDS,
  demo: BM150_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM150_RUNTIME_UX_PROFILE);
