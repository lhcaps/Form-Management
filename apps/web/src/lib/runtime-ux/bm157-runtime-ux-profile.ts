/**
 * BM-157 runtime-ux curated source-render profile.
 *
 * BM-157 = BẢN KÊ VẬT CHỨNG KÈM THEO BẢN CÁO TRẠNG — indictment evidence
 * appendix in the PROSECUTION FILING PACKAGE family (alongside BM-156 and
 * BM-158). This profile is intentionally minimal: the source DOCX is a
 * tabular inventory with one published field (`agency.vienKiem`),
 * recognised as a contract-only compatibility slot with no corresponding
 * editable value position in the own-source DOCX. No fabricated demo, no
 * batch markers, no fabricated table values.
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

const BM157_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin bản kê vật chứng",
    description:
      "Bản kê vật chứng kèm theo Cáo trạng — phụ lục vật chứng trong bộ hồ sơ truy tố. Trường duy nhất `agency.vienKiem` là vị trí tương thích hợp đồng cho tên Viện kiểm sát lập bản kê (không phải tên cơ quan nhập tự do); danh mục vật chứng cụ thể (TÊN/SỐ LƯỢNG/ĐẶC ĐIỂM/GHI CHÚ) là bảng biểu nguồn ngoài phạm vi trường này.",
  },
] as const;

const BM157_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát lập bản kê",
    placeholder: "",
    helpText:
      "Tên Viện kiểm sát lập bản kê không có vị trí giá trị tương ứng trong nguồn DOCX riêng; phân loại CONTRACT_ONLY_NO_DOCX_SLOT / LOW.",
  },
} as const;

const BM157_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "",
} as const;

const BM157_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-157",
  versionLabel: `BM-157 — Bản kê vật chứng kèm theo Cáo trạng (runtime-ux)`,
  sections: BM157_SECTIONS,
  fields: BM157_FIELDS,
  demo: BM157_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin bản kê vật chứng",
      description:
        "Phụ lục vật chứng cho Cáo trạng — chỉ chứa vị trí tương thích hợp đồng `agency.vienKiem`; phần bảng kê chi tiết (TÊN/SỐ LƯỢNG/ĐẶC ĐIỂM/GHI CHÚ) đến từ nguồn DOCX ngoài phạm vi trường đơn này.",
      fieldKeys: ["agency.vienKiem"],
    },
  ],
};

registerRuntimeUxProfile(BM157_RUNTIME_UX_PROFILE);
