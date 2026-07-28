/**
 * BM-143 runtime-ux curated profile — Quyết định tách vụ án hình sự
 * trong giai đoạn truy tố (prosecution-stage decision: split one
 * criminal case into separate cases under prosecution).
 *
 * CURATION (GATE C of the current turn):
 *   - 3 compiled fields, all TEXT.
 *   - 1 compiled section (`section-thong-tin-bieu-mau`).
 *   - Title: compiled contract title preserved verbatim ("Quyết định
 *     tách vụ án hình sự trong giai đoạn truy tố").
 *   - Document family: QUYẾT ĐỊNH (prosecution-stage decision).
 *   - Procedure subfamily: tách vụ án hình sự — BLTTHS Điều 41 và
 *     khoản 2 Điều 242.
 *   - Operative verb at DOCX P0011: "TÁCH VỤ ÁN HÌNH SỰ" (TÁCH).
 *   - Source-backed number suffix: P0006 "/QĐ-VKS".
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-143.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-143__7ad54f65b3a0.extract.md
 *
 * Compatibility mapping (authoritative for this curation turn; historical
 * keys remain unchanged, only presentation labels are source-aligned):
 *
 *   Agency and venue:
 *     - agency.vienKiem → "Tên Viện kiểm sát ban hành QĐ tách vụ án"
 *       (P0053 "Ghi tên Viện kiểm sát cấp trên trực tiếp" + P0054 "Ghi
 *       tên Viện kiểm sát ban hành" + P0055 "Viết tắt tên Viện kiểm
 *       sát ban hành - đơn vị phụ trách (nếu có)" — FOOTNOTE / MEDIUM).
 *     - agency.diaDanh → "Địa danh ban hành QĐ tách vụ án" (P0007 ", ngày"
 *       + P0008 "tháng" + P0009 "năm 20" event-date sequence + P0056 "Ghi
 *       địa danh là tên tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát
 *       ban hành" — DIRECT_SLOT / HIGH).
 *
 *   Document identity:
 *     - document.soQuyet → "Số QĐ tách vụ án" (P0005 "Số:" + P0006
 *       "/QĐ-VKS" — DIRECT_SLOT / HIGH).
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0001 "VIỆN KIỂM SÁT" + P0003 "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT
 *     NAM" + P0004 "Độc lập - Tự do - Hạnh phúc" — agency banner
 *     (decorative).
 *   - P0010 "QUYẾT ĐỊNH" + P0011 "TÁCH VỤ ÁN HÌNH SỰ" + P0012 "VIỆN
 *     TRƯỞNG VIỆN KIỂM SÁT2" — title block (decorative).
 *   - P0013 "Căn cứ Điều 41 và khoản 2 Điều 242 của Bộ luật Tố tụng
 *     hình sự" — BLTTHS legal basis (no own contract field; recorded
 *     in provenance as legalWorkflowSourceSlots entry).
 *   - P0014 "Căn cứ Quyết định khởi tố vụ án hình sự số" + P0015–P0026
 *     case-decision cluster — case-decision basis (decorative).
 *   - P0027 "Căn cứ Quyết định khởi tố bị can số" + P0028–P0040
 *     defendant-decision cluster — defendant basis (decorative).
 *   - P0041 "Xét thấy" — narrative preamble (decorative).
 *   - P0042 "QUYẾT ĐỊNH:" + P0043 "Tách hành vi" + P0044 "của" + P0045
 *     "thuộc vụ án hình sự theo Quyết định khởi tố vụ án hình sự số" +
 *     P0046–P0049 split-source cluster — body block (decorative).
 *   - P0050 "Nơi nhận:" + P0051 "Lưu: HSVA, HSKS, VP." + P0052 "(Ký,
 *     ghi rõ họ tên, đóng dấu)" — distribution block (decorative).
 *   - P0057 "Ghi tên cơ quan, người có thẩm quyền ra Quyết định khởi
 *     tố vụ án hình sự" + P0058 "Ghi tên cơ quan, người có thẩm quyền
 *     ra Quyết định khởi tố bị can" + P0059 "Ghi họ tên người hoặc tên
 *     pháp nhân bị khởi tố" — authority footnotes (decorative).
 *   - P0060 "Ghi lý do tách vụ án hình sự theo khoản 2 Điều 242 của Bộ
 *     luật Tố tụng hình sự" + P0061 "Ghi rõ lý do tách vụ án hình sự"
 *     — split-reason footnotes (decorative).
 *   - P0062 "Ghi chức danh người ký" — signatory authority footnote
 *     (decorative).
 *   - P0063 "Mẫu số 143/HS" + P0064 + P0065 — template-identity footer
 *     (decorative).
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or the
 *     compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No runtimeReady promotion.
 *   - No fabricated person / case / agency / number values; demo values
 *     are empty placeholders, not historical case data.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM143_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin QĐ tách vụ án hình sự trong giai đoạn truy tố",
    description:
      "Thông tin QĐ tách vụ án hình sự trong giai đoạn truy tố của Viện kiểm sát. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ và địa danh ban hành.",
  },
] as const;

const BM143_FIELDS = {
  "agency.vienKiem": {
    label: "Tên Viện kiểm sát ban hành QĐ tách vụ án",
    placeholder:
      "Tên Viện kiểm sát ban hành (P0053 \"Ghi tên Viện kiểm sát cấp trên trực tiếp\" + P0054 \"Ghi tên Viện kiểm sát ban hành\" + P0055 \"Viết tắt tên Viện kiểm sát ban hành - đơn vị phụ trách (nếu có)\" — FOOTNOTE / MEDIUM)",
  },
  "document.soQuyet": {
    label: "Số QĐ tách vụ án",
    placeholder:
      "Số QĐ (P0005 \"Số:\" + P0006 \"/QĐ-VKS\" — DIRECT_SLOT / HIGH)",
  },
  "agency.diaDanh": {
    label: "Địa danh ban hành QĐ tách vụ án",
    placeholder:
      "Địa danh ban hành (P0007 \", ngày\" + P0008 \"tháng\" + P0009 \"năm 20\" event-date sequence + P0056 \"Ghi địa danh là tên tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành\" — DIRECT_SLOT / HIGH)",
  },
} as const;

const BM143_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "",
  "document.soQuyet": "",
  "agency.diaDanh": "",
} as const;

const BM143_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-143",
  versionLabel:
    "BM-143 runtime-ux profile — QĐ tách vụ án hình sự trong giai đoạn truy tố",
  sections: BM143_SECTIONS,
  fields: BM143_FIELDS,
  demo: BM143_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin QĐ tách vụ án hình sự trong giai đoạn truy tố",
      description:
        "Thông tin QĐ tách vụ án hình sự trong giai đoạn truy tố của Viện kiểm sát. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ và địa danh ban hành.",
      fieldKeys: ["agency.vienKiem", "document.soQuyet", "agency.diaDanh"],
    },
  ],
};

registerRuntimeUxProfile(BM143_RUNTIME_UX_PROFILE);
