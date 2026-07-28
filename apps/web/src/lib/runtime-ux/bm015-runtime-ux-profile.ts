/**
 * Curated runtime-ux profile for BM-015 — UI-only override metadata for the
 * standalone `/templates/BM-015` template page.
 *
 * Title: Kế hoạch trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin
 *        về tội phạm.
 *
 * Why this file exists
 * --------------------
 * Replaces the auto-generated conservative placeholders of the form
 * "Vấn đề thứ nhất (mẫu BM-015)" with real Vietnamese Kế hoạch-kiểm-sát
 * documentation language. The form has 8 sections and 28 fields — most are
 * TEXTAREA (legal-basis blocks, stats blocks, recommendations). Section
 * titles already match the compiled contract verbatim, but every field was
 * carrying the stale "(mẫu BM-015)" placeholder payload.
 *
 * This profile:
 *   - Real Vietnamese labels aligned with the locked contract.
 *   - Drops placeholder "(mẫu BM-015)" from every demo value.
 *   - Adds an `issue-place-date-line` smart control on
 *     `document.issuePlaceAndDateLine`.
 *   - Marks the legal-basis / statistics / recommendation blocks as
 *     `TEXTAREA` explicitly so the operator edits a multi-line body.
 *   - Ships a safe synthetic demo — no real PII, distinct synthetic names
 *     per role (Trưởng đoàn / Thành viên / Kiểm sát viên ký).
 *
 * Boundaries honoured
 * -------------------
 *   - No mutation of locked / compiled / normalized DOCX.
 *   - No DB row creation.
 *   - BM-015 stays out of `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
 *
 * Source of truth
 * ---------------
 * - Locked contract:
 *   `docs/audit/docx/contracts/locked/BM-015__4223b360...contract.locked.json`
 * - Compiled contract:
 *   `docs/audit/docx/compiled-v2/BM-015.compiled.json`
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM015_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description: "Cơ quan cấp trên, viện kiểm sát ban hành, số kế hoạch, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-thong-tin-ke-hoach",
    title: "2. Quyết định kèm theo kế hoạch",
    description: "Quyết định trực tiếp kiểm sát mà kế hoạch này kèm theo.",
  },
  {
    sectionId: "section-muc-ich-va-yeu-cau",
    title: "3. Mục đích và yêu cầu kiểm sát",
    description: "Các mục đích, yêu cầu cụ thể đối với cuộc kiểm sát.",
  },
  {
    sectionId: "section-noi-dung-kiem-sat",
    title: "4. Nội dung kiểm sát",
    description: "Tiếp nhận nguồn tin, đã giải quyết, khởi tố, không khởi tố, chuyển thẩm quyền, đang giải quyết, tạm đình chỉ.",
  },
  {
    sectionId: "section-anh-gia",
    title: "5. Đánh giá kết quả kiểm sát",
    description: "Ưu điểm, hạn chế, kiến nghị.",
  },
  {
    sectionId: "section-thoi-gian-va-phuong-phap",
    title: "6. Thời gian và phương pháp kiểm sát",
    description: "Thời gian, thời điểm lấy số liệu, phương pháp, yêu cầu chuẩn bị.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "7. Nơi nhận",
    description: "Nơi nhận chính, thành viên Đoàn kiểm sát và dòng lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "8. Ký ban hành",
    description: "Chế độ ký, chức danh và họ tên người ký kế hoạch.",
  },
] as const;

const BM015_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số kế hoạch",
    placeholder: "15/KH-VKSKV7",
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
  "sourceDirectInspectionPlan.attachedDecisionLine": {
    label: "Quyết định trực tiếp kiểm sát kèm theo",
    placeholder:
      "Quyết định số 14/QĐ-VKSKV7 ngày 04/7/2026 về việc trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm tại Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.attachedDecisionLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Quyết định số 14/QĐ-VKSKV7 ngày 04/7/2026 …;",
    },
  },
  "sourceDirectInspectionPlan.purposeLine1": {
    label: "Mục đích, yêu cầu thứ nhất",
    placeholder:
      "Kiểm sát việc tiếp nhận nguồn tin về tội phạm đảm bảo đúng quy định tại Điều 36 Bộ luật Tố tụng hình sự;",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.purposeLine1",
      kind: "textarea",
      rows: 3,
      placeholder: "Kiểm sát việc tiếp nhận nguồn tin về tội phạm …;",
    },
  },
  "sourceDirectInspectionPlan.purposeLine2": {
    label: "Mục đích, yêu cầu thứ hai",
    placeholder:
      "Kiểm sát việc giải quyết nguồn tin về tội phạm theo thẩm quyền, đảm bảo đúng trình tự, thời hạn luật định;",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.purposeLine2",
      kind: "textarea",
      rows: 3,
      placeholder: "Kiểm sát việc giải quyết nguồn tin …;",
    },
  },
  "sourceDirectInspectionPlan.purposeLine3": {
    label: "Mục đích, yêu cầu khác",
    placeholder:
      "Phát hiện vi phạm, kiến nghị khắc phục trong công tác tiếp nhận và giải quyết nguồn tin;",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.purposeLine3",
      kind: "textarea",
      rows: 2,
      placeholder: "Phát hiện vi phạm, kiến nghị …;",
    },
  },
  "sourceDirectInspectionPlan.receivedStatsBlock": {
    label: "Kết quả tiếp nhận nguồn tin",
    placeholder:
      "Đã tiếp nhận tổng số 154 nguồn tin, trong đó tin về tội phạm: 112; tin về vi phạm hành chính: 32; kiến nghị xử lý khác: 10.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.receivedStatsBlock",
      kind: "textarea",
      rows: 3,
      placeholder: "Tổng số … nguồn tin, trong đó …;",
    },
  },
  "sourceDirectInspectionPlan.resolvedStatsBlock": {
    label: "Số nguồn tin đã giải quyết",
    placeholder:
      "Đã giải quyết: 98 nguồn tin, trong đó khởi tố vụ án hình sự: 24; không khởi tố: 51; chuyển thẩm quyền: 18; tạm đình chỉ: 5.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.resolvedStatsBlock",
      kind: "textarea",
      rows: 3,
      placeholder: "Đã giải quyết … nguồn tin, trong đó …;",
    },
  },
  "sourceDirectInspectionPlan.prosecutionDecisionStatsLine": {
    label: "Quyết định khởi tố",
    placeholder: "Khởi tố 24 vụ án hình sự; đã phê chuẩn 24 quyết định khởi tố bị can.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.prosecutionDecisionStatsLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Khởi tố … vụ án hình sự;",
    },
  },
  "sourceDirectInspectionPlan.nonProsecutionDecisionStatsLine": {
    label: "Quyết định không khởi tố",
    placeholder: "Không khởi tố 51 vụ việc do không cấu thành tội phạm hoặc hết thời hiệu truy cứu trách nhiệm hình sự.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.nonProsecutionDecisionStatsLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Không khởi tố … vụ việc do không cấu thành tội phạm;",
    },
  },
  "sourceDirectInspectionPlan.transferredStatsLine": {
    label: "Chuyển giải quyết theo thẩm quyền",
    placeholder: "Chuyển 18 vụ việc cho Cơ quan Cảnh sát điều tra hoặc cơ quan có thẩm quyền giải quyết.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.transferredStatsLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Chuyển … vụ việc cho cơ quan có thẩm quyền;",
    },
  },
  "sourceDirectInspectionPlan.pendingStatsLine": {
    label: "Nguồn tin đang giải quyết",
    placeholder: "Đang giải quyết: 41 nguồn tin; trong đó chưa hết thời hạn theo luật định: 38; quá hạn: 3.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.pendingStatsLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Đang giải quyết … nguồn tin;",
    },
  },
  "sourceDirectInspectionPlan.suspendedStatsLine": {
    label: "Nguồn tin tạm đình chỉ",
    placeholder: "Tạm đình chỉ giải quyết: 5 nguồn tin do chờ kết quả giám định bổ sung.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.suspendedStatsLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Tạm đình chỉ … nguồn tin;",
    },
  },
  "sourceDirectInspectionPlan.advantagesLine": {
    label: "Ưu điểm",
    placeholder:
      "Cơ quan Cảnh sát điều tra đã tiếp nhận và phân loại nguồn tin đúng thời hạn; hồ sơ lưu trữ đầy đủ theo quy định.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.advantagesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Cơ quan điều tra đã tiếp nhận đúng thời hạn …;",
    },
  },
  "sourceDirectInspectionPlan.limitationsLine": {
    label: "Hạn chế, tồn tại và nguyên nhân",
    placeholder:
      "Có 3 nguồn tin quá hạn giải quyết do chờ kết quả xác minh từ cơ quan chuyên môn; nguyên nhân: phối hợp giữa các đơn vị chưa chặt chẽ.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.limitationsLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Có … nguồn tin quá hạn do …;",
    },
  },
  "sourceDirectInspectionPlan.recommendationsLine": {
    label: "Kiến nghị, đề xuất",
    placeholder:
      "Kiến nghị Cơ quan Cảnh sát điều tra tăng cường phối hợp giữa các đội nghiệp vụ; rà soát lại thời hạn giải quyết nguồn tin.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.recommendationsLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Kiến nghị tăng cường phối hợp …;",
    },
  },
  "sourceDirectInspectionPlan.inspectionTimeLine": {
    label: "Thời gian kiểm sát",
    placeholder: "Từ ngày 14/7/2026 đến ngày 16/7/2026 (03 ngày làm việc)",
  },
  "sourceDirectInspectionPlan.dataPeriodLine": {
    label: "Thời điểm lấy số liệu",
    placeholder: "Tính đến ngày 10/7/2026",
  },
  "sourceDirectInspectionPlan.methodsBlock": {
    label: "Phương pháp kiểm sát",
    placeholder:
      "Trực tiếp xem xét sổ sách, hồ sơ tiếp nhận nguồn tin; nghe báo cáo; kiểm tra thực tế việc giải quyết nguồn tin tại cơ quan điều tra.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.methodsBlock",
      kind: "textarea",
      rows: 3,
      placeholder: "Trực tiếp xem xét …; nghe báo cáo;",
    },
  },
  "sourceDirectInspectionPlan.requestPreparationLine": {
    label: "Yêu cầu chuẩn bị",
    placeholder:
      "Cơ quan Cảnh sát điều tra chuẩn bị hồ sơ tiếp nhận, giải quyết nguồn tin từ ngày 01/01/2026 đến 30/6/2026; sắp xếp buổi làm việc với Đoàn kiểm sát.",
    control: "TEXTAREA",
    smart: {
      key: "sourceDirectInspectionPlan.requestPreparationLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Cơ quan điều tra chuẩn bị hồ sơ …;",
    },
  },
  "recipients.primaryLine": {
    label: "Nơi nhận chính",
    placeholder: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  },
  "recipients.teamMembersLine": {
    label: "Thành viên Đoàn kiểm sát",
    placeholder:
      "Ông Trần Văn Hùng — Trưởng đoàn; ông Lê Minh Quân; bà Ngô Thị Lan; ông Phạm Đức Anh;",
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
    label: "Chức danh người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Trần Văn Hùng",
  },
} as const;

/**
 * BM-015 demo fixture — synthetic but realistic values for a Vietnamese
 * Kế hoạch trực tiếp kiểm sát. No real PII; no stale tokens. Distinct
 * synthetic names per role: Trưởng đoàn (`Trần Văn Hùng`), Thành viên
 * (`Lê Minh Quân`, `Ngô Thị Lan`, `Phạm Đức Anh`), and the Kiểm sát viên
 * ký (also `Trần Văn Hùng`, since BM-014/015's signer is the Trưởng đoàn).
 */
const BM015_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "15/KH-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "sourceDirectInspectionPlan.attachedDecisionLine":
    "Quyết định số 14/QĐ-VKSKV7 ngày 04/7/2026 của Viện Kiểm sát nhân dân Khu vực 7 về việc trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm tại Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "sourceDirectInspectionPlan.purposeLine1":
    "Kiểm sát việc tiếp nhận nguồn tin về tội phạm đảm bảo đúng quy định tại Điều 36 Bộ luật Tố tụng hình sự;",
  "sourceDirectInspectionPlan.purposeLine2":
    "Kiểm sát việc giải quyết nguồn tin về tội phạm theo thẩm quyền, đảm bảo đúng trình tự, thời hạn luật định;",
  "sourceDirectInspectionPlan.purposeLine3":
    "Phát hiện vi phạm, kiến nghị khắc phục trong công tác tiếp nhận và giải quyết nguồn tin;",
  "sourceDirectInspectionPlan.receivedStatsBlock":
    "Trong kỳ tiếp nhận từ 01/01/2026 đến 30/6/2026, Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tiếp nhận tổng số 154 nguồn tin, trong đó: tin về tội phạm: 112; tin về vi phạm hành chính: 32; kiến nghị xử lý khác: 10.",
  "sourceDirectInspectionPlan.resolvedStatsBlock":
    "Đã giải quyết: 98 nguồn tin, trong đó khởi tố vụ án hình sự: 24; không khởi tố: 51; chuyển thẩm quyền: 18; tạm đình chỉ: 5.",
  "sourceDirectInspectionPlan.prosecutionDecisionStatsLine":
    "Khởi tố 24 vụ án hình sự; đã phê chuẩn 24 quyết định khởi tố bị can.",
  "sourceDirectInspectionPlan.nonProsecutionDecisionStatsLine":
    "Không khởi tố 51 vụ việc do không cấu thành tội phạm hoặc hết thời hiệu truy cứu trách nhiệm hình sự.",
  "sourceDirectInspectionPlan.transferredStatsLine":
    "Chuyển 18 vụ việc cho Cơ quan Cảnh sát điều tra có thẩm quyền hoặc cơ quan liên quan giải quyết.",
  "sourceDirectInspectionPlan.pendingStatsLine":
    "Đang giải quyết: 41 nguồn tin; trong đó chưa hết thời hạn theo luật định: 38; quá hạn: 3.",
  "sourceDirectInspectionPlan.suspendedStatsLine":
    "Tạm đình chỉ giải quyết: 5 nguồn tin do chờ kết quả giám định bổ sung.",
  "sourceDirectInspectionPlan.advantagesLine":
    "Cơ quan Cảnh sát điều tra đã tiếp nhận và phân loại nguồn tin đúng thời hạn quy định; hồ sơ lưu trữ đầy đủ theo quy định tại Điều 36 Bộ luật Tố tụng hình sự.",
  "sourceDirectInspectionPlan.limitationsLine":
    "Có 3 nguồn tin quá hạn giải quyết do chờ kết quả xác minh từ cơ quan chuyên môn; nguyên nhân chính: phối hợp giữa các đội nghiệp vụ chưa chặt chẽ.",
  "sourceDirectInspectionPlan.recommendationsLine":
    "Kiến nghị Cơ quan Cảnh sát điều tra tăng cường phối hợp giữa các đội nghiệp vụ; rà soát lại thời hạn giải quyết nguồn tin; đẩy nhanh giám định các trường hợp đang tạm đình chỉ.",
  "sourceDirectInspectionPlan.inspectionTimeLine":
    "Từ ngày 14/7/2026 đến ngày 16/7/2026 (03 ngày làm việc).",
  "sourceDirectInspectionPlan.dataPeriodLine":
    "Tính đến ngày 30/6/2026.",
  "sourceDirectInspectionPlan.methodsBlock":
    "Trực tiếp xem xét sổ sách, hồ sơ tiếp nhận nguồn tin tại Cơ quan Cảnh sát điều tra; nghe báo cáo của Đội trưởng các đội nghiệp vụ; kiểm tra thực tế một số hồ sơ giải quyết nguồn tin.",
  "sourceDirectInspectionPlan.requestPreparationLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh chuẩn bị hồ sơ tiếp nhận, giải quyết nguồn tin trong kỳ 01/01/2026 — 30/6/2026; sắp xếp buổi làm việc với Đoàn kiểm sát vào ngày 14/7/2026.",
  "recipients.primaryLine": "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh;",
  "recipients.teamMembersLine":
    "Ông Trần Văn Hùng — Trưởng đoàn; ông Lê Minh Quân; bà Ngô Thị Lan; ông Phạm Đức Anh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Trần Văn Hùng",
} as const;

const BM015_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-015",
  versionLabel:
    "BM-015 curated batch (issue-place-date-line + textarea smarts, no stale tokens)",
  sections: BM015_SECTIONS,
  fields: BM015_FIELDS,
  demo: BM015_DEMO,
};

registerRuntimeUxProfile(BM015_RUNTIME_UX_PROFILE);
