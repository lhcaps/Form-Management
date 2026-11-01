/** BM-186 UI metadata for the juvenile-diversion procedure notification. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM186_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông báo áp dụng thủ tục xử lý chuyển hướng",
    description:
      "Căn cứ và nội dung thông báo việc áp dụng hoặc không áp dụng thủ tục xử lý chuyển hướng đối với người chưa thành niên.",
  },
] as const;

const BM186_FIELDS = {
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Ghi tên Viện kiểm sát ban hành",
  },
  "recipients.personLine": {
    label: "Họ và tên người chưa thành niên",
    placeholder: "Ghi họ và tên",
  },
  "recipients.personLine15": {
    label: "Người nhận thông báo",
    placeholder: "Ghi cơ quan hoặc người nhận thông báo",
  },
  "document.reasonLine": {
    label: "Lý do và căn cứ thông báo",
    placeholder: "Ghi lý do, căn cứ ra Thông báo",
  },
  "document.issuePlace": {
    label: "Địa danh ban hành",
    placeholder: "Ghi địa danh nơi đặt trụ sở Viện kiểm sát",
  },
  "recipients.personLine14": {
    label: "Người đại diện",
    placeholder: "Ghi họ tên và nơi cư trú hoặc nơi làm việc",
  },
  "recipients.personLine13": {
    label: "Người bào chữa",
    placeholder: "Ghi họ tên và nơi làm việc nếu có",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Ghi ngày, tháng, năm ban hành",
  },
  "recipients.personLine12": {
    label: "Người làm công tác xã hội",
    placeholder: "Ghi họ tên nếu có",
  },
  "recipients.personLine11": {
    label: "Cơ quan hoặc người có thẩm quyền điều tra",
    placeholder: "Ghi cơ quan hoặc người có thẩm quyền điều tra",
  },
  "recipients.personLine10": {
    label: "Thông tin liên hệ người nhận",
    placeholder: "Ghi thông tin liên hệ nếu có",
  },
  "recipients.personLine9": {
    label: "Nơi cư trú người chưa thành niên",
    placeholder: "Ghi nơi thường trú, tạm trú hoặc nơi ở hiện tại",
  },
  "recipients.personLine8": {
    label: "Trình độ văn hóa",
    placeholder: "Ghi trình độ văn hóa",
  },
  "recipients.personLine7": {
    label: "Người đại diện hoặc người bào chữa",
    placeholder: "Ghi thông tin theo nội dung thông báo",
  },
  "recipients.personLine6": {
    label: "Tên gọi khác",
    placeholder: "Ghi tên gọi khác nếu có",
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
    label: "Nơi cấp giấy tờ tùy thân",
    placeholder: "Ghi ngày, tháng, năm và nơi cấp",
  },
  "recipients.personLine2": {
    label: "Nội dung thông báo",
    placeholder: "Ghi việc áp dụng hoặc không áp dụng thủ tục xử lý chuyển hướng",
  },
  "document.fullDocumentCode": {
    label: "Số thông báo",
    placeholder: ".../TB-VKS",
  },
} as const;

const BM186_DEMO_RUNTIME_UX = {} as const;

const BM186_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-186",
  versionLabel: "BM-186 runtime-ux juvenile-diversion notification profile",
  sections: BM186_SECTIONS,
  fields: BM186_FIELDS,
  demo: BM186_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM186_RUNTIME_UX_PROFILE);
