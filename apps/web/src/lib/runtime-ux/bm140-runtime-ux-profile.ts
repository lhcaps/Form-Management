/**
 * BM-140 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-140 profile. Groups the 5 fields into 2 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM140_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin kiến nghị",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM140_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-140)",
  },
  "document.soKien": {
    label: "Số kiến nghị",
    placeholder: "Số kiến nghị (mẫu BM-140)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-140)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-140)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-140)",
  },
} as const;

const BM140_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soKien": "40/KN-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
} as const;

const BM140_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-140",
  versionLabel: `BM-140 runtime-ux batch 6 curated source-render profile`,
  sections: BM140_SECTIONS,
  fields: BM140_FIELDS,
  demo: BM140_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM140_RUNTIME_UX_PROFILE);
