/**
 * BM-158 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-158 profile to a
 * curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS requires source/render smoke +
 * Batch 7 curation only. Browser/demo/preview/DOCX/fidelity/visual/
 * human evidence remains NOT_RUN for Batch 7.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM158_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM158_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.soDanh": {
    label: "Số danh sách",
    placeholder: "Nhap noi dung",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Hà Nội",
  },
} as const;

const BM158_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.soDanh": "Tran Van Binh",
  "agency.diaDanh": "Hà Nội",
} as const;

const BM158_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-158",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-158 runtime-ux batch 7 curated source-render profile`,
  sections: BM158_SECTIONS,
  fields: BM158_FIELDS,
  demo: BM158_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM158_RUNTIME_UX_PROFILE);
