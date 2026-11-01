/**
 * Curated runtime-ux profile for BM-020 — UI-only override metadata for the
 * standalone `/templates/BM-020` template page.
 *
 * Title: Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố.
 *
 * Why this file exists
 * --------------------
 * BM-020 has 13 fields across 4 sections. The auto-generated profile
 * shipped "(mẫu BM-020)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-020), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * `initiationRequest.*` body lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-020)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long `reasonLine`, `article1Line`, `article2Line` blocks
 *     as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-020 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-020.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM020_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số yêu cầu, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-yeu-cau-huy-bo-quyet-inh",
    title: "2. Nội dung yêu cầu hủy bỏ Quyết định",
    description:
      "Dòng xét QĐ cần hủy bỏ, Điều 1 về việc hủy bỏ và Điều 2 về trách nhiệm thi hành.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "3. Nơi nhận",
    description: "Dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "4. Chữ ký",
    description: "Chế độ ký, chức vụ và người ký yêu cầu.",
  },
] as const;

const BM020_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số yêu cầu",
    placeholder: "20/Yc-VKSKV7",
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
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "initiationRequest.reasonLine": {
    label: "Dòng xét QĐ cần hủy bỏ",
    placeholder:
      "Qua kiểm sát hồ sơ vụ án và kết quả điều tra, xét thấy Quyết định khởi tố / Quyết định không khởi tố số 22/QĐ-CSĐT ngày 15/3/2026 có vi phạm về thẩm quyền, thủ tục tố tụng;",
    control: "TEXTAREA",
    smart: {
      key: "initiationRequest.reasonLine",
      kind: "textarea",
      rows: 4,
      placeholder: "Qua kiểm sát …, xét thấy QĐ khởi tố / không khởi tố số … có vi phạm …;",
    },
  },
  "initiationRequest.article1Line": {
    label: "Điều 1 — Hủy bỏ Quyết định",
    placeholder:
      "Yêu cầu hủy bỏ Quyết định khởi tố / Quyết định không khởi tố số 22/QĐ-CSĐT ngày 15/3/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "initiationRequest.article1Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Yêu cầu hủy bỏ QĐ khởi tố / không khởi tố số … ngày … của …;",
    },
  },
  "initiationRequest.article2Line": {
    label: "Điều 2 — Trách nhiệm thi hành",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh ra Quyết định hủy bỏ Quyết định nêu tại Điều 1 và gửi Quyết định mới cho Viện Kiểm sát nhân dân Khu vực 7;",
    control: "TEXTAREA",
    smart: {
      key: "initiationRequest.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Cơ quan … ra QĐ hủy bỏ QĐ nêu tại Điều 1 và gửi QĐ mới cho …;",
    },
  },
  "initiationRequest.orderedAuthorityName": {
    label: "Cơ quan được yêu cầu",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  "recipients.archiveLine": {
    label: "Dòng lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký thay",
    smart: {
      key: "signature.signMode",
      kind: "select",
      options: ["Ký", "Ký thay", "Ký thay mặt"],
    },
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Trần Văn Hùng",
  },
} as const;

const BM020_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "20/Yc-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "initiationRequest.reasonLine":
    "Qua kiểm sát hồ sơ vụ án và kết quả điều tra, xét thấy Quyết định khởi tố / Quyết định không khởi tố số 22/QĐ-CSĐT ngày 15/3/2026 có vi phạm về thẩm quyền, thủ tục tố tụng;",
  "initiationRequest.article1Line":
    "Yêu cầu hủy bỏ Quyết định khởi tố / Quyết định không khởi tố số 22/QĐ-CSĐT ngày 15/3/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "initiationRequest.article2Line":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh ra Quyết định hủy bỏ Quyết định nêu tại Điều 1 và gửi Quyết định mới cho Viện Kiểm sát nhân dân Khu vực 7;",
  "initiationRequest.orderedAuthorityName":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM020_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-020",
  versionLabel:
    "BM-020 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM020_SECTIONS,
  fields: BM020_FIELDS,
  demo: BM020_DEMO,
};

registerRuntimeUxProfile(BM020_RUNTIME_UX_PROFILE);