/**
 * BM-124 runtime-ux curated profile.
 *
 * CURATION (batch next): Biên bản thực nghiệm điều tra. Biên bản ghi nhận
 * việc thực hiện thực nghiệm điều tra theo QĐ thực nghiệm điều tra (BM-123).
 * Căn cứ Điều 178 và Điều 204 BLTTHS.
 *
 * Workflow: biên bản → procedural record → signatures.
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

const BM124_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Biên bản thực nghiệm điều tra",
    description: "Biên bản ghi nhận việc thực hiện thực nghiệm điều tra theo QĐ thực nghiệm điều tra (BM-123), căn cứ Điều 178 và Điều 204 BLTTHS.",
  },
] as const;

const BM124_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định thực nghiệm",
    placeholder: "Viện kiểm sát nhân dân...",
  },
} as const;

const BM124_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
} as const;

const BM124_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-124",
  versionLabel: `BM-124 runtime-ux batch 6 curated source-render profile`,
  sections: BM124_SECTIONS,
  fields: BM124_FIELDS,
  demo: BM124_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Biên bản thực nghiệm điều tra",
      description: "Biên bản ghi nhận việc thực hiện thực nghiệm điều tra theo QĐ thực nghiệm điều tra (BM-123), căn cứ Điều 178 và Điều 204 BLTTHS.",
      fieldKeys: [
        "agency.vienKiem",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM124_RUNTIME_UX_PROFILE);
