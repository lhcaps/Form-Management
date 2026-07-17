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
    sectionId: "section-co-quan",
    title: "Cơ quan và văn bản",
  },
  {
    sectionId: "section-ben-giao-va-ben-nhan",
    title: "Bên giao và bên nhận",
  },
  {
    sectionId: "section-thong-tin-ho-so",
    title: "Thông tin hồ sơ vụ án",
  },
  {
    sectionId: "section-thoi-gian",
    title: "Thời gian giao nhận",
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
    placeholder: "Bắt đầu lúc 09 giờ 00 phút, ngày 04 tháng 3 năm 2026",
  },
  "caseFileHandover.giverName": {
    label: "Bên giao - Họ tên",
    placeholder: "Kiểm sát viên Trần Quốc Đạt",
  },
  "caseFileHandover.giverPositionTitle": {
    label: "Bên giao - Chức vụ",
    placeholder: "Kiểm sát viên sơ cấp",
  },
  "caseFileHandover.receiverName": {
    label: "Bên nhận - Họ tên",
    placeholder: "Điều tra viên Lê Văn Hà",
  },
  "caseFileHandover.receiverPositionTitle": {
    label: "Bên nhận - Chức vụ",
    placeholder: "Điều tra viên sơ cấp",
  },
  "caseFileHandover.caseFileTitle": {
    label: "Hồ sơ vụ án",
    placeholder: "Hồ sơ vụ án hình sự số 12/HS-ST năm 2026",
  },
  "caseFileHandover.handoverReasonLine": {
    label: "Lý do giao nhận",
    placeholder: "Để tiếp tục điều tra theo thẩm quyền",
  },
  "caseFileHandover.fileStatsLine": {
    label: "Thống kê hồ sơ",
    placeholder: "Gồm 04 tập hồ sơ với 312 tờ",
  },
  "caseFileHandover.evidenceLine": {
    label: "Tang vật/vật chứng",
    placeholder: "Kèm theo 03 thùng tang vật được niêm phong",
  },
  "caseFileHandover.endedAtLine": {
    label: "Thời điểm kết thúc",
    placeholder: "Kết thúc lúc 10 giờ 30 phút, cùng ngày",
  },
  "caseFileHandover.receiverSignerName": {
    label: "Người ký - Bên nhận",
    placeholder: "Lê Văn Hà",
  },
  "caseFileHandover.giverSignerName": {
    label: "Người ký - Bên giao",
    placeholder: "Trần Quốc Đạt",
  },
} as const;

const BM168_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "caseFileHandover.startedAtLine": "Bắt đầu lúc 09 giờ 00 phút, ngày 04 tháng 3 năm 2026",
  "caseFileHandover.giverName": "Kiểm sát viên Trần Quốc Đạt",
  "caseFileHandover.giverPositionTitle": "Kiểm sát viên sơ cấp",
  "caseFileHandover.receiverName": "Điều tra viên Lê Văn Hà",
  "caseFileHandover.receiverPositionTitle": "Điều tra viên sơ cấp",
  "caseFileHandover.caseFileTitle": "Hồ sơ vụ án hình sự số 12/HS-ST năm 2026",
  "caseFileHandover.handoverReasonLine": "Để tiếp tục điều tra theo thẩm quyền",
  "caseFileHandover.fileStatsLine": "Gồm 04 tập hồ sơ với 312 tờ",
  "caseFileHandover.evidenceLine": "Kèm theo 03 thùng tang vật được niêm phong",
  "caseFileHandover.endedAtLine": "Kết thúc lúc 10 giờ 30 phút, cùng ngày",
  "caseFileHandover.receiverSignerName": "Lê Văn Hà",
  "caseFileHandover.giverSignerName": "Trần Quốc Đạt",
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
