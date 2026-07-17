/**
 * BM-156 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-156 profile to a
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

const BM156_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
  },
  {
    sectionId: "section-noi-dung-cao-trang",
    title: "Nội dung cáo trạng",
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

const BM156_FIELDS = {
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
  "caseDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định truy tố",
    placeholder: "Nhap noi dung",
  },
  "accusedDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định đối với bị can",
    placeholder: "Nhap noi dung",
  },
  "caseJoinder.legalBasisLine": {
    label: "Căn cứ gộp vụ án",
    placeholder: "Nhap noi dung",
  },
  "caseRecovery.legalBasisLine": {
    label: "Căn cứ thu hồi vụ án",
    placeholder: "Nhap noi dung",
  },
  "investigationConclusion.legalBasisLine": {
    label: "Căn cứ kết luận điều tra",
    placeholder: "Nhap noi dung",
  },
  "indictment.criminalActDescriptionLine": {
    label: "Mô tả hành vi phạm tội",
    placeholder: "Nhap noi dung",
  },
  "indictment.aggravatingMitigatingAnalysisLine": {
    label: "Phân tích tăng nặng, giảm nhẹ",
    placeholder: "Nhap noi dung",
  },
  "indictment.evidenceHandlingLine": {
    label: "Tình trạng tang vật, phương tiện",
    placeholder: "Nhap noi dung",
  },
  "indictment.civilLiabilityLine": {
    label: "Trách nhiệm dân sự",
    placeholder: "Nhap noi dung",
  },
  "indictment.otherFactsLine": {
    label: "Các tình tiết khác",
    placeholder: "Nhap noi dung",
  },
  "indictment.summaryConclusionLine": {
    label: "Tổng kết kết luận",
    placeholder: "Nhap noi dung",
  },
  "indictment.absentAccusedNoteLine": {
    label: "Ghi chú vắng mặt bị can",
    placeholder: "Nhap noi dung",
  },
  "indictment.defendantIdentityLine": {
    label: "Nhân thân bị can",
    placeholder: "Nhap noi dung",
  },
  "indictment.familyBackgroundLine": {
    label: "Hoàn cảnh gia đình",
    placeholder: "Nhap noi dung",
  },
  "indictment.specialStatusLine": {
    label: "Tình trạng đặc biệt",
    placeholder: "Nhap noi dung",
  },
  "indictment.administrativeViolationLine": {
    label: "Vi phạm hành chính liên quan",
    placeholder: "Nhap noi dung",
  },
  "indictment.criminalRecordLine": {
    label: "Tiền án",
    placeholder: "Nhap noi dung",
  },
  "indictment.preventiveMeasureLine": {
    label: "Biện pháp ngăn chặn đang áp dụng",
    placeholder: "Nhap noi dung",
  },
  "indictment.crimeConclusionLine": {
    label: "Kết luận về tội phạm",
    placeholder: "Nhap noi dung",
  },
  "indictment.aggravatingMitigatingLine": {
    label: "Tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự",
    placeholder: "Nhap noi dung",
  },
  "indictment.separatedCaseHandlingLine": {
    label: "Xử lý vụ án tách biệt",
    placeholder: "Nhap noi dung",
  },
  "indictment.article1Line": {
    label: "Điều 1 - Quyết định truy tố",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "indictment.replacementLine": {
    label: "Điều khoản thay thế",
    placeholder: "Nhap noi dung",
  },
  "indictment.caseFileLine": {
    label: "Hồ sơ vụ án",
    placeholder: "Nhap noi dung",
  },
  "indictment.evidenceListLine": {
    label: "Danh mục chứng cứ",
    placeholder: "Nhap noi dung",
  },
  "indictment.summonedPersonsLine": {
    label: "Người được triệu tập",
    placeholder: "Nhap noi dung",
  },
  "recipients.courtLine": {
    label: "Nơi nhận - Tòa án",
    placeholder: "Nhap noi dung",
  },
  "recipients.accusedLine": {
    label: "Nơi nhận - Bị can",
    placeholder: "Bị can Trần Văn Bình (đang bị tạm giam)",
  },
  "recipients.defenseCounselLine": {
    label: "Nơi nhận - Người bào chữa",
    placeholder: "Nhap noi dung",
  },
  "recipients.investigatingAgencyLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  },
  "recipients.otherRecipientLine": {
    label: "Nơi nhận - Người khác",
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

const BM156_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "caseDecision.prosecutionDecisionLegalBasisLine": "Tran Van Binh",
  "accusedDecision.prosecutionDecisionLegalBasisLine": "Tran Van Binh",
  "caseJoinder.legalBasisLine": "Tran Van Binh",
  "caseRecovery.legalBasisLine": "Tran Van Binh",
  "investigationConclusion.legalBasisLine": "Tran Van Binh",
  "indictment.criminalActDescriptionLine": "Tran Van Binh",
  "indictment.aggravatingMitigatingAnalysisLine": "Tran Van Binh",
  "indictment.evidenceHandlingLine": "Tran Van Binh",
  "indictment.civilLiabilityLine": "Tran Van Binh",
  "indictment.otherFactsLine": "Tran Van Binh",
  "indictment.summaryConclusionLine": "Tran Van Binh",
  "indictment.absentAccusedNoteLine": "Tran Van Binh",
  "indictment.defendantIdentityLine": "Tran Van Binh",
  "indictment.familyBackgroundLine": "Tran Van Binh",
  "indictment.specialStatusLine": "Tran Van Binh",
  "indictment.administrativeViolationLine": "Tran Van Binh",
  "indictment.criminalRecordLine": "Tran Van Binh",
  "indictment.preventiveMeasureLine": "Tran Van Binh",
  "indictment.crimeConclusionLine": "Tran Van Binh",
  "indictment.aggravatingMitigatingLine": "Tran Van Binh",
  "indictment.separatedCaseHandlingLine": "Tran Van Binh",
  "indictment.article1Line": "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  "indictment.replacementLine": "Tran Van Binh",
  "indictment.caseFileLine": "Tran Van Binh",
  "indictment.evidenceListLine": "Tran Van Binh",
  "indictment.summonedPersonsLine": "Tran Van Binh",
  "recipients.courtLine": "Tran Van Binh",
  "recipients.accusedLine": "Bị can Trần Văn Bình (đang bị tạm giam tại Trại tạm giam Công an Thành phố Hà Nội)",
  "recipients.defenseCounselLine": "Tran Van Binh",
  "recipients.investigatingAgencyLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.otherRecipientLine": "Tran Van Binh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Trần Thị Hồng Nhung",
} as const;

const BM156_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-156",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-156 runtime-ux batch 7 curated source-render profile`,
  sections: BM156_SECTIONS,
  fields: BM156_FIELDS,
  demo: BM156_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM156_RUNTIME_UX_PROFILE);
