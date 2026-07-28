/**
 * Curated runtime-ux profile for BM-006 — UI-only override metadata for the
 * standalone `/templates/BM-006` template page.
 *
 * Title: Yêu cầu tiếp nhận, kiểm tra, xác minh, ra QĐ giải quyết nguồn
 *        tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * The auto-generated baseline shipped "(mẫu BM-006)" placeholders into
 * every demo value and used untranslated section titles for the
 * `sourceRequest.*` content blocks. The contract has 15 fields across 3
 * sections and supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine`.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-006)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the `sourceRequest.*` long-text blocks (lý do / tóm tắt /
 *     kết quả) as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-006 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-006.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM006_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số yêu cầu, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-yeu-cau",
    title: "2. Nội dung yêu cầu",
    description:
      "Lý do xét thấy, cơ quan được yêu cầu, hành động yêu cầu, tóm tắt vụ việc và yêu cầu gửi kết quả.",
  },
  {
    sectionId: "section-noi-nhan-va-chu-ky",
    title: "3. Nơi nhận và chữ ký",
    description: "Nơi nhận chính, chế độ ký, chức danh và người ký.",
  },
] as const;

const BM006_FIELDS = {
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
    placeholder: "43/Yc-VKSKV7",
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
  "sourceRequest.reasonLine": {
    label: "Lý do xét thấy",
    placeholder:
      "Qua xem xét nguồn tin về tội phạm do Cơ quan Cảnh sát điều tra chuyển đến, xét thấy cần kiểm tra, xác minh làm rõ trước khi giải quyết;",
    control: "TEXTAREA",
    smart: {
      key: "sourceRequest.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Qua xem xét nguồn tin về tội phạm …, xét thấy cần kiểm tra, xác minh;",
    },
  },
  "sourceRequest.receiverName": {
    label: "Cơ quan hoặc người được yêu cầu",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  "sourceRequest.actionLine": {
    label: "Hành động được yêu cầu",
    placeholder:
      "Tiếp nhận, kiểm tra, xác minh và ra Quyết định giải quyết nguồn tin theo thẩm quyền;",
    control: "TEXTAREA",
    smart: {
      key: "sourceRequest.actionLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Tiếp nhận, kiểm tra, xác minh và ra Quyết định giải quyết nguồn tin …;",
    },
  },
  "sourceRequest.caseSummary": {
    label: "Tóm tắt vụ việc",
    placeholder:
      "Ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh xảy ra vụ việc có dấu hiệu tội phạm; cần xác minh làm rõ hành vi của các đối tượng liên quan;",
    control: "TEXTAREA",
    smart: {
      key: "sourceRequest.caseSummary",
      kind: "textarea",
      rows: 4,
      placeholder: "Tóm tắt vụ việc: ngày … xảy ra vụ việc …;",
    },
  },
  "sourceRequest.actionResultLine": {
    label: "Kết quả cần thông báo",
    placeholder:
      "Đề nghị thông báo kết quả kiểm tra, xác minh và Quyết định giải quyết nguồn tin về Viện Kiểm sát nhân dân Khu vực 7 trong thời hạn 30 ngày kể từ ngày nhận được yêu cầu;",
    control: "TEXTAREA",
    smart: {
      key: "sourceRequest.actionResultLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Đề nghị thông báo kết quả trong thời hạn 30 ngày;",
    },
  },
  "agency.bodyName": {
    label: "Tên Viện kiểm sát trong thân văn bản",
    placeholder: "Viện Kiểm sát nhân dân Khu vực 7",
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

const BM006_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "43/Yc-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "sourceRequest.reasonLine":
    "qua xem xét nguồn tin về tội phạm do Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh chuyển đến, xét thấy cần kiểm tra, xác minh làm rõ trước khi giải quyết",
  "sourceRequest.receiverName":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "sourceRequest.actionLine":
    "tiếp nhận, kiểm tra, xác minh và ra Quyết định giải quyết nguồn tin theo thẩm quyền",
  "sourceRequest.caseSummary":
    "ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh xảy ra vụ việc có dấu hiệu tội phạm; cần xác minh làm rõ hành vi của các đối tượng liên quan",
  "sourceRequest.actionResultLine":
    "đề nghị thông báo kết quả kiểm tra, xác minh và Quyết định giải quyết nguồn tin về Viện Kiểm sát nhân dân Khu vực 7 trong thời hạn 30 ngày kể từ ngày nhận được yêu cầu",
  "agency.bodyName": "Viện Kiểm sát nhân dân Khu vực 7",
  "recipients.primaryLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM006_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-006",
  versionLabel:
    "BM-006 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM006_SECTIONS,
  fields: BM006_FIELDS,
  demo: BM006_DEMO,
};

registerRuntimeUxProfile(BM006_RUNTIME_UX_PROFILE);