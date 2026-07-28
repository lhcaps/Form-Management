/**
 * BM-162 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-162 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Giấy mời
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS via Batch 8 source/render smoke
 * only. Browser/demo/preview/DOCX/fidelity/visual/human evidence
 * remains NOT_RUN for Batch 8.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM162_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Giấy mời người tham gia tố tụng có mặt tại thời gian và địa điểm được chỉ định (Kính mời)",
  },
] as const;

const BM162_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.fullDocumentCode": {
    label: "Số giấy mời",
    placeholder: "15/GM-VKS",
  },
  "document.issueDate": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội, ngày 04 tháng 3 năm 2026",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "ngày 18 tháng 9 năm 1990",
  },
  "person.personFullName": {
    label: "Họ tên",
    placeholder: "Phạm Minh Đức",
  },
  "person.currentAddress": {
    label: "Nơi ở hiện nay",
    placeholder: "Số 12, ngõ 8, phường Cát Linh, quận Đống Đa, Hà Nội",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Công nhân",
  },
  "person.idNumber": {
    label: "Số CCCD/CMND",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 030090123456 is a format-shaped synthetic test value, not derived from any real customer/case data.
    placeholder: "030090123456",
  },
} as const;

const BM162_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.fullDocumentCode": "15/GM-VKS",
  "document.issueDate": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "person.dateOfBirth": "ngày 18 tháng 9 năm 1990",
  "person.personFullName": "Phạm Minh Đức",
  "person.currentAddress": "Số 12, ngõ 8, phường Cát Linh, quận Đống Đa, Hà Nội",
  "person.occupation": "Công nhân",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 030090123456 is a format-shaped synthetic test value, not derived from any real customer/case data.
  "person.idNumber": "030090123456",
} as const;

const BM162_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-162",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-162 runtime-ux batch 8 curated source-render profile`,
  sections: BM162_SECTIONS,
  fields: BM162_FIELDS,
  demo: BM162_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM162_RUNTIME_UX_PROFILE);
