/**
 * BM-127 runtime-ux curated profile.
 *
 * CURATION (batch next): Yêu cầu định giá tài sản. Viện trưởng VKS
 * ban hành yêu cầu gửi Hội đồng định giá tài sản trong giai đoạn
 * điều tra (Điều 41, 69, 165/236, 215–217 BLTTHS).
 *
 * Workflow pair: downstream of BM-126 (quyết định trưng cầu giám định)
 * and paired procedurally with BM-128 (thông báo nội dung kết luận
 * giám định, định giá tài sản). BM-127 is the request letter; BM-128
 * is the later notification of the appraisal/asset-valuation conclusion.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-127.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-127__582febaeadf0.extract.md
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - Demo document number uses /YC-VKS prefix from P0004 to match
 *     the "Yêu cầu" document type (not the /QĐ-VKS prefix used by
 *     the upstream BM-126 quyết định).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM127_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin yêu cầu định giá tài sản",
    description:
      "Thông tin yêu cầu định giá tài sản của Viện trưởng Viện kiểm sát gửi Hội đồng định giá tài sản trong giai đoạn điều tra, căn cứ các điều 41, 69, 165/236, 215, 216 và 217 Bộ luật Tố tụng hình sự.",
  },
] as const;

const BM127_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành yêu cầu",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số yêu cầu định giá tài sản",
    placeholder: "Số yêu cầu (ví dụ: 127/YC-VKS)",
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
    label: "Tên Hội đồng định giá được yêu cầu định giá tài sản",
    placeholder: "Tên Hội đồng định giá được yêu cầu định giá tài sản",
  },
  "agency.coQuan": {
    label: "Tên cơ quan ban hành yêu cầu",
    placeholder: "Tên Viện kiểm sát ban hành yêu cầu (theo P0065)",
  },
} as const;

const BM127_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "127/YC-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Hội đồng định giá tài sản khu vực 7",
  "agency.coQuan": "Viện kiểm sát nhân dân khu vực 7",
} as const;

const BM127_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-127",
  versionLabel: `BM-127 runtime-ux batch 6 curated source-render profile`,
  sections: BM127_SECTIONS,
  fields: BM127_FIELDS,
  demo: BM127_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin yêu cầu định giá tài sản",
      description:
        "Thông tin yêu cầu định giá tài sản của Viện trưởng Viện kiểm sát gửi Hội đồng định giá tài sản trong giai đoạn điều tra, căn cứ các điều 41, 69, 165/236, 215, 216 và 217 Bộ luật Tố tụng hình sự.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "document.chuThe",
        "agency.coQuan",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM127_RUNTIME_UX_PROFILE);
