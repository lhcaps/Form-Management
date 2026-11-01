import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM050_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-050",
  versionLabel: "BM-050 curated money-guarantee non-approval profile",
  sections: [
    {
      sectionId: "section-thong-tin-bieu-mau",
      title: "Cơ quan không phê chuẩn đặt tiền để bảo đảm",
      description:
        "Viện kiểm sát ban hành quyết định không phê chuẩn, cơ quan/người đã ra quyết định đặt tiền để bảo đảm và địa danh ban hành.",
    },
  ],
  fields: {
    "agency.tenVien": {
      label: "Viện kiểm sát ban hành quyết định không phê chuẩn",
    },
    "agency.coQuan": {
      label: "Cơ quan/người ra quyết định đặt tiền để bảo đảm",
    },
    "agency.diaDanh": {
      label: "Địa danh đặt trụ sở Viện kiểm sát ban hành",
    },
  },
  demo: {
    "agency.tenVien": "Viện kiểm sát nhân dân Khu vực 7",
    "agency.coQuan":
      "Cơ quan Cảnh sát điều tra Công an thành phố Hà Nội",
    "agency.diaDanh": "Hà Nội",
  },
};

registerRuntimeUxProfile(BM050_RUNTIME_UX_PROFILE);
