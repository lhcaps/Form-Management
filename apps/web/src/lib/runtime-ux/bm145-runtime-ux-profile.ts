/**
 * BM-145 runtime-ux curated profile — QĐ trả hồ sơ vụ án để điều
 * tra bổ sung (prosecution-stage decision: return case file for
 * supplementary investigation).
 *
 * CURATION (GATE C of the current turn):
 *   - 21 compiled fields, all TEXT / TEXTAREA.
 *   - 5 compiled sections (section-co-quan-va-van-ban,
 *     section-can-cu-phap-ly, section-noi-dung-quyet-inh,
 *     section-noi-nhan, section-chu-ky) — preserved verbatim.
 *   - Title: compiled contract title preserved verbatim ("QĐ trả hồ
 *     sơ vụ án để điều tra bổ sung").
 *   - Document family: QUYẾT ĐỊNH (prosecution-stage decision).
 *   - Procedure subfamily: trả hồ sơ vụ án để điều tra bổ sung —
 *     BLTTHS Điều 245 (viện kiểm sát trả) hoặc Điều 246 (tòa án trả).
 *   - Operative verb at DOCX P0011: "TRẢ HỒ SƠ VỤ ÁN ĐỂ ĐIỀU TRA BỔ
 *     SUNG" (TRẢ).
 *   - Source-backed number suffix: P0004 "/QĐ-VKS".
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-145.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-145__fc22267f4a63.extract.md
 *
 * Compatibility mapping (authoritative for this curation turn; historical
 * keys remain unchanged, only presentation labels are source-aligned):
 *
 *   Agency and venue:
 *     - agency.parentName → "Cơ quan cấp trên trực tiếp của Viện kiểm
 *       sát ban hành" (P0048 "Ghi tên Viện kiểm sát cấp trên trực
 *       tiếp" — FOOTNOTE / MEDIUM).
 *     - agency.name → "Tên Viện kiểm sát ban hành QĐ trả hồ sơ"
 *       (P0049 "Ghi tên Viện kiểm sát ban hành" + P0050 "Viết tắt
 *       tên Viện kiểm sát ban hành - đơn vị phụ trách (nếu có)" —
 *       FOOTNOTE / MEDIUM).
 *
 *   Document identity:
 *     - document.documentCode → "Số QĐ trả hồ sơ" (P0003 "Số:" +
 *       P0004 "/QĐ-VKS" — DIRECT_SLOT / HIGH).
 *     - document.issuePlaceAndDateLine → "Địa danh ban hành, ngày
 *       tháng năm ban hành" (P0007 ", ngày" + P0008 "tháng" + P0009
 *       "năm 20" event-date sequence + P0051 "Ghi địa danh là tên
 *       tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành" —
 *       DIRECT_SLOT / HIGH).
 *     - prosecutionSupplementReturn.returnRoundLine → "Vòng trả hồ sơ
 *       (lần thứ mấy)" (P0012 "Lần thứ" + P0013 "VIỆN TRƯỞNG VIỆN
 *       KIỂM SÁT2" — DIRECT_SLOT / HIGH).
 *     - official.issuerTitle → "Chủ thể ban hành QĐ" (P0061 "Ghi
 *       chức danh người ký" — FOOTNOTE / MEDIUM).
 *
 *   Prosecution-stage legal basis cluster:
 *     - prosecutionSupplementReturn.procedureArticlesLine → "Căn cứ
 *       Bộ luật Tố tụng hình sự" (P0014 "Căn cứ các điều 41, 174,
 *       240 và 245" + P0015 "của Bộ luật Tố tụng hình sự" +
 *       P0052 "Trường hợp Tòa án trả hồ sơ điều tra bổ sung thì
 *       thay Điều 245 bằng Điều 246 của Bộ luật Tố tụng hình sự;
 *       trường hợp quyết định trả hồ sơ để điều tra bổ sung đối
 *       với bị can là pháp nhân thì bổ sung căn cứ Điều 431 của Bộ
 *       luật Tố tụng hình sự" — DIRECT_SLOT / HIGH).
 *     - prosecutionSupplementReturn.investigationConclusionLegalBasisLine
 *       → "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy
 *       tố" (P0016 "Căn cứ Bản kết luận điều tra vụ án hình sự đề
 *       nghị truy tố số" + P0017–P0021 conclusion cluster — DIRECT_SLOT
 *       / HIGH).
 *     - prosecutionSupplementReturn.courtReturnDecisionLegalBasisLine
 *       → "Căn cứ Quyết định Tòa án trả hồ sơ" (P0022 "Căn cứ Quyết
 *       định trả hồ sơ vụ án để điều tra bổ sung số" + P0023–P0027
 *       court-return cluster — DIRECT_SLOT / HIGH).
 *     - prosecutionSupplementReturn.reasonLine → "Lý do trả hồ sơ
 *       vụ án để điều tra bổ sung" (P0028 "Xét thấy" + P0029 long-
 *       ellipsis + P0055 "Nêu rõ lý do trả hồ sơ vụ án để điều tra
 *       bổ sung theo quy định tại khoản 1 Điều 245 hoặc khoản 1
 *       Điều 246 của Bộ luật Tố tụng hình sự" — DIRECT_SLOT / HIGH).
 *
 *   Decision body (3 Điều, with optional issues list):
 *     - prosecutionSupplementReturn.article1IntroLine → "Điều 1 -
 *       Mở đầu nội dung trả hồ sơ" (P0031 "Điều 1. Trả hồ sơ vụ
 *       án hình sự" + P0032–P0035 case-offence cluster — DIRECT_SLOT /
 *       HIGH).
 *     - prosecutionSupplementReturn.supplementIssue1Line → "Điều 1
 *       - Vấn đề 1 cần điều tra bổ sung" (P0036 "để điều tra bổ
 *       sung những vấn đề sau:" + P0037 issue-placeholder — DIRECT_SLOT
 *       / HIGH).
 *     - prosecutionSupplementReturn.supplementIssue2Line → "Điều 1
 *       - Vấn đề 2 cần điều tra bổ sung" (P0037 issue-placeholder —
 *       DIRECT_SLOT / HIGH).
 *     - prosecutionSupplementReturn.supplementIssue3Line → "Điều 1
 *       - Vấn đề 3 cần điều tra bổ sung" (P0037 issue-placeholder —
 *       DIRECT_SLOT / HIGH).
 *     - prosecutionSupplementReturn.article2Line → "Điều 2 - Thời
 *       hạn điều tra bổ sung" (P0038 "Điều 2. Thời hạn điều tra
 *       bổ sung không quá" + P0039–P0040 duration cluster —
 *       DIRECT_SLOT / HIGH).
 *     - prosecutionSupplementReturn.article3Line → "Điều 3 - Yêu
 *       cầu thực hiện QĐ" (P0041 "Điều 3. Yêu cầu" + "thực hiện
 *       Quyết định này theo quy định của Bộ luật Tố tụng hình sự" —
 *       DIRECT_SLOT / HIGH).
 *
 *   Recipients:
 *     - prosecutionSupplementReturn.investigationAuthorityRecipientLine
 *       → "Nơi nhận - Cơ quan điều tra tiếp nhận hồ sơ" (P0042
 *       "Nơi nhận:" + P0043 "- ...;" — DIRECT_SLOT / HIGH).
 *     - recipients.archiveLine → "Nơi nhận - Lưu hồ sơ" (P0044 "-
 *       Lưu: HSVA, HSKS, VP." — DIRECT_SLOT / HIGH).
 *
 *   Signature:
 *     - signature.signMode → "Chế độ ký" (P0047 "(Ký, ghi rõ họ
 *       tên, đóng dấu)" — DIRECT_SLOT / HIGH).
 *     - signature.positionTitle → "Chức vụ người ký" (P0061 "Ghi
 *       chức danh người ký" — FOOTNOTE / MEDIUM).
 *     - signature.signerName → "Họ tên người ký QĐ" (P0047 "(Ký,
 *       ghi rõ họ tên, đóng dấu)" — DIRECT_SLOT / HIGH).
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0001 "VIỆN KIỂM SÁT" + P0005 "CỘNG HÒA XÃ HỘI CHỦ NGHĨA
 *     VIỆT NAM" + P0006 "Độc lập - Tự do - Hạnh phúc" — agency
 *     banner (decorative).
 *   - P0010 "QUYẾT ĐỊNH" + P0011 "TRẢ HỒ SƠ VỤ ÁN ĐỂ ĐIỀU TRA BỔ
 *     SUNG" — title block (decorative).
 *   - P0053 "Ghi tên cơ quan, người có thẩm quyền ra Bản kết luận
 *     điều tra" + P0054 "Ghi tên Tòa án ra Quyết định trả hồ sơ vụ
 *     án để điều tra bổ sung" — authority footnotes (decorative).
 *   - P0056 "Ghi rõ khởi tố theo Quyết định khởi tố vụ án hình sự
 *     số" + P0057–P0060 — case-decision precision (decorative).
 *   - P0045 "........................................" + P0046 "..."
 *     — decorative line separators (decorative).
 *   - P0062 "Mẫu số 145/HS" + P0063 + P0064 — template-identity
 *     footer (decorative).
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

const BM145_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản",
    description:
      "Thông tin cơ quan ban hành và văn bản QĐ trả hồ sơ vụ án để điều tra bổ sung. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, vòng trả hồ sơ, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "Căn cứ pháp lý",
    description:
      "Các căn cứ pháp lý cho QĐ trả hồ sơ: căn cứ Bộ luật Tố tụng hình sự, căn cứ Kết luận điều tra, căn cứ Quyết định Tòa án trả hồ sơ, lý do trả hồ sơ.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "Nội dung quyết định",
    description:
      "Nội dung 3 Điều của QĐ trả hồ sơ: Điều 1 (mở đầu + tối đa 3 vấn đề cần điều tra bổ sung), Điều 2 (thời hạn điều tra bổ sung), Điều 3 (yêu cầu thực hiện).",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description:
      "Danh sách nơi nhận QĐ trả hồ sơ: Cơ quan điều tra tiếp nhận hồ sơ, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Chữ ký",
    description:
      "Thông tin chế độ ký, chức vụ và họ tên người ký QĐ.",
  },
] as const;

const BM145_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên trực tiếp của Viện kiểm sát ban hành",
    placeholder:
      "Cơ quan cấp trên (P0048 \"Ghi tên Viện kiểm sát cấp trên trực tiếp\" — FOOTNOTE / MEDIUM)",
  },
  "agency.name": {
    label: "Tên Viện kiểm sát ban hành QĐ trả hồ sơ",
    placeholder:
      "Tên Viện kiểm sát ban hành (P0049 \"Ghi tên Viện kiểm sát ban hành\" + P0050 \"Viết tắt tên Viện kiểm sát ban hành - đơn vị phụ trách (nếu có)\" — FOOTNOTE / MEDIUM)",
  },
  "document.documentCode": {
    label: "Số QĐ trả hồ sơ",
    placeholder:
      "Số QĐ (P0003 \"Số:\" + P0004 \"/QĐ-VKS\" — DIRECT_SLOT / HIGH)",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh ban hành, ngày tháng năm ban hành",
    placeholder:
      "Địa danh + ngày ban hành (P0007 \", ngày\" + P0008 \"tháng\" + P0009 \"năm 20\" event-date sequence + P0051 \"Ghi địa danh là tên tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành\" — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.returnRoundLine": {
    label: "Vòng trả hồ sơ (lần thứ mấy)",
    placeholder:
      "Vòng trả hồ sơ (P0012 \"Lần thứ\" + P0013 \"VIỆN TRƯỞNG VIỆN KIỂM SÁT2\" — DIRECT_SLOT / HIGH)",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành QĐ",
    placeholder:
      "Chủ thể ban hành (P0061 \"Ghi chức danh người ký\" — FOOTNOTE / MEDIUM)",
  },
  "prosecutionSupplementReturn.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Bộ luật Tố tụng hình sự (P0014 \"Căn cứ các điều 41, 174, 240 và 245\" + P0015 \"của Bộ luật Tố tụng hình sự\" + P0052 \"Trường hợp Tòa án trả hồ sơ điều tra bổ sung thì thay Điều 245 bằng Điều 246...\" — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.investigationConclusionLegalBasisLine": {
    label: "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
    placeholder:
      "Căn cứ Kết luận điều tra (P0016 \"Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số\" + P0017–P0021 conclusion cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.courtReturnDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định Tòa án trả hồ sơ",
    placeholder:
      "Căn cứ Quyết định Tòa án trả hồ sơ (P0022 \"Căn cứ Quyết định trả hồ sơ vụ án để điều tra bổ sung số\" + P0023–P0027 court-return cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.reasonLine": {
    label: "Lý do trả hồ sơ vụ án để điều tra bổ sung",
    placeholder:
      "Lý do trả hồ sơ (P0028 \"Xét thấy\" + P0029 long-ellipsis + P0055 \"Nêu rõ lý do trả hồ sơ vụ án để điều tra bổ sung theo quy định tại khoản 1 Điều 245 hoặc khoản 1 Điều 246 của Bộ luật Tố tụng hình sự\" — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.article1IntroLine": {
    label: "Điều 1 - Mở đầu nội dung trả hồ sơ",
    placeholder:
      "Điều 1 - Mở đầu (P0031 \"Điều 1. Trả hồ sơ vụ án hình sự\" + P0032–P0035 case-offence cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.supplementIssue1Line": {
    label: "Điều 1 - Vấn đề 1 cần điều tra bổ sung",
    placeholder:
      "Vấn đề 1 (P0036 \"để điều tra bổ sung những vấn đề sau:\" + P0037 issue-placeholder — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.supplementIssue2Line": {
    label: "Điều 1 - Vấn đề 2 cần điều tra bổ sung",
    placeholder:
      "Vấn đề 2 (P0037 issue-placeholder — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.supplementIssue3Line": {
    label: "Điều 1 - Vấn đề 3 cần điều tra bổ sung",
    placeholder:
      "Vấn đề 3 (P0037 issue-placeholder — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.article2Line": {
    label: "Điều 2 - Thời hạn điều tra bổ sung",
    placeholder:
      "Điều 2 - Thời hạn điều tra bổ sung (P0038 \"Điều 2. Thời hạn điều tra bổ sung không quá\" + P0039–P0040 duration cluster — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.article3Line": {
    label: "Điều 3 - Yêu cầu thực hiện QĐ",
    placeholder:
      "Điều 3 - Yêu cầu (P0041 \"Điều 3. Yêu cầu\" + \"thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự\" — DIRECT_SLOT / HIGH)",
  },
  "prosecutionSupplementReturn.investigationAuthorityRecipientLine": {
    label: "Nơi nhận - Cơ quan điều tra tiếp nhận hồ sơ",
    placeholder:
      "Nơi nhận - Cơ quan điều tra tiếp nhận hồ sơ (P0042 \"Nơi nhận:\" + P0043 \"- ...;\" — DIRECT_SLOT / HIGH)",
  },
  "recipients.archiveLine": {
    label: "Nơi nhận - Lưu hồ sơ",
    placeholder:
      "Nơi nhận - Lưu hồ sơ (P0044 \"- Lưu: HSVA, HSKS, VP.\" — DIRECT_SLOT / HIGH)",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder:
      "Chế độ ký (P0047 \"(Ký, ghi rõ họ tên, đóng dấu)\" — DIRECT_SLOT / HIGH)",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder:
      "Chức vụ người ký (P0061 \"Ghi chức danh người ký\" — FOOTNOTE / MEDIUM)",
  },
  "signature.signerName": {
    label: "Họ tên người ký QĐ",
    placeholder:
      "Họ tên người ký (P0047 \"(Ký, ghi rõ họ tên, đóng dấu)\" — DIRECT_SLOT / HIGH)",
  },
} as const;

const BM145_DEMO_RUNTIME_UX = {
  "agency.parentName": "",
  "agency.name": "",
  "document.documentCode": "",
  "document.issuePlaceAndDateLine": "",
  "prosecutionSupplementReturn.returnRoundLine": "Lần thứ 02",
  "official.issuerTitle": "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "prosecutionSupplementReturn.procedureArticlesLine": "",
  "prosecutionSupplementReturn.investigationConclusionLegalBasisLine": "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 32/KLĐT ngày 12 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "prosecutionSupplementReturn.courtReturnDecisionLegalBasisLine": "Căn cứ Quyết định trả hồ sơ vụ án số 18/QĐ-TA ngày 25 tháng 3 năm 2026 của Tòa án nhân dân Thành phố Hồ Chí Minh;",
  "prosecutionSupplementReturn.reasonLine": "Qua xem xét hồ sơ vụ án, Tòa án nhân dân nhận thấy cần bổ sung một số tài liệu, chứng cứ và làm rõ một số vấn đề trước khi đưa vụ án ra xét xử;",
  "prosecutionSupplementReturn.article1IntroLine": "Yêu cầu Cơ quan Cảnh sát điều tra tiến hành bổ sung các vấn đề sau đây:",
  "prosecutionSupplementReturn.supplementIssue1Line": "Thu thập bổ sung lời khai của những người làm chứng có liên quan, cụ thể các nhân chứng tại hiện trường vào khoảng 21 giờ ngày 01/3/2026 tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, Thành phố Hồ Chí Minh;",
  "prosecutionSupplementReturn.supplementIssue2Line": "Định giá lại tang vật là tiền mặt và các đồ vật bị tạm giữ để xác định chính xác giá trị tài sản;",
  "prosecutionSupplementReturn.supplementIssue3Line": "",
  "prosecutionSupplementReturn.article2Line": "Thời hạn bổ sung điều tra: 30 ngày kể từ ngày nhận được yêu cầu này.",
  "prosecutionSupplementReturn.article3Line": "Sau khi hoàn thành việc điều tra bổ sung, chuyển hồ sơ vụ án đến Viện Kiểm sát để thực hành quyền công tố và kiểm sát việc tuân theo pháp luật trong hoạt động tư pháp.",
  "prosecutionSupplementReturn.investigationAuthorityRecipientLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "",
  "signature.positionTitle": "",
  "signature.signerName": "",
} as const;

const BM145_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-145",
  versionLabel:
    "BM-145 runtime-ux profile — QĐ trả hồ sơ vụ án để điều tra bổ sung",
  sections: BM145_SECTIONS,
  fields: BM145_FIELDS,
  demo: BM145_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-co-quan-va-van-ban",
      title: "Cơ quan và văn bản",
      description:
        "Thông tin cơ quan ban hành và văn bản QĐ trả hồ sơ vụ án để điều tra bổ sung. Mục ghi nhận cơ quan cấp trên, Viện kiểm sát ban hành, số QĐ, địa danh + ngày tháng năm ban hành, vòng trả hồ sơ, chủ thể ban hành.",
      fieldKeys: [
        "agency.parentName",
        "agency.name",
        "document.documentCode",
        "document.issuePlaceAndDateLine",
        "prosecutionSupplementReturn.returnRoundLine",
        "official.issuerTitle",
      ],
    },
    {
      id: "section-can-cu-phap-ly",
      title: "Căn cứ pháp lý",
      description:
        "Các căn cứ pháp lý cho QĐ trả hồ sơ: căn cứ Bộ luật Tố tụng hình sự, căn cứ Kết luận điều tra, căn cứ Quyết định Tòa án trả hồ sơ, lý do trả hồ sơ.",
      fieldKeys: [
        "prosecutionSupplementReturn.procedureArticlesLine",
        "prosecutionSupplementReturn.investigationConclusionLegalBasisLine",
        "prosecutionSupplementReturn.courtReturnDecisionLegalBasisLine",
        "prosecutionSupplementReturn.reasonLine",
      ],
    },
    {
      id: "section-noi-dung-quyet-inh",
      title: "Nội dung quyết định",
      description:
        "Nội dung 3 Điều của QĐ trả hồ sơ: Điều 1 (mở đầu + tối đa 3 vấn đề cần điều tra bổ sung), Điều 2 (thời hạn điều tra bổ sung), Điều 3 (yêu cầu thực hiện).",
      fieldKeys: [
        "prosecutionSupplementReturn.article1IntroLine",
        "prosecutionSupplementReturn.supplementIssue1Line",
        "prosecutionSupplementReturn.supplementIssue2Line",
        "prosecutionSupplementReturn.supplementIssue3Line",
        "prosecutionSupplementReturn.article2Line",
        "prosecutionSupplementReturn.article3Line",
      ],
    },
    {
      id: "section-noi-nhan",
      title: "Nơi nhận",
      description:
        "Danh sách nơi nhận QĐ trả hồ sơ: Cơ quan điều tra tiếp nhận hồ sơ, lưu hồ sơ.",
      fieldKeys: [
        "prosecutionSupplementReturn.investigationAuthorityRecipientLine",
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

registerRuntimeUxProfile(BM145_RUNTIME_UX_PROFILE);
