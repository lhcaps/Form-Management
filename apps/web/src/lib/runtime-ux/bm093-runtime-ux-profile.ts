/**
 * Curated runtime-ux profile for BM-093.
 *
 * 4 fields — QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố bị can.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-093)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM093_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description: "Viện kiểm sát ban hành, số quyết định, địa danh, ngày ban hành.",
  },
] as const;

const BM093_FIELDS = {
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
    placeholder: "65/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định huỷ bỏ QĐ thay đổi QĐ khởi tố bị can.",
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
} as const;

const BM093_DEMO = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.soQuyet": "65/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "2026-07-04",
} as const;

const BM093_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-093",
  versionLabel:
    "BM-093 curated batch 4 — QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố bị can",
  sections: BM093_SECTIONS,
  fields: BM093_FIELDS,
  demo: BM093_DEMO,
};

registerRuntimeUxProfile(BM093_RUNTIME_UX_PROFILE);
