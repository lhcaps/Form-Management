/**
 * BM-171 canonical Form Flight profile.
 *
 * Single source of truth for BM-171 across both flows:
 *   - `/templates/BM-171`     (TemplateRuntimeAdapter)
 *   - `/documents/:id (BM-171)` (GeneratedDocumentAdapter)
 *
 * Mirrors the existing `bm171-runtime-ux-profile.ts` so existing
 * runtime behavior is preserved 1-for-1. The two profiles can
 * coexist; the legacy UI profile continues to drive
 * `ContractV2Renderer` (sections/fields), while this canonical
 * profile drives the cross-flow payload/validation/summary/acceptance
 * pipeline.
 *
 * Field paths use the same dot-path convention as the locked contract
 * (`docs/audit/docx/contracts/locked/BM-171__*.contract.locked.json`)
 * and the runtime draft payload. Required paths come from the
 * `requiredFieldKeys` listed by the locked contract.
 */

import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";
import { readFormFlightPath } from "../payload";
import { isKnownStaleFallback } from "../../runtime-ux/placeholder-blocklist";

const BM171_FIELD_PATHS = [
  // Agency / document header
  "agency.parentName",
  "agency.name",
  "agency.issuePlace",
  "document.documentCode",
  "document.issueDate",
  "document.issuePlaceAndDateLine",
  // Issuer / authority
  "official.issuerTitle",
  // Legal-basis block
  "legalBasis.procedureArticlesLine",
  "caseDecision.prosecutionDecisionLegalBasisLine",
  "accusedDecision.prosecutionDecisionLegalBasisLine",
  "assetReturn.investigationConclusionLegalBasisLine",
  "assetReturn.caseSuspensionDecisionLegalBasisLine",
  "assetReturn.accusedSuspensionDecisionLegalBasisLine",
  // Điều 1 / Điều 2
  "assetReturn.considerationLine",
  "assetReturn.assetListLine",
  "assetReturn.executionRequestLine",
  // Asset owner
  "assetOwner.fullName",
  "assetOwner.genderText",
  "assetOwner.otherName",
  "assetOwner.dateOfBirthText",
  "assetOwner.placeOfBirth",
  "assetOwner.nationality",
  "assetOwner.ethnicity",
  "assetOwner.religion",
  "assetOwner.occupation",
  "assetOwner.identityNo",
  "assetOwner.identityIssuedDateText",
  "assetOwner.identityIssuedPlace",
  "assetOwner.permanentResidence",
  "assetOwner.temporaryResidence",
  "assetOwner.currentResidence",
  // Recipients / archive
  "recipients.line1",
  "recipients.archiveLine",
  // Signature
  "signature.signMode",
  "signature.positionTitle",
  "signature.signerName",
] as const;

/**
 * Required-field paths. These MUST match the locked contract's
 * `requiredFieldKeys` list. Any drift will be caught by the
 * `requiredFieldPathsMatchLockedContract` assertion in
 * `bm171-shared-core.test.ts`.
 */
const BM171_REQUIRED_FIELD_PATHS = [
  "agency.parentName",
  "agency.name",
  "document.documentCode",
  "document.issueDate",
  "assetReturn.investigationConclusionLegalBasisLine",
  "assetReturn.assetListLine",
  "assetOwner.fullName",
  "assetOwner.identityNo",
  "signature.positionTitle",
  "signature.signerName",
] as const;

const BM171_DEMO = {
  // Header — agency
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.issuePlace": "TP. Hồ Chí Minh",
  // Header — document
  "document.documentCode": "01/QĐ-VKSKV7",
  "document.issueDate": "2026-07-04",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  // Body — issuer / title
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  // Legal-basis block (each line ends with a semicolon to match legal style)
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015;",
  "caseDecision.prosecutionDecisionLegalBasisLine":
    "Căn cứ Quyết định truy tố số 02/QĐ-VKS-KV7 ngày 12/03/2026 của Viện Kiểm sát nhân dân Khu vực 7;",
  "accusedDecision.prosecutionDecisionLegalBasisLine":
    "Căn cứ Quyết định áp dụng biện pháp tạm giam số 15/QĐ-BCA ngày 20/02/2026;",
  "assetReturn.investigationConclusionLegalBasisLine":
    "Căn cứ Kết luận điều tra số 21/KLĐT-PCA ngày 28/02/2026 của Cơ quan Cảnh sát điều tra;",
  "assetReturn.caseSuspensionDecisionLegalBasisLine":
    "Căn cứ Quyết định tạm đình chỉ vụ án số 03/QĐ-VKS-KV7 ngày 05/03/2026;",
  "assetReturn.accusedSuspensionDecisionLegalBasisLine":
    "Căn cứ Quyết định tạm đình chỉ đối với bị can số 04/QĐ-VKS-KV7 ngày 05/03/2026;",
  "assetReturn.considerationLine":
    "Xét thấy tài sản bị tạm giữ không còn liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, quản lý hợp pháp theo quy định tại Điều 212 Bộ luật Tố tụng hình sự;",
  // Asset list
  "assetReturn.assetListLine":
    "1. 01 chiếc xe máy Honda Wave RSX, biển số 59C1-123.45, màu đỏ-đen, năm sản xuất 2018, khung JL110E-1234567, máy JL110E-7654321;\n2. 01 sổ tiết kiệm Ngân hàng TMCP Ngoại thương Việt Nam, chi nhánh TP.HCM, số tài khoản 0011-2233-4455-66, số dư 12.500.000 đồng (Mười hai triệu năm trăm nghìn đồng).",
  // Asset owner — REAL synthetic person name, never "Người nhận (mẫu)".
  "assetOwner.fullName": "Nguyễn Văn A",
  "assetOwner.genderText": "Nam",
  "assetOwner.otherName": "Không có",
  // dd/MM/yyyy — two-digit day/month per Case D acceptance.
  "assetOwner.dateOfBirthText": "08/09/1985",
  "assetOwner.placeOfBirth": "Tỉnh Bình Dương",
  "assetOwner.nationality": "Việt Nam",
  "assetOwner.ethnicity": "Kinh",
  "assetOwner.religion": "Không",
  "assetOwner.occupation": "Lao động tự do",
  "assetOwner.identityNo": "079085001234",
  "assetOwner.identityIssuedDateText": "14/12/2021",
  "assetOwner.identityIssuedPlace":
    "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
  "assetOwner.permanentResidence":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "assetOwner.temporaryResidence": "Không có",
  "assetOwner.currentResidence":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ ChÍ Minh",
  // Điều 2 — must reference the real assetOwner.fullName.
  "assetReturn.executionRequestLine":
    "Yêu cầu Phòng Cảnh sát Quản lý hành chính về trật tự xã hội thuộc Công an Thành phố Hồ Chí Minh chuyển giao tài sản nêu tại Điều 1 cho ông Nguyễn Văn A trong thời hạn 05 ngày làm việc kể từ ngày nhận được Quyết định.",
  // Recipients
  "recipients.line1": "Phòng CSQLHC TTXH Công an TP.HCM;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  // Sign — REAL synthetic signer name, never "Người ký (mẫu)".
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Nguyễn Thị Hồng C",
};

const BM171_STALE_FALLBACKS = {
  // Required-field placeholder values. Treated as missing per the
  // REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX rule:
  // any of these in a draft must be cleared (path becomes undefined)
  // and surfaced via `missingRequired` instead of being preserved.
  "assetOwner.fullName": [
    "Người nhận (mẫu)",
  ],
  "signature.signerName": [
    "Người ký (mẫu)",
  ],
  "assetReturn.executionRequestLine": [
    "người nhận (mẫu)",
  ],
  // Pre-existing legal-basis stale fallback kept for parity.
  "legalBasis.procedureArticlesLine": [
    "Căn cứ Điều 41 Bộ luật Tố tụng hình sự",
  ],
};

const BM171_ALIASES = {
  "signature.signerName": ["signer.fullName"],
};

const BM171_ACCEPTANCE = {
  // Substrings that MUST appear in the rendered DOCX text.
  requiredText: [
    "QUYẾT ĐỊNH",
    "01/QĐ-VKSKV7",
    "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    "Nguyễn Văn A",
  ],
  // Substrings that MUST NOT leak into the rendered DOCX.
  forbiddenText: [
    "Căn cứ Điều 41 Bộ luật Tố tụng hình sự", // stale fallback
    "Cá nhân/Tổ chức theo quy định.", // stale fallback
    "Tài sản theo quy định pháp luật", // stale fallback
    "Người nhận (mẫu)", // placeholder required value, must never render
    "Người ký (mẫu)", // placeholder required value, must never render
    "người nhận (mẫu)", // Điều 2 placeholder, must never render
  ],
};

const BM171_SUMMARY_LINES = [
  {
    label: "Cơ quan ban hành",
    value: (data: Record<string, unknown>) =>
      readSummaryValue(data, "agency.name") ??
      readSummaryValue(data, "agency.parentName") ??
      "—",
  },
  {
    label: "Số QĐ",
    value: (data: Record<string, unknown>) => {
      const code = readSummaryValue(data, "document.documentCode");
      const place = readSummaryValue(data, "document.issuePlaceAndDateLine");
      if (!code && !place) return "—";
      if (code && place) return `${code} — ${place}`;
      return code ?? place ?? "—";
    },
  },
  {
    label: "Tiêu đề",
    value: () => "QUYẾT ĐỊNH — TRẢ LẠI TÀI SẢN",
  },
  {
    label: "Tài sản",
    value: (data: Record<string, unknown>) =>
      readSummaryValue(data, "assetReturn.assetListLine") ?? "—",
  },
  {
    label: "Người nhận",
    value: (data: Record<string, unknown>) =>
      readSummaryValue(data, "assetOwner.fullName") ?? "—",
  },
  {
    label: "Điều 2",
    value: (data: Record<string, unknown>) =>
      readSummaryValue(data, "assetReturn.executionRequestLine") ?? "—",
  },
  {
    label: "Lưu hồ sơ",
    value: (data: Record<string, unknown>) =>
      readSummaryValue(data, "recipients.archiveLine") ?? "—",
  },
  {
    label: "Ký",
    value: (data: Record<string, unknown>) => {
      const mode = readSummaryValue(data, "signature.signMode");
      const position = readSummaryValue(data, "signature.positionTitle");
      const signer = readSummaryValue(data, "signature.signerName");
      const parts = [
        mode ? `KT. ${position ?? ""}`.trim() : position ?? "",
        signer ?? "",
      ].filter((p) => p.length > 0);
      return parts.length === 0 ? "—" : parts.join(" / ");
    },
  },
] as const;

/**
 * Read a trimmed string at a dot-path. Returns `undefined` when the
 * path is missing, the value is not a string, the trimmed value is
 * empty, OR the value matches a known placeholder / stale fallback.
 *
 * BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX — summary
 * cards must never display a placeholder label as if it were valid
 * data; the user sees "—" plus a missing-required warning instead.
 */
function readSummaryValue(
  data: Record<string, unknown>,
  path: string,
): string | undefined {
  const value = readFormFlightPath(data, path);
  if (value === undefined) return undefined;
  if (isKnownStaleFallback(value)) return undefined;
  return value;
}

export const BM171_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-171",
  title: "QĐ trả lại tài sản",
  // PR-A3: explicit runtime-readiness opt-in. Required by the
  // `isRuntimeReadyProfile` guard adopted in
  // RESTORE_BM001_PRE_PR7B_RUNTIME_UI_AND_BLOCK_SKELETON_TAKEOVER.
  // Without these two flags the adapter helpers treat BM-171 as
  // "no profile" and the gates collapse to the fail-closed default.
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM171_FIELD_PATHS,
  requiredFieldPaths: BM171_REQUIRED_FIELD_PATHS,
  demo: BM171_DEMO,
  staleFallbacks: BM171_STALE_FALLBACKS,
  aliases: BM171_ALIASES,
  summaryLines: BM171_SUMMARY_LINES,
  acceptance: BM171_ACCEPTANCE,
};

// Side-effect: register on module import. The barrel
// `apps/web/src/lib/form-flight/index.ts` re-exports this constant
// without importing it; consumers that want registration must
// `import "@/lib/form-flight/profiles/bm171"` (mirrors the runtime-ux
// pattern).
registerFormFlightProfile(BM171_FORM_FLIGHT_PROFILE);