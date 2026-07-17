/**
 * Curated runtime-ux profile for BM-098.
 *
 * 3 fields — Yêu cầu ra QĐ thay đổi quyết định khởi tố bị can.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-098)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM098_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description: "Viện kiểm sát ban hành, số yêu cầu, địa danh.",
  },
] as const;

const BM098_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    smart: {
      key: "agency.vienKiem",
      kind: "text",
    },
  },
  "document.soYeu": {
    label: "Số yêu cầu",
    placeholder: "68/YC-VKSKV7",
    helpText: "Số ký hiệu của yêu cầu ra QĐ thay đổi quyết định khởi tố bị can.",
    smart: {
      key: "document.soYeu",
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

const BM098_DEMO = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.soYeu": "68/YC-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
} as const;

const BM098_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-098",
  versionLabel:
    "BM-098 curated batch 4 — Yêu cầu ra QĐ thay đổi quyết định khởi tố bị can",
  sections: BM098_SECTIONS,
  fields: BM098_FIELDS,
  demo: BM098_DEMO,
};

registerRuntimeUxProfile(BM098_RUNTIME_UX_PROFILE);
