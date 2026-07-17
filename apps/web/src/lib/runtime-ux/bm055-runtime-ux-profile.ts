/**
 * Curated runtime-ux profile for BM-055.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-055)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM055_SECTIONS = [
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
      "Căn cứ lệnh/quyết định áp biện pháp ngăn chặn, quyết định đối với bị can, lý do hủy bỏ.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description: "Điều 1 — Nội dung hủy bỏ. Điều 2 — Thông báo.",
  },
  {
    sectionId: "section-thong-tin-nguoi-bi-can",
    title: "4. Thông tin người bị can",
    description:
      "Họ tên, giới tính, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, giấy tờ tùy thân, địa chỉ thường trú / tạm trú / hiện tại.",
  },
  {
    sectionId: "section-thong-tin-toi-pham",
    title: "5. Thông tin tội phạm",
    description: "Tên tội phạm, điều khoản Bộ luật Hình sự.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "6. Nơi nhận",
    description:
      "Cơ quan điều tra, đơn vị quản lý, người bị can, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "7. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
] as const;

const BM055_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    helpText: "Viện kiểm sát nhân dân cấp trên trực tiếp của VKS ban hành.",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "52/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định hủy bỏ biện pháp cấm đi khỏi nơi cư trú.",
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
  "measure.preventiveMeasureOrderLegalBasisLine": {
    label: "Căn cứ lệnh/quyết định áp biện pháp ngăn chặn",
    placeholder:
      "Quyết định số 11/QĐ-VKSKV7 ngày 01 tháng 3 năm 2026 về áp dụng biện pháp cấm đi khỏi nơi cư trú.",
    smart: {
      key: "measure.preventiveMeasureOrderLegalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 11/QĐ-VKSKV7 ngày 01 tháng 3 năm 2026 về áp dụng biện pháp cấm đi khỏi nơi cư trú.",
    },
  },
  "accusedDecision.legalBasisLine": {
    label: "Căn cứ quyết định đối với bị can",
    placeholder:
      "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về quyết định khởi tố bị can.",
    smart: {
      key: "accusedDecision.legalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về quyết định khởi tố bị can.",
    },
  },
  "measure.cancelReasonLine": {
    label: "Lý do hủy bỏ biện pháp ngăn chặn",
    placeholder:
      "Căn cứ kết quả điều tra, không còn đủ căn cứ tiếp tục áp dụng biện pháp cấm đi khỏi nơi cư trú đối với người bị can.",
    smart: {
      key: "measure.cancelReasonLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ kết quả điều tra, không còn đủ căn cứ tiếp tục áp dụng biện pháp cấm đi khỏi nơi cư trú.",
    },
  },
  "measure.cancellationArticle1Line": {
    label: "Điều 1 — Nội dung hủy bỏ",
    placeholder:
      "Hủy bỏ Quyết định số 11/QĐ-VKSKV7 ngày 01 tháng 3 năm 2026 về áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can.",
    smart: {
      key: "measure.cancellationArticle1Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Hủy bỏ Quyết định số 11/QĐ-VKSKV7 ngày 01 tháng 3 năm 2026 về áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can.",
    },
  },
  "person.fullName": {
    label: "Họ và tên người bị can",
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
  "person.dateOfBirthText": {
    label: "Sinh ngày",
    placeholder: "1988-05-15",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Thành phố Hồ Chí Minh",
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
    helpText: "Nhập số CCCD hoặc CMND còn hiệu lực.",
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
  "offense.offenseName": {
    label: "Tên tội phạm",
    placeholder: "Tội lừa đảo chiếm đoạt tài sản",
  },
  "offense.legalArticle": {
    label: "Điều khoản Bộ luật Hình sự",
    placeholder: "Điều 174 Bộ luật Hình sự năm 2015",
  },
  "offense.criminalCodeText": {
    label: "Mã Bộ luật Hình sự",
    placeholder: "BLHS.2015.174",
  },
  "measure.cancellationArticle2Line": {
    label: "Điều 2 — Thông báo",
    placeholder:
      "Quyết định này được gửi cho: Cơ quan điều tra, người bị can, VKS cấp trên và lưu hồ sơ.",
    smart: {
      key: "measure.cancellationArticle2Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định này được gửi cho: Cơ quan điều tra, người bị can, VKS cấp trên và lưu hồ sơ.",
    },
  },
  "recipients.investigationUnitLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Công an Quận 1, Thành phố Hồ Chí Minh",
  },
  "recipients.monitoringUnitLine": {
    label: "Nơi nhận — Đơn vị quản lý",
    placeholder: "Công an Thành phố Hồ Chí Minh",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Người bị can",
    placeholder: "Lê Minh Quang (tại nơi tạm giữ)",
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
    placeholder: "Phạm Thị Lan Hương",
  },
} as const;

const BM055_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "52/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "measure.preventiveMeasureOrderLegalBasisLine":
    "Quyết định số 11/QĐ-VKSKV7 ngày 01 tháng 3 năm 2026 về áp dụng biện pháp cấm đi khỏi nơi cư trú.",
  "accusedDecision.legalBasisLine":
    "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về quyết định khởi tố bị can.",
  "measure.cancelReasonLine":
    "Căn cứ kết quả điều tra xác định không còn đủ căn cứ tiếp tục áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can Lê Minh Quang.",
  "measure.cancellationArticle1Line":
    "Hủy bỏ Quyết định số 11/QĐ-VKSKV7 ngày 01 tháng 3 năm 2026 về áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can Lê Minh Quang.",
  "person.fullName": "Lê Minh Quang",
  "person.genderLabel": "Nam",
  "person.otherName": "—",
  "person.dateOfBirthText": "1988-05-15",
  "person.placeOfBirth": "Thành phố Hồ Chí Minh",
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
  "offense.offenseName": "Tội lừa đảo chiếm đoạt tài sản",
  "offense.legalArticle": "Điều 174 Bộ luật Hình sự năm 2015",
  "offense.criminalCodeText": "BLHS.2015.174",
  "measure.cancellationArticle2Line":
    "Quyết định này được gửi cho: Cơ quan điều tra, người bị can, VKS cấp trên và lưu hồ sơ.",
  "recipients.investigationUnitLine":
    "Công an Quận 1, Thành phố Hồ Chí Minh",
  "recipients.monitoringUnitLine":
    "Công an Thành phố Hồ Chí Minh",
  "recipients.personLine": "Lê Minh Quang (tại nơi tạm giữ)",
  "recipients.archiveLine": "HSVA, HSKS, VP.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Hương",
} as const;

const BM055_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-055",
  versionLabel:
    "BM-055 curated batch 3 — smart issue-place-date-line, textarea smarts, no stale tokens",
  sections: BM055_SECTIONS,
  fields: BM055_FIELDS,
  demo: BM055_DEMO,
};

registerRuntimeUxProfile(BM055_RUNTIME_UX_PROFILE);
