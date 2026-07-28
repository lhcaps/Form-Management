/** BM-191 source-aligned runtime UX for applying community diversion. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM191_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Quyết định áp dụng xử lý chuyển hướng tại cộng đồng",
    description:
      "Căn cứ, biện pháp, thời hạn và trách nhiệm thi hành quyết định áp dụng xử lý chuyển hướng tại cộng đồng.",
  },
] as const;

const BM191_FIELDS = {
  "agency.name": { label: "Viện kiểm sát ra quyết định", placeholder: "Tên Viện kiểm sát ban hành" },
  "recipients.personLine": { label: "Người chưa thành niên được áp dụng", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine13": { label: "Chức danh người ký", placeholder: "Chức danh người ký quyết định" },
  "document.reasonLine": { label: "Lý do và căn cứ áp dụng", placeholder: "Lý do, căn cứ ra quyết định" },
  "document.issuePlace": { label: "Địa danh ban hành", placeholder: "Tỉnh hoặc thành phố nơi ban hành" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "recipients.personLine12": { label: "Biện pháp xử lý chuyển hướng", placeholder: "Tên biện pháp được áp dụng" },
  "recipients.personLine11": { label: "Người đại diện", placeholder: "Họ tên và nơi cư trú hoặc làm việc" },
  "recipients.personLine10": { label: "Người bào chữa", placeholder: "Họ tên và nơi làm việc" },
  "recipients.personLine9": { label: "Thời hạn áp dụng biện pháp", placeholder: "Thời hạn và khoảng ngày áp dụng" },
  "recipients.personLine8": { label: "Thời hạn thực hiện nghĩa vụ", placeholder: "Thời hạn và khoảng ngày thực hiện" },
  "recipients.personLine7": { label: "Nội dung quyết định liên quan", placeholder: "Đình chỉ vụ án, vật chứng và nội dung liên quan" },
  "recipients.personLine6": { label: "Cơ quan, tổ chức, cá nhân thi hành", placeholder: "Chủ thể có trách nhiệm thi hành" },
  "recipients.personLine5": { label: "Giấy tờ định danh", placeholder: "Số CMND, CCCD, hộ chiếu hoặc số định danh" },
  "recipients.personLine4": { label: "Nơi thường trú", placeholder: "Địa chỉ thường trú" },
  "recipients.personLine3": { label: "Nơi tạm trú", placeholder: "Địa chỉ tạm trú" },
  "recipients.personLine2": { label: "Nơi ở hiện tại", placeholder: "Địa chỉ hiện tại" },
  "document.fullDocumentCode": { label: "Số quyết định áp dụng", placeholder: "Số .../QĐ-VKS" },
} as const;

const BM191_DEMO_RUNTIME_UX = {} as const;

const BM191_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-191",
  versionLabel: "BM-191 curated community diversion application",
  sections: BM191_SECTIONS,
  fields: BM191_FIELDS,
  demo: BM191_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM191_RUNTIME_UX_PROFILE);
