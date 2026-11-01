import { type RuntimeUxProfile, registerRuntimeUxProfile } from "./runtime-ux-profile";

const BM099_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-099",
  versionLabel: "BM-099 curated defendant-prosecution-change profile",
  sections: [{ sectionId: "section-thong-tin-bieu-mau", title: "Quyết định thay đổi quyết định khởi tố bị can", description: "Viện kiểm sát ban hành và số quyết định thay đổi quyết định khởi tố bị can." }],
  fields: { "agency.vienKiem": { label: "Viện kiểm sát ban hành quyết định" }, "document.soQuyet": { label: "Số quyết định thay đổi quyết định khởi tố bị can" } },
  demo: { "agency.vienKiem": "Viện kiểm sát nhân dân Khu vực 7", "document.soQuyet": "99/QĐ-VKSKV7" },
};
registerRuntimeUxProfile(BM099_RUNTIME_UX_PROFILE);
