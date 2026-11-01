/**
 * Curated runtime-ux profile for BM-033 — UI-only override metadata for the
 * standalone `/templates/BM-033` template page.
 *
 * Title: QĐ phê chuẩn QĐ gia hạn tạm giữ.
 *
 * Why this file exists
 * --------------------
 * BM-033 has 21 fields across 5 sections. The auto-generated profile
 * shipped "(mẫu BM-033)" stale tokens into every demo value and used
 * the same `Địa điểm (mẫu BM-033), ngày ...` line for the date slot.
 * The contract supports a real `issue-place-date-line` smart control on
 * `document.issuePlaceAndDateLine` and a 5-line `custody.*` block
 * describing the prior detention decisions + approval rationale.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops the "(mẫu BM-033)" stale token from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the long legal-basis / approval rationale / Điều 1 /
 *     Điều 2 blocks as `TEXTAREA`.
 *   - Adds a select for `signature.signMode`.
 *   - Ships a safe synthetic demo.
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-033 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-033.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM033_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Cơ quan cấp trên (viết hoa), viện kiểm sát ban hành (viết hoa), số Quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-thong-tin-gia-han",
    title: "2. Thông tin gia hạn",
    description: "Lần gia hạn tạm giữ và chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-va-noi-dung-quyet-inh",
    title: "3. Căn cứ và nội dung Quyết định",
    description:
      "Căn cứ Bộ luật Tố tụng hình sự, căn cứ QĐ tạm giữ, căn cứ QĐ gia hạn trước, dòng xét hồ sơ đề nghị, lý do phê chuẩn, Điều 1 và Điều 2.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan thực hiện, người bị tạm giữ và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và người ký Quyết định.",
  },
] as const;

const BM033_FIELDS = {
  "agency.parentNameUpper": {
    label: "Cơ quan cấp trên (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.nameUpper": {
    label: "Viện kiểm sát ban hành (viết hoa)",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "document.documentCode": {
    label: "Số Quyết định",
    placeholder: "33/QĐ-VKS",
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
  "custody.extensionAttemptText": {
    label: "Lần gia hạn tạm giữ",
    placeholder: "Lần thứ nhất",
  },
  "official.issuingAuthorityLine": {
    label: "Chủ thể ban hành",
    placeholder: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    control: "TEXTAREA",
    smart: {
      key: "official.issuingAuthorityLine",
      kind: "textarea",
      rows: 2,
      placeholder: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    },
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 22, Điều 36, Điều 110, Điều 173 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 22, Điều 36, Điều 110, Điều 173 Bộ luật Tố tụng hình sự năm 2015;",
    },
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ pháp luật người chưa thành niên",
    placeholder: "Luật Trẻ em năm 2016 (nếu áp dụng).",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.juvenileJusticeLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Luật Trẻ em năm 2016 (nếu áp dụng).",
    },
  },
  "custody.detentionDecisionLine": {
    label: "Căn cứ Quyết định tạm giữ",
    placeholder: "Quyết định tạm giữ số 27/QĐ-CSĐT ngày 14/6/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "custody.detentionDecisionLine",
      kind: "textarea",
      rows: 2,
      placeholder: "QĐ tạm giữ số … ngày … của …;",
    },
  },
  "custody.previousExtensionDecisionLine": {
    label: "Căn cứ Quyết định gia hạn trước đó",
    placeholder: "Quyết định gia hạn tạm giữ lần đầu số 30/QĐ-CSĐT ngày 27/6/2026 đã được Viện Kiểm sát phê chuẩn;",
    control: "TEXTAREA",
    smart: {
      key: "custody.previousExtensionDecisionLine",
      kind: "textarea",
      rows: 2,
      placeholder: "QĐ gia hạn tạm giữ số … ngày … đã được Viện Kiểm sát phê chuẩn;",
    },
  },
  "custody.approvalProposalLine": {
    label: "Dòng xét hồ sơ đề nghị",
    placeholder:
      "Xét hồ sơ đề nghị phê chuẩn Quyết định gia hạn tạm giữ của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "custody.approvalProposalLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Xét hồ sơ đề nghị phê chuẩn QĐ gia hạn tạm giữ của …;",
    },
  },
  "custody.approvalProposalAgencyLine": {
    label: "Cơ quan đề nghị và người bị tạm giữ",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh — đối với Lê Minh Quân;",
  },
  "custody.approvalReasonLine": {
    label: "Lý do phê chuẩn",
    placeholder:
      "Đã hết thời hạn tạm giữ theo Quyết định số 30/QĐ-CSĐT ngày 27/6/2026; cần thêm thời gian để hoàn tất điều tra, xác minh các tình tiết của vụ án;",
    control: "TEXTAREA",
    smart: {
      key: "custody.approvalReasonLine",
      kind: "textarea",
      rows: 4,
      placeholder: "Đã hết thời hạn tạm giữ …, cần thêm thời gian để hoàn tất điều tra …;",
    },
  },
  "custody.approvalArticle1Line": {
    label: "Nội dung Điều 1",
    placeholder:
      "Phê chuẩn Quyết định gia hạn tạm giữ số 33/QĐ-CSĐT ngày 03/7/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Lê Minh Quân, thời hạn gia hạn 12 ngày, kể từ ngày 04/7/2026 đến ngày 15/7/2026;",
    control: "TEXTAREA",
    smart: {
      key: "custody.approvalArticle1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Phê chuẩn QĐ gia hạn tạm giữ số … ngày … đối với …, thời hạn … ngày, kể từ … đến …;",
    },
  },
  "custody.executionRequestLine": {
    label: "Nội dung Điều 2",
    placeholder:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh có trách nhiệm tổ chức thi hành Quyết định gia hạn tạm giữ; báo cáo kết quả cho Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "custody.executionRequestLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Cơ quan … có trách nhiệm tổ chức thi hành QĐ gia hạn tạm giữ; báo cáo …;",
    },
  },
  "recipients.executionAgencyLine": {
    label: "Nơi nhận - cơ quan thực hiện",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  },
  "recipients.personLine": {
    label: "Nơi nhận - người bị tạm giữ",
    placeholder: "Lê Minh Quân (để chấp hành);",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký thay",
    smart: {
      key: "signature.signMode",
      kind: "select",
      options: ["Ký", "Ký thay", "Ký thay mặt"],
    },
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Nguyễn Văn Phúc",
  },
} as const;

const BM033_DEMO = {
  "agency.parentNameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.nameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "document.documentCode": "33/QĐ-VKS",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "custody.extensionAttemptText": "Lần thứ nhất",
  "official.issuingAuthorityLine":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 22, Điều 36, Điều 110, Điều 173 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileJusticeLine":
    "Luật Trẻ em năm 2016 (nếu áp dụng).",
  "custody.detentionDecisionLine":
    "Quyết định tạm giữ số 27/QĐ-CSĐT ngày 14/6/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "custody.previousExtensionDecisionLine":
    "Quyết định gia hạn tạm giữ lần đầu số 30/QĐ-CSĐT ngày 27/6/2026 đã được Viện Kiểm sát phê chuẩn;",
  "custody.approvalProposalLine":
    "Xét hồ sơ đề nghị phê chuẩn Quyết định gia hạn tạm giữ của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "custody.approvalProposalAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh — đối với Lê Minh Quân;",
  "custody.approvalReasonLine":
    "Đã hết thời hạn tạm giữ theo Quyết định số 30/QĐ-CSĐT ngày 27/6/2026; cần thêm thời gian để hoàn tất điều tra, xác minh các tình tiết của vụ án;",
  "custody.approvalArticle1Line":
    "Phê chuẩn Quyết định gia hạn tạm giữ số 33/QĐ-CSĐT ngày 03/7/2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Lê Minh Quân, thời hạn gia hạn 12 ngày, kể từ ngày 04/7/2026 đến ngày 15/7/2026;",
  "custody.executionRequestLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh có trách nhiệm tổ chức thi hành Quyết định gia hạn tạm giữ; báo cáo kết quả cho Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh;",
  "recipients.executionAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.personLine": "Lê Minh Quân (để chấp hành);",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Nguyễn Văn Phúc",
} as const;

const BM033_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-033",
  versionLabel:
    "BM-033 curated batch (issue-place-date-line + select + textarea smarts, no stale tokens)",
  sections: BM033_SECTIONS,
  fields: BM033_FIELDS,
  demo: BM033_DEMO,
};

registerRuntimeUxProfile(BM033_RUNTIME_UX_PROFILE);