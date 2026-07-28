/** Runtime presentation metadata for the BM-113 request to resume case investigation. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM113_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Yêu cầu phục hồi điều tra vụ án hình sự",
    description:
      "Nhập thông tin đầu văn bản yêu cầu phục hồi điều tra vụ án. Các căn cứ, lý do phục hồi và nội dung yêu cầu chưa có trường tương ứng trong hợp đồng biên dịch.",
  },
] as const;

const BM113_PRESENTATION_SECTIONS = [
  {
    id: "request-header",
    title: "Yêu cầu phục hồi điều tra vụ án hình sự",
    description:
      "Viện kiểm sát ban hành, số yêu cầu và các dữ liệu tạo dòng địa danh, ngày tháng.",
    fieldKeys: [
      "agency.vienKiem",
      "document.soQuyet",
      "agency.diaDanh",
      "document.ngayBan",
      "agency.dongDia",
    ],
  },
] as const;

const BM113_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành yêu cầu",
    placeholder: "Nhập tên Viện kiểm sát ban hành",
  },
  "document.soQuyet": {
    label: "Số yêu cầu phục hồi điều tra vụ án",
    placeholder: "Ví dụ: 12/YC-VKS",
  },
  "agency.diaDanh": {
    label: "Địa danh ban hành yêu cầu",
    placeholder: "Nhập tỉnh hoặc thành phố nơi ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành yêu cầu",
    placeholder: "Nhập ngày ban hành yêu cầu",
    control: "DATE_TEXT",
  },
  "agency.dongDia": {
    label: "Dòng địa danh và ngày ban hành",
    placeholder: "Ví dụ: Hà Nội, ngày 15 tháng 7 năm 2026",
  },
} as const;

const BM113_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "12/YC-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
} as const;

const BM113_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-113",
  versionLabel: "BM-113 semantic-ui curated v1",
  sections: BM113_SECTIONS,
  presentationSections: BM113_PRESENTATION_SECTIONS,
  fields: BM113_FIELDS,
  demo: BM113_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM113_RUNTIME_UX_PROFILE);
