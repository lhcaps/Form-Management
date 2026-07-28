/**
 * Curated runtime-ux profile for BM-071.
 *
 * 19 fields — QĐ phân công Kiểm sát viên, Kiểm toán viên.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-071)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM071_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Viện kiểm sát cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description: "Căn cứ điều khoản Bộ luật Tố tụng hình sự, căn cứ phân công.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Vai trò được phân công, họ tên, chức danh, đơn vị, trách nhiệm thi hành.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan điều tra, người được phân công, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
] as const;

const BM071_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder:
      "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "11/QĐ-VKSKV7",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder:
      "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      derivedTargets: ["document.issuePlaceAndDateLine"],
      placeholder: "Thành phố Hồ Chí Minh",
    },
  },
  "assignment.assignedRoleText": {
    label: "Vai trò được phân công",
    placeholder: "Kiểm sát viên",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  },
  "legalBasis.staffAssignmentProcedureArticlesLine": {
    label: "Căn cứ điều khoản phân công",
    placeholder:
      "Căn cứ Điều 36 Luật Tổ chức Viện kiểm sát nhân dân năm 2014.",
    smart: {
      key: "legalBasis.staffAssignmentProcedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 36 Luật Tổ chức Viện kiểm sát nhân dân năm 2014.",
    },
  },
  "caseDecision.caseProsecutionDecisionLine": {
    label: "Căn cứ quyết định truy tố vụ án",
    placeholder:
      "Quyết định số 09/QĐ-VKSKV7 ngày 30 tháng 6 năm 2026 về việc phê chuẩn quyết định khởi tố bị can.",
    smart: {
      key: "caseDecision.caseProsecutionDecisionLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định số 09/QĐ-VKSKV7 ngày 30 tháng 6 năm 2026 về việc phê chuẩn quyết định khởi tố bị can.",
    },
  },
  "assignment.assignedOfficerName": {
    label: "Họ tên người được phân công",
    placeholder: "Trần Đình Khoa",
  },
  "assignment.assignedOfficerTitle": {
    label: "Chức danh người được phân công",
    placeholder: "Kiểm sát viên sơ cấp",
  },
  "assignment.assignedOfficerAgencyName": {
    label: "Đơn vị của người được phân công",
    placeholder: "Viện kiểm sát nhân dân Khu vực 7",
  },
  "assignment.additionalAssignedOfficersLine": {
    label: "Người được phân công thêm (nếu có)",
    placeholder: "—",
    smart: {
      key: "assignment.additionalAssignedOfficersLine",
      kind: "textarea",
      rows: 2,
      placeholder: "—",
    },
  },
  "assignment.responsibilityLine": {
    label: "Trách nhiệm thi hành",
    placeholder:
      "Thực hiện kiểm sát việc tạm giam bị can Nguyễn Văn Phong trong vụ án hình sự số 45/2026/QĐ-VKSKV7.",
    smart: {
      key: "assignment.responsibilityLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Thực hiện kiểm sát việc tạm giam bị can trong vụ án hình sự.",
    },
  },
  "recipients.investigationAuthorityLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Công an Quận 5, Thành phố Hồ Chí Minh",
  },
  "recipients.assignedPersonLine": {
    label: "Nơi nhận — Người được phân công",
    placeholder: "Kiểm sát viên Trần Đình Khoa",
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

const BM071_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "11/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "assignment.assignedRoleText": "Kiểm sát viên",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "legalBasis.staffAssignmentProcedureArticlesLine":
    "Căn cứ Điều 36 Luật Tổ chức Viện kiểm sát nhân dân năm 2014.",
  "caseDecision.caseProsecutionDecisionLine":
    "Quyết định số 09/QĐ-VKSKV7 ngày 30 tháng 6 năm 2026 về việc phê chuẩn quyết định khởi tố bị can Nguyễn Văn Phong.",
  "assignment.assignedOfficerName": "Trần Đình Khoa",
  "assignment.assignedOfficerTitle": "Kiểm sát viên sơ cấp",
  "assignment.assignedOfficerAgencyName":
    "Viện kiểm sát nhân dân Khu vực 7",
  "assignment.additionalAssignedOfficersLine": "—",
  "assignment.responsibilityLine":
    "Thực hiện kiểm sát việc tạm giam bị can Nguyễn Văn Phong trong vụ án hình sự số 45/2026/QĐ-VKSKV7.",
  "recipients.investigationAuthorityLine":
    "Công an Quận 5, Thành phố Hồ Chí Minh",
  "recipients.assignedPersonLine": "Kiểm sát viên Trần Đình Khoa",
  "recipients.archiveLine": "HSVA, HSKS, VP.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Hương",
} as const;

const BM071_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-071",
  versionLabel:
    "BM-071 curated batch 3 — smart issue-place-date-line, textarea smarts, no stale tokens",
  sections: BM071_SECTIONS,
  fields: BM071_FIELDS,
  demo: BM071_DEMO,
};

registerRuntimeUxProfile(BM071_RUNTIME_UX_PROFILE);