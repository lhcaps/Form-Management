/**
 * Curated runtime-ux profile for BM-080.
 *
 * 7 fields — Thông báo từ chối việc đăng ký bào chữa.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-080)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM080_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Cơ quan ban hành, số văn bản, ngày ban hành.",
  },
  {
    sectionId: "section-thong-tin-ca-nhan",
    title: "2. Thông tin cá nhân và căn cứ",
    description:
      "Họ tên người đăng ký bào chữa, ngày sinh, địa chỉ hiện tại, căn cứ từ chối.",
  },
] as const;

const BM080_FIELDS = {
  "agency.name": {
    label: "Cơ quan ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "59/TB-VKSKV7",
    helpText: "Số ký hiệu của thông báo từ chối việc đăng ký bào chữa.",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "2026-07-04",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.fullName": {
    label: "Họ tên người đăng ký bào chữa",
    placeholder: "Lê Hồng Phúc",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "1985-09-08",
    helpText: "Định dạng ISO: YYYY-MM-DD",
  },
  "person.currentAddress": {
    label: "Địa chỉ hiện tại",
    placeholder: "78 Đường Nguyễn Du, Quận 1, Thành phố Hồ Chí Minh",
    smart: {
      key: "person.currentAddress",
      kind: "textarea",
      rows: 2,
      placeholder:
        "78 Đường Nguyễn Du, Quận 1, Thành phố Hồ Chí Minh",
    },
  },
  "legalBasis.legalBasisLine": {
    label: "Căn cứ từ chối đăng ký bào chữa",
    placeholder:
      "Căn cứ Điều 76 Bộ luật Tố tụng hình sự năm 2015: người đăng ký không đáp ứng điều kiện hành nghề luật sư theo quy định.",
    smart: {
      key: "legalBasis.legalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 76 Bộ luật Tố tụng hình sự năm 2015: người đăng ký không đáp ứng điều kiện hành nghề luật sư theo quy định.",
    },
  },
} as const;

const BM080_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.fullDocumentCode": "59/TB-VKSKV7",
  "document.issueDate": "2026-07-04",
  "person.fullName": "Lê Hồng Phúc",
  "person.dateOfBirth": "1985-09-08",
  "person.currentAddress":
    "78 Đường Nguyễn Du, Quận 1, Thành phố Hồ Chí Minh",
  "legalBasis.legalBasisLine":
    "Căn cứ Điều 76 Bộ luật Tố tụng hình sự năm 2015: người đăng ký không đáp ứng điều kiện hành nghề luật sư theo quy định.",
} as const;

const BM080_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-080",
  versionLabel:
    "BM-080 curated batch 4 — Thông báo từ chối việc đăng ký bào chữa",
  sections: BM080_SECTIONS,
  fields: BM080_FIELDS,
  demo: BM080_DEMO,
};

registerRuntimeUxProfile(BM080_RUNTIME_UX_PROFILE);
