/**
 * Curated runtime-ux profile for BM-044 — UI-only override metadata for the
 * standalone `/templates/BM-044` template page.
 *
 * Title: QĐ thay thế biện pháp tạm giam
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM044_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "0. Thông tin biểu mẫu",
    description:
      "Tên cơ quan (viết hoa), viện kiểm sát (viết hoa), số quyết định, địa danh — ngày ban hành, cơ quan ban hành.",
  },
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên (viết hoa), viện kiểm sát (viết hoa), số quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Bộ luật Tố tụng hình sự, Luật xử lý vi phạm hành chính, lệnh tạm giam, quyết định gia hạn, đề nghị thay thế.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Lý do thay thế, Điều 1 — nội dung, thời hạn áp dụng, Điều 2 — yêu cầu.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Bị can, cơ quan đề nghị, cơ quan thi hành và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM044_FIELDS = {
  "agency.parentNameUpper": {
    label: "Cơ quan cấp trên (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HÀ NỘI",
  },
  "agency.nameUpper": {
    label: "Viện kiểm sát (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN HUYỆN GIA LÂM",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "64/QĐ-VKSTT",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Hà Nội",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "official.issuingAuthorityLine": {
    label: "Cơ quan ban hành",
    placeholder: "Viện Kiểm sát nhân dân Huyện Gia Lâm;",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 109, Điều 115 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 109, Điều 115 BLTTHS năm 2015;",
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
  "detentionReplacement.detentionOrderLegalBasisLine": {
    label: "Căn cứ Lệnh tạm giam",
    placeholder:
      "Căn cứ Lệnh tạm giam số 30/TTG-PC10 ngày 11/3/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "detentionReplacement.detentionOrderLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Lệnh tạm giam số …/TTG-PC10 ngày …;",
    },
  },
  "detentionReplacement.detentionExtensionLegalBasisLine": {
    label: "Căn cứ Quyết định gia hạn tạm giam",
    placeholder:
      "Căn cứ Quyết định gia hạn tạm giam số 45/QĐ-VKSTG ngày 12/5/2026;",
    control: "TEXTAREA",
    smart: {
      key: "detentionReplacement.detentionExtensionLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ gia hạn số …/QĐ-VKSTG ngày …;",
    },
  },
  "detentionReplacement.proposalLine": {
    label: "Đề nghị thay thế biện pháp tạm giam",
    placeholder:
      "Đề nghị thay thế biện pháp tạm giam bằng biện pháp cấm đi khỏi nơi cư trú số 51/TTr-PC10 ngày 02/7/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "detentionReplacement.proposalLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Đề nghị thay thế biện pháp tạm giam số …/TTr-PC10 ngày …;",
    },
  },
  "detentionReplacement.reasonLine": {
    label: "Lý do thay thế",
    placeholder:
      "Xét thấy: hành vi phạm tội của bị can không còn đặc biệt nghiêm trọng; bị can có nhân thân tốt; cần áp dụng biện pháp nhẹ hơn để vẫn đảm bảo điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "detentionReplacement.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Bị can không còn nguy hiểm; cần BPNS nhẹ hơn;",
    },
  },
  "detentionReplacement.article1Line": {
    label: "Điều 1 — Nội dung quyết định",
    placeholder:
      "Quyết định thay thế biện pháp tạm giam bằng biện pháp cấm đi khỏi nơi cư trú đối với bị can Đào Văn Khải;",
    control: "TEXTAREA",
    smart: {
      key: "detentionReplacement.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Quyết định thay thế biện pháp tạm giam …;",
    },
  },
  "detentionReplacement.durationLine": {
    label: "Thời hạn áp dụng biện pháp thay thế",
    placeholder: "Thời hạn cấm đi khỏi nơi cư trú: 03 tháng, kể từ ngày ra quyết định.",
  },
  "detentionReplacement.article2Line": {
    label: "Điều 2 — Yêu cầu",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra tổ chức thi hành Quyết định thay thế biện pháp tạm giam theo quy định pháp luật;",
    control: "TEXTAREA",
    smart: {
      key: "detentionReplacement.article2Line",
      kind: "textarea",
      rows: 2,
      placeholder: "Yêu cầu CQCSĐT tổ chức thi hành;",
    },
  },
  "recipients.personLine": {
    label: "Nơi nhận — Bị can",
    placeholder: "Bị can Đào Văn Khải;",
  },
  "recipients.proposalAgencyLine": {
    label: "Nơi nhận — Cơ quan đề nghị",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Huyện Gia Lâm;",
  },
  "recipients.executionAgencyLine": {
    label: "Nơi nhận — Cơ quan thi hành",
    placeholder:
      "UBND xã Đình Xuyên — Huyện Gia Lâm — TP. Hà Nội (nơi cư trú của bị can);",
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
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Huyện Gia Lâm",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Nguyễn Văn Thắng",
  },
} as const;

const BM044_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HÀ NỘI",
  "agency.nameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN HUYỆN GIA LÂM",
  "document.documentCode": "64/QĐ-VKSTT",
  "document.issuePlaceAndDateLine":
    "Hà Nội, ngày 04 tháng 7 năm 2026",
  "official.issuingAuthorityLine":
    "Viện Kiểm sát nhân dân Huyện Gia Lâm;",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 109, Điều 115 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileJusticeLine":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "detentionReplacement.detentionOrderLegalBasisLine":
    "Căn cứ Lệnh tạm giam số 30/TTG-PC10 ngày 11/3/2026 của Cơ quan Cảnh sát điều tra;",
  "detentionReplacement.detentionExtensionLegalBasisLine":
    "Căn cứ Quyết định gia hạn tạm giam số 45/QĐ-VKSTG ngày 12/5/2026;",
  "detentionReplacement.proposalLine":
    "Đề nghị thay thế biện pháp tạm giam bằng biện pháp cấm đi khỏi nơi cư trú số 51/TTr-PC10 ngày 02/7/2026 của Cơ quan Cảnh sát điều tra;",
  "detentionReplacement.reasonLine":
    "Xét thấy: hành vi phạm tội của bị can không còn đặc biệt nghiêm trọng; bị can có nhân thân tốt, có nơi cư trú rõ ràng; cần áp dụng biện pháp nhẹ hơn để vẫn đảm bảo điều tra;",
  "detentionReplacement.article1Line":
    "Quyết định thay thế biện pháp tạm giam bằng biện pháp cấm đi khỏi nơi cư trú đối với bị can Đào Văn Khải;",
  "detentionReplacement.durationLine":
    "Thời hạn cấm đi khỏi nơi cư trú: 03 tháng, kể từ ngày ra quyết định.",
  "detentionReplacement.article2Line":
    "Yêu cầu Cơ quan Cảnh sát điều tra Công an Huyện Gia Lâm tổ chức thi hành Quyết định thay thế biện pháp tạm giam theo quy định pháp luật;",
  "recipients.personLine": "Bị can Đào Văn Khải;",
  "recipients.proposalAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an Huyện Gia Lâm;",
  "recipients.executionAgencyLine":
    "UBND xã Đình Xuyên — Huyện Gia Lâm — TP. Hà Nội (nơi cư trú của bị can);",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Huyện Gia Lâm",
  "signature.signerName": "Nguyễn Văn Thắng",
} as const;

const BM044_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-044",
  versionLabel:
    "BM-044 curated batch (issue-place-date-line + textarea smarts)",
  sections: BM044_SECTIONS,
  fields: BM044_FIELDS,
  demo: BM044_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM044_RUNTIME_UX_PROFILE);
