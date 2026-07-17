/**
 * BM-128 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-128 profile. Groups the 6 fields into 3 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM128_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-chu-the",
    title: "Chủ thể liên quan",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM128_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-128)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-128)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-128)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-128)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-128)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Chủ thể liên quan (mẫu BM-128)",
  },
} as const;

const BM128_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "28/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
} as const;

const BM128_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-128",
  versionLabel: `BM-128 runtime-ux batch 6 curated source-render profile`,
  sections: BM128_SECTIONS,
  fields: BM128_FIELDS,
  demo: BM128_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM128_RUNTIME_UX_PROFILE);
