/**
 * Curated runtime-ux profile for BM-088.
 *
 * 3 fields — QĐ huỷ bỏ QĐ nhập vụ án hình sự.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-088)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM088_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Viện kiểm sát ban hành, số quyết định, địa danh.",
  },
] as const;

const BM088_FIELDS = {
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
    placeholder: "62/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định huỷ bỏ QĐ nhập vụ án hình sự.",
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

const BM088_DEMO = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.soQuyet": "62/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
} as const;

const BM088_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-088",
  versionLabel: "BM-088 curated batch 4 — QĐ huỷ bỏ QĐ nhập vụ án hình sự",
  sections: BM088_SECTIONS,
  fields: BM088_FIELDS,
  demo: BM088_DEMO,
};

registerRuntimeUxProfile(BM088_RUNTIME_UX_PROFILE);
