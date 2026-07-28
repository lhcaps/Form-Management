/**
 * Curated runtime-ux profile for BM-012 — UI-only override metadata for the
 * standalone `/templates/BM-012` template page.
 *
 * Title: QĐ phục hồi giải quyết nguồn tin.
 *
 * Why this file exists
 * --------------------
 * BM-012 has 14 fields across 4 sections. The auto-generated profile
 * shipped "(mẫu BM-012)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-012), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and references a prior
 * `suspensionDecisionCode / issuedDate / issuedBy` triplet.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-012)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the `sourceRecovery.reasonLine` and `caseSummary` long blocks
 *     as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo referencing the matching
 *     `10/QĐ-VKSKV7` suspension decision.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-012 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-012.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM012_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số Quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-phuc-hoi",
    title: "2. Nội dung phục hồi",
    description:
      "Lý do phục hồi, tham chiếu Quyết định tạm đình chỉ và tóm tắt vụ việc được phục hồi.",
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

const BM012_FIELDS = {
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
    placeholder: "12/QĐ-VKSKV7",
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
  "sourceRecovery.reasonLine": {
    label: "Lý do phục hồi",
    placeholder:
      "Căn cứ kết quả giải quyết khiếu nại và các tài liệu bổ sung; lý do tạm đình chỉ đã hết, cần phục hồi giải quyết nguồn tin về tội phạm;",
    control: "TEXTAREA",
    smart: {
      key: "sourceRecovery.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ kết quả giải quyết khiếu nại …, lý do tạm đình chỉ đã hết;",
    },
  },
  "sourceRecovery.suspensionDecisionCode": {
    label: "Số Quyết định tạm đình chỉ",
    placeholder: "10/QĐ-VKSKV7",
  },
  "sourceRecovery.suspensionDecisionIssueDateLine": {
    label: "Ngày Quyết định tạm đình chỉ",
    placeholder: "ngày 04 tháng 7 năm 2026",
  },
  "sourceRecovery.suspensionDecisionIssuedBy": {
    label: "Cơ quan ban hành QĐ tạm đình chỉ",
    placeholder: "Viện Kiểm sát nhân dân Khu vực 7",
  },
  "sourceRecovery.caseSummary": {
    label: "Vụ việc được phục hồi giải quyết",
    placeholder:
      "Vụ việc nguồn tin về tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "sourceRecovery.caseSummary",
      kind: "textarea",
      rows: 4,
      placeholder: "Vụ việc nguồn tin về tội phạm xảy ra … tại …;",
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

const BM012_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "12/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "sourceRecovery.reasonLine":
    "Căn cứ kết quả giải quyết khiếu nại và các tài liệu bổ sung; lý do tạm đình chỉ đã hết, cần phục hồi giải quyết nguồn tin về tội phạm;",
  "sourceRecovery.suspensionDecisionCode": "10/QĐ-VKSKV7",
  "sourceRecovery.suspensionDecisionIssueDateLine":
    "ngày 04 tháng 7 năm 2026",
  "sourceRecovery.suspensionDecisionIssuedBy":
    "Viện Kiểm sát nhân dân Khu vực 7",
  "sourceRecovery.caseSummary":
    "Vụ việc nguồn tin về tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
  "recipients.primaryLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM012_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-012",
  versionLabel:
    "BM-012 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM012_SECTIONS,
  fields: BM012_FIELDS,
  demo: BM012_DEMO,
};

registerRuntimeUxProfile(BM012_RUNTIME_UX_PROFILE);