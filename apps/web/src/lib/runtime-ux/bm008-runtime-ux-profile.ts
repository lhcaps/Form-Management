/**
 * Curated runtime-ux profile for BM-008 — UI-only override metadata for the
 * standalone `/templates/BM-008` template page.
 *
 * Title: Yêu cầu chuyển nguồn tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * BM-008 has 14 fields across 3 sections. The auto-generated profile
 * shipped "(mẫu BM-008)" placeholders into every demo value and used
 * the `Địa điểm (mẫu BM-008), ngày ...` line for the date slot. The
 * contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * `sourceTransfer.*` body lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-008)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the `sourceTransfer.caseSummary` and `sourceTransfer.reasonLine`
 *     long-text blocks as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo with distinct sender / receiver names.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-008 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-008.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM008_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số yêu cầu, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-chuyen-nguon-tin",
    title: "2. Nội dung chuyển nguồn tin",
    description:
      "Hồ sơ vụ việc, lý do chuyển, cơ quan chuyển và cơ quan tiếp nhận nguồn tin.",
  },
  {
    sectionId: "section-noi-nhan-va-chu-ky",
    title: "3. Nơi nhận và chữ ký",
    description: "Nơi nhận chính, chế độ ký, chức danh và người ký.",
  },
] as const;

const BM008_FIELDS = {
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
    placeholder: "45/Yc-VKSKV7",
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
  "sourceTransfer.caseSummary": {
    label: "Hồ sơ vụ việc",
    placeholder:
      "Hồ sơ vụ việc nguồn tin về tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "sourceTransfer.caseSummary",
      kind: "textarea",
      rows: 4,
      placeholder: "Hồ sơ vụ việc nguồn tin về tội phạm …;",
    },
  },
  "sourceTransfer.reasonLine": {
    label: "Lý do chuyển",
    placeholder:
      "Nguồn tin về tội phạm thuộc thẩm quyền giải quyết của Cơ quan Cảnh sát điều tra Công an Quận 1 theo quy định tại Điều 36 Bộ luật Tố tụng hình sự;",
    control: "TEXTAREA",
    smart: {
      key: "sourceTransfer.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Nguồn tin thuộc thẩm quyền giải quyết của … theo quy định tại …;",
    },
  },
  "sourceTransfer.senderName": {
    label: "Cơ quan hoặc người chuyển",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Thủ Đức",
  },
  "sourceTransfer.receiverName": {
    label: "Cơ quan hoặc người tiếp nhận",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận 1, TP. Hồ Chí Minh",
  },
  "agency.bodyName": {
    label: "Tên Viện kiểm sát trong thân văn bản",
    placeholder: "Viện Kiểm sát nhân dân Khu vực 7",
  },
  "recipients.primaryLine": {
    label: "Nơi nhận chính",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận 1, TP. Hồ Chí Minh;",
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

const BM008_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "45/Yc-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "sourceTransfer.caseSummary":
    "Hồ sơ vụ việc nguồn tin về tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
  "sourceTransfer.reasonLine":
    "Nguồn tin về tội phạm thuộc thẩm quyền giải quyết của Cơ quan Cảnh sát điều tra Công an Quận 1 theo quy định tại Điều 36 Bộ luật Tố tụng hình sự;",
  "sourceTransfer.senderName":
    "Cơ quan Cảnh sát điều tra Công an TP. Thủ Đức",
  "sourceTransfer.receiverName":
    "Cơ quan Cảnh sát điều tra Công an Quận 1, TP. Hồ Chí Minh",
  "agency.bodyName": "Viện Kiểm sát nhân dân Khu vực 7",
  "recipients.primaryLine":
    "Cơ quan Cảnh sát điều tra Công an Quận 1, TP. Hồ Chí Minh;",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM008_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-008",
  versionLabel:
    "BM-008 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM008_SECTIONS,
  fields: BM008_FIELDS,
  demo: BM008_DEMO,
};

registerRuntimeUxProfile(BM008_RUNTIME_UX_PROFILE);