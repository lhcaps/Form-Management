/** BM-200 source-aligned runtime UX for the holdout complaint-receipt notice. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM200_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Tiếp nhận khiếu nại hoặc kiến nghị",
    description:
      "Thông báo việc Viện kiểm sát đã tiếp nhận khiếu nại hoặc kiến nghị về quyết định áp dụng hoặc không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng.",
  },
] as const;

const BM200_FIELDS = {
  "agency.name": {
    label: "Viện kiểm sát tiếp nhận",
    placeholder: "Tên Viện kiểm sát ban hành thông báo",
  },
  "document.fullDocumentCode": {
    label: "Số thông báo",
    placeholder: "Số .../TB-VKS",
  },
} as const;

const BM200_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-200",
  versionLabel: "BM-200 curated complaint-receipt notice; holdout policy preserved",
  sections: BM200_SECTIONS,
  fields: BM200_FIELDS,
  demo: {},
};

registerRuntimeUxProfile(BM200_RUNTIME_UX_PROFILE);
