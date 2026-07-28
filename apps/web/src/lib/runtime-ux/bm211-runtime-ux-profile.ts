/**
 * BM-211 runtime-ux semantic frontier batch curated profile.
 *
 * Curated for: BM-206→BM-211 semantic frontier closure execution.
 * Locked contract: BM-211.compiled.json (21 fields, 1 section).
 * Canonical extract: BM-211__ff91d4c3b4e0.extract.md
 *
 * Form title: Thông báo về việc thụ lý vụ án
 * (notice of case acceptance — NOT electronic monitoring or representative supervision;
 *  separate subfamily: procedural notice for juvenile representative/guardian/child-witness)
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or the extract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM211_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông báo về việc thụ lý vụ án đối với người chưa thành niên — căn cứ Điều 131 Luật Tư pháp NCTN. Dùng trong trường hợp thông báo cho người đại diện/người bảo vệ quyền và lợi ích hợp pháp của người chưa thành niên là bị hại hoặc người đại diện của người chưa thành niên là người làm chứng biết về việc thụ lý vụ án.",
  }
] as const;

/**
 * All 21 compiled fields in compiled order.
 *
 * BM-211 has 21 fields: agency.name + recipients.personLine +
 * recipients.personLine2→16 + case.caseNumber + case.caseNumber2 +
 * document.fullDocumentCode + document.issueDate.
 *
 * Source-grounded label derivation:
 *  - agency.name → P0001-P0002: "Viện Kiểm sát" banner
 *  - recipients.personLine → P0051: sole named addressee
 *    "Ghi họ tên người được thông báo" (P0051)
 *  - recipients.personLine2→16 → sequential recipient lines under "Nơi nhận:"
 *    with no individual named roles; compatibility-mapped by ordinal position
 *  - document.fullDocumentCode → P0006-P0007: "Số:" slot (/TB-VKS convention)
 *  - document.issueDate → P0008-P0010: date slot
 *  - case.caseNumber → P0070-P0075: case number slot
 *  - case.caseNumber2 → P0070-P0075: case number continuation
 */
const BM211_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "recipients.personLine": {
    label: "Người được thông báo (dòng 1)",
    placeholder: "Người đại diện Nguyễn Thị Lan",
  },
  "recipients.personLine5": {
    label: "Người nhận khác — dòng 5",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine4": {
    label: "Người nhận khác — dòng 4",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine16": {
    label: "Người nhận khác — dòng 16",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine3": {
    label: "Người nhận khác — dòng 3",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine2": {
    label: "Người nhận khác — dòng 2",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine15": {
    label: "Người nhận khác — dòng 15",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "15 tháng 06 năm 2026",
  },
  "case.caseNumber2": {
    label: "Số vụ án (dòng 2)",
    placeholder: "QĐ-VKS-2026/123456",
  },
  "case.caseNumber": {
    label: "Số vụ án",
    placeholder: "QĐ-VKS-2026/123456",
  },
  "recipients.personLine14": {
    label: "Người nhận khác — dòng 14",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine13": {
    label: "Người nhận khác — dòng 13",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine12": {
    label: "Người nhận khác — dòng 12",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine11": {
    label: "Người nhận khác — dòng 11",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine10": {
    label: "Người nhận khác — dòng 10",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine9": {
    label: "Người nhận khác — dòng 9",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine8": {
    label: "Người nhận khác — dòng 8",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine7": {
    label: "Người nhận khác — dòng 7",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine6": {
    label: "Người nhận khác — dòng 6",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "document.fullDocumentCode": {
    label: "Số thông báo",
    placeholder: "25/TB-VKS",
  },
} as const;

const BM211_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Người đại diện Nguyễn Thị Lan",
  "recipients.personLine5": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine4": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine16": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine3": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine2": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine15": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "document.issueDate": "15 tháng 06 năm 2026",
  "case.caseNumber2": "QĐ-VKS-2026/123456",
  "case.caseNumber": "QĐ-VKS-2026/123456",
  "recipients.personLine14": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine13": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine12": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine11": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine10": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine9": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine8": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine7": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine6": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "document.fullDocumentCode": "25/TB-VKS",
} as const;

const BM211_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-211",
  versionLabel:
    "BM-211 semantic frontier batch — case-acceptance notice; 21/21 fields curated",
  sections: BM211_SECTIONS,
  fields: BM211_FIELDS,
  demo: BM211_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM211_RUNTIME_UX_PROFILE);
