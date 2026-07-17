/**
 * BM-026 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-026 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: QĐ huỷ bỏ QĐ khởi tố vụ án hình sự
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

const BM026_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM026_FIELDS = {
  "agency.parentNameUpper": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao"
  },
  "agency.nameUpper": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "document.documentCode": {
    label: "Số văn bản",
    placeholder: "82/QĐ-VKS"
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "ngày 04 tháng 3 năm 2026"
  }
} as const;

const BM026_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper": "Viện Kiểm sát nhân dân tối cao",
  "agency.nameUpper": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "82/QĐ-VKS",
  "document.issueDate": "ngày 04 tháng 3 năm 2026"
} as const;

const BM026_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-026",
  versionLabel: `BM-026 runtime-ux batch 9 curated source-render profile`,
  sections: BM026_SECTIONS,
  fields: BM026_FIELDS,
  demo: BM026_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM026_RUNTIME_UX_PROFILE);
