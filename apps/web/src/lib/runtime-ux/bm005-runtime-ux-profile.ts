/**
 * Curated runtime-ux profile for BM-005 — UI-only override metadata for the
 * standalone `/templates/BM-005` template page.
 *
 * Title: Yêu cầu kiểm tra, xác minh nguồn tin về tội phạm.
 *
 * Why this file exists
 * --------------------
 * The auto-generated baseline (`scripts/audit/generate-runtime-ux-profiles.mjs`)
 * emitted conservative labels of the form "Cơ quan cấp trên (mẫu BM-005)"
 * which (a) leak the "(mẫu BM-005)" stale token into placeholders that
 * will travel into the runtime preview, and (b) provide no real legal-doc
 * context for the operator.
 *
 * This curated profile:
 *   - locks real Vietnamese labels aligned with the BM-005 locked contract,
 *   - marks the long legal-basis / issue content fields as `TEXTAREA`,
 *   - adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine` so the operator picks a real date,
 *   - ships a safe synthetic demo (no real PII, no stale tokens, distinct
 *     names per role).
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation, no `generatedDocumentId` fabrication.
 *   - No modification of `FormFlight` allowlist — BM-005 stays out of
 *     `RUNTIME_READY_FORM_FLIGHT_PROFILES` (the curator's job is UI
 *     labels + demo only; the runtime-ready promotion is a separate gate).
 *
 * Source of truth
 * ---------------
 * - Locked contract:
 *   `docs/audit/docx/contracts/locked/BM-005__efef99ad...contract.locked.json`
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-005.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM005_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số yêu cầu, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-noi-dung-yeu-cau-kiem-tra-xac-minh",
    title: "2. Nội dung yêu cầu kiểm tra, xác minh",
    description:
      "Căn cứ tố tụng, nhận định cần kiểm tra xác minh, các vấn đề cần xác minh và yêu cầu gửi kết quả.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "3. Nơi nhận",
    description: "Cơ quan điều tra nhận văn bản và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "4. Ký ban hành",
    description: "Họ tên Kiểm sát viên ký yêu cầu.",
  },
] as const;

const BM005_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số yêu cầu",
    placeholder: "42/Yc-VKSKV7",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Hồ Chí Minh",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "sourceVerification.requestRoundText": {
    label: "Lần yêu cầu",
    placeholder: "01",
  },
  "sourceVerification.procedureArticlesLine": {
    label: "Căn cứ tố tụng",
    placeholder:
      "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "sourceVerification.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
    },
  },
  "sourceVerification.reasonLine": {
    label: "Nhận định cần kiểm tra, xác minh",
    placeholder:
      "Qua xem xét nguồn tin về tội phạm do Cơ quan Cảnh sát điều tra chuyển đến, nhận thấy có một số vấn đề cần được kiểm tra, xác minh làm rõ trước khi giải quyết;",
    control: "TEXTAREA",
    smart: {
      key: "sourceVerification.reasonLine",
      kind: "textarea",
      rows: 4,
      placeholder:
        "Qua xem xét nguồn tin về tội phạm … nhận thấy có một số vấn đề cần được kiểm tra, xác minh làm rõ;",
    },
  },
  "sourceVerification.requestedAuthorityLine": {
    label: "Cơ quan hoặc người được yêu cầu",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "sourceVerification.requestedAuthorityLine",
      kind: "textarea",
      rows: 2,
      placeholder:
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    },
  },
  "sourceVerification.issue1Line": {
    label: "Vấn đề thứ nhất cần xác minh",
    placeholder:
      "Xác minh làm rõ hành vi cụ thể của các đối tượng tại hiện trường vào khoảng 21 giờ ngày 01/3/2026;",
    control: "TEXTAREA",
    smart: {
      key: "sourceVerification.issue1Line",
      kind: "textarea",
      rows: 4,
      placeholder:
        "Xác minh làm rõ hành vi cụ thể của các đối tượng …;",
    },
  },
  "sourceVerification.issue2Line": {
    label: "Vấn đề thứ hai cần xác minh",
    placeholder:
      "Xác minh nhân thân, lai lịch của các đối tượng liên quan;",
    control: "TEXTAREA",
    smart: {
      key: "sourceVerification.issue2Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Xác minh nhân thân, lai lịch …;",
    },
  },
  "sourceVerification.issue3Line": {
    label: "Vấn đề thứ ba cần xác minh",
    placeholder:
      "Xác minh các điều kiện trách nhiệm hình sự theo quy định của Bộ luật Hình sự;",
    control: "TEXTAREA",
    smart: {
      key: "sourceVerification.issue3Line",
      kind: "textarea",
      rows: 3,
      placeholder: "Xác minh các điều kiện trách nhiệm hình sự …;",
    },
  },
  "sourceVerification.additionalIssuesLine": {
    label: "Vấn đề bổ sung",
    placeholder:
      "Các vấn đề khác có liên quan phát sinh trong quá trình kiểm tra, xác minh (nếu có);",
    control: "TEXTAREA",
    smart: {
      key: "sourceVerification.additionalIssuesLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Các vấn đề khác có liên quan phát sinh trong quá trình kiểm tra, xác minh (nếu có);",
    },
  },
  "sourceVerification.resultSubmissionLine": {
    label: "Yêu cầu gửi kết quả",
    placeholder:
      "Đề nghị Cơ quan Cảnh sát điều tra gửi kết quả kiểm tra, xác minh về Viện Kiểm sát nhân dân Khu vực 7 trong thời hạn 30 ngày kể từ ngày nhận được yêu cầu;",
    control: "TEXTAREA",
    smart: {
      key: "sourceVerification.resultSubmissionLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Đề nghị Cơ quan Cảnh sát điều tra gửi kết quả … trong thời hạn 30 ngày;",
    },
  },
  "recipients.investigatingAgencyLine": {
    label: "Cơ quan điều tra nhận văn bản",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signerName": {
    label: "Kiểm sát viên ký",
    placeholder: "Trần Văn Hùng",
  },
} as const;

/**
 * BM-005 demo fixture — synthetic but realistic Vietnamese legal-document
 * values. No real PII, no stale tokens. Recognisably illustrative: the
 * signer is a placeholder-style name ("Trần Văn Hùng") distinct from
 * the legacy BM-001 fixtures.
 */
const BM005_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "42/Yc-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "sourceVerification.requestRoundText": "01",
  "sourceVerification.procedureArticlesLine":
    "Căn cứ Điều 36, Điều 105, Điều 148 Bộ luật Tố tụng hình sự năm 2015;",
  "sourceVerification.reasonLine":
    "Qua xem xét nguồn tin về tội phạm do Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh chuyển đến, nhận thấy có một số vấn đề cần được kiểm tra, xác minh làm rõ trước khi giải quyết;",
  "sourceVerification.requestedAuthorityLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "sourceVerification.issue1Line":
    "Xác minh làm rõ hành vi cụ thể của các đối tượng tại hiện trường vào khoảng 21 giờ ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, Thành phố Hồ Chí Minh;",
  "sourceVerification.issue2Line":
    "Xác minh nhân thân, lai lịch của các đối tượng liên quan và mối quan hệ giữa các đối tượng;",
  "sourceVerification.issue3Line":
    "Xác minh các điều kiện trách nhiệm hình sự theo quy định của Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017);",
  "sourceVerification.additionalIssuesLine":
    "Các vấn đề khác có liên quan phát sinh trong quá trình kiểm tra, xác minh (nếu có);",
  "sourceVerification.resultSubmissionLine":
    "Đề nghị Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh gửi kết quả kiểm tra, xác minh về Viện Kiểm sát nhân dân Khu vực 7 trong thời hạn 30 ngày kể từ ngày nhận được yêu cầu;",
  "recipients.investigatingAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM005_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-005",
  versionLabel:
    "BM-005 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM005_SECTIONS,
  fields: BM005_FIELDS,
  demo: BM005_DEMO,
};

registerRuntimeUxProfile(BM005_RUNTIME_UX_PROFILE);
