/**
 * Curated runtime-ux profile for BM-091.
 *
 * 3 fields — QĐ phê chuẩn QĐ thay đổi QĐ khởi tố bị can.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-091)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM091_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description: "Viện kiểm sát ban hành, số quyết định, địa danh.",
  },
] as const;

const BM091_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    smart: {
      key: "agency.vienKiem",
      kind: "text",
    },
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "63/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định phê chuẩn QĐ thay đổi QĐ khởi tố bị can.",
    smart: {
      key: "document.soQuyet",
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
} as const;

const BM091_DEMO = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.soQuyet": "63/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
} as const;

const BM091_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-091",
  versionLabel:
    "BM-091 curated batch 4 — QĐ phê chuẩn QĐ thay đổi QĐ khởi tố bị can",
  sections: BM091_SECTIONS,
  fields: BM091_FIELDS,
  demo: BM091_DEMO,
};

registerRuntimeUxProfile(BM091_RUNTIME_UX_PROFILE);
