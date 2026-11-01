/**
 * BM-140 runtime-ux profile — Kiến nghị áp dụng biện pháp phòng ngừa
 * (crime-prevention recommendation — investigation stage).
 *
 * Source contract: `docs/audit/docx/compiled-v2/BM-140.compiled.json`
 * Source extract:  `docs/audit/docx/extracted/BM-140__13e1ade15acd.extract.md`
 *                   (47 paragraphs; title "Kiến nghị áp dụng biện pháp phòng
 *                   ngừa tội phạm và vi phạm pháp luật", matching
 *                   compiled.title).
 *
 * Curated source/render upgrade of the auto-generated BM-140 fallback
 * profile. Resolves three pre-existing issues:
 *   1. Phantom sectionId `section-dong-ngay` introduced by the auto-
 *      generated profile — removed; the compiled contract declares
 *      exactly one section (`section-thong-tin-bieu-mau`).
 *   2. The pre-curation profile existed with fabricated demo tokens
 *      ("(mẫu BM-140)", "/BB-VKS", "VKSKV7", "Trần Minh Quang") — all
 *      removed; demo uses neutral placeholders.
 *   3. Missing section description — the sole section now carries an
 *      explicit non-empty description.
 *
 * Family boundary: KIẾN NGHỊ (recommendation). Distinct subfamily from
 * BM-139 (corrective recommendation) and distinct from BM-138 (Yêu cầu
 * — request, not recommendation) and BM-141/BM-142/BM-143 (Quyết định —
 * decision family of prosecution stage).
 *
 * No DOCX/contract/DB mutation; no smart controls; no fabricated demo
 * values; no raw keys; no technical section IDs; no cross-form evidence
 * borrowing.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM140_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin kiến nghị",
    description:
      "Thông tin khởi đầu và nhận diện văn bản kiến nghị: tên cơ quan ban hành, số kiến nghị, địa danh nơi ban hành (theo chú thích locality P0040), ngày ban hành và dòng địa danh bổ sung tùy hồ sơ (CONTRACT_ONLY_NO_DOCX_SLOT — không tồn tại đoạn nguồn kết hợp locality với date trên cùng một dòng).",
  },
] as const;

const BM140_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan ban hành kiến nghị",
    placeholder:
      "Tên Viện kiểm sát ban hành kiến nghị (trích từ tiêu đề văn bản)",
    helpText:
      "Trích từ chú thích P0038 trong văn bản nguồn — tên Viện kiểm sát ban hành kiến nghị phòng ngừa tội phạm. FOOTNOTE / MEDIUM.",
  },
  "document.soKien": {
    label: "Số kiến nghị",
    placeholder: "Số kiến nghị (theo mẫu BM-140)",
    helpText:
      "Phần số của kiến nghị, đặt trước hậu tố /KN-VKS tại đoạn P0005–P0006. Hậu tố /KN-VKS là hậu tố cố định của mẫu và không phải dữ liệu cần nhập. DIRECT_SLOT / HIGH.",
  },
  "agency.diaDanh": {
    label: "Địa danh nơi ban hành kiến nghị",
    placeholder: "Tỉnh/thành phố nơi đặt trụ sở Viện kiểm sát ban hành",
    helpText:
      "Trích từ chú thích P0040 — tên tỉnh/thành phố nơi đặt trụ sở Viện kiểm sát ban hành kiến nghị. P0040 là chú thích hướng dẫn ghi địa danh (locality footnote); FOOTNOTE / MEDIUM.",
  },
  "document.ngayBan": {
    label: "Ngày ban hành kiến nghị",
    placeholder: "Ngày / tháng / năm ban hành kiến nghị",
    helpText:
      "Chuỗi ngày ban hành lắp ghép từ P0007 ', ngày' + P0008 'tháng' + P0009 'năm 20__'. DIRECT_SLOT / HIGH.",
  },
  "agency.dongDia": {
    label: "Dòng địa danh bổ sung (nếu hồ sơ có)",
    placeholder: "Để trống — trường hợp hồ sơ không có dòng này",
    helpText:
      "Khóa agency.dongDia giữ từ hợp đồng đã biên dịch; tuy nhiên văn bản nguồn BM-140 KHÔNG có đoạn nào kết hợp địa danh với chuỗi ngày tháng trên cùng một dòng (P0040 là chú thích locality độc lập; P0007–P0009 là chuỗi ngày tháng độc lập). Không ghép hai nguồn này thành một direct slot. CONTRACT_ONLY_NO_DOCX_SLOT / LOW; có thể bỏ trống khi hồ sơ không yêu cầu.",
  },
} as const;

const BM140_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát ban hành kiến nghị",
  "document.soKien": "01/KN-VKS",
  "agency.diaDanh": "Địa danh ban hành",
  "document.ngayBan": "Ngày / tháng / năm ban hành",
  "agency.dongDia": "",
} as const;

const BM140_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-140",
  versionLabel:
    "BM-140 runtime-ux profile — Kiến nghị phòng ngừa tội phạm",
  sections: BM140_SECTIONS,
  fields: BM140_FIELDS,
  demo: BM140_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin kiến nghị",
      description:
        "Thông tin khởi đầu và nhận diện văn bản kiến nghị: tên cơ quan ban hành, số kiến nghị, địa danh nơi ban hành (theo chú thích locality P0040), ngày ban hành và dòng địa danh bổ sung tùy hồ sơ (CONTRACT_ONLY_NO_DOCX_SLOT).",
      fieldKeys: [
        "agency.vienKiem",
        "document.soKien",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM140_RUNTIME_UX_PROFILE);
