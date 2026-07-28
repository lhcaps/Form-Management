/** BM-190 source-aligned runtime UX for the direct court proposal. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM190_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Đề nghị Tòa án áp dụng biện pháp giáo dưỡng",
    description:
      "Đề nghị trực tiếp Tòa án xem xét, quyết định áp dụng biện pháp giáo dục tại trường giáo dưỡng.",
  },
] as const;

const BM190_FIELDS = {
  "agency.name": { label: "Viện kiểm sát đề nghị", placeholder: "Tên Viện kiểm sát ban hành" },
  "recipients.personLine": { label: "Người chưa thành niên được đề nghị áp dụng", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine15": { label: "Chức danh người ký", placeholder: "Chức danh người ký đề nghị" },
  "document.issuePlace": { label: "Địa danh ban hành", placeholder: "Tỉnh hoặc thành phố nơi ban hành" },
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

const BM190_DEMO_RUNTIME_UX = {} as const;

const BM190_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-190",
  versionLabel: "BM-190 curated direct court proposal",
  sections: BM190_SECTIONS,
  fields: BM190_FIELDS,
  demo: BM190_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM190_RUNTIME_UX_PROFILE);
