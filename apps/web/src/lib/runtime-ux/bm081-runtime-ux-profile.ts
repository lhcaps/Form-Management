/**
 * Curated runtime-ux profile for BM-081.
 *
 * 3 fields — QĐ thời điểm người bào chữa tham gia tố tụng.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-081)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM081_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Cơ quan ban hành, địa danh, số điện thoại liên hệ.",
  },
] as const;

const BM081_FIELDS = {
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
} as const;

const BM081_DEMO = {
  "agency.coQuan": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.dienThoai": "028 3829 4500",
} as const;

const BM081_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-081",
  versionLabel:
    "BM-081 curated batch 4 — QĐ thời điểm người bào chữa tham gia tố tụng",
  sections: BM081_SECTIONS,
  fields: BM081_FIELDS,
  demo: BM081_DEMO,
};

registerRuntimeUxProfile(BM081_RUNTIME_UX_PROFILE);
