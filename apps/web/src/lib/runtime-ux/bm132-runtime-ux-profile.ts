/**
 * BM-132 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-132 profile. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM132_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-dong-dia-danh",
    title: "Dòng địa danh",
  },
] as const;

const BM132_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát",
    placeholder: "Viện kiểm sát (mẫu BM-132)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-132)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-132)",
  },
} as const;

const BM132_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "32/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
} as const;

const BM132_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-132",
  versionLabel: `BM-132 runtime-ux batch 6 curated source-render profile`,
  sections: BM132_SECTIONS,
  fields: BM132_FIELDS,
  demo: BM132_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM132_RUNTIME_UX_PROFILE);
