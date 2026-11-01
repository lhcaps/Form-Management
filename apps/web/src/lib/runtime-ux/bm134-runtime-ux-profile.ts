/**
 * BM-134 runtime-ux curated profile — Biên bản ghi lời khai.
 *
 * CURATION (GATE B — biên bản family):
 *   - Viện kiểm sát tiến hành ghi lời khai trong giai đoạn điều
 *     tra, theo quy định Bộ luật Tố tụng hình sự.
 *   - Document type: BIÊN BẢN. Source title: "BIÊN BẢN GHI LỜI KHAI"
 *     (P0005). No independent policy supports a record-number prefix;
 *     historical key `document.soQuyet` carries no DOCX slot — see
 *     provenance ledger.
 *   - Procedural subject: người được lấy lời khai (P0029: "Người được
 *     lấy lời khai, những người có mặt đã được giải thích...").
 *   - Principal operative verb: GHI LỜI KHAI.
 *   - Family partner: BM-135 (hỏi cung bị can). The family shares
 *     the biên bản procedural domain; BM-134 ≠ BM-135.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-134.compiled.json
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-134.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-134__7c1e123c01b0.extract.md
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - Demo document number uses placeholder text only; no invented
 *     prefix. Historical key `document.soQuyet` carries no DOCX slot;
 *     presentation label is "Số biên bản ghi lời khai" reflecting the
 *     biên bản document type only — CONTRACT_ONLY_NO_DOCX_SLOT / LOW.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM134_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biên bản ghi lời khai",
    description:
      "Thông tin biên bản ghi lời khai của Viện kiểm sát trong giai đoạn điều tra, theo quy định của Bộ luật Tố tụng hình sự.",
  },
] as const;

const BM134_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát tiến hành ghi lời khai",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "signature.positionTitle": {
    label: "Chức danh người tiến hành ghi lời khai",
    placeholder: "Chức danh (ví dụ: Kiểm sát viên)",
  },
  "document.soQuyet": {
    label: "Số biên bản ghi lời khai",
    placeholder: "Số biên bản (placeholder — no DOCX slot)",
  },
  "recipients.personLine": {
    label: "Người được lấy lời khai",
    placeholder: "Họ tên người được lấy lời khai",
  },
  "agency.diaDanh": {
    label: "Địa danh nơi ghi lời khai",
    placeholder: "Tỉnh/Thành phố nơi tiến hành ghi lời khai",
  },
  "document.ngayBan": {
    label: "Ngày ghi lời khai",
    placeholder: "Ngày, tháng, năm tiến hành ghi lời khai",
  },
  "agency.dongDia": {
    label: "Dòng địa danh đầy đủ",
    placeholder: "Dòng địa danh đầy đủ (ví dụ: Thành phố Hồ Chí Minh, ngày ... tháng ... năm ...)",
  },
  "document.chuThe": {
    label: "Chủ thể liên quan",
    placeholder: "Tên người/bên liên quan (nếu có)",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder: "Điều khoản Bộ luật Tố tụng hình sự",
  },
  "document.tenVu": {
    label: "Tên vụ án / vụ việc",
    placeholder: "Tên vụ án hoặc vụ việc liên quan",
  },
} as const;

const BM134_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "signature.positionTitle": "Kiểm sát viên",
  "document.soQuyet": "(chưa ghi số biên bản)",
  "recipients.personLine": "Nguyễn Văn Minh",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "15/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 15 tháng 7 năm 2026",
  "document.chuThe": "Công ty TNHH Thương mại ABC",
  "legalBasis.canCu": "Điều 183 và Điều 185 Bộ luật Tố tụng hình sự",
  "document.tenVu": "Vụ án hình sự số 123/2026",
} as const;

const BM134_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-134",
  versionLabel: `BM-134 runtime-ux batch 8 curated source-render profile`,
  sections: BM134_SECTIONS,
  fields: BM134_FIELDS,
  demo: BM134_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biên bản ghi lời khai",
      description:
        "Thông tin biên bản ghi lời khai của Viện kiểm sát trong giai đoạn điều tra, theo quy định của Bộ luật Tố tụng hình sự.",
      fieldKeys: [
        "agency.vienKiem",
        "signature.positionTitle",
        "document.soQuyet",
        "recipients.personLine",
        "agency.diaDanh",
        "document.ngayBan",
        "agency.dongDia",
        "document.chuThe",
        "legalBasis.canCu",
        "document.tenVu",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM134_RUNTIME_UX_PROFILE);
