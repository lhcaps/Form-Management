/** BM-203 source-aligned runtime UX for a juvenile procedural-activity notice. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM203_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông báo về hoạt động tố tụng",
    description:
      "Thông báo cho người bào chữa, người đại diện hoặc người bảo vệ quyền và lợi ích hợp pháp về thời gian, địa điểm và hoạt động tố tụng mà họ có quyền tham gia.",
  },
] as const;

const BM203_FIELDS = {
  "agency.name": { label: "Viện kiểm sát thông báo", placeholder: "Tên Viện kiểm sát ban hành thông báo" },
  "recipients.personLine": { label: "Người được thông báo", placeholder: "Họ tên người được thông báo" },
  "recipients.personLine5": { label: "Địa chỉ người được thông báo", placeholder: "Địa chỉ liên hệ" },
  "recipients.personLine4": { label: "Số điện thoại người được thông báo", placeholder: "Số điện thoại liên hệ" },
  "recipients.personLine15": { label: "Tư cách của người được thông báo", placeholder: "Người đại diện, người bào chữa hoặc người bảo vệ quyền lợi" },
  "recipients.personLine3": { label: "Người chưa thành niên", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine2": { label: "Tư cách tố tụng của người chưa thành niên", placeholder: "Tư cách tham gia tố tụng" },
  "document.issuePlace": { label: "Địa điểm tiến hành hoạt động tố tụng", placeholder: "Tên và địa chỉ nơi tiến hành" },
  "document.issueDate": { label: "Thời gian tiến hành hoạt động tố tụng", placeholder: "Giờ, ngày, tháng, năm" },
  "case.caseNumber2": { label: "Hoạt động tố tụng được thông báo", placeholder: "Tên hoạt động tố tụng" },
  "case.caseNumber": { label: "Vụ việc hoặc vụ án liên quan", placeholder: "Tóm tắt vụ việc hoặc số quyết định khởi tố vụ án" },
  "recipients.personLine14": { label: "Người tiến hành hoạt động tố tụng", placeholder: "Họ tên và chức danh" },
  "recipients.personLine13": { label: "Số điện thoại người tiến hành tố tụng", placeholder: "Số điện thoại liên hệ" },
  "recipients.personLine12": { label: "Giới tính người chưa thành niên", placeholder: "Giới tính" },
  "recipients.personLine11": { label: "Tên gọi khác", placeholder: "Tên gọi khác, nếu có" },
  "recipients.personLine10": { label: "Ngày sinh và nơi sinh", placeholder: "Ngày sinh, nơi sinh" },
  "recipients.personLine9": { label: "Quốc tịch, dân tộc, tôn giáo", placeholder: "Thông tin quốc tịch, dân tộc, tôn giáo" },
  "recipients.personLine8": { label: "Nghề nghiệp", placeholder: "Nghề nghiệp" },
  "recipients.personLine7": { label: "Giấy tờ định danh", placeholder: "Số CMND, CCCD, hộ chiếu hoặc số định danh" },
  "recipients.personLine6": { label: "Nơi cư trú", placeholder: "Nơi thường trú, tạm trú hoặc nơi ở hiện tại" },
  "document.fullDocumentCode": { label: "Số thông báo", placeholder: "Số .../TB-VKS" },
} as const;

const BM203_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-203",
  versionLabel: "BM-203 curated juvenile procedural-activity notice",
  sections: BM203_SECTIONS,
  fields: BM203_FIELDS,
  demo: {},
};

registerRuntimeUxProfile(BM203_RUNTIME_UX_PROFILE);
