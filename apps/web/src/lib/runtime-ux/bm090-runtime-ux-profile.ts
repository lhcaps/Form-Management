/**
 * Curated runtime-ux profile for BM-090.
 *
 * 18 fields — QĐ phê chuẩn QĐ khởi tố bị can.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-090)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM090_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Viện kiểm sát cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Căn cứ Bộ luật Tố tụng hình sự, căn cứ luật tư pháp người chưa thành niên, căn cứ quyết định vụ án, đề nghị của cơ quan điều tra, đánh giá phê chuẩn.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Điều 1 — Phê chuẩn QĐ khởi tố bị can. Yêu cầu điều tra bổ sung.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan điều tra, bị can, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
] as const;

const BM090_FIELDS = {
  "agency.parentName": {
    label: "Viện kiểm sát cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định phê chuẩn",
    placeholder: "72/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định phê chuẩn QĐ khởi tố bị can.",
  },
  "document.issuePlaceDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceDateLine",
      kind: "issue-place-date-line",
      derivedTargets: ["document.issuePlaceDateLine"],
      placeholder: "Thành phố Hồ Chí Minh",
    },
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 126, 147, 153 Bộ luật Tố tụng hình sự năm 2015.",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 126, 147, 153 Bộ luật Tố tụng hình sự năm 2015.",
    },
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ luật tư pháp người chưa thành niên (nếu có)",
    placeholder: "—",
    smart: {
      key: "legalBasis.juvenileJusticeLine",
      kind: "textarea",
      rows: 2,
      placeholder: "—",
    },
  },
  "caseDecision.legalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder:
      "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về khởi tố vụ án hình sự số 08/2026/HSST.",
    smart: {
      key: "caseDecision.legalBasisLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về khởi tố vụ án hình sự số 08/2026/HSST.",
    },
  },
  "accusedDecision.requestLine": {
    label: "Đề nghị của cơ quan điều tra",
    placeholder:
      "Đề nghị số 12/ĐN-CSKT ngày 28 tháng 6 năm 2026 của Cơ quan Cảnh sát điều tra về việc đề nghị phê chuẩn QĐ khởi tố bị can đối với Lê Minh Quang.",
    smart: {
      key: "accusedDecision.requestLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Đề nghị số 12/ĐN-CSKT ngày 28 tháng 6 năm 2026 của Cơ quan Cảnh sát điều tra về việc đề nghị phê chuẩn QĐ khởi tố bị can đối với Lê Minh Quang.",
    },
  },
  "approval.assessmentLine": {
    label: "Đánh giá phê chuẩn của Viện kiểm sát",
    placeholder:
      "Sau khi xem xét đề nghị của Cơ quan điều tra, Viện kiểm sát nhận thấy: hành vi của Lê Minh Quang có dấu hiệu phạm tội lừa đảo chiếm đoạt tài sản theo Điều 174 BLHS; đủ căn cứ để phê chuẩn QĐ khởi tố bị can.",
    smart: {
      key: "approval.assessmentLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Sau khi xem xét đề nghị của Cơ quan điều tra, Viện kiểm sát nhận thấy: hành vi của Lê Minh Quang có dấu hiệu phạm tội lừa đảo chiếm đoạt tài sản theo Điều 174 BLHS; đủ căn cứ để phê chuẩn QĐ khởi tố bị can.",
    },
  },
  "accusedDecision.approvalArticle1Line": {
    label: "Điều 1 — Phê chuẩn QĐ khởi tố bị can",
    placeholder:
      "Phê chuẩn Quyết định khởi tố bị can số 18/QĐ-CSKT ngày 25 tháng 6 năm 2026 của Cơ quan Cảnh sát điều tra đối với Lê Minh Quang về tội lừa đảo chiếm đoạt tài sản theo Điều 174 BLHS 2015.",
    smart: {
      key: "accusedDecision.approvalArticle1Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Phê chuẩn Quyết định khởi tố bị can số 18/QĐ-CSKT ngày 25 tháng 6 năm 2026 của Cơ quan Cảnh sát điều tra đối với Lê Minh Quang về tội lừa đảo chiếm đoạt tài sản theo Điều 174 BLHS 2015.",
    },
  },
  "accusedDecision.investigationRequestLine": {
    label: "Yêu cầu điều tra",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra tiếp tục xác minh làm rõ các tình tiết: giá trị thiệt hại, mối quan hệ giữa các đối tượng, đối tượng đồng phạm, tài sản phạm tội.",
    smart: {
      key: "accusedDecision.investigationRequestLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Yêu cầu Cơ quan Cảnh sát điều tra tiếp tục xác minh làm rõ các tình tiết: giá trị thiệt hại, mối quan hệ giữa các đối tượng, đối tượng đồng phạm, tài sản phạm tội.",
    },
  },
  "recipients.investigationUnitLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Bị can",
    placeholder: "Lê Minh Quang (tại nơi tạm giam)",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký tay",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Hương",
  },
} as const;

const BM090_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.fullDocumentCode": "72/QĐ-VKSKV7",
  "document.issuePlaceDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 126, 147, 153 Bộ luật Tố tụng hình sự năm 2015.",
  "legalBasis.juvenileJusticeLine": "—",
  "caseDecision.legalBasisLine":
    "Quyết định số 09/QĐ-VKSKV7 ngày 15 tháng 2 năm 2026 về khởi tố vụ án hình sự số 08/2026/HSST.",
  "accusedDecision.requestLine":
    "Đề nghị số 12/ĐN-CSKT ngày 28 tháng 6 năm 2026 của Cơ quan Cảnh sát điều tra về việc đề nghị phê chuẩn QĐ khởi tố bị can đối với Lê Minh Quang.",
  "approval.assessmentLine":
    "Sau khi xem xét đề nghị của Cơ quan điều tra, Viện kiểm sát nhận thấy: hành vi của Lê Minh Quang có dấu hiệu phạm tội lừa đảo chiếm đoạt tài sản theo Điều 174 BLHS; đủ căn cứ để phê chuẩn QĐ khởi tố bị can.",
  "accusedDecision.approvalArticle1Line":
    "Phê chuẩn Quyết định khởi tố bị can số 18/QĐ-CSKT ngày 25 tháng 6 năm 2026 của Cơ quan Cảnh sát điều tra đối với Lê Minh Quang về tội lừa đảo chiếm đoạt tài sản theo Điều 174 BLHS 2015.",
  "accusedDecision.investigationRequestLine":
    "Yêu cầu Cơ quan Cảnh sát điều tra tiếp tục xác minh làm rõ các tình tiết: giá trị thiệt hại, mối quan hệ giữa các đối tượng, đối tượng đồng phạm, tài sản phạm tội.",
  "recipients.investigationUnitLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "recipients.personLine": "Lê Minh Quang (tại nơi tạm giam)",
  "recipients.archiveLine": "HSVA, HSKS, VP.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Hương",
} as const;

const BM090_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-090",
  versionLabel:
    "BM-090 curated batch 4 — QĐ phê chuẩn QĐ khởi tố bị can",
  sections: BM090_SECTIONS,
  fields: BM090_FIELDS,
  demo: BM090_DEMO,
};

registerRuntimeUxProfile(BM090_RUNTIME_UX_PROFILE);
