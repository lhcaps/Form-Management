/**
 * BM-142 runtime-ux curated profile — Quyết định nhập vụ án hình sự
 * trong giai đoạn truy tố (prosecution-stage decision: merge criminal
 * cases under prosecution).
 *
 * CURATION (GATE C of the current turn):
 *   - 5 compiled fields, all TEXT.
 *   - 1 compiled section (`section-thong-tin-bieu-mau`); the auto-generated
 *     profile emitted one phantom description-less section.
 *   - Title: compiled contract title preserved verbatim ("Quyết định
 *     nhập vụ án hình sự trong giai đoạn truy tố").
 *   - Document family: QUYẾT ĐỊNH (prosecution-stage decision).
 *   - Procedure subfamily: nhập vụ án hình sự — BLTTHS Điều 41 và
 *     khoản 1 Điều 242.
 *   - Operative verb at DOCX P0011: "NHẬP VỤ ÁN HÌNH SỰ" (NHẬP).
 *   - Source-backed number suffix: P0006 "/QĐ-VKS".
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-142.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-142__02d373abb354.extract.md
 *
 * Compatibility mapping (authoritative for this curation turn; historical
 * keys remain unchanged, only presentation labels are source-aligned):
 *
 *   Agency and venue:
 *     - agency.vienKiem → "Tên Viện kiểm sát ban hành QĐ nhập vụ án"
 *       (P0058 "Ghi tên Viện kiểm sát cấp trên trực tiếp" + P0059 "Ghi
 *       tên Viện kiểm sát ban hành" + P0060 "Viết tắt tên Viện kiểm
 *       sát ban hành - đơn vị phụ trách (nếu có)" — FOOTNOTE / MEDIUM).
 *     - agency.diaDanh → "Địa danh ban hành QĐ nhập vụ án" (P0007 ", ngày"
 *       + P0008 "tháng" + P0009 "năm 20" event-date sequence + P0061 "Ghi
 *       địa danh là tên tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát
 *       ban hành" — DIRECT_SLOT / HIGH).
 *     - agency.dongDia → "Dòng địa danh bổ sung (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — no combined locality line
 *       exists in the extract; P0058 is an authority-name footnote and
 *       P0061 is a locality marker).
 *
 *   Document identity:
 *     - document.soQuyet → "Số QĐ nhập vụ án" (P0005 "Số:" + P0006
 *       "/QĐ-VKS" — DIRECT_SLOT / HIGH).
 *     - document.ngayBan → "Ngày ban hành QĐ nhập vụ án" (P0007 ", ngày"
 *       + P0008 "tháng" + P0009 "năm 20" event-date sequence — DIRECT_SLOT
 *       / HIGH).
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0001 "VIỆN KIỂM SÁT" + P0003 "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT
 *     NAM" + P0004 "Độc lập - Tự do - Hạnh phúc" — agency banner
 *     (decorative; recorded in provenance only).
 *   - P0010 "QUYẾT ĐỊNH" + P0011 "NHẬP VỤ ÁN HÌNH SỰ" + P0012 "VIỆN
 *     TRƯỞNG VIỆN KIỂM SÁT2" — title block (decorative; recorded in
 *     provenance only).
 *   - P0013 "Căn cứ Điều 41 và khoản 1 Điều 242 của Bộ luật Tố tụng
 *     hình sự" — BLTTHS legal basis (no own contract field; recorded
 *     in provenance as legalWorkflowSourceSlots entry).
 *   - P0014 "Căn cứ Quyết định khởi tố vụ án hình sự số" + P0015–P0017
 *     event-date cluster — case-decision basis (decorative; no contract
 *     field).
 *   - P0018–P0026 amendment cluster — case-decision amendment (decorative).
 *   - P0027 "Căn cứ Quyết định khởi tố vụ án hình sự số" + P0028–P0035
 *     merge-target event-date cluster — merge-target case-decision
 *     basis (decorative).
 *   - P0036–P0039 "về tội/quy định tại khoản/Điều/của Bộ luật Hình sự"
 *     — offence mapping (decorative).
 *   - P0040 "Xét thấy" + P0041 "....," — narrative preamble (decorative).
 *   - P0042 "QUYẾT ĐỊNH:" + P0043 "Nhập vụ án hình sự theo Quyết định
 *     khởi tố vụ án hình sự số" + P0044–P0052 merge-target event-date
 *     cluster + P0053 "Nay gọi chung là vụ án" — body block (decorative;
 *     no contract field).
 *   - P0054 "Nơi nhận:" + P0055 "- ............................;" +
 *     P0056 "- Lưu: HSVA, HSKS, VP." + P0057 "(Ký, ghi rõ họ tên,
 *     đóng dấu)" — distribution block (decorative; no contract field).
 *   - P0062–P0066 case-decision authority footnotes — case-decision
 *     source-anchor (decorative).
 *   - P0067 "Nếu nhiều vụ án được nhập với nhau thì ghi theo thứ tự thời
 *     gian vụ án được khởi tố" — multi-case merge ordering (decorative).
 *   - P0068 "Ghi chức danh người ký" — signatory authority footnote
 *     (decorative).
 *   - P0069 "Mẫu số 142/HS" + P0070 "Ban hành theo Thông tư số
 *     /2026/TT-VKSTC" + P0071 "ngày / /2026" — template-identity footer
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

const BM142_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin QĐ nhập vụ án hình sự trong giai đoạn truy tố",
    description:
      "Thông tin QĐ nhập vụ án hình sự trong giai đoạn truy tố của Viện kiểm sát. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, địa danh ban hành, ngày ban hành và dòng địa danh bổ sung (nếu hồ sơ có).",
  },
] as const;

const BM142_FIELDS = {
  "agency.vienKiem": {
    label: "Tên Viện kiểm sát ban hành QĐ nhập vụ án",
    placeholder:
      "Tên Viện kiểm sát ban hành (P0058 \"Ghi tên Viện kiểm sát cấp trên trực tiếp\" + P0059 \"Ghi tên Viện kiểm sát ban hành\" + P0060 \"Viết tắt tên Viện kiểm sát ban hành - đơn vị phụ trách (nếu có)\" — FOOTNOTE / MEDIUM)",
  },
  "document.soQuyet": {
    label: "Số QĐ nhập vụ án",
    placeholder:
      "Số QĐ (P0005 \"Số:\" + P0006 \"/QĐ-VKS\" — DIRECT_SLOT / HIGH)",
  },
  "agency.diaDanh": {
    label: "Địa danh ban hành QĐ nhập vụ án",
    placeholder:
      "Địa danh ban hành (P0007 \", ngày\" + P0008 \"tháng\" + P0009 \"năm 20\" event-date sequence + P0061 \"Ghi địa danh là tên tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành\" — DIRECT_SLOT / HIGH)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành QĐ nhập vụ án",
    placeholder:
      "Ngày ban hành (P0007 \", ngày\" + P0008 \"tháng\" + P0009 \"năm 20\" event-date sequence — DIRECT_SLOT / HIGH)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh bổ sung (nếu hồ sơ có)",
    placeholder:
      "Dòng địa danh bổ sung (nếu hồ sơ có) (CONTRACT_ONLY_NO_DOCX_SLOT — P0058 là chú thích tên cơ quan, P0061 là chú thích địa danh; không có đoạn địa danh kết hợp trực tiếp trong trích đoạn)",
  },
} as const;

const BM142_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "",
  "document.soQuyet": "",
  "agency.diaDanh": "",
  "document.ngayBan": "",
  "agency.dongDia": "",
} as const;

const BM142_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-142",
  versionLabel:
    "BM-142 runtime-ux profile — QĐ nhập vụ án hình sự trong giai đoạn truy tố",
  sections: BM142_SECTIONS,
  fields: BM142_FIELDS,
  demo: BM142_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin QĐ nhập vụ án hình sự trong giai đoạn truy tố",
      description:
        "Thông tin QĐ nhập vụ án hình sự trong giai đoạn truy tố của Viện kiểm sát. Mục ghi nhận tên Viện kiểm sát ban hành, số QĐ, địa danh ban hành, ngày ban hành và dòng địa danh bổ sung (nếu hồ sơ có).",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM142_RUNTIME_UX_PROFILE);
