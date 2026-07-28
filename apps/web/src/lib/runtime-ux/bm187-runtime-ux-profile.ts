/** BM-187 UI metadata for the juvenile-diversion plan request. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM187_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Yêu cầu xây dựng kế hoạch xử lý chuyển hướng",
    description:
      "Yêu cầu người làm công tác xã hội xây dựng kế hoạch xử lý chuyển hướng hoặc kế hoạch xử lý chuyển hướng bổ sung cho người chưa thành niên.",
  },
] as const;

const BM187_FIELDS = {
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Ghi tên Viện kiểm sát ban hành",
  },
  "recipients.personLine": {
    label: "Họ và tên người chưa thành niên",
    placeholder: "Ghi họ và tên",
  },
  "recipients.personLine13": {
    label: "Người làm công tác xã hội",
    placeholder: "Ghi họ tên người làm công tác xã hội",
  },
  "recipients.personLine12": {
    label: "Người nhận thông báo",
    placeholder: "Ghi người nhận nếu có",
  },
  "recipients.personLine11": {
    label: "Nội dung vụ án",
    placeholder: "Tóm tắt nội dung vụ án và diễn biến liên quan",
  },
  "recipients.personLine10": {
    label: "Tội danh và căn cứ khởi tố",
    placeholder: "Ghi tội danh, khoản và điều luật",
  },
  "recipients.personLine9": {
    label: "Lý do yêu cầu xây dựng kế hoạch",
    placeholder: "Ghi lý do yêu cầu",
  },
  "recipients.personLine8": {
    label: "Biện pháp xử lý chuyển hướng",
    placeholder: "Ghi căn cứ áp dụng và tên biện pháp",
  },
  "recipients.personLine7": {
    label: "Thời hạn lập kế hoạch",
    placeholder: "07 ngày hoặc 03 ngày tùy loại kế hoạch",
  },
  "recipients.personLine6": {
    label: "Nơi cư trú người chưa thành niên",
    placeholder: "Ghi nơi thường trú, tạm trú hoặc nơi ở hiện tại",
  },
  "recipients.personLine5": {
    label: "Nghề nghiệp",
    placeholder: "Ghi nghề nghiệp",
  },
  "recipients.personLine4": {
    label: "Giấy tờ tùy thân",
    placeholder: "Ghi số giấy tờ tùy thân hoặc số định danh cá nhân",
  },
  "recipients.personLine3": {
    label: "Nơi nhận",
    placeholder: "Người đại diện, người bào chữa của người chưa thành niên",
  },
  "recipients.personLine2": {
    label: "Số và ngày quyết định khởi tố vụ án",
    placeholder: "Ghi số, ngày và cơ quan ban hành",
  },
  "document.issueDate": {
    label: "Ngày ban hành yêu cầu",
    placeholder: "Ghi ngày, tháng, năm ban hành",
  },
  "document.fullDocumentCode": {
    label: "Số yêu cầu",
    placeholder: ".../YC-VKS",
  },
} as const;

const BM187_DEMO_RUNTIME_UX = {} as const;

const BM187_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-187",
  versionLabel: "BM-187 runtime-ux juvenile-diversion plan-request profile",
  sections: BM187_SECTIONS,
  fields: BM187_FIELDS,
  demo: BM187_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM187_RUNTIME_UX_PROFILE);
