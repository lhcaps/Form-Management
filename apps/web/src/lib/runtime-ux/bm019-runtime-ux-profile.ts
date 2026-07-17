/**
 * Curated runtime-ux profile for BM-019 — UI-only override metadata for the
 * standalone `/templates/BM-019` template page.
 *
 * Title: Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự.
 *
 * Why this file exists
 * --------------------
 * BM-019 has 17 fields across 5 sections. The auto-generated profile
 * shipped "(mẫu BM-019)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-019), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and carries a `Quyết định và tội
 * danh ban đầu` section that references a prior initiation decision
 * triplet.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-019)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo referencing a prior
 *     `khởi tố số 19/QĐ-CSĐT` decision.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-019 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-019.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM019_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số yêu cầu, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-yeu-cau-bo-sung-khoi-to",
    title: "2. Nội dung yêu cầu bổ sung khởi tố",
    description: "Tội danh cần khởi tố bổ sung, điều khoản tương ứng và cơ quan được yêu cầu.",
  },
  {
    sectionId: "section-quyet-inh-va-toi-danh-ban-au",
    title: "3. Quyết định và tội danh ban đầu",
    description:
      "Số QĐ khởi tố ban đầu, ngày ban hành, cơ quan ban hành, tội danh đã khởi tố và điều khoản áp dụng.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và người ký yêu cầu.",
  },
] as const;

const BM019_FIELDS = {
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
    placeholder: "19/Yc-VKSKV7",
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
  "initiationRequest.originatingDecisionCode": {
    label: "Số Quyết định khởi tố ban đầu",
    placeholder: "19/QĐ-CSĐT",
  },
  "initiationRequest.originatingDecisionDateText": {
    label: "Ngày Quyết định khởi tố ban đầu",
    placeholder: "ngày 12 tháng 3 năm 2026",
  },
  "initiationRequest.originatingIssuerName": {
    label: "Cơ quan ra Quyết định khởi tố ban đầu",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  "initiationRequest.originalOffenseName": {
    label: "Tội danh đã khởi tố",
    placeholder: "Cố ý gây thương tích",
  },
  "initiationRequest.originalLegalArticle": {
    label: "Điều khoản của tội danh đã khởi tố",
    placeholder: "Điều 134 Bộ luật Hình sự năm 2015;",
  },
  "initiationRequest.additionalOffenseName": {
    label: "Tội danh cần khởi tố bổ sung",
    placeholder: "Gây rối trật tự công cộng",
  },
  "initiationRequest.additionalLegalArticle": {
    label: "Điều khoản của tội danh cần bổ sung",
    placeholder: "Điều 318 Bộ luật Hình sự năm 2015;",
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

const BM019_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "19/Yc-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "initiationRequest.originatingDecisionCode": "19/QĐ-CSĐT",
  "initiationRequest.originatingDecisionDateText":
    "ngày 12 tháng 3 năm 2026",
  "initiationRequest.originatingIssuerName":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "initiationRequest.originalOffenseName": "Cố ý gây thương tích",
  "initiationRequest.originalLegalArticle":
    "Điều 134 Bộ luật Hình sự năm 2015;",
  "initiationRequest.additionalOffenseName": "Gây rối trật tự công cộng",
  "initiationRequest.additionalLegalArticle":
    "Điều 318 Bộ luật Hình sự năm 2015;",
  "initiationRequest.orderedAuthorityName":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM019_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-019",
  versionLabel:
    "BM-019 curated batch (issue-place-date-line + select smarts, no stale tokens)",
  sections: BM019_SECTIONS,
  fields: BM019_FIELDS,
  demo: BM019_DEMO,
};

registerRuntimeUxProfile(BM019_RUNTIME_UX_PROFILE);