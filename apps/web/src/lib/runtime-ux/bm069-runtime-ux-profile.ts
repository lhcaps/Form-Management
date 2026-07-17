/**
 * Curated runtime-ux profile for BM-069.
 *
 * 14 fields — BB hủy phong tỏa tài khoản.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-069)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM069_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin cơ quan, người bị áp dụng, số văn bản, người nhận.",
  },
] as const;

const BM069_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Phạm Thị Hương",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "09/QĐ-VKSKV7",
    helpText:
      "Số ký hiệu của biên bản hủy phong tỏa tài khoản.",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Thành phố Hồ Chí Minh, ngày 08 tháng 7 năm 2026",
    smart: {
      key: "document.issueDate",
      kind: "textarea",
      rows: 2,
      placeholder: "Thành phố Hồ Chí Minh, ngày 08 tháng 7 năm 2026",
    },
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "1990-08-20",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.idNumber": {
    label: "Số CCCD/CMND",
    placeholder: "079290002233",
  },
} as const;

const BM069_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "recipients.personLine": "Phạm Thị Hương",
  "document.fullDocumentCode": "09/QĐ-VKSKV7",
  "document.issueDate": "Thành phố Hồ Chí Minh, ngày 08 tháng 7 năm 2026",
  "person.dateOfBirth": "1990-08-20",
  "person.idNumber": "079290002233",
} as const;

const BM069_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-069",
  versionLabel:
    "BM-069 curated batch 3 — no stale tokens, real demo values",
  sections: BM069_SECTIONS,
  fields: BM069_FIELDS,
  demo: BM069_DEMO,
};

registerRuntimeUxProfile(BM069_RUNTIME_UX_PROFILE);