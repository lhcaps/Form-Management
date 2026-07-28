import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM102_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-102",
  versionLabel: "BM-102 curated defendant-prosecution-cancellation profile",
  sections: [
    {
      sectionId: "section-thong-tin-bieu-mau",
      title: "Quyết định hủy bỏ quyết định khởi tố bị can",
      description:
        "Thông tin Viện kiểm sát ban hành, số quyết định và dòng địa danh, ngày ban hành.",
    },
  ],
  fields: {
    "agency.vienKiem": {
      label: "Viện kiểm sát ban hành quyết định",
      placeholder: "Nhập tên Viện kiểm sát ban hành",
    },
    "document.soQuyet": {
      label: "Số quyết định hủy bỏ",
      placeholder: "Ví dụ: 102/QĐ-VKS",
    },
    "agency.diaDanh": {
      label: "Địa danh đặt trụ sở Viện kiểm sát",
      placeholder: "Tỉnh hoặc thành phố nơi đặt trụ sở",
    },
    "document.ngayBan": {
      label: "Ngày ban hành quyết định",
      placeholder: "Ngày, tháng, năm ban hành",
      control: "DATE_TEXT",
    },
    "agency.dongDia": {
      label: "Dòng địa danh, ngày ban hành",
      placeholder: "Ví dụ: Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
    },
  },
  demo: {
    "agency.vienKiem": "Viện kiểm sát nhân dân Khu vực 7",
    "document.soQuyet": "102/QĐ-VKSKV7",
    "agency.diaDanh": "Thành phố Hồ Chí Minh",
    "document.ngayBan": "15/07/2026",
    "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  },
};

registerRuntimeUxProfile(BM102_RUNTIME_UX_PROFILE);
