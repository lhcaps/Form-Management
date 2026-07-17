/**
 * BM-123 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-123 profile. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM123_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM123_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-123)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-123)",
  },
} as const;

const BM123_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "23/QĐ-VKSKV7",
} as const;

const BM123_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-123",
  versionLabel: `BM-123 runtime-ux batch 6 curated source-render profile`,
  sections: BM123_SECTIONS,
  fields: BM123_FIELDS,
  demo: BM123_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM123_RUNTIME_UX_PROFILE);
