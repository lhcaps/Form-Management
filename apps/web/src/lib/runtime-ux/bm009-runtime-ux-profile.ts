/**
 * Curated runtime-ux profile for BM-009 — UI-only override metadata for the
 * standalone `/templates/BM-009` template page.
 *
 * Title: QĐ gia hạn thời hạn giải quyết nguồn tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * BM-009 has 16 fields across 5 sections. The auto-generated profile
 * shipped "(mẫu BM-009)" stale tokens into every demo value and
 * labelled the multi-article Điều 1 / Điều 2 body tersely. The contract
 * supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and long-text slots for the
 * `sourceResolutionExtension.*` body lines.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-009)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the legal-basis / reason / Điều 1 / Điều 2 long blocks as
 *     `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo with distinct legal-basis triplets.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-009 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-009.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM009_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số Quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-va-ly-do-gia-han",
    title: "2. Căn cứ và lý do gia hạn",
    description:
      "Căn cứ tố tụng, căn cứ tiếp nhận nguồn tin, căn cứ văn bản đề nghị và nhận định gia hạn.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung Quyết định",
    description: "Điều 1 (gia hạn) và Điều 2 (cơ quan thụ hưởng).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan đề nghị / cơ quan điều tra nhận Quyết định và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức danh và người ký Quyết định.",
  },
] as const;

const BM009_FIELDS = {
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
    placeholder: "09/QĐ-VKSKV7",
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
  "sourceResolutionExtension.procedureArticlesLine": {
    label: "Căn cứ tố tụng",
    placeholder:
      "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionExtension.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    },
  },
  "sourceResolutionExtension.receptionLegalBasisLine": {
    label: "Căn cứ tiếp nhận nguồn tin",
    placeholder:
      "Theo nguồn tin về tội phạm số 12/NT-TTTP ngày 15/01/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionExtension.receptionLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Theo nguồn tin về tội phạm số … ngày … của …;",
    },
  },
  "sourceResolutionExtension.proposalLegalBasisLine": {
    label: "Căn cứ văn bản đề nghị",
    placeholder:
      "Theo đề nghị của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tại Công văn số 215/CV-CSĐT ngày 30/6/2026;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionExtension.proposalLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Theo đề nghị của … tại Công văn số … ngày …;",
    },
  },
  "sourceResolutionExtension.reasonLine": {
    label: "Nhận định gia hạn",
    placeholder:
      "Xét thấy nguồn tin về tội phạm có nhiều tình tiết phức tạp, cần thêm thời gian để kiểm tra, xác minh làm rõ trước khi ra Quyết định giải quyết nguồn tin;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionExtension.reasonLine",
      kind: "textarea",
      rows: 4,
      placeholder: "Xét thấy nguồn tin có nhiều tình tiết phức tạp, cần thêm thời gian …;",
    },
  },
  "sourceResolutionExtension.article1Line": {
    label: "Điều 1 — Gia hạn giải quyết nguồn tin",
    placeholder:
      "Gia hạn thời hạn giải quyết nguồn tin về tội phạm số 12/NT-TTTP ngày 15/01/2026 thêm 15 ngày, kể từ ngày 01/7/2026 đến ngày 15/7/2026;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionExtension.article1Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Gia hạn thời hạn giải quyết nguồn tin thêm … ngày, kể từ … đến …;",
    },
  },
  "sourceResolutionExtension.article2Line": {
    label: "Điều 2 — Trách nhiệm thi hành",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh có trách nhiệm tổ chức kiểm tra, xác minh và ra Quyết định giải quyết nguồn tin trong thời hạn nêu tại Điều 1;",
    control: "TEXTAREA",
    smart: {
      key: "sourceResolutionExtension.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Cơ quan … có trách nhiệm tổ chức kiểm tra, xác minh …;",
    },
  },
  "sourceResolutionExtension.requestingAgencyRecipientLine": {
    label: "Cơ quan đề nghị hoặc cơ quan điều tra nhận QĐ",
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
    label: "Chức danh người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Trần Văn Hùng",
  },
} as const;

const BM009_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "09/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "sourceResolutionExtension.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
  "sourceResolutionExtension.receptionLegalBasisLine":
    "Theo nguồn tin về tội phạm số 12/NT-TTTP ngày 15/01/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "sourceResolutionExtension.proposalLegalBasisLine":
    "Theo đề nghị của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tại Công văn số 215/CV-CSĐT ngày 30/6/2026;",
  "sourceResolutionExtension.reasonLine":
    "Xét thấy nguồn tin về tội phạm có nhiều tình tiết phức tạp, cần thêm thời gian để kiểm tra, xác minh làm rõ trước khi ra Quyết định giải quyết nguồn tin;",
  "sourceResolutionExtension.article1Line":
    "Gia hạn thời hạn giải quyết nguồn tin về tội phạm số 12/NT-TTTP ngày 15/01/2026 thêm 15 ngày, kể từ ngày 01/7/2026 đến ngày 15/7/2026;",
  "sourceResolutionExtension.article2Line":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh có trách nhiệm tổ chức kiểm tra, xác minh và ra Quyết định giải quyết nguồn tin trong thời hạn nêu tại Điều 1;",
  "sourceResolutionExtension.requestingAgencyRecipientLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM009_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-009",
  versionLabel:
    "BM-009 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM009_SECTIONS,
  fields: BM009_FIELDS,
  demo: BM009_DEMO,
};

registerRuntimeUxProfile(BM009_RUNTIME_UX_PROFILE);