/**
 * BM-210 runtime-ux semantic frontier batch curated profile.
 *
 * Curated for: BM-206→BM-211 semantic frontier closure execution.
 * Locked contract: BM-210.compiled.json (12 fields, 1 section).
 * Canonical extract: BM-210__7266a312afb8.extract.md
 *
 * Form title: Quyết định thay đổi người đại diện
 * (change of representative/supervisor in the BM-209 supervision measure;
 *  distinct from BM-209 which is the original supervision decision;
 *  distinct from BM-206/207/208 which concern electronic monitoring)
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

const BM210_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Quyết định thay đổi người đại diện giám sát người chưa thành niên — căn cứ Điều 140 Luật Tư pháp NCTN và Điều 41, 165, 168 Bộ luật Tố tụng hình sự. Thay thế người đại diện giám sát cũ bằng người mới; gồm hai điều: Điều 1 giao cho người đại diện mới; Điều 2 quy định nghĩa vụ giám sát.",
  }
] as const;

/**
 * All 12 compiled fields in compiled order.
 *
 * BM-210 has 12 fields: agency.name + recipients.personLine +
 * recipients.personLine2→11.
 * (no document.fullDocumentCode; no personLine12+;
 *  distinct from BM-209 which has document.fullDocumentCode)
 *
 * Source-grounded label derivation:
 *  - agency.name → P0001-P0002: "Viện Kiểm sát" banner
 *  - recipients.personLine → P0082: sole recipient "- 11" footnote
 *  - recipients.personLine2→11 → sequential recipient lines under "Nơi nhận:"
 *    with no individual named roles; compatibility-mapped by ordinal position
 */
const BM210_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "recipients.personLine": {
    label: "Người nhận quyết định (dòng 1)",
    placeholder: "Người đại diện giám sát mới Trần Văn Đức",
  },
  "recipients.personLine11": {
    label: "Người nhận khác — dòng 11",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
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
  "recipients.personLine5": {
    label: "Người nhận khác — dòng 5",
    placeholder: "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  },
  "recipients.personLine4": {
    label: "Người nhận khác — dòng 4",
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
} as const;

const BM210_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Người đại diện giám sát mới Trần Văn Đức",
  "recipients.personLine11": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine10": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine9": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine8": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine7": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine6": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine5": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine4": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine3": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine2": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
} as const;

const BM210_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-210",
  versionLabel:
    "BM-210 semantic frontier batch — representative change decision; 12/12 fields curated",
  sections: BM210_SECTIONS,
  fields: BM210_FIELDS,
  demo: BM210_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM210_RUNTIME_UX_PROFILE);
