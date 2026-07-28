/**
 * Curated runtime-ux profile for BM-072.
 *
 * 5 fields — QĐ thay đổi Thủ trưởng / Phó Thủ trưởng Cơ quan điều tra.
 *
 * NOTE: BM-072 uses non-standard compound keys (agency.coQuan,
 * agency.diaDanh, document.dienThoai, document.soQuyet) which are
 * derived from the compiled contract. Labels and demo values are
 * curated from the contract shape without mutation.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-072)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM072_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin cơ quan, số điện thoại, chức danh, số quyết định.",
  },
] as const;

const BM072_FIELDS = {
  "agency.coQuan": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Thành phố Hồ Chí Minh",
  },
  "document.dienThoai": {
    label: "Số điện thoại",
    placeholder: "028 3829 1234",
  },
  "signature.positionTitle": {
    label: "Chức danh",
    placeholder: "Viện trưởng",
    smart: {
      key: "signature.positionTitle",
      kind: "textarea",
      rows: 2,
      placeholder: "Viện trưởng",
    },
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "12/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định thay đổi Thủ trưởng.",
  },
} as const;

const BM072_DEMO = {
  "agency.coQuan": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.dienThoai": "028 3829 1234",
  "signature.positionTitle": "Viện trưởng",
  "document.soQuyet": "12/QĐ-VKSKV7",
} as const;

const BM072_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-072",
  versionLabel:
    "BM-072 curated batch 3 — no stale tokens, real demo values",
  sections: BM072_SECTIONS,
  fields: BM072_FIELDS,
  demo: BM072_DEMO,
};

registerRuntimeUxProfile(BM072_RUNTIME_UX_PROFILE);
