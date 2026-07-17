/**
 * Curated runtime-ux profile for BM-094.
 *
 * 5 fields — QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố bị can.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-094)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM094_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Viện kiểm sát ban hành, số quyết định, địa danh, ngày ban hành, đơn vị địa phương.",
  },
] as const;

const BM094_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    smart: {
      key: "agency.vienKiem",
      kind: "text",
    },
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "66/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định huỷ bỏ QĐ bổ sung QĐ khởi tố bị can.",
    smart: {
      key: "document.soQuyet",
      kind: "text",
    },
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Thành phố Hồ Chí Minh",
    smart: {
      key: "agency.diaDanh",
      kind: "text",
    },
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "2026-07-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
    smart: {
      key: "document.ngayBan",
      kind: "date",
    },
  },
  "agency.dongDia": {
    label: "Đơn vị địa phương",
    placeholder: "Thành phố Hồ Chí Minh",
    smart: {
      key: "agency.dongDia",
      kind: "text",
    },
  },
} as const;

const BM094_DEMO = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.soQuyet": "66/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "2026-07-04",
  "agency.dongDia": "Thành phố Hồ Chí Minh",
} as const;

const BM094_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-094",
  versionLabel:
    "BM-094 curated batch 4 — QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố bị can",
  sections: BM094_SECTIONS,
  fields: BM094_FIELDS,
  demo: BM094_DEMO,
};

registerRuntimeUxProfile(BM094_RUNTIME_UX_PROFILE);
