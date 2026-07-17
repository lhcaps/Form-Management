/**
 * BM-161 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-161 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Phiếu yêu cầu trích xuất
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS via Batch 8 source/render smoke
 * only. Browser/demo/preview/DOCX/fidelity/visual/human evidence
 * remains NOT_RUN for Batch 8.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM161_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-co-quan-ban-hanh",
    title: "Cơ quan ban hành",
  },
  {
    sectionId: "section-nguoi-bi-trich-xuat",
    title: "Người bị trích xuất",
  },
] as const;

const BM161_FIELDS = {
  "agency.vienKiem": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.soPhieu": {
    label: "Số phiếu yêu cầu",
    placeholder: "12/PYC-VKS",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng trích xuất",
    placeholder: "Ông Lê Hồng Quân",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Hà Nội",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "ngày 04 tháng 3 năm 2026",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  },
  "document.hoTen": {
    label: "Họ tên người bị trích xuất",
    placeholder: "Lê Hồng Quân",
  },
  "document.ngaySinh": {
    label: "Ngày sinh",
    placeholder: "ngày 12 tháng 5 năm 1986",
  },
} as const;

const BM161_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.soPhieu": "12/PYC-VKS",
  "recipients.personLine": "Ông Lê Hồng Quân",
  "agency.diaDanh": "Hà Nội",
  "document.ngayBan": "ngày 04 tháng 3 năm 2026",
  "document.chuThe": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "document.hoTen": "Lê Hồng Quân",
  "document.ngaySinh": "ngày 12 tháng 5 năm 1986",
} as const;

const BM161_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-161",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-161 runtime-ux batch 8 curated source-render profile`,
  sections: BM161_SECTIONS,
  fields: BM161_FIELDS,
  demo: BM161_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM161_RUNTIME_UX_PROFILE);
