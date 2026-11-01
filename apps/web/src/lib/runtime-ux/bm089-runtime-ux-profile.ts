import { type RuntimeUxProfile, registerRuntimeUxProfile } from "./runtime-ux-profile";

const BM089_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-089",
  versionLabel: "BM-089 curated case-separation-cancellation profile",
  sections: [{ sectionId: "section-thong-tin-bieu-mau", title: "Quyết định hủy bỏ quyết định tách vụ án", description: "Viện kiểm sát ban hành quyết định hủy bỏ quyết định tách vụ án hình sự." }],
  fields: { "agency.vienKiem": { label: "Viện kiểm sát ban hành quyết định" } },
  demo: { "agency.vienKiem": "Viện kiểm sát nhân dân Khu vực 7" },
};

registerRuntimeUxProfile(BM089_RUNTIME_UX_PROFILE);
