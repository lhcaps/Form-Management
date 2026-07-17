/**
 * BM-166 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-166 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định trả hồ sơ điều tra bổ sung
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
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
  },
  {
    sectionId: "section-noi-dung-quyet-dinh",
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
    placeholder: "Căn cứ Điều 245 và Điều 247 Bộ luật Tố tụng hình sự năm 2015",
  },
  "returnInvestigation.courtDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định của Tòa án",
    placeholder: "Căn cứ Quyết định số 18/HS-ST ngày 25/02/2026 của Tòa án nhân dân Thành phố Hà Nội",
  },
  "returnInvestigation.article1Line": {
    label: "Điều 1 - Nội dung trả hồ sơ",
    placeholder: "Điều 1. Trả hồ sơ vụ án để điều tra bổ sung.",
  },
  "returnInvestigation.article2Line": {
    label: "Điều 2 - Thời hạn điều tra bổ sung",
    placeholder: "Điều 2. Thời hạn điều tra bổ sung là 30 ngày kể từ ngày nhận hồ sơ.",
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
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 245 và Điều 247 Bộ luật Tố tụng hình sự năm 2015",
  "returnInvestigation.courtDecisionLegalBasisLine": "Căn cứ Quyết định số 18/HS-ST ngày 25/02/2026 của Tòa án nhân dân Thành phố Hà Nội",
  "returnInvestigation.article1Line": "Điều 1. Trả hồ sơ vụ án hình sự số 12/HS-ST cho Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội để điều tra bổ sung.",
  "returnInvestigation.article2Line": "Điều 2. Thời hạn điều tra bổ sung là 30 ngày kể từ ngày nhận được quyết định này.",
  "recipients.line1": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội (để điều tra bổ sung)",
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
