/**
 * BM-024 — Quyết định thay đổi quyết định khởi tố vụ án hình sự.
 * The compiled contract contains its document header only; labels follow the
 * DOCX footnotes and the two decision references in Articles 1 and 2.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM024_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Cơ quan ban hành và quyết định thay đổi",
    description:
      "Thông tin đầu trang của quyết định thay đổi quyết định khởi tố vụ án hình sự, bao gồm cơ quan ban hành và quyết định khởi tố được dẫn chiếu.",
  },
] as const;

const BM024_FIELDS = {
  "agency.parentNameUpper": {
    label: "Viện kiểm sát cấp trên trực tiếp",
    placeholder: "Tên Viện kiểm sát cấp trên trực tiếp",
  },
  "agency.issuePlace": {
    label: "Viện kiểm sát ban hành quyết định thay đổi",
    placeholder: "Tên Viện kiểm sát ban hành",
  },
  "document.issueDate": {
    label: "Số quyết định khởi tố vụ án cần thay đổi",
    placeholder: "Số quyết định khởi tố vụ án hình sự được dẫn chiếu",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành quyết định thay đổi",
    placeholder: "Địa danh, ngày ... tháng ... năm ...",
  },
} as const;

const BM024_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HÀ NỘI",
  "agency.issuePlace": "Viện kiểm sát nhân dân quận Hoàn Kiếm",
  "document.issueDate": "09/QĐ-CQĐT",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 18 tháng 7 năm 2026",
} as const;

const BM024_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-024",
  versionLabel: "BM-024 reviewed prosecution-decision change profile",
  sections: BM024_SECTIONS,
  fields: BM024_FIELDS,
  demo: BM024_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM024_RUNTIME_UX_PROFILE);
