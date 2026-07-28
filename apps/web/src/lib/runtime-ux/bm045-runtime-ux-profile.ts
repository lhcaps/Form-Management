/**
 * Curated runtime-ux profile for BM-045 — UI-only override metadata for the
 * standalone `/templates/BM-045` template page.
 *
 * Title: QĐ phê chuẩn QĐ về việc bảo lĩnh
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM045_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên (viết hoa), viện kiểm sát (viết hoa), số quyết định, địa danh — ngày ban hành, cơ quan ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Bộ luật Tố tụng hình sự, Luật xử lý vi phạm hành chính, căn cứ quyết định vụ án, căn cứ quyết định khởi tố bị can, đề nghị cho tại ngoại.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Lý do cho tại ngoại, Điều 1 — nội dung phê chuẩn, Điều 2 — điều kiện bảo lĩnh.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description:
      "Cơ quan thi hành, bị can / đại diện, người bảo lãnh và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM045_FIELDS = {
  "agency.parentNameUpper": {
    label: "Cơ quan cấp trên (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG",
  },
  "agency.nameUpper": {
    label: "Viện kiểm sát (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN QUẬN LIÊN CHIỂU",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "65/QĐ-VKSPCHC",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Đà Nẵng, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Đà Nẵng",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "official.issuingAuthorityLine": {
    label: "Cơ quan ban hành",
    placeholder: "Viện Kiểm sát nhân dân Quận Liên Chiểu;",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 109, Điều 121 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 109, Điều 121 BLTTHS năm 2015;",
    },
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính",
    placeholder: "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.juvenileJusticeLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Điều 18 Luật XLVPHC năm 2012;",
    },
  },
  "bailApproval.caseDecisionLegalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 47/QĐ-PC04 ngày 11/4/2026;",
    control: "TEXTAREA",
    smart: {
      key: "bailApproval.caseDecisionLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố vụ án số …/QĐ-PC04 ngày …;",
    },
  },
  "bailApproval.accusedDecisionLegalBasisLine": {
    label: "Căn cứ quyết định khởi tố bị can",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can số 48/QĐ-PC04 ngày 12/4/2026;",
    control: "TEXTAREA",
    smart: {
      key: "bailApproval.accusedDecisionLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố bị can số …/QĐ-PC04 ngày …;",
    },
  },
  "bailApproval.proposalLine": {
    label: "Đề nghị cho tại ngoại",
    placeholder:
      "Đề nghị cho bị can tại ngoại theo Đơn đề nghị bảo lĩnh số 61/TTr-PC04 ngày 03/6/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "bailApproval.proposalLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Đề nghị cho bảo lĩnh số …/TTr-PC04 ngày …;",
    },
  },
  "bailApproval.reasonLine": {
    label: "Lý do cho tại ngoại",
    placeholder:
      "Xét thấy: bị can có nhân thân tốt, có nơi cư trú rõ ràng; có người bảo lĩnh là ông Đặng Văn Minh (bố đẻ); thuộc trường hợp được bảo lĩnh theo Điều 121 BLTTHS;",
    control: "TEXTAREA",
    smart: {
      key: "bailApproval.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Bị can có nhân thân tốt; có người bảo lĩnh;",
    },
  },
  "bailApproval.article1Line": {
    label: "Điều 1 — Nội dung quyết định phê chuẩn",
    placeholder:
      "Phê chuẩn Quyết định về việc bảo lĩnh số 39/QĐ-BL-PC04 ngày 04/6/2026 của Cơ quan Cảnh sát điều tra đối với bị can Lê Văn Sơn;",
    control: "TEXTAREA",
    smart: {
      key: "bailApproval.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Phê chuẩn QĐ về việc bảo lĩnh …;",
    },
  },
  "bailApproval.article2Line": {
    label: "Điều 2 — Điều kiện bảo lĩnh",
    placeholder:
      "Bị can Lê Văn Sơn phải có mặt theo giấy triệu tập của Cơ quan Cảnh sát điều tra, Viện Kiểm sát và Toà án; không được thay đổi nơi cư trú; không được tiếp xúc với những người có liên quan đến vụ án theo quy định;",
    control: "TEXTAREA",
    smart: {
      key: "bailApproval.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Có mặt theo giấy triệu tập; không đổi nơi cư trú;",
    },
  },
  "recipients.executionAgencyLine": {
    label: "Nơi nhận — Cơ quan thi hành",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận Liên Chiểu;",
  },
  "recipients.personRepresentativeLine": {
    label: "Nơi nhận — Bị can / đại diện",
    placeholder: "Bị can Lê Văn Sơn;",
  },
  "recipients.bailReceiverLine": {
    label: "Nơi nhận — Người bảo lãnh",
    placeholder: "Ông Đặng Văn Minh;",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký tập thể",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Quận Liên Chiểu",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Bùi Quang Huy",
  },
} as const;

const BM045_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ ĐÀ NẴNG",
  "agency.nameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN QUẬN LIÊN CHIỂU",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Đà Nẵng, ngày 04 tháng 7 năm 2026",
  "official.issuingAuthorityLine":
    "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 109, Điều 121 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileJusticeLine":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "bailApproval.caseDecisionLegalBasisLine":
    "Căn cứ Quyết định khởi tố vụ án hình sự số 35/QĐ-CQĐT ngày 25 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "bailApproval.accusedDecisionLegalBasisLine":
    "Căn cứ Quyết định khởi tố bị can số 36/QĐ-CQĐT ngày 25 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "bailApproval.proposalLine":
    "Đề nghị phê chuẩn việc cho bị can Nguyễn Văn A được bảo lãnh theo quy định tại Điều 122 BLTTHS 2015.",
  "bailApproval.reasonLine":
    "Xét thấy: bị can có nhân thân tốt, có nơi cư trú rõ ràng; có người bảo lĩnh là ông Đặng Văn Minh (bố đẻ); thuộc trường hợp được bảo lĩnh theo Điều 121 BLTTHS;",
  "bailApproval.article1Line":
    "Phê chuẩn Quyết định về việc bảo lĩnh số 39/QĐ-BL-PC04 ngày 04/6/2026 của Cơ quan Cảnh sát điều tra đối với bị can Lê Văn Sơn;",
  "bailApproval.article2Line":
    "Bị can Lê Văn Sơn phải có mặt theo giấy triệu tập của Cơ quan Cảnh sát điều tra, Viện Kiểm sát và Toà án; không được thay đổi nơi cư trú; không được tiếp xúc với những người có liên quan đến vụ án theo quy định;",
  "recipients.executionAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an Quận Liên Chiểu;",
  "recipients.personRepresentativeLine": "Bị can Lê Văn Sơn;",
  "recipients.bailReceiverLine": "Ông Đặng Văn Minh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Quận Liên Chiểu",
  "signature.signerName": "Bùi Quang Huy",
} as const;

const BM045_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-045",
  versionLabel:
    "BM-045 curated batch (issue-place-date-line + textarea smarts)",
  sections: BM045_SECTIONS,
  fields: BM045_FIELDS,
  demo: BM045_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM045_RUNTIME_UX_PROFILE);
