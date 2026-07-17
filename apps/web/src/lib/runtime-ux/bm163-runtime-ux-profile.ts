/**
 * BM-163 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-163 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Giấy triệu tập
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

const BM163_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-thong-tin-ca-nhan",
    title: "Thông tin cá nhân được triệu tập",
  },
  {
    sectionId: "section-vu-an",
    title: "Vụ án liên quan",
  },
] as const;

const BM163_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.fullDocumentCode": {
    label: "Số giấy triệu tập",
    placeholder: "21/GTT-VKS",
  },
  "document.issueDate": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội, ngày 04 tháng 3 năm 2026",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "ngày 22 tháng 7 năm 1988",
  },
  "person.personFullName": {
    label: "Họ tên",
    placeholder: "Đỗ Thanh Hùng",
  },
  "person.currentAddress": {
    label: "Nơi ở hiện nay",
    placeholder: "Số 45 phố Bạch Mai, quận Hai Bà Trưng, Hà Nội",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Giáo viên",
  },
  "person.ward": {
    label: "Phường/Xã",
    placeholder: "Phường Bạch Mai",
  },
  "person.province": {
    label: "Tỉnh/Thành phố",
    placeholder: "Thành phố Hà Nội",
  },
  "person.idNumber": {
    label: "Số CCCD/CMND",
    placeholder: "001088123456",
  },
  "case.caseNumber": {
    label: "Số vụ án",
    placeholder: "12/HS-ST năm 2026",
  },
} as const;

const BM163_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.fullDocumentCode": "21/GTT-VKS",
  "document.issueDate": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "person.dateOfBirth": "ngày 22 tháng 7 năm 1988",
  "person.personFullName": "Đỗ Thanh Hùng",
  "person.currentAddress": "Số 45 phố Bạch Mai, quận Hai Bà Trưng, Hà Nội",
  "person.occupation": "Giáo viên",
  "person.ward": "Phường Bạch Mai",
  "person.province": "Thành phố Hà Nội",
  "person.idNumber": "001088123456",
  "case.caseNumber": "12/HS-ST năm 2026",
} as const;

const BM163_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-163",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-163 runtime-ux batch 8 curated source-render profile`,
  sections: BM163_SECTIONS,
  fields: BM163_FIELDS,
  demo: BM163_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM163_RUNTIME_UX_PROFILE);
