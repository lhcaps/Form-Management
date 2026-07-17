/**
 * BM-213 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-213 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Yêu cầu áp dụng các biện pháp kỹ thuật để bảo vệ NCTN
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS via Batch 9 source/render smoke
 * only. Browser/demo/preview/DOCX/fidelity/visual/human evidence
 * remains NOT_RUN for Batch 9.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM213_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản"
  },
  {
    sectionId: "section-thong-tin-nguoi-chua-thanh-nien",
    title: "Thông tin người chưa thành niên"
  },
  {
    sectionId: "section-noi-dung-yeu-cau-bao-ve",
    title: "Nội dung yêu cầu bảo vệ"
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận"
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký"
  }
] as const;

const BM213_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao"
  },
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "document.documentCode": {
    label: "Số văn bản",
    placeholder: "82/QĐ-VKS"
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội"
  },
  "official.issuerTitle": {
    label: "Chức danh ban hành",
    placeholder: "Viện trưởng"
  },
  "person.fullName": {
    label: "Thông tin cá nhân (fullName)",
    placeholder: "Ông Nguyễn Minh Hoàng"
  }
} as const;

const BM213_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "82/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội",
  "official.issuerTitle": "Viện trưởng",
  "person.fullName": "Ông Nguyễn Minh Hoàng"
} as const;

const BM213_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-213",
  versionLabel: `BM-213 runtime-ux batch 9 curated source-render profile`,
  sections: BM213_SECTIONS,
  fields: BM213_FIELDS,
  demo: BM213_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM213_RUNTIME_UX_PROFILE);
