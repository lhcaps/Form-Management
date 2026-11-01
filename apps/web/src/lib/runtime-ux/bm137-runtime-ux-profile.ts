/**
 * BM-137 runtime-ux curated profile — Biên bản xác minh/làm việc
 * (verification / work session record during investigation stage).
 *
 * CURATION (GATE C of the user's task brief):
 *   - 6 compiled fields, all TEXT.
 *   - One compiled section `section-thong-tin-bieu-mau`; the pre-curation
 *     profile emitted two phantom sections (section-thong-tin-bien-ban and
 *     section-dong-dia-danh) that were never declared in the compiled
 *     contract; they have been removed. The curated profile presents
 *     exactly one section.
 *   - Title: "BB xác minh/làm việc" (compiled title).
 *   - Document family: BIÊN BẢN.
 *   - Procedure subfamily: XÁC MINH / LÀM VIỆC.
 *
 * Compatibility mapping (authoritative for this curation turn; historical
 * keys remain unchanged, only presentation labels are source-aligned):
 *
 *   Agency identity:
 *     - agency.vienKiem → "Viện kiểm sát tiến hành xác minh/làm việc"
 *       (P0022 + P0023 authority footnotes — FOOTNOTE / MEDIUM).
 *   Record identity:
 *     - document.soBien → "Số biên bản xác minh/làm việc"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — no /BB-VKS, no BB-137/VKSKV7,
 *       no fabricated demo number). Demo uses
 *       "(chưa ghi số biên bản)" placeholder-style text only.
 *   Venue:
 *     - document.noiLap → "Nơi lập biên bản"
 *       (P0007 "tại" — CONTRACT_POSITIONAL_INFERENCE / MEDIUM).
 *   Time:
 *     - document.ngayLap → "Ngày lập biên bản"
 *       (P0007 event-time sequence — DIRECT_SLOT / HIGH).
 *   Agency supplementary:
 *     - agency.dongDia → "Dòng địa danh bổ sung (nếu hồ sơ có)"
 *       (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — no source paragraph).
 *   Case identity:
 *     - document.tenVu → "Tên vụ án hoặc vụ việc cần xác minh/làm việc"
 *       (P0006 "Về việc:" + P0013 "Tiến hành xác minh/làm việc về việc:" —
 *       DIRECT_SLOT / HIGH).
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0008–P0012: conducting-officer block ("Chúng tôi gồm", "Ông/Bà:",
 *     "Chức danh:", "thuộc Viện kiểm sát2", second "Ông/Bà:") —
 *     no contract field.
 *   - P0014: results heading "KẾT QUẢ XÁC MINH/LÀM VIỆC" —
 *     no contract field.
 *   - P0015: end time of verification ("Việc xác minh/làm việc kết thúc
 *     hồi...giờ...ngày...tháng...năm") — no contract field.
 *   - P0016–P0021: signature blocks — no contract field.
 *   - P0027: "Mẫu số 137/HS" — footer.
 *   - P0024–P0026: footer explanations.
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
 *     strings only — no invented number prefix, no /BB-VKS, no /VKSKV7,
 *     no fabricated case ("Lê Minh K", "Lừa đảo", "chiếm đoạt"),
 *     no fabricated person ("Trần Văn Bình").
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-137.compiled.json
 *   - DOCX extract:      docs/audit/docx/extracted/BM-137__d2c569c61fb7.extract.md
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM137_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biên bản xác minh/làm việc",
    description:
      "Thông tin biên bản xác minh/làm việc của Viện kiểm sát trong giai đoạn điều tra. Biên bản ghi nhận tên cơ quan tiến hành, số biên bản, nơi lập, ngày lập, dòng địa danh bổ sung và tên vụ án hoặc vụ việc cần xác minh/làm việc.",
  },
] as const;

const BM137_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát tiến hành xác minh/làm việc",
    placeholder:
      "Viện kiểm sát tiến hành xác minh/làm việc (P0022 + P0023 — chỉ ghi tên VKS ban hành)",
  },
  "document.soBien": {
    label: "Số biên bản xác minh/làm việc",
    placeholder:
      "Số biên bản xác minh/làm việc (CONTRACT_ONLY_NO_DOCX_SLOT — chưa ghi số biên bản)",
  },
  "document.noiLap": {
    label: "Nơi lập biên bản",
    placeholder:
      "Nơi lập biên bản (P0007 — sau từ \"tại\" trong câu mở đầu)",
  },
  "document.ngayLap": {
    label: "Ngày lập biên bản",
    placeholder:
      "Ngày lập biên bản (P0007 — dãy ngày/tháng/năm trong câu mở đầu)",
  },
  "agency.dongDia": {
    label: "Dòng địa danh bổ sung (nếu hồ sơ có)",
    placeholder:
      "Dòng địa danh bổ sung (nếu hồ sơ có) (CONTRACT_ONLY_NO_DOCX_SLOT — không có đoạn nguồn trực tiếp)",
  },
  "document.tenVu": {
    label: "Tên vụ án hoặc vụ việc cần xác minh/làm việc",
    placeholder:
      "Tên vụ án hoặc vụ việc cần xác minh/làm việc (P0006 \"Về việc:\" + P0013 \"Tiến hành xác minh/làm việc về việc:\")",
  },
} as const;

const BM137_DEMO_RUNTIME_UX = {
  "agency.vienKiem":
    "Viện kiểm sát nhân dân khu vực 7 (ghi tên VKS ban hành theo P0023)",
  "document.soBien": "(chưa ghi số biên bản)",
  "document.noiLap": "Trụ sở Viện kiểm sát nhân dân khu vực 7 (nơi lập theo P0007)",
  "document.ngayLap": "ngày 04 tháng 7 năm 2026",
  "agency.dongDia":
    "(để trống — dòng địa danh bổ sung chỉ điền khi hồ sơ có)",
  "document.tenVu":
    "(để trống — Tên vụ án hoặc vụ việc cần xác minh/làm việc, theo P0006 + P0013)",
} as const;

const BM137_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-137",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: `BM-137 runtime-ux curated profile — biên bản xác minh/làm việc`,
  sections: BM137_SECTIONS,
  fields: BM137_FIELDS,
  demo: BM137_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biên bản xác minh/làm việc",
      description:
        "Thông tin biên bản xác minh/làm việc của Viện kiểm sát trong giai đoạn điều tra. Biên bản ghi nhận tên cơ quan tiến hành, số biên bản, nơi lập, ngày lập, dòng địa danh bổ sung và tên vụ án hoặc vụ việc cần xác minh/làm việc.",
      fieldKeys: [
        "agency.vienKiem",
        "document.soBien",
        "document.noiLap",
        "document.ngayLap",
        "agency.dongDia",
        "document.tenVu",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM137_RUNTIME_UX_PROFILE);