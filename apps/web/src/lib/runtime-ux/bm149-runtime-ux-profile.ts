/**
 * BM-149 runtime-ux curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-149 profile to a
 * curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Family: ĐÌNH CHỈ BỊ CAN — huỷ tạm đình chỉ (resumption by
 * overturning accused-targeted case suspension). Distinct subfamily from
 * BM-147 (huỷ tạm đình chỉ vụ án — case-targeted). Single-section
 * thông tin biểu mẫu form with legacy field keys.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM149_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, địa danh ban hành, ngày ban hành, dòng địa danh và chủ thể liên quan.",
  },
] as const;

const BM149_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Nhập nội dung",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Nhập nội dung",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Nhập nội dung",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Nhập nội dung",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Nhập nội dung",
  },
} as const;

const BM149_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.soQuyet": "",
  "agency.diaDanh": "",
  "document.ngayBan": "",
  "agency.dongDia": "",
  "document.chuThe": "",
} as const;

const BM149_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-149",
  versionLabel: `BM-149 — Quyết định huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can (runtime-ux)`,
  sections: BM149_SECTIONS,
  fields: BM149_FIELDS,
  demo: BM149_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biểu mẫu",
      description:
        "Thông tin QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, địa danh ban hành, ngày ban hành, dòng địa danh và chủ thể liên quan.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "document.chuThe",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM149_RUNTIME_UX_PROFILE);
