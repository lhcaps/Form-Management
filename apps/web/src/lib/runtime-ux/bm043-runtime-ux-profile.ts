/**
 * Curated runtime-ux profile for BM-043 — UI-only override metadata for the
 * standalone `/templates/BM-043` template page.
 *
 * Title: QĐ huỷ bỏ biện pháp tạm giam
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM043_SECTIONS = [
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
      "Bộ luật Tố tụng hình sự, Luật xử lý vi phạm hành chính, lệnh tạm giam, quyết định gia hạn trước.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Lý do huỷ bỏ gia hạn, Điều 1 — nội dung quyết định, Điều 2 — gia hạn lại, Điều 3 — yêu cầu.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Đơn vị thi hành, bị can và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM043_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN TỈNH BÌNH DƯƠNG",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THỊ XÃ THUẬN AN",
  },
  "document.documentCodeLine": {
    label: "Số quyết định",
    placeholder: "63/QĐ-VKSHBTG",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Bình Dương, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Tỉnh Bình Dương",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thị xã Thuận An;",
  },
  "legalBasis.baseProcedureLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 109, Điều 115 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.baseProcedureLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 109, Điều 115 BLTTHS năm 2015;",
    },
  },
  "legalBasis.juvenileLegalBasisLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính",
    placeholder: "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.juvenileLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Điều 18 Luật XLVPHC năm 2012;",
    },
  },
  "measure.detentionOrderLegalBasisLine": {
    label: "Căn cứ Lệnh tạm giam",
    placeholder:
      "Căn cứ Lệnh tạm giam số 18/TTG-PC06 ngày 01/2/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "measure.detentionOrderLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Lệnh tạm giam số …/TTG-PC06 ngày …;",
    },
  },
  "measure.previousExtensionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định gia hạn trước",
    placeholder:
      "Căn cứ Quyết định gia hạn tạm giam số 39/QĐ-VKSTG ngày 01/5/2026;",
    control: "TEXTAREA",
    smart: {
      key: "measure.previousExtensionDecisionLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ gia hạn số …/QĐ-VKSTG ngày …;",
    },
  },
  "measure.cancelReasonLine": {
    label: "Lý do huỷ bỏ gia hạn tạm giam",
    placeholder:
      "Xét thấy: đến thời điểm gia hạn, hành vi phạm tội của bị can không còn đặc biệt nghiêm trọng; bị can có nhân thân tốt, có nơi cư trú rõ ràng;",
    control: "TEXTAREA",
    smart: {
      key: "measure.cancelReasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Bị can không còn nguy hiểm; có nhân thân tốt;",
    },
  },
  "measure.article1Line": {
    label: "Điều 1 — Nội dung quyết định",
    placeholder:
      "Huỷ bỏ việc gia hạn tạm giam đối với bị can Nguyễn Thị Hồng Hạnh — sinh năm 1990, hiện tạm giam tại Nhà tạm giữ Công an Bình Dương;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Huỷ bỏ việc gia hạn tạm giam đối với bị can …;",
    },
  },
  "measure.article2Line": {
    label: "Điều 2 — Gia hạn lại",
    placeholder:
      "Bị can sẽ được đưa ra khỏi cơ sở giam giữ theo quyết định của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article2Line",
      kind: "textarea",
      rows: 2,
      placeholder: "Bị can được đưa ra khỏi cơ sở giam giữ;",
    },
  },
  "measure.article3Line": {
    label: "Điều 3 — Yêu cầu",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra tổ chức thi hành quyết định huỷ bỏ biện pháp tạm giam theo quy định;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article3Line",
      kind: "textarea",
      rows: 2,
      placeholder: "Yêu cầu CQCSĐT tổ chức thi hành;",
    },
  },
  "recipients.detentionExecutionUnitLine": {
    label: "Nơi nhận — Đơn vị thi hành",
    placeholder: "Nhà tạm giữ Công an Bình Dương;",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Bị can",
    placeholder: "Bị can Nguyễn Thị Hồng Hạnh;",
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
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Thị xã Thuận An",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Phạm Thanh Sơn",
  },
} as const;

const BM043_DEMO_RUNTIME_UX = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN TỈNH BÌNH DƯƠNG",
  "agency.name":
    "VIỆN KIỂM SÁT NHÂN DÂN THỊ XÃ THUẬN AN",
  "document.documentCodeLine": "63/QĐ-VKSHBTG",
  "document.issuePlaceAndDateLine":
    "Bình Dương, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle": "Viện Kiểm sát nhân dân Thị xã Thuận An;",
  "legalBasis.baseProcedureLine":
    "Căn cứ Điều 109, Điều 115 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileLegalBasisLine":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "measure.detentionOrderLegalBasisLine":
    "Căn cứ Lệnh tạm giam số 18/TTG-PC06 ngày 01/2/2026 của Cơ quan Cảnh sát điều tra;",
  "measure.previousExtensionDecisionLegalBasisLine":
    "Căn cứ Quyết định gia hạn tạm giam số 39/QĐ-VKSTG ngày 01/5/2026;",
  "measure.cancelReasonLine":
    "Xét thấy: đến thời điểm gia hạn, hành vi phạm tội của bị can không còn đặc biệt nghiêm trọng; bị can có nhân thân tốt, có nơi cư trú rõ ràng;",
  "measure.article1Line":
    "Huỷ bỏ việc gia hạn tạm giam đối với bị can Trần Thị Hồng Hạnh — sinh năm 1990, hiện tạm giam tại Nhà tạm giữ Công an Bình Dương;",
  "measure.article2Line":
    "Bị can sẽ được đưa ra khỏi cơ sở giam giữ theo quyết định của Cơ quan Cảnh sát điều tra;",
  "measure.article3Line":
    "Yêu cầu Cơ quan Cảnh sát điều tra tổ chức thi hành quyết định huỷ bỏ biện pháp tạm giam theo quy định;",
  "recipients.detentionExecutionUnitLine":
    "Nhà tạm giữ Công an Bình Dương;",
  "recipients.personLine": "Bị can Trần Thị Hồng Hạnh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Thị xã Thuận An",
  "signature.signerName": "Phạm Thanh Sơn",
} as const;

const BM043_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-043",
  versionLabel:
    "BM-043 curated batch (issue-place-date-line + textarea smarts)",
  sections: BM043_SECTIONS,
  fields: BM043_FIELDS,
  demo: BM043_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM043_RUNTIME_UX_PROFILE);
