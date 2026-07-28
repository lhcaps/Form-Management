/** Runtime presentation metadata for the BM-110 cancellation decision header. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM110_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Hủy bỏ Quyết định đình chỉ điều tra vụ án hình sự",
    description:
      "Nhập thông tin đầu văn bản của quyết định hủy bỏ đình chỉ điều tra vụ án. Nội dung căn cứ và các điều quyết định chưa có trường tương ứng trong hợp đồng biên dịch.",
  },
] as const;

const BM110_PRESENTATION_SECTIONS = [
  {
    id: "decision-header",
    title: "Hủy bỏ Quyết định đình chỉ điều tra vụ án hình sự",
    description:
      "Cơ quan ban hành, số quyết định hủy bỏ và địa danh ghi trên dòng ngày tháng.",
    fieldKeys: ["agency.vienKiem", "document.soQuyet", "agency.diaDanh"],
  },
] as const;

const BM110_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Nhập tên Viện kiểm sát ban hành",
  },
  "document.soQuyet": {
    label: "Số quyết định hủy bỏ đình chỉ điều tra vụ án",
    placeholder: "Ví dụ: 12/QĐ-VKS",
  },
  "agency.diaDanh": {
    label: "Địa danh ban hành quyết định",
    placeholder: "Nhập tỉnh hoặc thành phố nơi ban hành",
  },
} as const;

const BM110_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "12/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
} as const;

const BM110_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-110",
  versionLabel: "BM-110 semantic-ui curated v1",
  sections: BM110_SECTIONS,
  presentationSections: BM110_PRESENTATION_SECTIONS,
  fields: BM110_FIELDS,
  demo: BM110_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM110_RUNTIME_UX_PROFILE);
