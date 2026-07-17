/**
 * BM-127 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-127 profile. Groups the 7 fields into 3 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM127_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-chu-the",
    title: "Chủ thể và cơ quan",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM127_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-127)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-127)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-127)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-127)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-127)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Chủ thể liên quan (mẫu BM-127)",
  },
  "agency.coQuan": {
    label: "Cơ quan",
    placeholder: "Cơ quan (mẫu BM-127)",
  },
} as const;

const BM127_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "27/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
  "agency.coQuan": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
} as const;

const BM127_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-127",
  versionLabel: `BM-127 runtime-ux batch 6 curated source-render profile`,
  sections: BM127_SECTIONS,
  fields: BM127_FIELDS,
  demo: BM127_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM127_RUNTIME_UX_PROFILE);
