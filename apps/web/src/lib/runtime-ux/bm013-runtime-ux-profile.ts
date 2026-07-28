/**
 * BM-013 — Quyết định giải quyết tranh chấp về thẩm quyền giải quyết
 * nguồn tin về tội phạm.
 *
 * Presentation metadata only. The labels are grounded in the BM-013 DOCX
 * footnotes; the compiled contract intentionally exposes only its header.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM013_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Cơ quan ban hành và quyết định",
    description:
      "Thông tin đầu trang của quyết định giải quyết tranh chấp về thẩm quyền giải quyết nguồn tin về tội phạm.",
  },
] as const;

const BM013_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát cấp trên trực tiếp",
    placeholder: "Tên Viện kiểm sát cấp trên trực tiếp",
  },
  "agency.tenCo": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Tên Viện kiểm sát ban hành",
  },
  "document.vietTat": {
    label: "Tên viết tắt của Viện kiểm sát ban hành",
    placeholder: "Ví dụ: VKSND quận X - bộ phận phụ trách (nếu có)",
  },
  "agency.diaDanh": {
    label: "Địa danh ban hành",
    placeholder: "Tên tỉnh hoặc thành phố nơi đặt trụ sở",
  },
  "document.ngayBan": {
    label: "Ngày ban hành quyết định",
    placeholder: "Ngày, tháng, năm ban hành",
  },
  "document.soVan": {
    label: "Số quyết định",
    placeholder: "Số quyết định, ví dụ: 12/QĐ-VKS",
  },
} as const;

const BM013_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân thành phố Hà Nội",
  "agency.tenCo": "Viện kiểm sát nhân dân quận Hoàn Kiếm",
  "document.vietTat": "VKSND quận Hoàn Kiếm",
  "agency.diaDanh": "Hà Nội",
  "document.ngayBan": "Ngày 18 tháng 7 năm 2026",
  "document.soVan": "12/QĐ-VKS",
} as const;

const BM013_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-013",
  versionLabel: "BM-013 reviewed authority-dispute decision profile",
  sections: BM013_SECTIONS,
  fields: BM013_FIELDS,
  demo: BM013_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM013_RUNTIME_UX_PROFILE);
