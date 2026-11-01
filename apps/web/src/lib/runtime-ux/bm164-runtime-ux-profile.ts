/**
 * BM-164 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-164 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Biên bản giao nhận Cáo trạng, QĐ truy tố, QĐ tạm đình chỉ, đình chỉ vụ án
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

const BM164_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Biên bản giao nhận Cáo trạng/Quyết định truy tố/Quyết định tạm đình chỉ/Quyết định đình chỉ vụ án",
  },
] as const;

const BM164_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng",
  },
  "recipients.personLine": {
    label: "Bên giao",
    placeholder: "Kiểm sát viên Lê Quang Vinh",
  },
  "recipients.personLine6": {
    label: "Bên nhận 6",
    placeholder: "Đại diện Cơ quan Cảnh sát điều tra",
  },
  "recipients.personLine5": {
    label: "Bên nhận 5",
    placeholder: "Đại diện Trại tạm giam",
  },
  "recipients.personLine4": {
    label: "Bên nhận 4",
    placeholder: "Bị can Trần Văn Bình",
  },
  "recipients.personLine3": {
    label: "Bên nhận 3",
    placeholder: "Người bảo vệ quyền lợi bị can",
  },
  "recipients.personLine2": {
    label: "Bên nhận 2",
    placeholder: "Đại diện Tòa án nhân dân Thành phố",
  },
  "document.fullDocumentCode": {
    label: "Số biên bản",
    placeholder: "31/BB-VKS",
  },
} as const;

const BM164_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "signature.positionTitle": "Viện trưởng",
  "recipients.personLine": "Kiểm sát viên Lê Quang Vinh",
  "recipients.personLine6": "Đại diện Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine5": "Đại diện Trại tạm giam Công an Thành phố Hà Nội",
  "recipients.personLine4": "Bị can Trần Văn Bình",
  "recipients.personLine3": "Luật sư Nguyễn Văn Thành - người bảo vệ quyền lợi bị can",
  "recipients.personLine2": "Đại diện Tòa án nhân dân Thành phố Hà Nội",
  "document.fullDocumentCode": "31/BB-VKS",
} as const;

const BM164_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-164",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-164 runtime-ux batch 8 curated source-render profile`,
  sections: BM164_SECTIONS,
  fields: BM164_FIELDS,
  demo: BM164_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM164_RUNTIME_UX_PROFILE);
