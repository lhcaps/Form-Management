/**
 * BM-034 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-034 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: QĐ không phê chuẩn QĐ gia hạn tạm giữ
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS via Batch 9 source/render smoke
 * only. Browser/demo/preview/DOCX/fidelity/visual/human evidence
 * remains NOT_RUN for Batch 9.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM034_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Quyết định không phê chuẩn gia hạn tạm giữ",
    description:
      "Viện kiểm sát cấp trên, số, địa danh và ngày ban hành quyết định không phê chuẩn việc gia hạn tạm giữ.",
  }
] as const;

const BM034_FIELDS = {
  "agency.parentNameUpper": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao"
  },
  "document.documentCode": {
    label: "Số quyết định không phê chuẩn",
    placeholder: "82/QĐ-VKS"
  },
  "agency.issuePlace": {
    label: "Địa danh ban hành",
    placeholder: "Hà Nội"
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "ngày 04 tháng 3 năm 2026"
  }
} as const;

const BM034_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper": "Viện Kiểm sát nhân dân tối cao",
  "document.documentCode": "82/QĐ-VKS",
  "agency.issuePlace": "Hà Nội",
  "document.issueDate": "ngày 04 tháng 3 năm 2026"
} as const;

const BM034_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-034",
  versionLabel: `BM-034 runtime-ux batch 9 curated source-render profile`,
  sections: BM034_SECTIONS,
  fields: BM034_FIELDS,
  demo: BM034_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM034_RUNTIME_UX_PROFILE);
