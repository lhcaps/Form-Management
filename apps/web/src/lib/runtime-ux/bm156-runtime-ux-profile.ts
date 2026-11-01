/**
 * BM-156 runtime-ux curated source-render profile.
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
 * Family: CÁO TRẠNG — prosecution-stage formal indictment document.
 * The most structurally complex prosecution document (41 fields, 5 sections).
 * Covers prosecution basis, case facts, indictment articles, and recipients.
 * Distinct from all prior families. Shares QUYẾT ĐỊNH infrastructure
 * headers but the document type is CÁO TRẠNG (not QUYẾT ĐỊNH).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM156_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Thông tin cơ quan ban hành và văn bản Cáo trạng. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Các căn cứ pháp lý cho Cáo trạng: căn cứ Bộ luật Tố tụng hình sự (Điều 41, 236, 239, 243), căn cứ quyết định khởi tố vụ án, căn cứ quyết định khởi tố bị can, căn cứ gộp/tách vụ án, căn cứ phục hồi vụ án, căn cứ kết luận điều tra.",
  },
  {
    sectionId: "section-noi-dung-cao-trang",
    title: "Nội dung cáo trạng",
    description:
      "Nội dung Cáo trạng gồm: mô tả hành vi phạm tội, phân tích tình tiết tăng nặng/giảm nhẹ, tang vật/chứng cứ, trách nhiệm dân sự, các tình tiết khác, tổng kết kết luận, ghi chú vắng mặt bị can, nhân thân bị can, hoàn cảnh gia đình, tình trạng đặc biệt, vi phạm hành chính, tiền án, biện pháp ngăn chặn, kết luận về tội phạm, và nội dung Điều 1.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Danh sách nơi nhận Cáo trạng: Tòa án, bị can, người bào chữa, cơ quan điều tra, người khác, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Thông tin chế độ ký, chức vụ và họ tên người ký Cáo trạng.",
  },
] as const;

const BM156_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "",
  },
  "caseDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định khởi tố vụ án",
    placeholder: "Nhập nội dung",
  },
  "accusedDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định khởi tố bị can",
    placeholder: "Nhập nội dung",
  },
  "caseJoinder.legalBasisLine": {
    label: "Căn cứ gộp vụ án",
    placeholder: "Nhập nội dung",
  },
  "caseRecovery.legalBasisLine": {
    label: "Căn cứ thu hồi/phục hồi vụ án",
    placeholder: "Nhập nội dung",
  },
  "investigationConclusion.legalBasisLine": {
    label: "Căn cứ kết luận điều tra",
    placeholder: "Nhập nội dung",
  },
  "indictment.criminalActDescriptionLine": {
    label: "Mô tả hành vi phạm tội",
    placeholder: "Nhập nội dung",
  },
  "indictment.aggravatingMitigatingAnalysisLine": {
    label: "Phân tích tăng nặng, giảm nhẹ",
    placeholder: "Nhập nội dung",
  },
  "indictment.evidenceHandlingLine": {
    label: "Tình trạng tang vật, phương tiện",
    placeholder: "Nhập nội dung",
  },
  "indictment.civilLiabilityLine": {
    label: "Trách nhiệm dân sự",
    placeholder: "Nhập nội dung",
  },
  "indictment.otherFactsLine": {
    label: "Các tình tiết khác",
    placeholder: "Nhập nội dung",
  },
  "indictment.summaryConclusionLine": {
    label: "Tổng kết kết luận",
    placeholder: "Nhập nội dung",
  },
  "indictment.absentAccusedNoteLine": {
    label: "Ghi chú vắng mặt bị can",
    placeholder: "Nhập nội dung",
  },
  "indictment.defendantIdentityLine": {
    label: "Nhân thân bị can",
    placeholder: "Nhập nội dung",
  },
  "indictment.familyBackgroundLine": {
    label: "Hoàn cảnh gia đình",
    placeholder: "Nhập nội dung",
  },
  "indictment.specialStatusLine": {
    label: "Tình trạng đặc biệt",
    placeholder: "Nhập nội dung",
  },
  "indictment.administrativeViolationLine": {
    label: "Vi phạm hành chính liên quan",
    placeholder: "Nhập nội dung",
  },
  "indictment.criminalRecordLine": {
    label: "Tiền án",
    placeholder: "Nhập nội dung",
  },
  "indictment.preventiveMeasureLine": {
    label: "Biện pháp ngăn chặn đang áp dụng",
    placeholder: "Nhập nội dung",
  },
  "indictment.crimeConclusionLine": {
    label: "Kết luận về tội phạm",
    placeholder: "Nhập nội dung",
  },
  "indictment.aggravatingMitigatingLine": {
    label: "Tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự",
    placeholder: "Nhập nội dung",
  },
  "indictment.separatedCaseHandlingLine": {
    label: "Xử lý vụ án tách biệt",
    placeholder: "Nhập nội dung",
  },
  "indictment.article1Line": {
    label: "Điều 1 - Quyết định truy tố",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "indictment.replacementLine": {
    label: "Điều khoản thay thế",
    placeholder: "Nhập nội dung",
  },
  "indictment.caseFileLine": {
    label: "Hồ sơ vụ án",
    placeholder: "Nhập nội dung",
  },
  "indictment.evidenceListLine": {
    label: "Danh mục chứng cứ",
    placeholder: "Nhập nội dung",
  },
  "indictment.summonedPersonsLine": {
    label: "Người được triệu tập",
    placeholder: "Nhập nội dung",
  },
  "recipients.courtLine": {
    label: "Nơi nhận - Tòa án",
    placeholder: "Nhập nội dung",
  },
  "recipients.accusedLine": {
    label: "Nơi nhận - Bị can",
    placeholder: "Nhập nội dung",
  },
  "recipients.defenseCounselLine": {
    label: "Nơi nhận - Người bào chữa",
    placeholder: "Nhập nội dung",
  },
  "recipients.investigatingAgencyLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder: "Nhập nội dung",
  },
  "recipients.otherRecipientLine": {
    label: "Nơi nhận - Người khác",
    placeholder: "Nhập nội dung",
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
    placeholder: "Nhập họ tên người ký",
  },
} as const;

const BM156_DEMO_RUNTIME_UX = {
  "agency.parentName": "",
  "agency.name": "",
  "document.documentCode": "",
  "document.issuePlaceAndDateLine": "",
  "official.issuerTitle": "",
  "legalBasis.procedureArticlesLine": "",
  "caseDecision.prosecutionDecisionLegalBasisLine": "",
  "accusedDecision.prosecutionDecisionLegalBasisLine": "",
  "caseJoinder.legalBasisLine": "",
  "caseRecovery.legalBasisLine": "",
  "investigationConclusion.legalBasisLine": "",
  "indictment.criminalActDescriptionLine": "",
  "indictment.aggravatingMitigatingAnalysisLine": "",
  "indictment.evidenceHandlingLine": "",
  "indictment.civilLiabilityLine": "",
  "indictment.otherFactsLine": "",
  "indictment.summaryConclusionLine": "",
  "indictment.absentAccusedNoteLine": "",
  "indictment.defendantIdentityLine": "",
  "indictment.familyBackgroundLine": "",
  "indictment.specialStatusLine": "",
  "indictment.administrativeViolationLine": "",
  "indictment.criminalRecordLine": "",
  "indictment.preventiveMeasureLine": "",
  "indictment.crimeConclusionLine": "",
  "indictment.aggravatingMitigatingLine": "",
  "indictment.separatedCaseHandlingLine": "",
  "indictment.article1Line": "",
  "indictment.replacementLine": "",
  "indictment.caseFileLine": "",
  "indictment.evidenceListLine": "",
  "indictment.summonedPersonsLine": "",
  "recipients.courtLine": "",
  "recipients.accusedLine": "",
  "recipients.defenseCounselLine": "",
  "recipients.investigatingAgencyLine": "",
  "recipients.otherRecipientLine": "",
  "recipients.archiveLine": "",
  "signature.signMode": "",
  "signature.positionTitle": "",
  "signature.signerName": "",
} as const;

const BM156_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-156",
  versionLabel: `BM-156 — Cáo trạng (runtime-ux)`,
  sections: BM156_SECTIONS,
  fields: BM156_FIELDS,
  demo: BM156_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-co-quan-va-van-ban",
      title: "Cơ quan và văn bản",
      description:
        "Thông tin cơ quan ban hành và văn bản Cáo trạng. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
      fieldKeys: [
        "agency.parentName",
        "agency.name",
        "document.documentCode",
        "document.issuePlaceAndDateLine",
        "official.issuerTitle",
      ],
    },
    {
      id: "section-can-cu-phap-ly",
      title: "Căn cứ pháp lý",
      description:
        "Các căn cứ pháp lý cho Cáo trạng: căn cứ Bộ luật Tố tụng hình sự (Điều 41, 236, 239, 243), căn cứ quyết định khởi tố vụ án, căn cứ quyết định khởi tố bị can, căn cứ gộp/tách vụ án, căn cứ phục hồi vụ án, căn cứ kết luận điều tra.",
      fieldKeys: [
        "legalBasis.procedureArticlesLine",
        "caseDecision.prosecutionDecisionLegalBasisLine",
        "accusedDecision.prosecutionDecisionLegalBasisLine",
        "caseJoinder.legalBasisLine",
        "caseRecovery.legalBasisLine",
        "investigationConclusion.legalBasisLine",
      ],
    },
    {
      id: "section-noi-dung-cao-trang",
      title: "Nội dung cáo trạng",
      description:
        "Nội dung Cáo trạng gồm: mô tả hành vi phạm tội, phân tích tình tiết tăng nặng/giảm nhẹ, tang vật/chứng cứ, trách nhiệm dân sự, các tình tiết khác, tổng kết kết luận, ghi chú vắng mặt bị can, nhân thân bị can, hoàn cảnh gia đình, tình trạng đặc biệt, vi phạm hành chính, tiền án, biện pháp ngăn chặn, kết luận về tội phạm, và nội dung Điều 1.",
      fieldKeys: [
        "indictment.criminalActDescriptionLine",
        "indictment.aggravatingMitigatingAnalysisLine",
        "indictment.evidenceHandlingLine",
        "indictment.civilLiabilityLine",
        "indictment.otherFactsLine",
        "indictment.summaryConclusionLine",
        "indictment.absentAccusedNoteLine",
        "indictment.defendantIdentityLine",
        "indictment.familyBackgroundLine",
        "indictment.specialStatusLine",
        "indictment.administrativeViolationLine",
        "indictment.criminalRecordLine",
        "indictment.preventiveMeasureLine",
        "indictment.crimeConclusionLine",
        "indictment.aggravatingMitigatingLine",
        "indictment.separatedCaseHandlingLine",
        "indictment.article1Line",
        "indictment.replacementLine",
        "indictment.caseFileLine",
        "indictment.evidenceListLine",
        "indictment.summonedPersonsLine",
      ],
    },
    {
      id: "section-noi-nhan",
      title: "Nơi nhận",
      description:
        "Danh sách nơi nhận Cáo trạng: Tòa án, bị can, người bào chữa, cơ quan điều tra, người khác, lưu hồ sơ.",
      fieldKeys: [
        "recipients.courtLine",
        "recipients.accusedLine",
        "recipients.defenseCounselLine",
        "recipients.investigatingAgencyLine",
        "recipients.otherRecipientLine",
        "recipients.archiveLine",
      ],
    },
    {
      id: "section-chu-ky",
      title: "Chữ ký",
      description:
        "Thông tin chế độ ký, chức vụ và họ tên người ký Cáo trạng.",
      fieldKeys: [
        "signature.signMode",
        "signature.positionTitle",
        "signature.signerName",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM156_RUNTIME_UX_PROFILE);
