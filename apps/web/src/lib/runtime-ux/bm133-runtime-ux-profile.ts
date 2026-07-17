/**
 * BM-133 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-133 profile. Groups the 5 fields into 2 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM133_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM133_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát",
    placeholder: "Viện kiểm sát (mẫu BM-133)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-133)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-133)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-133)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-133)",
  },
} as const;

const BM133_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "33/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
} as const;

const BM133_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-133",
  versionLabel: `BM-133 runtime-ux batch 6 curated source-render profile`,
  sections: BM133_SECTIONS,
  fields: BM133_FIELDS,
  demo: BM133_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM133_RUNTIME_UX_PROFILE);
