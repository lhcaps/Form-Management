/** BM-194 source-aligned runtime UX for cancelling an application decision. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM194_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Hủy bỏ quyết định áp dụng xử lý chuyển hướng",
    description:
      "Quyết định hủy bỏ biện pháp xử lý chuyển hướng đã được áp dụng vì không có căn cứ, trái pháp luật; yêu cầu tiếp tục giải quyết vụ án hoặc mở lại phiên họp.",
  },
] as const;

const BM194_FIELDS = {
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

const BM194_DEMO_RUNTIME_UX = {} as const;

const BM194_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-194",
  versionLabel: "BM-194 curated cancellation of application decision",
  sections: BM194_SECTIONS,
  fields: BM194_FIELDS,
  demo: BM194_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM194_RUNTIME_UX_PROFILE);
