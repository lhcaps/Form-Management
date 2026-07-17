/**
 * BM-145 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-145 profile to a
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

const BM145_SECTIONS = [
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

const BM145_FIELDS = {
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
  "prosecutionSupplementReturn.returnRoundLine": {
    label: "Vòng trả hồ sơ",
    placeholder: "Nhap noi dung",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng",
  },
  "prosecutionSupplementReturn.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  },
  "prosecutionSupplementReturn.investigationConclusionLegalBasisLine": {
    label: "Căn cứ kết luận điều tra",
    placeholder: "Căn cứ Kết luận điều tra số 25/KLĐT ngày 01/03/2026",
  },
  "prosecutionSupplementReturn.courtReturnDecisionLegalBasisLine": {
    label: "Căn cứ quyết định Tòa án trả hồ sơ",
    placeholder: "Nhap noi dung",
  },
  "prosecutionSupplementReturn.reasonLine": {
    label: "Lý do trả hồ sơ",
    placeholder: "Nhap noi dung",
  },
  "prosecutionSupplementReturn.article1IntroLine": {
    label: "Điều 1 - Mở đầu",
    placeholder: "Nhap noi dung",
  },
  "prosecutionSupplementReturn.supplementIssue1Line": {
    label: "Điều 1 - Vấn đề 1 cần điều tra bổ sung",
    placeholder: "Nhap noi dung",
  },
  "prosecutionSupplementReturn.supplementIssue2Line": {
    label: "Điều 1 - Vấn đề 2 cần điều tra bổ sung",
    placeholder: "Nhap noi dung",
  },
  "prosecutionSupplementReturn.supplementIssue3Line": {
    label: "Điều 1 - Vấn đề 3 cần điều tra bổ sung",
    placeholder: "Nhap noi dung",
  },
  "prosecutionSupplementReturn.article2Line": {
    label: "Điều 2 - Chuyển hồ sơ",
    placeholder: "Nhap noi dung",
  },
  "prosecutionSupplementReturn.article3Line": {
    label: "Điều 3 - Yêu cầu",
    placeholder: "Nhap noi dung",
  },
  "prosecutionSupplementReturn.investigationAuthorityRecipientLine": {
    label: "Nơi nhận - Cơ quan điều tra",
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

const BM145_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày 04 tháng 3 năm 2026",
  "prosecutionSupplementReturn.returnRoundLine": "Tran Van Binh",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "prosecutionSupplementReturn.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "prosecutionSupplementReturn.investigationConclusionLegalBasisLine": "Căn cứ Kết luận điều tra số 25/KLĐT ngày 01/03/2026",
  "prosecutionSupplementReturn.courtReturnDecisionLegalBasisLine": "Tran Van Binh",
  "prosecutionSupplementReturn.reasonLine": "Tran Van Binh",
  "prosecutionSupplementReturn.article1IntroLine": "Tran Van Binh",
  "prosecutionSupplementReturn.supplementIssue1Line": "Tran Van Binh",
  "prosecutionSupplementReturn.supplementIssue2Line": "Tran Van Binh",
  "prosecutionSupplementReturn.supplementIssue3Line": "Tran Van Binh",
  "prosecutionSupplementReturn.article2Line": "Tran Van Binh",
  "prosecutionSupplementReturn.article3Line": "Tran Van Binh",
  "prosecutionSupplementReturn.investigationAuthorityRecipientLine": "Tran Van Binh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Trần Thị Hồng Nhung",
} as const;

const BM145_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-145",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-145 runtime-ux batch 7 curated source-render profile`,
  sections: BM145_SECTIONS,
  fields: BM145_FIELDS,
  demo: BM145_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM145_RUNTIME_UX_PROFILE);
