/**
 * BM-137 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-137 profile. Groups the 6 fields into 2 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM137_SECTIONS = [
  {
    sectionId: "section-thong-tin-bien-ban",
    title: "Thông tin biên bản",
  },
  {
    sectionId: "section-dong-dia-danh",
    title: "Dòng địa danh",
  },
] as const;

const BM137_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-137)",
  },
  "document.soBien": {
    label: "Số biên bản",
    placeholder: "Số biên bản (mẫu BM-137)",
  },
  "document.noiLap": {
    label: "Nơi lập",
    placeholder: "Nơi lập (mẫu BM-137)",
  },
  "document.ngayLap": {
    label: "Ngày lập",
    placeholder: "Ngày lập (mẫu BM-137)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-137)",
  },
  "document.tenVu": {
    label: "Tên vụ án / vụ việc",
    placeholder: "Tên vụ án / vụ việc (mẫu BM-137)",
  },
} as const;

const BM137_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soBien": "BB-137/VKSKV7",
  "document.noiLap": "Trụ sở Viện kiểm sát nhân dân khu vực 7",
  "document.ngayLap": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.tenVu": "Vụ án hình sự Lê Minh K về tội Lừa đảo chiếm đoạt tài sản",
} as const;

const BM137_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-137",
  versionLabel: `BM-137 runtime-ux batch 6 curated source-render profile`,
  sections: BM137_SECTIONS,
  fields: BM137_FIELDS,
  demo: BM137_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM137_RUNTIME_UX_PROFILE);
