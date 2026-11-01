/**
 * Curated runtime-ux profile for BM-035 — UI-only override metadata for the
 * standalone `/templates/BM-035` template page.
 *
 * Title: Quyết định huỷ bỏ Quyết định tạm giữ / gia hạn tạm giữ.
 *
 * Why this file exists
 * --------------------
 * BM-035 is one of the smallest contracts in the 213-form catalogue
 * (3 fields in a single section). The auto-generated placeholder still
 * carried the `(mẫu BM-035)` stale token — every demo value flagged by
 * `isKnownStaleFallback`. The contracted `document.issueDate` field is
 * labelled "Ngày ban hành" in the locked contract but was being
 * placeholder-filled with a `Địa điểm ..., ngày ... năm ...` string,
 * which mixed a Vietnamese legal-document notion into a date slot.
 *
 * This profile:
 *   - Drops the "(mẫu BM-035)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issueDate` so the operator picks a real date and the
 *     renderer formats the Vietnamese phrase.
 *   - Notes that `agency.parentNameUpper` is a COMPUTED field — the
 *     operator can still type the uppercase agency name here, even
 *     though the renderer reads `agency.parentName` as a derived view.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-035 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-035.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM035_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Tên cơ quan ban hành, số Quyết định, ngày ban hành.",
  },
] as const;

const BM035_FIELDS = {
  "agency.parentNameUpper": {
    label: "Tên cơ quan (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "document.documentCode": {
    label: "Số Quyết định",
    placeholder: "12/QĐ-VKSTP",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issueDate",
      kind: "issue-place-date-line",
      placeholder: "TP. Hồ Chí Minh",
      derivedTargets: ["document.issueDate"],
    },
  },
} as const;

const BM035_DEMO = {
  "agency.parentNameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "document.documentCode": "12/QĐ-VKSTP",
  "document.issueDate":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
} as const;

const BM035_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-035",
  versionLabel:
    "BM-035 curated batch (issue-place-date-line smart, no stale tokens)",
  sections: BM035_SECTIONS,
  fields: BM035_FIELDS,
  demo: BM035_DEMO,
};

registerRuntimeUxProfile(BM035_RUNTIME_UX_PROFILE);
