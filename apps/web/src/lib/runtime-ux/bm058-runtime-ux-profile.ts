/**
 * Curated runtime-ux profile for BM-058.
 *
 * 36 fields — Lệnh tạm giam.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-058)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM058_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Căn cứ điều khoản Bộ luật Tố tụng hình sự, căn cứ tạm giam, quyết định đối với bị can.",
  },
  {
    sectionId: "section-noi-dung-lenh",
    title: "3. Nội dung lệnh tạm giam",
    description:
      "Điều 1 — Tạm giam. Điều 2 — Thông báo.",
  },
  {
    sectionId: "section-thong-tin-nguoi-bi-tam-giam",
    title: "4. Thông tin người bị tạm giam",
    description:
      "Họ tên, giới tính, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, giấy tờ tùy thân, địa chỉ thường trú / tạm trú / hiện tại.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "5. Nơi nhận",
    description: "Người bị tạm giam, cơ quan quản lý tạm giam, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "6. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
  {
    sectionId: "section-giao-nhan",
    title: "7. Giao nhận",
    description: "Thời điểm giao nhận, người nhận.",
  },
] as const;

const BM058_FIELDS = {
  "agency.parentName": {
    label: "Viện kiểm sát cấp trên",
    placeholder:
      "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "09/QĐ-VKSKV7",
    helpText: "Số ký hiệu của lệnh tạm giam.",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder:
      "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
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
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ điều khoản Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 119, 120 Bộ luật Tố tụng hình sự năm 2015.",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 119, 120 Bộ luật Tố tụng hình sự năm 2015.",
    },
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ luật tư pháp người chưa thành niên (nếu có)",
    placeholder: "—",
    smart: {
      key: "legalBasis.juvenileJusticeLine",
      kind: "textarea",
      rows: 2,
      placeholder: "—",
    },
  },
  "caseDecision.legalBasisLine": {
    label: "Căn cứ quyết định giải quyết vụ án",
    placeholder:
      "Quyết định số 05/QĐ-VKSKV7 ngày 01 tháng 6 năm 2026 về khởi tố bị can.",
    smart: {
      key: "caseDecision.legalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 05/QĐ-VKSKV7 ngày 01 tháng 6 năm 2026 về khởi tố bị can.",
    },
  },
  "accusedDecision.legalBasisLine": {
    label: "Căn cứ quyết định đối với bị can",
    placeholder:
      "Quyết định số 06/QĐ-VKSKV7 ngày 02 tháng 6 năm 2026 về quyết định khởi tố bị can.",
    smart: {
      key: "accusedDecision.legalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 06/QĐ-VKSKV7 ngày 02 tháng 6 năm 2026 về quyết định khởi tố bị can.",
    },
  },
  "measure.detentionReasonLine": {
    label: "Căn cứ lý do tạm giam",
    placeholder:
      "Có căn cứ cho thấy bị can sẽ trốn, cản trở điều tra, hoặc tiếp tục phạm tội.",
    smart: {
      key: "measure.detentionReasonLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Có căn cứ cho thấy bị can sẽ trốn, cản trở điều tra, hoặc tiếp tục phạm tội.",
    },
  },
  "measure.detentionArticle1Line": {
    label: "Điều 1 — Quyết định tạm giam",
    placeholder:
      "Tạm giam bị can Nguyễn Văn Phong tại Trại tạm giam Công an Thành phố Hồ Chí Minh.",
    smart: {
      key: "measure.detentionArticle1Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Tạm giam bị can Nguyễn Văn Phong tại Trại tạm giam Công an Thành phố Hồ Chí Minh.",
    },
  },
  "person.fullName": {
    label: "Họ và tên người bị tạm giam",
    placeholder: "Nguyễn Văn Phong",
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
    placeholder: "1985-12-01",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Tỉnh Long An",
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
    placeholder: "Công nhân xây dựng",
  },
  "person.identityDocumentLine": {
    label: "Số CMND/CCCD",
    placeholder: "079185001234",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder:
      "56 Đường Trần Bình Trọng, Quận 5, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.permanentAddress",
      kind: "textarea",
      rows: 2,
      placeholder:
        "56 Đường Trần Bình Trọng, Quận 5, Thành phố Hồ Chí Minh",
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
    placeholder:
      "56 Đường Trần Bình Trọng, Quận 5, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
      placeholder:
        "56 Đường Trần Bình Trọng, Quận 5, Thành phố Hồ Chí Minh",
    },
  },
  "measure.detentionDurationText": {
    label: "Thời hạn tạm giam",
    placeholder: "01 tháng",
  },
  "measure.detentionFromDateText": {
    label: "Tạm giam từ ngày",
    placeholder: "2026-07-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "measure.detentionToDateText": {
    label: "Đến ngày",
    placeholder: "2026-08-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "measure.detentionArticle2Line": {
    label: "Điều 2 — Thông báo",
    placeholder:
      "Quyết định này được gửi cho: người bị tạm giam, VKS cấp trên, lưu hồ sơ.",
    smart: {
      key: "measure.detentionArticle2Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định này được gửi cho: người bị tạm giam, VKS cấp trên, lưu hồ sơ.",
    },
  },
  "recipients.personLine": {
    label: "Nơi nhận — Người bị tạm giam",
    placeholder: "Nguyễn Văn Phong",
  },
  "recipients.detentionExecutionUnitLine": {
    label: "Nơi nhận — Cơ quan quản lý tạm giam",
    placeholder: "Trại tạm giam Công an Thành phố Hồ Chí Minh",
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
  "delivery.deliveredAtText": {
    label: "Thời điểm giao nhận",
    placeholder: "14 giờ 00 phút, ngày 04 tháng 7 năm 2026",
  },
  "delivery.receiverTitle": {
    label: "Người nhận tại trại tạm giam",
    placeholder: "Giám thị trại tạm giam — Phạm Văn An",
  },
} as const;

const BM058_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "09/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 119, 120 Bộ luật Tố tụng hình sự năm 2015.",
  "legalBasis.juvenileJusticeLine": "—",
  "caseDecision.legalBasisLine":
    "Quyết định số 05/QĐ-VKSKV7 ngày 01 tháng 6 năm 2026 về khởi tố bị can Nguyễn Văn Phong về tội trộm cắp tài sản.",
  "accusedDecision.legalBasisLine":
    "Quyết định số 06/QĐ-VKSKV7 ngày 02 tháng 6 năm 2026 về quyết định khởi tố bị can.",
  "measure.detentionReasonLine":
    "Có căn cứ cho thấy bị can sẽ trốn, cản trở điều tra, hoặc tiếp tục phạm tội.",
  "measure.detentionArticle1Line":
    "Tạm giam bị can Nguyễn Văn Phong tại Trại tạm giam Công an Thành phố Hồ Chí Minh.",
  "person.fullName": "Nguyễn Văn Phong",
  "person.genderLabel": "Nam",
  "person.otherName": "—",
  "person.dateOfBirthText": "1985-12-01",
  "person.placeOfBirth": "Tỉnh Long An",
  "person.nationality": "Việt Nam",
  "person.ethnicity": "Kinh",
  "person.religion": "Không",
  "person.occupation": "Công nhân xây dựng",
// PHASE15B3_SYNTHETIC_FIXTURE_OK: 079185001234 is a format-shaped synthetic test CCCD for BM-058, not derived from real customer/case data.
      "person.identityDocumentLine": "079185001234",
  "person.permanentAddress":
    "56 Đường Trần Bình Trọng, Quận 5, Thành phố Hồ Chí Minh",
  "person.temporaryAddress": "—",
  "person.currentAddress":
    "56 Đường Trần Bình Trọng, Quận 5, Thành phố Hồ Chí Minh",
  "measure.detentionDurationText": "01 tháng",
  "measure.detentionFromDateText": "2026-07-04",
  "measure.detentionToDateText": "2026-08-04",
  "measure.detentionArticle2Line":
    "Quyết định này được gửi cho: người bị tạm giam, VKS cấp trên, lưu hồ sơ.",
  "recipients.personLine": "Nguyễn Văn Phong",
  "recipients.detentionExecutionUnitLine":
    "Trại tạm giam Công an Thành phố Hồ Chí Minh",
  "recipients.archiveLine": "HSVA, HSKS, VP.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Trần Đình Khoa",
  "delivery.deliveredAtText": "14 giờ 00 phút, ngày 04 tháng 7 năm 2026",
  "delivery.receiverTitle": "Giám thị trại tạm giam — Phạm Văn An",
} as const;

const BM058_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-058",
  versionLabel:
    "BM-058 curated batch 3 — smart issue-place-date-line, textarea smarts, no stale tokens",
  sections: BM058_SECTIONS,
  fields: BM058_FIELDS,
  demo: BM058_DEMO,
};

registerRuntimeUxProfile(BM058_RUNTIME_UX_PROFILE);