/**
 * Curated runtime-ux profile for BM-062.
 *
 * 20 fields — Lệnh kê biên tài sản.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-062)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM062_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Thông tin cơ quan, số văn bản, người bị áp dụng.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description: "Họ tên người ký.",
  },
  {
    sectionId: "section-nguoi-co-tai-san-ke-bien",
    title: "Người có tài sản kê biên",
    description:
      "Thông tin nhân thân, địa chỉ, giấy tờ tùy thân của người có tài sản kê biên.",
  },
  {
    sectionId: "section-can-cu-ban-hanh",
    title: "Căn cứ ban hành",
    description: "Xét thấy — căn cứ ban hành lệnh kê biên tài sản.",
  },
  {
    sectionId: "section-tai-san-ke-bien",
    title: "Tài sản kê biên",
    description: "Danh mục tài sản bị kê biên.",
  },
  {
    sectionId: "section-thi-hanh-lenh",
    title: "Thi hành lệnh",
    description: "Cơ quan thi hành và cơ quan phối hợp.",
  },
] as const;

const BM062_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "decision.decisionLine": {
    label: "Nội dung quyết định",
    placeholder: "Quyết định kê biên tài sản số 05/QĐ-VKSKV7",
    smart: {
      key: "decision.decisionLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Quyết định kê biên tài sản số 05/QĐ-VKSKV7",
    },
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Hoàng Văn Minh",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "05/QĐ-VKSKV7",
    helpText: "Số ký hiệu của lệnh kê biên tài sản.",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Hương",
  },
  "person.otherName": {
    label: "Tên gọi khác (bí danh)",
    placeholder: "—",
  },
  "person.birthInfoLine": {
    label: "Sinh ngày, tháng, năm, nơi sinh",
    placeholder: "Sinh ngày 15 tháng 5 năm 1985, tại Thành phố Hồ Chí Minh",
    smart: {
      key: "person.birthInfoLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Sinh ngày 15 tháng 5 năm 1985, tại Thành phố Hồ Chí Minh",
    },
  },
  "person.nationality": {
    label: "Quốc tịch",
    placeholder: "Việt Nam",
  },
  "person.ethnicityReligionLine": {
    label: "Dân tộc, tôn giáo",
    placeholder: "Kinh, Không",
  },
  "measure.reasonLine": {
    label: "Xét thấy",
    placeholder:
      "Căn cứ kết quả điều tra, có căn cứ ban hành lệnh kê biên tài sản để bảo đảm thi hành án.",
    smart: {
      key: "measure.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ kết quả điều tra, có căn cứ ban hành lệnh kê biên tài sản để bảo đảm thi hành án.",
    },
  },
  "measure.assetListLine": {
    label: "Tài sản kê biên",
    placeholder:
      "1. Nhà ở tại 123 Đường Lê Lợi, Quận 1, TP.HCM — Giấy chứng nhận QSH số 0123456789.\n2. Ô tô Toyota Camry biển kiểm soát 59A-123.45.",
    smart: {
      key: "measure.assetListLine",
      kind: "textarea",
      rows: 5,
      placeholder:
        "1. Nhà ở tại 123 Đường Lê Lợi, Quận 1, TP.HCM.\n2. Ô tô Toyota Camry biển kiểm soát 59A-123.45.",
    },
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Kinh doanh tự do",
  },
  "person.identityNo": {
    label: "Số CCCD/CMND",
    placeholder: "079185001234",
  },
  "person.identityIssueDateLine": {
    label: "Ngày cấp giấy tờ tùy thân",
    placeholder: "Ngày 10 tháng 01 năm 2020",
  },
  "person.identityIssuePlace": {
    label: "Nơi cấp giấy tờ tùy thân",
    placeholder: "Công an Thành phố Hồ Chí Minh",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder: "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.permanentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
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
    placeholder: "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
    },
  },
  "measure.executionAgencyLine": {
    label: "Cơ quan thi hành lệnh",
    placeholder: "Cơ quan thi hành án dân sự, Thành phố Hồ Chí Minh",
  },
  "measure.coordinationAgencyLine": {
    label: "Cơ quan phối hợp thi hành lệnh",
    placeholder: "Công an Quận 1, Thành phố Hồ Chí Minh",
  },
} as const;

const BM062_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "decision.decisionLine":
    "Quyết định kê biên tài sản số 05/QĐ-VKSKV7 ngày 04 tháng 7 năm 2026",
  "recipients.personLine": "Hoàng Văn Minh",
  "document.fullDocumentCode": "05/QĐ-VKSKV7",
  "signature.signerName": "Phạm Thị Lan Hương",
  "person.otherName": "—",
  "person.birthInfoLine":
    "Sinh ngày 15 tháng 5 năm 1985, tại Thành phố Hồ Chí Minh",
  "person.nationality": "Việt Nam",
  "person.ethnicityReligionLine": "Kinh, Không",
  "measure.reasonLine":
    "Căn cứ kết quả điều tra vụ án hình sự số 45/2026/QĐ-VKSKV7, có đủ căn cứ ban hành lệnh kê biên tài sản để bảo đảm thi hành án.",
  "measure.assetListLine":
    "1. Nhà ở tại 123 Đường Lê Lợi, Quận 1, TP.HCM — Giấy chứng nhận QSH số 0123456789.\n2. Ô tô Toyota Camry biển kiểm soát 59A-123.45.",
  "person.occupation": "Kinh doanh tự do",
  "person.identityNo": "079185001234",
  "person.identityIssueDateLine": "Ngày 10 tháng 01 năm 2020",
  "person.identityIssuePlace": "Công an Thành phố Hồ Chí Minh",
  "person.permanentAddress":
    "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
  "person.temporaryAddress": "—",
  "person.currentAddress":
    "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
  "measure.executionAgencyLine":
    "Cơ quan thi hành án dân sự, Thành phố Hồ Chí Minh",
  "measure.coordinationAgencyLine":
    "Công an Quận 1, Thành phố Hồ Chí Minh",
} as const;

const BM062_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-062",
  versionLabel:
    "BM-062 curated batch 3 — smart textarea, no stale tokens",
  sections: BM062_SECTIONS,
  fields: BM062_FIELDS,
  demo: BM062_DEMO,
};

registerRuntimeUxProfile(BM062_RUNTIME_UX_PROFILE);