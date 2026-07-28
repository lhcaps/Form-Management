import { type RuntimeUxProfile, registerRuntimeUxProfile } from "./runtime-ux-profile";

const BM101_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-101",
  versionLabel: "BM-101 curated defendant-prosecution-supplement profile",
  sections: [{ sectionId: "section-thong-tin-bieu-mau", title: "Quyết định bổ sung quyết định khởi tố bị can", description: "Viện kiểm sát, số quyết định, địa danh và ngày ban hành quyết định bổ sung quyết định khởi tố bị can." }],
  fields: {
    "agency.vienKiem": { label: "Viện kiểm sát ban hành quyết định" },
    "document.soQuyet": { label: "Số quyết định bổ sung quyết định khởi tố bị can" },
    "agency.diaDanh": { label: "Địa danh ban hành quyết định" },
    "document.ngayBan": { label: "Ngày ban hành quyết định" },
    "agency.dongDia": { label: "Dòng địa danh, ngày ban hành" },
  },
  demo: { "agency.vienKiem": "Viện kiểm sát nhân dân Khu vực 7", "document.soQuyet": "101/QĐ-VKSKV7", "agency.diaDanh": "Hà Nội", "document.ngayBan": "04 tháng 3 năm 2026", "agency.dongDia": "Hà Nội, ngày 04 tháng 3 năm 2026" },
};
registerRuntimeUxProfile(BM101_RUNTIME_UX_PROFILE);
