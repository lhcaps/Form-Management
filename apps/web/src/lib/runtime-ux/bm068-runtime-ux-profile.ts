/**
 * Curated runtime-ux profile for BM-068.
 *
 * 14 fields — QĐ hủy phong tỏa tài khoản.
 *
 * NOTE: BM-068 uses non-standard compound person keys
 * (permanentAddress2/3, occupation2, idNumber2) which are derived
 * from the compiled contract. Labels and demo values are curated
 * from the contract shape without mutation.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-068)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM068_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Thông tin cơ quan, số văn bản, người bị áp dụng.",
  },
] as const;

const BM068_FIELDS = {
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
    helpText: "Số ký hiệu của quyết định hủy phong tỏa tài khoản.",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Thành phố Hồ Chí Minh, ngày 08 tháng 7 năm 2026",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "1990-08-20",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder: "78 Đường Lý Thường Kiệt, Quận 10, TP.HCM",
    smart: {
      key: "person.permanentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "78 Đường Lý Thường Kiệt, Quận 10, TP.HCM",
    },
  },
  "person.permanentAddress2": {
    label: "Nơi thường trú (bổ sung)",
    placeholder: "—",
    smart: {
      key: "person.permanentAddress2",
      kind: "textarea",
      rows: 2,
      placeholder: "—",
    },
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Kế toán",
  },
  "person.idNumber": {
    label: "Số CCCD/CMND",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 079290002233 is a format-shaped synthetic test value, not derived from any real customer/case data.
    placeholder: "079290002233",
  },
  "person.permanentAddress3": {
    label: "Địa chỉ bổ sung",
    placeholder: "—",
    smart: {
      key: "person.permanentAddress3",
      kind: "textarea",
      rows: 2,
      placeholder: "—",
    },
  },
  "person.occupation2": {
    label: "Nghề nghiệp bổ sung",
    placeholder: "—",
  },
  "person.idNumber2": {
    label: "Số CCCD/CMND bổ sung",
    placeholder: "—",
  },
  "person.temporaryAddress": {
    label: "Nơi tạm trú",
    placeholder: "—",
    smart: {
      key: "person.temporaryAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "—",
    },
  },
  "person.province": {
    label: "Tỉnh/Thành phố",
    placeholder: "Thành phố Hồ Chí Minh",
  },
} as const;

const BM068_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "recipients.personLine": "Phạm Thị Hương",
  "document.fullDocumentCode": "09/QĐ-VKSKV7",
  "document.issueDate": "Thành phố Hồ Chí Minh, ngày 08 tháng 7 năm 2026",
  "person.dateOfBirth": "1990-08-20",
  "person.permanentAddress": "78 Đường Lý Thường Kiệt, Quận 10, TP.HCM",
  "person.permanentAddress2": "—",
  "person.occupation": "Kế toán",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 079290002233 is a format-shaped synthetic test value, not derived from any real customer/case data.
  "person.idNumber": "079290002233",
  "person.permanentAddress3": "—",
  "person.occupation2": "—",
  "person.idNumber2": "—",
  "person.temporaryAddress": "—",
  "person.province": "Thành phố Hồ Chí Minh",
} as const;

const BM068_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-068",
  versionLabel:
    "BM-068 curated batch 3 — smart textarea, no stale tokens",
  sections: BM068_SECTIONS,
  fields: BM068_FIELDS,
  demo: BM068_DEMO,
};

registerRuntimeUxProfile(BM068_RUNTIME_UX_PROFILE);
