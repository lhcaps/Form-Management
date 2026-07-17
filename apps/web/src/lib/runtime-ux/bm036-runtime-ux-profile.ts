/**
 * Curated runtime-ux profile for BM-036 — UI-only override metadata for the
 * standalone `/templates/BM-036` template page.
 *
 * Title: QĐ trả tự do cho người bị tạm giữ
 *
 * Why this file exists
 * --------------------
 * The auto-generated baseline emitted conservative labels of the form
 * "Tên cơ quan (mẫu BM-036)" which (a) leak the "(mẫu BM-036)" stale
 * token into placeholders that will travel into the runtime preview,
 * and (b) provide no real legal-doc context for the operator.
 *
 * This curated profile:
 *   - locks real Vietnamese labels aligned with the BM-036 locked contract,
 *   - adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine` so the operator picks a real date,
 *   - adds `textarea` smart controls for the long legal-basis /
 *     decision-summary / execution-agency fields,
 *   - ships a safe synthetic demo (no real PII, no stale tokens, distinct
 *     names per role).
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation, no `generatedDocumentId` fabrication.
 *   - No modification of `FormFlight` allowlist — BM-036 stays out of
 *     `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Locked contract:
 *   `docs/audit/docx/contracts/locked/BM-036__*.contract.locked.json`
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-036.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM036_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu — Quyết định trả tự do cho người bị tạm giữ",
    description:
      "Tên cơ quan ban hành, số văn bản, địa danh — ngày ban hành, họ tên người được trả tự do, căn cứ tố tụng, nội dung quyết định và nơi nhận.",
  },
] as const;

const BM036_FIELDS = {
  "agency.parentNameUpper": {
    label: "Tên cơ quan (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "12/QĐ-VKS",
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
  "person.fullName": {
    label: "Họ tên người được trả tự do",
    placeholder: "Trần Văn Bình",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ tố tụng và thông tin nhân thân bổ sung",
    placeholder:
      "Căn cứ Điều 36, Điều 115 Bộ luật Tố tụng hình sự năm 2015; nhân thân: sinh năm 1985, quê quán Quảng Nam;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 36, Điều 115 Bộ luật Tố tụng hình sự năm 2015; nhân thân bổ sung của người bị tạm giữ;",
    },
  },
  "decision.summaryLine": {
    label: "Tóm tắt nội dung quyết định trả tự do",
    placeholder:
      "Xét thấy thời hạn tạm giữ theo quy định đã hết và không có căn cứ gia hạn;",
    control: "TEXTAREA",
    smart: {
      key: "decision.summaryLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Xét thấy thời hạn tạm giữ đã hết và không có căn cứ gia hạn;",
    },
  },
  "recipients.executionAgencyLine": {
    label: "Cơ quan thi hành quyết định trả tự do",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "recipients.executionAgencyLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
    },
  },
  "recipients.personLine": {
    label: "Người được trả tự do",
    placeholder: "Trần Văn Bình — địa chỉ: 49 Trần Hưng Đạo, Quận 1, TP. HCM;",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
} as const;

const BM036_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "document.documentCode": "12/QĐ-VKS",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "person.fullName": "Trần Văn Bình",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 115 Bộ luật Tố tụng hình sự năm 2015; nhân thân: sinh năm 1985, quê quán Quảng Nam, nghề nghiệp: lao động tự do;",
  "decision.summaryLine":
    "Xét thấy thời hạn tạm giữ theo quyết định đã hết và không có căn cứ gia hạn tạm giam; người bị tạm giữ có đủ điều kiện được trả tự do theo quy định của Bộ luật Tố tụng hình sự;",
  "recipients.executionAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.personLine":
    "Trần Văn Bình — địa chỉ: 49 Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
} as const;

const BM036_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-036",
  versionLabel:
    "BM-036 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM036_SECTIONS,
  fields: BM036_FIELDS,
  demo: BM036_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM036_RUNTIME_UX_PROFILE);