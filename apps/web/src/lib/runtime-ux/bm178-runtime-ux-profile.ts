/**
 * BM-178 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-178 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định hủy bỏ quyết định áp dụng biện pháp điều tra tố tụng đặc biệt
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

const BM178_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định hủy bỏ",
    description: "Cơ quan ban hành, địa danh, ngày và số quyết định hủy bỏ quyết định áp dụng biện pháp điều tra tố tụng đặc biệt.",
  },
] as const;

const BM178_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Ghi tên Viện kiểm sát ban hành",
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
    placeholder: "122/QĐ-VKS",
  },
} as const;

const BM178_DEMO_RUNTIME_UX = {} as const;

const BM178_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-178",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-178 runtime-ux batch 8 curated source-render profile`,
  sections: BM178_SECTIONS,
  fields: BM178_FIELDS,
  demo: BM178_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM178_RUNTIME_UX_PROFILE);
