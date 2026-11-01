/**
 * BM-128 runtime-ux curated profile.
 *
 * CURATION (batch next): Thông báo nội dung kết luận giám định, định
 * giá tài sản. VKS ban hành thông báo gửi cá nhân/tổ chức liên quan
 * theo Điều 42 và Điều 214/Điều 222 BLTTHS.
 *
 * Workflow pair: BM-128 follows BM-127 (yêu cầu định giá) and the
 * upstream appraisal/asset-valuation conclusion (Bản kết luận giám
 * định/kết luận định giá tài sản). BM-128 is a notification of that
 * conclusion to a related party, not the appraisal request itself.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-128.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-128__8eab646ee06f.extract.md
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - Demo document number uses /TB-VKS prefix from P0007 to match
 *     the "Thông báo" document type (not /YC-VKS used by BM-127 and
 *     not /QĐ-VKS used by BM-126).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM128_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin thông báo nội dung kết luận giám định, định giá tài sản",
    description:
      "Thông tin thông báo nội dung kết luận giám định/kết luận định giá tài sản của Viện kiểm sát gửi người được thông báo theo Điều 42 và Điều 214/Điều 222 Bộ luật Tố tụng hình sự.",
  },
] as const;

const BM128_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành thông báo",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "document.soQuyet": {
    label: "Số thông báo kết luận giám định, định giá tài sản",
    placeholder: "Số thông báo (ví dụ: 128/TB-VKS)",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "Tỉnh/Thành phố nơi đặt trụ sở VKS ban hành",
  },
  "document.ngayBan": {
    label: "Ngày ban hành thông báo",
    placeholder: "Ngày, tháng, năm ban hành thông báo",
  },
  "agency.dongDia": {
    label: "Dòng địa danh",
    placeholder: "Dòng địa danh đầy đủ của Viện kiểm sát ban hành",
  },
  "document.chuThe": {
    label: "Người được thông báo theo Điều 214/Điều 222 BLTTHS",
    placeholder: "Họ tên, tư cách tham gia tố tụng của người được thông báo",
  },
} as const;

const BM128_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "document.soQuyet": "128/TB-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Bị can Lê Minh K",
} as const;

const BM128_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-128",
  versionLabel: `BM-128 runtime-ux batch 6 curated source-render profile`,
  sections: BM128_SECTIONS,
  fields: BM128_FIELDS,
  demo: BM128_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin thông báo nội dung kết luận giám định, định giá tài sản",
      description:
        "Thông tin thông báo nội dung kết luận giám định/kết luận định giá tài sản của Viện kiểm sát gửi người được thông báo theo Điều 42 và Điều 214/Điều 222 Bộ luật Tố tụng hình sự.",
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

registerRuntimeUxProfile(BM128_RUNTIME_UX_PROFILE);
