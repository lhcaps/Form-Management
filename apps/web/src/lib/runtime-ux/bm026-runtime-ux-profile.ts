/** BM-026 — Quyết định hủy bỏ quyết định khởi tố vụ án hình sự. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM026_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Cơ quan ban hành và quyết định hủy bỏ",
    description:
      "Thông tin đầu trang của quyết định hủy bỏ quyết định khởi tố vụ án hình sự, theo các chú thích của BM-026.",
  },
] as const;

const BM026_FIELDS = {
  "agency.parentNameUpper": {
    label: "Viện kiểm sát cấp trên trực tiếp",
    placeholder: "Tên Viện kiểm sát cấp trên trực tiếp",
  },
  "agency.nameUpper": {
    label: "Tên viết hoa của Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN ...",
  },
  "document.documentCode": {
    label: "Số quyết định hủy bỏ",
    placeholder: "Số quyết định hủy bỏ quyết định khởi tố vụ án hình sự",
  },
  "document.issueDate": {
    label: "Ngày ban hành quyết định hủy bỏ",
    placeholder: "Ngày ... tháng ... năm ...",
  },
} as const;

const BM026_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HÀ NỘI",
  "agency.nameUpper": "VIỆN KIỂM SÁT NHÂN DÂN QUẬN HOÀN KIẾM",
  "document.documentCode": "15/QĐ-VKS",
  "document.issueDate": "Ngày 18 tháng 7 năm 2026",
} as const;

const BM026_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-026",
  versionLabel: "BM-026 reviewed prosecution-decision cancellation profile",
  sections: BM026_SECTIONS,
  fields: BM026_FIELDS,
  demo: BM026_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM026_RUNTIME_UX_PROFILE);
