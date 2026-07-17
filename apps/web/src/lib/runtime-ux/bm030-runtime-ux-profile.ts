/**
 * Curated runtime-ux profile for BM-030 — UI-only override metadata for the
 * standalone `/templates/BM-030` template page.
 *
 * Title: Thông báo kết quả giải quyết nguồn tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * BM-030 has 14 fields across 5 sections. The auto-generated profile
 * shipped "(mẫu BM-030)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-030), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * `legalBasis.procedureArticlesLine` and `sourceResolutionNotice.*`
 * body lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-030)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long legal-basis and `sourceResolutionNotice.*`
 *     body lines as `TEXTAREA`.
 *   - Ships a safe synthetic demo.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-030 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-030.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM030_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số thông báo, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-nguoi-nhan-thong-bao",
    title: "2. Người nhận thông báo",
    description: "Kính gửi người nhận thông báo và người được thông báo.",
  },
  {
    sectionId: "section-noi-dung-thong-bao",
    title: "3. Nội dung thông báo",
    description:
      "Căn cứ pháp lý, hành động của Viện kiểm sát, thông tin nguồn tin và kết quả giải quyết.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Nơi nhận bản thông báo và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chức danh và người ký thông báo.",
  },
] as const;

const BM030_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số thông báo",
    placeholder: "30/TB-VKSKV7",
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
  "recipients.primaryLine": {
    label: "Kính gửi",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ pháp lý",
    placeholder:
      "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    },
  },
  "sourceResolutionNotice.agencyActionLine": {
    label: "Viện kiểm sát thông báo",
    placeholder:
      "Viện Kiểm sát nhân dân Khu vực 7 đã xem xét nguồn tin về tội phạm và ra Quyết định giải quyết nguồn tin theo thẩm quyền;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionNotice.agencyActionLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Viện Kiểm sát nhân dân Khu vực 7 đã … và ra Quyết định giải quyết …;",
    },
  },
  "sourceResolutionNotice.noticeRecipientLine": {
    label: "Người được thông báo",
    placeholder: "Ông Lê Minh Quân — đại diện cho Cơ quan Cảnh sát điều tra Công an TP. Thủ Đức",
  },
  "sourceResolutionNotice.sourceInfoLine": {
    label: "Dòng thông tin nguồn tin",
    placeholder:
      "Nguồn tin về tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionNotice.sourceInfoLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Nguồn tin về tội phạm xảy ra … tại …;",
    },
  },
  "sourceResolutionNotice.resolutionResultLine": {
    label: "Dòng kết quả giải quyết",
    placeholder:
      "Đã ra Quyết định không khởi tố vụ án hình sự số 30/QĐ-VKSKV7 ngày 04/7/2026 do hành vi không cấu thành tội phạm;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionNotice.resolutionResultLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Đã ra Quyết định không khởi tố vụ án số … ngày … do …;",
    },
  },
  "recipients.copyLine": {
    label: "Nơi nhận bản thông báo",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Thủ Đức (để biết);",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
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

const BM030_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "30/TB-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "recipients.primaryLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
  "sourceResolutionNotice.agencyActionLine":
    "Viện Kiểm sát nhân dân Khu vực 7 đã xem xét nguồn tin về tội phạm và ra Quyết định giải quyết nguồn tin theo thẩm quyền;",
  "sourceResolutionNotice.noticeRecipientLine":
    "Ông Lê Minh Quân — đại diện cho Cơ quan Cảnh sát điều tra Công an TP. Thủ Đức",
  "sourceResolutionNotice.sourceInfoLine":
    "Nguồn tin về tội phạm xảy ra ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, TP. Hồ Chí Minh;",
  "sourceResolutionNotice.resolutionResultLine":
    "Đã ra Quyết định không khởi tố vụ án hình sự số 30/QĐ-VKSKV7 ngày 04/7/2026 do hành vi không cấu thành tội phạm;",
  "recipients.copyLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Thủ Đức (để biết);",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM030_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-030",
  versionLabel:
    "BM-030 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM030_SECTIONS,
  fields: BM030_FIELDS,
  demo: BM030_DEMO,
};

registerRuntimeUxProfile(BM030_RUNTIME_UX_PROFILE);