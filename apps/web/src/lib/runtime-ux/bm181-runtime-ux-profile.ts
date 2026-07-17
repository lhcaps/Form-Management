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
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM181_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.issueDate": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội, ngày 04 tháng 3 năm 2026",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "145/QĐ-VKS",
  },
} as const;

const BM181_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.issueDate": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "document.fullDocumentCode": "145/QĐ-VKS",
} as const;

const BM181_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-181",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-181 runtime-ux batch 8 curated source-render profile`,
  sections: BM181_SECTIONS,
  fields: BM181_FIELDS,
  demo: BM181_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM181_RUNTIME_UX_PROFILE);
