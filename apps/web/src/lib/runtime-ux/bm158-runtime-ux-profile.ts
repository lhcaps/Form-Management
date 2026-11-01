/**
 * BM-158 runtime-ux curated source-render profile.
 *
 * BM-158 = DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP ĐẾN PHIÊN TÒA — trial-summons
 * appendix in the PROSECUTION FILING PACKAGE family (alongside BM-156
 * and BM-157). This profile surfaces the three published fields and
 * preserves the literal summons-list semantics (STT/Họ tên/Ngày sinh/
 * Địa chỉ/Tư cách/Ghi chú are a DOCX table outside this surface).
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or the
 *     compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Family: PROSECUTION FILING PACKAGE — appendix (BM-156 primary,
 * BM-157 evidence inventory, BM-158 summons list).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM158_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin danh sách triệu tập",
    description:
      "Danh sách những người Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa — phụ lục đính kèm Cáo trạng theo BM-156 (P0102). Ba trường: tên Viện kiểm sát đề nghị, số danh sách (vị trí tương thích hợp đồng), địa danh lập danh sách. Bảng STT/Họ tên/Ngày sinh/Địa chỉ/Tư cách/Ghi chú đến từ nguồn DOCX ngoài phạm vi trường đơn này.",
  },
] as const;

const BM158_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát đề nghị triệu tập",
    placeholder: "",
    helpText:
      "Tên Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa (P0010 + P0019, CONTRACT_POSITIONAL_INFERENCE / MEDIUM — vị trí giá trị nằm trong phần đầu trang nhưng nguồn không có chỉ dẫn nhãn điền riêng).",
  },
  "document.soDanh": {
    label: "Số danh sách",
    placeholder: "",
    helpText:
      "Số danh sách không có vị trí giá trị tương ứng trong nguồn DOCX riêng; phân loại CONTRACT_ONLY_NO_DOCX_SLOT / LOW.",
  },
  "agency.diaDanh": {
    label: "Địa danh lập danh sách",
    placeholder: "",
    helpText:
      "Địa danh nơi lập danh sách tại P0016 (CONTRACT_POSITIONAL_INFERENCE / MEDIUM — vị trí trống trước dòng ngày tháng; nguồn không có nhãn điền riêng).",
  },
} as const;

const BM158_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "",
  "document.soDanh": "",
  "agency.diaDanh": "",
} as const;

const BM158_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-158",
  versionLabel: `BM-158 — Danh sách đề nghị triệu tập đến phiên tòa (runtime-ux)`,
  sections: BM158_SECTIONS,
  fields: BM158_FIELDS,
  demo: BM158_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin danh sách triệu tập",
      description:
        "Danh sách triệu tập đính kèm Cáo trạng — ba trường công bố: tên Viện kiểm sát đề nghị, số danh sách (vị trí tương thích hợp đồng), địa danh lập danh sách. Bảng danh sách người triệu tập (T0002) đến từ nguồn DOCX ngoài phạm vi trường đơn này.",
      fieldKeys: ["agency.vienKiem", "document.soDanh", "agency.diaDanh"],
    },
  ],
};

registerRuntimeUxProfile(BM158_RUNTIME_UX_PROFILE);
