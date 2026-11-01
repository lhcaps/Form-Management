import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM106_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Yêu cầu truy nã bị can",
    description:
      "Thông tin hiển thị theo đúng vị trí slot trong Mẫu số 106/HS; các tên key lịch sử chỉ dùng để lưu dữ liệu, không thay thế nhãn nghiệp vụ.",
  },
] as const;

const BM106_PRESENTATION_SECTIONS = [
  {
    id: "yeu-cau-truy-na",
    title: "Viện kiểm sát và số yêu cầu truy nã",
    description:
      "Viện kiểm sát theo slot đầu văn bản và số yêu cầu truy nã bị can.",
    fieldKeys: ["agency.vienKiem", "document.soQuyet"],
  },
  {
    id: "nhan-dang-bi-can",
    title: "Nhân thân, giấy tờ và nơi cư trú của bị can",
    description:
      "Họ tên, giấy tờ tùy thân, địa chỉ và đặc điểm nhận dạng của bị can bị yêu cầu truy nã.",
    fieldKeys: [
      "recipients.personLine",
      "agency.diaDanh",
      "document.ngayBan",
      "agency.dongDia",
      "document.chuThe",
      "document.tenVu",
      "person.toiDanh",
      "document.thoiHan",
    ],
  },
  {
    id: "can-cu-yeu-cau",
    title: "Lý do yêu cầu truy nã",
    description:
      "Lý do truy nã bị can theo Điều 231 hoặc Điều 247 Bộ luật Tố tụng hình sự.",
    fieldKeys: ["document.lyDo"],
  },
] as const;

const BM106_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát theo mẫu",
    placeholder: "Tên Viện kiểm sát ghi tại đầu văn bản",
    helpText:
      "Mẫu đã khóa dùng cùng một slot ở đầu văn bản và dòng Viện kiểm sát nhận yêu cầu.",
  },
  "recipients.personLine": {
    label: "Họ và tên bị can",
    placeholder: "Họ và tên đầy đủ của bị can bị yêu cầu truy nã",
  },
  "document.soQuyet": {
    label: "Số yêu cầu truy nã",
    placeholder: "Số/YC-VKS",
  },
  "agency.diaDanh": {
    label: "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu",
    placeholder: "Số giấy tờ tùy thân của bị can",
  },
  "document.ngayBan": {
    label: "Ngày cấp giấy tờ tùy thân",
    placeholder: "Ngày ... tháng ... năm ...",
  },
  "agency.dongDia": {
    label: "Nơi cấp giấy tờ tùy thân",
    placeholder: "Cơ quan hoặc địa điểm cấp giấy tờ",
  },
  "document.chuThe": {
    label: "Nơi thường trú",
    placeholder: "Địa chỉ thường trú của bị can",
  },
  "document.tenVu": {
    label: "Nơi tạm trú",
    placeholder: "Địa chỉ tạm trú của bị can",
  },
  "person.toiDanh": {
    label: "Nơi ở hiện tại",
    placeholder: "Địa chỉ nơi ở hiện tại của bị can",
  },
  "document.thoiHan": {
    label: "Đặc điểm nhận dạng của bị can",
    placeholder: "Đặc điểm nhận dạng nếu có",
    control: "TEXTAREA",
  },
  "document.lyDo": {
    label: "Lý do yêu cầu truy nã bị can",
    placeholder:
      "Nêu lý do truy nã theo Điều 231 hoặc Điều 247 Bộ luật Tố tụng hình sự",
    control: "TEXTAREA",
  },
} as const;

const BM106_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN ...",
  "recipients.personLine": "...",
  "document.soQuyet": ".../YC-VKS",
  "agency.diaDanh": "...",
  "document.ngayBan": "... tháng ... năm ...",
  "agency.dongDia": "...",
  "document.chuThe": "...",
  "document.tenVu": "...",
  "person.toiDanh": "...",
  "document.thoiHan": "...",
  "document.lyDo": "...",
} as const;

const BM106_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-106",
  versionLabel: "BM-106 curated wanted-person request profile",
  sections: BM106_SECTIONS,
  presentationSections: BM106_PRESENTATION_SECTIONS,
  fields: BM106_FIELDS,
  demo: BM106_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM106_RUNTIME_UX_PROFILE);
