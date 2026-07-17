/**
 * Curated runtime-ux profile for BM-073.
 *
 * 5 fields — Yêu cầu thay đổi Thủ trưởng Cơ quan điều tra.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-073)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM073_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Thông tin cơ quan, số văn bản.",
  },
  {
    sectionId: "section-thong-tin-van-ban",
    title: "Thông tin văn bản",
    description: "Ngày ban hành.",
  },
  {
    sectionId: "section-thong-tin-ca-nhan",
    title: "Thông tin cá nhân",
    description: "Ngày sinh, số CCCD.",
  },
] as const;

const BM073_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "YC-01/QĐ-VKSKV7",
    helpText: "Số ký hiệu của văn bản yêu cầu.",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issueDate",
      kind: "textarea",
      rows: 2,
      placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    },
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "1985-12-01",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.idNumber": {
    label: "Số CCCD/CMND",
    placeholder: "079185001234",
  },
} as const;

const BM073_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.fullDocumentCode": "YC-01/QĐ-VKSKV7",
  "document.issueDate":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "person.dateOfBirth": "1985-12-01",
  "person.idNumber": "079185001234",
} as const;

const BM073_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-073",
  versionLabel:
    "BM-073 curated batch 3 — no stale tokens, real demo values",
  sections: BM073_SECTIONS,
  fields: BM073_FIELDS,
  demo: BM073_DEMO,
};

registerRuntimeUxProfile(BM073_RUNTIME_UX_PROFILE);