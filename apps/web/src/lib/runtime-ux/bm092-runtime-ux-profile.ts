/**
 * Curated runtime-ux profile for BM-092.
 *
 * 4 fields — QĐ phê chuẩn QĐ bổ sung QĐ khởi tố bị can.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-092)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM092_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description: "Viện kiểm sát ban hành, số quyết định, địa danh, ngày ban hành.",
  },
] as const;

const BM092_FIELDS = {
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
    placeholder: "64/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định phê chuẩn QĐ bổ sung QĐ khởi tố bị can.",
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

const BM092_DEMO = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.soQuyet": "64/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "2026-07-04",
} as const;

const BM092_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-092",
  versionLabel:
    "BM-092 curated batch 4 — QĐ phê chuẩn QĐ bổ sung QĐ khởi tố bị can",
  sections: BM092_SECTIONS,
  fields: BM092_FIELDS,
  demo: BM092_DEMO,
};

registerRuntimeUxProfile(BM092_RUNTIME_UX_PROFILE);
