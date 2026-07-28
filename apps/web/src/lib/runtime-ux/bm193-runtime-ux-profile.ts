/** BM-193 source-aligned runtime UX for changing community diversion. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM193_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Quyết định thay đổi xử lý chuyển hướng tại cộng đồng",
    description:
      "Biện pháp đang áp dụng, biện pháp thay thế, thời hạn và trách nhiệm thi hành quyết định thay đổi xử lý chuyển hướng.",
  },
] as const;

const BM193_FIELDS = {
  "agency.name": { label: "Viện kiểm sát ra quyết định", placeholder: "Tên Viện kiểm sát ban hành" },
  "recipients.personLine": { label: "Người chưa thành niên được thay đổi biện pháp", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine13": { label: "Chức danh người ký", placeholder: "Chức danh người ký quyết định" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "document.fullDocumentCode": { label: "Số quyết định thay đổi", placeholder: "Số .../QĐ-VKS" },
  "recipients.personLine12": { label: "Ủy ban nhân dân đề nghị thay đổi", placeholder: "Tên Ủy ban nhân dân cấp xã" },
  "recipients.personLine11": { label: "Biện pháp đang áp dụng", placeholder: "Tên biện pháp hiện hành" },
  "recipients.personLine10": { label: "Biện pháp thay thế", placeholder: "Tên biện pháp được thay đổi sang" },
  "recipients.personLine9": { label: "Người bào chữa", placeholder: "Họ tên và nơi làm việc" },
  "recipients.personLine8": { label: "Thời hạn áp dụng biện pháp", placeholder: "Thời hạn và khoảng ngày áp dụng" },
  "recipients.personLine7": { label: "Thời hạn thực hiện nghĩa vụ", placeholder: "Thời hạn và khoảng ngày thực hiện" },
  "recipients.personLine6": { label: "Nội dung quyết định liên quan", placeholder: "Các nội dung khác có liên quan" },
  "recipients.personLine5": { label: "Cơ quan, tổ chức, cá nhân thi hành", placeholder: "Chủ thể có trách nhiệm thi hành" },
  "recipients.personLine4": { label: "Giấy tờ định danh", placeholder: "Số CMND, CCCD, hộ chiếu hoặc số định danh" },
  "recipients.personLine3": { label: "Nơi thường trú hoặc tạm trú", placeholder: "Địa chỉ cư trú" },
  "recipients.personLine2": { label: "Nơi ở hiện tại", placeholder: "Địa chỉ hiện tại" },
} as const;

const BM193_DEMO_RUNTIME_UX = {} as const;

const BM193_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-193",
  versionLabel: "BM-193 curated community diversion change",
  sections: BM193_SECTIONS,
  fields: BM193_FIELDS,
  demo: BM193_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM193_RUNTIME_UX_PROFILE);
