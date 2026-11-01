/**
 * BM-139 runtime-ux profile — Kiến nghị khắc phục vi phạm pháp luật
 * (corrective recommendation — investigation stage).
 *
 * Source contract: `docs/audit/docx/compiled-v2/BM-139.compiled.json`
 * Source extract:  `docs/audit/docx/extracted/BM-139__23306e6022bd.extract.md`
 *                   (47 paragraphs; title "Kiến nghị khắc phục vi phạm trong
 *                   hoạt động khởi tố, điều tra", matching compiled.title).
 *
 * Curated source/render upgrade of the auto-generated BM-139 fallback
 * profile. Resolves three pre-existing issues:
 *   1. Three compiled fields carried generic PLACEHOLDER labels
 *      ("Trường cần điền (document)") — replaced with source-aligned
 *      labels using documented extract evidence.
 *   2. The pre-curation profile existed with fabricated demo tokens
 *      ("(mẫu BM-139)", "/BB-VKS", "VKSKV7", "Trần Minh Quang") — all
 *      removed; demo uses neutral placeholders.
 *   3. Missing section descriptions — every section now carries an
 *      explicit non-empty description.
 *
 * Family boundary: KIẾN NGHỊ (recommendation). Distinct subfamily from
 * BM-140 (preventive recommendation) and distinct from BM-138 (Yêu cầu
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

const BM139_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin kiến nghị",
    description:
      "Thông tin khởi đầu và nhận diện văn bản kiến nghị: tên cơ quan ban hành kiến nghị, số kiến nghị, địa danh nơi ban hành, cơ quan / người có thẩm quyền nhận kiến nghị (COMPATIBILITY_MAPPED_FIELD), chức danh người ký kiến nghị (COMPATIBILITY_MAPPED_FIELD) và ngày ban hành.",
  },
  {
    sectionId: "section-document",
    title: "Định danh văn bản",
    description:
      "Mã số văn bản, tên cơ quan ban hành và địa danh được trích dẫn từ tiêu đề của văn bản nguồn.",
  },
] as const;

const BM139_FIELDS = {
  "agency.vienKiem": {
    label: "Tên cơ quan ban hành kiến nghị",
    placeholder:
      "Tên Viện kiểm sát ban hành kiến nghị (trích từ tiêu đề văn bản)",
    helpText:
      "Trích từ chú thích P0039 trong văn bản nguồn — tên Viện kiểm sát ban hành kiến nghị khắc phục vi phạm. FOOTNOTE / MEDIUM.",
  },
  "document.soQuyet": {
    label: "Số kiến nghị",
    placeholder: "Số kiến nghị (theo mẫu BM-139)",
    helpText:
      "Phần số của kiến nghị, đặt trước hậu tố /KN-VKS tại đoạn P0005–P0006. Hậu tố /KN-VKS là hậu tố cố định của mẫu và không phải dữ liệu cần nhập. DIRECT_SLOT / HIGH.",
  },
  "agency.diaDanh": {
    label: "Địa danh nơi ban hành kiến nghị",
    placeholder: "Tỉnh/thành phố nơi đặt trụ sở Viện kiểm sát ban hành",
    helpText:
      "Trích từ chú thích P0041 — tên tỉnh/thành phố nơi đặt trụ sở Viện kiểm sát ban hành kiến nghị. P0041 là chú thích hướng dẫn ghi địa danh (locality footnote); FOOTNOTE / MEDIUM.",
  },
  "recipients.localityName": {
    label: "Cơ quan/người có thẩm quyền nhận kiến nghị",
    placeholder: "Tên cơ quan, người có thẩm quyền nhận kiến nghị",
    helpText:
      "Trường này có khóa lịch sử là recipients.localityName nhưng nguồn P0043 là chú thích ghi tên cơ quan / người có thẩm quyền tiếp nhận nguồn tin về tội phạm / khởi tố / điều tra bị kiến nghị (không phải địa danh). COMPATIBILITY_MAPPED_FIELD, FOOTNOTE / MEDIUM.",
  },
  "person.personFullName": {
    label: "Chức danh người ký kiến nghị",
    placeholder: "Chức danh người ký kiến nghị (trích từ P0043)",
    helpText:
      "Trường này có khóa lịch sử là person.personFullName nhưng nguồn P0043 là chú thích ghi chức danh người ký (không phải họ tên). COMPATIBILITY_MAPPED_FIELD, FOOTNOTE / MEDIUM.",
  },
  "document.issueDate": {
    label: "Ngày ban hành kiến nghị",
    placeholder: "Ngày / tháng / năm ban hành kiến nghị",
    helpText:
      "Chuỗi ngày ban hành lắp ghép từ P0007 ', ngày' + P0008 'tháng' + P0009 'năm 20__'. DIRECT_SLOT / HIGH.",
  },
} as const;

const BM139_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát ban hành kiến nghị",
  "document.soQuyet": "01/KN-VKS",
  "agency.diaDanh": "Địa danh ban hành",
  "recipients.localityName": "Địa danh / Quận huyện",
  "person.personFullName": "Người ký kiến nghị",
  "document.issueDate": "Ngày / tháng / năm ban hành",
} as const;

const BM139_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-139",
  versionLabel:
    "BM-139 runtime-ux profile — Kiến nghị khắc phục vi phạm pháp luật",
  sections: BM139_SECTIONS,
  fields: BM139_FIELDS,
  demo: BM139_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-document",
      title: "Định danh văn bản",
      description:
        "Mã số văn bản, tên cơ quan ban hành và địa danh — ba trường đầu mục theo tiêu đề của văn bản nguồn.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
      ],
    },
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin kiến nghị",
      description:
        "Cơ quan / người có thẩm quyền nhận kiến nghị (theo P0043 — COMPATIBILITY_MAPPED_FIELD), chức danh người ký kiến nghị (theo P0043 — COMPATIBILITY_MAPPED_FIELD) và ngày ban hành kiến nghị.",
      fieldKeys: [
        "recipients.localityName",
        "person.personFullName",
        "document.issueDate",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM139_RUNTIME_UX_PROFILE);
