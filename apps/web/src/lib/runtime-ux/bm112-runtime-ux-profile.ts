/** Runtime presentation metadata for the BM-112 cancellation decision header. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM112_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title:
      "Hủy bỏ Quyết định đình chỉ điều tra vụ án hình sự đối với bị can",
    description:
      "Nhập thông tin đầu văn bản của quyết định hủy bỏ đình chỉ điều tra vụ án đối với bị can. Thông tin bị can, quyết định bị hủy bỏ và các điều quyết định chưa có trường tương ứng trong hợp đồng biên dịch.",
  },
] as const;

const BM112_PRESENTATION_SECTIONS = [
  {
    id: "decision-header",
    title:
      "Hủy bỏ Quyết định đình chỉ điều tra vụ án hình sự đối với bị can",
    description:
      "Cơ quan ban hành, số quyết định hủy bỏ và các dữ liệu tạo dòng địa danh, ngày tháng.",
    fieldKeys: [
      "agency.vienKiem",
      "document.soQuyet",
      "agency.diaDanh",
      "document.ngayBan",
      "agency.dongDia",
    ],
  },
] as const;

const BM112_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Nhập tên Viện kiểm sát ban hành",
  },
  "document.soQuyet": {
    label: "Số quyết định hủy bỏ đình chỉ điều tra vụ án đối với bị can",
    placeholder: "Ví dụ: 12/QĐ-VKS",
  },
  "agency.diaDanh": {
    label: "Địa danh ban hành quyết định",
    placeholder: "Nhập tỉnh hoặc thành phố nơi ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành quyết định",
    placeholder: "Nhập ngày ban hành quyết định",
    control: "DATE_TEXT",
  },
  "agency.dongDia": {
    label: "Dòng địa danh và ngày ban hành",
    placeholder: "Ví dụ: Hà Nội, ngày 15 tháng 7 năm 2026",
  },
} as const;

const BM112_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "12/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
} as const;

const BM112_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-112",
  versionLabel: "BM-112 semantic-ui curated v1",
  sections: BM112_SECTIONS,
  presentationSections: BM112_PRESENTATION_SECTIONS,
  fields: BM112_FIELDS,
  demo: BM112_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM112_RUNTIME_UX_PROFILE);
