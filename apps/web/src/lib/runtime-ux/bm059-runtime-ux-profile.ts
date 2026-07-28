/**
 * Curated runtime-ux profile for BM-059.
 *
 * 40 fields — QĐ gia hạn tạm giam để truy tố.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-059)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM059_SECTIONS = [
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
      "Căn cứ điều khoản Bộ luật Tố tụng hình sự, căn cứ quyết định tạm giam, căn cứ quyết định truy tố, lý do gia hạn.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description: "Điều 1 — Gia hạn tạm giam. Điều 2 — Thông báo.",
  },
  {
    sectionId: "section-thong-tin-nhan-than",
    title: "4. Thông tin nhân thân bị can",
    description:
      "Họ tên, giới tính, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, giấy tờ tùy thân, địa chỉ.",
  },
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "5. Thông tin biểu mẫu",
    description: "Mục đích biểu mẫu.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "6. Nơi nhận",
    description: "Người bị can, cơ quan quản lý tạm giam, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "7. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
  {
    sectionId: "section-giao-nhan",
    title: "8. Giao nhận",
    description: "Thời điểm giao nhận, người nhận.",
  },
] as const;

const BM059_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder:
      "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "10/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định gia hạn tạm giam.",
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
      "Căn cứ Điều 173, 174 Bộ luật Tố tụng hình sự năm 2015.",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 173, 174 Bộ luật Tố tụng hình sự năm 2015.",
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
      "Quyết định số 08/QĐ-VKSKV7 ngày 30 tháng 6 năm 2026 về việc phê chuẩn quyết định khởi tố bị can.",
    smart: {
      key: "caseDecision.legalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 08/QĐ-VKSKV7 ngày 30 tháng 6 năm 2026 về việc phê chuẩn quyết định khởi tố bị can.",
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
  "measure.detentionOrderLegalBasisLine": {
    label: "Căn cứ lệnh tạm giam",
    placeholder:
      "Lệnh tạm giam số 09/QĐ-VKSKV7 ngày 04 tháng 7 năm 2026.",
    smart: {
      key: "measure.detentionOrderLegalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Lệnh tạm giam số 09/QĐ-VKSKV7 ngày 04 tháng 7 năm 2026.",
    },
  },
  "measure.prosecutionExtensionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định gia hạn thời hạn truy tố",
    placeholder:
      "Quyết định số 12/QĐ-VKSKV7 ngày 01 tháng 8 năm 2026 về việc gia hạn thời hạn truy tố.",
    smart: {
      key: "measure.prosecutionExtensionDecisionLegalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 12/QĐ-VKSKV7 ngày 01 tháng 8 năm 2026 về việc gia hạn thời hạn truy tố.",
    },
  },
  "measure.detentionExtensionReasonLine": {
    label: "Lý do gia hạn tạm giam",
    placeholder:
      "Vụ án đang trong giai đoạn truy tố, cần thêm thời gian để hoàn tất hồ sơ truy tố theo quyết định gia hạn thời hạn truy tố.",
    smart: {
      key: "measure.detentionExtensionReasonLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Vụ án đang trong giai đoạn truy tố, cần thêm thời gian để hoàn tất hồ sơ truy tố.",
    },
  },
  "measure.detentionExtensionArticle1Line": {
    label: "Điều 1 — Nội dung gia hạn",
    placeholder:
      "Gia hạn tạm giam đối với bị can Nguyễn Văn Phong thêm 02 tháng, từ ngày 04 tháng 8 năm 2026 đến ngày 04 tháng 10 năm 2026.",
    smart: {
      key: "measure.detentionExtensionArticle1Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Gia hạn tạm giam đối với bị can Nguyễn Văn Phong thêm 02 tháng.",
    },
  },
  "person.fullName": {
    label: "Họ và tên bị can",
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
  "person.birthDay": {
    label: "Ngày sinh",
    placeholder: "01",
    smart: {
      key: "person.birthDay",
      kind: "date-parts",
      derivedTargets: ["person.birthDay", "person.birthMonth", "person.birthYear"],
      placeholder: "1985-12-01",
    },
  },
  "person.birthMonth": {
    label: "Tháng sinh",
    placeholder: "12",
  },
  "person.birthYear": {
    label: "Năm sinh",
    placeholder: "1985",
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
  "measure.detentionExtensionDurationText": {
    label: "Thời hạn gia hạn tạm giam",
    placeholder: "02 tháng",
  },
  "measure.detentionExtensionFromDateText": {
    label: "Gia hạn từ ngày",
    placeholder: "2026-08-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "measure.detentionExtensionToDateText": {
    label: "Đến ngày",
    placeholder: "2026-10-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "measure.detentionExtensionArticle2Line": {
    label: "Điều 2 — Thông báo",
    placeholder:
      "Quyết định này được gửi cho: người bị can, VKS cấp trên, lưu hồ sơ.",
    smart: {
      key: "measure.detentionExtensionArticle2Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định này được gửi cho: người bị can, VKS cấp trên, lưu hồ sơ.",
    },
  },
  "recipients.personLine": {
    label: "Nơi nhận — Người bị can",
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
    label: "Người nhận",
    placeholder: "Giám thị trại tạm giam — Phạm Văn An",
  },
} as const;

const BM059_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 173, 174 Bộ luật Tố tụng hình sự năm 2015.",
  "legalBasis.juvenileJusticeLine": "—",
  "caseDecision.legalBasisLine":
    "Quyết định số 08/QĐ-VKSKV7 ngày 30 tháng 6 năm 2026 về việc phê chuẩn quyết định khởi tố bị can Nguyễn Văn Phong.",
  "accusedDecision.legalBasisLine":
    "Quyết định số 06/QĐ-VKSKV7 ngày 02 tháng 6 năm 2026 về quyết định khởi tố bị can.",
  "measure.detentionOrderLegalBasisLine":
    "Lệnh tạm giam số 09/QĐ-VKSKV7 ngày 04 tháng 7 năm 2026 của Viện kiểm sát nhân dân Khu vực 7.",
  "measure.prosecutionExtensionDecisionLegalBasisLine":
    "Quyết định số 12/QĐ-VKSKV7 ngày 01 tháng 8 năm 2026 về việc gia hạn thời hạn truy tố.",
  "measure.detentionExtensionReasonLine":
    "Vụ án đang trong giai đoạn truy tố, cần thêm thời gian để hoàn tất hồ sơ truy tố theo quyết định gia hạn thời hạn truy tố.",
  "measure.detentionExtensionArticle1Line":
    "Gia hạn tạm giam đối với bị can Nguyễn Văn Phong thêm 02 tháng, từ ngày 04 tháng 8 năm 2026 đến ngày 04 tháng 10 năm 2026.",
  "person.fullName": "Nguyễn Văn Phong",
  "person.genderLabel": "Nam",
  "person.otherName": "—",
  "person.birthDay": "01",
  "person.birthMonth": "12",
  "person.birthYear": "1985",
  "person.placeOfBirth": "Tỉnh Long An",
  "person.nationality": "Việt Nam",
  "person.ethnicity": "Kinh",
  "person.religion": "Không",
  "person.occupation": "Công nhân xây dựng",
// PHASE15B3_SYNTHETIC_FIXTURE_OK: 079185001234 is a format-shaped synthetic test CCCD for BM-059, not derived from real customer/case data.
      "person.identityDocumentLine": "079185001234",
  "person.permanentAddress":
    "56 Đường Trần Bình Trọng, Quận 5, Thành phố Hồ Chí Minh",
  "person.temporaryAddress": "—",
  "person.currentAddress":
    "56 Đường Trần Bình Trọng, Quận 5, Thành phố Hồ Chí Minh",
  "measure.detentionExtensionDurationText": "02 tháng",
  "measure.detentionExtensionFromDateText": "2026-08-04",
  "measure.detentionExtensionToDateText": "2026-10-04",
  "measure.detentionExtensionArticle2Line":
    "Quyết định này được gửi cho: người bị can, VKS cấp trên, lưu hồ sơ.",
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

const BM059_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-059",
  versionLabel:
    "BM-059 curated batch 3 — smart issue-place-date-line, textarea smarts, no stale tokens",
  sections: BM059_SECTIONS,
  fields: BM059_FIELDS,
  demo: BM059_DEMO,
};

registerRuntimeUxProfile(BM059_RUNTIME_UX_PROFILE);