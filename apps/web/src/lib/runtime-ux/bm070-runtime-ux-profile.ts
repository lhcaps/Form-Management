/**
 * Curated runtime-ux profile for BM-070 — UI-only override metadata for the
 * standalone `/templates/BM-070` template page.
 *
 * Title: QĐ phân công PVT THQCT, KS việc giải quyết VAHS
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM070_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Bộ luật Tố tụng hình sự; căn cứ quyết định truy tố.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "3. Nơi nhận",
    description:
      "Cơ quan điều tra, người được phân công, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "4. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM070_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN QUẬN 1",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "72/QĐ-VKS-PC",
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
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện Kiểm sát nhân dân Quận 1;",
  },
  "legalBasis.assignmentProcedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 36, Điều 41 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.assignmentProcedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 36, Điều 41 BLTTHS năm 2015;",
    },
  },
  "caseDecision.caseProsecutionDecisionLine": {
    label: "Căn cứ quyết định truy tố",
    placeholder:
      "Căn cứ Quyết định truy tố số 45/QĐ-TT ngày 12/5/2026;",
    control: "TEXTAREA",
    smart: {
      key: "caseDecision.caseProsecutionDecisionLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ truy tố số …/QĐ-TT ngày …;",
    },
  },
  "assignment.deputyChiefName": {
    label: "Họ tên Phó Viện trưởng được phân công",
    placeholder: "Lê Thanh Tú",
  },
  "assignment.deputyChiefTitle": {
    label: "Chức vụ",
    placeholder: "Phó Viện trưởng",
  },
  "assignment.deputyChiefAgencyName": {
    label: "Cơ quan của Phó Viện trưởng",
    placeholder: "Viện Kiểm sát nhân dân Quận 1 — TP. Hồ Chí Minh",
  },
  "assignment.responsibilityLine": {
    label: "Nhiệm vụ được phân công",
    placeholder:
      "Trực tiếp phụ trách, xét xử và kiểm sát điều tra tại phiên toà giải quyết vụ án hình sự số 45/QĐ-TT;",
    control: "TEXTAREA",
    smart: {
      key: "assignment.responsibilityLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Trực tiếp phụ trách VAHS số …/QĐ-TT;",
    },
  },
  "recipients.investigationAuthorityLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận 1;",
  },
  "recipients.assignedPersonLine": {
    label: "Nơi nhận — Người được phân công",
    placeholder: "Ông Lê Thanh Tú;",
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
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Quận 1",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Phạm Đức Tài",
  },
} as const;

const BM070_DEMO_RUNTIME_UX = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name":
    "VIỆN KIỂM SÁT NHÂN DÂN QUẬN 1",
  "document.documentCode": "72/QĐ-VKS-PC",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle": "Viện Kiểm sát nhân dân Quận 1;",
  "legalBasis.assignmentProcedureArticlesLine":
    "Căn cứ Điều 36, Điều 41 Bộ luật Tố tụng hình sự năm 2015;",
  "caseDecision.caseProsecutionDecisionLine":
    "Căn cứ Quyết định truy tố số 45/QĐ-TT ngày 12/5/2026;",
  "assignment.deputyChiefName": "Lê Thanh Tú",
  "assignment.deputyChiefTitle": "Phó Viện trưởng",
  "assignment.deputyChiefAgencyName":
    "Viện Kiểm sát nhân dân Quận 1 — TP. Hồ Chí Minh",
  "assignment.responsibilityLine":
    "Trực tiếp phụ trách, kiểm sát điều tra và xét xử vụ án hình sự số 45/QĐ-TT tại phiên toà;",
  "recipients.investigationAuthorityLine":
    "Cơ quan Cảnh sát điều tra Công an Quận 1;",
  "recipients.assignedPersonLine": "Ông Lê Thanh Tú;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Quận 1",
  "signature.signerName": "Phạm Đức Tài",
} as const;

const BM070_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-070",
  versionLabel:
    "BM-070 curated batch (issue-place-date-line + textarea, no stale tokens)",
  sections: BM070_SECTIONS,
  fields: BM070_FIELDS,
  demo: BM070_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM070_RUNTIME_UX_PROFILE);
