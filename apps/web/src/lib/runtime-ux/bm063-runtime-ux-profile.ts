/**
 * Curated runtime-ux profile for BM-063.
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

const BM063_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Thông tin cơ quan, số văn bản, người bị áp dụng.",
  },
  {
    sectionId: "section-bien-ban-ke-bien",
    title: "Biên bản kê biên",
    description:
      "Thời điểm bắt đầu, địa điểm, thời điểm kết thúc kê biên.",
  },
  {
    sectionId: "section-thanh-phan-tham-gia",
    title: "Thành phần tham gia",
    description: "Kiểm sát viên, người tham gia kê biên, đại diện UBND cấp xã.",
  },
  {
    sectionId: "section-nguoi-co-tai-san-ke-bien",
    title: "Người có tài sản kê biên",
    description: "Thông tin nhân thân, địa chỉ, giấy tờ tùy thân.",
  },
  {
    sectionId: "section-tai-san-ke-bien",
    title: "Tài sản kê biên",
    description: "Danh mục tài sản và ý kiến người tham gia.",
  },
] as const;

const BM063_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
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
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Hoàng Văn Minh",
  },
  "document.recordStartedAtTimeText": {
    label: "Thời điểm bắt đầu lập biên bản",
    placeholder: "09 giờ 00 phút, ngày 05 tháng 7 năm 2026",
  },
  "document.recordLocationName": {
    label: "Địa điểm lập biên bản",
    placeholder: "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
  },
  "prosecutor.procuracyName": {
    label: "Viện kiểm sát của Kiểm sát viên",
    placeholder: "Viện kiểm sát nhân dân Khu vực 7",
  },
  "assignment.participantLine1": {
    label: "Người tham gia kê biên 1",
    placeholder: "Nguyễn Thị Mai — Kế toán",
  },
  "assignment.participantLine2": {
    label: "Đại diện Ủy ban nhân dân cấp xã",
    placeholder: "Phó Chủ tịch UBND Quận 1",
  },
  "assignment.participantLine3": {
    label: "Người tham gia kê biên 3",
    placeholder: "—",
  },
  "assignment.participantLine4": {
    label: "Người tham gia kê biên 4",
    placeholder: "—",
  },
  "document.recordEndedAtTimeLine": {
    label: "Thời điểm kết thúc kê biên",
    placeholder: "11 giờ 30 phút, ngày 05 tháng 7 năm 2026",
  },
  "person.birthInfoLine": {
    label: "Sinh ngày, tháng, năm, nơi sinh",
    placeholder:
      "Sinh ngày 15 tháng 5 năm 1985, tại Thành phố Hồ Chí Minh",
    smart: {
      key: "person.birthInfoLine",
      kind: "textarea",
      rows: 2,
      placeholder:
        "Sinh ngày 15 tháng 5 năm 1985, tại Thành phố Hồ Chí Minh",
    },
  },
  "person.nationalityEthnicityReligionLine": {
    label: "Quốc tịch, dân tộc, tôn giáo",
    placeholder: "Việt Nam, Kinh, Không",
  },
  "person.identityIssueLine": {
    label: "Ngày cấp, nơi cấp giấy tờ tùy thân",
    placeholder:
      "Ngày 10 tháng 01 năm 2020, Công an Thành phố Hồ Chí Minh",
  },
  "measure.assetListLine": {
    label: "Tài sản bị kê biên",
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
  "measure.participantOpinionLine": {
    label: "Ý kiến của người tham gia kê biên",
    placeholder: "Người tham gia kê biên xác nhận nội dung biên bản đúng.",
    smart: {
      key: "measure.participantOpinionLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Người tham gia kê biên xác nhận nội dung biên bản đúng.",
    },
  },
} as const;

const BM063_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "recipients.personLine": "Hoàng Văn Minh",
  "document.recordStartedAtTimeText":
    "09 giờ 00 phút, ngày 05 tháng 7 năm 2026",
  "document.recordLocationName":
    "123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh",
  "prosecutor.procuracyName": "Viện kiểm sát nhân dân Khu vực 7",
  "assignment.participantLine1": "Nguyễn Thị Mai — Kế toán",
  "assignment.participantLine2": "Phó Chủ tịch UBND Quận 1",
  "assignment.participantLine3": "—",
  "assignment.participantLine4": "—",
  "document.recordEndedAtTimeLine":
    "11 giờ 30 phút, ngày 05 tháng 7 năm 2026",
  "person.birthInfoLine":
    "Sinh ngày 15 tháng 5 năm 1985, tại Thành phố Hồ Chí Minh",
  "person.nationalityEthnicityReligionLine": "Việt Nam, Kinh, Không",
  "person.identityIssueLine":
    "Ngày 10 tháng 01 năm 2020, Công an Thành phố Hồ Chí Minh",
  "measure.assetListLine":
    "1. Nhà ở tại 123 Đường Lê Lợi, Quận 1, TP.HCM — Giấy chứng nhận QSH số 0123456789.\n2. Ô tô Toyota Camry biển kiểm soát 59A-123.45.",
  "measure.participantOpinionLine":
    "Người tham gia kê biên xác nhận nội dung biên bản đúng, không có ý kiến thêm.",
} as const;

const BM063_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-063",
  versionLabel:
    "BM-063 curated batch 3 — smart textarea + issue-place-date-line, no stale tokens",
  sections: BM063_SECTIONS,
  fields: BM063_FIELDS,
  demo: BM063_DEMO,
};

registerRuntimeUxProfile(BM063_RUNTIME_UX_PROFILE);
