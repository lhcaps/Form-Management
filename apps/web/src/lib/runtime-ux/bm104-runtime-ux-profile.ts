import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM104_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan ban hành và quyết định gia hạn thời hạn điều tra",
    description:
      "Viện kiểm sát ban hành, số quyết định, lần gia hạn và dòng địa danh, ngày ký.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ và đề nghị gia hạn điều tra",
    description:
      "Các căn cứ tố tụng, hồ sơ đề nghị và lý do cần gia hạn thời hạn điều tra vụ án hình sự.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định gia hạn",
    description:
      "Điều 1 về thời hạn gia hạn điều tra và Điều 2 về việc tổ chức thi hành quyết định.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận và lưu hồ sơ",
    description:
      "Cơ quan điều tra nhận quyết định và dòng lưu hồ sơ theo mẫu.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Ký ban hành quyết định",
    description: "Hình thức ký, chức danh và họ tên người ký quyết định.",
  },
] as const;

const BM104_FIELDS = {
  "agency.parentName": {
    label: "Viện kiểm sát cấp trên trực tiếp",
    placeholder: "Tên Viện kiểm sát cấp trên trực tiếp",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Tên Viện kiểm sát ban hành quyết định",
  },
  "document.documentCode": {
    label: "Số quyết định gia hạn",
    placeholder: "Số/QĐ-VKS",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "..., ngày ... tháng ... năm ...",
  },
  "investigationExtension.requestRoundText": {
    label: "Lần gia hạn thời hạn điều tra",
    placeholder: "Lần thứ ...",
  },
  "official.issuerTitle": {
    label: "Chức danh người ban hành",
    placeholder: "VIỆN TRƯỞNG VIỆN KIỂM SÁT ...",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 41 và Điều 172 Bộ luật Tố tụng hình sự;",
  },
  "caseDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định khởi tố vụ án hình sự",
    placeholder: "Căn cứ Quyết định khởi tố vụ án hình sự số ... ngày ... của ...;",
  },
  "investigationRecovery.legalBasisLine": {
    label: "Căn cứ Quyết định phục hồi điều tra (nếu có)",
    placeholder: "Căn cứ Quyết định phục hồi điều tra vụ án hình sự số ... ngày ... của ...;",
  },
  "proposal.requestingDocumentLine": {
    label: "Hồ sơ hoặc văn bản đề nghị gia hạn điều tra",
    placeholder: "Xét hồ sơ đề nghị gia hạn thời hạn điều tra đối với vụ án hình sự của ...",
  },
  "investigationExtension.reasonLine": {
    label: "Lý do cần gia hạn thời hạn điều tra",
    placeholder: "Nhận thấy việc gia hạn thời hạn điều tra vụ án hình sự là có căn cứ và cần thiết,",
  },
  "investigationExtension.decisionArticle1Line": {
    label: "Điều 1 — Gia hạn thời hạn điều tra",
    placeholder: "Gia hạn thời hạn điều tra vụ án hình sự lần thứ ... với thời hạn ...",
  },
  "investigationExtension.decisionArticle2Line": {
    label: "Điều 2 — Yêu cầu thi hành quyết định",
    placeholder: "Yêu cầu ... thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.",
  },
  "recipients.investigatingAgencyLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Tên cơ quan, người có thẩm quyền điều tra",
  },
  "recipients.archiveLine": {
    label: "Dòng lưu hồ sơ",
    placeholder: "- Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Hình thức ký",
    placeholder: "KT. VIỆN TRƯỞNG hoặc hình thức ký theo thẩm quyền",
  },
  "signature.positionTitle": {
    label: "Chức danh người ký",
    placeholder: "Chức danh người ký",
  },
  "signature.signerName": {
    label: "Họ và tên người ký",
    placeholder: "Họ và tên người ký",
  },
} as const;

const BM104_DEMO_RUNTIME_UX = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN ...",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN ...",
  "document.documentCode": ".../QĐ-VKS",
  "document.issuePlaceAndDateLine": "..., ngày ... tháng ... năm ...",
  "investigationExtension.requestRoundText": "lần thứ ...",
  "official.issuerTitle": "VIỆN TRƯỞNG VIỆN KIỂM SÁT ...",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 41 và Điều 172 Bộ luật Tố tụng hình sự;",
  "caseDecision.prosecutionDecisionLegalBasisLine":
    "Căn cứ Quyết định khởi tố vụ án hình sự số ... ngày ... của ...;",
  "investigationRecovery.legalBasisLine":
    "Căn cứ Quyết định phục hồi điều tra vụ án hình sự số ... ngày ... của ... (nếu có);",
  "proposal.requestingDocumentLine":
    "Xét hồ sơ đề nghị gia hạn thời hạn điều tra đối với vụ án hình sự của ...",
  "investigationExtension.reasonLine":
    "Nhận thấy việc gia hạn thời hạn điều tra vụ án hình sự là có căn cứ và cần thiết,",
  "investigationExtension.decisionArticle1Line":
    "Gia hạn thời hạn điều tra vụ án hình sự lần thứ ... với thời hạn điều tra là ...",
  "investigationExtension.decisionArticle2Line":
    "Yêu cầu ... thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.",
  "recipients.investigatingAgencyLine": "...",
  "recipients.archiveLine": "- Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "KT. VIỆN TRƯỞNG",
  "signature.positionTitle": "PHÓ VIỆN TRƯỞNG",
  "signature.signerName": "...",
} as const;

const BM104_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-104",
  versionLabel: "BM-104 curated investigation-extension decision profile",
  sections: BM104_SECTIONS,
  fields: BM104_FIELDS,
  demo: BM104_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM104_RUNTIME_UX_PROFILE);
