/**
 * BM-152 runtime-ux curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-152 profile to a
 * curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Family: ĐÌNH CHỈ BỊ CAN — đình chỉ đối với bị can (final termination
 * of case as applied to an accused). Distinct subfamily from BM-150
 * (đình chỉ vụ án — case-targeted). Single-section thông tin biểu mẫu
 * form with legacy field keys.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM152_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin QĐ đình chỉ vụ án đối với bị can. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, người bị áp dụng, địa danh, ngày ban hành, dòng địa danh, chủ thể liên quan, căn cứ pháp lý và tên bị can/bị cáo.",
  },
] as const;

const BM152_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Nhập nội dung",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
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
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Nhập nội dung",
  },
  "person.tenBi": {
    label: "Tên bị can / bị cáo",
    placeholder: "Nhập nội dung",
  },
} as const;

const BM152_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.soQuyet": "",
  "recipients.personLine": "",
  "agency.diaDanh": "",
  "document.ngayBan": "",
  "agency.dongDia": "",
  "document.chuThe": "",
  "legalBasis.canCu": "",
  "person.tenBi": "",
} as const;

const BM152_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-152",
  versionLabel: `BM-152 — Quyết định đình chỉ vụ án đối với bị can (runtime-ux)`,
  sections: BM152_SECTIONS,
  fields: BM152_FIELDS,
  demo: BM152_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biểu mẫu",
      description:
        "Thông tin QĐ đình chỉ vụ án đối với bị can. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, người bị áp dụng, địa danh, ngày ban hành, dòng địa danh, chủ thể liên quan, căn cứ pháp lý và tên bị can/bị cáo.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "recipients.personLine",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "document.chuThe",
        "legalBasis.canCu",
        "person.tenBi",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM152_RUNTIME_UX_PROFILE);
