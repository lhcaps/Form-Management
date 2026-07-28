/**
 * BM-003 — Quyết định phân công thực hành quyền công tố, kiểm sát việc
 * tiếp nhận, giải quyết nguồn tin về tội phạm.
 *
 * Presentation wording is reviewed against the BM-003 compiled contract and
 * DOCX contexts in `docs/audit/docx/extracted/BM-003__bb64990bc49b.extract.md`.
 * This file is UI metadata only and does not change document data paths.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM003_SECTIONS = [
  {
    sectionId: "section-agency",
    title: "Cơ quan ban hành",
    description: "Cơ quan cấp trên và Viện kiểm sát ban hành quyết định phân công.",
  },
  {
    sectionId: "section-document",
    title: "Thông tin quyết định",
    description: "Số, địa danh và ngày lập quyết định phân công.",
  },
  {
    sectionId: "section-legalbasis",
    title: "Căn cứ pháp lý",
    description: "Căn cứ tố tụng được nêu trước khi ban hành quyết định.",
  },
  {
    sectionId: "section-official",
    title: "Chủ thể ban hành",
    description: "Chức danh của người có thẩm quyền ra quyết định.",
  },
  {
    sectionId: "section-recipients",
    title: "Nơi nhận và lưu hồ sơ",
    description: "Nơi nhận quyết định và dòng lưu hồ sơ theo cuối văn bản.",
  },
  {
    sectionId: "section-signature",
    title: "Ký quyết định",
    description: "Hình thức ký, chức vụ và họ tên người ký quyết định.",
  },
  {
    sectionId: "section-sourceassignment",
    title: "Nội dung quyết định phân công",
    description: "Nội dung của Điều 1, Điều 2 và Điều 3 trong quyết định.",
  },
] as const;

const BM003_PRESENTATION_SECTIONS = [
  {
    id: "co-quan-va-quyet-dinh",
    title: "1. Cơ quan và thông tin quyết định",
    description: "Xác định cơ quan, người có thẩm quyền và thông tin ban hành quyết định.",
    fieldKeys: [
      "agency.parentName",
      "agency.name",
      "document.documentCode",
      "document.issuePlaceAndDateLine",
      "official.issuerTitle",
    ],
  },
  {
    id: "can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description: "Nêu căn cứ tố tụng hình sự làm cơ sở cho quyết định phân công.",
    fieldKeys: ["legalBasis.procedureArticlesLine"],
  },
  {
    id: "noi-dung-quyet-dinh",
    title: "3. Nội dung quyết định phân công",
    description: "Nhập đầy đủ nội dung Điều 1, Điều 2 và Điều 3 theo mẫu quyết định.",
    fieldKeys: [
      "sourceAssignment.article1Line",
      "sourceAssignment.article2Line",
      "sourceAssignment.article3Line",
    ],
  },
  {
    id: "noi-nhan-va-ky",
    title: "4. Nơi nhận và ký quyết định",
    description: "Hoàn thiện nơi nhận, dòng lưu hồ sơ và thông tin người ký ban hành.",
    fieldKeys: [
      "recipients.primaryLine",
      "recipients.archiveLine",
      "signature.signMode",
      "signature.positionTitle",
      "signature.signerName",
    ],
  },
] as const;

const BM003_FIELDS = {
  "agency.parentName": { label: "Cơ quan cấp trên", placeholder: "VIỆN KIỂM SÁT NHÂN DÂN TỈNH, THÀNH PHỐ" },
  "agency.name": { label: "Viện kiểm sát ban hành", placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC" },
  "document.documentCode": { label: "Số quyết định", placeholder: "Số/QĐ-..." },
  "document.issuePlaceAndDateLine": { label: "Địa danh, ngày lập quyết định", placeholder: "..., ngày ... tháng ... năm ..." },
  "official.issuerTitle": { label: "Chức danh người ban hành", placeholder: "VIỆN TRƯỞNG" },
  "legalBasis.procedureArticlesLine": { label: "Căn cứ Bộ luật Tố tụng hình sự", placeholder: "Căn cứ các điều luật làm cơ sở ban hành quyết định;", control: "TEXTAREA" },
  "sourceAssignment.article1Line": { label: "Điều 1 — Nội dung phân công", placeholder: "Nêu người được phân công và nhiệm vụ thực hiện.", control: "TEXTAREA" },
  "sourceAssignment.article2Line": { label: "Điều 2 — Tổ chức thực hiện", placeholder: "Nêu trách nhiệm hoặc thời hạn thực hiện theo mẫu.", control: "TEXTAREA" },
  "sourceAssignment.article3Line": { label: "Điều 3 — Hiệu lực và nơi thực hiện", placeholder: "Nêu hiệu lực thi hành và trách nhiệm của các đơn vị liên quan.", control: "TEXTAREA" },
  "recipients.primaryLine": { label: "Nơi nhận chính", placeholder: "Cá nhân, đơn vị nhận quyết định" },
  "recipients.archiveLine": { label: "Dòng lưu hồ sơ", placeholder: "Lưu: Hồ sơ, văn phòng" },
  "signature.signMode": { label: "Hình thức ký", placeholder: "Ký trực tiếp, ký thay hoặc thừa lệnh (nếu áp dụng)" },
  "signature.positionTitle": { label: "Chức vụ người ký", placeholder: "CHỨC VỤ" },
  "signature.signerName": { label: "Họ và tên người ký", placeholder: "Họ và tên đầy đủ" },
} as const;

const BM003_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "08/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "VIỆN TRƯỞNG",
  "legalBasis.procedureArticlesLine": "Căn cứ Bộ luật Tố tụng hình sự năm 2015; căn cứ chức năng, nhiệm vụ, quyền hạn của Viện kiểm sát nhân dân;",
  "sourceAssignment.article1Line": "Phân công Kiểm sát viên được giao nhiệm vụ thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm theo hồ sơ.",
  "sourceAssignment.article2Line": "Người được phân công và các đơn vị liên quan chịu trách nhiệm tổ chức thực hiện quyết định này.",
  "sourceAssignment.article3Line": "Quyết định này có hiệu lực kể từ ngày ký; các đơn vị, cá nhân có liên quan thi hành quyết định này.",
  "recipients.primaryLine": "Kiểm sát viên được phân công",
  "recipients.archiveLine": "Hồ sơ nguồn tin, văn phòng",
  "signature.signMode": "",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Lê Văn C",
} as const;

const BM003_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-003",
  versionLabel: "BM-003 reviewed semantic assignment-decision profile",
  sections: BM003_SECTIONS,
  presentationSections: BM003_PRESENTATION_SECTIONS,
  fields: BM003_FIELDS,
  demo: BM003_DEMO,
};

registerRuntimeUxProfile(BM003_RUNTIME_UX_PROFILE);
