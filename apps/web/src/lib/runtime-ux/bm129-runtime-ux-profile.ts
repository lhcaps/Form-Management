/**
 * BM-129 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-129 profile. Groups the 7 fields into 3 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM129_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý và chủ thể",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM129_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-129)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-129)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-129)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-129)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-129)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Chủ thể liên quan (mẫu BM-129)",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Căn cứ pháp lý (mẫu BM-129)",
  },
} as const;

const BM129_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "29/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
  "legalBasis.canCu":
    "Căn cứ các điều 113, 126 và 230 Bộ luật Tố tụng hình sự 2015",
} as const;

const BM129_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-129",
  versionLabel: `BM-129 runtime-ux batch 6 curated source-render profile`,
  sections: BM129_SECTIONS,
  fields: BM129_FIELDS,
  demo: BM129_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM129_RUNTIME_UX_PROFILE);
