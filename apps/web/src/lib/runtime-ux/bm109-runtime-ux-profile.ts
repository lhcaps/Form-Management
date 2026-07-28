import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM109_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Hủy bỏ Quyết định tạm đình chỉ điều tra vụ án hình sự đối với bị can",
    description:
      "Thông tin Viện kiểm sát, người hoặc pháp nhân bị khởi tố, quyết định tạm đình chỉ bị hủy bỏ, cơ quan giải quyết vụ án và chức danh người ký theo các slot được contract mở ra.",
  },
] as const;

const BM109_PRESENTATION_SECTIONS = [
  {
    id: "co-quan-ban-hanh",
    title: "Viện kiểm sát ban hành",
    description:
      "Tên Viện kiểm sát ở đầu văn bản và dòng chức danh Viện trưởng.",
    fieldKeys: ["agency.vienKiem"],
  },
  {
    id: "doi-tuong-va-quyet-dinh-bi-huy-bo",
    title: "Đối tượng và quyết định tạm đình chỉ bị hủy bỏ",
    description:
      "Người hoặc pháp nhân bị khởi tố và cơ quan, người đã ban hành Quyết định tạm đình chỉ điều tra vụ án hình sự đối với bị can.",
    fieldKeys: ["document.soQuyet", "agency.diaDanh"],
  },
  {
    id: "thi-hanh-va-ky-ban-hanh",
    title: "Giải quyết vụ án và ký ban hành",
    description:
      "Cơ quan hoặc người được yêu cầu giải quyết vụ án và chức danh người ký quyết định.",
    fieldKeys: ["document.ngayBan", "agency.dongDia"],
  },
] as const;

const BM109_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Tên Viện kiểm sát ban hành quyết định",
  },
  "document.soQuyet": {
    label: "Người hoặc pháp nhân bị khởi tố",
    placeholder: "Họ tên người hoặc tên pháp nhân bị khởi tố",
    helpText:
      "Key lịch sử `document.soQuyet` nằm sau cụm “đối với” trong dòng xét Quyết định tạm đình chỉ điều tra vụ án hình sự đối với bị can của DOCX.",
  },
  "agency.diaDanh": {
    label:
      "Cơ quan, người có thẩm quyền ban hành Quyết định tạm đình chỉ điều tra vụ án hình sự đối với bị can",
    placeholder:
      "Tên cơ quan hoặc người có thẩm quyền ban hành Quyết định tạm đình chỉ điều tra vụ án hình sự đối với bị can",
    helpText:
      "Key lịch sử `agency.diaDanh` nằm trong câu nêu quyết định bị hủy bỏ tại Điều 1 của DOCX.",
  },
  "document.ngayBan": {
    label: "Cơ quan, người được yêu cầu giải quyết vụ án",
    placeholder: "Tên cơ quan hoặc người có thẩm quyền giải quyết vụ án",
    helpText:
      "Key lịch sử `document.ngayBan` nằm tại dòng yêu cầu giải quyết vụ án của DOCX.",
  },
  "agency.dongDia": {
    label: "Chức danh người ký quyết định",
    placeholder: "Chức danh người ký",
    helpText:
      "Key lịch sử `agency.dongDia` nằm tại vị trí ký và theo chú thích của Mẫu số 109/HS.",
  },
} as const;

const BM109_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN ...",
  "document.soQuyet": "...",
  "agency.diaDanh": "...",
  "document.ngayBan": "...",
  "agency.dongDia": "VIỆN TRƯỞNG",
} as const;

const BM109_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-109",
  versionLabel: "BM-109 curated case-investigation-suspension-cancellation profile",
  sections: BM109_SECTIONS,
  presentationSections: BM109_PRESENTATION_SECTIONS,
  fields: BM109_FIELDS,
  demo: BM109_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM109_RUNTIME_UX_PROFILE);
