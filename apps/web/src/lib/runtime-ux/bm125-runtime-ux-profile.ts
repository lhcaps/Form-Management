/**
 * BM-125 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-125 profile. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM125_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM125_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-125)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-125)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-125)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-125)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-125)",
  },
} as const;

const BM125_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "25/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
} as const;

const BM125_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-125",
  versionLabel: `BM-125 runtime-ux batch 6 curated source-render profile`,
  sections: BM125_SECTIONS,
  fields: BM125_FIELDS,
  demo: BM125_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM125_RUNTIME_UX_PROFILE);
