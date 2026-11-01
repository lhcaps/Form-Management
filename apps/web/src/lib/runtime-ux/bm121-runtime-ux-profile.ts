/**
 * BM-121 runtime-ux curated profile.
 *
 * CURATION (batch next): QĐ phê chuẩn Lệnh thu giữ thư tín, điện tín,
 * bưu kiện, bưu phẩm.
 * Workflow: phê chuẩn thu giữ → authority/decision header.
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

const BM121_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định phê chuẩn Lệnh thu giữ",
    description: "Cơ quan ban hành quyết định phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm.",
  },
] as const;

const BM121_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định phê chuẩn",
    placeholder: "Số quyết định (ví dụ: 21/QĐ-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
} as const;

const BM121_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "21/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
} as const;

const BM121_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-121",
  versionLabel: `BM-121 Quyết định phê chuẩn Lệnh thu giữ`,
  sections: BM121_SECTIONS,
  fields: BM121_FIELDS,
  demo: BM121_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định phê chuẩn Lệnh thu giữ",
      description: "Cơ quan ban hành quyết định phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM121_RUNTIME_UX_PROFILE);
