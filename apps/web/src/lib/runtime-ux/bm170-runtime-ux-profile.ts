/**
 * BM-170 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-170 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định hủy bỏ biện pháp xử lý vật chứng
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

const BM170_SECTIONS = [
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

const BM170_FIELDS = {
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
    placeholder: "75/QĐ-VKS",
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
  "evidenceHandlingCancellation.caseInitiationLine": {
    label: "Căn cứ khởi tố vụ án",
    placeholder: "Căn cứ Quyết định khởi tố vụ án số 10/QĐ-KTVA ngày 10/02/2026",
  },
  "evidenceHandlingCancellation.defendantInitiationLine": {
    label: "Căn cứ khởi tố bị can",
    placeholder: "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  },
  "evidenceHandlingCancellation.evidenceHandlingDecisionReviewLine": {
    label: "Căn cứ xem xét quyết định xử lý vật chứng",
    placeholder: "Xét thấy Quyết định xử lý vật chứng số 68/QĐ-VKS có nội dung trái pháp luật",
  },
  "evidenceHandlingCancellation.unlawfulReasonLine": {
    label: "Lý do trái pháp luật",
    placeholder: "Quyết định xử lý vật chứng vi phạm Điều 76 BLTTHS về thẩm quyền ban hành",
  },
  "evidenceHandlingCancellation.article1Line": {
    label: "Điều 1 - Hủy bỏ quyết định",
    placeholder: "Điều 1. Hủy bỏ Quyết định xử lý vật chứng số 68/QĐ-VKS ngày 28/02/2026.",
  },
  "evidenceHandlingCancellation.article2Line": {
    label: "Điều 2 - Yêu cầu xử lý lại",
    placeholder: "Điều 2. Yêu cầu Cơ quan Cảnh sát điều tra ban hành quyết định xử lý vật chứng mới theo đúng quy định.",
  },
  "recipients.primaryLine": {
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
    placeholder: "Phó Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Anh",
  },
} as const;

const BM170_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "75/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Phó Viện trưởng Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 76 và Điều 107 Bộ luật Tố tụng hình sự năm 2015",
  "evidenceHandlingCancellation.caseInitiationLine": "Căn cứ Quyết định khởi tố vụ án số 10/QĐ-KTVA ngày 10/02/2026",
  "evidenceHandlingCancellation.defendantInitiationLine": "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  "evidenceHandlingCancellation.evidenceHandlingDecisionReviewLine": "Xét thấy Quyết định xử lý vật chứng số 68/QĐ-VKS có nội dung trái pháp luật",
  "evidenceHandlingCancellation.unlawfulReasonLine": "Quyết định xử lý vật chứng vi phạm Điều 76 BLTTHS về thẩm quyền ban hành",
  "evidenceHandlingCancellation.article1Line": "Điều 1. Hủy bỏ Quyết định xử lý vật chứng số 68/QĐ-VKS ngày 28/02/2026.",
  "evidenceHandlingCancellation.article2Line": "Điều 2. Yêu cầu Cơ quan Cảnh sát điều tra ban hành quyết định xử lý vật chứng mới theo đúng quy định.",
  "recipients.primaryLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội (để thi hành)",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Anh",
} as const;

const BM170_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-170",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-170 runtime-ux batch 8 curated source-render profile`,
  sections: BM170_SECTIONS,
  fields: BM170_FIELDS,
  demo: BM170_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM170_RUNTIME_UX_PROFILE);
