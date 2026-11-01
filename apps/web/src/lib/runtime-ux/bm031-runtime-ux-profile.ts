/**
 * Curated runtime-ux profile for BM-031 — UI-only override metadata for the
 * standalone `/templates/BM-031` template page.
 *
 * Title: QĐ phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp.
 *
 * Why this file exists
 * --------------------
 * BM-031 has 16 fields across 5 sections. The auto-generated profile
 * shipped "(mẫu BM-031)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-031), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the legal-
 * basis, reason, and Điều 1 / Điều 2 body lines. Note the locked
 * contract tags `document.documentCode` as `documentCodeLine` (the
 * compiled version mirrors that).
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-031)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long legal-basis / reason / Điều 1 / Điều 2 blocks as
 *     `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-031 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-031.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM031_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát tại header, số Quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "2. Thông tin biểu mẫu",
    description: "Tên Viện kiểm sát trong thân văn bản.",
  },
  {
    sectionId: "section-can-cu-va-noi-dung-quyet-inh",
    title: "3. Căn cứ và nội dung Quyết định",
    description:
      "Căn cứ pháp lý, dòng xét hồ sơ đề nghị, lý do phê chuẩn, Điều 1 và Điều 2 của Quyết định.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan điều tra, người bị giữ và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và người ký Quyết định.",
  },
] as const;

const BM031_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát tại header",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "document.documentCodeLine": {
    label: "Số Quyết định",
    placeholder: "31/QĐ-VKS",
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
    label: "Tên Viện kiểm sát trong thân văn bản",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  },
  "legalBasis.juvenileLegalBasisLine": {
    label: "Căn cứ pháp luật người chưa thành niên",
    placeholder:
      "Luật Trẻ em năm 2016 và các văn bản hướng dẫn thi hành (nếu áp dụng).",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.juvenileLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Luật Trẻ em năm 2016 và các văn bản hướng dẫn thi hành (nếu áp dụng).",
    },
  },
  "legalBasis.requestApprovalLine": {
    label: "Dòng xét hồ sơ đề nghị",
    placeholder:
      "Xét hồ sơ đề nghị phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.requestApprovalLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Xét hồ sơ đề nghị phê chuẩn Lệnh bắt … của Cơ quan …;",
    },
  },
  "measure.reasonLine": {
    label: "Lý do phê chuẩn",
    placeholder:
      "Có căn cứ cho thấy Lê Minh Quân đang bị truy nã về tội cố ý gây thương tích; cần bắt ngay trong trường hợp khẩn cấp để đảm bảo thuận lợi cho công tác điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "measure.reasonLine",
      kind: "textarea",
      rows: 4,
      placeholder: "Có căn cứ cho thấy … đang bị truy nã …, cần bắt ngay trong trường hợp khẩn cấp …;",
    },
  },
  "measure.article1Line": {
    label: "Điều 1 — Phê chuẩn",
    placeholder:
      "Phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp số 31/LB-CSĐT ngày 03/7/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Lê Minh Quân;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article1Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Phê chuẩn Lệnh bắt … số … ngày … của … đối với …;",
    },
  },
  "measure.article2Line": {
    label: "Điều 2 — Trách nhiệm thi hành",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh có trách nhiệm tổ chức thi hành Lệnh bắt và báo cáo kết quả về Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Cơ quan … có trách nhiệm tổ chức thi hành Lệnh bắt và báo cáo kết quả về …;",
    },
  },
  "recipients.investigationUnitLine": {
    label: "Nơi nhận - cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  },
  "recipients.personLine": {
    label: "Nơi nhận - người bị giữ",
    placeholder: "Lê Minh Quân (để chấp hành);",
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
    placeholder: "Nguyễn Văn Phúc",
  },
} as const;

const BM031_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "document.documentCodeLine": "31/QĐ-VKS",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "agency.bodyName": "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "legalBasis.juvenileLegalBasisLine":
    "Luật Trẻ em năm 2016 và các văn bản hướng dẫn thi hành (nếu áp dụng).",
  "legalBasis.requestApprovalLine":
    "Xét hồ sơ đề nghị phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "measure.reasonLine":
    "Có căn cứ cho thấy Lê Minh Quân đang bị truy nã về tội cố ý gây thương tích; cần bắt ngay trong trường hợp khẩn cấp để đảm bảo thuận lợi cho công tác điều tra;",
  "measure.article1Line":
    "Phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp số 31/LB-CSĐT ngày 03/7/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Lê Minh Quân;",
  "measure.article2Line":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh có trách nhiệm tổ chức thi hành Lệnh bắt và báo cáo kết quả về Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh;",
  "recipients.investigationUnitLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.personLine": "Lê Minh Quân (để chấp hành);",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Nguyễn Văn Phúc",
} as const;

const BM031_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-031",
  versionLabel:
    "BM-031 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM031_SECTIONS,
  fields: BM031_FIELDS,
  demo: BM031_DEMO,
};

registerRuntimeUxProfile(BM031_RUNTIME_UX_PROFILE);