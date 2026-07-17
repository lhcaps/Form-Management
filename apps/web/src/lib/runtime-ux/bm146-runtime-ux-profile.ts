/**
 * BM-146 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-146 profile to a
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

const BM146_SECTIONS = [
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

const BM146_FIELDS = {
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
  "prosecutionCaseSuspension.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  },
  "prosecutionCaseSuspension.caseDecisionLegalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder: "Căn cứ Quyết định số 12/HSKT ngày 15/02/2026",
  },
  "prosecutionCaseSuspension.reasonLine": {
    label: "Lý do đình chỉ điều tra vụ án",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseSuspension.article1Line": {
    label: "Điều 1 - Nội dung quyết định",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "prosecutionCaseSuspension.article2Line": {
    label: "Điều 2 - Xử lý vật chứng",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseSuspension.article3Line": {
    label: "Điều 3 - Thông báo",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseSuspension.article4Line": {
    label: "Điều 4 - Thẩm quyền giải quyết",
    placeholder: "Nhap noi dung",
  },
  "prosecutionCaseSuspension.investigationAuthorityRecipientLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder: "Nhap noi dung",
  },
  "recipients.otherRecipientsLine": {
    label: "Nơi nhận khác",
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

const BM146_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "prosecutionCaseSuspension.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "prosecutionCaseSuspension.caseDecisionLegalBasisLine": "Căn cứ Quyết định số 12/HSKT ngày 15/02/2026",
  "prosecutionCaseSuspension.reasonLine": "Tran Van Binh",
  "prosecutionCaseSuspension.article1Line": "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  "prosecutionCaseSuspension.article2Line": "Tran Van Binh",
  "prosecutionCaseSuspension.article3Line": "Tran Van Binh",
  "prosecutionCaseSuspension.article4Line": "Tran Van Binh",
  "prosecutionCaseSuspension.investigationAuthorityRecipientLine": "Tran Van Binh",
  "recipients.otherRecipientsLine": "Tran Van Binh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Trần Thị Hồng Nhung",
} as const;

const BM146_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-146",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-146 runtime-ux batch 7 curated source-render profile`,
  sections: BM146_SECTIONS,
  fields: BM146_FIELDS,
  demo: BM146_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM146_RUNTIME_UX_PROFILE);
