/**
 * BM-119 runtime-ux curated profile.
 *
 * CURATION (batch next): QĐ phê chuẩn Lệnh khám xét.
 * Workflow: phê chuẩn → authority/decision header.
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

const BM119_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định phê chuẩn Lệnh khám xét",
    description: "Cơ quan ban hành quyết định phê chuẩn Lệnh khám xét.",
  },
] as const;

const BM119_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định phê chuẩn",
    placeholder: "Số quyết định (ví dụ: 12/QĐ-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày tháng năm ký quyết định",
  },
  "agency.dongDia": {
    label: "Dòng địa danh và ngày ban hành",
    placeholder: "Địa danh, ngày...tháng...năm...",
  },
} as const;

const BM119_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "12/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
} as const;

const BM119_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-119",
  versionLabel: `BM-119 Quyết định phê chuẩn Lệnh khám xét`,
  sections: BM119_SECTIONS,
  fields: BM119_FIELDS,
  demo: BM119_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định phê chuẩn Lệnh khám xét",
      description: "Cơ quan ban hành quyết định phê chuẩn Lệnh khám xét.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM119_RUNTIME_UX_PROFILE);
