/** BM-188 source-aligned runtime UX for the diversion compensation request. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM188_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Đề nghị giải quyết bồi thường thiệt hại",
    description:
      "Thông tin đề nghị Tòa án xem xét biện pháp xử lý chuyển hướng, bồi thường thiệt hại và tịch thu tài sản.",
  },
] as const;

const BM188_FIELDS = {
  "agency.name": { label: "Viện kiểm sát đề nghị", placeholder: "Tên Viện kiểm sát ban hành" },
  "recipients.personLine": { label: "Người chưa thành niên được xem xét", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine15": { label: "Chức danh người ký", placeholder: "Chức danh người ký văn bản đề nghị" },
  "recipients.personLine14": { label: "Tòa án có thẩm quyền", placeholder: "Tên Tòa án nhận đề nghị" },
  "recipients.personLine13": { label: "Cơ quan khởi tố vụ án", placeholder: "Cơ quan, người ra quyết định khởi tố vụ án" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "recipients.personLine12": { label: "Cơ quan khởi tố bị can", placeholder: "Cơ quan, người ra quyết định khởi tố bị can" },
  "recipients.personLine11": { label: "Họ tên người chưa thành niên", placeholder: "Họ tên đầy đủ" },
  "recipients.personLine10": { label: "Giới tính", placeholder: "Giới tính" },
  "recipients.personLine9": { label: "Tên gọi khác", placeholder: "Tên gọi khác, nếu có" },
  "recipients.personLine8": { label: "Ngày sinh và nơi sinh", placeholder: "Ngày sinh, nơi sinh" },
  "recipients.personLine7": { label: "Quốc tịch, dân tộc, tôn giáo", placeholder: "Thông tin quốc tịch, dân tộc, tôn giáo" },
  "recipients.personLine6": { label: "Nghề nghiệp", placeholder: "Nghề nghiệp" },
  "recipients.personLine5": { label: "Giấy tờ định danh", placeholder: "Số CMND, CCCD, hộ chiếu hoặc số định danh" },
  "recipients.personLine4": { label: "Thông tin cấp giấy tờ", placeholder: "Ngày cấp và nơi cấp" },
  "recipients.personLine3": { label: "Nơi thường trú", placeholder: "Địa chỉ thường trú" },
  "recipients.personLine2": { label: "Nơi tạm trú hoặc ở hiện tại", placeholder: "Địa chỉ tạm trú hoặc nơi ở hiện tại" },
  "document.fullDocumentCode": { label: "Số công văn đề nghị", placeholder: "Số .../CV-VKS" },
} as const;

const BM188_DEMO_RUNTIME_UX = {} as const;

const BM188_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-188",
  versionLabel: "BM-188 curated diversion compensation request",
  sections: BM188_SECTIONS,
  fields: BM188_FIELDS,
  demo: BM188_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM188_RUNTIME_UX_PROFILE);
