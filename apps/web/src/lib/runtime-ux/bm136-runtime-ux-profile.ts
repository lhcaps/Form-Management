/**
 * BM-136 runtime-ux curated profile — Biên bản đối chất
 * (confrontation record between two parties, investigation stage).
 *
 * CURATION (GATE B / Section 7 of the user's task brief):
 *   - 17 compiled fields, all TEXT.
 *   - One compiled section `section-thong-tin-bieu-mau`; the pre-curation
 *     profile emitted four phantom sections (section-chu-the-va-vu-an,
 *     section-can-cu-va-tien, section-chuc-danh-va-luu, section-dong-ngay)
 *     that were never declared in the compiled contract; they have been
 *     removed. The curated profile presents exactly one section.
 *   - Title: "BB đối chất" (compiled title); section title:
 *     "Thông tin biên bản đối chất"; section describes the biên-bản
 *     confrontation record of an investigation-stage procedure between
 *     two parties per Điều 178 + Điều 189 BLTTHS.
 *   - Document family: BIÊN BẢN (matches BM-134 and BM-135 family).
 *   - Procedure subfamily: ĐỐI CHẤT (BLTTHS 2015).
 *
 * Compatibility mapping (authoritative for this curation turn; historical
 * keys remain unchanged, only presentation labels are source-aligned):
 *
 *   Participant ownership:
 *     - recipients.personLine → "Người tiến hành đối chất" (P0012 +
 *       P0013–P0016 officials — CONTRACT_DIRECT_BUT_DOCX_INDIRECT / MEDIUM).
 *     - person.tenBi → "Người tham gia đối chất thứ nhất" (P0018–P0029
 *       first participant block — DIRECT_SLOT / HIGH). NOT called bị can.
 *     - document.chuThe → "Người tham gia đối chất thứ hai" (P0030–P0041
 *       second participant block — CONTRACT_DIRECT_BUT_DOCX_INDIRECT /
 *       HIGH or MEDIUM). Historical generic key reused for the second
 *       participant block.
 *     - signature.nguoiKy → "Người tham gia đối chất khác (nếu có)"
 *       (P0042–P0043 — CONTRACT_POSITIONAL_INFERENCE / MEDIUM). NOT a
 *       signature slot.
 *
 *   Procedural roles:
 *     - signature.chucVu → "Tư cách tham gia tố tụng của các bên đối chất"
 *       (P0029 + P0041 — DIRECT_SLOT / HIGH). Help text explains the
 *       value records the procedural roles of both participants.
 *
 *   Conducting officials:
 *     - signature.positionTitle → "Chức danh người tiến hành đối chất"
 *       (P0014 + P0016 — CONTRACT_POSITIONAL_INFERENCE / MEDIUM).
 *
 *   Agency and venue:
 *     - agency.vienKiem → "Viện kiểm sát thực hiện đối chất"
 *       (P0067 + P0068 authority footnotes — FOOTNOTE / MEDIUM).
 *     - agency.diaDanh → "Địa điểm tiến hành đối chất" (P0011 "tại" —
 *       CONTRACT_POSITIONAL_INFERENCE / MEDIUM). NOT issuing locality.
 *     - document.ngayBan → "Thời điểm bắt đầu đối chất" (P0006–P0010
 *       — DIRECT_SLOT / HIGH). NOT issue date.
 *     - agency.dongDia → "Dòng địa danh bổ sung (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — no source paragraph).
 *
 *   Record identity:
 *     - document.soQuyet → "Số biên bản đối chất"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — no /BB-VKS, no prefix,
 *       no fabricated demo number). Demo uses "(chưa ghi số biên bản)"
 *       placeholder-style text only.
 *
 *   Case compatibility fields:
 *     - document.tenVu → "Tên vụ án hoặc vụ việc (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — no fabricated case demo).
 *     - person.toiDanh → "Tội danh liên quan (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW). Does NOT cite P0029 or
 *       P0041 (procedural roles) as offense evidence.
 *     - document.soTien → "Số tiền liên quan (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW). No fabricated currency.
 *     - document.lyDo → "Lý do bổ sung (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW). Does NOT cite P0043.
 *     - recipients.luuHo → "Thông tin lưu hồ sơ (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW). Does NOT cite P0069.
 *
 *   Residence compatibility field:
 *     - signature.cheDo → "Địa chỉ cư trú của người tham gia đối chất"
 *       (P0019–P0028 + P0031–P0040 include "Nơi thường trú" (P0025,
 *       P0037), "Nơi tạm trú" (P0026, P0038), "Nơi ở hiện tại" (P0027,
 *       P0039) — DIRECT_SLOT or CONTRACT_DIRECT_BUT_DOCX_INDIRECT /
 *       MEDIUM).
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0017: legal-basis and operative introduction
 *     ("Căn cứ Điều 178 và Điều 189 của Bộ luật Tố tụng hình sự,
 *      tiến hành đối chất giữa").
 *   - P0046–P0051: end time of confrontation
 *     ("Việc đối chất kết thúc hồi" + "giờ" + "phút, ngày" + "tháng"
 *      + "năm" + "và đã được ghi âm hoặc ghi hình có âm thanh").
 * These source slots must not be forced into unrelated contract fields
 * and no extra controls may be added.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or the
 *     compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - Demo values for contract-only fields use literal placeholder
 *     strings only — no invented number prefix, no currency, no
 *     fictional offense / archive / reason examples, no /BB-VKS.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-136.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-136__f7c2e28ddd12.extract.md
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM136_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biên bản đối chất",
    description:
      "Thông tin biên bản đối chất của Viện kiểm sát trong giai đoạn điều tra theo Điều 178 và Điều 189 Bộ luật Tố tụng hình sự. Biên bản ghi nhận thời điểm, địa điểm, người tiến hành, hai bên đối chất và các thông tin hồ sơ liên quan.",
  },
] as const;

const BM136_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát thực hiện đối chất",
    placeholder: "Tên Viện kiểm sát (P0067/P0068 cấp trên trực tiếp / ban hành)",
  },
  "signature.positionTitle": {
    label: "Chức danh người tiến hành đối chất",
    placeholder: "Chức danh người tiến hành đối chất (P0014/P0016)",
  },
  "recipients.personLine": {
    label: "Người tiến hành đối chất",
    placeholder:
      "Họ tên + chức danh người tiến hành đối chất (P0012 \"Chúng tôi gồm\" + P0013/P0015 \"Ông/Bà\")",
  },
  "document.soQuyet": {
    label: "Số biên bản đối chất",
    placeholder: "Số biên bản (không có DOCX slot — CONTRACT_ONLY_NO_DOCX_SLOT)",
  },
  "agency.diaDanh": {
    label: "Địa điểm tiến hành đối chất",
    placeholder: "Địa điểm tiến hành đối chất (P0011 \"tại\" — venue marker, không phải địa danh ban hành)",
  },
  "document.ngayBan": {
    label: "Thời điểm bắt đầu đối chất",
    placeholder:
      "Thời điểm bắt đầu đối chất (P0006 \"Vào hồi\" + P0007 \"giờ\" + P0008 \"phút, ngày\" + P0009 \"tháng\" + P0010 \"năm\")",
  },
  "agency.dongDia": {
    label: "Dòng địa danh bổ sung (nếu hồ sơ có)",
    placeholder:
      "Dòng địa danh bổ sung — không có đoạn văn trực tiếp trong DOCX (CONTRACT_ONLY_NO_DOCX_SLOT / LOW)",
  },
  "document.chuThe": {
    label: "Người tham gia đối chất thứ hai",
    placeholder:
      "Người tham gia đối chất thứ hai (P0030–P0041 — khối thông tin bên đối chất thứ hai)",
  },
  "person.tenBi": {
    label: "Người tham gia đối chất thứ nhất",
    placeholder: "Họ tên người tham gia đối chất thứ nhất (P0018–P0029)",
  },
  "document.tenVu": {
    label: "Tên vụ án hoặc vụ việc (nếu hồ sơ có)",
    placeholder:
      "Tên vụ án hoặc vụ việc liên quan — không bắt buộc, tùy hồ sơ (CONTRACT_ONLY_NO_DOCX_SLOT / LOW)",
  },
  "person.toiDanh": {
    label: "Tội danh liên quan (nếu hồ sơ có)",
    placeholder:
      "Tội danh liên quan — không bắt buộc, tùy hồ sơ (CONTRACT_ONLY_NO_DOCX_SLOT / LOW; không diễn giải tư cách tố tụng thành tội danh)",
  },
  "document.soTien": {
    label: "Số tiền liên quan (nếu hồ sơ có)",
    placeholder:
      "Số tiền liên quan — không bắt buộc, tùy hồ sơ (CONTRACT_ONLY_NO_DOCX_SLOT / LOW)",
  },
  "document.lyDo": {
    label: "Lý do bổ sung (nếu hồ sơ có)",
    placeholder:
      "Lý do bổ sung — không bắt buộc, tùy hồ sơ (CONTRACT_ONLY_NO_DOCX_SLOT / LOW)",
  },
  "recipients.luuHo": {
    label: "Thông tin lưu hồ sơ (nếu hồ sơ có)",
    placeholder:
      "Thông tin lưu hồ sơ — không bắt buộc, tùy hồ sơ (CONTRACT_ONLY_NO_DOCX_SLOT / LOW)",
  },
  "signature.cheDo": {
    label: "Địa chỉ cư trú của người tham gia đối chất",
    placeholder:
      "Nơi thường trú / tạm trú / nơi ở hiện tại của người tham gia đối chất (P0025/P0026/P0027 cho bên 1; P0037/P0038/P0039 cho bên 2)",
  },
  "signature.chucVu": {
    label: "Tư cách tham gia tố tụng của các bên đối chất",
    placeholder:
      "Tư cách tham gia tố tụng (P0029 cho bên 1 và P0041 cho bên 2) — giá trị ghi nhận vai trò tố tụng của cả hai bên đối chất",
  },
  "signature.nguoiKy": {
    label: "Người tham gia đối chất khác (nếu có)",
    placeholder:
      "Họ tên những người tham gia tố tụng khác tham gia buổi đối chất nếu có (P0042/P0043)",
  },
} as const;

const BM136_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "signature.positionTitle": "Kiểm sát viên sơ cấp",
  "recipients.personLine": "Nguyễn Văn A",
  "document.soQuyet": "(chưa ghi số biên bản)",
  "agency.diaDanh": "(ghi địa điểm tiến hành đối chất)",
  "document.ngayBan": "(ghi giờ phút, ngày tháng năm theo P0006–P0010)",
  "agency.dongDia": "(ghi dòng địa danh bổ sung nếu hồ sơ có)",
  "document.chuThe": "(ghi thông tin người tham gia đối chất thứ hai theo P0030–P0041)",
  "person.tenBi": "(ghi họ tên người tham gia đối chất thứ nhất theo P0018–P0029)",
  "document.tenVu": "(ghi tên vụ án hoặc vụ việc nếu hồ sơ có)",
  "person.toiDanh": "(ghi tội danh liên quan nếu hồ sơ có)",
  "document.soTien": "(ghi số tiền liên quan nếu hồ sơ có)",
  "document.lyDo": "(ghi lý do bổ sung nếu hồ sơ có)",
  "recipients.luuHo": "(ghi thông tin lưu hồ sơ nếu hồ sơ có)",
  "signature.cheDo": "(ghi Nơi thường trú / tạm trú / nơi ở hiện tại của các bên tham gia đối chất)",
  "signature.chucVu": "(ghi tư cách tham gia tố tụng của bên 1 theo P0029 và bên 2 theo P0041)",
  "signature.nguoiKy": "(ghi họ tên những người tham gia tố tụng khác nếu có)",
} as const;

const BM136_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-136",
  versionLabel: `BM-136 runtime-ux batch 9 curated source-aligned confrontation-record profile`,
  sections: BM136_SECTIONS,
  fields: BM136_FIELDS,
  demo: BM136_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biên bản đối chất",
      description:
        "Thông tin biên bản đối chất của Viện kiểm sát trong giai đoạn điều tra theo Điều 178 và Điều 189 Bộ luật Tố tụng hình sự. Biên bản ghi nhận thời điểm, địa điểm, người tiến hành, hai bên đối chất và các thông tin hồ sơ liên quan.",
      fieldKeys: [
        "agency.vienKiem",
        "signature.positionTitle",
        "recipients.personLine",
        "document.soQuyet",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "document.chuThe",
        "person.tenBi",
        "document.tenVu",
        "person.toiDanh",
        "document.soTien",
        "document.lyDo",
        "recipients.luuHo",
        "signature.cheDo",
        "signature.chucVu",
        "signature.nguoiKy",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM136_RUNTIME_UX_PROFILE);
