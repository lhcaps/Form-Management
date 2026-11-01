import { type RuntimeUxProfile, registerRuntimeUxProfile } from "./runtime-ux-profile";

const BM079_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-079",
  versionLabel: "BM-079 curated defence-registration-cancellation notice profile",
  sections: [{
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông báo hủy bỏ đăng ký bào chữa",
    description: "Viện kiểm sát ban hành thông báo hủy bỏ việc đăng ký người bào chữa.",
  }],
  fields: {
    "agency.name": { label: "Viện kiểm sát ban hành thông báo" },
  },
  demo: { "agency.name": "Viện kiểm sát nhân dân Khu vực 7" },
};

registerRuntimeUxProfile(BM079_RUNTIME_UX_PROFILE);
