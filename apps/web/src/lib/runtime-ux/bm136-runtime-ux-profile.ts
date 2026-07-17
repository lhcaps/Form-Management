/**
 * BM-136 runtime-ux batch 6 curated source-render profile.
 *
 * Curated source/render upgrade of the conservative auto-generated
 * BM-136 profile. Groups the 17 fields into 5 legal-document
 * sections. No DOCX/contract/DB mutation; no smart controls;
 * no legacy stale demo tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM136_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-chu-the-va-vu-an",
    title: "Chủ thể, tội danh, vụ án",
  },
  {
    sectionId: "section-can-cu-va-tien",
    title: "Căn cứ pháp lý và số tiền",
  },
  {
    sectionId: "section-chuc-danh-va-luu",
    title: "Chức danh và lưu hồ sơ",
  },
  {
    sectionId: "section-dong-ngay",
    title: "Dòng ngày tháng",
  },
] as const;

const BM136_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan",
    placeholder: "Tên cơ quan (mẫu BM-136)",
  },
  "signature.positionTitle": {
    label: "Chức danh",
    placeholder: "Chức danh (mẫu BM-136)",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Người bị áp dụng (mẫu BM-136)",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "Số quyết định (mẫu BM-136)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Địa danh (mẫu BM-136)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày ban hành (mẫu BM-136)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh (mẫu BM-136)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Chủ thể liên quan (mẫu BM-136)",
  },
  "person.tenBi": {
    label: "Tên bị can / bị cáo",
    placeholder: "Tên bị can / bị cáo (mẫu BM-136)",
  },
  "document.tenVu": {
    label: "Tên vụ án / vụ việc",
    placeholder: "Tên vụ án / vụ việc (mẫu BM-136)",
  },
  "person.toiDanh": {
    label: "Tội danh",
    placeholder: "Tội danh (mẫu BM-136)",
  },
  "document.soTien": {
    label: "Số tiền",
    placeholder: "Số tiền (mẫu BM-136)",
  },
  "document.lyDo": {
    label: "Lý do",
    placeholder: "Lý do (mẫu BM-136)",
  },
  "recipients.luuHo": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu hồ sơ (mẫu BM-136)",
  },
  "signature.cheDo": {
    label: "Địa chỉ cư trú",
    placeholder: "Địa chỉ cư trú (mẫu BM-136)",
  },
  "signature.chucVu": {
    label: "Tư cách tham gia tố tụng",
    placeholder: "Tư cách tham gia tố tụng (mẫu BM-136)",
  },
  "signature.nguoiKy": {
    label: "Người tham gia đối chất thứ ba",
    placeholder: "Người tham gia đối chất thứ ba (mẫu BM-136)",
  },
} as const;

const BM136_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "signature.positionTitle": "KT. VIỆN TRƯỞNG / PHÓ VIỆN TRƯỞNG",
  "recipients.personLine": "Ông Lê Minh K, sinh năm 1985, trú tại Quận 1, TP.HCM",
  "document.soQuyet": "36/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
  "person.tenBi": "Lê Minh K",
  "document.tenVu": "Vụ án hình sự Lê Minh K về tội Lừa đảo chiếm đoạt tài sản",
  "person.toiDanh": "Điều 174 Bộ luật Hình sự 2015 - Lừa đảo chiếm đoạt tài sản",
  "document.soTien": "500.000.000 đồng (năm trăm triệu đồng)",
  "document.lyDo": "Xét thấy cần xác minh các tình tiết có ý nghĩa quan trọng đối với vụ án",
  "recipients.luuHo": "Lưu: HSVA, HSKS, VP.",
  "signature.cheDo": "Số 12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
  "signature.chucVu": "Bị can",
  "signature.nguoiKy": "Ông Trần Văn M, nhân chứng tại hiện trường",
} as const;

const BM136_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-136",
  versionLabel: `BM-136 runtime-ux batch 6 curated source-render profile`,
  sections: BM136_SECTIONS,
  fields: BM136_FIELDS,
  demo: BM136_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM136_RUNTIME_UX_PROFILE);
