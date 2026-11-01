/**
 * Curated runtime-ux profile for BM-061.
 *
 * 4 fields — QĐ dẫn giải.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-061)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM061_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin cơ quan, người bị áp dụng, số văn bản, người nhận.",
  },
] as const;

const BM061_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Lê Minh Quang",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "02/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định dẫn giải.",
  },
  "recipients.personLine3": {
    label: "Người nhận",
    placeholder: "Công an Quận 1, Thành phố Hồ Chí Minh",
    smart: {
      key: "recipients.personLine3",
      kind: "textarea",
      rows: 2,
      placeholder: "Công an Quận 1, Thành phố Hồ Chí Minh",
    },
  },
} as const;

const BM061_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "recipients.personLine": "Lê Minh Quang",
  "document.fullDocumentCode": "02/QĐ-VKSKV7",
  "recipients.personLine3": "Công an Quận 1, Thành phố Hồ Chí Minh",
} as const;

const BM061_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-061",
  versionLabel:
    "BM-061 curated batch 3 — no stale tokens, real demo values",
  sections: BM061_SECTIONS,
  fields: BM061_FIELDS,
  demo: BM061_DEMO,
};

registerRuntimeUxProfile(BM061_RUNTIME_UX_PROFILE);