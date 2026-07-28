/**
 * BM-168 runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-168 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Biên bản giao nhận hồ sơ vụ án
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

const BM168_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description: "Viện kiểm sát cấp trên và Viện kiểm sát ban hành biên bản.",
  },
  {
    sectionId: "section-bien-ban-ban-giao",
    title: "Biên bản bàn giao",
    description: "Thời điểm bắt đầu giao nhận, bên giao (họ tên và chức vụ), bên nhận (họ tên và chức vụ), tên hồ sơ vụ án được bàn giao, lý do bàn giao, thống kê hồ sơ, tang vật/vật chứng kèm theo, thời điểm kết thúc và chữ ký của người giao và người nhận.",
  },
] as const;

const BM168_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao",
  },
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  },
  "caseFileHandover.startedAtLine": {
    label: "Thời điểm bắt đầu",
    placeholder: "Căn cứ vào Quyết định phân công số 09/QĐ-VKS-KV7, vào hồi 09 giờ 00 phút ngày 04 tháng 3 năm 2026 tại trụ sở Viện Kiểm sát nhân dân Khu vực 7.",
  },
  "caseFileHandover.giverName": {
    label: "Bên giao - Họ tên",
    placeholder: "Trần Thị Hồng",
  },
  "caseFileHandover.giverPositionTitle": {
    label: "Bên giao - Chức vụ",
    placeholder: "Kiểm sát viên sơ cấp",
  },
  "caseFileHandover.receiverName": {
    label: "Bên nhận - Họ tên",
    placeholder: "Lê Văn Hùng",
  },
  "caseFileHandover.receiverPositionTitle": {
    label: "Bên nhận - Chức vụ",
    placeholder: "Điều tra viên sơ cấp",
  },
  "caseFileHandover.caseFileTitle": {
    label: "Hồ sơ vụ án",
    placeholder: "Hồ sơ vụ án hình sự số 12/HS-VKS-KV7 về tội Đánh bạc theo Điều 321 BLHS 2015",
  },
  "caseFileHandover.handoverReasonLine": {
    label: "Lý do giao nhận",
    placeholder: "Bàn giao hồ sơ vụ án để phục vụ công tác điều tra bổ sung theo yêu cầu của Cơ quan Cảnh sát điều tra.",
  },
  "caseFileHandover.fileStatsLine": {
    label: "Thống kê hồ sơ",
    placeholder: "01 bản Kết luận điều tra; 01 bản Cáo trạng; 12 tờ hồ sơ vụ án có liên quan; 01 đĩa CD lưu trữ tài liệu, chứng cứ.",
  },
  "caseFileHandover.evidenceLine": {
    label: "Tang vật/vật chứng",
    placeholder: "01 chiếc xe máy Honda Wave RSX biển kiểm soát 59C1-123.45; 01 sổ tiết kiệm ngân hàng.",
  },
  "caseFileHandover.endedAtLine": {
    label: "Thời điểm kết thúc",
    placeholder: "Việc bàn giao kết thúc hồi 10 giờ 30 phút cùng ngày, các bên thống nhất không có ý kiến gì khác.",
  },
  "caseFileHandover.receiverSignerName": {
    label: "Người ký - Bên nhận",
    placeholder: "Lê Văn Hùng",
  },
  "caseFileHandover.giverSignerName": {
    label: "Người ký - Bên giao",
    placeholder: "Trần Thị Hồng",
  },
} as const;

const BM168_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "caseFileHandover.startedAtLine": "Căn cứ vào Quyết định phân công số 09/QĐ-VKS-KV7, vào hồi 09 giờ 00 phút ngày 04 tháng 3 năm 2026 tại trụ sở Viện Kiểm sát nhân dân Khu vực 7.",
  "caseFileHandover.giverName": "Trần Thị Hồng",
  "caseFileHandover.giverPositionTitle": "Kiểm sát viên sơ cấp",
  "caseFileHandover.receiverName": "Lê Văn Hùng",
  "caseFileHandover.receiverPositionTitle": "Điều tra viên sơ cấp",
  "caseFileHandover.caseFileTitle": "Hồ sơ vụ án hình sự số 12/HS-VKS-KV7 về tội Đánh bạc theo Điều 321 BLHS 2015",
  "caseFileHandover.handoverReasonLine": "Bàn giao hồ sơ vụ án để phục vụ công tác điều tra bổ sung theo yêu cầu của Cơ quan Cảnh sát điều tra.",
  "caseFileHandover.fileStatsLine": "01 bản Kết luận điều tra; 01 bản Cáo trạng; 12 tờ hồ sơ vụ án có liên quan; 01 đĩa CD lưu trữ tài liệu, chứng cứ.",
  "caseFileHandover.evidenceLine": "01 chiếc xe máy Honda Wave RSX biển kiểm soát 59C1-123.45; 01 sổ tiết kiệm ngân hàng.",
  "caseFileHandover.endedAtLine": "Việc bàn giao kết thúc hồi 10 giờ 30 phút cùng ngày, các bên thống nhất không có ý kiến gì khác.",
  "caseFileHandover.receiverSignerName": "Lê Văn Hùng",
  "caseFileHandover.giverSignerName": "Trần Thị Hồng",
} as const;

const BM168_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-168",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-168 runtime-ux batch 8 curated source-render profile`,
  sections: BM168_SECTIONS,
  fields: BM168_FIELDS,
  demo: BM168_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM168_RUNTIME_UX_PROFILE);
