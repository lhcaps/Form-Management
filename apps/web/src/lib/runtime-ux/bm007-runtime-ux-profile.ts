/**
 * Curated runtime-ux profile for BM-007 — UI-only override metadata for the
 * standalone `/templates/BM-007` template page.
 *
 * Title: Yêu cầu cung cấp tài liệu để kiểm sát việc giải quyết nguồn
 *        tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * BM-007 has 17 fields across 4 sections. The auto-generated profile
 * shipped "(mẫu BM-007)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-007), ngày ...` line for every date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine`, three separate `documentItemNLine`
 * slots for the requested materials, and a long `article1Line` body.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-007)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long legal-basis / article 1 / reason / deadline blocks
 *     as `TEXTAREA`.
 *   - Ships a safe synthetic demo with three distinct document items.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-007 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-007.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM007_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số yêu cầu, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-chu-the-va-can-cu",
    title: "2. Chủ thể và căn cứ",
    description: "Chủ thể ban hành yêu cầu và căn cứ tố tụng áp dụng.",
  },
  {
    sectionId: "section-noi-dung-yeu-cau",
    title: "3. Nội dung yêu cầu cung cấp tài liệu",
    description:
      "Lý do yêu cầu, Điều 1 về phạm vi, danh mục tài liệu cần cung cấp và thời hạn cung cấp.",
  },
  {
    sectionId: "section-noi-nhan-va-chu-ky",
    title: "4. Nơi nhận và chữ ký",
    description: "Nơi nhận chính, dòng lưu hồ sơ, chức danh và người ký.",
  },
] as const;

const BM007_FIELDS = {
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
    placeholder: "44/Yc-VKSKV7",
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
  "sourceMaterialRequest.reasonLine": {
    label: "Lý do yêu cầu",
    placeholder:
      "Để phục vụ công tác kiểm sát việc giải quyết nguồn tin về tội phạm tại đơn vị, Viện Kiểm sát nhân dân Khu vực 7 cần cung cấp các tài liệu sau đây;",
    control: "TEXTAREA",
    smart: {
      key: "sourceMaterialRequest.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Để phục vụ công tác kiểm sát …, cần cung cấp các tài liệu sau;",
    },
  },
  "sourceMaterialRequest.article1Line": {
    label: "Điều 1 — Yêu cầu cung cấp",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh cung cấp các tài liệu liên quan đến việc tiếp nhận, giải quyết nguồn tin về tội phạm trong năm 2026;",
    control: "TEXTAREA",
    smart: {
      key: "sourceMaterialRequest.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Yêu cầu cung cấp các tài liệu liên quan … trong năm 2026;",
    },
  },
  "sourceMaterialRequest.documentItem1Line": {
    label: "Tài liệu thứ nhất",
    placeholder:
      "Bản sao các văn bản tiếp nhận nguồn tin từ ngày 01/01/2026 đến ngày 30/6/2026;",
  },
  "sourceMaterialRequest.documentItem2Line": {
    label: "Tài liệu thứ hai",
    placeholder:
      "Bản sao các Quyết định giải quyết nguồn tin đã ban hành trong kỳ;",
  },
  "sourceMaterialRequest.documentItem3Line": {
    label: "Tài liệu thứ ba",
    placeholder: "Báo cáo tổng kết công tác tiếp nhận, giải quyết nguồn tin 6 tháng đầu năm 2026;",
  },
  "sourceMaterialRequest.additionalDocumentItemsLine": {
    label: "Tài liệu bổ sung",
    placeholder: "Các tài liệu khác có liên quan phát sinh trong quá trình cung cấp (nếu có);",
  },
  "sourceMaterialRequest.deadlineLine": {
    label: "Thời hạn cung cấp",
    placeholder:
      "Thời hạn cung cấp: trong vòng 15 ngày kể từ ngày nhận được yêu cầu;",
    control: "TEXTAREA",
    smart: {
      key: "sourceMaterialRequest.deadlineLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Thời hạn cung cấp: trong vòng 15 ngày kể từ ngày nhận được yêu cầu;",
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
  "signature.positionTitle": {
    label: "Chức danh người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Trần Văn Hùng",
  },
} as const;

const BM007_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "44/Yc-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
  "sourceMaterialRequest.reasonLine":
    "Để phục vụ công tác kiểm sát việc giải quyết nguồn tin về tội phạm tại đơn vị, Viện Kiểm sát nhân dân Khu vực 7 cần cung cấp các tài liệu sau đây;",
  "sourceMaterialRequest.article1Line":
    "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh cung cấp các tài liệu liên quan đến việc tiếp nhận, giải quyết nguồn tin về tội phạm trong năm 2026;",
  "sourceMaterialRequest.documentItem1Line":
    "Bản sao các văn bản tiếp nhận nguồn tin từ ngày 01/01/2026 đến ngày 30/6/2026;",
  "sourceMaterialRequest.documentItem2Line":
    "Bản sao các Quyết định giải quyết nguồn tin đã ban hành trong kỳ;",
  "sourceMaterialRequest.documentItem3Line":
    "Báo cáo tổng kết công tác tiếp nhận, giải quyết nguồn tin 6 tháng đầu năm 2026;",
  "sourceMaterialRequest.additionalDocumentItemsLine":
    "Các tài liệu khác có liên quan phát sinh trong quá trình cung cấp (nếu có);",
  "sourceMaterialRequest.deadlineLine":
    "Thời hạn cung cấp: trong vòng 15 ngày kể từ ngày nhận được yêu cầu;",
  "recipients.primaryLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM007_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-007",
  versionLabel:
    "BM-007 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM007_SECTIONS,
  fields: BM007_FIELDS,
  demo: BM007_DEMO,
};

registerRuntimeUxProfile(BM007_RUNTIME_UX_PROFILE);