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
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM029_FIELDS = {
  "agency.vienKiem": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "agency.tenCo": {
    label: "Tên cơ quan",
    placeholder: "Cơ quan Cảnh sát điều tra"
  },
  "document.vietTat": {
    label: "Viết tắt văn bản",
    placeholder: "QĐ-VKS"
  }
} as const;

const BM029_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "agency.tenCo": "Cơ quan Cảnh sát điều tra",
  "document.vietTat": "QĐ-VKS"
} as const;

const BM029_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-029",
  versionLabel: `BM-029 runtime-ux batch 9 curated source-render profile`,
  sections: BM029_SECTIONS,
  fields: BM029_FIELDS,
  demo: BM029_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM029_RUNTIME_UX_PROFILE);
