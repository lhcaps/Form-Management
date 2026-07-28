/**
 * BM-208 runtime-ux semantic frontier batch curated profile.
 *
 * Curated for: BM-206→BM-211 semantic frontier closure execution.
 * Locked contract: BM-208.compiled.json (15 fields, 1 section).
 * Canonical extract: BM-208__93ee4a40d673.extract.md
 *
 * Form title: Quyết định không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN
 * (non-approval/rejection of the underlying electronic-monitoring decision;
 *  distinct from BM-207 which is approval of the same decision)
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

const BM208_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Quyết định không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với người chưa thành niên — căn cứ Điều 139 Luật Tư pháp NCTN. Không phê chuẩn QĐ áp dụng biện pháp giám sát điện tử đã ban hành vì không có căn cứ hoặc không cần thiết; gồm hai điều: Điều 1 không phê chuẩn QĐ; Điều 2 yêu cầu thi hành.",
  }
] as const;

/**
 * All 15 compiled fields in compiled order.
 *
 * BM-208 ≠ BM-207: identical field structure (same 15 fields as BM-207) but
 * BM-208 is non-approval ("không phê chuẩn") while BM-207 is approval
 * ("phê chuẩn"). Both share the same recipient field set (personLine2→13
 * plus document.fullDocumentCode).
 *
 * Source-grounded label derivation:
 *  - agency.name → P0001-P0002: "Viện Kiểm sát" banner
 *  - recipients.personLine → P0072: sole named recipient "- Người đại diện của bị can;"
 *  - recipients.personLine2→13 → nine sequential recipient lines under "Nơi nhận:"
 *    with no individual named roles; compatibility-mapped by ordinal position
 *  - document.fullDocumentCode → P0006-P0007: "Số:" slot
 */
const BM208_FIELDS = {
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
    label: "Số quyết định không được phê chuẩn",
    placeholder: "128/QĐ-VKS",
  },
} as const;

const BM208_DEMO_RUNTIME_UX = {
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

const BM208_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-208",
  versionLabel:
    "BM-208 semantic frontier batch — non-approval of electronic-monitoring decision; 15/15 fields curated",
  sections: BM208_SECTIONS,
  fields: BM208_FIELDS,
  demo: BM208_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM208_RUNTIME_UX_PROFILE);
