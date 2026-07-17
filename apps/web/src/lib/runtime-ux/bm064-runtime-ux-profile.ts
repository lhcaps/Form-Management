/**
 * Curated runtime-ux profile for BM-064.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM064_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Thông tin cơ quan, số văn bản.",
  },
  {
    sectionId: "section-thong-tin-van-ban",
    title: "Thông tin văn bản",
    description: "Ngày ban hành quyết định hủy bỏ kê biên tài sản.",
  },
] as const;

const BM064_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "06/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định hủy bỏ kê biên tài sản.",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "2026-07-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
    smart: {
      key: "document.issueDate",
      kind: "text",
    },
  },
} as const;

const BM064_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.fullDocumentCode": "06/QĐ-VKSKV7",
  "document.issueDate": "2026-07-04",
} as const;

const BM064_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-064",
  versionLabel:
    "BM-064 curated batch 3 — no stale tokens, real demo values",
  sections: BM064_SECTIONS,
  fields: BM064_FIELDS,
  demo: BM064_DEMO,
};

registerRuntimeUxProfile(BM064_RUNTIME_UX_PROFILE);
