/**
 * Curated runtime-ux profile for BM-078.
 *
 * 4 fields — Thông báo người bào chữa.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-078)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM078_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Cơ quan ban hành, địa danh, số điện thoại liên hệ, số thông báo người bào chữa.",
  },
] as const;

const BM078_FIELDS = {
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
    smart: {
      key: "document.dienThoai",
      kind: "text",
    },
  },
  "document.soThong": {
    label: "Số thông báo",
    placeholder: "58/TB-VKSKV7",
    helpText: "Số ký hiệu của thông báo người bào chữa tham gia tố tụng.",
    smart: {
      key: "document.soThong",
      kind: "text",
    },
  },
} as const;

const BM078_DEMO = {
  "agency.coQuan": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.dienThoai": "028 3829 4500",
  "document.soThong": "58/TB-VKSKV7",
} as const;

const BM078_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-078",
  versionLabel:
    "BM-078 curated batch 4 — Thông báo người bào chữa",
  sections: BM078_SECTIONS,
  fields: BM078_FIELDS,
  demo: BM078_DEMO,
};

registerRuntimeUxProfile(BM078_RUNTIME_UX_PROFILE);
