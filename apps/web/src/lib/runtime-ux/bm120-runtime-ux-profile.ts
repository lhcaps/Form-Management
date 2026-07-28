/**
 * BM-120 runtime-ux curated profile.
 *
 * CURATION (batch next): QĐ không phê chuẩn Lệnh khám xét.
 * Workflow: không phê chuẩn → authority/decision header.
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM120_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định không phê chuẩn Lệnh khám xét",
    description: "Cơ quan ban hành quyết định không phê chuẩn Lệnh khám xét.",
  },
] as const;

const BM120_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định không phê chuẩn",
    placeholder: "Số quyết định (ví dụ: 13/QĐ-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày tháng năm ký quyết định",
  },
} as const;

const BM120_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "13/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "16/07/2026",
} as const;

const BM120_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-120",
  versionLabel: `BM-120 Quyết định không phê chuẩn Lệnh khám xét`,
  sections: BM120_SECTIONS,
  fields: BM120_FIELDS,
  demo: BM120_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định không phê chuẩn Lệnh khám xét",
      description: "Cơ quan ban hành quyết định không phê chuẩn Lệnh khám xét.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM120_RUNTIME_UX_PROFILE);
