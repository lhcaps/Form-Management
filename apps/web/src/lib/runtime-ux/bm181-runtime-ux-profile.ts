/**
 * BM-181 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-181 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định áp dụng thủ tục rút gọn
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

const BM181_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định áp dụng thủ tục rút gọn",
    description: "Cơ quan ban hành, ngày và số quyết định áp dụng thủ tục rút gọn đối với vụ án hình sự.",
  },
] as const;

const BM181_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Ghi tên Viện kiểm sát ban hành",
  },
  "document.issueDate": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Ngày, tháng, năm ban hành quyết định",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: ".../QĐ-VKS",
  },
} as const;

const BM181_DEMO_RUNTIME_UX = {} as const;

const BM181_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-181",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-181 runtime-ux batch 8 curated source-render profile`,
  sections: BM181_SECTIONS,
  fields: BM181_FIELDS,
  demo: BM181_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM181_RUNTIME_UX_PROFILE);
