/**
 * Curated runtime-ux profile for BM-087.
 *
 * 7 fields — Yêu cầu điều tra.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-087)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM087_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Viện kiểm sát ban hành, số yêu cầu, địa danh, ngày ban hành, chủ thể ban hành, căn cứ, cơ quan nhận.",
  },
] as const;

const BM087_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.soQuyet": {
    label: "Số yêu cầu điều tra",
    placeholder: "61/YC-VKSKV7",
    helpText: "Số ký hiệu của yêu cầu điều tra gửi cơ quan có thẩm quyền.",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Thành phố Hồ Chí Minh",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "2026-07-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "document.chuThe": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  },
  "legalBasis.canCu": {
    label: "Căn cứ yêu cầu điều tra",
    placeholder:
      "Căn cứ Điều 154, 155 Bộ luật Tố tụng hình sự năm 2015; hồ sơ vụ án hình sự số 07/2026/HSST.",
    smart: {
      key: "legalBasis.canCu",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 154, 155 Bộ luật Tố tụng hình sự năm 2015; hồ sơ vụ án hình sự số 07/2026/HSST.",
    },
  },
  "agency.coQuan": {
    label: "Cơ quan nhận yêu cầu",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
} as const;

const BM087_DEMO = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.soQuyet": "61/YC-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "2026-07-04",
  "document.chuThe": "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "legalBasis.canCu":
    "Căn cứ Điều 154, 155 Bộ luật Tố tụng hình sự năm 2015; hồ sơ vụ án hình sự số 07/2026/HSST.",
  "agency.coQuan": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
} as const;

const BM087_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-087",
  versionLabel: "BM-087 curated batch 4 — Yêu cầu điều tra",
  sections: BM087_SECTIONS,
  fields: BM087_FIELDS,
  demo: BM087_DEMO,
};

registerRuntimeUxProfile(BM087_RUNTIME_UX_PROFILE);
