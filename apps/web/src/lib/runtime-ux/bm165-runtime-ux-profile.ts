/**
 * BM-165 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-165 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Thông báo về việc vụ án có bị can bị tạm giam
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

const BM165_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Tên Viện kiểm sát và số thông báo gửi Tòa án về việc vụ án có bị can bị tạm giam, căn cứ Điều 42 và Điều 244 Bộ luật Tố tụng hình sự.",
  },
] as const;

const BM165_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.fullDocumentCode": {
    label: "Số thông báo",
    placeholder: "42/TB-VKS",
  },
} as const;

const BM165_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.fullDocumentCode": "42/TB-VKS",
} as const;

const BM165_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-165",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-165 runtime-ux batch 8 curated source-render profile`,
  sections: BM165_SECTIONS,
  fields: BM165_FIELDS,
  demo: BM165_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM165_RUNTIME_UX_PROFILE);
