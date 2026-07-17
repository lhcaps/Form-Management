/**
 * Curated runtime-ux profile for BM-022 — UI-only override metadata for the
 * standalone `/templates/BM-022` template page.
 *
 * Title: Quyết định huỷ bỏ Quyết định không khởi tố vụ án hình sự.
 *
 * Why this file exists
 * --------------------
 * BM-022 has only 4 fields and 2 sections. The auto-generated profile
 * shipped two bugs:
 *   - `section-agency` title was the English string `"agency"`. The
 *     Vietnamese operator would see an untranslated section header.
 *   - Placeholder text contained "(mẫu BM-022)" — a stale token that
 *     travels into the preview payload.
 *
 * This profile:
 *   - Translates `section-agency` → "Tên cơ quan ban hành".
 *   - Drops the "(mẫu BM-022)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine` for the place+date line.
 *   - Ships a safe synthetic demo with realistic Vietnamese synthetic
 *     names (no PII; the BM-022 contract still tags the document
 *     number field `document.issuePlaceAndDateLine` — quirk in the
 *     locked contract; we keep it and treat as "Số QĐ").
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-022 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-022.compiled.json`
 *   (Note: the compiled `document.issuePlaceAndDateLine` is mapped to
 *    a slot whose locked-contract label is "Số quyết định". We honour
 *    the locked-contract label here so the operator sees the same
 *    intent as the printed form.)
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM022_SECTIONS = [
  {
    sectionId: "section-agency",
    title: "Tên cơ quan ban hành",
    description: "Tên viện kiểm sát ban hành Quyết định, viết hoa theo thể thức văn bản.",
  },
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Tên cơ quan cấp trên, số Quyết định và họ tên đương sự trên Quyết định huỷ bỏ.",
  },
] as const;

const BM022_FIELDS = {
  "agency.nameUpper": {
    label: "Tên cơ quan ban hành (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "agency.parentNameUpper": {
    label: "Tên cơ quan cấp trên (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "document.issuePlaceAndDateLine": {
    label: "Số Quyết định",
    placeholder: "08/QĐ-VKSKV7",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "TP. Hồ Chí Minh",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "person.fullName": {
    label: "Họ tên đương sự",
    placeholder: "Lê Minh Quân",
  },
} as const;

const BM022_DEMO = {
  "agency.nameUpper": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.parentNameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "document.issuePlaceAndDateLine": "08/QĐ-VKSKV7",
  "person.fullName": "Lê Minh Quân",
} as const;

const BM022_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-022",
  versionLabel:
    "BM-022 curated batch (translated section-agency title, issue-place-date-line smart, no stale tokens)",
  sections: BM022_SECTIONS,
  fields: BM022_FIELDS,
  demo: BM022_DEMO,
};

registerRuntimeUxProfile(BM022_RUNTIME_UX_PROFILE);
