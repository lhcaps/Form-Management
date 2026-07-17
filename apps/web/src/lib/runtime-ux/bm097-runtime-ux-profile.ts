/**
 * Curated runtime-ux profile for BM-097.
 *
 * 32 fields — QĐ khởi tố bị can.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-097)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM097_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Viện kiểm sát cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Căn cứ Bộ luật Tố tụng hình sự, căn cứ luật tư pháp người chưa thành niên, căn cứ quyết định vụ án, căn cứ đủ điều kiện đề nghị truy tố.",
  },
  {
    sectionId: "section-thong-tin-bi-can",
    title: "3. Thông tin bị can",
    description:
      "Họ tên, giới tính, tên gọi khác, sinh ngày, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, giấy tờ tùy thân, địa chỉ thường trú / tạm trú / hiện tại, tiền án tiền sự.",
  },
  {
    sectionId: "section-hanh-vi-pham-toi",
    title: "4. Hành vi phạm tội",
    description: "Mô tả hành vi phạm tội.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "5. Nội dung quyết định",
    description: "Điều 1 — Quyết định khởi tố bị can. Điều 2 — Giao hồ sơ.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "6. Nơi nhận",
    description: "Bị can, cơ quan điều tra, lưu hồ sơ, ghi chú.",
  },
  {
    sectionId: "section-chu-ky",
    title: "7. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
] as const;

const BM097_FIELDS = {
  "agency.parentName": {
    label: "Viện kiểm sát cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định khởi tố bị can",
    placeholder: "74/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định khởi tố bị can.",
  },
  "document.issuePlaceDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceDateLine",
      kind: "issue-place-date-line",
      derivedTargets: ["document.issuePlaceDateLine"],
      placeholder: "Thành phố Hồ Chí Minh",
    },
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 126, 147, 153 Bộ luật Tố tụng hình sự năm 2015.",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 126, 147, 153 Bộ luật Tố tụng hình sự năm 2015.",
    },
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính (nếu có)",
    placeholder: "—",
    smart: {
      key: "legalBasis.juvenileJusticeLine",
      kind: "textarea",
      rows: 2,
      placeholder: "—",
    },
  },
  "caseDecision.legalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder:
      "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về khởi tố vụ án hình sự số 08/2026/HSST.",
    smart: {
      key: "caseDecision.legalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về khởi tố vụ án hình sự số 08/2026/HSST.",
    },
  },
  "accusedDecision.sufficientGroundsLine": {
    label: "Căn cứ đủ điều kiện đề nghị truy tố",
    placeholder:
      "Có đủ căn cứ xác định Lê Minh Quang đã thực hiện hành vi lừa đảo chiếm đoạt tài sản với giá trị đặc biệt lớn theo Điều 174 BLHS 2015; hành vi phạm tội được làm rõ qua tài liệu điều tra, lời khai nhân chứng, kết quả giám định.",
    smart: {
      key: "accusedDecision.sufficientGroundsLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Có đủ căn cứ xác định Lê Minh Quang đã thực hiện hành vi lừa đảo chiếm đoạt tài sản với giá trị đặc biệt lớn theo Điều 174 BLHS 2015; hành vi phạm tội được làm rõ qua tài liệu điều tra, lời khai nhân chứng, kết quả giám định.",
    },
  },
  "person.fullName": {
    label: "Họ và tên bị can",
    placeholder: "Lê Minh Quang",
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
  "person.birthInfoLine": {
    label: "Sinh ngày",
    placeholder: "1988-05-15",
    helpText: "Định dạng ISO: YYYY-MM-DD",
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
    placeholder: "Kinh doanh",
  },
  "person.identityDocumentLine": {
    label: "Số CMND/CCCD",
    placeholder: "079188001234",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder:
      "123 Đường Nguyễn Trãi, Quận 1, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.permanentAddress",
      kind: "textarea",
      rows: 2,
      placeholder:
        "123 Đường Nguyễn Trãi, Quận 1, Thành phố Hồ Chí Minh",
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
      "456 Đường Lê Lợi, Quận 3, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
      placeholder:
        "456 Đường Lê Lợi, Quận 3, Thành phố Hồ Chí Minh",
    },
  },
  "person.criminalRecordLine": {
    label: "Tiền án, tiền sự",
    placeholder: "Không có",
  },
  "offense.actDescriptionLine": {
    label: "Mô tả hành vi phạm tội",
    placeholder:
      "Khoảng tháng 02/2026, Lê Minh Quang lợi dụng mối quan hệ quen biết để vay tiền của nhiều bị hại với tổng số tiền hơn 02 tỷ đồng, sau đó chiếm đoạt bằng cách tẩu tán tài sản, cắt đứt liên lạc.",
    smart: {
      key: "offense.actDescriptionLine",
      kind: "textarea",
      rows: 4,
      placeholder:
        "Khoảng tháng 02/2026, Lê Minh Quang lợi dụng mối quan hệ quen biết để vay tiền của nhiều bị hại với tổng số tiền hơn 02 tỷ đồng, sau đó chiếm đoạt bằng cách tẩu tán tài sản, cắt đứt liên lạc.",
    },
  },
  "accusedDecision.article1Line": {
    label: "Điều 1 - Quyết định khởi tố bị can",
    placeholder:
      "Khởi tố bị can đối với Lê Minh Quang về tội lừa đảo chiếm đoạt tài sản theo Điều 174 Bộ luật Hình sự năm 2015.",
    smart: {
      key: "accusedDecision.article1Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Khởi tố bị can đối với Lê Minh Quang về tội lừa đảo chiếm đoạt tài sản theo Điều 174 Bộ luật Hình sự năm 2015.",
    },
  },
  "accusedDecision.article2Line": {
    label: "Điều 2 - Giao hồ sơ",
    placeholder:
      "Giao hồ sơ vụ án cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tiếp tục điều tra theo thẩm quyền.",
    smart: {
      key: "accusedDecision.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Giao hồ sơ vụ án cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tiếp tục điều tra theo thẩm quyền.",
    },
  },
  "recipients.personLine": {
    label: "Nơi nhận - Bị can",
    placeholder: "Lê Minh Quang (tại nơi tạm giam)",
  },
  "recipients.investigationUnitLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "recipients.noteLine": {
    label: "Ghi chú",
    placeholder: "Gửi kèm hồ sơ vụ án đã hoàn tất điều tra.",
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
    placeholder: "Phạm Thị Lan Hương",
  },
} as const;

const BM097_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.fullDocumentCode": "74/QĐ-VKSKV7",
  "document.issuePlaceDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 126, 147, 153 Bộ luật Tố tụng hình sự năm 2015.",
  "legalBasis.juvenileJusticeLine": "—",
  "caseDecision.legalBasisLine":
    "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về khởi tố vụ án hình sự số 08/2026/HSST.",
  "accusedDecision.sufficientGroundsLine":
    "Có đủ căn cứ xác định Lê Minh Quang đã thực hiện hành vi lừa đảo chiếm đoạt tài sản với giá trị đặc biệt lớn theo Điều 174 BLHS 2015; hành vi phạm tội được làm rõ qua tài liệu điều tra, lời khai nhân chứng, kết quả giám định.",
  "person.fullName": "Lê Minh Quang",
  "person.genderLabel": "Nam",
  "person.otherName": "—",
  "person.birthInfoLine": "1988-05-15",
  "person.nationality": "Việt Nam",
  "person.ethnicity": "Kinh",
  "person.religion": "Không",
  "person.occupation": "Kinh doanh",
  "person.identityDocumentLine": "079188001234",
  "person.permanentAddress":
    "123 Đường Nguyễn Trãi, Quận 1, Thành phố Hồ Chí Minh",
  "person.temporaryAddress": "—",
  "person.currentAddress":
    "456 Đường Lê Lợi, Quận 3, Thành phố Hồ Chí Minh",
  "person.criminalRecordLine": "Không có",
  "offense.actDescriptionLine":
    "Khoảng tháng 02/2026, Lê Minh Quang lợi dụng mối quan hệ quen biết để vay tiền của nhiều bị hại với tổng số tiền hơn 02 tỷ đồng, sau đó chiếm đoạt bằng cách tẩu tán tài sản, cắt đứt liên lạc.",
  "accusedDecision.article1Line":
    "Khởi tố bị can đối với Lê Minh Quang về tội lừa đảo chiếm đoạt tài sản theo Điều 174 Bộ luật Hình sự năm 2015.",
  "accusedDecision.article2Line":
    "Giao hồ sơ vụ án cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tiếp tục điều tra theo thẩm quyền.",
  "recipients.personLine": "Lê Minh Quang (tại nơi tạm giam)",
  "recipients.investigationUnitLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "recipients.noteLine": "Gửi kèm hồ sơ vụ án đã hoàn tất điều tra.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Hương",
} as const;

const BM097_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-097",
  versionLabel:
    "BM-097 curated batch 4 — QĐ khởi tố bị can",
  sections: BM097_SECTIONS,
  fields: BM097_FIELDS,
  demo: BM097_DEMO,
};

registerRuntimeUxProfile(BM097_RUNTIME_UX_PROFILE);
