/**
 * Curated runtime-ux profile for BM-057.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-057)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM057_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Viện kiểm sát cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Căn cứ quyết định tạm hoãn xuất cảnh, lý do hủy bỏ.",
  },
  {
    sectionId: "section-thong-tin-nguoi-bi-can",
    title: "3. Thông tin người bị can",
    description:
      "Họ tên, giới tính, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, giấy tờ tùy thân, địa chỉ thường trú / tạm trú / hiện tại.",
  },
  {
    sectionId: "section-co-quan-thuc-hien",
    title: "4. Cơ quan thực hiện",
    description: "Tên cơ quan xuất nhập cảnh.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "5. Nơi nhận",
    description:
      "Cơ quan xuất nhập cảnh, người bị can, Cơ quan điều tra, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "6. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
] as const;

const BM057_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "54/QĐ-VKSKV7",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    },
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  },
  "measure.exitPostponementDecisionLegalBasisLine": {
    label: "Căn cứ quyết định tạm hoãn xuất cảnh",
    placeholder:
      "Quyết định số 53/QĐ-VKSKV7 ngày 04 tháng 7 năm 2026 về tạm hoãn xuất cảnh đối với bị can.",
    smart: {
      key: "measure.exitPostponementDecisionLegalBasisLine",
      kind: "textarea",
      rows: 3,
    },
  },
  "measure.exitPostponementCancelReasonLine": {
    label: "Lý do hủy bỏ biện pháp tạm hoãn xuất cảnh",
    placeholder:
      "Việc tạm hoãn xuất cảnh không còn cần thiết do kết quả điều tra xác định người bị can không có hành vi vi phạm pháp luật liên quan đến xuất cảnh.",
    smart: {
      key: "measure.exitPostponementCancelReasonLine",
      kind: "textarea",
      rows: 3,
    },
  },
  "person.fullName": {
    label: "Họ và tên người bị can",
    placeholder: "Võ Thị Hà My",
  },
  "person.genderLabel": {
    label: "Giới tính",
    placeholder: "Nữ",
    smart: {
      key: "person.genderLabel",
      kind: "select",
      options: ["Nam", "Nữ"],
    },
  },
  "person.otherName": {
    label: "Tên gọi khác (bí danh)",
    placeholder: "—",
  },
  "person.dateOfBirthText": {
    label: "Sinh ngày",
    placeholder: "1992-11-08",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Tỉnh Bình Dương",
  },
  "person.nationality": {
    label: "Quốc tịch",
    placeholder: "Việt Nam",
  },
  "person.ethnicity": {
    label: "Dân tộc",
    placeholder: "Kinh",
  },
  "person.religion": {
    label: "Tôn giáo",
    placeholder: "Không",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Nhân viên văn phòng",
  },
  "person.identityDocumentLine": {
    label: "Số CMND/CCCD",
    placeholder: "079292001188",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder:
      "234 Đường Phạm Văn Chiêu, Quận Gò Vấp, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.permanentAddress",
      kind: "textarea",
      rows: 2,
    },
  },
  "person.temporaryAddress": {
    label: "Nơi tạm trú",
    placeholder: "—",
    smart: {
      key: "person.temporaryAddress",
      kind: "textarea",
      rows: 2,
    },
  },
  "person.currentAddress": {
    label: "Nơi ở hiện tại",
    placeholder:
      "234 Đường Phạm Văn Chiêu, Quận Gò Vấp, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
    },
  },
  "measure.immigrationAgencyName": {
    label: "Tên cơ quan xuất nhập cảnh",
    placeholder: "Cục Quản lý xuất nhập cảnh, Bộ Công an",
  },
  "recipients.immigrationUnitLine": {
    label: "Nơi nhận — Cơ quan xuất nhập cảnh",
    placeholder: "Cục Quản lý xuất nhập cảnh, Bộ Công an",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Người bị can",
    placeholder: "Võ Thị Hà My (tại địa chỉ thường trú)",
  },
  "recipients.investigationUnitLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Công an Quận Gò Vấp, Thành phố Hồ Chí Minh",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký tay",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Trần Đình Khoa",
  },
} as const;

const BM057_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "54/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "measure.exitPostponementDecisionLegalBasisLine":
    "Quyết định số 53/QĐ-VKSKV7 ngày 04 tháng 7 năm 2026 về tạm hoãn xuất cảnh đối với bị can Võ Thị Hà My.",
  "measure.exitPostponementCancelReasonLine":
    "Việc tạm hoãn xuất cảnh không còn cần thiết do kết quả điều tra xác định không có căn cứ pháp lý để áp dụng biện pháp này.",
  "person.fullName": "Võ Thị Hà My",
  "person.genderLabel": "Nữ",
  "person.otherName": "—",
  "person.dateOfBirthText": "1992-11-08",
  "person.placeOfBirth": "Tỉnh Bình Dương",
  "person.nationality": "Việt Nam",
  "person.ethnicity": "Kinh",
  "person.religion": "Không",
  "person.occupation": "Nhân viên văn phòng",
// PHASE15B3_SYNTHETIC_FIXTURE_OK: 079292001188 is a format-shaped synthetic test CCCD for BM-057, not derived from real customer/case data.
      "person.identityDocumentLine": "079292001188",
  "person.permanentAddress":
    "234 Đường Phạm Văn Chiêu, Quận Gò Vấp, Thành phố Hồ Chí Minh",
  "person.temporaryAddress": "—",
  "person.currentAddress":
    "234 Đường Phạm Văn Chiêu, Quận Gò Vấp, Thành phố Hồ Chí Minh",
  "measure.immigrationAgencyName":
    "Cục Quản lý xuất nhập cảnh, Bộ Công an",
  "recipients.immigrationUnitLine":
    "Cục Quản lý xuất nhập cảnh, Bộ Công an",
  "recipients.personLine": "Võ Thị Hà My (tại địa chỉ thường trú)",
  "recipients.investigationUnitLine":
    "Công an Quận Gò Vấp, Thành phố Hồ Chí Minh",
  "recipients.archiveLine": "HSVA, HSKS, VP.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Trần Đình Khoa",
} as const;

const BM057_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-057",
  versionLabel:
    "BM-057 curated batch 3 — smart issue-place-date-line, textarea smarts, no stale tokens",
  sections: BM057_SECTIONS,
  fields: BM057_FIELDS,
  demo: BM057_DEMO,
};

registerRuntimeUxProfile(BM057_RUNTIME_UX_PROFILE);
