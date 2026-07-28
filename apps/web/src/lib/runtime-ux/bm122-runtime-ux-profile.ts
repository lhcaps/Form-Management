/**
 * BM-122 runtime-ux curated profile.
 *
 * CURATION (batch next): QĐ không phê chuẩn Lệnh thu giữ thư tín, điện tín,
 * bưu kiện, bưu phẩm. Viện trưởng không phê chuẩn lệnh thu giữ thư tín
 * điện tín theo Điều 192 BLTTHS.
 *
 * Workflow: phê chuẩn → authority/decision header.
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM122_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định không phê chuẩn",
    description: "Thông tin quyết định không phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm theo Điều 192 BLTTHS.",
  },
] as const;

const BM122_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định không phê chuẩn",
    placeholder: "Số quyết định (ví dụ: 05/QĐ-VKS)",
  },
} as const;

const BM122_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "22/QĐ-VKSKV7",
} as const;

const BM122_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-122",
  versionLabel: `BM-122 runtime-ux batch 6 curated source-render profile`,
  sections: BM122_SECTIONS,
  fields: BM122_FIELDS,
  demo: BM122_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định không phê chuẩn",
      description: "Thông tin quyết định không phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm theo Điều 192 BLTTHS.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM122_RUNTIME_UX_PROFILE);
