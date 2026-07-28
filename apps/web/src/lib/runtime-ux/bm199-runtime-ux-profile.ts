/** BM-199 source-aligned runtime UX for a Court diversion-decision recommendation. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM199_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Kiến nghị về quyết định xử lý chuyển hướng của Tòa án",
    description:
      "Kiến nghị người có thẩm quyền xem xét hủy bỏ, sửa đổi hoặc xem xét lại quyết định áp dụng hoặc không áp dụng biện pháp xử lý chuyển hướng của Tòa án.",
  },
] as const;

const BM199_FIELDS = {
  "agency.name": { label: "Viện kiểm sát kiến nghị", placeholder: "Tên Viện kiểm sát ban hành" },
  "recipients.personLine": { label: "Người chưa thành niên liên quan", placeholder: "Họ tên người chưa thành niên" },
  "decision.decisionLine": { label: "Lý do và căn cứ kiến nghị", placeholder: "Nhận định và căn cứ pháp luật của Viện kiểm sát" },
  "decision.decisionLine2": { label: "Nội dung đề nghị xem xét", placeholder: "Hủy bỏ, sửa đổi hoặc xem xét lại quyết định" },
  "document.issuePlace": { label: "Địa danh ban hành", placeholder: "Tỉnh hoặc thành phố nơi ban hành" },
  "recipients.personLine14": { label: "Chức danh người ký", placeholder: "Chức danh người ký kiến nghị" },
  "recipients.personLine13": { label: "Người có thẩm quyền giải quyết kiến nghị", placeholder: "Chức danh, chức vụ người nhận kiến nghị" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "recipients.personLine12": { label: "Hồ sơ vụ án và phiên họp liên quan", placeholder: "Vụ án, ngày và địa điểm phiên họp" },
  "recipients.personLine11": { label: "Giới tính", placeholder: "Giới tính người chưa thành niên" },
  "recipients.personLine10": { label: "Tên gọi khác", placeholder: "Tên gọi khác, nếu có" },
  "recipients.personLine9": { label: "Ngày sinh và nơi sinh", placeholder: "Ngày sinh, nơi sinh" },
  "recipients.personLine8": { label: "Quốc tịch, dân tộc, tôn giáo", placeholder: "Thông tin quốc tịch, dân tộc, tôn giáo" },
  "recipients.personLine7": { label: "Nghề nghiệp", placeholder: "Nghề nghiệp" },
  "recipients.personLine6": { label: "Giấy tờ định danh", placeholder: "Số CMND, CCCD, hộ chiếu hoặc số định danh" },
  "recipients.personLine5": { label: "Thông tin cấp giấy tờ", placeholder: "Ngày cấp và nơi cấp" },
  "recipients.personLine4": { label: "Nơi thường trú", placeholder: "Địa chỉ thường trú" },
  "recipients.personLine3": { label: "Nơi tạm trú", placeholder: "Địa chỉ tạm trú" },
  "recipients.personLine2": { label: "Nơi ở hiện tại và trình độ văn hóa", placeholder: "Địa chỉ hiện tại và trình độ văn hóa" },
  "document.fullDocumentCode": { label: "Số kiến nghị", placeholder: "Số .../KN-VKS" },
} as const;

const BM199_DEMO_RUNTIME_UX = {} as const;

const BM199_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-199",
  versionLabel: "BM-199 curated Court diversion-decision recommendation",
  sections: BM199_SECTIONS,
  fields: BM199_FIELDS,
  demo: BM199_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM199_RUNTIME_UX_PROFILE);
