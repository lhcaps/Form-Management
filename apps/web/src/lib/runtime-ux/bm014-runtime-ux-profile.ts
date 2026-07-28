/**
 * Curated runtime-ux profile for BM-014 — UI-only override metadata for the
 * standalone `/templates/BM-014` template page.
 *
 * Title: Quyết định trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn
 *        tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * BM-014 has 19 fields across 5 sections. The auto-generated profile
 * carried three issues:
 *   - placeholder/demo values contained "(mẫu BM-014)" — a stale token
 *     that travelled into the runtime preview,
 *   - `sourceDirectInspection.teamLeaderLine`, `member1Line`,
 *     `member2Line`, `additionalMembersLine` were all labelled with
 *     terse auto-generated labels rather than legal-doc team-section
 *     wording,
 *   - `signature.signMode` did not expose the `Ký thay / Ký thay mặt`
 *     common values as a select.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops placeholder "(mẫu BM-014)" from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the legal-basis and Điều 1 / Điều 3 / Điều 4 long blocks
 *     as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo with distinct synthetic names for
 *     the Trưởng đoàn / Thành viên / Kiểm sát viên ký roles.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-014 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-014.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM014_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description: "Cơ quan cấp trên, viện kiểm sát ban hành, số Quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-quyet-inh-kiem-sat-truc-tiep",
    title: "2. Nội dung Quyết định trực tiếp kiểm sát",
    description:
      "Chủ thể ban hành, căn cứ tố tụng, Điều 1 phạm vi/thời gian, Điều 3 yêu cầu chuẩn bị hồ sơ, Điều 4 kế hoạch kèm theo.",
  },
  {
    sectionId: "section-thanh-phan-oan-kiem-sat",
    title: "3. Thành phần Đoàn kiểm sát",
    description: "Trưởng đoàn, thành viên đoàn và các thành viên bổ sung (nếu có).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Nơi nhận chính, thành viên Đoàn kiểm sát và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Ký ban hành",
    description: "Chế độ ký, chức danh và họ tên người ký Quyết định.",
  },
] as const;

const BM014_FIELDS = {
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
    placeholder: "14/QĐ-VKSKV7",
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
    control: "TEXTAREA",
    smart: {
      key: "official.issuerTitle",
      kind: "textarea",
      rows: 2,
      placeholder: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    },
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ tố tụng",
    placeholder:
      "Căn cứ Điều 21, Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 21, Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    },
  },
  "sourceDirectInspection.article1Line": {
    label: "Điều 1 — Phạm vi và thời gian kiểm sát",
    placeholder:
      "Trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm tại Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh trong kỳ từ 01/01/2026 đến 30/6/2026 theo Kế hoạch số 15/KH-VKSKV7 ngày 04/7/2026;",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspection.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Trực tiếp kiểm sát việc tiếp nhận … trong kỳ …;",
    },
  },
  "sourceDirectInspection.teamLeaderLine": {
    label: "Trưởng đoàn kiểm sát",
    placeholder: "Ông Trần Văn Hùng — Kiểm sát viên trung cấp",
  },
  "sourceDirectInspection.member1Line": {
    label: "Thành viên thứ nhất",
    placeholder: "Ông Lê Minh Quân — Kiểm sát viên sơ cấp",
  },
  "sourceDirectInspection.member2Line": {
    label: "Thành viên thứ hai",
    placeholder: "Bà Ngô Thị Lan — Kiểm tra viên",
  },
  "sourceDirectInspection.additionalMembersLine": {
    label: "Thành viên bổ sung",
    placeholder: "Ông Phạm Đức Anh — Cán bộ tiếp nhận",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspection.additionalMembersLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Ông Phạm Đức Anh — Cán bộ tiếp nhận",
    },
  },
  "sourceDirectInspection.article3Line": {
    label: "Điều 3 — Yêu cầu chuẩn bị hồ sơ",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh chuẩn bị hồ sơ tiếp nhận, giải quyết nguồn tin trong kỳ 01/01/2026 — 30/6/2026; sắp xếp buổi làm việc với Đoàn kiểm sát vào ngày 14/7/2026;",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspection.article3Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Yêu cầu Cơ quan Cảnh sát điều tra chuẩn bị …;",
    },
  },
  "sourceDirectInspection.article4Line": {
    label: "Điều 4 — Kế hoạch kèm theo",
    placeholder:
      "Kế hoạch trực tiếp kiểm sát số 15/KH-VKSKV7 ngày 04/7/2026 của Viện Kiểm sát nhân dân Khu vực 7 ban hành kèm theo Quyết định này;",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspection.article4Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Kế hoạch số 15/KH-VKSKV7 ngày 04/7/2026 kèm theo;",
    },
  },
  "recipients.primaryLine": {
    label: "Nơi nhận chính",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  },
  "recipients.teamMembersLine": {
    label: "Thành viên Đoàn kiểm sát",
    placeholder:
      "Ông Trần Văn Hùng — Trưởng đoàn; ông Lê Minh Quân; bà Ngô Thị Lan; ông Phạm Đức Anh;",
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

/**
 * BM-014 demo fixture — synthetic but realistic. Names mirror the BM-015
 * team so the two surfaces of the same inspection (Quyết định / Kế hoạch)
 * stay referentially consistent in any side-by-side review.
 */
const BM014_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "14/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle": "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 21, Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
  "sourceDirectInspection.article1Line":
    "Trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm tại Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh trong kỳ từ 01/01/2026 đến 30/6/2026 theo Kế hoạch số 15/KH-VKSKV7 ngày 04/7/2026;",
  "sourceDirectInspection.teamLeaderLine":
    "Ông Trần Văn Hùng — Kiểm sát viên trung cấp",
  "sourceDirectInspection.member1Line":
    "Ông Lê Minh Quân — Kiểm sát viên sơ cấp",
  "sourceDirectInspection.member2Line": "Bà Ngô Thị Lan — Kiểm tra viên",
  "sourceDirectInspection.additionalMembersLine":
    "Ông Phạm Đức Anh — Cán bộ tiếp nhận",
  "sourceDirectInspection.article3Line":
    "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh chuẩn bị hồ sơ tiếp nhận, giải quyết nguồn tin trong kỳ 01/01/2026 — 30/6/2026; sắp xếp buổi làm việc với Đoàn kiểm sát vào ngày 14/7/2026;",
  "sourceDirectInspection.article4Line":
    "Kế hoạch trực tiếp kiểm sát số 15/KH-VKSKV7 ngày 04/7/2026 của Viện Kiểm sát nhân dân Khu vực 7 ban hành kèm theo Quyết định này;",
  "recipients.primaryLine": "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.teamMembersLine":
    "Ông Trần Văn Hùng — Trưởng đoàn; ông Lê Minh Quân; bà Ngô Thị Lan; ông Phạm Đức Anh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM014_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-014",
  versionLabel:
    "BM-014 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM014_SECTIONS,
  fields: BM014_FIELDS,
  demo: BM014_DEMO,
};

registerRuntimeUxProfile(BM014_RUNTIME_UX_PROFILE);
