/**
 * BM-004 — Quyết định thay đổi người thực hành quyền công tố, kiểm sát
 * việc giải quyết nguồn tin về tội phạm.
 *
 * The compiled contract exposes legacy key names. Labels below follow the
 * actual DOCX contexts in `BM-004__2775520fd22c.extract.md`; keys remain
 * untouched and DOCX/legal-fidelity status remains independently assessed.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM004_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định thay đổi người thực hiện",
    description: "Các dữ liệu hiện được contract nhận diện cho quyết định thay đổi người thực hành quyền công tố, kiểm sát giải quyết nguồn tin.",
  },
] as const;

const BM004_PRESENTATION_SECTIONS = [
  {
    id: "thong-tin-quyet-dinh-thay-doi",
    title: "1. Thông tin quyết định thay đổi",
    description: "Xác định Viện kiểm sát, nội dung xét thấy, chức danh người được thay đổi và người ký quyết định.",
    fieldKeys: [
      "agency.vienKiem",
      "agency.tenCo",
      "document.vietTat",
      "signature.positionTitle",
      "agency.diaDanh",
    ],
  },
] as const;

const BM004_FIELDS = {
  "agency.vienKiem": {
    label: "Tên Viện kiểm sát trong quyết định",
    placeholder: "Tên Viện kiểm sát được nêu tại tiêu đề quyết định",
  },
  "agency.tenCo": {
    label: "Tên Viện kiểm sát của người ban hành",
    placeholder: "Tên Viện kiểm sát sau chức danh Viện trưởng",
  },
  "document.vietTat": {
    label: "Nội dung xét thấy, lý do thay đổi",
    placeholder: "Nêu căn cứ thực tế dẫn đến việc thay đổi người thực hiện nhiệm vụ",
    control: "TEXTAREA",
  },
  "signature.positionTitle": {
    label: "Chức danh người được phân công thay đổi",
    placeholder: "Chức danh được nêu tại Điều 1",
  },
  "agency.diaDanh": {
    label: "Họ và tên người ký quyết định",
    placeholder: "Họ và tên, đóng dấu theo khối ký của quyết định",
  },
} as const;

const BM004_DEMO = {
  "agency.vienKiem": "Viện kiểm sát nhân dân Khu vực 7",
  "agency.tenCo": "nhân dân Khu vực 7",
  "document.vietTat": "Cần thay đổi người thực hành quyền công tố, kiểm sát việc giải quyết nguồn tin để bảo đảm phân công phù hợp.",
  "signature.positionTitle": "Kiểm sát viên",
  "agency.diaDanh": "Trần Văn Bình",
} as const;

const BM004_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-004",
  versionLabel: "BM-004 reviewed semantic change-assignment profile",
  sections: BM004_SECTIONS,
  presentationSections: BM004_PRESENTATION_SECTIONS,
  fields: BM004_FIELDS,
  demo: BM004_DEMO,
};

registerRuntimeUxProfile(BM004_RUNTIME_UX_PROFILE);
