/**
 * Curated runtime-ux profile for BM-074.
 *
 * 4 fields — Yêu cầu cử phiên dịch.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-074)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM074_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin cơ quan, địa danh, số điện thoại, sơ yếu.",
  },
] as const;

const BM074_FIELDS = {
  "agency.coQuan": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Thành phố Hồ Chí Minh",
  },
  "document.dienThoai": {
    label: "Số điện thoại",
    placeholder: "028 3829 1234",
  },
  "document.soYeu": {
    label: "Sơ yếu",
    placeholder:
      "Yêu cầu Sở Tư pháp Thành phố Hồ Chí Minh cử phiên dịch tiếng Anh để phục vụ việc lấy lời khai bị can trong vụ án hình sự số 45/2026/QĐ-VKSKV7.",
    smart: {
      key: "document.soYeu",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Yêu cầu cử phiên dịch tiếng Anh để phục vụ việc lấy lời khai bị can.",
    },
  },
} as const;

const BM074_DEMO = {
  "agency.coQuan": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.dienThoai": "028 3829 1234",
  "document.soYeu":
    "Yêu cầu Sở Tư pháp Thành phố Hồ Chí Minh cử phiên dịch tiếng Anh để phục vụ việc lấy lời khai bị can Nguyễn Văn Phong trong vụ án hình sự số 45/2026/QĐ-VKSKV7.",
} as const;

const BM074_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-074",
  versionLabel:
    "BM-074 curated batch 3 — smart textarea, no stale tokens",
  sections: BM074_SECTIONS,
  fields: BM074_FIELDS,
  demo: BM074_DEMO,
};

registerRuntimeUxProfile(BM074_RUNTIME_UX_PROFILE);