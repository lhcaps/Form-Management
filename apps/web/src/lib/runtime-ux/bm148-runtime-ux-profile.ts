/**
 * BM-148 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-148 profile to a
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

const BM148_SECTIONS = [
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
    sectionId: "section-thong-tin-bi-can",
    title: "Thông tin bị can",
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

const BM148_FIELDS = {
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
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính",
    placeholder: "Nhap noi dung",
  },
  "caseDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định truy tố",
    placeholder: "Nhap noi dung",
  },
  "accusedDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định đối với bị can",
    placeholder: "Nhap noi dung",
  },
  "suspension.reasonLine": {
    label: "Lý do đình chỉ điều tra",
    placeholder: "Nhap noi dung",
  },
  "suspension.article1Line": {
    label: "Điều 1 - Nội dung quyết định",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "person.fullName": {
    label: "Họ và tên",
    placeholder: "Trần Văn Bình",
  },
  "person.genderText": {
    label: "Giới tính",
    placeholder: "Nhap noi dung",
  },
  "person.otherName": {
    label: "Tên gọi khác",
    placeholder: "Nhap noi dung",
  },
  "person.birthDateLine": {
    label: "Sinh ngày",
    placeholder: "Nhap noi dung",
  },
  "person.nationalityEthnicityReligionLine": {
    label: "Quốc tịch, dân tộc, tôn giáo",
    placeholder: "Nhap noi dung",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Nhap noi dung",
  },
  "person.identityNo": {
    label: "Số CMND/CCCD",
    placeholder: "079085001234",
  },
  "person.identityIssueLine": {
    label: "Nơi cấp CMND/CCCD",
    placeholder: "Nhap noi dung",
  },
  "person.permanentResidence": {
    label: "Nơi thường trú",
    placeholder: "Nhap noi dung",
  },
  "person.temporaryResidence": {
    label: "Nơi tạm trú",
    placeholder: "Nhap noi dung",
  },
  "person.currentResidence": {
    label: "Nơi ở hiện tại",
    placeholder: "Nhap noi dung",
  },
  "suspension.article2ActionLine": {
    label: "Điều 2 - Hành động",
    placeholder: "Nhap noi dung",
  },
  "suspension.executionRequestLine": {
    label: "Điều 3 - Yêu cầu",
    placeholder: "Nhap noi dung",
  },
  "recipients.line1": {
    label: "Nơi nhận chính 1",
    placeholder: "Nhap noi dung",
  },
  "recipients.line2": {
    label: "Nơi nhận chính 2",
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

const BM148_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "legalBasis.juvenileJusticeLine": "Tran Van Binh",
  "caseDecision.prosecutionDecisionLegalBasisLine": "Tran Van Binh",
  "accusedDecision.prosecutionDecisionLegalBasisLine": "Tran Van Binh",
  "suspension.reasonLine": "Tran Van Binh",
  "suspension.article1Line": "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  "person.fullName": "Trần Văn Bình",
  "person.genderText": "Tran Van Binh",
  "person.otherName": "Tran Van Binh",
  "person.birthDateLine": "Tran Van Binh",
  "person.nationalityEthnicityReligionLine": "Tran Van Binh",
  "person.occupation": "Tran Van Binh",
  "person.identityNo": "079085001234",
  "person.identityIssueLine": "Tran Van Binh",
  "person.permanentResidence": "Tran Van Binh",
  "person.temporaryResidence": "Tran Van Binh",
  "person.currentResidence": "Tran Van Binh",
  "suspension.article2ActionLine": "Tran Van Binh",
  "suspension.executionRequestLine": "Tran Van Binh",
  "recipients.line1": "Tran Van Binh",
  "recipients.line2": "Tran Van Binh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Trần Thị Hồng Nhung",
} as const;

const BM148_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-148",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-148 runtime-ux batch 7 curated source-render profile`,
  sections: BM148_SECTIONS,
  fields: BM148_FIELDS,
  demo: BM148_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM148_RUNTIME_UX_PROFILE);
