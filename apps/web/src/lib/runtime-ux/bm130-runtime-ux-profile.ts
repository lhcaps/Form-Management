/**
 * BM-130 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-130 profile. Groups the 7 fields into 3 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM130_SECTIONS = [
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

const BM130_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-130)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-130)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-130)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-130)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-130)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Chủ thể liên quan (mẫu BM-130)",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Căn cứ pháp lý (mẫu BM-130)",
  },
} as const;

const BM130_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "30/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
  "legalBasis.canCu":
    "Căn cứ các điều 114, 132 và 231 Bộ luật Tố tụng hình sự 2015",
} as const;

const BM130_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-130",
  versionLabel: `BM-130 runtime-ux batch 6 curated source-render profile`,
  sections: BM130_SECTIONS,
  fields: BM130_FIELDS,
  demo: BM130_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM130_RUNTIME_UX_PROFILE);
