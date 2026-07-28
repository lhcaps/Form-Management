/**
 * BM-154 runtime-ux curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-154 profile to a
 * curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Family: PHỤC HỒI VỤ ÁN — prosecution-stage resumption of a
 * criminal case. Distinct from BM-148/149/152/153 (ĐÌNH CHỈ BỊ CAN).
 * Distinct from BM-155 (PHỤC HỒI VỤ ÁN ĐỐI VỚI BỊ CAN — accused-targeted).
 * Shares QUYẾT ĐỊNH document type and legal domain (Điều 41, 236, 247, 249 BLTTHS).
 * Single-section thông tin biểu mẫu form with legacy field keys.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM154_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin QĐ phục hồi vụ án hình sự. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, địa danh ban hành, ngày ban hành, dòng địa danh và chủ thể liên quan.",
  },
] as const;

const BM154_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Tên Viện kiểm sát ban hành",
  },
  "document.soQuyet": {
    label: "Số quyết định phục hồi",
    placeholder: "Số quyết định /QĐ-VKS",
  },
  "agency.diaDanh": {
    label: "Địa danh nơi đặt trụ sở",
    placeholder: "Tỉnh/thành phố nơi đặt trụ sở Viện kiểm sát",
  },
  "document.ngayBan": {
    label: "Ngày ban hành quyết định",
    placeholder: "Ngày, tháng, năm ban hành",
  },
  "agency.dongDia": {
    label: "Viết tắt đơn vị phụ trách",
    placeholder: "Viết tắt Viện kiểm sát ban hành (nếu có)",
  },
  "document.chuThe": {
    label: "Cơ quan/người có thẩm quyền liên quan",
    placeholder: "Tên cơ quan, người có thẩm quyền liên quan",
  },
} as const;

const BM154_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "",
  "document.soQuyet": "",
  "agency.diaDanh": "",
  "document.ngayBan": "",
  "agency.dongDia": "",
  "document.chuThe": "",
} as const;

const BM154_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-154",
  versionLabel: `BM-154 — Quyết định phục hồi vụ án (runtime-ux)`,
  sections: BM154_SECTIONS,
  fields: BM154_FIELDS,
  demo: BM154_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biểu mẫu",
      description:
        "Thông tin QĐ phục hồi vụ án hình sự. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, địa danh ban hành, ngày ban hành, dòng địa danh và chủ thể liên quan.",
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

registerRuntimeUxProfile(BM154_RUNTIME_UX_PROFILE);
