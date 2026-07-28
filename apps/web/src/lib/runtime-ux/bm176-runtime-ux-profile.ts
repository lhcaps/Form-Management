/**
 * BM-176 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-176 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định không phê chuẩn quyết định áp dụng biện pháp điều tra tố tụng đặc biệt
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

const BM176_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description: "Cơ quan ban hành, căn cứ và nội dung không phê chuẩn, số quyết định và địa danh, ngày ban hành.",
  },
] as const;

const BM176_FIELDS = {
  "agency.name": {
    label: "Tên Viện Kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.summaryLine": {
    label: "Trích yếu nội dung",
    placeholder: "V/v không phê chuẩn quyết định áp dụng biện pháp điều tra tố tụng đặc biệt",
  },
  "document.reasonLine": {
    label: "Lý do không phê chuẩn",
    placeholder: "Chưa đủ căn cứ theo quy định tại Điều 313 Bộ luật Tố tụng hình sự",
  },
  "document.contentLine": {
    label: "Nội dung quyết định",
    placeholder: "Không phê chuẩn Quyết định áp dụng biện pháp điều tra tố tụng đặc biệt số 95/BCA-ĐTTSĐB",
  },
  "decision.decisionLine": {
    label: "Quyết định",
    placeholder: "Yêu cầu Cơ quan điều tra thu thập thêm tài liệu, chứng cứ trước khi đề nghị áp dụng",
  },
  "document.issueDate": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội, ngày 04 tháng 3 năm 2026",
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "108/QĐ-VKS",
  },
} as const;

const BM176_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.summaryLine": "V/v không phê chuẩn quyết định áp dụng biện pháp điều tra tố tụng đặc biệt",
  "document.reasonLine": "Chưa đủ căn cứ theo quy định tại Điều 313 Bộ luật Tố tụng hình sự",
  "document.contentLine": "Không phê chuẩn Quyết định áp dụng biện pháp điều tra tố tụng đặc biệt số 95/BCA-ĐTTSĐB",
  "decision.decisionLine": "Yêu cầu Cơ quan điều tra thu thập thêm tài liệu, chứng cứ trước khi đề nghị áp dụng",
  "document.issueDate": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "document.fullDocumentCode": "108/QĐ-VKS",
} as const;

const BM176_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-176",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-176 runtime-ux batch 8 curated source-render profile`,
  sections: BM176_SECTIONS,
  fields: BM176_FIELDS,
  demo: BM176_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM176_RUNTIME_UX_PROFILE);
