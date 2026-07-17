/**
 * BM-173 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-173 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định chuyển vật chứng
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

const BM173_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
  },
  {
    sectionId: "section-noi-dung-chuyen",
    title: "Nội dung chuyển vật chứng",
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

const BM173_FIELDS = {
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
    placeholder: "88/QĐ-VKS",
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
    placeholder: "Căn cứ Điều 76 và Điều 107 Bộ luật Tố tụng hình sự năm 2015",
  },
  "evidenceTransfer.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định của Viện Kiểm sát",
    placeholder: "Căn cứ Quyết định phê chuẩn số 61/QĐ-VKS ngày 25/02/2026",
  },
  "evidenceTransfer.considerationLine": {
    label: "Nhận định",
    placeholder: "Vật chứng cần được chuyển cho cơ quan có thẩm quyền xử lý",
  },
  "evidenceTransfer.article1Line": {
    label: "Điều 1 - Nội dung chuyển",
    placeholder: "Điều 1. Chuyển toàn bộ vật chứng cho cơ quan tiếp nhận theo danh mục kèm theo.",
  },
  "evidenceTransfer.article2Line": {
    label: "Điều 2 - Yêu cầu tiếp nhận",
    placeholder: "Điều 2. Yêu cầu cơ quan tiếp nhận lập biên bản bàn giao và bảo quản theo quy định.",
  },
  "recipients.line1": {
    label: "Nơi nhận 1",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  },
  "recipients.line2": {
    label: "Nơi nhận 2",
    placeholder: "Viện Kiểm sát nhân dân tối cao (để báo cáo)",
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
    placeholder: "Phạm Thị Lan Anh",
  },
} as const;

const BM173_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "88/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Phó Viện trưởng Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 76 và Điều 107 Bộ luật Tố tụng hình sự năm 2015",
  "evidenceTransfer.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định phê chuẩn số 61/QĐ-VKS ngày 25/02/2026",
  "evidenceTransfer.considerationLine": "Vật chứng cần được chuyển cho cơ quan có thẩm quyền xử lý",
  "evidenceTransfer.article1Line": "Điều 1. Chuyển toàn bộ vật chứng cho cơ quan tiếp nhận theo danh mục kèm theo.",
  "evidenceTransfer.article2Line": "Điều 2. Yêu cầu cơ quan tiếp nhận lập biên bản bàn giao và bảo quản theo quy định.",
  "recipients.line1": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội (để tiếp nhận)",
  "recipients.line2": "Viện Kiểm sát nhân dân tối cao (để báo cáo)",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Anh",
} as const;

const BM173_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-173",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-173 runtime-ux batch 8 curated source-render profile`,
  sections: BM173_SECTIONS,
  fields: BM173_FIELDS,
  demo: BM173_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM173_RUNTIME_UX_PROFILE);
