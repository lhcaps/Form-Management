/**
 * BM-121 runtime-ux batch 6 curated source-render profile.
 *
 * This profile upgrades the conservative auto-generated BM-121
 * profile to a curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS requires source/render smoke +
 * Batch 6 curation only. Browser/demo/preview/DOCX/fidelity/visual/
 * human evidence remains NOT_RUN for Batch 6.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM121_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM121_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-121)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-121)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-121)",
  },
} as const;

const BM121_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "21/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
} as const;

const BM121_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-121",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-121 runtime-ux batch 6 curated source-render profile`,
  sections: BM121_SECTIONS,
  fields: BM121_FIELDS,
  demo: BM121_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM121_RUNTIME_UX_PROFILE);
