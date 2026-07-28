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
    title: "Thông tin quyết định đình chỉ chữa bệnh",
    description: "Thông tin ban hành, căn cứ, người bị áp dụng và nội dung đình chỉ thi hành biện pháp bắt buộc chữa bệnh.",
  },
] as const;

const BM180_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Ghi tên Viện kiểm sát ban hành",
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
    placeholder: "Ghi địa danh nơi đặt trụ sở Viện kiểm sát ban hành",
  },
  "agency.agencyReferenceLine": {
    label: "Cơ quan tham chiếu",
    placeholder: "Viện Kiểm sát nhân dân tối cao",
  },
  "document.issueDate": {
    label: "Ngày ban hành",
    placeholder: "Ngày, tháng, năm ban hành quyết định",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "138/QĐ-VKS",
  },
} as const;

const BM180_DEMO_RUNTIME_UX = {} as const;

const BM180_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-180",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-180 runtime-ux batch 8 curated source-render profile`,
  sections: BM180_SECTIONS,
  fields: BM180_FIELDS,
  demo: BM180_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM180_RUNTIME_UX_PROFILE);
