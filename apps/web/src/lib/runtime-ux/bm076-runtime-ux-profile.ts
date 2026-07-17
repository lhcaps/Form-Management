/**
 * Curated runtime-ux profile for BM-076.
 *
 * 5 fields — QĐ thay đổi người phiên dịch, người dịch thuật.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-076)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM076_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Cơ quan ban hành, địa danh, số điện thoại liên hệ, số quyết định, ngày ban hành.",
  },
] as const;

const BM076_FIELDS = {
  "agency.coQuan": {
    label: "Cơ quan ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    smart: {
      key: "agency.coQuan",
      kind: "text",
    },
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Thành phố Hồ Chí Minh",
    smart: {
      key: "agency.diaDanh",
      kind: "text",
    },
  },
  "document.dienThoai": {
    label: "Số điện thoại liên hệ",
    placeholder: "028 3829 4500",
    helpText: "Số điện thoại cơ quan ban hành để người nhận liên hệ khi cần.",
    smart: {
      key: "document.dienThoai",
      kind: "text",
    },
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "57/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định thay đổi người phiên dịch, người dịch thuật.",
    smart: {
      key: "document.soQuyet",
      kind: "text",
    },
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "2026-07-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
    smart: {
      key: "document.ngayBan",
      kind: "date",
    },
  },
} as const;

const BM076_DEMO = {
  "agency.coQuan": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.dienThoai": "028 3829 4500",
  "document.soQuyet": "57/QĐ-VKSKV7",
  "document.ngayBan": "2026-07-04",
} as const;

const BM076_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-076",
  versionLabel:
    "BM-076 curated batch 4 — Quyết định thay đổi người phiên dịch, người dịch thuật",
  sections: BM076_SECTIONS,
  fields: BM076_FIELDS,
  demo: BM076_DEMO,
};

registerRuntimeUxProfile(BM076_RUNTIME_UX_PROFILE);
