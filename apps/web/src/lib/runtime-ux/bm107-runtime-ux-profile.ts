import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM107_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Hủy bỏ Quyết định tạm đình chỉ điều tra vụ án hình sự",
    description:
      "Thông tin Viện kiểm sát ban hành, cơ quan hoặc người đã ban hành quyết định tạm đình chỉ và chức danh người ký; các căn cứ, số/ngày quyết định và Điều 1–2 không có key riêng trong contract.",
  },
] as const;

const BM107_PRESENTATION_SECTIONS = [
  {
    id: "co-quan-ban-hanh",
    title: "Viện kiểm sát ban hành",
    description: "Tên Viện kiểm sát thể hiện ở đầu văn bản và dòng chức danh Viện trưởng.",
    fieldKeys: ["agency.vienKiem"],
  },
  {
    id: "quyet-dinh-tam-dinh-chi",
    title: "Quyết định tạm đình chỉ bị hủy bỏ",
    description:
      "Cơ quan hoặc người có thẩm quyền đã ban hành Quyết định tạm đình chỉ điều tra được nêu trong phần xét quyết định.",
    fieldKeys: ["document.soQuyet"],
  },
  {
    id: "ky-ban-hanh",
    title: "Ký ban hành",
    description: "Chức danh người ký quyết định theo chú thích của mẫu.",
    fieldKeys: ["agency.diaDanh"],
  },
] as const;

const BM107_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Tên Viện kiểm sát ban hành quyết định",
  },
  "document.soQuyet": {
    label:
      "Cơ quan, người có thẩm quyền ban hành Quyết định tạm đình chỉ điều tra",
    placeholder:
      "Tên cơ quan hoặc người có thẩm quyền ban hành Quyết định tạm đình chỉ điều tra",
    helpText:
      "Key lịch sử `document.soQuyet` nằm sau cụm “của” trong dòng xét Quyết định tạm đình chỉ điều tra của DOCX.",
  },
  "agency.diaDanh": {
    label: "Chức danh người ký quyết định",
    placeholder: "Chức danh người ký",
    helpText:
      "Key lịch sử `agency.diaDanh` nằm tại vị trí ký và theo chú thích 6 của Mẫu số 107/HS.",
  },
} as const;

const BM107_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN ...",
  "document.soQuyet": "...",
  "agency.diaDanh": "VIỆN TRƯỞNG",
} as const;

const BM107_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-107",
  versionLabel: "BM-107 curated cancellation-of-investigation-suspension profile",
  sections: BM107_SECTIONS,
  presentationSections: BM107_PRESENTATION_SECTIONS,
  fields: BM107_FIELDS,
  demo: BM107_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM107_RUNTIME_UX_PROFILE);
