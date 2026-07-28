/**
 * Curated runtime-ux profile for BM-054 — UI-only override metadata for the
 * standalone `/templates/BM-054` template page.
 *
 * Title: Thông báo về việc áp dụng biện pháp cấm đi khỏi nơi cư trú
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM054_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-co-quan-thuc-hien",
    title: "2. Cơ quan thực hiện",
    description:
      "Đơn vị quản lý và tên đầy đủ của cơ quan quản lý.",
  },
  {
    sectionId: "section-thong-tin-nguoi-bi-can",
    title: "3. Thông tin người bị can",
    description:
      "Họ và tên, giới tính, tên gọi khác, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, CMND/CCCD, nơi thường trú, tạm trú, hiện tại.",
  },
  {
    sectionId: "section-thong-tin-toi-pham",
    title: "4. Thông tin tội phạm",
    description:
      "Tên tội phạm, điều khoản Bộ luật Hình sự, mã Bộ luật Hình sự, quyết định áp dụng biện pháp ngăn chặn.",
  },
  {
    sectionId: "section-thong-bao",
    title: "5. Thông báo",
    description: "Điều 3 — nội dung thông báo cho đơn vị quản lý.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "6. Nơi nhận",
    description: "Người bị can và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "7. Chữ ký",
    description: "Chức vụ và họ tên người ký.",
  },
] as const;

const BM054_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN TỈNH NGHỆ AN",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THỊ XÃ THÁI HOÀ",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "71/TB-VKSNKCT",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Nghệ An, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Tỉnh Nghệ An",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "monitoring.unitName": {
    label: "Tên đơn vị quản lý",
    placeholder:
      "UBND Thị xã Thái Hoà — Tỉnh Nghệ An",
  },
  "agency.nameBody": {
    label: "Cơ quan quản lý tên đầy đủ",
    placeholder:
      "Ban Phòng chống tệ nạn xã hội — UBND Thị xã Thái Hoà — Tỉnh Nghệ An",
  },
  "person.fullName": {
    label: "Họ và tên",
    placeholder: "Lê Thị Thanh Thủy",
  },
  "person.genderLabel": {
    label: "Giới tính",
    placeholder: "Nữ",
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
    placeholder: "05/11/1993",
  },
  "person.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Huyện Quỳ Hợp, Tỉnh Nghệ An",
  },
  "person.nationality": {
    label: "Quốc tịch",
    placeholder: "Việt Nam",
  },
  "person.ethnicity": {
    label: "Dân tộc",
    placeholder: "Thái",
  },
  "person.religion": {
    label: "Tôn giáo",
    placeholder: "Không",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Giáo viên",
  },
  "person.identityDocumentLine": {
    label: "Số CMND/CCCD",
    placeholder:
      "048193001222 cấp ngày 18/9/2019 tại Công an Tỉnh Nghệ An",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder:
      "Phường Quán Bàu, Thị xã Thái Hoà, Tỉnh Nghệ An",
    control: "TEXTAREA",
    smart: {
      key: "person.permanentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "Phường …, Thị xã …, Tỉnh …;",
    },
  },
  "person.temporaryAddress": {
    label: "Nơi tạm trú",
    placeholder:
      "Số 22 đường Lê Lợi, Phường Quán Bàu, Thị xã Thái Hoà, Tỉnh Nghệ An",
    control: "TEXTAREA",
    smart: {
      key: "person.temporaryAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "Số … đường …, Thị xã …, Tỉnh …;",
    },
  },
  "person.currentAddress": {
    label: "Nơi ở hiện tại",
    placeholder:
      "Số 22 đường Lê Lợi, Phường Quán Bàu, Thị xã Thái Hoà, Tỉnh Nghệ An",
    control: "TEXTAREA",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
      placeholder: "Số … đường …, Thị xã …, Tỉnh …;",
    },
  },
  "offense.offenseName": {
    label: "Tên tội phạm",
    placeholder: "Lừa đảo chiếm đoạt tài sản",
  },
  "offense.legalArticle": {
    label: "Điều khoản Bộ luật Hình sự",
    placeholder: "Điều 174 Bộ luật Hình sự năm 2015",
  },
  "offense.criminalCodeText": {
    label: "Mã Bộ luật Hình sự",
    placeholder: "BLHS 2015, Điều 174",
  },
  "notification.preventiveMeasureOrderLine": {
    label: "Quyết định áp dụng biện pháp ngăn chặn",
    placeholder:
      "Lệnh cấm đi khỏi nơi cư trú số 70/L-VKSNKCT ngày 04/7/2026 của Viện Kiểm sát nhân dân Thị xã Thái Hoà;",
  },
  "monitoring.article3Line": {
    label: "Điều 3 — Nội dung thông báo",
    placeholder:
      "Viện Kiểm sát nhân dân Thị xã Thái Hoà thông báo cho UBND Thị xã Thái Hoà về việc áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can Lê Thị Thanh Thủy; đề nghị đơn vị quản lý giám sát chặt chẽ việc chấp hành; báo cáo ngay khi có vi phạm;",
    control: "TEXTAREA",
    smart: {
      key: "monitoring.article3Line",
      kind: "textarea",
      rows: 5,
      placeholder: "Thông báo việc áp dụng BPNS cấm đi khỏi nơi cư trú;",
    },
  },
  "recipients.personLine": {
    label: "Nơi nhận — Người bị can",
    placeholder: "Bị can Lê Thị Thanh Thủy;",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Thị xã Thái Hoà",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Đinh Văn Hùng",
  },
} as const;

const BM054_DEMO_RUNTIME_UX = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN TỈNH NGHỆ AN",
  "agency.name":
    "VIỆN KIỂM SÁT NHÂN DÂN THỊ XÃ THÁI HOÀ",
  "document.documentCode": "71/TB-VKSNKCT",
  "document.issuePlaceAndDateLine":
    "Nghệ An, ngày 04 tháng 7 năm 2026",
  "monitoring.unitName":
    "UBND Thị xã Thái Hoà — Tỉnh Nghệ An",
  "agency.nameBody":
    "Ban Phòng chống tệ nạn xã hội — UBND Thị xã Thái Hoà — Tỉnh Nghệ An",
  "person.fullName": "Lê Thị Thanh Thủy",
  "person.genderLabel": "Nữ",
  "person.otherName": "Không có",
  "person.dateOfBirthText": "05/11/1993",
  "person.placeOfBirth": "Huyện Quỳ Hợp, Tỉnh Nghệ An",
  "person.nationality": "Việt Nam",
  "person.ethnicity": "Thái",
  "person.religion": "Không",
  "person.occupation": "Giáo viên",
  "person.identityDocumentLine":
    "048193001222 cấp ngày 18/9/2019 tại Công an Tỉnh Nghệ An",
  "person.permanentAddress":
    "Phường Quán Bàu, Thị xã Thái Hoà, Tỉnh Nghệ An",
  "person.temporaryAddress":
    "Số 22 đường Lê Lợi, Phường Quán Bàu, Thị xã Thái Hoà, Tỉnh Nghệ An",
  "person.currentAddress":
    "Số 22 đường Lê Lợi, Phường Quán Bàu, Thị xã Thái Hoà, Tỉnh Nghệ An",
  "offense.offenseName": "Lừa đảo chiếm đoạt tài sản",
  "offense.legalArticle": "Điều 174 Bộ luật Hình sự năm 2015",
  "offense.criminalCodeText": "BLHS 2015, Điều 174",
  "notification.preventiveMeasureOrderLine":
    "Lệnh cấm đi khỏi nơi cư trú số 70/L-VKSNKCT ngày 04/7/2026 của Viện Kiểm sát nhân dân Thị xã Thái Hoà;",
  "monitoring.article3Line":
    "Viện Kiểm sát nhân dân Thị xã Thái Hoà thông báo cho UBND Thị xã Thái Hoà về việc áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can Lê Thị Thanh Thủy; đề nghị đơn vị quản lý giám sát chặt chẽ việc chấp hành; báo cáo ngay khi có vi phạm;",
  "recipients.personLine": "Bị can Lê Thị Thanh Thủy;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Thị xã Thái Hoà",
  "signature.signerName": "Đinh Văn Hùng",
} as const;

const BM054_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-054",
  versionLabel:
    "BM-054 curated batch (issue-place-date-line + textarea + select)",
  sections: BM054_SECTIONS,
  fields: BM054_FIELDS,
  demo: BM054_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM054_RUNTIME_UX_PROFILE);
