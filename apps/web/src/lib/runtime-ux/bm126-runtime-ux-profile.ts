/**
 * BM-126 runtime-ux curated profile.
 *
 * CURATION (batch next): QĐ trưng cầu giám định. Viện trưởng VKS
 * ban hành quyết định trưng cầu giám định trong giai đoạn điều tra,
 * căn cứ Điều 41, 165, 205–214 BLTTHS.
 *
 * Workflow: VKS header + decision number + locality/date + legal-basis
 * + 6 substantive slots (summary line / case / accused / offence /
 * appraisal organization / proposing participant).
 *
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-126.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-126__2d8c3d38368b.extract.md
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM126_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định trưng cầu giám định",
    description:
      "Thông tin quyết định trưng cầu giám định của Viện trưởng Viện kiểm sát trong giai đoạn điều tra, căn cứ Điều 41, 165, 205–214 BLTTHS.",
  },
] as const;

const BM126_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định trưng cầu giám định",
    placeholder: "Số quyết định (ví dụ: 26/QĐ-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày, tháng, năm ban hành",
  },
  "decision.summaryLine": {
    label: "Tóm tắt nội dung sự việc",
    placeholder: "Tóm tắt, diễn biến sự việc liên quan đến việc giám định",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh đầy đủ của Viện kiểm sát ban hành",
  },
  "document.chuThe": {
    label: "Tên tổ chức/cá nhân được trưng cầu giám định",
    placeholder: "Tên tổ chức, họ tên cá nhân được trưng cầu giám định",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Căn cứ các điều 41, 165/236, 205–214 Bộ luật Tố tụng hình sự",
  },
  "person.tenNguoi": {
    label: "Tên người hoặc pháp nhân bị khởi tố",
    placeholder: "Họ tên người hoặc tên pháp nhân bị khởi tố",
  },
  "document.tenVu": {
    label: "Tên vụ án",
    placeholder: "Tên vụ án hình sự",
  },
  "person.toiDanh": {
    label: "Tội danh",
    placeholder: "Điều luật — khoản — Điều của Bộ luật Hình sự",
  },
} as const;

const BM126_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "26/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "decision.summaryLine":
    "Tóm tắt nội dung sự việc liên quan đến việc giám định tài sản phạm tội",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Công ty giám định X",
  "legalBasis.canCu":
    "Căn cứ các điều 41, 165, 205, 206, 208, 209, 213 và 214 Bộ luật Tố tụng hình sự",
  "person.tenNguoi": "Lê Minh K",
  "document.tenVu": "Vụ án hình sự Lê Minh K",
  "person.toiDanh": "Điều 174 Bộ luật Hình sự 2015",
} as const;

const BM126_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-126",
  versionLabel: `BM-126 QĐ trưng cầu giám định`,
  sections: BM126_SECTIONS,
  fields: BM126_FIELDS,
  demo: BM126_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định trưng cầu giám định",
      description:
        "Thông tin quyết định trưng cầu giám định của Viện trưởng Viện kiểm sát trong giai đoạn điều tra, căn cứ Điều 41, 165, 205–214 BLTTHS.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "legalBasis.canCu",
        "decision.summaryLine",
        "document.tenVu",
        "person.tenNguoi",
        "person.toiDanh",
        "document.chuThe",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM126_RUNTIME_UX_PROFILE);
