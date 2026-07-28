/**
 * BM-029 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-029 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố vụ án hình sự
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

const BM029_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Cơ quan ban hành quyết định hủy bỏ",
    description:
      "Tên Viện kiểm sát cấp trên, Viện kiểm sát ban hành và tên viết tắt dùng trong quyết định hủy bỏ quyết định bổ sung khởi tố vụ án hình sự.",
  }
] as const;

const BM029_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát cấp trên trực tiếp",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "agency.tenCo": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Viện kiểm sát nhân dân Khu vực 7"
  },
  "document.vietTat": {
    label: "Tên viết tắt Viện kiểm sát/đơn vị phụ trách",
    placeholder: "VKSND Khu vực 7"
  }
} as const;

const BM029_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "agency.tenCo": "Viện kiểm sát nhân dân Khu vực 7",
  "document.vietTat": "VKSND Khu vực 7"
} as const;

const BM029_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-029",
  versionLabel: `BM-029 runtime-ux batch 9 curated source-render profile`,
  sections: BM029_SECTIONS,
  fields: BM029_FIELDS,
  demo: BM029_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM029_RUNTIME_UX_PROFILE);
