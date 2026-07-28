/**
 * BM-169 runtime-ux curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-169 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, source-aligned section descriptions, and safe
 * demo data.
 *
 * Form title: Quyết định xử lý vật chứng
 *
 * Source evidence:
 *   docs/audit/docx/extracted/BM-169__b737aefc0c16.extract.md
 *   (extractHeading = "XỬ LÝ VẬT CHỨNG" anchored on P0011,
 *    legal basis "Căn cứ các điều 41, 90, 106 và 248" anchored on P0013)
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Curation scope (allowed):
 *   - Section descriptions (aligned with extract paragraphs P0011–P0067)
 *   - Field labels and placeholders (already source-aligned)
 *   - Phantom section id correction (no phantom "section-noi-dung-xu-ly")
 *
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled contract section IDs (`section-noi-dung-quyet-inh` stays)
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM169_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Dòng VIỆN KIỂM SÁT, CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập – Tự do – Hạnh phúc; số QĐ, địa danh, ngày tháng năm ban hành (P0001–P0009).",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Căn cứ Điều 41, 90, 106 và 248 Bộ luật Tố tụng hình sự (P0013); Quyết định khởi tố vụ án (P0014), Quyết định khởi tố bị can (P0027), Bản kết luận điều tra đề nghị truy tố (P0041), các Quyết định đình chỉ/tạm đình chỉ vụ án và đối với bị can (P0046, P0052).",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Điều 1 — Danh mục vật chứng được xử lý và hình thức xử lý (P0060–P0062); Điều 2 — Yêu cầu thi hành Quyết định theo đúng quy định của Bộ luật Tố tụng hình sự (P0063–P0064).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Cơ quan, đơn vị thi hành và lưu hồ sơ HSVA, HSKS, VP (P0065–P0067).",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Chức danh, họ tên người ký, đóng dấu Viện kiểm sát (P0069); Mẫu số 169/HS — ban hành theo Thông tư số /2026/TT-VKSTC (P0081–P0083).",
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
    placeholder: "Căn cứ Điều 41, 90, 106 và 248 của Bộ luật Tố tụng hình sự",
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
    placeholder: "Tiêu hủy toàn bộ theo quy định tại Điều 106 BLTTHS",
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
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 41, 90, 106 và 248 của Bộ luật Tố tụng hình sự",
  "caseDecision.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án số 10/QĐ-KTVA ngày 10/02/2026",
  "accusedDecision.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 18/QĐ-KT ngày 18/02/2026",
  "evidenceHandling.investigationConclusionLegalBasisLine": "Căn cứ Kết luận điều tra số 25/KLĐT ngày 01/03/2026 của Cơ quan Cảnh sát điều tra",
  "evidenceHandling.caseSuspensionDecisionLegalBasisLine": "Căn cứ Quyết định tạm đình chỉ vụ án số 30/QĐ-TĐC ngày 02/03/2026",
  "evidenceHandling.accusedSuspensionDecisionLegalBasisLine": "Căn cứ Quyết định tạm đình chỉ điều tra đối với bị can số 31/QĐ-TĐC ngày 02/03/2026",
  "evidenceHandling.considerationLine": "Vật chứng đã được niêm phong, bảo quản đúng quy định",
  "evidenceHandling.evidenceListLine": "Danh mục 12 vật chứng kèm theo (theo Phụ lục I)",
  "evidenceHandling.handlingMethodLine": "Tiêu hủy toàn bộ theo quy định tại Điều 106 BLTTHS",
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
  versionLabel: `BM-169 runtime-ux vật-chứng-xử-lý curated source-render profile`,
  sections: BM169_SECTIONS,
  fields: BM169_FIELDS,
  demo: BM169_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM169_RUNTIME_UX_PROFILE);
