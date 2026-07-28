/**
 * BM-025 — Quyết định bổ sung quyết định khởi tố vụ án hình sự.
 * This compiled contract exposes the authority header only.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM025_SECTIONS = [
  {
    sectionId: "section-agency",
    title: "Viện kiểm sát ban hành",
    description: "Tên viết hoa của Viện kiểm sát ban hành quyết định bổ sung.",
  },
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Cơ quan cấp trên và địa danh ban hành",
    description: "Thông tin đầu trang theo chú thích của mẫu quyết định bổ sung quyết định khởi tố vụ án hình sự.",
  },
] as const;

const BM025_FIELDS = {
  "agency.nameUpper": {
    label: "Tên viết hoa của Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN ...",
  },
  "agency.parentNameUpper": {
    label: "Viện kiểm sát cấp trên trực tiếp",
    placeholder: "Tên Viện kiểm sát cấp trên trực tiếp",
  },
  "agency.issuePlace": {
    label: "Địa danh ban hành",
    placeholder: "Tên tỉnh hoặc thành phố nơi đặt trụ sở",
  },
} as const;

const BM025_DEMO_RUNTIME_UX = {
  "agency.nameUpper": "VIỆN KIỂM SÁT NHÂN DÂN QUẬN HOÀN KIẾM",
  "agency.parentNameUpper": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HÀ NỘI",
  "agency.issuePlace": "Hà Nội",
} as const;

const BM025_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-025",
  versionLabel: "BM-025 reviewed prosecution-decision supplement profile",
  sections: BM025_SECTIONS,
  fields: BM025_FIELDS,
  demo: BM025_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM025_RUNTIME_UX_PROFILE);
