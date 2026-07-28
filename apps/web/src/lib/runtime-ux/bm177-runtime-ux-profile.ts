/**
 * BM-177 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-177 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc biệt
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

const BM177_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Cơ quan ban hành và số quyết định gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc biệt.",
  },
] as const;

const BM177_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "115/QĐ-VKS",
  },
} as const;

const BM177_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.fullDocumentCode": "115/QĐ-VKS",
} as const;

const BM177_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-177",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-177 runtime-ux batch 8 curated source-render profile`,
  sections: BM177_SECTIONS,
  fields: BM177_FIELDS,
  demo: BM177_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM177_RUNTIME_UX_PROFILE);
