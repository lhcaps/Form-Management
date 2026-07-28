/**
 * BM-155 runtime-ux curated source-render profile.
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
 * Family: PHỤC HỒI VỤ ÁN ĐỐI VỚI BỊ CAN — prosecution-stage resumption
 * of a criminal case as applied to a named accused person. Distinct from
 * BM-154 (PHỤC HỒI VỤ ÁN — case-targeted). Distinct from BM-148/149/152/153
 * (ĐÌNH CHỈ BỊ CAN). Shares QUYẾT ĐỊNH document type and legal domain
 * (Điều 41, 236, 247, 249 BLTTHS). Single-section thông tin biểu mẫu form.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM155_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin QĐ phục hồi vụ án đối với bị can. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, người bị áp dụng, địa danh, ngày ban hành, dòng địa danh, chủ thể liên quan, căn cứ pháp lý, số QĐ khởi tố, ngày QĐ, tên bị can/bị cáo, tên vụ án, lý do và nội dung Điều 1, Điều 2.",
  },
] as const;

const BM155_FIELDS = {
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
  "recipients.personLine": {
    label: "Bị can/người bị áp dụng",
    placeholder: "Họ tên người hoặc tên pháp nhân bị khởi tố",
  },
  "document.chuThe": {
    label: "Cơ quan/người có thẩm quyền liên quan",
    placeholder: "Tên cơ quan, người có thẩm quyền liên quan",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý phục hồi",
    placeholder: "Các điều luật làm căn cứ phục hồi",
  },
  "document.soQd": {
    label: "Số quyết định khởi tố bị can",
    placeholder: "Số quyết định khởi tố bị can",
  },
  "document.ngayQd": {
    label: "Ngày quyết định khởi tố bị can",
    placeholder: "Ngày, tháng, năm quyết định khởi tố bị can",
  },
  "person.tenBi": {
    label: "Họ tên bị can/pháp nhân",
    placeholder: "Họ tên người hoặc tên pháp nhân bị khởi tố",
  },
  "document.tenVu": {
    label: "Tên vụ án",
    placeholder: "Tên vụ án hình sự",
  },
  "document.lyDo": {
    label: "Lý do phục hồi",
    placeholder: "Lý do phục hồi vụ án đối với bị can",
  },
  "document.dieu1": {
    label: "Nội dung Điều 1",
    placeholder: "Nội dung Điều 1 về phục hồi vụ án đối với bị can",
  },
  "document.dieu2": {
    label: "Nội dung Điều 2",
    placeholder: "Nội dung Điều 2 về xử lý",
  },
  "recipients.noiNhan": {
    label: "Nơi nhận",
    placeholder: "Các cơ quan, cá nhân nhận quyết định",
  },
} as const;

const BM155_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "",
  "document.soQuyet": "",
  "agency.diaDanh": "",
  "document.ngayBan": "",
  "recipients.personLine": "",
  "document.chuThe": "",
  "legalBasis.canCu": "",
  "document.soQd": "",
  "document.ngayQd": "",
  "person.tenBi": "",
  "document.tenVu": "",
  "document.lyDo": "",
  "document.dieu1": "",
  "document.dieu2": "",
  "recipients.noiNhan": "",
} as const;

const BM155_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-155",
  versionLabel: `BM-155 — Quyết định phục hồi vụ án đối với bị can (runtime-ux)`,
  sections: BM155_SECTIONS,
  fields: BM155_FIELDS,
  demo: BM155_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biểu mẫu",
      description:
        "Thông tin QĐ phục hồi vụ án đối với bị can. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, người bị áp dụng, địa danh, ngày ban hành, dòng địa danh, chủ thể liên quan, căn cứ pháp lý, số QĐ khởi tố, ngày QĐ, tên bị can/bị cáo, tên vụ án, lý do và nội dung Điều 1, Điều 2.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "recipients.personLine",
        "document.chuThe",
        "legalBasis.canCu",
        "document.soQd",
        "document.ngayQd",
        "person.tenBi",
        "document.tenVu",
        "document.lyDo",
        "document.dieu1",
        "document.dieu2",
        "recipients.noiNhan",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM155_RUNTIME_UX_PROFILE);
