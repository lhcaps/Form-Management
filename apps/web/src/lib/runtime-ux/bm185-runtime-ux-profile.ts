/** BM-185 UI metadata for the supplementary social-investigation request. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM185_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Yêu cầu lập Báo cáo điều tra xã hội bổ sung",
    description:
      "Căn cứ, người chưa thành niên, người làm công tác xã hội và yêu cầu lập Báo cáo điều tra xã hội bổ sung.",
  },
] as const;

const BM185_FIELDS = {
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Ghi tên Viện kiểm sát ban hành",
  },
  "person.currentAddress": {
    label: "Nơi cư trú người chưa thành niên",
    placeholder: "Ghi nơi thường trú, tạm trú hoặc nơi ở hiện tại",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh người chưa thành niên",
    placeholder: "Ghi ngày, tháng, năm sinh",
  },
  "person.personFullName": {
    label: "Họ và tên người chưa thành niên",
    placeholder: "Ghi họ và tên",
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

const BM185_DEMO_RUNTIME_UX = {} as const;

const BM185_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-185",
  versionLabel: "BM-185 runtime-ux supplementary social-investigation request profile",
  sections: BM185_SECTIONS,
  fields: BM185_FIELDS,
  demo: BM185_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM185_RUNTIME_UX_PROFILE);
