/**
 * BM-206 runtime-ux semantic frontier batch curated profile.
 *
 * Curated for: BM-206→BM-211 semantic frontier closure execution.
 * Locked contract: BM-206.compiled.json (15 fields, 1 section).
 * Canonical extract: BM-206__83dd8f078d92.extract.md
 *
 * Form title: Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN - Copy
 * (the literal "- Copy" suffix appears in BOTH the source file name AND the
 *  detected title of the canonical extract; classified as SOURCE_LITERAL_COPY_TITLE;
 *  locked contract and extract are not modified; presentation preserves the
 *  source-literal title without normalizing or dropping the suffix)
 *
 * Copy-suffix verdict: SOURCE_LITERAL_COPY_TITLE
 *  - compiled title literal: "Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN - Copy"
 *  - extract detectedTitle: "Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN - Copy"
 *  - source file: "206-Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN - Copy.doc"
 *  - display title decision: preserve literal source/complied title verbatim;
 *    SOURCE_LITERAL_COPY_TITLE classification is recorded in profile docblock and
 *    provenance row; no removal, no normalization
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

const BM206_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Quyết định áp dụng biện pháp giám sát điện tử đối với người chưa thành niên — căn cứ Điều 139 Luật Tư pháp NCTN và Điều 41, 236, 241 Bộ luật Tố tụng hình sự. Quyết định gồm hai điều: Điều 1 áp dụng biện pháp giám sát điện tử đối với bị can NCTN; Điều 2 giao cho Ủy ban nhân dân cấp xã thi hành.",
  }
] as const;

/**
 * All 15 compiled fields in compiled order.
 *
 * Source-grounded label derivation:
 *  - agency.name → P0001-P0002: "Viện Kiểm sát" banner
 *  - recipients.personLine → P0076: sole named recipient "Người đại diện của bị can"
 *  - recipients.personLine2→9 → P0077-P0084: nine sequential recipient lines
 *    under "Nơi nhận:" — no individual named roles in source;
 *    compatibility-mapped conservatively by ordinal position (dòng N)
 *  - recipients.personLine10→14 → P0088-P0092: five footnote/guiding lines
 *
 * All personLine fields lack a named role in the source; field-number labels
 * preserve ordinal position to distinguish fields without fabricating roles.
 * This is consistent with the compatibility-mapping standard for generic
 * recipient lines without a named anchor in the own source.
 */
const BM206_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "recipients.personLine": {
    label: "Người đại diện của bị can (Nơi nhận — dòng 1)",
    placeholder: "Người đại diện của bị can Nguyễn Văn Minh",
  },
  "recipients.personLine14": {
    label: "Người nhận khác — dòng 14",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
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

const BM206_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "recipients.personLine": "Người đại diện của bị can Nguyễn Văn Minh",
  "recipients.personLine14": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine13": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
  "recipients.personLine12": "Viện Kiểm sát nhân dân cấp trên trực tiếp",
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

const BM206_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-206",
    versionLabel:
    "BM-206 semantic frontier batch — SOURCE_LITERAL_COPY_TITLE; 15/15 fields curated",
  sections: BM206_SECTIONS,
  fields: BM206_FIELDS,
  demo: BM206_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM206_RUNTIME_UX_PROFILE);
