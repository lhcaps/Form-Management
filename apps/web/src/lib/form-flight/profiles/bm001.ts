/**
 * BM-001 second pilot — runtime-ready FormFlightProfile.
 *
 * Canonical cross-flow metadata for BM-001 (Biên bản tiếp nhận nguồn tin
 * về tội phạm). The 39 dot-path `fieldPaths` are taken verbatim from the
 * locked contract `docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3
 * .contract.locked.json#docxSlots` and verified by
 * `scripts/audit/extract-docx-fidelity-source.mjs`.
 *
 * Promotion history (newest first):
 *   1. Skeleton-only baseline (skeleton-stage, no runtimeReady flag).
 *   2. This file — promoted to `runtime-ready` after Phase "BM-001
 *      Fidelity Repair With Verified Notes". 39-field coverage matches
 *      the locked contract; synthetic Vietnamese demo, summary lines,
 *      acceptance requiredText + forbiddenText, and a staleFallbacks
 *      map were authored by hand using BM-171 (`bm171.ts`) as the
 *      reference pattern.
 *
 * Field-path order mirrors the locked contract (header → receiver →
 * informant → reception → crime report → archive) so a reader can
 * diff `fieldPaths` against the contract side-by-side. This is the
 * second pilot promoted to runtime-ready (after BM-171); the 211
 * auto-generated skeletons are still skeletons and must stay that way
 * until each form has hand-authored fixture / acceptance evidence.
 *
 * The legacy UI `apps/web/src/components/documents/bm-001-form-inputs.tsx`
 * and the legacy helper `apps/web/src/lib/bm001-form-inputs-api.ts` were
 * deliberately NOT modified in this phase:
 *
 *   - UI `fillCustomerSample()` keeps its legacy sample (with the
 *     known stale `"Ông  cung cấp ..."` bug) because that helper is a
 *     handler-only convenience for users who want to load ANY data
 *     into the form, regardless of acceptance.
 *   - Helper `saveBm001FormInputs` already owns the
 *     `syncBm001PersonAliasesBeforeSave` alias pass and the
 *     `startedAtDay/Month/Year` reconstruction from `startedAtDate`.
 *
 * The canonical render-time fixture lives here, in `BM001_DEMO`, so the
 * Form Flight `mode: "demo-reset"` path produces a BM-001 render that
 * passes the acceptance scanner.
 *
 * Notes (verified NO_NOTES_WITH_EVIDENCE — see
 * `docs/audit/unified-bm-workspace/QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.
 * latest.md` §5): no footnote UI is declared. The status is preserved.
 *
 * Lifecycle: this profile participates ONLY in the generated-document
 * flow. It must never be wired into `/templates/BM-001` (see guard test
 * #8 in `profile-registry-guard.test.mjs`).
 */

import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";
import { readFormFlightPath } from "../payload";
import { isKnownStaleFallback } from "../../runtime-ux/placeholder-blocklist";

// 39 field paths — must match the locked contract's
// `docxSlots[]` length and `canonicalFields[]` length.
const BM001_FIELD_PATHS = [
  // Header / issue place+date
  "document.issuePlaceDateLine",
  // Receiver block
  "receiver.fullName",
  "receiver.positionTitle",
  "receiver.departmentName",
  // Informant identity
  "informant.fullName",
  "informant.genderLabel",
  "informant.otherName",
  // Informant date-of-birth parts
  "informant.birthDay",
  "informant.birthMonth",
  "informant.birthYear",
  "informant.placeOfBirth",
  "informant.nationality",
  "informant.ethnicity",
  "informant.religion",
  "informant.occupation",
  // Informant identity card
  "informant.identityNo",
  "informant.identityIssuedDay",
  "informant.identityIssuedMonth",
  "informant.identityIssuedYear",
  "informant.identityIssuedPlace",
  // Informant addresses / phone / org
  "informant.permanentAddress",
  "informant.temporaryAddress",
  "informant.currentAddress",
  "informant.phone",
  "informant.representedOrganization",
  // Signers
  "informant.signerName",
  "receiver.signerName",
  // Archive
  "recipients.archiveLine",
  // Reception start
  "reception.startedAtTimeText",
  "reception.startedAtDay",
  "reception.startedAtMonth",
  "reception.startedAtYear",
  "reception.locationName",
  // Crime report
  "crimeReport.content",
  "crimeReport.attachedItemsDescription",
  // Reception end
  "reception.endedAtTimeText",
  "reception.endedAtDay",
  "reception.endedAtMonth",
  "reception.endedAtYear",
] as const;

/**
 * Required-field paths — deliberately narrow subset. A BM-001 render
 * with all 39 paths filled is the strongest case, but only the slots
 * below are gated at the panel / gate level so that a partial draft
 * with the legal headline + parties + content + item list + signatures
 * + archive can pass `gateGeneratedDocumentSave`.
 *
 * NOT required (intentionally):
 *   - `informant.temporaryAddress` — BM-001 contract allows "Không có".
 *   - `informant.phone` — many informants decline.
 *   - `informant.identityIssuedDay/Month/Year` — covered indirectly
 *     via `informant.identityIssuedPlace` and the
 *     `reception` day/month/year parts (the latter are required so the
 *     header has dated anchors).
 *   - `informant.representedOrganization` — "Không" is acceptable.
 *   - `informant.ethnicity` / `religion` / `occupation` — canonical
 *     facts but the form accepts "-" / "Không".
 *   - `informant.birthDay/birthMonth` — `birthYear` is required;
 *     day/month are optional (some informants only remember the year).
 */
const BM001_REQUIRED_FIELD_PATHS = [
  "document.issuePlaceDateLine",
  "reception.startedAtTimeText",
  "reception.startedAtDay",
  "reception.startedAtMonth",
  "reception.startedAtYear",
  "reception.locationName",
  "receiver.fullName",
  "receiver.positionTitle",
  "receiver.departmentName",
  "informant.fullName",
  "informant.genderLabel",
  "informant.birthYear",
  "informant.placeOfBirth",
  "informant.nationality",
  "informant.identityNo",
  "informant.currentAddress",
  "crimeReport.content",
  "crimeReport.attachedItemsDescription",
  "reception.endedAtTimeText",
  "reception.endedAtDay",
  "reception.endedAtMonth",
  "reception.endedAtYear",
  "informant.signerName",
  "receiver.signerName",
  "recipients.archiveLine",
] as const;

/**
 * Synthetic Vietnamese demo fixture for BM-001. No real personal data.
 * The informant and the receiver are deliberately distinct so the
 * text "Tôi" (receiver) and the text "[người cung cấp]" (informant)
 * do not collapse into the same name.
 *
 * Bug guards honoured here:
 *   - No blank informant name (the legacy UI sample left
 *     `informant.fullName = ""`).
 *   - No `"Ông  cung cấp ..."` token in `crimeReport.content`.
 *   - No `"{{"` / `"}}"` stale placeholders.
 *   - Distinct receiver vs informant — receiver is a Viện Kiểm sát
 *     Kiểm sát viên from VKS Khu vực 7, informant is a synthetic
 *     citizen unrelated to any real person.
 *   - Dates are consistent (04/03/2026 reception start; 04/03/2026
 *     reception end; same-day 08:00 → 08:30; issuePlaceDateLine
 *     derived from issuePlace + 04/03/2026).
 *   - `attachedItemsDescription` carries 02 documents, non-graphic.
 *   - `archiveLine` matches the default in `EMPTY_BM001_FORM_INPUTS`.
 */
const BM001_DEMO = {
  // Header — agency
  "receiver.fullName": "Nguyễn Thị Mai",
  "receiver.positionTitle": "Kiểm sát viên sơ cấp",
  "receiver.departmentName": "Viện Kiểm sát nhân dân Khu vực 7",
  "receiver.signerName": "Nguyễn Thị Mai",
  // Issue place/date line — built like BM-171's `document.issuePlaceAndDateLine`.
  // BM-001 renders this exactly via the systemDate transform; we pre-fill the
  // synthetic value here so the demo render skips the empty-data path.
  "document.issuePlaceDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026",
  // Informant — synthetic Vietnamese citizen, no real PII.
  "informant.fullName": "Trần Văn Bình",
  "informant.genderLabel": "Nam",
  "informant.otherName": "Không có",
  "informant.birthDay": "08",
  "informant.birthMonth": "09",
  "informant.birthYear": "1985",
  "informant.placeOfBirth": "Tỉnh Bình Dương",
  "informant.nationality": "Việt Nam",
  "informant.ethnicity": "Kinh",
  "informant.religion": "Không",
  "informant.occupation": "Lao động tự do",
  "informant.identityNo": "079085001234",
  "informant.identityIssuedDay": "14",
  "informant.identityIssuedMonth": "12",
  "informant.identityIssuedYear": "2021",
  "informant.identityIssuedPlace":
    "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
  "informant.permanentAddress":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "informant.temporaryAddress": "Không có",
  "informant.currentAddress":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "informant.phone": "0901234567",
  "informant.representedOrganization": "Không",
  "informant.signerName": "Trần Văn Bình",
  // Archive
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  // Reception start — 08:00 on 04/03/2026 at VKS Khu vực 7
  "reception.startedAtTimeText": "08 giờ 00 phút",
  "reception.startedAtDay": "04",
  "reception.startedAtMonth": "03",
  "reception.startedAtYear": "2026",
  "reception.locationName":
    "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  // Crime report content — synthetic, non-graphic, no template tokens.
  "crimeReport.content":
    "Ông Trần Văn Bình trình bày: vào khoảng 21 giờ ngày 01/3/2026, tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, Thành phố Hồ Chí Minh có một nhóm đối tượng lạ mặt tụ tập đánh bạc bằng hình thức đánh bài tây. Người cung cấp nguồn tin đề nghị cơ quan chức năng xác minh, xử lý theo quy định pháp luật.",
  "crimeReport.attachedItemsDescription":
    "01 bản tường trình của người cung cấp nguồn tin; 01 bản sao chụp giấy tờ tùy thân; 01 đoạn video ngắn ghi lại hình ảnh nhóm đối tượng (lưu trên đĩa CD kèm theo).",
  // Reception end — 08:30 same day
  "reception.endedAtTimeText": "08 giờ 30 phút",
  "reception.endedAtDay": "04",
  "reception.endedAtMonth": "03",
  "reception.endedAtYear": "2026",
} as const;

/**
 * Stale fallbacks — strings the panel must NOT keep as the user-visible
 * value. Mirrors BM-171's pattern:
 *
 *   - `informant.fullName` may come from the UI's `fillCustomerSample`
 *     button as "" or as the receiver fullName (legacy bug). Treat
 *     those as missing.
 *   - `informant.signerName` may come back as the receiver's name
 *     because the legacy UI auto-populated `informant.signerName = next.
 *     receiver.signerName` when `informant.fullName` was blank. The
 *     `Nguyễn Thị Hồng Hạnh` literal is the verified legacy fallback.
 *   - `crimeReport.content` historically had `Ông  cung cấp...` (two
 *     spaces, blank name); the gate must reject that pattern.
 *   - The general placeholder tokens (`{{`, `}}`, `null`, `undefined`,
 *     `[object Object]`) are stale in any rendered text.
 */
const BM001_STALE_FALLBACKS = {
  "informant.fullName": [
    "Nguyễn Thị Hồng Hạnh",
  ],
  "informant.signerName": [
    "Nguyễn Thị Hồng Hạnh",
  ],
  "crimeReport.content": [
    "Ông  cung cấp",
  ],
} as const;

const BM001_ACCEPTANCE = {
  // Substrings that MUST appear in the rendered DOCX text.
  requiredText: [
    "BIÊN BẢN",
    "Tiếp nhận nguồn tin về tội phạm",
    "Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự",
    // Anchored to demo values — names must match the demo fixture.
    "Nguyễn Thị Mai",
    "Trần Văn Bình",
    "I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM",
    "II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO",
    "Việc tiếp nhận nguồn tin về tội phạm kết thúc",
    "NGƯỜI CUNG CẤP",
    "NGƯỜI TIẾP NHẬN",
  ],
  // Substrings that MUST NOT leak into the rendered DOCX. The first
  // three are template placeholders; the rest are BM-001-specific
  // legacy stale strings.
  forbiddenText: [
    "{{",
    "}}",
    "Ông  cung cấp", // legacy two-space bug from fillCustomerSample
    "undefined",
    "null",
    "[object Object]",
    // Legacy receiver-name reused as informant signer.
    "Nguyễn Thị Hồng Hạnh",
  ],
};

/**
 * Quick-check lines. Anchors data the panel can show before the user
 * hits "Lưu + render DOCX". Eight entries; all sums to 8 quick-check
 * anchors without overflowing the summary card budget.
 */
const BM001_SUMMARY_LINES = [
  {
    label: "Thời gian / địa điểm tiếp nhận",
    value: (data: Record<string, unknown>) => {
      const time = readSummaryValue(data, "reception.startedAtTimeText");
      const day = readSummaryValue(data, "reception.startedAtDay");
      const month = readSummaryValue(data, "reception.startedAtMonth");
      const year = readSummaryValue(data, "reception.startedAtYear");
      const place = readSummaryValue(data, "reception.locationName");
      const pieces = [time ?? "—"];
      const dateBits = [day, month, year].filter(
        (v): v is string => !!v && v.length > 0,
      );
      if (dateBits.length === 3) pieces.push(`ngày ${dateBits.join("/")}`);
      if (place) pieces.push(`tại ${place}`);
      return pieces.join(" — ");
    },
  },
  {
    label: "Người tiếp nhận",
    value: (data: Record<string, unknown>) => {
      const name = readSummaryValue(data, "receiver.fullName");
      const title = readSummaryValue(data, "receiver.positionTitle");
      const dept = readSummaryValue(data, "receiver.departmentName");
      if (!name && !title && !dept) return "—";
      return [title, name, dept]
        .filter((p): p is string => !!p && p.length > 0)
        .join(" — ");
    },
  },
  {
    label: "Người cung cấp nguồn tin",
    value: (data: Record<string, unknown>) =>
      readSummaryValue(data, "informant.fullName") ?? "—",
  },
  {
    label: "Nội dung nguồn tin",
    value: (data: Record<string, unknown>) => {
      const content = readSummaryValue(data, "crimeReport.content");
      if (!content) return "—";
      return content.length > 120
        ? `${content.slice(0, 117)}…`
        : content;
    },
  },
  {
    label: "Tài liệu, đồ vật giao nộp",
    value: (data: Record<string, unknown>) =>
      readSummaryValue(data, "crimeReport.attachedItemsDescription") ?? "—",
  },
  {
    label: "Thời gian kết thúc",
    value: (data: Record<string, unknown>) => {
      const time = readSummaryValue(data, "reception.endedAtTimeText");
      const day = readSummaryValue(data, "reception.endedAtDay");
      const month = readSummaryValue(data, "reception.endedAtMonth");
      const year = readSummaryValue(data, "reception.endedAtYear");
      const dateBits = [day, month, year].filter(
        (v): v is string => !!v && v.length > 0,
      );
      const dateStr =
        dateBits.length === 3 ? `ngày ${dateBits.join("/")}` : null;
      return [time, dateStr].filter((p): p is string => !!p).join(" — ") ||
        "—";
    },
  },
  {
    label: "Chữ ký",
    value: (data: Record<string, unknown>) => {
      const informantSigner =
        readSummaryValue(data, "informant.signerName") ??
        readSummaryValue(data, "informant.fullName");
      const receiverSigner =
        readSummaryValue(data, "receiver.signerName") ??
        readSummaryValue(data, "receiver.fullName");
      const parts: string[] = [];
      if (informantSigner) parts.push(`Người cung cấp: ${informantSigner}`);
      if (receiverSigner) parts.push(`Người tiếp nhận: ${receiverSigner}`);
      return parts.length === 0 ? "—" : parts.join(" / ");
    },
  },
  {
    label: "Dòng lưu hồ sơ",
    value: (data: Record<string, unknown>) =>
      readSummaryValue(data, "recipients.archiveLine") ?? "—",
  },
] as const;

/**
 * Read a trimmed string at a dot-path. Returns `undefined` when the
 * path is missing, the value is not a string, the trimmed value is
 * empty, OR the value matches a known stale fallback (either the
 * `BM001_STALE_FALLBACKS` map below or the global blocklist).
 */
function readSummaryValue(
  data: Record<string, unknown>,
  path: string,
): string | undefined {
  const raw = readFormFlightPath(data, path);
  if (raw === undefined) return undefined;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  // Per-path stale fallbacks declared on the profile.
  const perPath = BM001_STALE_FALLBACKS[
    path as keyof typeof BM001_STALE_FALLBACKS
  ];
  if (
    perPath &&
    Array.isArray(perPath) &&
    (perPath as readonly string[]).includes(trimmed)
  ) {
    return undefined;
  }
  // Global blocklist shared with BM-171.
  if (isKnownStaleFallback(trimmed)) return undefined;
  return trimmed;
}

export const BM001_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-001",
  title: "Biên bản tiếp nhận nguồn tin về tội phạm",
  // Adopted alongside BM-171 — see `profile-status.ts` and
  // `RESTORE_BM001_PRE_PR7B_RUNTIME_UI_AND_BLOCK_SKELETON_TAKEOVER`.
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM001_FIELD_PATHS,
  requiredFieldPaths: BM001_REQUIRED_FIELD_PATHS,
  demo: BM001_DEMO,
  staleFallbacks: BM001_STALE_FALLBACKS,
  summaryLines: BM001_SUMMARY_LINES,
  acceptance: BM001_ACCEPTANCE,
};

// Side-effect: register on module import. Consumers that want the
// profile registered (the shared-core payload builder, the summary
// resolver, the acceptance scanner) must import this module by file
// path, mirroring the BM-171 pattern.
registerFormFlightProfile(BM001_FORM_FLIGHT_PROFILE);
