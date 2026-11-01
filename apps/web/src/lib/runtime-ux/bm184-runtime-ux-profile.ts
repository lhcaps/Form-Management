/** BM-184 UI metadata for the protection-measure request template. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM184_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Đề nghị áp dụng biện pháp bảo vệ",
    description:
      "Cơ quan gửi đề nghị, người được bảo vệ, lý do và biện pháp bảo vệ cần áp dụng theo hồ sơ nguồn.",
  },
] as const;

const BM184_FIELDS = {
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Ghi tên Viện kiểm sát ban hành",
  },
  "decision.decisionLine": {
    label: "Cơ quan có thẩm quyền ra quyết định bảo vệ",
    placeholder: "Ghi tên cơ quan có thẩm quyền",
  },
  "decision.decisionLine4": {
    label: "Biện pháp bảo vệ đề nghị áp dụng",
    placeholder: "Nêu cụ thể biện pháp bảo vệ cần áp dụng",
  },
  "document.summaryLine": {
    label: "Tóm tắt vụ việc và lý do bảo vệ",
    placeholder: "Trích dẫn ngắn gọn vụ việc và lý do cần bảo vệ",
  },
  "person.occupation": {
    label: "Nghề nghiệp người được bảo vệ",
    placeholder: "Ghi nghề nghiệp",
  },
  "decision.decisionLine3": {
    label: "Lý do bảo vệ",
    placeholder: "Ghi lý do bảo vệ",
  },
  "decision.decisionLine2": {
    label: "Người được bảo vệ",
    placeholder: "Ghi họ tên người được bảo vệ",
  },
  "person.currentAddress": {
    label: "Nơi cư trú người được bảo vệ",
    placeholder: "Ghi nơi thường trú, tạm trú hoặc nơi ở hiện tại",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh người được bảo vệ",
    placeholder: "Ghi ngày, tháng, năm sinh",
  },
  "person.personFullName": {
    label: "Họ và tên người được bảo vệ",
    placeholder: "Ghi họ và tên",
  },
  "document.issuePlace": {
    label: "Địa danh ban hành",
    placeholder: "Ghi địa danh nơi đặt trụ sở Viện kiểm sát",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Ghi ngày, tháng, năm ban hành",
  },
  "document.fullDocumentCode": {
    label: "Số công văn đề nghị",
    placeholder: ".../CV-VKS",
  },
} as const;

const BM184_DEMO_RUNTIME_UX = {} as const;

const BM184_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-184",
  versionLabel: "BM-184 runtime-ux protection-measure request profile",
  sections: BM184_SECTIONS,
  fields: BM184_FIELDS,
  demo: BM184_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM184_RUNTIME_UX_PROFILE);
