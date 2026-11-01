/**
 * Curated runtime-ux profile for BM-053 — UI-only override metadata for the
 * standalone `/templates/BM-053` template page.
 *
 * Title: Lệnh cấm đi khỏi nơi cư trú
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM053_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Các dòng căn cứ pháp lý 1..5 để tạo Lệnh cấm đi khỏi nơi cư trú.",
  },
  {
    sectionId: "section-thong-tin-nguoi-bi-can",
    title: "3. Thông tin người bị can",
    description:
      "Họ và tên, giới tính, tên gọi khác, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, CMND/CCCD, nơi thường trú, tạm trú, hiện tại.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "4. Nội dung quyết định",
    description: "Điều 2 — nội dung quyết định cấm đi khỏi nơi cư trú.",
  },
  {
    sectionId: "section-on-vi-quan-ly",
    title: "5. Đơn vị quản lý",
    description: "Tên đơn vị quản lý; Điều 3 — yêu cầu đơn vị quản lý.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "6. Nơi nhận",
    description: "Đơn vị quản lý, người bị can, lưu hồ sơ và ghi chú.",
  },
  {
    sectionId: "section-chu-ky",
    title: "7. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
  {
    sectionId: "section-giao-nhan",
    title: "8. Giao nhận",
    description: "Thời điểm giao và chức vụ người nhận.",
  },
] as const;

const BM053_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ CẦN THƠ",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN QUẬN CÁI RĂNG",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "70/L-VKSNKCT",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Cần Thơ, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Cần Thơ",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "legalBasis.line1": {
    label: "Căn cứ pháp lý 1",
    placeholder:
      "Căn cứ Điều 109, Điều 119 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.line1",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Điều 109, Điều 119 BLTTHS năm 2015;",
    },
  },
  "legalBasis.line2": {
    label: "Căn cứ pháp lý 2",
    placeholder: "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.line2",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Điều 18 Luật XLVPHC năm 2012;",
    },
  },
  "legalBasis.line3": {
    label: "Căn cứ pháp lý 3",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 88/QĐ-PC10 ngày 12/2/2026;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.line3",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố vụ án số …/QĐ-PC10 ngày …;",
    },
  },
  "legalBasis.line4": {
    label: "Căn cứ pháp lý 4",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can số 89/QĐ-PC10 ngày 14/2/2026;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.line4",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố bị can số …/QĐ-PC10 ngày …;",
    },
  },
  "legalBasis.line5": {
    label: "Căn cứ pháp lý 5",
    placeholder:
      "Căn cứ Đơn đề nghị áp dụng biện pháp ngăn chặn số 99/TTr-PC10 ngày 30/3/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.line5",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Đơn đề nghị số …/TTr-PC10 ngày …;",
    },
  },
  "person.fullName": {
    label: "Họ và tên",
    placeholder: "Trương Văn Cường",
  },
  "person.genderLabel": {
    label: "Giới tính",
    placeholder: "Nam",
    smart: {
      key: "person.genderLabel",
      kind: "select",
      options: ["Nam", "Nữ", "Khác"],
    },
  },
  "person.otherName": {
    label: "Tên gọi khác",
    placeholder: "Không có",
  },
  "person.dateOfBirthText": {
    label: "Sinh ngày",
    placeholder: "20/3/1989",
  },
  "person.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Huyện Phong Điền, TP. Cần Thơ",
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
    placeholder: "Lái xe vận tải",
  },
  "person.identityDocumentLine": {
    label: "Số CMND/CCCD",
    placeholder: "092203000333 cấp ngày 15/7/2021 tại Công an TP. Cần Thơ",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder:
      "Xã Mỹ Khánh, Huyện Phong Điền, TP. Cần Thơ",
    control: "TEXTAREA",
    smart: {
      key: "person.permanentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "Xã …, Huyện …, Tỉnh …;",
    },
  },
  "person.temporaryAddress": {
    label: "Nơi tạm trú",
    placeholder:
      "Số 8 đường Nguyễn Văn Cừ, Phường An Bình, Quận Ninh Kiều, TP. Cần Thơ",
    control: "TEXTAREA",
    smart: {
      key: "person.temporaryAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "Số … đường …, Quận …, TP. …;",
    },
  },
  "person.currentAddress": {
    label: "Nơi ở hiện tại",
    placeholder:
      "Số 8 đường Nguyễn Văn Cừ, Phường An Bình, Quận Ninh Kiều, TP. Cần Thơ",
    control: "TEXTAREA",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "Số … đường …, Quận …, TP. …;",
    },
  },
  "measure.article2Line": {
    label: "Điều 2 — Nội dung quyết định",
    placeholder:
      "Cấm bị can Trương Văn Cường đi khỏi nơi cư trú là xã Mỹ Khánh, Huyện Phong Điền, TP. Cần Thơ; thời hạn cấm: 04 tháng kể từ ngày ban hành Lệnh;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article2Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Cấm bị can … đi khỏi nơi cư trú …;",
    },
  },
  "monitoring.unitName": {
    label: "Tên đơn vị quản lý",
    placeholder:
      "UBND xã Mỹ Khánh — Huyện Phong Điền — TP. Cần Thơ",
  },
  "monitoring.article3Line": {
    label: "Điều 3 — Yêu cầu đơn vị quản lý",
    placeholder:
      "Yêu cầu UBND xã Mỹ Khánh quản lý, giám sát chặt chẽ việc chấp hành của bị can; báo cáo ngay cho Cơ quan Cảnh sát điều tra khi bị can vi phạm;",
    control: "TEXTAREA",
    smart: {
      key: "monitoring.article3Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Yêu cầu UBND xã … giám sát; báo cáo khi vi phạm;",
    },
  },
  "recipients.monitoringUnitLine": {
    label: "Nơi nhận — Đơn vị quản lý",
    placeholder:
      "UBND xã Mỹ Khánh — Huyện Phong Điền — TP. Cần Thơ;",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Người bị can",
    placeholder: "Bị can Trương Văn Cường;",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "recipients.noteLine": {
    label: "Ghi chú",
    placeholder: "Gửi bản sao cho Cơ quan Cảnh sát điều tra;",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký tập thể",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Quận Cái Răng",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Ngô Ngọc Tuấn",
  },
  "delivery.deliveredAtText": {
    label: "Thời điểm giao",
    placeholder: "Giao lúc 09 giờ 30 phút, ngày 05/7/2026",
  },
  "delivery.receiverTitle": {
    label: "Chức vụ người nhận",
    placeholder: "Chủ tịch UBND xã Mỹ Khánh",
  },
} as const;

const BM053_DEMO_RUNTIME_UX = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ CẦN THƠ",
  "agency.name":
    "VIỆN KIỂM SÁT NHÂN DÂN QUẬN CÁI RĂNG",
  "document.documentCode": "70/L-VKSNKCT",
  "document.issuePlaceAndDateLine":
    "Cần Thơ, ngày 04 tháng 7 năm 2026",
  "legalBasis.line1":
    "Căn cứ Điều 109, Điều 119 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.line2":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "legalBasis.line3":
    "Căn cứ Quyết định khởi tố vụ án hình sự số 88/QĐ-PC10 ngày 12/2/2026;",
  "legalBasis.line4":
    "Căn cứ Quyết định khởi tố bị can số 89/QĐ-PC10 ngày 14/2/2026;",
  "legalBasis.line5":
    "Căn cứ Đơn đề nghị áp dụng biện pháp ngăn chặn số 99/TTr-PC10 ngày 30/3/2026 của Cơ quan Cảnh sát điều tra;",
  "person.fullName": "Trương Văn Cường",
  "person.genderLabel": "Nam",
  "person.otherName": "Không có",
  "person.dateOfBirthText": "20/3/1989",
  "person.placeOfBirth": "Huyện Phong Điền, TP. Cần Thơ",
  "person.nationality": "Việt Nam",
  "person.ethnicity": "Kinh",
  "person.religion": "Không",
  "person.occupation": "Lái xe vận tải",
  "person.identityDocumentLine":
    "092203000333 cấp ngày 15/7/2021 tại Công an TP. Cần Thơ",
  "person.permanentAddress":
    "Xã Mỹ Khánh, Huyện Phong Điền, TP. Cần Thơ",
  "person.temporaryAddress":
    "Số 8 đường Nguyễn Văn Cừ, Phường An Bình, Quận Ninh Kiều, TP. Cần Thơ",
  "person.currentAddress":
    "Số 8 đường Nguyễn Văn Cừ, Phường An Bình, Quận Ninh Kiều, TP. Cần Thơ",
  "measure.article2Line":
    "Cấm bị can Trương Văn Cường đi khỏi nơi cư trú là xã Mỹ Khánh, Huyện Phong Điền, TP. Cần Thơ; thời hạn cấm: 04 tháng kể từ ngày ban hành Lệnh;",
  "monitoring.unitName":
    "UBND xã Mỹ Khánh — Huyện Phong Điền — TP. Cần Thơ",
  "monitoring.article3Line":
    "Yêu cầu UBND xã Mỹ Khánh quản lý, giám sát chặt chẽ việc chấp hành của bị can; báo cáo ngay cho Cơ quan Cảnh sát điều tra khi bị can vi phạm;",
  "recipients.monitoringUnitLine":
    "UBND xã Mỹ Khánh — Huyện Phong Điền — TP. Cần Thơ;",
  "recipients.personLine": "Bị can Trương Văn Cường;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "recipients.noteLine": "Gửi bản sao cho Cơ quan Cảnh sát điều tra;",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Quận Cái Răng",
  "signature.signerName": "Ngô Ngọc Tuấn",
  "delivery.deliveredAtText":
    "Giao lúc 09 giờ 30 phút, ngày 05/7/2026",
  "delivery.receiverTitle": "Chủ tịch UBND xã Mỹ Khánh",
} as const;

const BM053_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-053",
  versionLabel:
    "BM-053 curated batch (issue-place-date-line + textarea + select + delivery)",
  sections: BM053_SECTIONS,
  fields: BM053_FIELDS,
  demo: BM053_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM053_RUNTIME_UX_PROFILE);
