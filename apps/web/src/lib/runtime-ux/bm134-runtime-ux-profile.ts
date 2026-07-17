/**
 * BM-134 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-134 profile. Groups the 10 fields into 4 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM134_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-chu-the-va-can-cu",
    title: "Chủ thể, căn cứ pháp lý và vụ án",
  },
  {
    sectionId: "section-chuc-danh",
    title: "Chức danh ban hành",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM134_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-134)",
  },
  "signature.positionTitle": {
    label: "Chức danh",
    placeholder: "Chức danh (mẫu BM-134)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-134)",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Người bị áp dụng (mẫu BM-134)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-134)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-134)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-134)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Chủ thể liên quan (mẫu BM-134)",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Căn cứ pháp lý (mẫu BM-134)",
  },
  "document.tenVu": {
    label: "Tên vụ án / vụ việc",
    placeholder: "Tên vụ án / vụ việc (mẫu BM-134)",
  },
} as const;

const BM134_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "signature.positionTitle": "KT. VIỆN TRƯỞNG / PHÓ VIỆN TRƯỞNG",
  "document.soQuyet": "34/QĐ-VKSKV7",
  "recipients.personLine": "Ông Lê Minh K, sinh năm 1985, trú tại Quận 1, TP.HCM",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
  "legalBasis.canCu":
    "Căn cứ các điều 119, 138 Bộ luật Tố tụng hình sự 2015",
  "document.tenVu": "Vụ án hình sự Lê Minh K về tội Lừa đảo chiếm đoạt tài sản",
} as const;

const BM134_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-134",
  versionLabel: `BM-134 runtime-ux batch 6 curated source-render profile`,
  sections: BM134_SECTIONS,
  fields: BM134_FIELDS,
  demo: BM134_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM134_RUNTIME_UX_PROFILE);
