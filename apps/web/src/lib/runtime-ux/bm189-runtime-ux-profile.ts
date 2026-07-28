/** BM-189 source-aligned runtime UX for the investigation-authority request. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM189_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Yêu cầu thực hiện thủ tục đề nghị giáo dưỡng",
    description:
      "Yêu cầu cơ quan điều tra làm thủ tục đề nghị Tòa án áp dụng biện pháp giáo dục tại trường giáo dưỡng.",
  },
] as const;

const BM189_FIELDS = {
  "agency.name": { label: "Viện kiểm sát yêu cầu", placeholder: "Tên Viện kiểm sát ban hành" },
  "recipients.personLine": { label: "Người chưa thành niên được xem xét", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine15": { label: "Chức danh người ký", placeholder: "Chức danh người ký yêu cầu" },
  "recipients.personLine14": { label: "Cơ quan điều tra được yêu cầu", placeholder: "Tên cơ quan, người có thẩm quyền điều tra" },
  "recipients.personLine13": { label: "Cơ quan khởi tố vụ án", placeholder: "Cơ quan, người ra quyết định khởi tố vụ án" },
  "document.fullDocumentCode": { label: "Số công văn yêu cầu", placeholder: "Số .../CV-VKS" },
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
} as const;

const BM189_DEMO_RUNTIME_UX = {} as const;

const BM189_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-189",
  versionLabel: "BM-189 curated investigation-authority request",
  sections: BM189_SECTIONS,
  fields: BM189_FIELDS,
  demo: BM189_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM189_RUNTIME_UX_PROFILE);
