/**
 * Curated runtime-ux profile for BM-010 — UI-only override metadata for the
 * standalone `/templates/BM-010` template page.
 *
 * Title: QĐ tạm đình chỉ giải quyết nguồn tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * BM-010 has 15 fields across 4 sections. The auto-generated profile
 * shipped "(mẫu BM-010)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-010), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * `sourceSuspension.*` body lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-010)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long `sourceSuspension.reasonLine`, `caseSummary`,
 *     `article2Line`, `article3Line` blocks as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-010 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-010.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM010_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số Quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-tam-inh-chi",
    title: "2. Nội dung tạm đình chỉ",
    description:
      "Lý do xét thấy, tóm tắt vụ việc, ngày tiếp nhận nguồn tin, Điều 2 và Điều 3 về thời hạn tạm đình chỉ.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "3. Nơi nhận",
    description: "Nơi nhận chính.",
  },
  {
    sectionId: "section-chu-ky",
    title: "4. Chữ ký",
    description: "Chế độ ký, chức danh và người ký Quyết định.",
  },
] as const;

const BM010_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số Quyết định",
    placeholder: "10/QĐ-VKSKV7",
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
  "sourceSuspension.reasonLine": {
    label: "Lý do xét thấy",
    placeholder:
      "Xét thấy vụ việc đang được xác minh làm rõ, cần có thời gian chờ kết quả trưng cầu giám định chuyên môn;",
    control: "TEXTAREA",
    smart: {
      key: "sourceSuspension.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Xét thấy vụ việc đang được xác minh làm rõ, cần có thời gian …;",
    },
  },
  "sourceSuspension.caseSummary": {
    label: "Vụ việc",
    placeholder:
      "Vụ việc nguồn tin về tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "sourceSuspension.caseSummary",
      kind: "textarea",
      rows: 4,
      placeholder: "Vụ việc nguồn tin về tội phạm xảy ra … tại …;",
    },
  },
  "agency.bodyName": {
    label: "Tên Viện kiểm sát trong thân văn bản",
    placeholder: "Viện Kiểm sát nhân dân Khu vực 7",
  },
  "sourceSuspension.receivedDateLine": {
    label: "Ngày tiếp nhận nguồn tin",
    placeholder: "Thành phố Hồ Chí Minh, ngày 15 tháng 01 năm 2026",
  },
  "sourceSuspension.article2Line": {
    label: "Điều 2 — Thời hạn tạm đình chỉ",
    placeholder:
      "Tạm đình chỉ giải quyết nguồn tin về tội phạm nêu tại Điều 1 trong thời hạn 30 ngày, kể từ ngày 04/7/2026 đến ngày 03/8/2026;",
    control: "TEXTAREA",
    smart: {
      key: "sourceSuspension.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Tạm đình chỉ trong thời hạn … ngày, kể từ … đến …;",
    },
  },
  "sourceSuspension.article3Line": {
    label: "Điều 3 — Trách nhiệm thi hành",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh có trách nhiệm báo cáo kết quả giải quyết nguồn tin trong thời hạn tạm đình chỉ nêu trên; khi có kết quả giám định phải thông báo ngay cho Viện Kiểm sát;",
    control: "TEXTAREA",
    smart: {
      key: "sourceSuspension.article3Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Cơ quan … có trách nhiệm báo cáo kết quả trong thời hạn …;",
    },
  },
  "recipients.primaryLine": {
    label: "Nơi nhận chính",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
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
    label: "Chức danh người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Trần Văn Hùng",
  },
} as const;

const BM010_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "10/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "sourceSuspension.reasonLine":
    "Xét thấy vụ việc đang được xác minh làm rõ, cần có thời gian chờ kết quả trưng cầu giám định chuyên môn;",
  "sourceSuspension.caseSummary":
    "Vụ việc nguồn tin về tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
  "agency.bodyName": "Viện Kiểm sát nhân dân Khu vực 7",
  "sourceSuspension.receivedDateLine":
    "Thành phố Hồ Chí Minh, ngày 15 tháng 01 năm 2026",
  "sourceSuspension.article2Line":
    "Tạm đình chỉ giải quyết nguồn tin về tội phạm nêu tại Điều 1 trong thời hạn 30 ngày, kể từ ngày 04/7/2026 đến ngày 03/8/2026;",
  "sourceSuspension.article3Line":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh có trách nhiệm báo cáo kết quả giải quyết nguồn tin trong thời hạn tạm đình chỉ nêu trên; khi có kết quả giám định phải thông báo ngay cho Viện Kiểm sát;",
  "recipients.primaryLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM010_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-010",
  versionLabel:
    "BM-010 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM010_SECTIONS,
  fields: BM010_FIELDS,
  demo: BM010_DEMO,
};

registerRuntimeUxProfile(BM010_RUNTIME_UX_PROFILE);