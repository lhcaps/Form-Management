/**
 * BM-147 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-147 profile to a
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

const BM147_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin QĐ huỷ bỏ QĐ tạm đình chỉ vụ án hình sự. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, địa danh ban hành và ngày ban hành.",
  },
] as const;

const BM147_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Nhập nội dung",
  },
} as const;

const BM147_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.soQuyet": "",
  "agency.diaDanh": "",
  "document.ngayBan": "Tran Van Binh",
} as const;

const BM147_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-147",
  versionLabel: `BM-147 — Quyết định huỷ bỏ QĐ tạm đình chỉ vụ án (runtime-ux)`,
  sections: BM147_SECTIONS,
  fields: BM147_FIELDS,
  demo: BM147_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biểu mẫu",
      description:
        "Thông tin QĐ huỷ bỏ QĐ tạm đình chỉ vụ án hình sự. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, địa danh ban hành và ngày ban hành.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM147_RUNTIME_UX_PROFILE);
