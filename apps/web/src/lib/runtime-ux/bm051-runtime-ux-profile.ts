import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM051_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-051",
  versionLabel: "BM-051 curated money-guarantee decision profile",
  sections: [
    {
      sectionId: "section-thong-tin-bieu-mau",
      title: "Quyết định đặt tiền để bảo đảm",
      description:
        "Viện kiểm sát ban hành, số quyết định và địa danh, ngày ban hành quyết định đặt tiền để bảo đảm.",
    },
  ],
  fields: {
    "agency.name": {
      label: "Viện kiểm sát ban hành quyết định",
    },
    "document.fullDocumentCode": {
      label: "Số quyết định đặt tiền để bảo đảm",
    },
    "decision.decisionLine3": {
      label: "Địa danh, ngày ban hành quyết định",
    },
  },
  demo: {
    "agency.name": "Viện kiểm sát nhân dân Khu vực 7",
    "document.fullDocumentCode": "51/QĐ-VKSKV7",
    "decision.decisionLine3": "Hà Nội, ngày 04 tháng 3 năm 2026",
  },
};

registerRuntimeUxProfile(BM051_RUNTIME_UX_PROFILE);
