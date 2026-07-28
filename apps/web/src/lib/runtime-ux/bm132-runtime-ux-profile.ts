/**
 * BM-132 runtime-ux curated profile — Quyết định định giá lại tài sản
 * trong trường hợp đặc biệt.
 *
 * CURATION (GATE B — re-appraisal/re-valuation family):
 *   - Viện trưởng Viện kiểm sát nhân dân tối cao (VKSTC) ban hành quyết
 *     định định giá lại tài sản trong trường hợp đặc biệt, căn cứ Điều
 *     41 và Điều 220 Bộ luật Tố tụng hình sự (P0013).
 *   - Document type: QUYẾT ĐỊNH. Source number prefix: /QĐ-VKSTC (P0006)
 *     — VKSTC cấp tối cao. Demo number uses /QĐ-VKS for VKS khu vực
 *     generic context.
 *   - Family partner: BM-131 (Yêu cầu định giá lại tài sản, VKS cấp
 *     điều tra) and BM-133 (QĐ giám định lại, VKSTC). The family is a
 *     shared procedural domain; BM-131, BM-132, BM-133 are NOT a linear
 *     workflow chain.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-132.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-132__670b47f0b235.extract.md
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - Demo document number uses /QĐ-VKS prefix to match the "Quyết định"
 *     document type (NOT the /YC-VKS prefix used by the BM-131 request
 *     letter variant).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM132_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin quyết định định giá lại tài sản trong trường hợp đặc biệt",
    description:
      "Thông tin quyết định định giá lại tài sản trong trường hợp đặc biệt của Viện trưởng Viện kiểm sát nhân dân tối cao, căn cứ Điều 41 và Điều 220 Bộ luật Tố tụng hình sự.",
  },
] as const;

const BM132_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành quyết định",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số quyết định định giá lại tài sản",
    placeholder: "Số quyết định (ví dụ: 132/QĐ-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
} as const;

const BM132_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "132/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
} as const;

const BM132_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-132",
  versionLabel: `BM-132 runtime-ux batch 7 curated source-render profile`,
  sections: BM132_SECTIONS,
  fields: BM132_FIELDS,
  demo: BM132_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin quyết định định giá lại tài sản trong trường hợp đặc biệt",
      description:
        "Thông tin quyết định định giá lại tài sản trong trường hợp đặc biệt của Viện trưởng Viện kiểm sát nhân dân tối cao, căn cứ Điều 41 và Điều 220 Bộ luật Tố tụng hình sự.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM132_RUNTIME_UX_PROFILE);
