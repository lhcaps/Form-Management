import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM082_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-082",
  versionLabel: "BM-082 curated procedural-activity notice profile",
  sections: [
    {
      sectionId: "section-thong-tin-bieu-mau",
      title: "Thông báo hoạt động tố tụng cho người bào chữa",
      description:
        "Viện kiểm sát ban hành thông báo về thời gian, địa điểm tiến hành hoạt động tố tụng.",
    },
  ],
  fields: {
    "agency.name": { label: "Viện kiểm sát ban hành thông báo" },
    "document.fullDocumentCode": { label: "Số thông báo hoạt động tố tụng" },
  },
  demo: {
    "agency.name": "Viện kiểm sát nhân dân Khu vực 7",
    "document.fullDocumentCode": "82/TB-VKSKV7",
  },
};

registerRuntimeUxProfile(BM082_RUNTIME_UX_PROFILE);
