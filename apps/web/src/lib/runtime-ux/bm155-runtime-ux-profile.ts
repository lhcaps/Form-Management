/**
 * BM-155 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-155 profile to a
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

const BM155_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
] as const;

const BM155_FIELDS = {
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
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Nhap noi dung",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Nhap noi dung",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Nhap noi dung",
  },
  "document.soQd": {
    label: "Số quyết định",
    placeholder: "Nhap noi dung",
  },
  "document.ngayQd": {
    label: "Ngày quyết định",
    placeholder: "Nhap noi dung",
  },
  "person.tenBi": {
    label: "Tên bị can / bị cáo",
    placeholder: "Nhap noi dung",
  },
  "document.tenVu": {
    label: "Tên vụ án / vụ việc",
    placeholder: "Nhap noi dung",
  },
  "document.lyDo": {
    label: "Lý do",
    placeholder: "Nhap noi dung",
  },
  "document.dieu1": {
    label: "Nội dung Điều 1",
    placeholder: "Nhap noi dung",
  },
  "document.dieu2": {
    label: "Nội dung Điều 2",
    placeholder: "Nhap noi dung",
  },
  "recipients.noiNhan": {
    label: "Nơi nhận",
    placeholder: "Nhap noi dung",
  },
} as const;

const BM155_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.soQuyet": "21/QĐ-VKS",
  "agency.diaDanh": "Hà Nội",
  "document.ngayBan": "Tran Van Binh",
  "recipients.personLine": "Tran Van Binh",
  "document.chuThe": "Tran Van Binh",
  "legalBasis.canCu": "Tran Van Binh",
  "document.soQd": "Tran Van Binh",
  "document.ngayQd": "Tran Van Binh",
  "person.tenBi": "Tran Van Binh",
  "document.tenVu": "Tran Van Binh",
  "document.lyDo": "Tran Van Binh",
  "document.dieu1": "Tran Van Binh",
  "document.dieu2": "Tran Van Binh",
  "recipients.noiNhan": "Tran Van Binh",
} as const;

const BM155_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-155",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-155 runtime-ux batch 7 curated source-render profile`,
  sections: BM155_SECTIONS,
  fields: BM155_FIELDS,
  demo: BM155_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM155_RUNTIME_UX_PROFILE);
