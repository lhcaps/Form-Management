/**
 * BM-122 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-122 profile. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM122_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM122_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-122)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-122)",
  },
} as const;

const BM122_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "22/QĐ-VKSKV7",
} as const;

const BM122_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-122",
  versionLabel: `BM-122 runtime-ux batch 6 curated source-render profile`,
  sections: BM122_SECTIONS,
  fields: BM122_FIELDS,
  demo: BM122_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM122_RUNTIME_UX_PROFILE);
