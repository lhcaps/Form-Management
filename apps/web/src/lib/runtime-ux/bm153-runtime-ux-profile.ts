/**
 * BM-153 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-153 profile to a
 * curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS requires source/render smoke +
 * Batch 7 curation only. Browser/demo/preview/DOCX/fidelity/visual/
 * human evidence remains NOT_RUN for Batch 7.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM153_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM153_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "21/QĐ-VKS",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Hà Nội",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Nhap noi dung",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Nhap noi dung",
  },
} as const;

const BM153_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.soQuyet": "21/QĐ-VKS",
  "agency.diaDanh": "Hà Nội",
  "document.ngayBan": "Tran Van Binh",
  "agency.dongDia": "Tran Van Binh",
} as const;

const BM153_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-153",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-153 runtime-ux batch 7 curated source-render profile`,
  sections: BM153_SECTIONS,
  fields: BM153_FIELDS,
  demo: BM153_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM153_RUNTIME_UX_PROFILE);
