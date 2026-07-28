/**
 * BM-159 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-159 profile to a
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
 *
 * Source evidence:
 *   docs/audit/docx/extracted/BM-159__d95eb7bda8e3.extract.md
 *   (extractHeading = "QUYẾT ĐỊNH" anchored on P0011, operative
 *    phrase "Phân công Viện kiểm sát cấp dưới thực hành quyền công
 *    tố, kiểm sát xét xử sở thẩm vụ án hình sự" anchored on P0012-P0013,
 *    legal basis "Căn cứ Điều 41 và Điều 239" anchored on P0015)
 *
 * Curation scope (this patch, queue-gap closure):
 *   - Section descriptions only, aligned to extract paragraphs
 *     P0001-P0047. No label/key/control/payload/demo change.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM159_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Dòng VIỆN KIỂM SÁT, CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM - Độc lập - Tự do - Hạnh phúc; số quyết định, địa danh, ngày tháng năm ban hành (P0001-P0010).",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Căn cứ Điều 41 và Điều 239 của Bộ luật Tố tụng hình sự (P0015); Căn cứ Cáo trạng số ... ngày ... của Viện kiểm sát (P0016-P0020).",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Điều 1 - Phân công Viện kiểm sát thực hành quyền công tố, kiểm sát xét xử sơ thẩm vụ án về tội danh và điều luật áp dụng (P0022-P0027); Điều 2 - Viện kiểm sát được phân công thực hiện quyết định theo quy định của Bộ luật Tố tụng hình sự (P0028).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Viện kiểm sát được phân công, Tòa án có thẩm quyền xét xử và lưu hồ sơ HSVA, HSKS, VP (P0029-P0032).",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Ký, ghi rõ họ tên, đóng dấu; chức danh người ký (P0033, P0044); Mẫu số 159/HS - ban hành theo Thông tư số /2026/TT-VKSTC (P0045-P0047).",
  },
] as const;

const BM159_FIELDS = {
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
  "subordinateProcuracyTrialAssignment.indictmentLine": {
    label: "Căn cứ cáo trạng",
    placeholder: "Nhap noi dung",
  },
  "subordinateProcuracyTrialAssignment.article1Line": {
    label: "Điều 1 - Nội dung quyết định",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "subordinateProcuracyTrialAssignment.article2Line": {
    label: "Điều 2 - Thời hạn",
    placeholder: "Nhap noi dung",
  },
  "recipients.assignedProcuracyLine": {
    label: "Nơi nhận - Viện kiểm sát được phân công",
    placeholder: "Nhap noi dung",
  },
  "recipients.courtLine": {
    label: "Nơi nhận - Tòa án",
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

const BM159_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "subordinateProcuracyTrialAssignment.indictmentLine": "Tran Van Binh",
  "subordinateProcuracyTrialAssignment.article1Line": "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  "subordinateProcuracyTrialAssignment.article2Line": "Tran Van Binh",
  "recipients.assignedProcuracyLine": "Tran Van Binh",
  "recipients.courtLine": "Tran Van Binh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Trần Thị Hồng Nhung",
} as const;

const BM159_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-159",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-159 runtime-ux batch 7 curated source-render profile`,
  sections: BM159_SECTIONS,
  fields: BM159_FIELDS,
  demo: BM159_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM159_RUNTIME_UX_PROFILE);
