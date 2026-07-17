/**
 * BM-135 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-135 profile. Groups the 10 fields into 4 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM135_SECTIONS = [
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

const BM135_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-135)",
  },
  "signature.positionTitle": {
    label: "Chức danh",
    placeholder: "Chức danh (mẫu BM-135)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-135)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-135)",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Người bị áp dụng (mẫu BM-135)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-135)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-135)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Chủ thể liên quan (mẫu BM-135)",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Căn cứ pháp lý (mẫu BM-135)",
  },
  "document.tenVu": {
    label: "Tên vụ án / vụ việc",
    placeholder: "Tên vụ án / vụ việc (mẫu BM-135)",
  },
} as const;

const BM135_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "signature.positionTitle": "KT. VIỆN TRƯỞNG / PHÓ VIỆN TRƯỞNG",
  "document.soQuyet": "35/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "recipients.personLine": "Ông Lê Minh K, sinh năm 1985, trú tại Quận 1, TP.HCM",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
  "legalBasis.canCu":
    "Căn cứ các điều 120, 139 Bộ luật Tố tụng hình sự 2015",
  "document.tenVu": "Vụ án hình sự Lê Minh K về tội Lừa đảo chiếm đoạt tài sản",
} as const;

const BM135_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-135",
  versionLabel: `BM-135 runtime-ux batch 6 curated source-render profile`,
  sections: BM135_SECTIONS,
  fields: BM135_FIELDS,
  demo: BM135_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM135_RUNTIME_UX_PROFILE);
