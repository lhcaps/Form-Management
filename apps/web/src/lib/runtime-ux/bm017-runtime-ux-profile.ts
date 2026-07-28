/**
 * Curated runtime-ux profile for BM-017 — UI-only override metadata for the
 * standalone `/templates/BM-017` template page.
 *
 * Title: Yêu cầu khởi tố vụ án hình sự.
 *
 * Why this file exists
 * --------------------
 * BM-017 has 14 fields across 4 sections. The auto-generated profile
 * shipped "(mẫu BM-017)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-017), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * `caseInitiationRequest.*` body lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-017)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the `caseInitiationRequest.procedureArticlesLine`,
 *     `assessmentLine`, `article1Line`, `article2Line` long blocks as
 *     `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-017 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-017.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM017_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Viện kiểm sát cấp trên, viện kiểm sát ban hành, số yêu cầu, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-yeu-cau-khoi-to",
    title: "2. Nội dung yêu cầu khởi tố",
    description:
      "Căn cứ tố tụng, đoạn xét thấy, Mục 1 (yêu cầu khởi tố) và Mục 2 (gửi quyết định và tài liệu).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "3. Nơi nhận",
    description: "Cơ quan điều tra nhận yêu cầu và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "4. Chữ ký",
    description: "Chế độ ký, chức vụ và người ký yêu cầu.",
  },
] as const;

const BM017_FIELDS = {
  "agency.parentName": {
    label: "Viện kiểm sát cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số yêu cầu",
    placeholder: "17/Yc-VKSKV7",
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
  "caseInitiationRequest.procedureArticlesLine": {
    label: "Căn cứ tố tụng",
    placeholder:
      "Căn cứ Điều 36, Điều 105, Điều 148, Điều 155 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationRequest.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 36, Điều 105, Điều 148, Điều 155 Bộ luật Tố tụng hình sự năm 2015;",
    },
  },
  "caseInitiationRequest.assessmentLine": {
    label: "Đoạn xét thấy",
    placeholder:
      "Qua kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm và kết quả điều tra, xét thấy vụ việc có đủ dấu hiệu của tội phạm cần khởi tố theo quy định của Bộ luật Hình sự;",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationRequest.assessmentLine",
      kind: "textarea",
      rows: 4,
      placeholder: "Qua kiểm sát …, xét thấy vụ việc có đủ dấu hiệu của tội phạm cần khởi tố;",
    },
  },
  "caseInitiationRequest.article1Line": {
    label: "Mục 1 — Yêu cầu khởi tố",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh ra Quyết định khởi tố vụ án hình sự đối với hành vi có dấu hiệu tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationRequest.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Yêu cầu Cơ quan Cảnh sát điều tra ra Quyết định khởi tố vụ án hình sự …;",
    },
  },
  "caseInitiationRequest.article2Line": {
    label: "Mục 2 — Gửi Quyết định và tài liệu",
    placeholder:
      "Sau khi ra Quyết định khởi tố, đề nghị gửi Quyết định kèm theo các tài liệu liên quan cho Viện Kiểm sát nhân dân Khu vực 7 để kiểm sát việc khởi tố vụ án;",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationRequest.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Sau khi ra Quyết định khởi tố, đề nghị gửi … cho Viện Kiểm sát …;",
    },
  },
  "caseInitiationRequest.investigationAuthorityRecipientLine": {
    label: "Cơ quan điều tra nhận yêu cầu",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
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

const BM017_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "17/Yc-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "caseInitiationRequest.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 105, Điều 148, Điều 155 Bộ luật Tố tụng hình sự năm 2015;",
  "caseInitiationRequest.assessmentLine":
    "Qua kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm và kết quả điều tra, xét thấy vụ việc có đủ dấu hiệu của tội phạm cần khởi tố theo quy định của Bộ luật Hình sự;",
  "caseInitiationRequest.article1Line":
    "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh ra Quyết định khởi tố vụ án hình sự đối với hành vi có dấu hiệu tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
  "caseInitiationRequest.article2Line":
    "Sau khi ra Quyết định khởi tố, đề nghị gửi Quyết định kèm theo các tài liệu liên quan cho Viện Kiểm sát nhân dân Khu vực 7 để kiểm sát việc khởi tố vụ án;",
  "caseInitiationRequest.investigationAuthorityRecipientLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM017_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-017",
  versionLabel:
    "BM-017 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM017_SECTIONS,
  fields: BM017_FIELDS,
  demo: BM017_DEMO,
};

registerRuntimeUxProfile(BM017_RUNTIME_UX_PROFILE);