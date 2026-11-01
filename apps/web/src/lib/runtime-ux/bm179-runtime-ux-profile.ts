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
    title: "Thông tin quyết định áp dụng chữa bệnh",
    description: "Thông tin ban hành, căn cứ, người bị áp dụng và nội dung quyết định áp dụng biện pháp bắt buộc chữa bệnh.",
  },
] as const;

const BM179_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Ghi tên Viện kiểm sát ban hành",
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
    placeholder: "Ghi địa danh nơi đặt trụ sở Viện kiểm sát ban hành",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Ngày, tháng, năm ban hành quyết định",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "130/QĐ-VKS",
  },
} as const;

const BM179_DEMO_RUNTIME_UX = {} as const;

const BM179_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-179",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-179 runtime-ux batch 8 curated source-render profile`,
  sections: BM179_SECTIONS,
  fields: BM179_FIELDS,
  demo: BM179_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM179_RUNTIME_UX_PROFILE);
