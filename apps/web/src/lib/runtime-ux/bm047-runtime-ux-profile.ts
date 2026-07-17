/**
 * Curated runtime-ux profile for BM-047 — UI-only override metadata for the
 * standalone `/templates/BM-047` template page.
 *
 * Title: QĐ về việc bảo lĩnh
 *
 * Note: This is the issuing procuracy-side decision authorising bail —
 * not the approval of an investigation-agency bail decision (which is
 * BM-045). It carries a full accused-person dossier sub-section.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM047_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Bộ luật Tố tụng hình sự, Luật xử lý vi phạm hành chính.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Vụ việc khởi tố, bị can/bị cáo, điều kiện bảo lĩnh đủ căn cứ, nhiệm vụ của bị can, thời hạn bảo lĩnh, giao nhiệm vụ giám sát.",
  },
  {
    sectionId: "section-thong-tin-nhan-than-bi-can",
    title: "4. Thông tin nhân thân bị can",
    description:
      "Họ tên, giới tính, tên gọi khác, ngày sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, CMND/CCCD, nơi thường trú / tạm trú / hiện tại.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "5. Nơi nhận",
    description: "Bị can, người bảo lãnh và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "6. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM047_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ CẦN THƠ",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN QUẬN NINH KIỀU",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "67/QĐ-VKSBL",
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
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện Kiểm sát nhân dân Quận Ninh Kiều;",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 109, Điều 121 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 109, Điều 121 BLTTHS năm 2015;",
    },
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính",
    placeholder: "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.juvenileJusticeLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Điều 18 Luật XLVPHC năm 2012;",
    },
  },
  "guaranteeApproval.caseInitiationLine": {
    label: "Nội dung Điều 1 — Vụ việc khởi tố",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 56/QĐ-PC10 ngày 18/4/2026 về tội danh …;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeApproval.caseInitiationLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố vụ án …;",
    },
  },
  "guaranteeApproval.defendantInitiationLine": {
    label: "Nội dung Điều 1 — Bị can / bị cáo",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can số 57/QĐ-PC10 ngày 19/4/2026 đối với bị can Đinh Văn Khôi;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeApproval.defendantInitiationLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố bị can …;",
    },
  },
  "guaranteeApproval.sufficientGroundsLine": {
    label: "Điều kiện bảo lĩnh đủ căn cứ",
    placeholder:
      "Có căn cứ xác định bị can có nhân thân tốt, có nơi cư trú rõ ràng; có người bảo lĩnh đủ điều kiện theo Điều 121 BLTTHS;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeApproval.sufficientGroundsLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Có nhân thân tốt; có người bảo lĩnh;",
    },
  },
  "guaranteeApproval.assignmentLine": {
    label: "Điều 1 — Nhiệm vụ của bị can được bảo lĩnh",
    placeholder:
      "Bị can Đinh Văn Khôi được tại ngoại và phải có mặt theo giấy triệu tập của Cơ quan điều tra, Viện Kiểm sát và Toà án; không được thay đổi nơi cư trú;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeApproval.assignmentLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Có mặt theo giấy triệu tập; không đổi nơi cư trú;",
    },
  },
  "defendant.fullName": {
    label: "Họ tên bị can",
    placeholder: "Đinh Văn Khôi",
  },
  "defendant.gender": {
    label: "Giới tính",
    placeholder: "Nam",
  },
  "defendant.aliasName": {
    label: "Tên gọi khác",
    placeholder: "Không có",
  },
  "defendant.birthDateLine": {
    label: "Ngày sinh",
    placeholder: "15/4/1991",
  },
  "defendant.birthPlace": {
    label: "Nơi sinh",
    placeholder: "Huyện Châu Thành, Tỉnh Hậu Giang",
  },
  "defendant.nationality": {
    label: "Quốc tịch",
    placeholder: "Việt Nam",
  },
  "defendant.ethnicity": {
    label: "Dân tộc",
    placeholder: "Kinh",
  },
  "defendant.religion": {
    label: "Tôn giáo",
    placeholder: "Không",
  },
  "defendant.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Lao động tự do",
  },
  "defendant.identityNumber": {
    label: "Số CMND/CCCD",
    placeholder: "094203001234",
  },
  "defendant.identityIssueDateLine": {
    label: "Ngày cấp CMND/CCCD",
    placeholder: "12/6/2021",
  },
  "defendant.identityIssuePlace": {
    label: "Nơi cấp CMND/CCCD",
    placeholder: "Công an Tỉnh Hậu Giang",
  },
  "defendant.permanentResidence": {
    label: "Nơi thường trú",
    placeholder:
      "Xã Đông Phú, Huyện Châu Thành, Tỉnh Hậu Giang",
  },
  "defendant.temporaryResidence": {
    label: "Nơi tạm trú",
    placeholder:
      "Số 17 đường Nguyễn Trãi, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ",
  },
  "defendant.currentResidence": {
    label: "Nơi ở hiện tại",
    placeholder:
      "Số 17 đường Nguyễn Trãi, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ",
  },
  "guaranteeApproval.guaranteePeriodLine": {
    label: "Thời hạn bảo lĩnh",
    placeholder: "Thời hạn bảo lĩnh đến hết ngày 04/9/2026.",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeApproval.guaranteePeriodLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Thời hạn bảo lĩnh đến hết ngày …;",
    },
  },
  "guaranteeApproval.article2Line": {
    label: "Điều 2 — Giao nhiệm vụ giám sát",
    placeholder:
      "Yêu cầu UBND xã Đông Phú, Tỉnh Hậu Giang giám sát việc chấp hành quyết định bảo lĩnh của bị can Đinh Văn Khôi;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeApproval.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Yêu cầu UBND xã … giám sát;",
    },
  },
  "recipients.defendantLine": {
    label: "Nơi nhận — Bị can",
    placeholder: "Bị can Đinh Văn Khôi;",
  },
  "recipients.guarantorLine": {
    label: "Nơi nhận — Người bảo lãnh",
    placeholder: "Bà Nguyễn Thị Bé Tư — mẹ đẻ bị can;",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký tập thể",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Quận Ninh Kiều",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Trần Kim Phượng",
  },
} as const;

const BM047_DEMO_RUNTIME_UX = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ CẦN THƠ",
  "agency.name":
    "VIỆN KIỂM SÁT NHÂN DÂN QUẬN NINH KIỀU",
  "document.documentCode": "67/QĐ-VKSBL",
  "document.issuePlaceAndDateLine":
    "Cần Thơ, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle": "Viện Kiểm sát nhân dân Quận Ninh Kiều;",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 109, Điều 121 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileJusticeLine":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "guaranteeApproval.caseInitiationLine":
    "Căn cứ Quyết định khởi tố vụ án hình sự số 56/QĐ-PC10 ngày 18/4/2026;",
  "guaranteeApproval.defendantInitiationLine":
    "Căn cứ Quyết định khởi tố bị can số 57/QĐ-PC10 ngày 19/4/2026 đối với bị can Đinh Văn Khôi;",
  "guaranteeApproval.sufficientGroundsLine":
    "Có căn cứ xác định bị can có nhân thân tốt, có nơi cư trú rõ ràng; có người bảo lĩnh đủ điều kiện theo Điều 121 BLTTHS;",
  "guaranteeApproval.assignmentLine":
    "Bị can Đinh Văn Khôi được tại ngoại và phải có mặt theo giấy triệu tập của Cơ quan điều tra, Viện Kiểm sát và Toà án; không được thay đổi nơi cư trú;",
  "defendant.fullName": "Đinh Văn Khôi",
  "defendant.gender": "Nam",
  "defendant.aliasName": "Không có",
  "defendant.birthDateLine": "15/4/1991",
  "defendant.birthPlace": "Huyện Châu Thành, Tỉnh Hậu Giang",
  "defendant.nationality": "Việt Nam",
  "defendant.ethnicity": "Kinh",
  "defendant.religion": "Không",
  "defendant.occupation": "Lao động tự do",
  "defendant.identityNumber": "094203001234",
  "defendant.identityIssueDateLine": "12/6/2021",
  "defendant.identityIssuePlace": "Công an Tỉnh Hậu Giang",
  "defendant.permanentResidence":
    "Xã Đông Phú, Huyện Châu Thành, Tỉnh Hậu Giang",
  "defendant.temporaryResidence":
    "Số 17 đường Nguyễn Trãi, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ",
  "defendant.currentResidence":
    "Số 17 đường Nguyễn Trãi, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ",
  "guaranteeApproval.guaranteePeriodLine":
    "Thời hạn bảo lĩnh đến hết ngày 04/9/2026.",
  "guaranteeApproval.article2Line":
    "Yêu cầu UBND xã Đông Phú, Tỉnh Hậu Giang giám sát việc chấp hành quyết định bảo lĩnh của bị can Đinh Văn Khôi;",
  "recipients.defendantLine": "Bị can Đinh Văn Khôi;",
  "recipients.guarantorLine": "Bà Nguyễn Thị Bé Tư — mẹ đẻ bị can;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Quận Ninh Kiều",
  "signature.signerName": "Trần Kim Phượng",
} as const;

const BM047_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-047",
  versionLabel:
    "BM-047 curated batch (issue-place-date-line + textarea + long dossier)",
  sections: BM047_SECTIONS,
  fields: BM047_FIELDS,
  demo: BM047_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM047_RUNTIME_UX_PROFILE);
