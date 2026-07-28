/**
 * BM-135 runtime-ux curated profile — Biên bản hỏi cung bị can.
 *
 * CURATION (GATE B — biên bản family):
 *   - Viện kiểm sát tiến hành hỏi cung bị can trong giai đoạn
 *     điều tra, theo quy định Bộ luật Tố tụng hình sự.
 *   - Document type: BIÊN BẢN. Source title: "BIÊN BẢN HỎI CUNG BỊ CAN"
 *     (P0005). No independent policy supports a record-number prefix;
 *     historical key `document.soQuyet` carries no DOCX slot — see
 *     provenance ledger.
 *   - Procedural subject: bị can được hỏi cung (P0029: "Bị can và
 *     những người có mặt đã được giải thích quyền và nghĩa vụ...").
 *   - Principal operative verb: HỎI CUNG BỊ CAN.
 *   - Family partner: BM-134 (ghi lời khai). The family shares
 *     the biên bản procedural domain; BM-134 ≠ BM-135.
 *
 * Source references:
 *   - compiled contract: docs/audit/docx/compiled-v2/BM-135.compiled.json
 *   - DOCX extract:    docs/audit/docx/extracted/BM-135__79b31ad7511e.extract.md
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - Demo document number uses placeholder text only; no invented
 *     prefix. Historical key `document.soQuyet` carries no DOCX slot;
 *     presentation label is "Số biên bản hỏi cung bị can" reflecting the
 *     biên bản document type only — CONTRACT_ONLY_NO_DOCX_SLOT / LOW.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM135_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biên bản hỏi cung bị can",
    description:
      "Thông tin biên bản hỏi cung bị can của Viện kiểm sát trong giai đoạn điều tra, theo quy định của Bộ luật Tố tụng hình sự.",
  },
] as const;

const BM135_FIELDS = {
  "agency.vienKiem": {
    label: "Viện kiểm sát tiến hành hỏi cung bị can",
    placeholder: "Viện kiểm sát nhân dân...",
  },
  "signature.positionTitle": {
    label: "Chức danh người tiến hành hỏi cung",
    placeholder: "Chức danh (ví dụ: Kiểm sát viên)",
  },
  "document.soQuyet": {
    label: "Số biên bản hỏi cung bị can",
    placeholder: "Số biên bản (placeholder — no DOCX slot)",
  },
  "agency.diaDanh": {
    label: "Địa danh nơi hỏi cung",
    placeholder: "Tỉnh/Thành phố nơi tiến hành hỏi cung",
  },
  "recipients.personLine": {
    label: "Bị can được hỏi cung",
    placeholder: "Họ tên bị can",
  },
  "document.ngayBan": {
    label: "Ngày hỏi cung bị can",
    placeholder: "Ngày, tháng, năm tiến hành hỏi cung",
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

const BM135_DEMO_RUNTIME_UX = {
  "agency.vienKiem": "Viện kiểm sát nhân dân khu vực 7",
  "signature.positionTitle": "Kiểm sát viên",
  "document.soQuyet": "(chưa ghi số biên bản)",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "recipients.personLine": "Trần Văn Tâm",
  "document.ngayBan": "16/07/2026",
  "agency.dongDia": "Thành phố Hồ Chí Minh, ngày 16 tháng 7 năm 2026",
  "document.chuThe": "Công ty TNHH Thương mại ABC",
  "legalBasis.canCu": "Điều 183 và Điều 185 Bộ luật Tố tụng hình sự",
  "document.tenVu": "Vụ án hình sự số 123/2026",
} as const;

const BM135_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-135",
  versionLabel: `BM-135 runtime-ux batch 8 curated source-render profile`,
  sections: BM135_SECTIONS,
  fields: BM135_FIELDS,
  demo: BM135_DEMO_RUNTIME_UX,
  presentationSections: [
    {
      id: "section-thong-tin-bieu-mau",
      title: "Thông tin biên bản hỏi cung bị can",
      description:
        "Thông tin biên bản hỏi cung bị can của Viện kiểm sát trong giai đoạn điều tra, theo quy định của Bộ luật Tố tụng hình sự.",
      fieldKeys: [
        "agency.vienKiem",
        "signature.positionTitle",
        "document.soQuyet",
        "agency.diaDanh",
        "recipients.personLine",
        "document.ngayBan",
        "agency.dongDia",
        "document.chuThe",
        "legalBasis.canCu",
        "document.tenVu",
      ],
    },
  ],
};

registerRuntimeUxProfile(BM135_RUNTIME_UX_PROFILE);
