/**
 * BM-133 runtime-ux curated profile — Quyết định giám định lại trong
 * trường hợp đặc biệt.
 *
 * CURATION (GATE B — re-appraisal/re-valuation family):
 *   - Viện trưởng Viện kiểm sát nhân dân tối cao (VKSTC) ban hành quyết
 *     định trưng cầu giám định lại trong trường hợp đặc biệt, căn cứ
 *     Điều 41 và Điều 212 Bộ luật Tố tụng hình sự (P0013).
 *   - Document type: QUYẾT ĐỊNH. Source number prefix: /QĐ-VKSTC (P0006)
 *     — VKSTC cấp tối cao. Demo number uses /QĐ-VKS for VKS khu vực
 *     generic context.
 *   - Family partner: BM-131 (Yêu cầu định giá lại, VKS điều tra) and
 *     BM-132 (QĐ định giá lại, VKSTC). The family is a shared
 *     procedural domain; BM-131, BM-132, BM-133 are NOT a linear
 *     workflow chain.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-133.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-133__1f7f12f1a249.extract.md
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - Demo document number uses /QĐ-VKS prefix to match the "Quyết định"
 *     document type (NOT the /YC-VKS prefix used by the BM-131 request
 *     letter variant and NOT the BM-132 /QĐ-VKS without distinguishing
 *     wording).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM133_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định giám định lại trong trường hợp đặc biệt",
    description:
      "Thông tin quyết định giám định lại trong trường hợp đặc biệt của Viện trưởng Viện kiểm sát nhân dân tối cao, căn cứ Điều 41 và Điều 212 Bộ luật Tố tụng hình sự.",
  },
] as const;

const BM133_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định giám định lại",
    placeholder: "Số quyết định (ví dụ: 133/QĐ-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành quyết định",
    placeholder: "Ngày, tháng, năm ban hành quyết định",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh đầy đủ của Viện kiểm sát ban hành",
  },
} as const;

const BM133_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "133/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
} as const;

const BM133_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-133",
  versionLabel: `BM-133 runtime-ux batch 7 curated source-render profile`,
  sections: BM133_SECTIONS,
  fields: BM133_FIELDS,
  demo: BM133_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định giám định lại trong trường hợp đặc biệt",
      description:
        "Thông tin quyết định giám định lại trong trường hợp đặc biệt của Viện trưởng Viện kiểm sát nhân dân tối cao, căn cứ Điều 41 và Điều 212 Bộ luật Tố tụng hình sự.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM133_RUNTIME_UX_PROFILE);
