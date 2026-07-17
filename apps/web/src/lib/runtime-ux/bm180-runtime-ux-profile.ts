/**
 * BM-180 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-180 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định đình chỉ thi hành biện pháp bắt buộc chữa bệnh
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

const BM180_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
  },
  {
    sectionId: "section-thong-tin-ca-nhan",
    title: "Thông tin cá nhân",
  },
  {
    sectionId: "section-can-cu-va-noi-dung",
    title: "Căn cứ và nội dung đình chỉ",
  },
] as const;

const BM180_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.summaryLine": {
    label: "Trích yếu",
    placeholder: "V/v đình chỉ thi hành biện pháp bắt buộc chữa bệnh",
  },
  "person.personFullName": {
    label: "Họ tên",
    placeholder: "Bùi Quang Khải",
  },
  "document.contentLine": {
    label: "Nội dung đình chỉ",
    placeholder: "Đình chỉ thi hành biện pháp bắt buộc chữa bệnh theo Quyết định số 130/QĐ-VKS ngày 15/02/2026",
  },
  "document.reasonLine2": {
    label: "Lý do đình chỉ 2",
    placeholder: "Đã có kết luận của Hội đồng giám định pháp y về việc người bị áp dụng đã khỏi bệnh",
  },
  "document.reasonLine": {
    label: "Lý do đình chỉ",
    placeholder: "Theo đề nghị của Cơ sở chữa bệnh và Kết luận giám định pháp y",
  },
  "document.issuePlace": {
    label: "Địa danh",
    placeholder: "Hà Nội",
  },
  "agency.agencyReferenceLine": {
    label: "Cơ quan tham chiếu",
    placeholder: "Viện Kiểm sát nhân dân tối cao",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "ngày 04 tháng 3 năm 2026",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "138/QĐ-VKS",
  },
} as const;

const BM180_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.summaryLine": "V/v đình chỉ thi hành biện pháp bắt buộc chữa bệnh",
  "person.personFullName": "Bùi Quang Khải",
  "document.contentLine": "Đình chỉ thi hành biện pháp bắt buộc chữa bệnh theo Quyết định số 130/QĐ-VKS ngày 15/02/2026",
  "document.reasonLine2": "Đã có kết luận của Hội đồng giám định pháp y về việc người bị áp dụng đã khỏi bệnh",
  "document.reasonLine": "Theo đề nghị của Cơ sở chữa bệnh và Kết luận giám định pháp y",
  "document.issuePlace": "Hà Nội",
  "agency.agencyReferenceLine": "Viện Kiểm sát nhân dân tối cao",
  "document.issueDate": "ngày 04 tháng 3 năm 2026",
  "document.fullDocumentCode": "138/QĐ-VKS",
} as const;

const BM180_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-180",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-180 runtime-ux batch 8 curated source-render profile`,
  sections: BM180_SECTIONS,
  fields: BM180_FIELDS,
  demo: BM180_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM180_RUNTIME_UX_PROFILE);
