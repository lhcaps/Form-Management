/**
 * BM-146 runtime-ux batch 7 curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-146 profile to a
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

const BM146_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Thông tin cơ quan ban hành và văn bản QĐ tạm đình chỉ vụ án. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Các căn cứ pháp lý cho QĐ tạm đình chỉ vụ án: căn cứ Bộ luật Tố tụng hình sự (Điều 36, 41), căn cứ quyết định vụ án, lý do tạm đình chỉ điều tra vụ án.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Nội dung QĐ tạm đình chỉ vụ án: Điều 1 (nội dung chính), Điều 2 (xử lý vật chứng), Điều 3 (thông báo), Điều 4 (thẩm quyền giải quyết khiếu nại).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Danh sách nơi nhận QĐ tạm đình chỉ vụ án: Cơ quan điều tra tiếp nhận hồ sơ, nơi nhận khác, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Thông tin chế độ ký, chức vụ và họ tên người ký QĐ.",
  },
] as const;

const BM146_FIELDS = {
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
  "prosecutionCaseSuspension.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  },
  "prosecutionCaseSuspension.caseDecisionLegalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder: "",
  },
  "prosecutionCaseSuspension.reasonLine": {
    label: "Lý do đình chỉ điều tra vụ án",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseSuspension.article1Line": {
    label: "Điều 1 - Nội dung quyết định",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "prosecutionCaseSuspension.article2Line": {
    label: "Điều 2 - Xử lý vật chứng",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseSuspension.article3Line": {
    label: "Điều 3 - Thông báo",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseSuspension.article4Line": {
    label: "Điều 4 - Thẩm quyền giải quyết",
    placeholder: "Nhập nội dung",
  },
  "prosecutionCaseSuspension.investigationAuthorityRecipientLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder: "Nhập nội dung",
  },
  "recipients.otherRecipientsLine": {
    label: "Nơi nhận khác",
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

const BM146_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hà Nội, ngày ... tháng ... năm ...",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "prosecutionCaseSuspension.procedureArticlesLine": "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  "prosecutionCaseSuspension.caseDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án hình sự số 24/QĐ-CQĐT ngày 15 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionCaseSuspension.reasonLine": "Tran Van Binh",
  "prosecutionCaseSuspension.article1Line": "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  "prosecutionCaseSuspension.article2Line": "Tran Van Binh",
  "prosecutionCaseSuspension.article3Line": "Tran Van Binh",
  "prosecutionCaseSuspension.article4Line": "Tran Van Binh",
  "prosecutionCaseSuspension.investigationAuthorityRecipientLine": "Tran Van Binh",
  "recipients.otherRecipientsLine": "Tran Van Binh",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "",
} as const;

const BM146_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-146",
  versionLabel: `BM-146 — Quyết định tạm đình chỉ vụ án (runtime-ux)`,
  sections: BM146_SECTIONS,
  fields: BM146_FIELDS,
  demo: BM146_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-co-quan-va-van-ban",
      title: "Cơ quan và văn bản",
      description:
        "Thông tin cơ quan ban hành và văn bản QĐ tạm đình chỉ vụ án. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
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
        "Các căn cứ pháp lý cho QĐ tạm đình chỉ vụ án: căn cứ Bộ luật Tố tụng hình sự (Điều 36, 41), căn cứ quyết định vụ án, lý do tạm đình chỉ điều tra vụ án.",
      fieldKeys: [
        "prosecutionCaseSuspension.procedureArticlesLine",
        "prosecutionCaseSuspension.caseDecisionLegalBasisLine",
        "prosecutionCaseSuspension.reasonLine",
      ],
    },
    {
      id: "section-noi-dung-quyet-inh",
      title: "Nội dung quyết định",
      description:
        "Nội dung QĐ tạm đình chỉ vụ án: Điều 1 (nội dung chính), Điều 2 (xử lý vật chứng), Điều 3 (thông báo), Điều 4 (thẩm quyền giải quyết khiếu nại).",
      fieldKeys: [
        "prosecutionCaseSuspension.article1Line",
        "prosecutionCaseSuspension.article2Line",
        "prosecutionCaseSuspension.article3Line",
        "prosecutionCaseSuspension.article4Line",
      ],
    },
    {
      id: "section-noi-nhan",
      title: "Nơi nhận",
      description:
        "Danh sách nơi nhận QĐ tạm đình chỉ vụ án: Cơ quan điều tra tiếp nhận hồ sơ, nơi nhận khác, lưu hồ sơ.",
      fieldKeys: [
        "prosecutionCaseSuspension.investigationAuthorityRecipientLine",
        "recipients.otherRecipientsLine",
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

registerRuntimeUxProfile(BM146_RUNTIME_UX_PROFILE);
