/**
 * BM-138 runtime-ux curated profile — Yêu cầu cung cấp tài liệu
 * (request for evidence / procedural documents, investigation stage).
 *
 * CURATION (GATE C of the current turn):
 *   - 7 compiled fields, all TEXT.
 *   - One compiled section `section-thong-tin-bieu-mau`; the pre-curation
 *     profile emitted three phantom sections (section-thong-tin-bieu-mau,
 *     section-chu-the, section-dong-ngay) where two were NEVER declared
 *     in the compiled contract. They have been removed; the curated
 *     profile presents exactly one section with seven compiled fields.
 *   - Title: compiled contract title preserved verbatim
 *     ("Yêu cầu cung cấp tài liệu liên quan đến hành vi, QĐ tố tụng
 *     có vi phạm pháp luật trong điều tra").
 *   - Document family: YÊU CẦU (Procuracy-issued procedural request).
 *   - Procedure subfamily: cung cấp tài liệu — investigation stage.
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-138.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-138__bf31a1f547b0.extract.md
 *
 * Version label policy: a stable identity label without batch / gate /
 * curation / phase / singleton markers. The label is a source /
 * profile identity, not a revision marker.
 * Compatibility mapping (authoritative for this curation turn; historical
 * keys remain unchanged, only presentation labels are source-aligned):
 *
 *   Agency and venue:
 *     - agency.vienKiem → "Viện kiểm sát ban hành yêu cầu"
 *       (P0058 + P0059 + P0060 authority footnotes — FOOTNOTE / MEDIUM).
 *     - agency.diaDanh → "Địa danh ban hành yêu cầu" (P0007 event-date
 *       sequence + P0061 footnote "Ghi địa danh là tên tỉnh/thành phố
 *       nơi đặt trụ sở của Viện kiểm sát ban hành" — DIRECT_SLOT / HIGH).
 *     - agency.dongDia → "Dòng địa danh bổ sung (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — P0058 is an authority-name
 *       footnote and P0061 is a locality marker; no combined locality
 *       line paragraph exists in the extract). Carries "(nếu hồ sơ
 *       có)" suffix.
 *
 *   Document identity:
 *     - document.soQuyet → "Số yêu cầu cung cấp tài liệu" (P0005 "Số:"
 *       + P0006 "/YC-VKS" — DIRECT_SLOT / HIGH). The DOCX carries a
 *       literal "/YC-VKS" suffix token at P0006, so this is a direct
 *       value slot.
 *     - document.ngayBan → "Ngày ban hành yêu cầu" (P0007 ", ngày" +
 *       P0008 "tháng" + P0009 "năm 20" event-date sequence —
 *       DIRECT_SLOT / HIGH).
 *
 *   Requested recipient / scope:
 *     - document.chuThe → "Cơ quan/tổ chức/cá nhân phải cung cấp"
 *       (P0045 "Cơ quan/tổ chức/cá nhân" + P0046 "cung cấp những tài
 *       liệu liên quan đến hành vi, quyết định tố tụng vi phạm pháp
 *       luật trong điều tra" + P0066 "Ghi tên cơ quan/tổ chức/người
 *       có trách nhiệm phải cung cấp tài liệu" — DIRECT_SLOT / HIGH).
 *     - person.tenBi → "Họ tên người hoặc tên pháp nhân bị khởi tố"
 *       (P0064 footnote — FOOTNOTE / MEDIUM). NOT a sibling case name;
 *       this field records the accused/suspect of the underlying case.
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0011 "Cung cấp tài liệu liên quan đến hành vi, quyết định tố
 *     tụng" + P0012 "vi phạm pháp luật trong điều tra" — YÊU CẦU body
 *     header (decorative; recorded in provenance only).
 *   - P0013 "VIỆN TRƯỞNG VIỆN KIỂM SÁT2" — signatory block label
 *     (decorative; recorded in provenance only).
 *   - P0014 "Căn cứ các điều 41, 166 và 167 của Bộ luật Tố tụng hình
 *     sự" — legal basis (no own contract field; recorded in
 *     provenance as legalWorkflowSourceSlots entry).
 *   - P0015–P0027 "Căn cứ Quyết định khởi tố vụ án hình sự số" +
 *     "ngày" + "tháng" + "năm" + "về tội" + "quy định tại khoản" +
 *     "Điều" + "của Bộ luật Hình sự" — first legal-basis cluster
 *     (case-level, decorative; no contract field).
 *   - P0028–P0041 "Căn cứ Quyết định khởi tố bị can số" + suite —
 *     second legal-basis cluster (defendant-level, decorative;
 *     no contract field).
 *   - P0042 "Xét thấy" + P0043 dots — narrative preamble (decorative).
 *   - P0044 "YÊU CẦU:" — request-body header (decorative).
 *   - P0047–P0050 dots — request-item bullet markers (decorative).
 *   - P0051 "Thời hạn cung cấp là" + P0052–P0053 — deadline / receipt
 *     phrasing (decorative; no contract field).
 *   - P0054 "Nơi nhận:" + P0055 "9..." + P0056 "Lưu: HSVA, HSKS, VP."
 *     + P0057 "(Ký, ghi rõ họ tên, đóng dấu)" — distribution block
 *     (decorative; no contract field).
 *   - P0068 "Mẫu số 138/HS" + P0069–P0070 Thông tư footer —
 *     template-identity footer (decorative; no contract field).
 *   - P0071 "EMBED Excel.Chart.8 \s" — embedded chart (decorative).
 * These source slots must not be forced into unrelated contract fields
 * and no extra controls may be added.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or the
 *     compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No runtimeReady promotion.
 *   - No fabricated person / case / agency / number values.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-138.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-138__bf31a1f547b0.extract.md
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM138_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin Yêu cầu cung cấp tài liệu",
    description:
      "Thông tin Yêu cầu cung cấp tài liệu của Viện kiểm sát trong giai đoạn điều tra. Yêu cầu ghi nhận đơn vị ban hành, số yêu cầu, địa danh ban hành, ngày ban hành, cơ quan / tổ chức / cá nhân phải cung cấp và họ tên người hoặc tên pháp nhân bị khởi tố.",
  },
] as const;

const BM138_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát ban hành yêu cầu",
    placeholder:
      "Tên Viện kiểm sát ban hành (P0058 \"Ghi tên Viện kiểm sát cấp trên trực tiếp\" + P0059 \"Ghi tên Viện kiểm sát ban hành\" + P0060 \"Viết tắt tên Viện kiểm sát ban hành - đơn vị phụ trách (nếu có)\")",
  },
  "document.soQuyet": {
    label: "Số yêu cầu cung cấp tài liệu",
    placeholder:
      "Số yêu cầu cung cấp tài liệu (P0005 \"Số:\" + P0006 \"/YC-VKS\" — DIRECT_SLOT / HIGH)",
  },
  "agency.diaDanh": {
    label: "Địa danh ban hành yêu cầu",
    placeholder:
      "Địa danh ban hành yêu cầu (P0007–P0009 event-date sequence + P0061 \"Ghi địa danh là tên tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành\" — DIRECT_SLOT / HIGH)",
  },
  "document.ngayBan": {
    label: "Ngày ban hành yêu cầu",
    placeholder:
      "Ngày ban hành yêu cầu (P0007 \", ngày\" + P0008 \"tháng\" + P0009 \"năm 20\" event-date sequence — DIRECT_SLOT / HIGH)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh bổ sung (nếu hồ sơ có)",
    placeholder:
      "Dòng địa danh bổ sung (nếu hồ sơ có) (CONTRACT_ONLY_NO_DOCX_SLOT — P0058 là chú thích tên cơ quan, P0061 là chú thích địa danh; không có đoạn địa danh kết hợp trực tiếp trong trích đoạn)",
  },
  "document.chuThe": {
    label: "Cơ quan/tổ chức/cá nhân phải cung cấp",
    placeholder:
      "Cơ quan/tổ chức/cá nhân phải cung cấp (P0045 \"Cơ quan/tổ chức/cá nhân\" + P0046 \"cung cấp những tài liệu...\" + P0066 \"Ghi tên cơ quan/tổ chức/người có trách nhiệm phải cung cấp tài liệu\" — DIRECT_SLOT / HIGH)",
  },
  "person.tenBi": {
    label: "Họ tên người hoặc tên pháp nhân bị khởi tố",
    placeholder:
      "Họ tên người hoặc tên pháp nhân bị khởi tố (P0064 \"Ghi họ tên người hoặc tên pháp nhân bị khởi tố\" — FOOTNOTE / MEDIUM)",
  },
} as const;

const BM138_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "",
  "document.soQuyet": "",
  "agency.diaDanh": "",
  "document.ngayBan": "",
  "agency.dongDia": "",
  "document.chuThe": "",
  "person.tenBi": "",
} as const;

const BM138_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-138",
  versionLabel:
    "BM-138 runtime-ux profile — Yêu cầu cung cấp tài liệu",
  sections: BM138_SECTIONS,
  fields: BM138_FIELDS,
  demo: BM138_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin Yêu cầu cung cấp tài liệu",
      description:
        "Thông tin Yêu cầu cung cấp tài liệu của Viện kiểm sát trong giai đoạn điều tra. Yêu cầu ghi nhận đơn vị ban hành, số yêu cầu, địa danh ban hành, ngày ban hành, cơ quan / tổ chức / cá nhân phải cung cấp và họ tên người hoặc tên pháp nhân bị khởi tố.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "document.chuThe",
        "person.tenBi",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM138_RUNTIME_UX_PROFILE);
