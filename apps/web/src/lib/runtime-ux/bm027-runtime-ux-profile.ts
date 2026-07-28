/**
 * BM-027 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-027 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự
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

const BM027_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Cơ quan ban hành, địa danh, số và ngày thông báo hủy bỏ Quyết định khởi tố vụ án hình sự.",
  }
] as const;

const BM027_FIELDS = {
  "agency.tenVien": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "agency.coQuan": {
    label: "Cơ quan chuyên môn",
    placeholder: "Cơ quan điều tra Công an Thành phố Hà Nội"
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Hà Nội"
  },
  "document.soThong": {
    label: "Số thông báo",
    placeholder: "118/TB-VKS"
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "ngày 04 tháng 3 năm 2026"
  }
} as const;

const BM027_DEMO_RUNTIME_UX = {
  "agency.tenVien": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "agency.coQuan": "Cơ quan điều tra Công an Thành phố Hà Nội",
  "agency.diaDanh": "Hà Nội",
  "document.soThong": "118/TB-VKS",
  "document.ngayBan": "ngày 04 tháng 3 năm 2026"
} as const;

const BM027_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-027",
  versionLabel: `BM-027 runtime-ux batch 9 curated source-render profile`,
  sections: BM027_SECTIONS,
  fields: BM027_FIELDS,
  demo: BM027_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM027_RUNTIME_UX_PROFILE);
