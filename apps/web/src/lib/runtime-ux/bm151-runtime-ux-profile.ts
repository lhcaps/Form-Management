/**
 * BM-151 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-151 profile to a
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

const BM151_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin QĐ huỷ bỏ QĐ đình chỉ vụ án hình sự. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ và địa danh ban hành.",
  },
] as const;

const BM151_FIELDS = {
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
} as const;

const BM151_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.soQuyet": "",
  "agency.diaDanh": "",
} as const;

const BM151_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-151",
  versionLabel: `BM-151 — Quyết định huỷ bỏ QĐ đình chỉ vụ án (runtime-ux)`,
  sections: BM151_SECTIONS,
  fields: BM151_FIELDS,
  demo: BM151_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biểu mẫu",
      description:
        "Thông tin QĐ huỷ bỏ QĐ đình chỉ vụ án hình sự. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ và địa danh ban hành.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM151_RUNTIME_UX_PROFILE);
