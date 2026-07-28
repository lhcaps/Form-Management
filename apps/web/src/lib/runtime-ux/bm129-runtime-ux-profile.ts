/**
 * BM-129 runtime-ux curated profile.
 *
 * CURATION (batch next): QĐ trưng cầu giám định bổ sung. Viện
 * trưởng VKS ban hành quyết định trưng cầu giám định bổ sung khi
 * kết luận giám định chưa đủ cơ sở, căn cứ Điều 41, 165, 205,
 * 206, 208, 209, 210, 213 và 214 BLTTHS.
 *
 * Workflow: VKS header + decision number + locality/date + legal-basis
 * + appraisal organization / participant subject.
 *
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-129.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-129__7fb66a442c28.extract.md
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

const BM129_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định trưng cầu giám định bổ sung",
    description:
      "Thông tin quyết định trưng cầu giám định bổ sung của Viện trưởng Viện kiểm sát trong giai đoạn điều tra, căn cứ Điều 41, 165, 205–214 (đặc biệt Điều 210) BLTTHS.",
  },
] as const;

const BM129_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định trưng cầu giám định bổ sung",
    placeholder: "Số quyết định (ví dụ: 29/QĐ-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "Ngày, tháng, năm ban hành",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh đầy đủ của Viện kiểm sát ban hành",
  },
  "document.chuThe": {
    label: "Tên tổ chức/cá nhân được trưng cầu giám định bổ sung",
    placeholder: "Tên tổ chức, họ tên cá nhân được trưng cầu giám định bổ sung",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder:
      "Căn cứ các điều 41, 165/236, 205, 206, 208, 209, 210, 213 và 214 Bộ luật Tố tụng hình sự",
  },
} as const;

const BM129_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "29/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Công ty giám định X",
  "legalBasis.canCu":
    "Căn cứ các điều 41, 165, 205, 206, 208, 209, 210, 213 và 214 Bộ luật Tố tụng hình sự",
} as const;

const BM129_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-129",
  versionLabel: `BM-129 QĐ trưng cầu giám định bổ sung`,
  sections: BM129_SECTIONS,
  fields: BM129_FIELDS,
  demo: BM129_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định trưng cầu giám định bổ sung",
      description:
        "Thông tin quyết định trưng cầu giám định bổ sung của Viện trưởng Viện kiểm sát trong giai đoạn điều tra, căn cứ Điều 41, 165, 205–214 (đặc biệt Điều 210) BLTTHS.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "legalBasis.canCu",
        "document.chuThe",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM129_RUNTIME_UX_PROFILE);
