/**
 * BM-126 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-126 profile. Groups the 11 fields into 4 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM126_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
  },
  {
    sectionId: "section-doi-tuong-va-vu-an",
    title: "Đối tượng và vụ án",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM126_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-126)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-126)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-126)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-126)",
  },
  "decision.summaryLine": {
    label: "Tóm tắt hồ sơ",
    placeholder: "Tóm tắt hồ sơ (mẫu BM-126)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-126)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Chủ thể liên quan (mẫu BM-126)",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Căn cứ pháp lý (mẫu BM-126)",
  },
  "person.tenNguoi": {
    label: "Tên người liên quan",
    placeholder: "Tên người liên quan (mẫu BM-126)",
  },
  "document.tenVu": {
    label: "Tên vụ án / vụ việc",
    placeholder: "Tên vụ án / vụ việc (mẫu BM-126)",
  },
  "person.toiDanh": {
    label: "Tội danh",
    placeholder: "Tội danh (mẫu BM-126)",
  },
} as const;

const BM126_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "26/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "decision.summaryLine":
    "Quyết định phê chuẩn lệnh khám xét đối với nơi ở của bị can Lê Minh K",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
  "legalBasis.canCu":
    "Căn cứ các điều 192, 193 và 213 Bộ luật Tố tụng hình sự 2015",
  "person.tenNguoi": "Lê Minh K",
  "document.tenVu": "Vụ án hình sự Lê Minh K về tội Lừa đảo chiếm đoạt tài sản",
  "person.toiDanh": "Điều 174 Bộ luật Hình sự 2015 - Lừa đảo chiếm đoạt tài sản",
} as const;

const BM126_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-126",
  versionLabel: `BM-126 runtime-ux batch 6 curated source-render profile`,
  sections: BM126_SECTIONS,
  fields: BM126_FIELDS,
  demo: BM126_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM126_RUNTIME_UX_PROFILE);
