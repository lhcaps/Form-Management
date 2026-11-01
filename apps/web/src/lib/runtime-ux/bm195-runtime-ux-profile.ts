/** BM-195 source-aligned runtime UX for cancelling a non-application decision. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM195_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Hủy bỏ quyết định không áp dụng xử lý chuyển hướng",
    description:
      "Quyết định hủy bỏ việc không áp dụng biện pháp xử lý chuyển hướng vì không có căn cứ, trái pháp luật; yêu cầu mở lại phiên họp xem xét, quyết định áp dụng.",
  },
] as const;

const BM195_FIELDS = {
  "agency.name": {
    label: "Viện kiểm sát hủy bỏ quyết định",
    placeholder: "Tên Viện kiểm sát ban hành",
  },
  "document.issueDate": {
    label: "Ngày ban hành quyết định hủy bỏ",
    placeholder: "Ngày, tháng, năm ban hành",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định hủy bỏ",
    placeholder: "Số .../QĐ-VKS",
  },
} as const;

const BM195_DEMO_RUNTIME_UX = {} as const;

const BM195_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-195",
  versionLabel: "BM-195 curated cancellation of non-application decision",
  sections: BM195_SECTIONS,
  fields: BM195_FIELDS,
  demo: BM195_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM195_RUNTIME_UX_PROFILE);
