/**
 * Curated runtime-ux profile for BM-060.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM060_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Thông tin cơ quan, số văn bản, địa điểm và ngày lập.",
  },
] as const;

const BM060_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "01/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định áp giải bị can.",
  },
  "decision.decisionLine10": {
    label: "Địa điểm, ngày lập",
    placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "decision.decisionLine10",
      kind: "textarea",
      rows: 2,
      placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    },
  },
} as const;

const BM060_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.fullDocumentCode": "01/QĐ-VKSKV7",
  "decision.decisionLine10":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
} as const;

const BM060_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-060",
  versionLabel:
    "BM-060 curated batch 3 — no stale tokens, real demo values",
  sections: BM060_SECTIONS,
  fields: BM060_FIELDS,
  demo: BM060_DEMO,
};

registerRuntimeUxProfile(BM060_RUNTIME_UX_PROFILE);
