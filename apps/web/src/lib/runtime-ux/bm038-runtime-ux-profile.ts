/**
 * Curated runtime-ux profile for BM-038 — UI-only override metadata for the
 * standalone `/templates/BM-038` template page.
 *
 * Title: QĐ không phê chuẩn Lệnh bắt bị can để tạm giam
 *
 * Why this file exists
 * --------------------
 * Curates 5-section legal-decision layout (cơ quan — căn cứ — nội dung —
 * nơi nhận — chữ ký), removes "(mẫu BM-038)" stale tokens, adds
 * `issue-place-date-line` smart for the issue-date line and `textarea`
 * smarts for the long legal-basis / decision-body fields. Demo carries
 * realistic but fully synthetic Vietnamese legal text.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation, no `generatedDocumentId` fabrication.
 *   - No modification of `FormFlight` allowlist — BM-038 stays out of
 *     `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Locked contract:
 *   `docs/audit/docx/contracts/locked/BM-038__*.contract.locked.json`
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-038.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM038_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên (viết hoa), Viện kiểm sát (viết hoa), số quyết định, địa danh — ngày ban hành và cơ quan ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Bộ luật Tố tụng hình sự, Luật xử lý vi phạm hành chính, căn cứ quyết định vụ án, căn cứ quyết định khởi tố bị can.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Đề nghị của cơ quan đề nghị, lý do không phê chuẩn, Điều 1 — không phê chuẩn, Điều 2 — yêu cầu.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan thi hành, bị can và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM038_FIELDS = {
  "agency.parentNameUpper": {
    label: "Cơ quan cấp trên (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HÀ NỘI",
  },
  "agency.nameUpper": {
    label: "Viện kiểm sát (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN QUẬN CẦU GIẤY",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "60/QĐ-VKS",
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
    placeholder: "Viện Kiểm sát nhân dân Quận Cầu Giấy — TP. Hà Nội;",
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
  "arrestNonApproval.caseDecisionLegalBasisLine": {
    label: "Căn cứ quyết định vụ án",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 22/QĐ-PC10 ngày 12/4/2026;",
    control: "TEXTAREA",
    smart: {
      key: "arrestNonApproval.caseDecisionLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố vụ án số …/QĐ-PC10 ngày …;",
    },
  },
  "arrestNonApproval.accusedDecisionLegalBasisLine": {
    label: "Căn cứ quyết định khởi tố bị can",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can số 23/QĐ-PC10 ngày 13/4/2026;",
    control: "TEXTAREA",
    smart: {
      key: "arrestNonApproval.accusedDecisionLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố bị can số …/QĐ-PC10 ngày …;",
    },
  },
  "arrestNonApproval.proposalLine": {
    label: "Đề nghị không phê chuẩn",
    placeholder:
      "Đề nghị không phê chuẩn Lệnh bắt bị can để tạm giam số 19/LB-PC10 ngày 13/4/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "arrestNonApproval.proposalLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Đề nghị không phê chuẩn Lệnh bắt số …/LB-PC10 ngày …;",
    },
  },
  "arrestNonApproval.proposalAgencyLine": {
    label: "Cơ quan đề nghị",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận Cầu Giấy;",
  },
  "arrestNonApproval.reasonLine": {
    label: "Lý do không phê chuẩn",
    placeholder:
      "Xét thấy: lệnh bắt chưa đủ căn cứ, tài liệu điều tra chưa đầy đủ về hành vi phạm tội; chưa có dấu hiệu bỏ trốn, cản trở việc điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "arrestNonApproval.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Xét thấy tài liệu chưa đủ căn cứ để bắt, tạm giam;",
    },
  },
  "arrestNonApproval.article1Line": {
    label: "Điều 1 — Nội dung quyết định không phê chuẩn",
    placeholder:
      "Không phê chuẩn Lệnh bắt bị can để tạm giam số 19/LB-PC10 ngày 13/4/2026 của Cơ quan Cảnh sát điều tra Công an Quận Cầu Giấy đối với bị can Phạm Văn Đức;",
    control: "TEXTAREA",
    smart: {
      key: "arrestNonApproval.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Không phê chuẩn Lệnh bắt số …/LB-PC10 ngày …;",
    },
  },
  "arrestNonApproval.article2Line": {
    label: "Điều 2 — Yêu cầu",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra tiếp tục xác minh, bổ sung tài liệu theo quy định của Bộ luật Tố tụng hình sự;",
    control: "TEXTAREA",
    smart: {
      key: "arrestNonApproval.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Yêu cầu CQCSĐT bổ sung tài liệu theo quy định;",
    },
  },
  "recipients.executionAgencyLine": {
    label: "Nơi nhận — Cơ quan thi hành",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận Cầu Giấy;",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Bị can",
    placeholder: "Bị can Phạm Văn Đức;",
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
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Quận Cầu Giấy",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Đinh Thị Mai",
  },
} as const;

const BM038_DEMO_RUNTIME_UX = {
  "agency.parentNameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HÀ NỘI",
  "agency.nameUpper": "VIỆN KIỂM SÁT NHÂN DÂN QUẬN CẦU GIẤY",
  "document.documentCode": "21/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 7 năm 2026",
  "official.issuingAuthorityLine":
    "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 109, Điều 115 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileJusticeLine":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "arrestNonApproval.caseDecisionLegalBasisLine":
    "Căn cứ Quyết định khởi tố vụ án hình sự số 30/QĐ-CQĐT ngày 20 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "arrestNonApproval.accusedDecisionLegalBasisLine":
    "Căn cứ Quyết định khởi tố bị can số 31/QĐ-CQĐT ngày 20 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "arrestNonApproval.proposalLine":
    "Đề nghị Viện Kiểm sát nhân dân Khu vực 7 phê chuẩn Quyết định không phê chuẩn việc bắt người của Cơ quan Cảnh sát điều tra vì không đủ căn cứ theo quy định tại Điều 113 BLTTHS 2015.",
  "arrestNonApproval.proposalAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an Quận Cầu Giấy;",
  "arrestNonApproval.reasonLine":
    "Xét thấy: lệnh bắt chưa đủ căn cứ, tài liệu điều tra chưa đầy đủ về hành vi phạm tội của bị can; chưa có dấu hiệu bỏ trốn, cản trở việc điều tra;",
  "arrestNonApproval.article1Line":
    "Không phê chuẩn Lệnh bắt bị can để tạm giam số 19/LB-PC10 ngày 13/4/2026 của Cơ quan Cảnh sát điều tra Công an Quận Cầu Giấy đối với bị can Phạm Văn Đức;",
  "arrestNonApproval.article2Line":
    "Yêu cầu Cơ quan Cảnh sát điều tra tiếp tục xác minh, bổ sung tài liệu theo quy định của Bộ luật Tố tụng hình sự;",
  "recipients.executionAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an Quận Cầu Giấy;",
  "recipients.personLine": "Bị can Phạm Văn Đức;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Quận Cầu Giấy",
  "signature.signerName": "Đinh Thị Mai",
} as const;

const BM038_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-038",
  versionLabel:
    "BM-038 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM038_SECTIONS,
  fields: BM038_FIELDS,
  demo: BM038_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM038_RUNTIME_UX_PROFILE);
