/** BM-213 source-aligned runtime UX profile for the juvenile-protection request. */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM213_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản yêu cầu",
    description:
      "Thông tin cơ quan ban hành và số, địa danh, ngày của yêu cầu áp dụng biện pháp kỹ thuật để bảo vệ người chưa thành niên.",
  },
  {
    sectionId: "section-thong-tin-nguoi-chua-thanh-nien",
    title: "Thông tin người chưa thành niên",
    description:
      "Thông tin nhận dạng, cư trú và hoàn cảnh của người chưa thành niên là bị hại hoặc người làm chứng.",
  },
  {
    sectionId: "section-noi-dung-yeu-cau-bao-ve",
    title: "Nội dung yêu cầu bảo vệ",
    description:
      "Bối cảnh phát tán thông tin hoặc hình ảnh trên không gian mạng, biện pháp kỹ thuật cần áp dụng và thời hạn thông báo kết quả.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận và phối hợp",
    description:
      "Các cơ quan, tổ chức hoặc cá nhân nhận yêu cầu, phối hợp thực hiện và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Người ký",
    description:
      "Họ tên người ký và chức danh ban hành yêu cầu theo mẫu số 213/HS.",
  },
] as const;

const BM213_FIELDS = {
  "agency.parentName": {
    label: "Viện Kiểm sát cấp trên trực tiếp",
    placeholder: "Tên Viện Kiểm sát cấp trên trực tiếp",
  },
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Tên Viện Kiểm sát ban hành",
  },
  "document.documentCode": {
    label: "Số yêu cầu",
    placeholder: "Số /YC-VKS",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Địa danh, ngày, tháng, năm ban hành",
  },
  "official.issuerTitle": {
    label: "Chức danh người ban hành",
    placeholder: "Viện trưởng Viện Kiểm sát",
  },
  "person.fullName": {
    label: "Họ tên người chưa thành niên",
    placeholder: "Họ và tên người chưa thành niên",
  },
  "person.genderLabel": {
    label: "Giới tính",
    placeholder: "Giới tính của người chưa thành niên",
  },
  "person.otherName": {
    label: "Tên gọi khác",
    placeholder: "Tên gọi khác, nếu có",
  },
  "person.dateOfBirthText": {
    label: "Ngày sinh",
    placeholder: "Ngày, tháng, năm sinh",
  },
  "person.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Nơi sinh",
  },
  "person.nationality": {
    label: "Quốc tịch",
    placeholder: "Quốc tịch",
  },
  "person.ethnicity": {
    label: "Dân tộc",
    placeholder: "Dân tộc",
  },
  "person.religion": {
    label: "Tôn giáo",
    placeholder: "Tôn giáo, nếu có",
  },
  "person.occupation": {
    label: "Nghề nghiệp hoặc tình trạng học tập",
    placeholder: "Nghề nghiệp hoặc tình trạng học tập",
  },
  "person.identityDocumentLine": {
    label: "Giấy tờ tùy thân hoặc số định danh",
    placeholder: "Số CMND, thẻ căn cước, hộ chiếu hoặc số định danh cá nhân",
  },
  "person.identityIssueLine": {
    label: "Ngày cấp và nơi cấp giấy tờ",
    placeholder: "Ngày cấp và nơi cấp",
  },
  "person.permanentAddress": {
    label: "Nơi thường trú",
    placeholder: "Nơi thường trú",
  },
  "person.temporaryAddress": {
    label: "Nơi tạm trú",
    placeholder: "Nơi tạm trú, nếu có",
  },
  "person.currentAddress": {
    label: "Nơi ở hiện tại",
    placeholder: "Nơi ở hiện tại",
  },
  "juvenileProtection.contextLine": {
    label: "Bối cảnh cần bảo vệ",
    placeholder: "Thông tin hoặc hình ảnh cá nhân cần được bảo vệ",
  },
  "juvenileProtection.article1Line": {
    label: "Biện pháp kỹ thuật được yêu cầu",
    placeholder: "Biện pháp kỹ thuật bảo vệ thông tin cá nhân, danh dự, nhân phẩm",
  },
  "juvenileProtection.resultDeadlineLine": {
    label: "Thời hạn thông báo kết quả",
    placeholder: "Thời hạn thông báo kết quả thực hiện",
  },
  "juvenileProtection.article2Line": {
    label: "Yêu cầu phối hợp",
    placeholder: "Nội dung phối hợp rà soát, cung cấp thông tin và xử lý",
  },
  "recipients.primaryLine": {
    label: "Nơi nhận chính",
    placeholder: "Cơ quan, người có thẩm quyền nhận yêu cầu",
  },
  "recipients.investigationAuthorityLine": {
    label: "Cơ quan, người thực hiện biện pháp kỹ thuật",
    placeholder: "Tên cơ quan hoặc người có thẩm quyền thực hiện",
  },
  "recipients.otherRecipientsLine": {
    label: "Cơ quan, tổ chức, cá nhân phối hợp",
    placeholder: "Cơ quan, tổ chức hoặc cá nhân liên quan",
  },
  "recipients.archiveLine": {
    label: "Nơi lưu hồ sơ",
    placeholder: "Lưu: HSVV/VA, HSKS, VP",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Họ tên người ký",
  },
} as const;

const BM213_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-213",
  versionLabel: "BM-213 semantic closure profile — 28/28 fields curated",
  sections: BM213_SECTIONS,
  presentationSections: [
    {
      id: "section-co-quan-va-van-ban",
      title: "Cơ quan và văn bản yêu cầu",
      description: "Thông tin cơ quan ban hành và văn bản yêu cầu.",
      fieldKeys: [
        "agency.parentName",
        "agency.name",
        "document.documentCode",
        "document.issuePlaceAndDateLine",
        "official.issuerTitle",
      ],
    },
    {
      id: "section-thong-tin-nguoi-chua-thanh-nien",
      title: "Thông tin người chưa thành niên",
      description: "Thông tin nhận dạng và cư trú của người chưa thành niên.",
      fieldKeys: [
        "person.fullName",
        "person.genderLabel",
        "person.otherName",
        "person.dateOfBirthText",
        "person.placeOfBirth",
        "person.nationality",
        "person.ethnicity",
        "person.religion",
        "person.occupation",
        "person.identityDocumentLine",
        "person.identityIssueLine",
        "person.permanentAddress",
        "person.temporaryAddress",
        "person.currentAddress",
      ],
    },
    {
      id: "section-noi-dung-yeu-cau-bao-ve",
      title: "Nội dung yêu cầu bảo vệ",
      description: "Bối cảnh, biện pháp kỹ thuật, thời hạn và yêu cầu phối hợp.",
      fieldKeys: [
        "juvenileProtection.contextLine",
        "juvenileProtection.article1Line",
        "juvenileProtection.resultDeadlineLine",
        "juvenileProtection.article2Line",
      ],
    },
    {
      id: "section-noi-nhan",
      title: "Nơi nhận và phối hợp",
      description: "Nơi nhận chính, đơn vị thực hiện, bên phối hợp và nơi lưu hồ sơ.",
      fieldKeys: [
        "recipients.primaryLine",
        "recipients.investigationAuthorityLine",
        "recipients.otherRecipientsLine",
        "recipients.archiveLine",
      ],
    },
    {
      id: "section-chu-ky",
      title: "Người ký",
      description: "Thông tin người ký văn bản.",
      fieldKeys: ["signature.signerName"],
    },
  ],
  fields: BM213_FIELDS,
  demo: {},
};

registerRuntimeUxProfile(BM213_RUNTIME_UX_PROFILE);
