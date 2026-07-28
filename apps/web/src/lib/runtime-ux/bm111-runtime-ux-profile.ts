/** Runtime presentation metadata for the BM-111 cancellation decision header. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM111_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Hủy bỏ Quyết định đình chỉ điều tra bị can",
    description:
      "Nhập thông tin đầu văn bản của quyết định hủy bỏ đình chỉ điều tra bị can. Thông tin bị can, quyết định bị hủy bỏ và các điều quyết định chưa có trường tương ứng trong hợp đồng biên dịch.",
  },
] as const;

const BM111_PRESENTATION_SECTIONS = [
  {
    id: "decision-header",
    title: "Hủy bỏ Quyết định đình chỉ điều tra bị can",
    description:
      "Cơ quan ban hành, số quyết định hủy bỏ, địa danh và ngày ban hành.",
    fieldKeys: [
      "agency.vienKiem",
      "document.soQuyet",
      "agency.diaDanh",
      "document.ngayBan",
    ],
  },
] as const;

const BM111_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Nhập tên Viện kiểm sát ban hành",
  },
  "document.soQuyet": {
    label: "Số quyết định hủy bỏ đình chỉ điều tra bị can",
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
} as const;

const BM111_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "12/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
} as const;

const BM111_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-111",
  versionLabel: "BM-111 semantic-ui curated v1",
  sections: BM111_SECTIONS,
  presentationSections: BM111_PRESENTATION_SECTIONS,
  fields: BM111_FIELDS,
  demo: BM111_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM111_RUNTIME_UX_PROFILE);
