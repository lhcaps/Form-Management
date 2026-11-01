/**
 * BM-207 runtime-ux semantic frontier batch curated profile.
 *
 * Curated for: BM-206→BM-211 semantic frontier closure execution.
 * Locked contract: BM-207.compiled.json (15 fields, 1 section).
 * Canonical extract: BM-207__34a77bfcbd63.extract.md
 *
 * Form title: Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN
 * (approval/validation of the underlying BM-206 electronic-monitoring decision;
 *  distinct from BM-206 which is the original application decision;
 *  distinct from BM-208 which is non-approval)
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

const BM207_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với người chưa thành niên — căn cứ Điều 139 Luật Tư pháp NCTN. Phê chuẩn QĐ áp dụng biện pháp giám sát điện tử đã ban hành; gồm hai điều: Điều 1 phê chuẩn QĐ; Điều 2 yêu cầu thi hành.",
  }
] as const;

/**
 * All 15 compiled fields in compiled order.
 *
 * BM-207 ≠ BM-206: BM-207 has document.fullDocumentCode as the 15th field
 * (BM-206 has recipients.personLine14 instead); recipient set uses
 * personLine2→13 (no personLine14) and adds document.fullDocumentCode.
 *
 * Source-grounded label derivation:
 *  - agency.name → P0001-P0002: "Viện Kiểm sát" banner
 *  - recipients.personLine → P0071: sole named recipient "- Người đại diện;"
 *  - recipients.personLine2→13 → P0072: "- 10" footnote; nine sequential
 *    recipient lines with no individual named roles; compatibility-mapped
 *    conservatively by ordinal position
 *  - document.fullDocumentCode → P0006-P0007: "Số:" slot
 *
 * BM-207 recipients are numbered 2→13 (no 14); the P0072 footnote marker "10"
 * indicates a blank/replaced line rather than a named recipient.
 */
const BM207_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "recipients.personLine": {
    label: "Người đại diện của bị can (Nơi nhận — dòng 1)",
    placeholder: "Người đại diện của bị can Nguyễn Văn Minh",
  },
  "recipients.personLine13": {
    label: "Người nhận khác — dòng 13",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
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
  "document.fullDocumentCode": {
    label: "Số quyết định được phê chuẩn",
    placeholder: "128/QĐ-VKS",
  },
} as const;

const BM207_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Người đại diện của bị can Nguyễn Văn Minh",
  "recipients.personLine13": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
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
  "document.fullDocumentCode": "128/QĐ-VKS",
} as const;

const BM207_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-207",
  versionLabel:
    "BM-207 semantic frontier batch — approval of electronic-monitoring decision; 15/15 fields curated",
  sections: BM207_SECTIONS,
  fields: BM207_FIELDS,
  demo: BM207_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM207_RUNTIME_UX_PROFILE);
