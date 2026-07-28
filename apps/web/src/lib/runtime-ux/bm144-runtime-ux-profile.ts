/**
 * BM-144 runtime-ux curated profile — QĐ gia hạn thời hạn QĐ việc
 * truy tố (prosecution-stage decision: extend the deadline of the
 * prosecution decision).
 *
 * CURATION (GATE C of the current turn):
 *   - 17 compiled fields, all TEXT / TEXTAREA.
 *   - 5 compiled sections (section-co-quan-va-van-ban,
 *     section-can-cu-phap-ly, section-noi-dung-quyet-inh,
 *     section-noi-nhan, section-chu-ky) — preserved verbatim.
 *   - Title: compiled contract title preserved verbatim ("QĐ gia hạn
 *     thời hạn QĐ việc truy tố").
 *   - Document family: QUYẾT ĐỊNH (prosecution-stage decision).
 *   - Procedure subfamily: gia hạn thời hạn quyết định việc truy tố —
 *     BLTTHS Điều 240.
 *   - Operative verb at DOCX P0011: "GIA HẠN THỜI HẠN QUYẾT ĐỊNH VIỆC
 *     TRUY TỐ" (GIA HẠN).
 *   - Source-backed number suffix: P0004 "/QĐ-VKS".
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-144.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-144__720233712d47.extract.md
 *
 * Compatibility mapping (authoritative for this curation turn; historical
 * keys remain unchanged, only presentation labels are source-aligned):
 *
 *   Agency and venue:
 *     - agency.parentName → "Cơ quan cấp trên trực tiếp của Viện kiểm sát
 *       ban hành" (P0062 "Ghi tên Viện kiểm sát cấp trên trực tiếp" —
 *       FOOTNOTE / MEDIUM).
 *     - agency.name → "Tên Viện kiểm sát ban hành QĐ gia hạn" (P0063
 *       "Ghi tên Viện kiểm sát ban hành" + P0064 "Viết tắt tên Viện
 *       kiểm sát ban hành - đơn vị phụ trách (nếu có)" — FOOTNOTE /
 *       MEDIUM).
 *
 *   Document identity:
 *     - document.documentCode → "Số QĐ gia hạn" (P0003 "Số:" + P0004
 *       "/QĐ-VKS" — DIRECT_SLOT / HIGH).
 *     - document.issuePlaceAndDateLine → "Địa danh ban hành, ngày
 *       tháng năm ban hành" (P0007 ", ngày" + P0008 "tháng" + P0009
 *       "năm 20" event-date sequence + P0065 "Ghi địa danh là tên
 *       tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành" —
 *       DIRECT_SLOT / HIGH).
 *     - official.issuerTitle → "Chủ thể ban hành QĐ" (P0072 "Ghi chức
 *       danh người ký" — FOOTNOTE / MEDIUM).
 *
 *   Prosecution-stage legal basis cluster:
 *     - prosecutionExtension.procedureArticlesLine → "Căn cứ Bộ luật
 *       Tố tụng hình sự" (P0013 "Căn cứ các điều 41, 236 và 240 của
 *       Bộ luật Tố tụng hình sự" — DIRECT_SLOT / HIGH).
 *     - prosecutionExtension.caseDecisionLegalBasisLine → "Căn cứ
 *       Quyết định khởi tố vụ án hình sự" (P0015 + P0016–P0027 case-
 *       decision cluster — DIRECT_SLOT / HIGH).
 *     - prosecutionExtension.accusedDecisionLegalBasisLine → "Căn cứ
 *       Quyết định khởi tố bị can" (P0028 + P0029–P0041 defendant-
 *       decision cluster — DIRECT_SLOT / HIGH).
 *     - prosecutionExtension.investigationConclusionLegalBasisLine →
 *       "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố"
 *       (P0042 + P0043–P0046 conclusion cluster — DIRECT_SLOT / HIGH).
 *     - prosecutionExtension.reasonLine → "Lý do gia hạn thời hạn
 *       quyết định việc truy tố" (P0047 "Xét thấy" + P0071 "Ghi lý do
 *       gia hạn thời hạn quyết định việc truy tố theo Điều 240 của Bộ
 *       luật Tố tụng hình sự" — DIRECT_SLOT / HIGH via the dedicated
 *       footnote at P0071).
 *     - prosecutionExtension.article1Line → "Điều 1 - Nội dung QĐ
 *       gia hạn" (P0049 "QUYẾT ĐỊNH:" + P0050 "Gia h" + P0051 "ạn
 *       thời hạn quyết định việc truy tố trong thời hạn" + P0052–P0057
 *       duration-event-date cluster — DIRECT_SLOT / HIGH).
 *
 *   Recipients:
 *     - recipients.investigatingAgencyLine → "Nơi nhận - Cơ quan điều
 *       tra" (P0058 "Nơi nhận:" + P0059 "- ...;" — DIRECT_SLOT / HIGH).
 *     - recipients.accusedLine → "Nơi nhận - Bị can" (P0069 "Ghi họ
 *       tên người hoặc tên pháp nhân bị khởi tố" — FOOTNOTE / MEDIUM).
 *     - recipients.archiveLine → "Nơi nhận - Lưu hồ sơ" (P0060 "- Lưu:
 *       HSVA, HSKS, VP." — DIRECT_SLOT / HIGH).
 *
 *   Signature:
 *     - signature.signMode → "Chế độ ký" (P0061 "(Ký, ghi rõ họ tên,
 *       đóng dấu)" — DIRECT_SLOT / HIGH).
 *     - signature.positionTitle → "Chức vụ người ký" (P0072 "Ghi chức
 *       danh người ký" — FOOTNOTE / MEDIUM).
 *     - signature.signerName → "Họ tên người ký QĐ" (P0061 "(Ký, ghi
 *       rõ họ tên, đóng dấu)" — DIRECT_SLOT / HIGH).
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0001 "VIỆN KIỂM SÁT" + P0005 "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT
 *     NAM" + P0006 "Độc lập - Tự do - Hạnh phúc" — agency banner
 *     (decorative).
 *   - P0010 "QUYẾT ĐỊNH" + P0011 "GIA HẠN THỜI HẠN QUYẾT ĐỊNH VIỆC
 *     TRUY TỐ" + P0012 "VIỆN TRƯỞNG VIỆN KIỂM SÁT2" — title block
 *     (decorative).
 *   - P0014 "Căn cứ Điều 129 của Luật Tư pháp người chưa thành niên"
 *     + P0066 "Chỉ ghi căn cứ này trong trường hợp vụ án có bị can là
 *     người chưa thành niên" — juvenile-conditional BLTTHS / Luật TPN
 *     basis (decorative; recorded in provenance only).
 *   - P0019–P0026 amendment cluster — case-decision amendment (decorative).
 *   - P0032–P0041 amendment cluster — defendant-decision amendment
 *     (decorative).
 *   - P0048 "..................," — narrative preamble placeholder
 *     (decorative).
 *   - P0067 "Ghi tên cơ quan, người có thẩm quyền ra Quyết định khởi
 *     tố vụ án hình sự" + P0068 "Ghi tên cơ quan, người có thẩm quyền
 *     ra Quyết định khởi tố bị can" — authority footnotes (decorative).
 *   - P0070 "Ghi tên cơ quan, người có thẩm quyền ra Bản kết luận điều
 *     tra" — investigation-authority footnote (decorative).
 *   - P0073 "Mẫu số 144/HS" + P0074 + P0075 — template-identity footer
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

const BM144_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Thông tin cơ quan ban hành và văn bản QĐ gia hạn thời hạn QĐ việc truy tố. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Các căn cứ pháp lý cho QĐ gia hạn: căn cứ Bộ luật Tố tụng hình sự, căn cứ quyết định khởi tố vụ án, căn cứ quyết định khởi tố bị can, căn cứ Kết luận điều tra, lý do gia hạn.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Nội dung Điều 1 của QĐ gia hạn thời hạn quyết định việc truy tố, bao gồm khoảng thời hạn gia hạn cụ thể.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Danh sách nơi nhận QĐ gia hạn: cơ quan điều tra, bị can, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Thông tin chế độ ký, chức vụ và họ tên người ký QĐ.",
  },
] as const;

const BM144_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên trực tiếp của Viện kiểm sát ban hành",
    placeholder:
      "Cơ quan cấp trên (P0062 \"Ghi tên Viện kiểm sát cấp trên trực tiếp\" — FOOTNOTE / MEDIUM)",
  },
  "agency.name": {
    label: "Tên Viện kiểm sát ban hành QĐ gia hạn",
    placeholder:
      "Tên Viện kiểm sát ban hành (P0063 \"Ghi tên Viện kiểm sát ban hành\" + P0064 \"Viết tắt tên Viện kiểm sát ban hành - đơn vị phụ trách (nếu có)\" — FOOTNOTE / MEDIUM)",
  },
  "document.documentCode": {
    label: "Số QĐ gia hạn",
    placeholder:
      "Số QĐ (P0003 \"Số:\" + P0004 \"/QĐ-VKS\" — DIRECT_SLOT / HIGH)",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh ban hành, ngày tháng năm ban hành",
    placeholder:
      "Địa danh + ngày ban hành (P0007 \", ngày\" + P0008 \"tháng\" + P0009 \"năm 20\" event-date sequence + P0065 \"Ghi địa danh là tên tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành\" — DIRECT_SLOT / HIGH)",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành QĐ",
    placeholder:
      "Chủ thể ban hành (P0072 \"Ghi chức danh người ký\" — FOOTNOTE / MEDIUM)",
  },
  "prosecutionExtension.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Bộ luật Tố tụng hình sự (P0013 \"Căn cứ các điều 41, 236 và 240 của Bộ luật Tố tụng hình sự\" — DIRECT_SLOT / HIGH)",
  },
  "prosecutionExtension.caseDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định khởi tố vụ án hình sự",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án (P0015 + P0016–P0027 case-decision cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionExtension.accusedDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định khởi tố bị can",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can (P0028 + P0029–P0041 defendant-decision cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionExtension.investigationConclusionLegalBasisLine": {
    label: "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
    placeholder:
      "Căn cứ Kết luận điều tra (P0042 + P0043–P0046 conclusion cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionExtension.reasonLine": {
    label: "Lý do gia hạn thời hạn quyết định việc truy tố",
    placeholder:
      "Lý do gia hạn (P0047 \"Xét thấy\" + P0071 \"Ghi lý do gia hạn thời hạn quyết định việc truy tố theo Điều 240 của Bộ luật Tố tụng hình sự\" — DIRECT_SLOT / HIGH)",
  },
  "prosecutionExtension.article1Line": {
    label: "Điều 1 - Nội dung QĐ gia hạn",
    placeholder:
      "Điều 1 - Nội dung QĐ gia hạn (P0049 \"QUYẾT ĐỊNH:\" + P0050 + P0051 \"Gia hạn thời hạn quyết định việc truy tố trong thời hạn\" + P0052–P0057 duration-event-date cluster — DIRECT_SLOT / HIGH)",
  },
  "recipients.investigatingAgencyLine": {
    label: "Nơi nhận - Cơ quan điều tra",
    placeholder:
      "Nơi nhận - Cơ quan điều tra (P0058 \"Nơi nhận:\" + P0059 \"- ...;\" — DIRECT_SLOT / HIGH)",
  },
  "recipients.accusedLine": {
    label: "Nơi nhận - Bị can",
    placeholder:
      "Nơi nhận - Bị can (P0069 \"Ghi họ tên người hoặc tên pháp nhân bị khởi tố\" — FOOTNOTE / MEDIUM)",
  },
  "recipients.archiveLine": {
    label: "Nơi nhận - Lưu hồ sơ",
    placeholder:
      "Nơi nhận - Lưu hồ sơ (P0060 \"- Lưu: HSVA, HSKS, VP.\" — DIRECT_SLOT / HIGH)",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder:
      "Chế độ ký (P0061 \"(Ký, ghi rõ họ tên, đóng dấu)\" — DIRECT_SLOT / HIGH)",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder:
      "Chức vụ người ký (P0072 \"Ghi chức danh người ký\" — FOOTNOTE / MEDIUM)",
  },
  "signature.signerName": {
    label: "Họ tên người ký QĐ",
    placeholder:
      "Họ tên người ký (P0061 \"(Ký, ghi rõ họ tên, đóng dấu)\" — DIRECT_SLOT / HIGH)",
  },
} as const;

const BM144_DEMO_RUNTIME_UX = {
  "agency.parentName": "",
  "agency.name": "",
  "document.documentCode": "",
  "document.issuePlaceAndDateLine": "",
  "official.issuerTitle": "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "prosecutionExtension.procedureArticlesLine": "",
  "prosecutionExtension.caseDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án hình sự số 22/QĐ-CQĐT ngày 18 tháng 3 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionExtension.accusedDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 23/QĐ-CQĐT ngày 18 tháng 3 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionExtension.investigationConclusionLegalBasisLine": "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 30/KLĐT ngày 30 tháng 3 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionExtension.reasonLine": "Do vụ án có nhiều tình tiết phức tạp, liên quan đến nhiều đối tượng, nhiều địa bàn cần xác minh bổ sung; chưa thể hoàn thất việc điều tra trong thời hạn luật định;",
  "prosecutionExtension.article1Line": "Gia hạn thời hạn điều tra vụ án hình sự số 22/HS-VKS-KV7 thêm 02 tháng, kể từ ngày 18 tháng 5 năm 2026 đến ngày 18 tháng 7 năm 2026.",
  "recipients.investigatingAgencyLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "recipients.accusedLine": "Bị can Nguyễn Văn An;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "",
  "signature.positionTitle": "",
  "signature.signerName": "",
} as const;

const BM144_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-144",
  versionLabel:
    "BM-144 runtime-ux profile — QĐ gia hạn thời hạn QĐ việc truy tố",
  sections: BM144_SECTIONS,
  fields: BM144_FIELDS,
  demo: BM144_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-co-quan-va-van-ban",
      title: "Cơ quan và văn bản",
      description:
        "Thông tin cơ quan ban hành và văn bản QĐ gia hạn thời hạn QĐ việc truy tố. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
      fieldKeys: [
        "agency.parentName",
        "agency.name",
        "document.documentCode",
        "document.issuePlaceAndDateLine",
        "official.issuerTitle",
      ],
    },
    {
      id: "section-can-cu-phap-ly",
      title: "Căn cứ pháp lý",
      description:
        "Các căn cứ pháp lý cho QĐ gia hạn: căn cứ Bộ luật Tố tụng hình sự, căn cứ quyết định khởi tố vụ án, căn cứ quyết định khởi tố bị can, căn cứ Kết luận điều tra, lý do gia hạn.",
      fieldKeys: [
        "prosecutionExtension.procedureArticlesLine",
        "prosecutionExtension.caseDecisionLegalBasisLine",
        "prosecutionExtension.accusedDecisionLegalBasisLine",
        "prosecutionExtension.investigationConclusionLegalBasisLine",
        "prosecutionExtension.reasonLine",
      ],
    },
    {
      id: "section-noi-dung-quyet-inh",
      title: "Nội dung quyết định",
      description:
        "Nội dung Điều 1 của QĐ gia hạn thời hạn quyết định việc truy tố, bao gồm khoảng thời hạn gia hạn cụ thể.",
      fieldKeys: ["prosecutionExtension.article1Line"],
    },
    {
      id: "section-noi-nhan",
      title: "Nơi nhận",
      description:
        "Danh sách nơi nhận QĐ gia hạn: cơ quan điều tra, bị can, lưu hồ sơ.",
      fieldKeys: [
        "recipients.investigatingAgencyLine",
        "recipients.accusedLine",
        "recipients.archiveLine",
      ],
    },
    {
      id: "section-chu-ky",
      title: "Chữ ký",
      description:
        "Thông tin chế độ ký, chức vụ và họ tên người ký QĐ.",
      fieldKeys: [
        "signature.signMode",
        "signature.positionTitle",
        "signature.signerName",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM144_RUNTIME_UX_PROFILE);
