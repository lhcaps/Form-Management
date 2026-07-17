/**
 * Curated runtime-ux profile for BM-018 — UI-only override metadata for the
 * standalone `/templates/BM-018` template page.
 *
 * Title: Yêu cầu ra QĐ thay đổi QĐ khởi tố vụ án hình sự.
 *
 * Why this file exists
 * --------------------
 * BM-018 has 17 fields across 4 sections. The auto-generated profile
 * shipped "(mẫu BM-018)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-018), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * `caseInitiationChangeRequest.*` body lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-018)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long legal-basis and `caseInitiationChangeRequest.*`
 *     body lines as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo referencing a prior
 *     `khởi tố số 19/QĐ-CSĐT` decision.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-018 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-018.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM018_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số yêu cầu, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-yeu-cau-thay-oi",
    title: "2. Nội dung yêu cầu thay đổi",
    description:
      "Căn cứ pháp lý, dòng xét QĐ khởi tố cũ, căn cứ thay đổi, căn cứ tội danh mới và yêu cầu ra QĐ thay đổi.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "3. Nơi nhận",
    description: "Nơi nhận chính và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "4. Chữ ký",
    description: "Chế độ ký, chức vụ và người ký yêu cầu.",
  },
] as const;

const BM018_FIELDS = {
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
    placeholder: "18/Yc-VKSKV7",
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
    label: "Căn cứ pháp lý",
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
  "caseInitiationChangeRequest.considerationLine": {
    label: "Dòng xét QĐ khởi tố cũ",
    placeholder:
      "Qua kiểm sát hồ sơ vụ án và kết quả điều tra, xét thấy Quyết định khởi tố vụ án hình sự số 19/QĐ-CSĐT ngày 12/3/2026 có một số nội dung cần được thay đổi cho phù hợp với tài liệu, tình tiết mới phát sinh;",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationChangeRequest.considerationLine",
      kind: "textarea",
      rows: 4,
      placeholder: "Qua kiểm sát …, xét thấy QĐ khởi tố cũ có nội dung cần thay đổi …;",
    },
  },
  "caseInitiationChangeRequest.currentOffenseLegalLine": {
    label: "Căn cứ pháp lý của tội danh cũ",
    placeholder: "Điều 168 Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017);",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationChangeRequest.currentOffenseLegalLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Điều … Bộ luật Hình sự năm 2015;",
    },
  },
  "caseInitiationChangeRequest.changeGroundLine": {
    label: "Căn cứ thay đổi Quyết định",
    placeholder:
      "Có tài liệu mới phát sinh làm thay đổi tình tiết, đối tượng và tội danh của vụ án; cần điều chỉnh để phù hợp với kết quả điều tra bổ sung;",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationChangeRequest.changeGroundLine",
      kind: "textarea",
      rows: 4,
      placeholder: "Có tài liệu mới phát sinh …, cần điều chỉnh để phù hợp với …;",
    },
  },
  "caseInitiationChangeRequest.newOffenseLegalLine": {
    label: "Căn cứ pháp lý của tội danh mới",
    placeholder: "Điều 174 Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017);",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationChangeRequest.newOffenseLegalLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Điều … Bộ luật Hình sự năm 2015;",
    },
  },
  "caseInitiationChangeRequest.requestAuthorityLine": {
    label: "Cơ quan được yêu cầu",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  "caseInitiationChangeRequest.requestChangeDecisionLine": {
    label: "Dòng yêu cầu thay đổi Quyết định",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh ra Quyết định thay đổi Quyết định khởi tố vụ án hình sự số 19/QĐ-CSĐT ngày 12/3/2026 với nội dung mới phù hợp;",
    control: "TEXTAREA",
    smart: {
      key: "caseInitiationChangeRequest.requestChangeDecisionLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Yêu cầu Cơ quan … ra Quyết định thay đổi QĐ khởi tố số … ngày …;",
    },
  },
  "recipients.primaryLine": {
    label: "Nơi nhận chính",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
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

const BM018_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "18/Yc-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 105, Điều 155, Điều 156 Bộ luật Tố tụng hình sự năm 2015;",
  "caseInitiationChangeRequest.considerationLine":
    "Qua kiểm sát hồ sơ vụ án và kết quả điều tra, xét thấy Quyết định khởi tố vụ án hình sự số 19/QĐ-CSĐT ngày 12/3/2026 có một số nội dung cần được thay đổi cho phù hợp với tài liệu, tình tiết mới phát sinh;",
  "caseInitiationChangeRequest.currentOffenseLegalLine":
    "Điều 168 Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017);",
  "caseInitiationChangeRequest.changeGroundLine":
    "Có tài liệu mới phát sinh làm thay đổi tình tiết, đối tượng và tội danh của vụ án; cần điều chỉnh để phù hợp với kết quả điều tra bổ sung;",
  "caseInitiationChangeRequest.newOffenseLegalLine":
    "Điều 174 Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017);",
  "caseInitiationChangeRequest.requestAuthorityLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "caseInitiationChangeRequest.requestChangeDecisionLine":
    "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh ra Quyết định thay đổi Quyết định khởi tố vụ án hình sự số 19/QĐ-CSĐT ngày 12/3/2026 với nội dung mới phù hợp;",
  "recipients.primaryLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM018_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-018",
  versionLabel:
    "BM-018 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM018_SECTIONS,
  fields: BM018_FIELDS,
  demo: BM018_DEMO,
};

registerRuntimeUxProfile(BM018_RUNTIME_UX_PROFILE);