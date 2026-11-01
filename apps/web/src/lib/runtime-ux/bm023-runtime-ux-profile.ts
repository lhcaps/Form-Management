/**
 * Curated runtime-ux profile for BM-023 — UI-only override metadata for the
 * standalone `/templates/BM-023` template page.
 *
 * Title: QĐ khởi tố vụ án hình sự.
 *
 * Why this file exists
 * --------------------
 * BM-023 has 17 fields across 5 sections. The auto-generated profile
 * shipped "(mẫu BM-023)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-023), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * `crimeReport.content`, `investigation.article2Line`, `legalBasis.*`
 * body lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-023)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long content / legal-basis / Điều 2 blocks as
 *     `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo with a clear case title + offense.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-023 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-023.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM023_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số Quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-va-noi-dung-vu-viec",
    title: "2. Căn cứ và nội dung vụ việc",
    description:
      "Căn cứ Bộ luật Tố tụng hình sự, nội dung nguồn tin / vụ việc, tên vụ án hình sự.",
  },
  {
    sectionId: "section-toi-danh-va-quyet-inh",
    title: "3. Tội danh và Quyết định khởi tố",
    description: "Tội danh, điều khoản Bộ luật Hình sự và nội dung Điều 2 của Quyết định.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan điều tra, Viện kiểm sát cấp trên và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và người ký Quyết định.",
  },
] as const;

const BM023_FIELDS = {
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
    placeholder: "23/QĐ-VKSKV7",
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
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 36, Điều 105, Điều 155, Điều 156 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 36, Điều 105, Điều 155, Điều 156 Bộ luật Tố tụng hình sự năm 2015;",
    },
  },
  "crimeReport.content": {
    label: "Nội dung nguồn tin, vụ việc",
    placeholder:
      "Ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh, Lê Minh Quân đã có hành vi cố ý gây thương tích cho Trần Văn Nam với tỷ lệ thương tích 25%;",
    control: "TEXTAREA",
    smart: {
      key: "crimeReport.content",
      kind: "textarea",
      rows: 4,
      placeholder: "Ngày … tại …, … đã có hành vi …;",
    },
  },
  "case.caseTitle": {
    label: "Tên vụ việc",
    placeholder: "Vụ án Lê Minh Quân cố ý gây thương tích",
  },
  "offense.offenseName": {
    label: "Tội danh",
    placeholder: "Cố ý gây thương tích",
  },
  "offense.legalArticle": {
    label: "Điều khoản Bộ luật Hình sự",
    placeholder: "Điều 134 Bộ luật Hình sự năm 2015;",
  },
  "investigation.article2Line": {
    label: "Nội dung Điều 2",
    placeholder:
      "Giao Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tổ chức điều tra, xác minh làm rõ hành vi của Lê Minh Quân và các đối tượng liên quan theo quy định của pháp luật;",
    control: "TEXTAREA",
    smart: {
      key: "investigation.article2Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Giao Cơ quan Cảnh sát điều tra … tổ chức điều tra, xác minh …;",
    },
  },
  "recipients.investigationUnitLine": {
    label: "Nơi nhận - cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  },
  "recipients.superiorProcuracyLine": {
    label: "Nơi nhận - Viện kiểm sát cấp trên",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh;",
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
    label: "Chức vụ người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Trần Văn Hùng",
  },
} as const;

const BM023_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "23/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 105, Điều 155, Điều 156 Bộ luật Tố tụng hình sự năm 2015;",
  "crimeReport.content":
    "Theo đơn trình báo của công dân Nguyễn Văn B về việc bị mất trộm tài sản (điện thoại di động) tại địa chỉ số 12 đường Lê Lợi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh vào khoảng 19 giờ ngày 12/4/2026, đề nghị cơ quan có thẩm quyền xác minh.",
  "case.caseTitle": "Vụ án trộm cắp tài sản tại Quận 1, Thành phố Hồ Chí Minh",
  "offense.offenseName": "Trộm cắp tài sản",
  "offense.legalArticle": "Điều 134 Bộ luật Hình sự năm 2015;",
  "investigation.article2Line":
    "Giao Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tổ chức điều tra, xác minh làm rõ hành vi của Lê Minh Quân và các đối tượng liên quan theo quy định của pháp luật;",
  "recipients.investigationUnitLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.superiorProcuracyLine":
    "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM023_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-023",
  versionLabel:
    "BM-023 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM023_SECTIONS,
  fields: BM023_FIELDS,
  demo: BM023_DEMO,
};

registerRuntimeUxProfile(BM023_RUNTIME_UX_PROFILE);