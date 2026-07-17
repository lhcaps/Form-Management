/**
 * BM-124 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-124 profile. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM124_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM124_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-124)",
  },
} as const;

const BM124_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
} as const;

const BM124_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-124",
  versionLabel: `BM-124 runtime-ux batch 6 curated source-render profile`,
  sections: BM124_SECTIONS,
  fields: BM124_FIELDS,
  demo: BM124_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM124_RUNTIME_UX_PROFILE);
