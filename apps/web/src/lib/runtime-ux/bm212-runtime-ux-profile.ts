/** BM-212 source-aligned runtime UX profile for the juvenile-procedure request. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM212_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Đề nghị hướng dẫn, hỗ trợ người chưa thành niên",
    description:
      "Công văn đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ người chưa thành niên; căn cứ Điều 154 Luật Tư pháp người chưa thành niên. Phần này tập trung vào cơ quan ban hành, người được đề nghị, người chưa thành niên và nơi nhận.",
  },
] as const;

const BM212_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Tên Viện Kiểm sát ban hành",
  },
  "recipients.personLine": {
    label: "Người được đề nghị tham gia tố tụng",
    placeholder: "Họ tên người làm công tác xã hội hoặc chuyên gia hỗ trợ",
  },
  "recipients.personLine9": {
    label: "Nơi nhận bổ sung — vị trí 9",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine8": {
    label: "Nơi nhận bổ sung — vị trí 8",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine7": {
    label: "Nơi nhận bổ sung — vị trí 7",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine23": {
    label: "Nơi nhận bổ sung — vị trí 23",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine22": {
    label: "Nơi nhận bổ sung — vị trí 22",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine6": {
    label: "Nơi nhận bổ sung — vị trí 6",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine21": {
    label: "Nơi nhận bổ sung — vị trí 21",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine20": {
    label: "Nơi nhận bổ sung — vị trí 20",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine19": {
    label: "Nơi nhận bổ sung — vị trí 19",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine18": {
    label: "Nơi nhận bổ sung — vị trí 18",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine17": {
    label: "Nơi nhận bổ sung — vị trí 17",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine16": {
    label: "Nơi nhận bổ sung — vị trí 16",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine15": {
    label: "Nơi nhận bổ sung — vị trí 15",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine14": {
    label: "Nơi nhận bổ sung — vị trí 14",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine13": {
    label: "Nơi nhận bổ sung — vị trí 13",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine12": {
    label: "Nơi nhận bổ sung — vị trí 12",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine11": {
    label: "Nơi nhận bổ sung — vị trí 11",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine5": {
    label: "Nơi nhận bổ sung — vị trí 5",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine4": {
    label: "Nơi nhận bổ sung — vị trí 4",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine3": {
    label: "Nơi nhận bổ sung — vị trí 3",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "recipients.personLine2": {
    label: "Nơi nhận bổ sung — vị trí 2",
    placeholder: "Cơ quan hoặc người nhận theo công văn",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Ngày, tháng, năm ban hành công văn",
  },
  "document.fullDocumentCode": {
    label: "Số công văn",
    placeholder: "Số công văn /CV-VKS",
  },
} as const;

const BM212_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-212",
  versionLabel: "BM-212 semantic closure profile — 25/25 fields curated",
  sections: BM212_SECTIONS,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Đề nghị hướng dẫn, hỗ trợ người chưa thành niên",
      description:
        "Công văn đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ người chưa thành niên.",
      fieldKeys: [
        "agency.name",
        "recipients.personLine",
        "recipients.personLine9",
        "recipients.personLine8",
        "recipients.personLine7",
        "recipients.personLine23",
        "recipients.personLine22",
        "recipients.personLine6",
        "recipients.personLine21",
        "recipients.personLine20",
        "recipients.personLine19",
        "recipients.personLine18",
        "recipients.personLine17",
        "recipients.personLine16",
        "recipients.personLine15",
        "recipients.personLine14",
        "recipients.personLine13",
        "recipients.personLine12",
        "recipients.personLine11",
        "recipients.personLine5",
        "recipients.personLine4",
        "recipients.personLine3",
        "recipients.personLine2",
        "document.issueDate",
        "document.fullDocumentCode",
      ],
    },
  ],
  fields: BM212_FIELDS,
  demo: {},
};

registerRuntimeUxProfile(BM212_RUNTIME_UX_PROFILE);
