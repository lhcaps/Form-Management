import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM077_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-077",
  versionLabel: "BM-077 curated defence-counsel appointment profile",
  sections: [
    {
      sectionId: "section-thong-tin-bieu-mau",
      title: "Yêu cầu/đề nghị cử người bào chữa",
      description:
        "Viện kiểm sát ban hành và số văn bản yêu cầu hoặc đề nghị cơ quan, tổ chức cử người bào chữa.",
    },
  ],
  fields: {
    "agency.name": {
      label: "Viện kiểm sát ban hành yêu cầu/đề nghị",
    },
    "document.fullDocumentCode": {
      label: "Số văn bản yêu cầu/đề nghị cử người bào chữa",
    },
  },
  demo: {
    "agency.name": "Viện kiểm sát nhân dân Khu vực 7",
    "document.fullDocumentCode": "77/YCĐN-VKSKV7",
  },
};

registerRuntimeUxProfile(BM077_RUNTIME_UX_PROFILE);
