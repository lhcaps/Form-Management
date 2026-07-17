/**
 * BM-169 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-169 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định xử lý vật chứng
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

const BM169_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
  },
  {
    sectionId: "section-noi-dung-xu-ly",
    title: "Nội dung xử lý vật chứng",
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

const BM169_FIELDS = {
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
    placeholder: "68/QĐ-VKS",
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
  "caseDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định khởi tố vụ án",
    placeholder: "Căn cứ Quyết định khởi tố vụ án số 10/QĐ-KTVA ngày 10/02/2026",
  },
  "accusedDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định khởi tố bị can",
    placeholder: "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  },
  "evidenceHandling.investigationConclusionLegalBasisLine": {
    label: "Căn cứ Kết luận điều tra",
    placeholder: "Căn cứ Kết luận điều tra số 25/KLĐT ngày 01/03/2026",
  },
  "evidenceHandling.caseSuspensionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định tạm đình chỉ vụ án",
    placeholder: "Căn cứ Quyết định tạm đình chỉ vụ án số 30/QĐ-TĐC ngày 02/03/2026",
  },
  "evidenceHandling.accusedSuspensionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định tạm đình chỉ điều tra bị can",
    placeholder: "Căn cứ Quyết định tạm đình chỉ điều tra đối với bị can số 31/QĐ-TĐC ngày 02/03/2026",
  },
  "evidenceHandling.considerationLine": {
    label: "Nhận định",
    placeholder: "Vật chứng đã được niêm phong, bảo quản đúng quy định",
  },
  "evidenceHandling.evidenceListLine": {
    label: "Danh mục vật chứng",
    placeholder: "Danh mục 12 vật chứng kèm theo",
  },
  "evidenceHandling.handlingMethodLine": {
    label: "Phương thức xử lý",
    placeholder: "Tiêu hủy toàn bộ theo quy định tại Điều 76 BLTTHS",
  },
  "evidenceHandling.executionRequestLine": {
    label: "Yêu cầu thi hành",
    placeholder: "Giao Cơ quan Cảnh sát điều tra tổ chức thi hành",
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
    placeholder: "Phó Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Anh",
  },
} as const;

const BM169_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "68/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Phó Viện trưởng Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 76 và Điều 107 Bộ luật Tố tụng hình sự năm 2015",
  "caseDecision.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án số 10/QĐ-KTVA ngày 10/02/2026",
  "accusedDecision.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  "evidenceHandling.investigationConclusionLegalBasisLine": "Căn cứ Kết luận điều tra số 25/KLĐT ngày 01/03/2026 của Cơ quan Cảnh sát điều tra",
  "evidenceHandling.caseSuspensionDecisionLegalBasisLine": "Căn cứ Quyết định tạm đình chỉ vụ án số 30/QĐ-TĐC ngày 02/03/2026",
  "evidenceHandling.accusedSuspensionDecisionLegalBasisLine": "Căn cứ Quyết định tạm đình chỉ điều tra đối với bị can số 31/QĐ-TĐC ngày 02/03/2026",
  "evidenceHandling.considerationLine": "Vật chứng đã được niêm phong, bảo quản đúng quy định",
  "evidenceHandling.evidenceListLine": "Danh mục 12 vật chứng kèm theo (theo Phụ lục I)",
  "evidenceHandling.handlingMethodLine": "Tiêu hủy toàn bộ theo quy định tại Điều 76 BLTTHS",
  "evidenceHandling.executionRequestLine": "Giao Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội tổ chức thi hành",
  "recipients.line1": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội (để thi hành)",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Anh",
} as const;

const BM169_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-169",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-169 runtime-ux batch 8 curated source-render profile`,
  sections: BM169_SECTIONS,
  fields: BM169_FIELDS,
  demo: BM169_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM169_RUNTIME_UX_PROFILE);
