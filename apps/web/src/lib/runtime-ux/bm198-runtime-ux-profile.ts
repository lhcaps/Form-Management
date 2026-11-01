/** BM-198 source-aligned runtime UX for postponing a community-diversion meeting. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM198_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Hoãn phiên họp xem xét xử lý chuyển hướng",
    description:
      "Quyết định hoãn phiên họp xem xét áp dụng xử lý chuyển hướng tại cộng đồng theo khoản 4 và khoản 5 Điều 60, kèm lý do và việc ấn định hoặc thông báo lịch mở lại.",
  },
] as const;

const BM198_FIELDS = {
  "agency.name": { label: "Viện kiểm sát hoãn phiên họp", placeholder: "Tên Viện kiểm sát ban hành" },
  "document.issueDate": { label: "Ngày ban hành quyết định hoãn", placeholder: "Ngày, tháng, năm ban hành" },
  "document.fullDocumentCode": { label: "Số quyết định hoãn", placeholder: "Số .../QĐ-VKS" },
} as const;

const BM198_DEMO_RUNTIME_UX = {} as const;

const BM198_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-198",
  versionLabel: "BM-198 curated community-diversion meeting postponement",
  sections: BM198_SECTIONS,
  fields: BM198_FIELDS,
  demo: BM198_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM198_RUNTIME_UX_PROFILE);
