import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM103_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-103",
  versionLabel: "BM-103 curated investigation-extension request profile",
  sections: [
    {
      sectionId: "section-co-quan-va-van-ban",
      title: "Cơ quan ban hành và văn bản đề nghị",
      description:
        "Thông tin Viện kiểm sát đề nghị gia hạn điều tra, số văn bản và Viện kiểm sát nhận đề nghị.",
    },
    {
      sectionId: "section-can-cu-phap-ly",
      title: "Căn cứ và nội dung đề nghị gia hạn điều tra",
      description:
        "Căn cứ tố tụng, quyết định khởi tố vụ án, lần gia hạn trước và thời hạn đề nghị gia hạn.",
    },
    {
      sectionId: "section-noi-nhan",
      title: "Nơi nhận và lưu hồ sơ",
      description:
        "Viện kiểm sát cấp trên, cơ quan điều tra và dòng lưu hồ sơ của văn bản đề nghị.",
    },
    {
      sectionId: "section-chu-ky",
      title: "Ký ban hành văn bản đề nghị",
      description: "Hình thức ký, chức danh và họ tên người ký văn bản.",
    },
  ],
  fields: {
    "agency.parentName": {
      label: "Viện kiểm sát cấp trên trực tiếp",
      placeholder: "Nhập tên Viện kiểm sát cấp trên trực tiếp",
    },
    "agency.name": {
      label: "Viện kiểm sát ban hành đề nghị",
      placeholder: "Nhập tên Viện kiểm sát ban hành",
    },
    "document.documentCode": {
      label: "Số văn bản đề nghị gia hạn điều tra",
      placeholder: "Ví dụ: 103/VKS",
    },
    "document.issuePlaceAndDateLine": {
      label: "Dòng địa danh, ngày ban hành",
      placeholder: "Ví dụ: Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
    },
    "recipients.superiorProcuracyName": {
      label: "Viện kiểm sát nhận đề nghị",
      placeholder: "Nhập tên Viện kiểm sát được đề nghị gia hạn",
    },
    "legalBasis.procedureArticlesLine": {
      label: "Căn cứ Bộ luật Tố tụng hình sự",
      placeholder: "Nêu các điều luật làm căn cứ đề nghị gia hạn",
      control: "TEXTAREA",
    },
    "caseDecision.prosecutionDecisionLegalBasisLine": {
      label: "Căn cứ quyết định khởi tố vụ án",
      placeholder: "Nêu số, ngày và cơ quan/người có thẩm quyền ra quyết định khởi tố vụ án",
      control: "TEXTAREA",
    },
    "investigationExtension.previousDecisionLegalBasisLine": {
      label: "Căn cứ quyết định gia hạn điều tra trước đó",
      placeholder: "Nêu lần, số, ngày và Viện kiểm sát ban hành quyết định gia hạn trước",
      control: "TEXTAREA",
    },
    "proposal.requestingDocumentLine": {
      label: "Văn bản đề nghị gia hạn của cơ quan có thẩm quyền",
      placeholder: "Nêu văn bản đề nghị gia hạn thời hạn điều tra",
      control: "TEXTAREA",
    },
    "proposal.proposingProcuracyName": {
      label: "Viện kiểm sát đề nghị gia hạn",
      placeholder: "Nhập tên Viện kiểm sát đề nghị",
    },
    "investigationExtension.requestRoundText": {
      label: "Lần đề nghị gia hạn điều tra",
      placeholder: "Ví dụ: lần thứ nhất",
    },
    "caseDecision.prosecutionDecisionSummaryLine": {
      label: "Thông tin quyết định khởi tố vụ án",
      placeholder: "Nêu số, ngày, cơ quan/người ra quyết định và tội danh của vụ án",
      control: "TEXTAREA",
    },
    "investigationExtension.durationText": {
      label: "Thời hạn đề nghị gia hạn",
      placeholder: "Ví dụ: 02 tháng",
    },
    "investigationExtension.fromDateText": {
      label: "Ngày bắt đầu thời hạn gia hạn",
      placeholder: "Ngày bắt đầu tính thời hạn gia hạn",
    },
    "investigationExtension.toDateText": {
      label: "Ngày kết thúc thời hạn gia hạn",
      placeholder: "Ngày kết thúc thời hạn gia hạn",
    },
    "recipients.superiorProcuracyLine": {
      label: "Nơi nhận: Viện kiểm sát cấp trên",
      placeholder: "Nhập Viện kiểm sát cấp trên nhận văn bản",
    },
    "recipients.investigatingAgencyLine": {
      label: "Nơi nhận: Cơ quan điều tra",
      placeholder: "Nhập cơ quan điều tra nhận văn bản",
    },
    "recipients.archiveLine": {
      label: "Dòng lưu hồ sơ",
      placeholder: "Ví dụ: Lưu: HSVA, HSKS, VP.",
    },
    "signature.signMode": {
      label: "Hình thức ký",
      placeholder: "Ví dụ: KT. VIỆN TRƯỞNG",
    },
    "signature.positionTitle": {
      label: "Chức danh người ký",
      placeholder: "Ví dụ: PHÓ VIỆN TRƯỞNG",
    },
    "signature.signerName": {
      label: "Họ tên người ký",
      placeholder: "Nhập họ tên người ký",
    },
  },
  demo: {
    "agency.parentName": "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    "agency.name": "Viện kiểm sát nhân dân Khu vực 7",
    "document.documentCode": "103/VKS",
    "document.issuePlaceAndDateLine": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
    "recipients.superiorProcuracyName": "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    "legalBasis.procedureArticlesLine": "Căn cứ Điều 41 và Điều 172 Bộ luật Tố tụng hình sự",
    "caseDecision.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án hình sự số 08 ngày 10 tháng 7 năm 2026",
    "investigationExtension.previousDecisionLegalBasisLine": "Căn cứ Quyết định gia hạn thời hạn điều tra vụ án hình sự lần thứ nhất số 05 ngày 20 tháng 6 năm 2026",
    "proposal.requestingDocumentLine": "Xét văn bản đề nghị gia hạn thời hạn điều tra vụ án hình sự của Cơ quan điều tra",
    "proposal.proposingProcuracyName": "Viện kiểm sát nhân dân Khu vực 7",
    "investigationExtension.requestRoundText": "lần thứ hai",
    "caseDecision.prosecutionDecisionSummaryLine": "Quyết định khởi tố vụ án hình sự theo hồ sơ vụ án",
    "investigationExtension.durationText": "02 tháng",
    "investigationExtension.fromDateText": "từ ngày 16 tháng 7 năm 2026",
    "investigationExtension.toDateText": "đến ngày 16 tháng 9 năm 2026",
    "recipients.superiorProcuracyLine": "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    "recipients.investigatingAgencyLine": "Cơ quan điều tra đang thụ lý vụ án",
    "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
    "signature.signMode": "KT. VIỆN TRƯỞNG",
    "signature.positionTitle": "PHÓ VIỆN TRƯỞNG",
    "signature.signerName": "Nguyễn Thị Mai",
  },
};

registerRuntimeUxProfile(BM103_RUNTIME_UX_PROFILE);
