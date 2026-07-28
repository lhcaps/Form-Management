/**
 * BM-150 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-150 profile to a
 * curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS requires source/render smoke +
 * Batch 7 curation only. Browser/demo/preview/DOCX/fidelity/visual/
 * human evidence remains NOT_RUN for Batch 7.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM150_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Thông tin cơ quan ban hành và văn bản QĐ đình chỉ vụ án. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Các căn cứ pháp lý cho QĐ đình chỉ vụ án: căn cứ Bộ luật Tố tụng hình sự (Điều 36, 41), căn cứ quyết định vụ án, căn cứ quyết định khởi tố bị can, lý do chấm dứt truy tố.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Nội dung QĐ đình chỉ vụ án: Điều 1 (nội dung chính), Điều 2 (hậu quả pháp lý), Điều 3 (thông báo), Điều 4 (khiếu nại).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Danh sách nơi nhận QĐ đình chỉ vụ án: VKS cấp trên, cơ quan khác, bị can/đại diện, Cơ quan điều tra, luật sư, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Thông tin chế độ ký, chức vụ và họ tên người ký QĐ.",
  },
] as const;

const BM150_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "Nhập nội dung",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "21/QĐ-VKSKV7",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Thành phố Hà Nội, ngày ... tháng ... năm ...",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng",
  },
  "prosecutionCaseTermination.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  },
  "prosecutionCaseTermination.caseDecisionLegalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder: "",
  },
  "prosecutionCaseTermination.accusedDecisionLegalBasisLine": {
    label: "Căn cứ quyết định khởi tố bị can",
    placeholder: "",
  },
  "prosecutionCaseTermination.reasonLine": {
    label: "Lý do chấm dứt truy tố",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseTermination.article1Line": {
    label: "Điều 1 - Nội dung quyết định",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "prosecutionCaseTermination.article2Line": {
    label: "Điều 2 - Hậu quả pháp lý",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseTermination.article3Line": {
    label: "Điều 3 - Thông báo",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseTermination.article4Line": {
    label: "Điều 4 - Khiếu nại",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseTermination.superiorProcuracyRecipientLine": {
    label: "Nơi nhận - VKS cấp trên",
    placeholder: "Nhập nội dung",
  },
  "recipients.otherRecipientsLine": {
    label: "Nơi nhận - Cơ quan khác",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseTermination.accusedOrRepresentativeRecipientLine": {
    label: "Nơi nhận - Bị can/đại diện",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseTermination.investigationAuthorityRecipientLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseTermination.defenseCounselRecipientLine": {
    label: "Nơi nhận - Luật sư",
    placeholder: "Nhập nội dung",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký số",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Phó Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "",
  },
} as const;

const BM150_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày ... tháng ... năm ...",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "prosecutionCaseTermination.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "prosecutionCaseTermination.caseDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án hình sự số 22/QĐ-CQĐT ngày 18 tháng 3 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionCaseTermination.accusedDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 23/QĐ-CQĐT ngày 18 tháng 3 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionCaseTermination.reasonLine": "Tran Van Binh",
  "prosecutionCaseTermination.article1Line": "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  "prosecutionCaseTermination.article2Line": "Tran Van Binh",
  "prosecutionCaseTermination.article3Line": "Tran Van Binh",
  "prosecutionCaseTermination.article4Line": "Tran Van Binh",
  "prosecutionCaseTermination.superiorProcuracyRecipientLine": "Tran Van Binh",
  "recipients.otherRecipientsLine": "Tran Van Binh",
  "prosecutionCaseTermination.accusedOrRepresentativeRecipientLine": "Tran Van Binh",
  "prosecutionCaseTermination.investigationAuthorityRecipientLine": "Tran Van Binh",
  "prosecutionCaseTermination.defenseCounselRecipientLine": "Tran Van Binh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "",
} as const;

const BM150_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-150",
  versionLabel: `BM-150 — Quyết định đình chỉ vụ án (runtime-ux)`,
  sections: BM150_SECTIONS,
  fields: BM150_FIELDS,
  demo: BM150_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-co-quan-va-van-ban",
      title: "Cơ quan và văn bản",
      description:
        "Thông tin cơ quan ban hành và văn bản QĐ đình chỉ vụ án. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
      fieldKeys: [
        "agency.parentName",
        "agency.name",
        "document.documentCode",
        "document.issuePlaceAndDateLine",
        "official.issuerTitle",
      ],
    },
    {
      id: "section-can-cu-phap-ly",
      title: "Căn cứ pháp lý",
      description:
        "Các căn cứ pháp lý cho QĐ đình chỉ vụ án: căn cứ Bộ luật Tố tụng hình sự (Điều 36, 41), căn cứ quyết định vụ án, căn cứ quyết định khởi tố bị can, lý do chấm dứt truy tố.",
      fieldKeys: [
        "prosecutionCaseTermination.procedureArticlesLine",
        "prosecutionCaseTermination.caseDecisionLegalBasisLine",
        "prosecutionCaseTermination.accusedDecisionLegalBasisLine",
        "prosecutionCaseTermination.reasonLine",
      ],
    },
    {
      id: "section-noi-dung-quyet-inh",
      title: "Nội dung quyết định",
      description:
        "Nội dung QĐ đình chỉ vụ án: Điều 1 (nội dung chính), Điều 2 (hậu quả pháp lý), Điều 3 (thông báo), Điều 4 (khiếu nại).",
      fieldKeys: [
        "prosecutionCaseTermination.article1Line",
        "prosecutionCaseTermination.article2Line",
        "prosecutionCaseTermination.article3Line",
        "prosecutionCaseTermination.article4Line",
      ],
    },
    {
      id: "section-noi-nhan",
      title: "Nơi nhận",
      description:
        "Danh sách nơi nhận QĐ đình chỉ vụ án: VKS cấp trên, cơ quan khác, bị can/đại diện, Cơ quan điều tra, luật sư, lưu hồ sơ.",
      fieldKeys: [
        "prosecutionCaseTermination.superiorProcuracyRecipientLine",
        "recipients.otherRecipientsLine",
        "prosecutionCaseTermination.accusedOrRepresentativeRecipientLine",
        "prosecutionCaseTermination.investigationAuthorityRecipientLine",
        "prosecutionCaseTermination.defenseCounselRecipientLine",
        "recipients.archiveLine",
      ],
    },
    {
      id: "section-chu-ky",
      title: "Chữ ký",
      description:
        "Thông tin chế độ ký, chức vụ và họ tên người ký QĐ.",
      fieldKeys: [
        "signature.signMode",
        "signature.positionTitle",
        "signature.signerName",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM150_RUNTIME_UX_PROFILE);
