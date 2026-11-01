/**
 * Curated runtime-ux profile for BM-042 — UI-only override metadata for the
 * standalone `/templates/BM-042` template page.
 *
 * Title: QĐ gia hạn tạm giam
 *
 * Why this file exists
 * --------------------
 * Curates the 5-section decision layout (cơ quan — căn cứ — nội dung —
 * nơi nhận — chữ ký) for a detention-extension decision. Removes
 * "(mẫu BM-042)" stale tokens, adds `issue-place-date-line` smart
 * for the issue-date line and `textarea` smarts for the long
 * legal-basis / decision-body fields.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation, no `generatedDocumentId` fabrication.
 *   - No modification of `FormFlight` allowlist — BM-042 stays out of
 *     `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Locked contract:
 *   `docs/audit/docx/contracts/locked/BM-042__*.contract.locked.json`
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-042.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM042_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, lần gia hạn, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Bộ luật Tố tụng hình sự, Luật xử lý vi phạm hành chính, lệnh tạm giam, quyết định gia hạn trước, đề nghị gia hạn.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Lý do gia hạn, Điều 1 — nội dung quyết định, Điều 2 — thời hạn, Điều 3 — yêu cầu.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description:
      "Viện kiểm sát cấp trên, cơ quan điều tra, bị can, cơ sở giam giữ và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM042_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HẢI PHÒNG",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN QUẬN HỒNG BÀNG",
  },
  "document.documentCodeLine": {
    label: "Số quyết định",
    placeholder: "62/QĐ-VKSTG",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hải Phòng, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Hải Phòng",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "measure.extensionRoundText": {
    label: "Lần gia hạn",
    placeholder: "Lần thứ nhất",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện Kiểm sát nhân dân Quận Hồng Bàng;",
  },
  "legalBasis.baseProcedureLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 109, Điều 115 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.baseProcedureLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 109, Điều 115 BLTTHS năm 2015;",
    },
  },
  "legalBasis.juvenileLegalBasisLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính",
    placeholder: "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.juvenileLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Điều 18 Luật XLVPHC năm 2012;",
    },
  },
  "measure.detentionOrderLegalBasisLine": {
    label: "Căn cứ Lệnh tạm giam",
    placeholder:
      "Căn cứ Lệnh tạm giam số 25/TTG-PC03 ngày 02/4/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "measure.detentionOrderLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Lệnh tạm giam số …/TTG-PC03 ngày …;",
    },
  },
  "measure.previousExtensionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định gia hạn trước",
    placeholder:
      "Căn cứ Quyết định gia hạn tạm giam lần thứ nhất số 41/QĐ-VKSTG ngày 02/5/2026;",
    control: "TEXTAREA",
    smart: {
      key: "measure.previousExtensionDecisionLegalBasisLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ gia hạn tạm giam (lần trước) số …/QĐ-VKSTG ngày …;",
    },
  },
  "legalBasis.requestExtensionLine": {
    label: "Căn cứ đề nghị gia hạn",
    placeholder:
      "Căn cứ Đơn đề nghị gia hạn tạm giam số 49/TTr-PC03 ngày 30/6/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.requestExtensionLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Đơn đề nghị gia hạn số …/TTr-PC03 ngày …;",
    },
  },
  "measure.reasonLine": {
    label: "Lý do gia hạn",
    placeholder:
      "Xét thấy: thời hạn tạm giam đã hết, hành vi phạm tội của bị can đặc biệt nghiêm trọng; việc xác minh tài liệu, đấu tranh phục vụ điều tra chưa hoàn tất; có căn cứ để gia hạn;",
    control: "TEXTAREA",
    smart: {
      key: "measure.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Thời hạn tạm giam hết; việc điều tra chưa hoàn tất;",
    },
  },
  "measure.article1Line": {
    label: "Điều 1 — Nội dung quyết định",
    placeholder:
      "Quyết định gia hạn tạm giam lần thứ nhất đối với bị can Đặng Văn Lâm; thời hạn gia hạn: 02 tháng;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Quyết định gia hạn tạm giam lần thứ nhất …;",
    },
  },
  "measure.article2Line": {
    label: "Điều 2 — Thời hạn",
    placeholder:
      "Thời hạn gia hạn tạm giam: 02 tháng, kể từ ngày Lệnh tạm giam hết thời hạn;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article2Line",
      kind: "textarea",
      rows: 2,
      placeholder: "Thời hạn gia hạn: 02 tháng, từ ngày …;",
    },
  },
  "measure.article3Line": {
    label: "Điều 3 — Yêu cầu",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra tổ chức thi hành Quyết định gia hạn tạm giam theo quy định pháp luật;",
    control: "TEXTAREA",
    smart: {
      key: "measure.article3Line",
      kind: "textarea",
      rows: 2,
      placeholder: "Yêu cầu CQCSĐT tổ chức thi hành;",
    },
  },
  "recipients.superiorProcuracyLine": {
    label: "Nơi nhận — Viện kiểm sát cấp trên",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hải Phòng;",
  },
  "recipients.investigationUnitLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận Hồng Bàng;",
  },
  "recipients.personLine": {
    label: "Nơi nhận — Bị can",
    placeholder: "Bị can Đặng Văn Lâm;",
  },
  "recipients.detentionFacilityLine": {
    label: "Nơi nhận — Cơ sở giam giữ",
    placeholder: "Nhà tạm giữ Công an TP. Hải Phòng;",
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
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Quận Hồng Bàng",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Trần Quốc Bảo",
  },
} as const;

const BM042_DEMO_RUNTIME_UX = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HẢI PHÒNG",
  "agency.name":
    "VIỆN KIỂM SÁT NHÂN DÂN QUẬN HỒNG BÀNG",
  "document.documentCodeLine": "62/QĐ-VKSTG",
  "document.issuePlaceAndDateLine":
    "Hải Phòng, ngày 04 tháng 7 năm 2026",
  "measure.extensionRoundText": "Lần thứ nhất",
  "official.issuerTitle": "Viện Kiểm sát nhân dân Quận Hồng Bàng;",
  "legalBasis.baseProcedureLine":
    "Căn cứ Điều 109, Điều 115 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileLegalBasisLine":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "measure.detentionOrderLegalBasisLine":
    "Căn cứ Lệnh tạm giam số 25/TTG-PC03 ngày 02/4/2026 của Cơ quan Cảnh sát điều tra;",
  "measure.previousExtensionDecisionLegalBasisLine":
    "Căn cứ Quyết định gia hạn tạm giam lần thứ nhất số 41/QĐ-VKSTG ngày 02/5/2026;",
  "legalBasis.requestExtensionLine":
    "Căn cứ Đơn đề nghị gia hạn tạm giam số 49/TTr-PC03 ngày 30/6/2026 của Cơ quan Cảnh sát điều tra Công an Quận Hồng Bàng;",
  "measure.reasonLine":
    "Xét thấy: thời hạn tạm giam đã hết; hành vi phạm tội của bị can đặc biệt nghiêm trọng; việc xác minh tài liệu, đấu tranh phục vụ điều tra chưa hoàn tất; có căn cứ để gia hạn theo quy định;",
  "measure.article1Line":
    "Quyết định gia hạn tạm giam lần thứ nhất đối với bị can Đặng Văn Lâm; thời hạn gia hạn: 02 tháng;",
  "measure.article2Line":
    "Thời hạn gia hạn tạm giam: 02 tháng, kể từ ngày Lệnh tạm giam hết thời hạn;",
  "measure.article3Line":
    "Yêu cầu Cơ quan Cảnh sát điều tra Công an Quận Hồng Bàng tổ chức thi hành Quyết định gia hạn tạm giam theo quy định pháp luật;",
  "recipients.superiorProcuracyLine":
    "Viện Kiểm sát nhân dân Thành phố Hải Phòng;",
  "recipients.investigationUnitLine":
    "Cơ quan Cảnh sát điều tra Công an Quận Hồng Bàng;",
  "recipients.personLine": "Bị can Đặng Văn Lâm;",
  "recipients.detentionFacilityLine":
    "Nhà tạm giữ Công an TP. Hải Phòng;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Quận Hồng Bàng",
  "signature.signerName": "Trần Quốc Bảo",
} as const;

const BM042_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-042",
  versionLabel:
    "BM-042 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM042_SECTIONS,
  fields: BM042_FIELDS,
  demo: BM042_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM042_RUNTIME_UX_PROFILE);
