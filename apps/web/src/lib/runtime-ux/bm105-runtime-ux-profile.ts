import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM105_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Quyết định không gia hạn thời hạn điều tra",
    description:
      "Thông tin Viện kiểm sát ban hành, số quyết định và dòng địa danh, ngày ban hành; các căn cứ và điều khoản khác không có key trong contract này.",
  },
] as const;

const BM105_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Tên Viện kiểm sát ban hành quyết định",
  },
  "document.soQuyet": {
    label: "Số quyết định không gia hạn",
    placeholder: "Số/QĐ-VKS",
  },
  "agency.diaDanh": {
    label: "Địa danh nơi đặt trụ sở Viện kiểm sát",
    placeholder: "Tỉnh hoặc thành phố nơi đặt trụ sở",
  },
  "document.ngayBan": {
    label: "Ngày ban hành quyết định",
    placeholder: "Ngày ... tháng ... năm ...",
  },
} as const;

const BM105_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN ...",
  "document.soQuyet": ".../QĐ-VKS",
  "agency.diaDanh": "...",
  "document.ngayBan": "... tháng ... năm ...",
} as const;

const BM105_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-105",
  versionLabel: "BM-105 curated investigation-non-extension decision profile",
  sections: BM105_SECTIONS,
  fields: BM105_FIELDS,
  demo: BM105_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM105_RUNTIME_UX_PROFILE);
