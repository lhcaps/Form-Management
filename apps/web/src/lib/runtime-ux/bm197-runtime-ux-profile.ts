/** BM-197 source-aligned runtime UX for the community-diversion meeting record. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM197_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Biên bản phiên họp xem xét xử lý chuyển hướng",
    description:
      "Biên bản ghi thành phần, nội dung, diễn biến và quyết định áp dụng hoặc không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng được công bố tại phiên họp.",
  },
] as const;

const BM197_FIELDS = {
  "agency.name": { label: "Viện kiểm sát tổ chức phiên họp", placeholder: "Tên Viện kiểm sát" },
  "decision.decisionLine": { label: "Quyết định công bố tại phiên họp", placeholder: "Nội dung áp dụng hoặc không áp dụng biện pháp" },
  "recipients.personLine8": { label: "Chủ trì phiên họp", placeholder: "Họ tên, chức danh người chủ trì" },
  "recipients.personLine7": { label: "Thư ký phiên họp", placeholder: "Họ tên thư ký phiên họp" },
  "recipients.personLine6": { label: "Điều tra viên tham gia", placeholder: "Họ tên Điều tra viên" },
  "recipients.personLine5": { label: "Kiểm sát viên tham gia", placeholder: "Họ tên Kiểm sát viên" },
  "recipients.personLine4": { label: "Người chưa thành niên", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine3": { label: "Người đại diện", placeholder: "Họ tên người đại diện" },
  "recipients.personLine2": { label: "Người bào chữa và người tham gia khác", placeholder: "Họ tên, vai trò của những người tham gia còn lại" },
  "document.reasonLine": { label: "Nội dung và diễn biến phiên họp", placeholder: "Ý kiến, hỏi đáp và các vấn đề được làm rõ" },
  "document.issuePlace": { label: "Địa điểm phiên họp", placeholder: "Địa điểm tổ chức phiên họp" },
  "document.issueDate": { label: "Thời gian phiên họp", placeholder: "Giờ, phút, ngày, tháng, năm" },
  "document.fullDocumentCode": { label: "Số quyết định mở phiên họp", placeholder: "Số quyết định được viện dẫn" },
} as const;

const BM197_DEMO_RUNTIME_UX = {} as const;

const BM197_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-197",
  versionLabel: "BM-197 curated community-diversion meeting record",
  sections: BM197_SECTIONS,
  fields: BM197_FIELDS,
  demo: BM197_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM197_RUNTIME_UX_PROFILE);
