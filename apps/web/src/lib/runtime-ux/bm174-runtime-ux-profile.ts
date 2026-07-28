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
    description: "Cơ quan ban hành, số văn bản, địa danh, ngày ban hành và thông tin người bị áp dụng biện pháp.",
  },
] as const;

const BM174_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.summaryLine": {
    label: "Trích yếu nội dung",
    placeholder: "Căn cứ hồ sơ vụ án hình sự số 12/HS-VKS-KV7 đến nay đã có đủ căn cứ xác định hành vi phạm tội.",
  },
  "person.idNumber": {
    label: "Số CCCD/CMND",
    placeholder: "079085001234",
  },
  "person.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Lao động tự do",
  },
  "person.currentAddress": {
    label: "Nơi ở hiện nay",
    placeholder: "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  },
  "person.dateOfBirth": {
    label: "Ngày sinh",
    placeholder: "08/09/1985",
  },
  "person.personFullName": {
    label: "Họ tên",
    placeholder: "Nguyễn Văn A",
  },
  "document.contentLine": {
    label: "Nội dung yêu cầu",
    placeholder: "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh áp dụng biện pháp điều tra tố tụng đặc biệt đối với đối tượng Nguyễn Văn A theo quy định tại Điều 226 Bộ luật Tố tụng hình sự.",
  },
  "document.issuePlace": {
    label: "Địa danh",
    placeholder: "TP. Hồ Chí Minh",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "2026-07-04",
  },
  "document.fullDocumentCode": {
    label: "Số văn bản",
    placeholder: "08/YC-VKSKV7",
  },
} as const;

const BM174_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "document.summaryLine": "Căn cứ hồ sơ vụ án hình sự số 12/HS-VKS-KV7 đến nay đã có đủ căn cứ xác định hành vi phạm tội.",
  "person.idNumber": "079085001234",
  "person.occupation": "Lao động tự do",
  "person.currentAddress": "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "person.dateOfBirth": "08/09/1985",
  "person.personFullName": "Nguyễn Văn A",
  "document.contentLine": "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh áp dụng biện pháp điều tra tố tụng đặc biệt đối với đối tượng Nguyễn Văn A theo quy định tại Điều 226 Bộ luật Tố tụng hình sự.",
  "document.issuePlace": "TP. Hồ Chí Minh",
  "document.issueDate": "2026-07-04",
  "document.fullDocumentCode": "08/YC-VKSKV7",
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
