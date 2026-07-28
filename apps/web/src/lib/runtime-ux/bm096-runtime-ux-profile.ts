/**
 * Curated runtime-ux profile for BM-096.
 *
 * 18 fields — Yêu cầu ra QĐ khởi tố bị can.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-096)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM096_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Viện kiểm sát ban hành, số yêu cầu, địa danh, ngày ban hành, người nhận, đơn vị địa phương, chủ thể ban hành, căn cứ pháp lý, tên vụ án, tội danh, họ tên bị can, năm sinh, số CCCD, lý do đề nghị, lưu hồ sơ, chữ ký.",
  },
] as const;

const BM096_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.soYeu": {
    label: "Số yêu cầu",
    placeholder: "73/YC-VKSKV7",
    helpText: "Số ký hiệu của yêu cầu ra QĐ khởi tố bị can gửi cơ quan điều tra.",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Thành phố Hồ Chí Minh",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "2026-07-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Bị can / người liên quan",
    placeholder: "Lê Minh Quang",
  },
  "agency.dongDia": {
    label: "Đơn vị địa phương",
    placeholder: "Thành phố Hồ Chí Minh",
  },
  "document.chuThe": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder:
      "Căn cứ Điều 36, 153, 154 Bộ luật Tố tụng hình sự năm 2015; căn cứ tài liệu điều tra trong hồ sơ vụ án hình sự số 08/2026/HSST.",
    smart: {
      key: "legalBasis.canCu",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 36, 153, 154 Bộ luật Tố tụng hình sự năm 2015; căn cứ tài liệu điều tra trong hồ sơ vụ án hình sự số 08/2026/HSST.",
    },
  },
  "document.tenVu": {
    label: "Tên vụ án",
    placeholder: "Vụ án lừa đảo chiếm đoạt tài sản xảy ra ngày 12/3/2026 tại Quận 1",
  },
  "person.toiDanh": {
    label: "Tội danh dự kiến khởi tố",
    placeholder: "Tội lừa đảo chiếm đoạt tài sản (Điều 174 BLHS 2015)",
  },
  "person.hoTen": {
    label: "Họ tên bị can dự kiến",
    placeholder: "Lê Minh Quang",
  },
  "document.namSinh": {
    label: "Năm sinh",
    placeholder: "1988",
    helpText: "Năm sinh của bị can dự kiến.",
  },
  "person.idNumber": {
    label: "Số CCCD / CMND",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 079188001234 is a format-shaped synthetic test value, not derived from any real customer/case data.
    placeholder: "079188001234",
  },
  "document.lyDo": {
    label: "Lý do đề nghị khởi tố",
    placeholder:
      "Qua điều tra đã có đủ căn cứ xác định Lê Minh Quang có hành vi lừa đảo chiếm đoạt tài sản với giá trị đặc biệt lớn; đủ yếu tố cấu thành tội phạm theo Điều 174 BLHS 2015.",
    smart: {
      key: "document.lyDo",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Qua điều tra đã có đủ căn cứ xác định Lê Minh Quang có hành vi lừa đảo chiếm đoạt tài sản với giá trị đặc biệt lớn; đủ yếu tố cấu thành tội phạm theo Điều 174 BLHS 2015.",
    },
  },
  "recipients.luuHo": {
    label: "Lưu hồ sơ",
    placeholder: "HSVA, HSKS, VP.",
  },
  "signature.cheDo": {
    label: "Chế độ ký",
    placeholder: "Ký tay",
  },
  "signature.chucVu": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng",
  },
  "signature.nguoiKy": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Hương",
  },
} as const;

const BM096_DEMO = {
  "agency.vienKiem": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.soYeu": "73/YC-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "2026-07-04",
  "recipients.personLine": "Lê Minh Quang",
  "agency.dongDia": "Thành phố Hồ Chí Minh",
  "document.chuThe": "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "legalBasis.canCu":
    "Căn cứ Điều 36, 153, 154 Bộ luật Tố tụng hình sự năm 2015; căn cứ tài liệu điều tra trong hồ sơ vụ án hình sự số 08/2026/HSST.",
  "document.tenVu":
    "Vụ án lừa đảo chiếm đoạt tài sản xảy ra ngày 12/3/2026 tại Quận 1",
  "person.toiDanh": "Tội lừa đảo chiếm đoạt tài sản (Điều 174 BLHS 2015)",
  "person.hoTen": "Lê Minh Quang",
  "document.namSinh": "1988",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 079188001234 is a format-shaped synthetic test value, not derived from any real customer/case data.
  "person.idNumber": "079188001234",
  "document.lyDo":
    "Qua điều tra đã có đủ căn cứ xác định Lê Minh Quang có hành vi lừa đảo chiếm đoạt tài sản với giá trị đặc biệt lớn; đủ yếu tố cấu thành tội phạm theo Điều 174 BLHS 2015.",
  "recipients.luuHo": "HSVA, HSKS, VP.",
  "signature.cheDo": "Ký tay",
  "signature.chucVu": "Viện trưởng",
  "signature.nguoiKy": "Phạm Thị Lan Hương",
} as const;

const BM096_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-096",
  versionLabel: "BM-096 curated batch 4 — Yêu cầu ra QĐ khởi tố bị can",
  sections: BM096_SECTIONS,
  fields: BM096_FIELDS,
  demo: BM096_DEMO,
};

registerRuntimeUxProfile(BM096_RUNTIME_UX_PROFILE);
