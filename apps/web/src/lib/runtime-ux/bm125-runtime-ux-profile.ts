/**
 * BM-125 runtime-ux curated profile.
 *
 * CURATION (batch next): Thông báo về việc không chấp nhận đề nghị
 * trưng cầu giám định/yêu cầu định giá tài sản. Viện kiểm sát ban hành
 * thông báo khi không chấp nhận đề nghị của cơ quan đề nghị, căn cứ
 * Điều 42 và Điều 214/Điều 222 BLTTHS.
 *
 * Workflow: thông báo → issuing VKS header + decision number + locality/date.
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM125_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin thông báo không chấp nhận",
    description: "Thông tin thông báo không chấp nhận đề nghị trưng cầu giám định/yêu cầu định giá tài sản, căn cứ Điều 42 và Điều 214/Điều 222 BLTTHS.",
  },
] as const;

const BM125_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành thông báo",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số thông báo",
    placeholder: "Số thông báo (ví dụ: 25/TB-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh nơi đặt trụ sở Viện kiểm sát ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày, tháng, năm ban hành",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh đầy đủ của Viện kiểm sát ban hành",
  },
} as const;

const BM125_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "25/TB-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
} as const;

const BM125_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-125",
  versionLabel: `BM-125 runtime-ux batch 6 curated source-render profile`,
  sections: BM125_SECTIONS,
  fields: BM125_FIELDS,
  demo: BM125_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin thông báo không chấp nhận",
      description: "Thông tin thông báo không chấp nhận đề nghị trưng cầu giám định/yêu cầu định giá tài sản, căn cứ Điều 42 và Điều 214/Điều 222 BLTTHS.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM125_RUNTIME_UX_PROFILE);
