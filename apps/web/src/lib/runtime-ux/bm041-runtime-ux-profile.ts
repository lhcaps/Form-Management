import { type RuntimeUxProfile, registerRuntimeUxProfile } from "./runtime-ux-profile";

const BM041_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-041",
  versionLabel: "BM-041 curated non-approval detention-order profile",
  sections: [{
    sectionId: "section-thong-tin-bieu-mau",
    title: "Quyết định không phê chuẩn Lệnh tạm giam",
    description: "Viện kiểm sát cấp trên, địa danh ban hành và số quyết định không phê chuẩn Lệnh tạm giam.",
  }],
  fields: {
    "agency.parentNameUpper": { label: "Viện kiểm sát cấp trên trực tiếp (IN HOA)" },
    "agency.issuePlace": { label: "Địa danh ban hành quyết định" },
    "document.documentCode": { label: "Số quyết định không phê chuẩn" },
  },
  demo: { "agency.parentNameUpper": "VIỆN KIỂM SÁT NHÂN DÂN TỐI CAO", "agency.issuePlace": "Hà Nội", "document.documentCode": "21/QĐ-VKS" },
};

registerRuntimeUxProfile(BM041_RUNTIME_UX_PROFILE);
