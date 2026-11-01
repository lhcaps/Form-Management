/**
 * BM-209 runtime-ux semantic frontier batch curated profile.
 *
 * Curated for: BM-206→BM-211 semantic frontier closure execution.
 * Locked contract: BM-209.compiled.json (14 fields, 1 section).
 * Canonical extract: BM-209__2547ef797798.extract.md
 *
 * Form title: Quyết định áp dụng biện pháp giám sát bởi người đại diện
 * (supervision by representative rather than electronic monitoring;
 *  distinct from BM-206/BM-207/BM-208 which all concern electronic monitoring)
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

const BM209_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Quyết định áp dụng biện pháp giám sát bởi người đại diện đối với bị can người chưa thành niên — căn cứ Điều 140 Luật Tư pháp NCTN và Điều 41, 165, 168 Bộ luật Tố tụng hình sự. Gồm hai điều: Điều 1 áp dụng biện pháp giám sát bởi người đại diện đối với bị can; Điều 2 giao cho người đại diện thực hiện giám sát.",
  }
] as const;

/**
 * All 14 compiled fields in compiled order.
 *
 * BM-209 has 14 fields: agency.name + recipients.personLine +
 * recipients.personLine2→12 + document.fullDocumentCode.
 * (no personLine13 or personLine14; distinct from BM-206/207/208)
 *
 * Source-grounded label derivation:
 *  - agency.name → P0001-P0002: "Viện Kiểm sát" banner
 *  - recipients.personLine → P0081: sole recipient "- 10" footnote
 *  - recipients.personLine2→12 → sequential recipient lines under "Nơi nhận:"
 *    with no individual named roles; compatibility-mapped by ordinal position
 *  - document.fullDocumentCode → P0006-P0007: "Số:" slot
 */
const BM209_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "recipients.personLine": {
    label: "Người nhận quyết định (dòng 1)",
    placeholder: "Người đại diện giám sát Nguyễn Thị Lan",
  },
  "recipients.personLine12": {
    label: "Người nhận khác — dòng 12",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "129/QĐ-VKS",
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

const BM209_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Người đại diện giám sát Nguyễn Thị Lan",
  "recipients.personLine12": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "document.fullDocumentCode": "129/QĐ-VKS",
  "recipients.personLine11": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
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

const BM209_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-209",
  versionLabel:
    "BM-209 semantic frontier batch — representative-supervision decision; 14/14 fields curated",
  sections: BM209_SECTIONS,
  fields: BM209_FIELDS,
  demo: BM209_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM209_RUNTIME_UX_PROFILE);
