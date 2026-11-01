/** BM-201 source-aligned runtime UX for the complaint or recommendation decision. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM201_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Giải quyết khiếu nại hoặc kiến nghị",
    description:
      "Quyết định chấp nhận hoặc không chấp nhận khiếu nại, kiến nghị và hủy bỏ hoặc giữ nguyên quyết định xử lý chuyển hướng tại cộng đồng.",
  },
] as const;

const BM201_FIELDS = {
  "agency.name": { label: "Viện kiểm sát giải quyết", placeholder: "Tên Viện kiểm sát ban hành quyết định" },
  "recipients.personLine": { label: "Người khiếu nại hoặc cơ quan kiến nghị", placeholder: "Họ tên người khiếu nại hoặc tên cơ quan kiến nghị" },
  "recipients.personLine14": { label: "Cơ quan hoặc người ra quyết định bị khiếu nại", placeholder: "Tên cơ quan hoặc người có thẩm quyền" },
  "recipients.personLine13": { label: "Lý do giải quyết", placeholder: "Lý do chấp nhận hoặc không chấp nhận" },
  "recipients.personLine12": { label: "Người chưa thành niên", placeholder: "Họ tên người chưa thành niên" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "recipients.personLine11": { label: "Giới tính", placeholder: "Giới tính người chưa thành niên" },
  "recipients.personLine10": { label: "Tên gọi khác", placeholder: "Tên gọi khác, nếu có" },
  "recipients.personLine9": { label: "Ngày sinh và nơi sinh", placeholder: "Ngày sinh, nơi sinh" },
  "recipients.personLine8": { label: "Quốc tịch, dân tộc, tôn giáo", placeholder: "Thông tin quốc tịch, dân tộc, tôn giáo" },
  "recipients.personLine7": { label: "Nghề nghiệp", placeholder: "Nghề nghiệp" },
  "recipients.personLine6": { label: "Giấy tờ định danh", placeholder: "Số CMND, CCCD, hộ chiếu hoặc số định danh" },
  "recipients.personLine5": { label: "Thông tin cấp giấy tờ", placeholder: "Ngày cấp và nơi cấp" },
  "recipients.personLine4": { label: "Nơi thường trú", placeholder: "Địa chỉ thường trú" },
  "recipients.personLine3": { label: "Nơi tạm trú", placeholder: "Địa chỉ tạm trú" },
  "recipients.personLine2": { label: "Nơi ở hiện tại", placeholder: "Địa chỉ nơi ở hiện tại" },
  "document.fullDocumentCode": { label: "Số quyết định", placeholder: "Số .../QĐ-VKS" },
} as const;

const BM201_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-201",
  versionLabel: "BM-201 curated complaint or recommendation disposition",
  sections: BM201_SECTIONS,
  fields: BM201_FIELDS,
  demo: {},
};

registerRuntimeUxProfile(BM201_RUNTIME_UX_PROFILE);
