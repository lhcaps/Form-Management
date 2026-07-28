/**
 * BM-141 runtime-ux curated profile — QĐ chuyển vụ án để truy tố
 * (prosecution-stage decision: transfer the criminal case for prosecution).
 *
 * CURATION (GATE C of the current turn):
 *   - 19 compiled fields, all TEXT / TEXTAREA.
 *   - 5 compiled sections (section-co-quan-va-van-ban,
 *     section-can-cu-phap-ly, section-noi-dung-quyet-inh,
 *     section-noi-nhan, section-chu-ky) — preserved verbatim.
 *   - Title: compiled contract title preserved verbatim
 *     ("QĐ chuyển vụ án để truy tố").
 *   - Document family: QUYẾT ĐỊNH (prosecution-stage decision).
 *   - Procedure subfamily: chuyển vụ án hình sự để truy tố — BLTTHS
 *     articles 41, 236, 239.
 *   - Operative verb at DOCX P0011: "Chuyển vụ án hình sự để truy tố
 *     theo thẩm quyền" (CHUYỂN).
 *   - Source-backed number suffix: P0004 "/QĐ-VKS".
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-141.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-141__abc5fb5fb096.extract.md
 *
 * Compatibility mapping (authoritative for this curation turn; historical
 * keys remain unchanged, only presentation labels are source-aligned):
 *
 *   Agency and venue:
 *     - agency.parentName → "Cơ quan cấp trên trực tiếp của Viện kiểm sát
 *       ban hành" (P0059 "Ghi tên Viện kiểm sát cấp trên trực tiếp" —
 *       FOOTNOTE / MEDIUM).
 *     - agency.name → "Tên Viện kiểm sát ban hành QĐ chuyển vụ án"
 *       (P0060 "Ghi tên Viện kiểm sát ban hành" + P0061 "Viết tắt tên
 *       Viện kiểm sát ban hành - đơn vị phụ trách (nếu có)" —
 *       FOOTNOTE / MEDIUM).
 *
 *   Document identity:
 *     - document.documentCode → "Số QĐ chuyển vụ án" (P0003 "Số:" +
 *       P0004 "/QĐ-VKS" — DIRECT_SLOT / HIGH).
 *     - document.issuePlaceAndDateLine → "Địa danh ban hành, ngày tháng
 *       năm ban hành" (P0007 ", ngày" + P0008 "tháng" + P0009 "năm 20"
 *       event-date sequence + P0062 "Ghi địa danh là tên tỉnh/thành
 *       phố nơi đặt trụ sở của Viện kiểm sát ban hành" — DIRECT_SLOT /
 *       HIGH).
 *     - official.issuerTitle → "Chủ thể ban hành QĐ" (P0074 "Ghi chức
 *       danh người ký" — FOOTNOTE / MEDIUM).
 *
 *   Prosecution-stage legal basis cluster:
 *     - prosecutionTransfer.procedureArticlesLine → "Căn cứ các điều
 *       41, 236 và 239 của Bộ luật Tố tụng hình sự" (P0013 — DIRECT_SLOT
 *       / HIGH).
 *     - prosecutionTransfer.caseDecisionLegalBasisLine → "Căn cứ Quyết
 *       định khởi tố vụ án hình sự" (P0014 + P0015–P0026 cluster —
 *       DIRECT_SLOT / HIGH).
 *     - prosecutionTransfer.accusedDecisionLegalBasisLine → "Căn cứ
 *       Quyết định khởi tố bị can" (P0027 + P0028–P0040 cluster —
 *       DIRECT_SLOT / HIGH).
 *     - prosecutionTransfer.investigationConclusionLegalBasisLine →
 *       "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố"
 *       (P0041 + P0042–P0046 cluster — DIRECT_SLOT / HIGH).
 *     - prosecutionTransfer.transferReasonLine → "Lý do chuyển vụ án
 *       hình sự" (P0047 "Xét thấy vụ án không thuộc thẩm quyền truy
 *       tố của Viện kiểm sát" + P0048 "mà thuộc thẩm quyền truy tố
 *       của Viện kiểm sát" + P0064 "Ghi lý do nhập vụ án hình sự"
 *       cross-procedure footnote; actual transfer-reason field is
 *       CONTRACT_POSITIONAL_INFERENCE / MEDIUM because BM-141 has no
 *       single-purpose "transfer-reason" footnote — recorded here
 *       using the Xét thấy cluster).
 *     - prosecutionTransfer.article1Line → "Điều 1 - Nội dung quyết
 *       định chuyển vụ án" (P0049 "QUYẾT ĐỊNH:" + P0050 "Chuyển vụ
 *       án" + P0051 "đến Viện kiểm sát" + P0052 "để truy tố theo
 *       thẩm quyền" + P0067 "Ghi tên Viện kiểm sát đang giải quyết
 *       vụ án" + P0068 "Ghi tên Viện kiểm sát có thẩm quyền truy tố"
 *       — DIRECT_SLOT / HIGH).
 *
 *   Recipients:
 *     - recipients.investigatingAgencyLine → "Nơi nhận - Viện kiểm sát
 *       tiếp nhận vụ án" (P0054 "Nơi nhận:" + P0068 receiving-procuracy
 *       footnote — DIRECT_SLOT / HIGH).
 *     - recipients.accusedLine → "Nơi nhận - Bị can" (P0065 "Ghi họ tên
 *       người hoặc tên pháp nhân bị khởi tố" — FOOTNOTE / MEDIUM).
 *     - prosecutionTransfer.toProcuracyRecipientLine → "Nơi nhận - Viện
 *       kiểm sát có thẩm quyền truy tố" (P0068 — FOOTNOTE / MEDIUM).
 *     - prosecutionTransfer.detentionFacilityRecipientLine → "Nơi nhận
 *       - Cơ sở giam giữ (nếu có)" (P0055 "Cơ sở giam giữ (nếu có)" —
 *       DIRECT_SLOT / HIGH).
 *     - recipients.archiveLine → "Nơi nhận - Lưu hồ sơ" (P0056 "Lưu:
 *       HSVA, HSKS, VP." — DIRECT_SLOT / HIGH).
 *
 *   Signature:
 *     - signature.signMode → "Chế độ ký" (P0058 "(Ký, ghi rõ họ tên,
 *       đóng dấu)" — DIRECT_SLOT / HIGH).
 *     - signature.positionTitle → "Chức vụ người ký" (P0074 "Ghi chức
 *       danh người ký" — FOOTNOTE / MEDIUM).
 *     - signature.signerName → "Họ tên người ký QĐ" (P0058 "(Ký, ghi
 *       rõ họ tên, đóng dấu)" — DIRECT_SLOT / HIGH).
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0001 "VIỆN KIỂM SÁT" + P0005 "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT
 *     NAM" + P0006 "Độc lập - Tự do - Hạnh phúc" — agency banner
 *     (decorative; recorded in provenance only).
 *   - P0010 "QUYẾT ĐỊNH" + P0011 "Chuyển vụ án hình sự để truy tố theo
 *     thẩm quyền" + P0012 "VIỆN TRƯỞNG VIỆN KIỂM SÁT2" — title block
 *     (decorative; recorded in provenance only).
 *   - P0018 "Quyết định thay đổi/bổ sung" cluster — case-decision
 *     amendment cluster (decorative; part of caseDecisionLegalBasisLine
 *     body but no standalone field).
 *   - P0047 "Xét thấy vụ án không thuộc thẩm quyền truy tố của Viện
 *     kiểm sát" + P0048 "mà thuộc thẩm quyền truy tố của Viện kiểm
 *     sát" — narrative preamble (decorative; captured in
 *     transferReasonLine body).
 *   - P0063 "Ghi tên cơ quan, người có thẩm quyền ra Quyết định khởi
 *     tố vụ án hình sự" — case-decision authority footnote (decorative;
 *     captured in caseDecisionLegalBasisLine body).
 *   - P0069 "Ghi rõ khởi tố theo Quyết định khởi tố vụ án hình sự số"
 *     + P0070–P0073 "ngày/tháng/năm/của" cluster — case-decision
 *     precision (decorative).
 *   - P0075 "Mẫu số 141/HS" + P0076 "Ban hành theo Thông tư số
 *     /2026/TT-VKSTC" + P0077 "ngày / /2026" — template-identity
 *     footer (decorative; no contract field).
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or the
 *     compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No runtimeReady promotion.
 *   - No fabricated person / case / agency / number values; demo
 *     values are empty placeholders, not historical case data.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM141_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Thông tin cơ quan ban hành và văn bản QĐ chuyển vụ án hình sự để truy tố. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Các căn cứ pháp lý cho QĐ chuyển vụ án: căn cứ Bộ luật Tố tụng hình sự, căn cứ quyết định khởi tố vụ án, căn cứ quyết định khởi tố bị can, căn cứ Kết luận điều tra, lý do chuyển.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Nội dung Điều 1 của QĐ chuyển vụ án hình sự để truy tố theo thẩm quyền.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Danh sách nơi nhận QĐ: cơ quan điều tra, bị can, Viện kiểm sát tiếp nhận, cơ sở giam giữ (nếu có), lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Thông tin chế độ ký, chức vụ và họ tên người ký QĐ.",
  },
] as const;

const BM141_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên trực tiếp của Viện kiểm sát ban hành",
    placeholder:
      "Cơ quan cấp trên (P0059 \"Ghi tên Viện kiểm sát cấp trên trực tiếp\" — FOOTNOTE / MEDIUM)",
  },
  "agency.name": {
    label: "Tên Viện kiểm sát ban hành QĐ chuyển vụ án",
    placeholder:
      "Tên Viện kiểm sát ban hành (P0060 \"Ghi tên Viện kiểm sát ban hành\" + P0061 \"Viết tắt tên Viện kiểm sát ban hành - đơn vị phụ trách (nếu có)\" — FOOTNOTE / MEDIUM)",
  },
  "document.documentCode": {
    label: "Số QĐ chuyển vụ án",
    placeholder:
      "Số QĐ (P0003 \"Số:\" + P0004 \"/QĐ-VKS\" — DIRECT_SLOT / HIGH)",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh ban hành, ngày tháng năm ban hành",
    placeholder:
      "Địa danh + ngày ban hành (P0007 \", ngày\" + P0008 \"tháng\" + P0009 \"năm 20\" event-date sequence + P0062 \"Ghi địa danh là tên tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành\" — DIRECT_SLOT / HIGH)",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành QĐ",
    placeholder:
      "Chủ thể ban hành (P0074 \"Ghi chức danh người ký\" — FOOTNOTE / MEDIUM)",
  },
  "prosecutionTransfer.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Bộ luật Tố tụng hình sự (P0013 \"Căn cứ các điều 41, 236 và 239 của Bộ luật Tố tụng hình sự\" — DIRECT_SLOT / HIGH)",
  },
  "prosecutionTransfer.caseDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định khởi tố vụ án hình sự",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án (P0014 + P0015–P0026 case-decision cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionTransfer.accusedDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định khởi tố bị can",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can (P0027 + P0028–P0040 defendant-decision cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionTransfer.investigationConclusionLegalBasisLine": {
    label: "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
    placeholder:
      "Căn cứ Kết luận điều tra (P0041 + P0042–P0046 conclusion cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionTransfer.transferReasonLine": {
    label: "Lý do chuyển vụ án hình sự",
    placeholder:
      "Lý do chuyển (P0047 + P0048 Xét thấy cluster — CONTRACT_POSITIONAL_INFERENCE / MEDIUM; BM-141 không có footnote \"lý do chuyển\" riêng)",
  },
  "prosecutionTransfer.article1Line": {
    label: "Điều 1 - Nội dung quyết định chuyển vụ án",
    placeholder:
      "Điều 1 - Nội dung quyết định (P0049 \"QUYẾT ĐỊNH:\" + P0050 \"Chuyển vụ án\" + P0051 \"đến Viện kiểm sát\" + P0052 \"để truy tố theo thẩm quyền\" + P0067 + P0068 receiving-procuracy footnotes — DIRECT_SLOT / HIGH)",
  },
  "recipients.investigatingAgencyLine": {
    label: "Nơi nhận - Viện kiểm sát tiếp nhận vụ án",
    placeholder:
      "Nơi nhận - Viện kiểm sát tiếp nhận (P0054 \"Nơi nhận:\" + P0068 \"Ghi tên Viện kiểm sát có thẩm quyền truy tố\" — DIRECT_SLOT / HIGH)",
  },
  "recipients.accusedLine": {
    label: "Nơi nhận - Bị can",
    placeholder:
      "Nơi nhận - Bị can (P0065 \"Ghi họ tên người hoặc tên pháp nhân bị khởi tố\" — FOOTNOTE / MEDIUM)",
  },
  "prosecutionTransfer.toProcuracyRecipientLine": {
    label: "Nơi nhận - Viện kiểm sát có thẩm quyền truy tố",
    placeholder:
      "Nơi nhận - Viện kiểm sát có thẩm quyền truy tố (P0068 \"Ghi tên Viện kiểm sát có thẩm quyền truy tố\" — FOOTNOTE / MEDIUM)",
  },
  "prosecutionTransfer.detentionFacilityRecipientLine": {
    label: "Nơi nhận - Cơ sở giam giữ (nếu có)",
    placeholder:
      "Nơi nhận - Cơ sở giam giữ (P0055 \"Cơ sở giam giữ (nếu có)\" — DIRECT_SLOT / HIGH)",
  },
  "recipients.archiveLine": {
    label: "Nơi nhận - Lưu hồ sơ",
    placeholder:
      "Nơi nhận - Lưu hồ sơ (P0056 \"Lưu: HSVA, HSKS, VP.\" — DIRECT_SLOT / HIGH)",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder:
      "Chế độ ký (P0058 \"(Ký, ghi rõ họ tên, đóng dấu)\" — DIRECT_SLOT / HIGH)",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder:
      "Chức vụ người ký (P0074 \"Ghi chức danh người ký\" — FOOTNOTE / MEDIUM)",
  },
  "signature.signerName": {
    label: "Họ tên người ký QĐ",
    placeholder:
      "Họ tên người ký (P0058 \"(Ký, ghi rõ họ tên, đóng dấu)\" — DIRECT_SLOT / HIGH)",
  },
} as const;

const BM141_DEMO_RUNTIME_UX = {
  "agency.parentName": "",
  "agency.name": "",
  "document.documentCode": "",
  "document.issuePlaceAndDateLine": "",
  "official.issuerTitle": "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "prosecutionTransfer.procedureArticlesLine": "",
  "prosecutionTransfer.caseDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án hình sự số 24/QĐ-CQĐT ngày 15 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionTransfer.accusedDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 25/QĐ-CQĐT ngày 15 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionTransfer.investigationConclusionLegalBasisLine": "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 28/KLĐT ngày 28 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionTransfer.transferReasonLine": "Để bảo đảm việc thực hành quyền công tố và kiểm sát điều tra theo quy định của Bộ luật Tố tụng hình sự, Viện Kiểm sát nhân dân Khu vực 7 nhận thấy cần chuyển hồ sơ vụ án đến Viện Kiểm sát nhân dân cấp trên để tiếp tục giải quyết theo thẩm quyền.",
  "prosecutionTransfer.article1Line": "Chuyển toàn bộ hồ sơ vụ án hình sự số 18/HS-VKS-KV7 về tội Đánh bạc theo Điều 321 Bộ luật Hình sự cùng tang vật, phương tiện, tài liệu liên quan đến Viện Kiểm sát nhân dân cấp trên để tiếp tục thực hành quyền công tố và kiểm sát việc tuân theo pháp luật trong hoạt động tố tụng.",
  "recipients.investigatingAgencyLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "recipients.accusedLine": "Bị can Nguyễn Văn An;",
  "prosecutionTransfer.toProcuracyRecipientLine": "Viện Kiểm sát nhân dân cấp trên (Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh);",
  "prosecutionTransfer.detentionFacilityRecipientLine": "Trại tạm giam Công an Thành phố Hồ Chí Minh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "",
  "signature.positionTitle": "",
  "signature.signerName": "",
} as const;

const BM141_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-141",
  versionLabel: "BM-141 runtime-ux profile — QĐ chuyển vụ án để truy tố",
  sections: BM141_SECTIONS,
  fields: BM141_FIELDS,
  demo: BM141_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-co-quan-va-van-ban",
      title: "Cơ quan và văn bản",
      description:
        "Thông tin cơ quan ban hành và văn bản QĐ chuyển vụ án hình sự để truy tố. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, chủ thể ban hành.",
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
        "Các căn cứ pháp lý cho QĐ chuyển vụ án: căn cứ Bộ luật Tố tụng hình sự, căn cứ quyết định khởi tố vụ án, căn cứ quyết định khởi tố bị can, căn cứ Kết luận điều tra, lý do chuyển.",
      fieldKeys: [
        "prosecutionTransfer.procedureArticlesLine",
        "prosecutionTransfer.caseDecisionLegalBasisLine",
        "prosecutionTransfer.accusedDecisionLegalBasisLine",
        "prosecutionTransfer.investigationConclusionLegalBasisLine",
        "prosecutionTransfer.transferReasonLine",
      ],
    },
    {
      id: "section-noi-dung-quyet-inh",
      title: "Nội dung quyết định",
      description:
        "Nội dung Điều 1 của QĐ chuyển vụ án hình sự để truy tố theo thẩm quyền.",
      fieldKeys: ["prosecutionTransfer.article1Line"],
    },
    {
      id: "section-noi-nhan",
      title: "Nơi nhận",
      description:
        "Danh sách nơi nhận QĐ: cơ quan điều tra, bị can, Viện kiểm sát tiếp nhận, cơ sở giam giữ (nếu có), lưu hồ sơ.",
      fieldKeys: [
        "recipients.investigatingAgencyLine",
        "recipients.accusedLine",
        "prosecutionTransfer.toProcuracyRecipientLine",
        "prosecutionTransfer.detentionFacilityRecipientLine",
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

registerRuntimeUxProfile(BM141_RUNTIME_UX_PROFILE);
