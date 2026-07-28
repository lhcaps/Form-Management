/**
 * BM-171 runtime UX profile — UI-only override metadata for the standalone
 * `/templates/BM-171` template page.
 *
 * Source of truth: the BM-171 locked contract
 * (`docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json`)
 * is read-only and untouched. This profile is consumed by:
 *  - `ContractV2Renderer` → section title / description / field label /
 *    placeholder / help-text overrides.
 *  - `TemplatePreviewWorkspace` → synthetic demo fixture when the operator
 *    clicks the "Dữ liệu demo" button.
 *
 * The demo fixture values mirror the canonical PR7A.4 synthetic fixture in
 * `apps/api/scripts/render-bm171-canonical-signoff-full.mjs` — same
 * recognisably-synthetic names, addresses, document numbers — so a demo
 * click produces a render that matches the sign-off evidence.
 *
 * No production PII is hardcoded. Every value is recognisably synthetic.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";
import { isKnownStaleFallback } from "./placeholder-blocklist";

/**
 * BM-171-specific section display order & titles.
 *
 * Section IDs MUST match the compiled contract (`sectionId` values in
 * `docs/audit/docx/compiled-v2/BM-171.compiled.json`). If a section ID is
 * misspelled the renderer falls through to `localizeSectionTitle`, which
 * defaults to "Thông tin bổ sung" for unknown Vietnamese titles.
 *
 * NOTE: the previous revision used `section-noi-dung-quyet-dinh` (đ) but
 * the compiled contract's id is `section-noi-dung-quyet-inh` (i). That
 * single-character typo caused "Thông tin bổ sung" to leak for the Điều 2
 * section. The IDs below are verified against the compiled JSON.
 */
const BM171_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Thông tin cơ quan ban hành và dòng địa danh — ngày ban hành Quyết định trả lại tài sản.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Các căn cứ để ban hành Quyết định trả lại tài sản theo Bộ luật Tố tụng hình sự và các quyết định tố tụng liên quan.",
  },
  {
    sectionId: "section-thong-tin-chu-tai-san",
    title: "3. Thông tin người nhận tài sản",
    description:
      "Nhân thân và cư trú của người nhận/chủ sở hữu tài sản được trả lại.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "4. Yêu cầu thi hành quyết định",
    description: "",
  },
  {
    sectionId: "section-noi-nhan",
    title: "5. Nơi nhận và lưu hồ sơ",
    description: "Danh sách nơi nhận văn bản và dòng lưu hồ sơ theo quy định.",
  },
  {
    sectionId: "section-chu-ky",
    title: "6. Ký ban hành",
    description: "Hình thức ký, chức vụ và họ tên người ký Quyết định.",
  },
] as const;

/**
 * BM-171-specific field overrides.
 *
 * UX guidance (locked-in PR7A.6+):
 *  - Labels are short Vietnamese legal-document wording.
 *  - Placeholders are short hints only — they replace the previous noisy
 *    `helpText` blocks so the form reads as a clean legal-office surface.
 *  - `control: "DATE_TEXT"` renders a real browser date picker on top of a
 *    locked-contract TEXT slot. The renderer converts the picked ISO date
 *    to the Vietnamese DD/MM/YYYY text format the contract expects on
 *    write-back, and parses incoming DD/MM/YYYY back to ISO for the
 *    picker. The DOCX contract is NOT mutated.
 *  - `control: "TEXTAREA"` is forced on long legal-basis / address / xét
 *    thấy / Điều 2 fields so the operator can type multi-line text.
 */
const BM171_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số Quyết định",
    placeholder: "01/QĐ-VKSKV7",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    control: "TEXTAREA",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
  },
  "caseDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định truy tố/khởi tố vụ án",
    placeholder:
      "Căn cứ Quyết định truy tố số 02/QĐ-VKS-KV7 ngày 12/03/2026 của Viện Kiểm sát nhân dân Khu vực 7;",
    control: "TEXTAREA",
  },
  "accusedDecision.prosecutionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định đối với bị can",
    placeholder:
      "Căn cứ Quyết định áp dụng biện pháp tạm giam số 15/QĐ-BCA ngày 20/02/2026;",
    control: "TEXTAREA",
  },
  "assetReturn.investigationConclusionLegalBasisLine": {
    label: "Căn cứ Kết luận điều tra",
    placeholder:
      "Căn cứ Kết luận điều tra số 21/KLĐT-PCA ngày 28/02/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
  },
  "assetReturn.caseSuspensionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định tạm đình chỉ vụ án (nếu có)",
    placeholder:
      "Căn cứ Quyết định tạm đình chỉ vụ án số 03/QĐ-VKS-KV7 ngày 05/03/2026;",
    control: "TEXTAREA",
  },
  "assetReturn.accusedSuspensionDecisionLegalBasisLine": {
    label: "Căn cứ Quyết định tạm đình chỉ đối với bị can (nếu có)",
    placeholder:
      "Căn cứ Quyết định tạm đình chỉ đối với bị can số 04/QĐ-VKS-KV7 ngày 05/03/2026;",
    control: "TEXTAREA",
  },
  "assetReturn.considerationLine": {
    label: "Xét thấy / Lý do trả lại tài sản",
    placeholder:
      "Xét thấy tài sản bị tạm giữ không còn liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, quản lý hợp pháp theo quy định tại Điều 212 Bộ luật Tố tụng hình sự;",
    control: "TEXTAREA",
  },
  "assetReturn.assetListLine": {
    label: "Danh mục tài sản được trả lại",
    placeholder:
      "01 chiếc xe máy Honda Wave RSX, biển số 59C1-123.45; 01 sổ tiết kiệm …",
    control: "TEXTAREA",
  },
  "assetOwner.fullName": {
    label: "Họ và tên người nhận tài sản",
    placeholder: "",
  },
  "assetOwner.genderText": {
    label: "Giới tính",
    placeholder: "Chọn giới tính",
    control: "TEXT",
  },
  "assetOwner.otherName": {
    label: "Tên gọi khác (bí danh)",
    placeholder: "Không có",
  },
  "assetOwner.dateOfBirthText": {
    label: "Sinh ngày",
    placeholder: "",
    control: "DATE_TEXT",
  },
  "assetOwner.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Tỉnh Bình Dương",
  },
  "assetOwner.nationality": {
    label: "Quốc tịch",
    placeholder: "Việt Nam",
  },
  "assetOwner.ethnicity": {
    label: "Dân tộc",
    placeholder: "Kinh",
  },
  "assetOwner.religion": {
    label: "Tôn giáo",
    placeholder: "Không",
  },
  "assetOwner.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Lao động tự do",
  },
  "assetOwner.identityNo": {
    label: "Số CMND/CCCD/Hộ chiếu",
    placeholder: "079085001234",
  },
  "assetOwner.identityIssuedDateText": {
    label: "Cấp ngày",
    placeholder: "",
    control: "DATE_TEXT",
  },
  "assetOwner.identityIssuedPlace": {
    label: "Nơi cấp giấy tờ tùy thân",
    placeholder: "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
  },
  "assetOwner.permanentResidence": {
    label: "Nơi thường trú",
    placeholder:
      "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
    control: "TEXTAREA",
  },
  "assetOwner.temporaryResidence": {
    label: "Nơi tạm trú",
    placeholder: "Không có",
    control: "TEXTAREA",
  },
  "assetOwner.currentResidence": {
    label: "Nơi ở hiện tại",
    placeholder:
      "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
    control: "TEXTAREA",
  },
  "assetReturn.executionRequestLine": {
    label: "Điều 2 — Yêu cầu thi hành Quyết định",
    placeholder:
      "Yêu cầu Phòng Cảnh sát Quản lý hành chính về trật tự xã hội thuộc Công an Thành phố Hồ Chí Minh chuyển giao tài sản nêu tại Điều 1 cho người nhận (mẫu) trong thời hạn 05 ngày làm việc kể từ ngày nhận được Quyết định.",
    control: "TEXTAREA",
  },
  "recipients.line1": {
    label: "Nơi nhận",
    placeholder: "Phòng CSQLHC TTXH Công an TP.HCM;",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Hình thức ký",
    placeholder: "Ký thay",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "VIỆN TRƯỞNG",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "",
  },
} as const;

/**
 * BM-171 synthetic demo fixture.
 *
 * BM-171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX — every demo
 * value is a recognisably synthetic but REAL person / signer name, never
 * a placeholder label. The workspace uses this fixture for the
 * "Dữ liệu demo" reset, which must produce a DOCX whose "Cho ông/bà:",
 * "Điều 2", and signature lines all carry live, non-placeholder data.
 *
 * Required placeholder values ("Người nhận (mẫu)", "Người ký (mẫu)",
 * etc.) are FORBIDDEN as render payload values — see `validation.ts`
 * and the `BM171_PLACEHOLDER_VALUES` blocklist. They may appear in UI
 * helper text only, never in `demo`.
 */
const BM171_DEMO = {
  // Header — agency
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  // Header — document
  "document.documentCode": "01/QĐ-VKSKV7",
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
    "Xét thấy tài sản bị tạm giữ không còn liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, quản lý hợp pháp theo quy định tại Điều 212 Bộ luật Tố tụng hình sự,",
  // Asset list
  "assetReturn.assetListLine":
    "1. 01 chiếc xe máy Honda Wave RSX, biển số 59C1-123.45, màu đỏ-đen, năm sản xuất 2018, khung JL110E-1234567, máy JL110E-7654321;\n2. 01 sổ tiết kiệm Ngân hàng TMCP Ngoại thương Việt Nam, chi nhánh TP.HCM, số tài khoản 0011-2233-4455-66, số dư 12.500.000 đồng (Mười hai triệu năm trăm nghìn đồng).",
  // Asset owner — REAL synthetic person name, not "Người nhận (mẫu)".
  "assetOwner.fullName": "Nguyễn Văn A",
  "assetOwner.genderText": "Nam",
  "assetOwner.otherName": "Không có",
  // dd/MM/yyyy — normalized to two-digit day/month per Case D acceptance.
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
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  // Điều 2 — execution request. Must reference the real assetOwner
  // fullName ("Nguyễn Văn A"), never "người nhận (mẫu)".
  "assetReturn.executionRequestLine":
    "Yêu cầu Phòng Cảnh sát Quản lý hành chính về trật tự xã hội thuộc Công an Thành phố Hồ Chí Minh chuyển giao tài sản nêu tại Điều 1 cho ông Nguyễn Văn A trong thời hạn 05 ngày làm việc kể từ ngày nhận được Quyết định.",
  // Recipients
  "recipients.line1": "Phòng CSQLHC TTXH Công an TP.HCM;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  // Sign — REAL synthetic signer name, not "Người ký (mẫu)".
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Nguyễn Thị Hồng C",
} as const;

const BM171_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-171",
  versionLabel: "runtime-ux-profile/v1 (PR7A.6)",
  sections: BM171_SECTIONS,
  fields: BM171_FIELDS,
  demo: BM171_DEMO,
  summaryLines: [
    {
      label: "Cơ quan ban hành",
      value: (data) =>
        readSummaryValue(data, "agency.name") ??
        readSummaryValue(data, "agency.parentName") ??
        "—",
    },
    {
      label: "Số QĐ",
      value: (data) => {
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
      value: (data) => readSummaryValue(data, "assetReturn.assetListLine") ?? "—",
    },
    {
      label: "Người nhận",
      // BM-171 visual signoff: previously hardcoded to "Người nhận (mẫu)"
      // which made the summary card lie when the operator cleared the
      // fullName field. Now reads the actual typed value or "—".
      //
      // BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX:
      // placeholder values are treated as missing for summary purposes
      // too — see `readSummaryValue` below.
      value: (data) => readSummaryValue(data, "assetOwner.fullName") ?? "—",
    },
    {
      label: "Điều 2",
      value: (data) =>
        readSummaryValue(data, "assetReturn.executionRequestLine") ?? "—",
    },
    {
      label: "Lưu hồ sơ",
      value: (data) => readSummaryValue(data, "recipients.archiveLine") ?? "—",
    },
    {
      label: "Ký",
      value: (data) => {
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
  ],
};

/**
 * Read a trimmed string at a dot-path inside a nested record. Returns
 * `undefined` when the path is missing, the value is not a string, or
 * the trimmed value is empty. Co-located with the BM-171 profile because
 * it is only consumed by the BM-171 summary line functions. Other
 * profiles (if any future profile ships its own summary) should reuse
 * `runtime-preview-payload.setNestedPath` if they need to write data,
 * but reading at a path is fine to inline.
 */
function readNestedString(
  data: Record<string, unknown>,
  path: string,
): string | undefined {
  const segments = path.split(".");
  let cursor: unknown = data;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (typeof cursor !== "string") return undefined;
  const trimmed = cursor.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Like `readNestedString` but ALSO returns `undefined` when the value
 * matches a known placeholder / stale fallback label. Used by the
 * BM-171 summary line functions so the summary card never displays
 * "Người nhận (mẫu)" / "Người ký (mẫu)" / "người nhận (mẫu)" as if
 * they were valid data.
 *
 * BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX.
 */
function readSummaryValue(
  data: Record<string, unknown>,
  path: string,
): string | undefined {
  const value = readNestedString(data, path);
  if (value === undefined) return undefined;
  if (isKnownStaleFallback(value)) return undefined;
  return value;
}

// Side-effect: register BM-171 profile when this module is imported.
registerRuntimeUxProfile(BM171_PROFILE);

export { BM171_PROFILE };
