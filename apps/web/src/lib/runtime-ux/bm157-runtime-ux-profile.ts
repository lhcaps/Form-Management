/**
 * BM-157 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-157 profile to a
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

const BM157_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM157_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
} as const;

const BM157_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
} as const;

const BM157_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-157",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-157 runtime-ux batch 7 curated source-render profile`,
  sections: BM157_SECTIONS,
  fields: BM157_FIELDS,
  demo: BM157_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM157_RUNTIME_UX_PROFILE);
