/** BM-196 source-aligned runtime UX for opening a community-diversion meeting. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM196_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Mở phiên họp xem xét xử lý chuyển hướng tại cộng đồng",
    description:
      "Quyết định mở phiên họp, xác định người chưa thành niên, thành phần tham gia, thời gian, địa điểm và hình thức xem xét áp dụng xử lý chuyển hướng tại cộng đồng.",
  },
] as const;

const BM196_FIELDS = {
  "agency.name": { label: "Viện kiểm sát mở phiên họp", placeholder: "Tên Viện kiểm sát ban hành" },
  "recipients.personLine": { label: "Người chưa thành niên được xem xét", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine15": { label: "Chức danh người ký", placeholder: "Chức danh người ký quyết định" },
  "document.reasonLine": { label: "Căn cứ và điều kiện mở phiên họp", placeholder: "Căn cứ vụ án và điều kiện xử lý chuyển hướng" },
  "document.issuePlace": { label: "Địa danh ban hành", placeholder: "Tỉnh hoặc thành phố nơi ban hành" },
  "recipients.personLine14": { label: "Chủ trì phiên họp", placeholder: "Họ tên, chức danh người chủ trì" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "document.fullDocumentCode": { label: "Số quyết định mở phiên họp", placeholder: "Số .../QĐ-VKS" },
  "recipients.personLine13": { label: "Thư ký phiên họp", placeholder: "Họ tên thư ký phiên họp" },
  "recipients.personLine12": { label: "Điều tra viên tham gia", placeholder: "Họ tên Điều tra viên" },
  "recipients.personLine11": { label: "Kiểm sát viên tham gia", placeholder: "Họ tên Kiểm sát viên" },
  "recipients.personLine10": { label: "Người đại diện", placeholder: "Họ tên và nơi cư trú hoặc làm việc" },
  "recipients.personLine9": { label: "Người bào chữa", placeholder: "Họ tên và nơi làm việc" },
  "recipients.personLine8": { label: "Người làm công tác xã hội", placeholder: "Họ tên và nơi làm việc" },
  "recipients.personLine7": { label: "Người phiên dịch", placeholder: "Họ tên người phiên dịch, nếu có" },
  "recipients.personLine6": { label: "Người khác được yêu cầu tham gia", placeholder: "Họ tên và vai trò tham gia" },
  "recipients.personLine5": { label: "Thời gian mở phiên họp", placeholder: "Giờ, phút, ngày, tháng, năm" },
  "recipients.personLine4": { label: "Địa điểm mở phiên họp", placeholder: "Địa điểm tổ chức phiên họp" },
  "recipients.personLine3": { label: "Hình thức phiên họp", placeholder: "Hình thức tổ chức phiên họp" },
  "recipients.personLine2": { label: "Thông tin định danh và cư trú", placeholder: "Thông tin nhân thân còn lại của người chưa thành niên" },
} as const;

const BM196_DEMO_RUNTIME_UX = {} as const;

const BM196_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-196",
  versionLabel: "BM-196 curated community-diversion meeting opening",
  sections: BM196_SECTIONS,
  fields: BM196_FIELDS,
  demo: BM196_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM196_RUNTIME_UX_PROFILE);
