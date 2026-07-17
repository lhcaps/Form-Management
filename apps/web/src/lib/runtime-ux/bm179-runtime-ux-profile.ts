/**
 * BM-179 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-179 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định áp dụng biện pháp chữa bệnh
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

const BM179_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-thong-tin-ca-nhan",
    title: "Thông tin cá nhân",
  },
  {
    sectionId: "section-noi-dung",
    title: "Nội dung quyết định",
  },
] as const;

const BM179_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.summaryLine": {
    label: "Trích yếu",
    placeholder: "V/v áp dụng biện pháp chữa bệnh",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "ngày 18 tháng 3 năm 1979",
  },
  "person.personFullName": {
    label: "Họ tên",
    placeholder: "Bùi Quang Khải",
  },
  "document.reasonLine": {
    label: "Lý do áp dụng",
    placeholder: "Theo Kết luận giám định pháp y tâm thần số 42/2026/GĐPYTT",
  },
  "document.contentLine": {
    label: "Nội dung quyết định",
    placeholder: "Áp dụng biện pháp chữa bệnh bắt buộc tại Cơ sở chữa bệnh theo quyết định của Tòa án",
  },
  "document.issuePlace": {
    label: "Địa danh",
    placeholder: "Hà Nội",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "ngày 04 tháng 3 năm 2026",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "130/QĐ-VKS",
  },
} as const;

const BM179_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.summaryLine": "V/v áp dụng biện pháp chữa bệnh",
  "person.dateOfBirth": "ngày 18 tháng 3 năm 1979",
  "person.personFullName": "Bùi Quang Khải",
  "document.reasonLine": "Theo Kết luận giám định pháp y tâm thần số 42/2026/GĐPYTT",
  "document.contentLine": "Áp dụng biện pháp chữa bệnh bắt buộc tại Cơ sở chữa bệnh theo quyết định của Tòa án",
  "document.issuePlace": "Hà Nội",
  "document.issueDate": "ngày 04 tháng 3 năm 2026",
  "document.fullDocumentCode": "130/QĐ-VKS",
} as const;

const BM179_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-179",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-179 runtime-ux batch 8 curated source-render profile`,
  sections: BM179_SECTIONS,
  fields: BM179_FIELDS,
  demo: BM179_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM179_RUNTIME_UX_PROFILE);
