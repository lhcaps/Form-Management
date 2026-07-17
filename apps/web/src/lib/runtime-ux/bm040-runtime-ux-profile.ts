/**
 * Curated runtime-ux profile for BM-040 — UI-only override metadata for the
 * standalone `/templates/BM-040` template page.
 *
 * Title: QĐ phê chuẩn Lệnh tạm giam
 *
 * Why this file exists
 * --------------------
 * Curates 5-section legal-decision layout for the approval of a
 * pre-trial detention order. Removes "(mẫu BM-040)" stale tokens,
 * adds `issue-place-date-line` smart for the issue-date line and
 * `textarea` smarts for the long legal-basis / decision-body fields.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation, no `generatedDocumentId` fabrication.
 *   - No modification of `FormFlight` allowlist — BM-040 stays out of
 *     `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Locked contract:
 *   `docs/audit/docx/contracts/locked/BM-040__*.contract.locked.json`
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-040.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM040_SECTIONS = [
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
      "Bộ luật Tố tụng hình sự, Luật xử lý vi phạm hành chính, căn cứ quyết định vụ án, căn cứ quyết định đối với bị can, căn cứ đề nghị phê chuẩn.",
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
    description: "Đơn vị thi hành, bị can và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM040_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN QUẬN THANH KHÊ",
  },
  "document.documentCodeLine": {
    label: "Số quyết định",
    placeholder: "58/QĐ-VKSTK",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Đà Nẵng, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Đà Nẵng",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "agency.bodyName": {
    label: "Tên cơ quan viết đầy đủ",
    placeholder:
      "Viện Kiểm sát nhân dân Quận Thanh Khê — Thành phố Đà Nẵng",
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
  "caseDecision.legalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 33/QĐ-PC04 ngày 10/3/2026;",
    control: "TEXTAREA",
    smart: {
      key: "caseDecision.legalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố vụ án số …/QĐ-PC04 ngày …;",
    },
  },
  "accusedDecision.legalBasisLine": {
    label: "Căn cứ quyết định đối với bị can",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can số 34/QĐ-PC04 ngày 11/3/2026;",
    control: "TEXTAREA",
    smart: {
      key: "accusedDecision.legalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố bị can số …/QĐ-PC04 ngày …;",
    },
  },
  "legalBasis.requestApprovalLine": {
    label: "Căn cứ đề nghị phê chuẩn",
    placeholder:
      "Căn cứ Đơn đề nghị phê chuẩn Lệnh tạm giam số 41/TTr-PC04 ngày 12/3/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.requestApprovalLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Đơn đề nghị phê chuẩn số …/TTr-PC04 ngày …;",
    },
  },
  "measure.reasonLine": {
    label: "Lý do áp dụng biện pháp tạm giam",
    placeholder:
      "Xét thấy hành vi phạm tội của bị can có căn cứ rõ ràng, có dấu hiệu bỏ trốn, cản trở việc điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "measure.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Xét thấy có căn cứ, có dấu hiệu bỏ trốn, cản trở điều tra;",
    },
  },
  "measure.article1Line": {
    label: "Điều 1 — Nội dung quyết định phê chuẩn",
    placeholder:
      "Phê chuẩn Lệnh tạm giam số 25/TTG-PC04 ngày 12/3/2026 của Cơ quan Cảnh sát điều tra Công an Quận Thanh Khê đối với bị can Ngô Văn Hải;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Phê chuẩn Lệnh tạm giam số …/TTG-PC04 ngày …;",
    },
  },
  "measure.detentionDurationLine": {
    label: "Thời hạn tạm giam",
    placeholder: "Thời hạn tạm giam: 04 tháng, kể từ ngày bắt.",
  },
  "measure.article2Line": {
    label: "Điều 2 — Giao hồ sơ",
    placeholder:
      "Giao Cơ quan Cảnh sát điều tra Công an Quận Thanh Khê tổ chức thi hành Lệnh tạm giam theo quy định pháp luật;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Giao CQCSĐT tổ chức thi hành Lệnh tạm giam;",
    },
  },
  "recipients.detentionExecutionUnitLine": {
    label: "Nơi nhận — Đơn vị thi hành tạm giam",
    placeholder:
      "Nhà tạm giữ Công an Quận Thanh Khê — Công an TP. Đà Nẵng;",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Bị can",
    placeholder: "Bị can Ngô Văn Hải;",
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
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Quận Thanh Khê",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Hoàng Thị Lan",
  },
} as const;

const BM040_DEMO_RUNTIME_UX = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN QUẬN THANH KHÊ",
  "document.documentCodeLine": "58/QĐ-VKSTK",
  "document.issuePlaceAndDateLine": "Đà Nẵng, ngày 04 tháng 7 năm 2026",
  "agency.bodyName":
    "Viện Kiểm sát nhân dân Quận Thanh Khê — Thành phố Đà Nẵng",
  "legalBasis.baseProcedureLine":
    "Căn cứ Điều 109, Điều 115 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileLegalBasisLine":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "caseDecision.legalBasisLine":
    "Căn cứ Quyết định khởi tố vụ án hình sự số 33/QĐ-PC04 ngày 10/3/2026;",
  "accusedDecision.legalBasisLine":
    "Căn cứ Quyết định khởi tố bị can số 34/QĐ-PC04 ngày 11/3/2026;",
  "legalBasis.requestApprovalLine":
    "Căn cứ Đơn đề nghị phê chuẩn Lệnh tạm giam số 41/TTr-PC04 ngày 12/3/2026 của Cơ quan Cảnh sát điều tra Công an Quận Thanh Khê;",
  "measure.reasonLine":
    "Xét thấy hành vi phạm tội của bị can có căn cứ rõ ràng, có dấu hiệu bỏ trốn, cản trở việc điều tra, cần thiết phải áp dụng biện pháp tạm giam;",
  "measure.article1Line":
    "Phê chuẩn Lệnh tạm giam số 25/TTG-PC04 ngày 12/3/2026 của Cơ quan Cảnh sát điều tra Công an Quận Thanh Khê đối với bị can Ngô Văn Hải;",
  "measure.detentionDurationLine":
    "Thời hạn tạm giam: 04 tháng, kể từ ngày bắt.",
  "measure.article2Line":
    "Giao Cơ quan Cảnh sát điều tra Công an Quận Thanh Khê tổ chức thi hành Lệnh tạm giam theo quy định pháp luật;",
  "recipients.detentionExecutionUnitLine":
    "Nhà tạm giữ Công an Quận Thanh Khê — Công an TP. Đà Nẵng;",
  "recipients.personLine": "Bị can Ngô Văn Hải;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Quận Thanh Khê",
  "signature.signerName": "Hoàng Thị Lan",
} as const;

const BM040_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-040",
  versionLabel:
    "BM-040 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM040_SECTIONS,
  fields: BM040_FIELDS,
  demo: BM040_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM040_RUNTIME_UX_PROFILE);
