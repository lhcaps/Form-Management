/**
 * BM-025 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-025 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: QĐ bổ sung QĐ khởi tố vụ án hình sự
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

const BM025_SECTIONS = [
  {
    sectionId: "section-agency",
    title: "Cơ quan"
  },
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM025_FIELDS = {
  "agency.nameUpper": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "agency.parentNameUpper": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao"
  },
  "agency.issuePlace": {
    label: "Địa danh ban hành",
    placeholder: "Hà Nội"
  }
} as const;

const BM025_DEMO_RUNTIME_UX = {
  "agency.nameUpper": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "agency.parentNameUpper": "Viện Kiểm sát nhân dân tối cao",
  "agency.issuePlace": "Hà Nội"
} as const;

const BM025_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-025",
  versionLabel: `BM-025 runtime-ux batch 9 curated source-render profile`,
  sections: BM025_SECTIONS,
  fields: BM025_FIELDS,
  demo: BM025_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM025_RUNTIME_UX_PROFILE);
