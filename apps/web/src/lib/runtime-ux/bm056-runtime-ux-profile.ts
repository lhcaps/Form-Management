/**
 * Curated runtime-ux profile for BM-056.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-056)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM056_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Viện kiểm sát cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description: "Lý do tạm hoãn xuất cảnh.",
  },
  {
    sectionId: "section-thong-tin-nguoi-bi-can",
    title: "3. Thông tin người bị can",
    description:
      "Họ tên, giới tính, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, giấy tờ tùy thân, địa chỉ thường trú / tạm trú / hiện tại.",
  },
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "4. Thông tin biểu mẫu",
    description: "Tôn giáo (dùng cho mục đích biểu mẫu).",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "5. Nội dung quyết định",
    description:
      "Thời hạn tạm hoãn, từ ngày, đến ngày, nội dung quyết định Điều 2.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "6. Nơi nhận",
    description:
      "Người bị can, Cơ quan xuất nhập cảnh, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "7. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
] as const;

const BM056_FIELDS = {
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
    placeholder: "53/QĐ-VKSKV7",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      derivedTargets: ["document.issuePlaceAndDateLine"],
      placeholder: "Thành phố Hồ Chí Minh",
    },
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  },
  "measure.exitPostponementReasonLine": {
    label: "Lý do tạm hoãn xuất cảnh",
    placeholder:
      "Người bị can đang trong thời gian điều tra vụ án hình sự, cần phải có mặt theo giấy triệu tập của Cơ quan điều tra.",
    smart: {
      key: "measure.exitPostponementReasonLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Người bị can đang trong thời gian điều tra vụ án hình sự, cần phải có mặt theo giấy triệu tập của Cơ quan điều tra.",
    },
  },
  "person.fullName": {
    label: "Họ và tên người bị can",
    placeholder: "Trần Văn Minh",
  },
  "person.genderLabel": {
    label: "Giới tính",
    placeholder: "Nam",
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
    placeholder: "1990-03-22",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Tỉnh Đồng Nai",
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
    placeholder: "Phật giáo",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Công nhân",
  },
  "person.identityDocumentLine": {
    label: "Số CMND/CCCD",
    placeholder: "079290003322",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder: "789 Đường Trần Hưng Đạo, Quận 5, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.permanentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "789 Đường Trần Hưng Đạo, Quận 5, Thành phố Hồ Chí Minh",
    },
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
  "person.currentAddress": {
    label: "Nơi ở hiện tại",
    placeholder: "789 Đường Trần Hưng Đạo, Quận 5, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "789 Đường Trần Hưng Đạo, Quận 5, Thành phố Hồ Chí Minh",
    },
  },
  "measure.exitPostponementDurationText": {
    label: "Thời hạn tạm hoãn xuất cảnh",
    placeholder: "02 tháng",
    helpText: "Ví dụ: 01 tháng, 03 tháng.",
  },
  "measure.exitPostponementFromDateText": {
    label: "Từ ngày",
    placeholder: "2026-07-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "measure.exitPostponementToDateText": {
    label: "Đến ngày",
    placeholder: "2026-09-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "measure.exitPostponementArticle2Line": {
    label: "Điều 2 — Nội dung quyết định",
    placeholder:
      "Trong thời gian tạm hoãn xuất cảnh, người bị can vẫn phải có mặt theo yêu cầu của Cơ quan điều tra khi được triệu tập.",
    smart: {
      key: "measure.exitPostponementArticle2Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Trong thời gian tạm hoãn xuất cảnh, người bị can vẫn phải có mặt theo yêu cầu của Cơ quan điều tra khi được triệu tập.",
    },
  },
  "recipients.personLine": {
    label: "Nơi nhận — Người bị can",
    placeholder: "Trần Văn Minh (tại địa chỉ thường trú)",
  },
  "recipients.immigrationUnitLine": {
    label: "Nơi nhận — Cơ quan xuất nhập cảnh",
    placeholder: "Cục Quản lý xuất nhập cảnh, Bộ Công an",
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
    placeholder: "Nguyễn Hoàng Anh",
  },
} as const;

const BM056_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "53/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "measure.exitPostponementReasonLine":
    "Người bị can đang trong thời gian điều tra vụ án hình sự số 123/2026/QĐ-VKSKV7, cần phải có mặt theo giấy triệu tập của Cơ quan điều tra.",
  "person.fullName": "Trần Văn Minh",
  "person.genderLabel": "Nam",
  "person.otherName": "—",
  "person.dateOfBirthText": "1990-03-22",
  "person.placeOfBirth": "Tỉnh Đồng Nai",
  "person.nationality": "Việt Nam",
  "person.ethnicity": "Kinh",
  "person.religion": "Phật giáo",
  "person.occupation": "Công nhân",
  "person.identityDocumentLine": "079290003322",
  "person.permanentAddress":
    "789 Đường Trần Hưng Đạo, Quận 5, Thành phố Hồ Chí Minh",
  "person.temporaryAddress": "—",
  "person.currentAddress":
    "789 Đường Trần Hưng Đạo, Quận 5, Thành phố Hồ Chí Minh",
  "measure.exitPostponementDurationText": "02 tháng",
  "measure.exitPostponementFromDateText": "2026-07-04",
  "measure.exitPostponementToDateText": "2026-09-04",
  "measure.exitPostponementArticle2Line":
    "Trong thời gian tạm hoãn xuất cảnh, người bị can vẫn phải có mặt theo yêu cầu của Cơ quan điều tra khi được triệu tập.",
  "recipients.personLine": "Trần Văn Minh (tại địa chỉ thường trú)",
  "recipients.immigrationUnitLine":
    "Cục Quản lý xuất nhập cảnh, Bộ Công an",
  "recipients.archiveLine": "HSVA, HSKS, VP.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Nguyễn Hoàng Anh",
} as const;

const BM056_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-056",
  versionLabel:
    "BM-056 curated batch 3 — smart issue-place-date-line, textarea smarts, no stale tokens",
  sections: BM056_SECTIONS,
  fields: BM056_FIELDS,
  demo: BM056_DEMO,
};

registerRuntimeUxProfile(BM056_RUNTIME_UX_PROFILE);
