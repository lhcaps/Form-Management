/**
 * BM-174 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-174 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt
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

const BM174_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-thong-tin-ca-nhan",
    title: "Thông tin cá nhân",
  },
  {
    sectionId: "section-noi-dung-yeu-cau",
    title: "Nội dung yêu cầu",
  },
] as const;

const BM174_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.summaryLine": {
    label: "Trích yếu nội dung",
    placeholder: "V/v yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt",
  },
  "person.idNumber": {
    label: "Số CCCD/CMND",
    placeholder: "030088123456",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Nhân viên văn phòng",
  },
  "person.currentAddress": {
    label: "Nơi ở hiện nay",
    placeholder: "Số 78 phố Giải Phóng, quận Hai Bà Trưng, Hà Nội",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "ngày 05 tháng 11 năm 1988",
  },
  "person.personFullName": {
    label: "Họ tên",
    placeholder: "Trịnh Văn Nam",
  },
  "document.contentLine": {
    label: "Nội dung yêu cầu",
    placeholder: "Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt theo quy định tại Chương XVII Bộ luật Tố tụng hình sự",
  },
  "document.issuePlace": {
    label: "Địa danh",
    placeholder: "Hà Nội",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "ngày 04 tháng 3 năm 2026",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "95/YG-VKS",
  },
} as const;

const BM174_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.summaryLine": "V/v yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt",
  "person.idNumber": "030088123456",
  "person.occupation": "Nhân viên văn phòng",
  "person.currentAddress": "Số 78 phố Giải Phóng, quận Hai Bà Trưng, Hà Nội",
  "person.dateOfBirth": "ngày 05 tháng 11 năm 1988",
  "person.personFullName": "Trịnh Văn Nam",
  "document.contentLine": "Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt theo quy định tại Chương XVII Bộ luật Tố tụng hình sự",
  "document.issuePlace": "Hà Nội",
  "document.issueDate": "ngày 04 tháng 3 năm 2026",
  "document.fullDocumentCode": "95/YG-VKS",
} as const;

const BM174_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-174",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-174 runtime-ux batch 8 curated source-render profile`,
  sections: BM174_SECTIONS,
  fields: BM174_FIELDS,
  demo: BM174_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM174_RUNTIME_UX_PROFILE);
