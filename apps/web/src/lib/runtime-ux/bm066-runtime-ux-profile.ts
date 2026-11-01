/**
 * Curated runtime-ux profile for BM-066.
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

const BM066_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Thông tin cơ quan, số văn bản, người bị áp dụng.",
  },
  {
    sectionId: "section-thong-tin-van-ban",
    title: "Thông tin văn bản",
    description: "Địa danh, ngày ban hành lệnh phong tỏa.",
  },
  {
    sectionId: "section-can-cu-ban-hanh",
    title: "Căn cứ ban hành",
    description: "Xét thấy — căn cứ ban hành lệnh phong tỏa tài khoản.",
  },
  {
    sectionId: "section-nguoi-co-tai-khoan-bi-phong-toa",
    title: "Người có tài khoản bị phong tỏa",
    description:
      "Thông tin nhân thân, giấy tờ tùy thân của người có tài khoản.",
  },
  {
    sectionId: "section-thi-hanh-lenh",
    title: "Thi hành lệnh",
    description: "Yêu cầu thi hành và kiểm sát viên được phân công.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description: "Họ tên người ký.",
  },
] as const;

const BM066_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "decision.decisionLine": {
    label: "Nội dung quyết định",
    placeholder: "Lệnh phong tỏa tài khoản số 08/QĐ-VKSKV7",
    smart: {
      key: "decision.decisionLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Lệnh phong tỏa tài khoản số 08/QĐ-VKSKV7",
    },
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Phạm Thị Hương",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "08/QĐ-VKSKV7",
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
  "measure.reasonLine": {
    label: "Xét thấy",
    placeholder:
      "Căn cứ kết quả điều tra, có căn cứ phong tỏa tài khoản ngân hàng để bảo đảm thi hành án.",
    smart: {
      key: "measure.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ kết quả điều tra, có căn cứ phong tỏa tài khoản ngân hàng để bảo đảm thi hành án.",
    },
  },
  "person.identityIssueLine": {
    label: "Ngày cấp, nơi cấp giấy tờ tùy thân",
    placeholder:
      "Ngày 10 tháng 01 năm 2020, Công an Thành phố Hồ Chí Minh",
  },
  "measure.executionRequestLine": {
    label: "Yêu cầu thi hành lệnh",
    placeholder:
      "Ngân hàng thương mại có liên quan phải phong tỏa tài khoản trong vòng 24 giờ kể từ khi nhận được lệnh.",
    smart: {
      key: "measure.executionRequestLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Ngân hàng thương mại có liên quan phải phong tỏa tài khoản trong vòng 24 giờ.",
    },
  },
  "person.birthInfoLine": {
    label: "Sinh ngày, tháng, năm, nơi sinh",
    placeholder: "Sinh ngày 20 tháng 8 năm 1990, tại Tỉnh Bình Dương",
    smart: {
      key: "person.birthInfoLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Sinh ngày 20 tháng 8 năm 1990, tại Tỉnh Bình Dương",
    },
  },
  "person.nationalityEthnicityReligionLine": {
    label: "Quốc tịch, dân tộc, tôn giáo",
    placeholder: "Việt Nam, Kinh, Không",
  },
  "assignment.assignedOfficerLine": {
    label: "Kiểm sát viên được phân công thi hành lệnh",
    placeholder: "Kiểm sát viên — Phạm Thị Lan Hương",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Hương",
  },
} as const;

const BM066_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "decision.decisionLine":
    "Lệnh phong tỏa tài khoản số 08/QĐ-VKSKV7 ngày 04 tháng 7 năm 2026",
  "recipients.personLine": "Phạm Thị Hương",
  "document.fullDocumentCode": "08/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "measure.reasonLine":
    "Căn cứ kết quả điều tra vụ án hình sự số 50/2026/QĐ-VKSKV7, có đủ căn cứ phong tỏa tài khoản ngân hàng để bảo đảm thi hành án.",
  "person.identityIssueLine":
    "Ngày 10 tháng 01 năm 2020, Công an Thành phố Hồ Chí Minh",
  "measure.executionRequestLine":
    "Ngân hàng thương mại có liên quan phải phong tỏa tài khoản trong vòng 24 giờ kể từ khi nhận được lệnh.",
  "person.birthInfoLine":
    "Sinh ngày 20 tháng 8 năm 1990, tại Tỉnh Bình Dương",
  "person.nationalityEthnicityReligionLine": "Việt Nam, Kinh, Không",
  "assignment.assignedOfficerLine": "Kiểm sát viên — Phạm Thị Lan Hương",
  "signature.signerName": "Phạm Thị Lan Hương",
} as const;

const BM066_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-066",
  versionLabel:
    "BM-066 curated batch 3 — smart textarea + issue-place-date-line, no stale tokens",
  sections: BM066_SECTIONS,
  fields: BM066_FIELDS,
  demo: BM066_DEMO,
};

registerRuntimeUxProfile(BM066_RUNTIME_UX_PROFILE);
