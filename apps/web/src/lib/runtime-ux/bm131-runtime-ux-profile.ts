/**
 * BM-131 runtime-ux curated profile — Yêu cầu định giá lại tài sản.
 *
 * CURATION (GATE B — re-appraisal/re-valuation family):
 *   - Viện trưởng VKS ban hành yêu cầu gửi Hội đồng định giá tài sản,
 *     trong giai đoạn điều tra, căn cứ Điều 41, 69, 165/236, 215, 216,
 *     217 và 218 Bộ luật Tố tụng hình sự.
 *   - Document type: YÊU CẦU. Source number prefix: /YC-VKS (P0004).
 *   - This is the first code in the live semantic-incomplete queue after
 *     the BM-127/BM-128 closure. BM-131 is the request letter variant of
 *     the re-appraisal procedural domain. BM-132 (QĐ định giá lại tài
 *     sản trong trường hợp đặc biệt, VKSTC) and BM-133 (QĐ giám định
 *     lại trong trường hợp đặc biệt, VKSTC) share this family; the
 *     family relationship is contextual and DOES NOT encode a linear
 *     chain BM-131 → BM-132 → BM-133.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-131.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-131__91726e55d979.extract.md
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - Demo document number uses /YC-VKS prefix from P0004 to match
 *     the "Yêu cầu" document type (NOT the /QĐ-VKS prefix used by the
 *     decision-family members BM-132/BM-133).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM131_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin yêu cầu định giá lại tài sản",
    description:
      "Thông tin yêu cầu định giá lại tài sản của Viện trưởng Viện kiểm sát gửi Hội đồng định giá tài sản, căn cứ các điều 41, 69, 165/236, 215, 216, 217 và 218 Bộ luật Tố tụng hình sự.",
  },
] as const;

const BM131_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành yêu cầu định giá lại",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số yêu cầu định giá lại tài sản",
    placeholder: "Số yêu cầu (ví dụ: 131/YC-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành yêu cầu",
    placeholder: "Ngày, tháng, năm ban hành yêu cầu",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh đầy đủ của Viện kiểm sát ban hành",
  },
  "document.chuThe": {
    label: "Tên Hội đồng định giá được yêu cầu định giá lại",
    placeholder: "Tên Hội đồng định giá tài sản được yêu cầu định giá lại",
  },
} as const;

const BM131_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "131/YC-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Hội đồng định giá tài sản khu vực 7",
} as const;

const BM131_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-131",
  versionLabel: `BM-131 runtime-ux batch 7 curated source-render profile`,
  sections: BM131_SECTIONS,
  fields: BM131_FIELDS,
  demo: BM131_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin yêu cầu định giá lại tài sản",
      description:
        "Thông tin yêu cầu định giá lại tài sản của Viện trưởng Viện kiểm sát gửi Hội đồng định giá tài sản, căn cứ các điều 41, 69, 165/236, 215, 216, 217 và 218 Bộ luật Tố tụng hình sự.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "document.chuThe",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM131_RUNTIME_UX_PROFILE);
