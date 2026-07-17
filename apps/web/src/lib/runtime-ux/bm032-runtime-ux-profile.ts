/**
 * BM-032 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-032 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: QĐ không phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp
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

const BM032_SECTIONS = [
  {
    sectionId: "section-agency",
    title: "Cơ quan"
  },
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM032_FIELDS = {
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
  },
  "document.documentCode": {
    label: "Số văn bản",
    placeholder: "82/QĐ-VKS"
  }
} as const;

const BM032_DEMO_RUNTIME_UX = {
  "agency.nameUpper": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "agency.parentNameUpper": "Viện Kiểm sát nhân dân tối cao",
  "agency.issuePlace": "Hà Nội",
  "document.documentCode": "82/QĐ-VKS"
} as const;

const BM032_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-032",
  versionLabel: `BM-032 runtime-ux batch 9 curated source-render profile`,
  sections: BM032_SECTIONS,
  fields: BM032_FIELDS,
  demo: BM032_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM032_RUNTIME_UX_PROFILE);
