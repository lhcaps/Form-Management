/**
 * Curated runtime-ux profile for BM-075.
 *
 * 5 fields — Yêu cầu cung cấp tài liệu.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-075)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM075_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin cơ quan, số văn bản.",
  },
] as const;

const BM075_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "YC-03/QĐ-VKSKV7",
    helpText: "Số ký hiệu của văn bản yêu cầu cung cấp tài liệu.",
  },
  "person.personFullName": {
    label: "Họ và tên người liên quan",
    placeholder: "Hoàng Văn Minh",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "1985-12-01",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.currentAddress": {
    label: "Địa chỉ liên quan",
    placeholder: "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
    },
  },
} as const;

const BM075_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.fullDocumentCode": "YC-03/QĐ-VKSKV7",
  "person.personFullName": "Hoàng Văn Minh",
  "person.dateOfBirth": "1985-12-01",
  "person.currentAddress":
    "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
} as const;

const BM075_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-075",
  versionLabel:
    "BM-075 curated batch 3 — smart textarea, no stale tokens",
  sections: BM075_SECTIONS,
  fields: BM075_FIELDS,
  demo: BM075_DEMO,
};

registerRuntimeUxProfile(BM075_RUNTIME_UX_PROFILE);