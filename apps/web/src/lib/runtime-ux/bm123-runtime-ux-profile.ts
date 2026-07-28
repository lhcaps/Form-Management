/**
 * BM-123 runtime-ux curated profile.
 *
 * CURATION (batch next): QĐ thực nghiệm điều tra. Viện trưởng ra quyết định
 * thực nghiệm điều tra theo Điều 204 BLTTHS để kiểm sát viên chủ trì
 * tiến hành thực nghiệm điều tra.
 *
 * Workflow: decision → investigator assignment → procedures.
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

const BM123_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định thực nghiệm điều tra",
    description: "Thông tin quyết định thực nghiệm điều tra theo Điều 204 BLTTHS.",
  },
] as const;

const BM123_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định thực nghiệm điều tra",
    placeholder: "Số quyết định (ví dụ: 06/QĐ-VKS)",
  },
} as const;

const BM123_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "23/QĐ-VKSKV7",
} as const;

const BM123_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-123",
  versionLabel: `BM-123 runtime-ux batch 6 curated source-render profile`,
  sections: BM123_SECTIONS,
  fields: BM123_FIELDS,
  demo: BM123_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định thực nghiệm điều tra",
      description: "Thông tin quyết định thực nghiệm điều tra theo Điều 204 BLTTHS.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM123_RUNTIME_UX_PROFILE);
