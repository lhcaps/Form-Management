/**
 * BM-167 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-167 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định phê chuẩn
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

const BM167_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM167_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "61/QĐ-VKS",
  },
} as const;

const BM167_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.fullDocumentCode": "61/QĐ-VKS",
} as const;

const BM167_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-167",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-167 runtime-ux batch 8 curated source-render profile`,
  sections: BM167_SECTIONS,
  fields: BM167_FIELDS,
  demo: BM167_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM167_RUNTIME_UX_PROFILE);
