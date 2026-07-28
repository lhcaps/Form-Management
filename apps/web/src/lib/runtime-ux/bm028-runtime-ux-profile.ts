/**
 * BM-028 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-028 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự
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

const BM028_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Quyết định hủy bỏ quyết định thay đổi khởi tố",
    description:
      "Cơ quan ban hành, căn cứ và thông tin phân biệt quyết định hủy bỏ với quyết định thay đổi Quyết định khởi tố vụ án hình sự.",
  }
] as const;

const BM028_FIELDS = {
  "agency.tenVien": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "agency.coQuan": {
    label: "Cơ quan/người ra quyết định thay đổi khởi tố",
    placeholder: "Cơ quan điều tra Công an Thành phố Hà Nội"
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Hà Nội"
  },
  "document.soQuyet": {
    label: "Số quyết định hủy bỏ",
    placeholder: "55/QĐ-VKS"
  },
  "document.ngayBan": {
    label: "Ngày ban hành quyết định hủy bỏ",
    placeholder: "ngày 04 tháng 3 năm 2026"
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Căn cứ các điều 41, 156, 161 và 165 (hoặc 432) Bộ luật Tố tụng hình sự"
  },
  "document.soQd": {
    label: "Số quyết định thay đổi khởi tố cần hủy bỏ",
    placeholder: "54/QĐ-VKS"
  },
  "document.ngayQd": {
    label: "Ngày quyết định thay đổi khởi tố cần hủy bỏ",
    placeholder: "ngày 02 tháng 3 năm 2026"
  }
} as const;

const BM028_DEMO_RUNTIME_UX = {
  "agency.tenVien": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "agency.coQuan": "Cơ quan điều tra Công an Thành phố Hà Nội",
  "agency.diaDanh": "Hà Nội",
  "document.soQuyet": "55/QĐ-VKS",
  "document.ngayBan": "ngày 04 tháng 3 năm 2026",
  "legalBasis.canCu": "Căn cứ các điều 41, 156, 161 và 165 Bộ luật Tố tụng hình sự",
  "document.soQd": "54/QĐ-VKS",
  "document.ngayQd": "ngày 02 tháng 3 năm 2026"
} as const;

const BM028_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-028",
  versionLabel: `BM-028 runtime-ux batch 9 curated source-render profile`,
  sections: BM028_SECTIONS,
  fields: BM028_FIELDS,
  demo: BM028_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM028_RUNTIME_UX_PROFILE);
