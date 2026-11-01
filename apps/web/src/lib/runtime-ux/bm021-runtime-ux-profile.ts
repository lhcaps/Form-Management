/**
 * BM-021 — Quyết định không khởi tố vụ án hình sự.
 * Presentation-only labels follow the BM-021 DOCX footnotes and decision text.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM021_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Cơ quan, căn cứ và nội dung không khởi tố",
    description:
      "Thông tin ban hành, căn cứ tố tụng, lý do không khởi tố và hành vi theo nguồn tin về tội phạm được giải quyết trực tiếp.",
  },
] as const;

const BM021_FIELDS = {
  "agency.parentNameUpper": {
    label: "Viện kiểm sát cấp trên trực tiếp",
    placeholder: "Tên Viện kiểm sát cấp trên trực tiếp",
  },
  "agency.issuePlace": {
    label: "Địa danh ban hành",
    placeholder: "Tên tỉnh hoặc thành phố nơi đặt trụ sở",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "Số quyết định, ví dụ: 14/QĐ-VKS",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Địa danh, ngày ... tháng ... năm ...",
    control: "TEXTAREA",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ các Điều 41, 157 và 158 của Bộ luật Tố tụng hình sự",
  },
  "decision.summaryLine": {
    label: "Lý do không khởi tố vụ án hình sự",
    placeholder: "Nêu lý do theo Điều 157 Bộ luật Tố tụng hình sự",
    control: "TEXTAREA",
  },
  "decision.decisionLine": {
    label: "Hành vi hoặc nguồn tin không khởi tố",
    placeholder: "Nêu hành vi theo nội dung nguồn tin về tội phạm do Viện kiểm sát giải quyết",
    control: "TEXTAREA",
  },
} as const;

const BM021_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HÀ NỘI",
  "agency.issuePlace": "Hà Nội",
  "document.documentCode": "14/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 18 tháng 7 năm 2026",
  "legalBasis.procedureArticlesLine": "Căn cứ các Điều 41, 157 và 158 của Bộ luật Tố tụng hình sự.",
  "decision.summaryLine": "Hành vi không cấu thành tội phạm theo Điều 157 Bộ luật Tố tụng hình sự.",
  "decision.decisionLine": "Không khởi tố vụ án hình sự đối với hành vi được nêu trong nguồn tin về tội phạm do Viện kiểm sát giải quyết trực tiếp.",
} as const;

const BM021_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-021",
  versionLabel: "BM-021 reviewed non-prosecution decision profile",
  sections: BM021_SECTIONS,
  fields: BM021_FIELDS,
  demo: BM021_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM021_RUNTIME_UX_PROFILE);
