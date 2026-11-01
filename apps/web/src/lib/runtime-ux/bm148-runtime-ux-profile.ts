/**
 * BM-148 runtime-ux curated source-render profile.
 *
 * This profile upgrades the auto-generated BM-148 profile to a
 * curated source/render version. Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Family: ĐÌNH CHỈ BỊ CAN — Đối với bị can (accused-targeted
 * case suspension). Distinct subfamily from BM-146/BM-147/BM-150/BM-151
 * (ĐÌNH CHỈ VỤ ÁN — case-targeted). Shares BLTTHS Điều 41 but
 * adds distinct accused-identity section (thông tin bị can) and distinct
 * field namespaces.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM148_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Thông tin cơ quan ban hành và văn bản QĐ tạm đình chỉ vụ án đối với bị can. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Các căn cứ pháp lý cho QĐ tạm đình chỉ: căn cứ Bộ luật Tố tụng hình sự, căn cứ Luật xử lý vi phạm hành chính, căn cứ quyết định truy tố, căn cứ quyết định đối với bị can, lý do tạm đình chỉ.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Nội dung QĐ tạm đình chỉ: Điều 1 (nội dung chính), Điều 2 (hành động), Điều 3 (yêu cầu thực hiện).",
  },
  {
    sectionId: "section-thong-tin-bi-can",
    title: "Thông tin bị can",
    description:
      "Thông tin nhận diện bị can trong vụ án hình sự. Mục ghi nhận họ tên, giới tính, tên gọi khác, sinh ngày, quốc tịch/dân tộc/tôn giáo, nghề nghiệp, số CMND/CCCD, nơi cấp, nơi thường trú, nơi tạm trú, nơi ở hiện tại.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Danh sách nơi nhận QĐ tạm đình chỉ: nơi nhận chính 1, nơi nhận chính 2, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Thông tin chế độ ký, chức vụ và họ tên người ký QĐ.",
  },
] as const;

const BM148_FIELDS = {
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
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 36 và Điều 41 Bộ luật Tố tụng hình sự năm 2015",
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính",
    placeholder: "Nhập nội dung",
  },
  "caseDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định truy tố",
    placeholder: "Nhập nội dung",
  },
  "accusedDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ quyết định đối với bị can",
    placeholder: "Nhập nội dung",
  },
  "suspension.reasonLine": {
    label: "Lý do đình chỉ điều tra",
    placeholder: "Nhập nội dung",
  },
  "suspension.article1Line": {
    label: "Điều 1 - Nội dung quyết định",
    placeholder: "Điều 1. Nội dung quyết định được thực hiện theo quy định pháp luật.",
  },
  "person.fullName": {
    label: "Họ và tên",
    placeholder: "Nhập họ tên bị can",
  },
  "person.genderText": {
    label: "Giới tính",
    placeholder: "Nhập nội dung",
  },
  "person.otherName": {
    label: "Tên gọi khác",
    placeholder: "Nhập nội dung",
  },
  "person.birthDateLine": {
    label: "Sinh ngày",
    placeholder: "Nhập nội dung",
  },
  "person.nationalityEthnicityReligionLine": {
    label: "Quốc tịch, dân tộc, tôn giáo",
    placeholder: "Nhập nội dung",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Nhập nội dung",
  },
  "person.identityNo": {
    label: "Số CMND/CCCD",
    placeholder: "Nhập số CMND/CCCD",
  },
  "person.identityIssueLine": {
    label: "Nơi cấp CMND/CCCD",
    placeholder: "Nhập nội dung",
  },
  "person.permanentResidence": {
    label: "Nơi thường trú",
    placeholder: "Nhập nội dung",
  },
  "person.temporaryResidence": {
    label: "Nơi tạm trú",
    placeholder: "Nhập nội dung",
  },
  "person.currentResidence": {
    label: "Nơi ở hiện tại",
    placeholder: "Nhập nội dung",
  },
  "suspension.article2ActionLine": {
    label: "Điều 2 - Hành động",
    placeholder: "Nhập nội dung",
  },
  "suspension.executionRequestLine": {
    label: "Điều 3 - Yêu cầu",
    placeholder: "Nhập nội dung",
  },
  "recipients.line1": {
    label: "Nơi nhận chính 1",
    placeholder: "Nhập nội dung",
  },
  "recipients.line2": {
    label: "Nơi nhận chính 2",
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
    placeholder: "Nhập họ tên người ký",
  },
} as const;

const BM148_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Viện trưởng Viện Kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine": "Căn cứ các điều 36, 41 và 119 của Bộ luật Tố tụng hình sự 2015",
  "legalBasis.juvenileJusticeLine": "",
  "caseDecision.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án hình sự số 18/QĐ-CQĐT ngày 10/3/2026 của Cơ quan Cảnh sát điều tra Công an TP.HCM",
  "accusedDecision.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 19/QĐ-CQĐT ngày 11/3/2026 của Cơ quan Cảnh sát điều tra Công an TP.HCM",
  "suspension.reasonLine": "Để bảo đảm cho việc điều tra, truy tố, xét xử vụ án và thi hành án theo quy định pháp luật.",
  "suspension.article1Line": "Điều 1. Tạm đình chỉ việc kiểm sát điều tra vụ án hình sự đối với bị can Nguyễn Văn A.",
  "person.fullName": "Nguyễn Văn A",
  "person.genderText": "Nam",
  "person.otherName": "Không có",
  "person.birthDateLine": "08/09/1985",
  "person.nationalityEthnicityReligionLine": "Việt Nam — Dân tộc Kinh — Không tôn giáo",
  "person.occupation": "Lao động tự do",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 079085001234 is a format-shaped synthetic test CCCD, not derived from real customer/case data.
  "person.identityNo": "079085001234",
  "person.identityIssueLine": "Số 079085001234 do Cục Cảnh sát QLHC về TTXH cấp ngày 22/12/2021",
  "person.permanentResidence": "Số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
  "person.temporaryResidence": "",
  "person.currentResidence": "Số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
  "suspension.article2ActionLine": "Điều 2. Phục hồi điều tra khi có căn cứ theo quy định tại Điều 36 BLTTHS 2015.",
  "suspension.executionRequestLine": "Viện Kiểm sát nhân dân Khu vực 7 yêu cầu Cơ quan Cảnh sát điều tra thi hành Quyết định tạm đình chỉ.",
  "recipients.line1": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "recipients.line2": "Bị can Nguyễn Văn A;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "",
} as const;

const BM148_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-148",
  versionLabel: `BM-148 — Quyết định tạm đình chỉ vụ án đối với bị can (runtime-ux)`,
  sections: BM148_SECTIONS,
  fields: BM148_FIELDS,
  demo: BM148_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-co-quan-va-van-ban",
      title: "Cơ quan và văn bản",
      description:
        "Thông tin cơ quan ban hành và văn bản QĐ tạm đình chỉ vụ án đối với bị can. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
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
        "Các căn cứ pháp lý cho QĐ tạm đình chỉ: căn cứ Bộ luật Tố tụng hình sự, căn cứ Luật xử lý vi phạm hành chính, căn cứ quyết định truy tố, căn cứ quyết định đối với bị can, lý do tạm đình chỉ.",
      fieldKeys: [
        "legalBasis.procedureArticlesLine",
        "legalBasis.juvenileJusticeLine",
        "caseDecision.prosecutionDecisionLegalBasisLine",
        "accusedDecision.prosecutionDecisionLegalBasisLine",
        "suspension.reasonLine",
      ],
    },
    {
      id: "section-noi-dung-quyet-inh",
      title: "Nội dung quyết định",
      description:
        "Nội dung QĐ tạm đình chỉ: Điều 1 (nội dung chính), Điều 2 (hành động), Điều 3 (yêu cầu thực hiện).",
      fieldKeys: [
        "suspension.article1Line",
        "suspension.article2ActionLine",
        "suspension.executionRequestLine",
      ],
    },
    {
      id: "section-thong-tin-bi-can",
      title: "Thông tin bị can",
      description:
        "Thông tin nhận diện bị can trong vụ án hình sự. Mục ghi nhận họ tên, giới tính, tên gọi khác, sinh ngày, quốc tịch/dân tộc/tôn giáo, nghề nghiệp, số CMND/CCCD, nơi cấp, nơi thường trú, nơi tạm trú, nơi ở hiện tại.",
      fieldKeys: [
        "person.fullName",
        "person.genderText",
        "person.otherName",
        "person.birthDateLine",
        "person.nationalityEthnicityReligionLine",
        "person.occupation",
        "person.identityNo",
        "person.identityIssueLine",
        "person.permanentResidence",
        "person.temporaryResidence",
        "person.currentResidence",
      ],
    },
    {
      id: "section-noi-nhan",
      title: "Nơi nhận",
      description:
        "Danh sách nơi nhận QĐ tạm đình chỉ: nơi nhận chính 1, nơi nhận chính 2, lưu hồ sơ.",
      fieldKeys: [
        "recipients.line1",
        "recipients.line2",
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

registerRuntimeUxProfile(BM148_RUNTIME_UX_PROFILE);
