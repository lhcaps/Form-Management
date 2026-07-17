/**
 * BM-139 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-139 profile. Keeps the 2 sections from the compiled contract
 * (section-document with administrative fields, section-thong-tin-bieu-mau
 * with case-specific fields) but assigns human-readable labels and
 * realistic demo data. No DOCX/contract/DB mutation; no smart
 * controls; no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM139_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-document",
    title: "Văn bản và dòng ngày tháng",
  },
] as const;

const BM139_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-139)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-139)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-139)",
  },
  "recipients.localityName": {
    label: "Địa danh / Quận huyện của cơ quan nhận",
    placeholder: "Địa danh / Quận huyện (mẫu BM-139)",
  },
  "person.personFullName": {
    label: "Họ và tên người ký",
    placeholder: "Họ và tên người ký (mẫu BM-139)",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-139)",
  },
} as const;

const BM139_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "39/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "recipients.localityName": "Quận 1, Thành phố Hồ Chí Minh",
  "person.personFullName": "Trần Minh Quang",
  "document.issueDate": "15/07/2026",
} as const;

const BM139_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-139",
  versionLabel: `BM-139 runtime-ux batch 6 curated source-render profile`,
  sections: BM139_SECTIONS,
  fields: BM139_FIELDS,
  demo: BM139_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM139_RUNTIME_UX_PROFILE);
