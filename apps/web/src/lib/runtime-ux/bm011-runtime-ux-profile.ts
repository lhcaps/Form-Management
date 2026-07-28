/**
 * Curated runtime-ux profile for BM-011 — UI-only override metadata for the
 * standalone `/templates/BM-011` template page.
 *
 * Title: QĐ huỷ bỏ QĐ tạm đình chỉ việc giải quyết nguồn tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * BM-011 has 15 fields across 4 sections. The auto-generated profile
 * shipped "(mẫu BM-011)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-011), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * legal-basis and Điều 1 / Điều 2 / consideration lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-011)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long `legalBasis.procedureArticlesLine`,
 *     `sourceSuspensionCancellation.considerationLine`, `article1Line`,
 *     `article2Line` blocks as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-011 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-011.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM011_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số Quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-va-quyet-inh",
    title: "2. Căn cứ và Quyết định huỷ bỏ",
    description:
      "Căn cứ tố tụng, nội dung xét thấy, Điều 1 (huỷ bỏ QĐ tạm đình chỉ) và Điều 2 (thi hành).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "3. Nơi nhận",
    description: "Nơi nhận chính, người / cơ quan cung cấp nguồn tin và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "4. Chữ ký",
    description: "Chế độ ký, chức danh và người ký Quyết định.",
  },
] as const;

const BM011_FIELDS = {
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
    placeholder: "11/QĐ-VKSKV7",
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
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ tố tụng",
    placeholder:
      "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    },
  },
  "sourceSuspensionCancellation.considerationLine": {
    label: "Nội dung xét thấy",
    placeholder:
      "Xét thấy đã có kết quả trưng cầu giám định chuyên môn và các tài liệu cần thiết để giải quyết nguồn tin về tội phạm; lý do tạm đình chỉ không còn;",
    control: "TEXTAREA",
    smart: {
      key: "sourceSuspensionCancellation.considerationLine",
      kind: "textarea",
      rows: 4,
      placeholder: "Xét thấy đã có kết quả …, lý do tạm đình chỉ không còn;",
    },
  },
  "sourceSuspensionCancellation.article1Line": {
    label: "Điều 1 — Huỷ bỏ QĐ tạm đình chỉ",
    placeholder:
      "Huỷ bỏ Quyết định tạm đình chỉ giải quyết nguồn tin số 10/QĐ-VKSKV7 ngày 04/7/2026 của Viện Kiểm sát nhân dân Khu vực 7;",
    control: "TEXTAREA",
    smart: {
      key: "sourceSuspensionCancellation.article1Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Huỷ bỏ Quyết định tạm đình chỉ số … ngày … của …;",
    },
  },
  "sourceSuspensionCancellation.article2Line": {
    label: "Điều 2 — Trách nhiệm thi hành",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tiếp tục giải quyết nguồn tin về tội phạm theo thẩm quyền;",
    control: "TEXTAREA",
    smart: {
      key: "sourceSuspensionCancellation.article2Line",
      kind: "textarea",
      rows: 2,
      placeholder: "Cơ quan … tiếp tục giải quyết nguồn tin theo thẩm quyền;",
    },
  },
  "recipients.primaryLine": {
    label: "Nơi nhận chính",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  },
  "recipients.sourceProviderLine": {
    label: "Người hoặc cơ quan cung cấp nguồn tin",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Thủ Đức;",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
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
    label: "Chức danh người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Trần Văn Hùng",
  },
} as const;

const BM011_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "11/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
  "sourceSuspensionCancellation.considerationLine":
    "Xét thấy đã có kết quả trưng cầu giám định chuyên môn và các tài liệu cần thiết để giải quyết nguồn tin về tội phạm; lý do tạm đình chỉ không còn;",
  "sourceSuspensionCancellation.article1Line":
    "Huỷ bỏ Quyết định tạm đình chỉ giải quyết nguồn tin số 10/QĐ-VKSKV7 ngày 04/7/2026 của Viện Kiểm sát nhân dân Khu vực 7;",
  "sourceSuspensionCancellation.article2Line":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tiếp tục giải quyết nguồn tin về tội phạm theo thẩm quyền;",
  "recipients.primaryLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.sourceProviderLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Thủ Đức;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM011_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-011",
  versionLabel:
    "BM-011 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM011_SECTIONS,
  fields: BM011_FIELDS,
  demo: BM011_DEMO,
};

registerRuntimeUxProfile(BM011_RUNTIME_UX_PROFILE);