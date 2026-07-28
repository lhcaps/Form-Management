/**
 * BM-173 runtime-ux curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-173 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, source-aligned section descriptions, and safe
 * demo data.
 *
 * Form title: Quyết định chuyển vật chứng
 *
 * Source evidence:
 *   docs/audit/docx/extracted/BM-173__2e06ac25958d.extract.md
 *   (extractHeading = "CHUYỂN VẬT CHỨNG" anchored on P0012,
 *    legal basis "Căn cứ các điều 41, 90 và 106" anchored on P0014)
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Curation scope (allowed):
 *   - Section descriptions (aligned with extract paragraphs P0011–P0026)
 *   - Field labels and placeholders (already source-aligned)
 *   - Phantom section id correction (no phantom "section-noi-dung-chuyen")
 *
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled contract section IDs (`section-noi-dung-quyet-inh` stays)
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM173_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Dòng VIỆN KIỂM SÁT, CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập – Tự do – Hạnh phúc; số QĐ, địa danh, ngày tháng năm ban hành (P0001–P0010).",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Căn cứ Điều 41, 90 và 106 Bộ luật Tố tụng hình sự (P0014); căn cứ Cáo trạng/Quyết định truy tố theo thủ tục rút gọn (P0015–P0019).",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Xét thấy cần chuyển các vật chứng của vụ án đến cơ quan thi hành án để bảo đảm xét xử và thi hành án (P0020–P0022); Điều 1 — Danh mục vật chứng chuyển (P0024–P0025); Điều 2 — Yêu cầu thực hiện giao nhận và gửi biên bản đến Viện kiểm sát (P0026).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Cơ quan, đơn vị thi hành và lưu hồ sơ HSVA, HSKS, VP (P0027–P0031).",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Chức danh, họ tên người ký, đóng dấu Viện kiểm sát (P0033); Mẫu số 173/HS — ban hành theo Thông tư số /2026/TT-VKSTC (P0047–P0049).",
  },
] as const;

const BM173_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao",
  },
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "88/QĐ-VKS",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội, ngày 04 tháng 3 năm 2026",
  },
  "official.issuerTitle": {
    label: "Chức danh ban hành",
    placeholder: "Viện trưởng",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 41, 90 và 106 của Bộ luật Tố tụng hình sự",
  },
  "evidenceTransfer.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định của Viện Kiểm sát",
    placeholder: "Căn cứ Quyết định phê chuẩn số 61/QĐ-VKS ngày 25/02/2026",
  },
  "evidenceTransfer.considerationLine": {
    label: "Nhận định",
    placeholder: "Vật chứng cần được chuyển cho cơ quan có thẩm quyền xử lý",
  },
  "evidenceTransfer.article1Line": {
    label: "Điều 1 - Nội dung chuyển",
    placeholder: "Điều 1. Chuyển toàn bộ vật chứng cho cơ quan tiếp nhận theo danh mục kèm theo.",
  },
  "evidenceTransfer.article2Line": {
    label: "Điều 2 - Yêu cầu tiếp nhận",
    placeholder: "Điều 2. Yêu cầu cơ quan tiếp nhận lập biên bản bàn giao và bảo quản theo quy định.",
  },
  "recipients.line1": {
    label: "Nơi nhận 1",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  },
  "recipients.line2": {
    label: "Nơi nhận 2",
    placeholder: "Viện Kiểm sát nhân dân tối cao (để báo cáo)",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký số",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Phó Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Anh",
  },
} as const;

const BM173_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "88/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 3 năm 2026",
  "official.issuerTitle": "Phó Viện trưởng Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 41, 90 và 106 của Bộ luật Tố tụng hình sự",
  "evidenceTransfer.prosecutionDecisionLegalBasisLine": "Căn cứ Quyết định phê chuẩn số 61/QĐ-VKS ngày 25/02/2026",
  "evidenceTransfer.considerationLine": "Vật chứng cần được chuyển cho cơ quan có thẩm quyền xử lý",
  "evidenceTransfer.article1Line": "Điều 1. Chuyển toàn bộ vật chứng cho cơ quan tiếp nhận theo danh mục kèm theo.",
  "evidenceTransfer.article2Line": "Điều 2. Yêu cầu cơ quan tiếp nhận lập biên bản bàn giao và bảo quản theo quy định.",
  "recipients.line1": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội (để tiếp nhận)",
  "recipients.line2": "Viện Kiểm sát nhân dân tối cao (để báo cáo)",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký số",
  "signature.positionTitle": "Phó Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Anh",
} as const;

const BM173_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-173",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-173 runtime-ux vật-chứng-chuyển curated source-render profile`,
  sections: BM173_SECTIONS,
  fields: BM173_FIELDS,
  demo: BM173_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM173_RUNTIME_UX_PROFILE);
