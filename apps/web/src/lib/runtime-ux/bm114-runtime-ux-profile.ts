/** Runtime presentation metadata for the BM-114 request to resume accused investigation. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM114_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Yêu cầu phục hồi điều tra bị can",
    description:
      "Nhập thông tin đầu văn bản và người hoặc pháp nhân bị khởi tố trong yêu cầu phục hồi điều tra bị can. Các căn cứ, lý do và nội dung yêu cầu chưa có trường tương ứng trong hợp đồng biên dịch.",
  },
] as const;

const BM114_PRESENTATION_SECTIONS = [
  {
    id: "request-header",
    title: "Yêu cầu phục hồi điều tra bị can",
    description:
      "Viện kiểm sát ban hành, số yêu cầu, dòng địa danh, ngày tháng và đối tượng bị khởi tố.",
    fieldKeys: [
      "agency.vienKiem",
      "document.soQuyet",
      "agency.diaDanh",
      "document.ngayBan",
      "agency.dongDia",
      "document.chuThe",
    ],
  },
] as const;

const BM114_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành yêu cầu",
    placeholder: "Nhập tên Viện kiểm sát ban hành",
  },
  "document.soQuyet": {
    label: "Số yêu cầu phục hồi điều tra bị can",
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
  "document.chuThe": {
    label: "Người hoặc pháp nhân bị khởi tố",
    placeholder: "Nhập họ tên người hoặc tên pháp nhân bị khởi tố",
  },
} as const;

const BM114_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "12/YC-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "bị can Lê Minh K",
} as const;

const BM114_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-114",
  versionLabel: "BM-114 semantic-ui curated v1",
  sections: BM114_SECTIONS,
  presentationSections: BM114_PRESENTATION_SECTIONS,
  fields: BM114_FIELDS,
  demo: BM114_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM114_RUNTIME_UX_PROFILE);
