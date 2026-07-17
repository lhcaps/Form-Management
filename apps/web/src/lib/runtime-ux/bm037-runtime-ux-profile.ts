/**
 * Curated runtime-ux profile for BM-037 — UI-only override metadata for the
 * standalone `/templates/BM-037` template page.
 *
 * Title: QĐ phê chuẩn Lệnh bắt bị can để tạm giam
 *
 * Why this file exists
 * --------------------
 * Replaces the auto-generated conservative labels of the form
 * "Cơ quan cấp trên (mẫu BM-037)" with curated Vietnamese legal-doc
 * labels, adds smart metadata for the issue place/date line and the
 * long legal-basis / decision-body fields, and ships a safe synthetic
 * demo with no real PII and no stale tokens.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation, no `generatedDocumentId` fabrication.
 *   - No modification of `FormFlight` allowlist — BM-037 stays out of
 *     `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Locked contract:
 *   `docs/audit/docx/contracts/locked/BM-037__*.contract.locked.json`
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-037.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM037_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, tên cơ quan viết đầy đủ.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Căn cứ Bộ luật Tố tụng hình sự, căn cứ Luật xử lý vi phạm hành chính, căn cứ quyết định vụ án và quyết định đối với bị can.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Lý do áp dụng, Điều 1 — nội dung phê chuẩn, thời hạn tạm giam, Điều 2 — giao hồ sơ.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan điều tra, bị can và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM037_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCodeLine": {
    label: "Số quyết định",
    placeholder: "56/QĐ-VKSKV7",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Hồ Chí Minh",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "agency.bodyName": {
    label: "Tên cơ quan viết đầy đủ",
    placeholder:
      "Viện Kiểm sát nhân dân Khu vực 7 — Thành phố Hồ Chí Minh",
  },
  "legalBasis.juvenileLegalBasisLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính",
    placeholder:
      "Căn cứ Điều 11, Điều 18 Luật Xử lý vi phạm hành chính năm 2012 (sửa đổi, bổ sung năm 2020);",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.juvenileLegalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 11, Điều 18 Luật XLVPHC năm 2012 (sửa đổi 2020);",
    },
  },
  "caseDecision.legalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 14/QĐ-PC04 ngày 01/3/2026;",
    control: "TEXTAREA",
    smart: {
      key: "caseDecision.legalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Quyết định khởi tố vụ án số …/QĐ-PC04 ngày …;",
    },
  },
  "accusedDecision.legalBasisLine": {
    label: "Căn cứ quyết định đối với bị can",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can số 15/QĐ-PC04 ngày 02/3/2026;",
    control: "TEXTAREA",
    smart: {
      key: "accusedDecision.legalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Quyết định khởi tố bị can số …/QĐ-PC04 ngày …;",
    },
  },
  "legalBasis.requestApprovalLine": {
    label: "Căn cứ đề nghị phê chuẩn",
    placeholder:
      "Căn cứ Đơn đề nghị phê chuẩn Lệnh bắt bị can để tạm giam số 28/TTr-PC04 ngày 03/3/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.requestApprovalLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Đơn đề nghị phê chuẩn số …/TTr-PC04 ngày …;",
    },
  },
  "measure.reasonLine": {
    label: "Lý do áp dụng biện pháp bắt, tạm giam",
    placeholder:
      "Xét thấy hành vi phạm tội của bị can có căn cứ và bị can có thể bỏ trốn, cản trở việc điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "measure.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Xét thấy có căn cứ và bị can có thể bỏ trốn;",
    },
  },
  "measure.article1Line": {
    label: "Điều 1 — Nội dung quyết định phê chuẩn",
    placeholder:
      "Phê chuẩn Lệnh bắt bị can để tạm giam số 17/LB-PC04 ngày 03/3/2026 của Cơ quan Cảnh sát điều tra đối với bị can Nguyễn Văn An;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Phê chuẩn Lệnh bắt bị can để tạm giam …;",
    },
  },
  "measure.detentionDurationLine": {
    label: "Thời hạn tạm giam",
    placeholder: "Thời hạn tạm giam: 03 tháng, kể từ ngày bắt.",
  },
  "measure.article2Line": {
    label: "Điều 2 — Giao hồ sơ thi hành",
    placeholder:
      "Giao Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh tổ chức thi hành Lệnh bắt bị can để tạm giam theo quy định pháp luật;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Giao Cơ quan Cảnh sát điều tra tổ chức thi hành Lệnh bắt …;",
    },
  },
  "recipients.investigationUnitLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Bị can",
    placeholder: "Bị can Nguyễn Văn An;",
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
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Lê Hoàng Nam",
  },
} as const;

const BM037_DEMO_RUNTIME_UX = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCodeLine": "56/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "agency.bodyName":
    "Viện Kiểm sát nhân dân Khu vực 7 — Thành phố Hồ Chí Minh",
  "legalBasis.juvenileLegalBasisLine":
    "Căn cứ Điều 11, Điều 18 Luật Xử lý vi phạm hành chính năm 2012 (sửa đổi, bổ sung năm 2020);",
  "caseDecision.legalBasisLine":
    "Căn cứ Quyết định khởi tố vụ án hình sự số 14/QĐ-PC04 ngày 01/3/2026;",
  "accusedDecision.legalBasisLine":
    "Căn cứ Quyết định khởi tố bị can số 15/QĐ-PC04 ngày 02/3/2026;",
  "legalBasis.requestApprovalLine":
    "Căn cứ Đơn đề nghị phê chuẩn Lệnh bắt bị can để tạm giam số 28/TTr-PC04 ngày 03/3/2026 của Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "measure.reasonLine":
    "Xét thấy hành vi phạm tội của bị can có căn cứ, bị can có dấu hiệu bỏ trốn, cản trở việc điều tra, cần thiết phải bắt, tạm giam để đảm bảo thuận lợi cho công tác điều tra;",
  "measure.article1Line":
    "Phê chuẩn Lệnh bắt bị can để tạm giam số 17/LB-PC04 ngày 03/3/2026 của Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh đối với bị can Phạm Văn An;",
  "measure.detentionDurationLine":
    "Thời hạn tạm giam: 03 tháng, kể từ ngày bắt.",
  "measure.article2Line":
    "Giao Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh tổ chức thi hành Lệnh bắt bị can để tạm giam theo quy định pháp luật;",
  "recipients.investigationUnitLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.personLine": "Bị can Phạm Văn An;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "signature.signerName": "Lê Hoàng Nam",
} as const;

const BM037_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-037",
  versionLabel:
    "BM-037 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM037_SECTIONS,
  fields: BM037_FIELDS,
  demo: BM037_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM037_RUNTIME_UX_PROFILE);