/**
 * BM-001 runtime UX profile — UI-only override metadata for the standalone
 * `/templates/BM-001` template page.
 *
 * Why this file exists
 * --------------------
 * Before this profile the template runtime workspace
 * (`TemplatePreviewWorkspace`) mounted `<ContractV2Renderer>` with
 * `uxProfile = getRuntimeUxProfile("BM-001") = null`. Without a profile:
 *
 *   - the renderer fell back to the generic `getSampleData(...)`
 *     heuristic which leaked `person.fullName = "Nguyễn Văn A"`,
 *     `informant.fullName = "Trần Thị B"`, `informant.birthYear = "1980"`,
 *   - the renderer relied on `form-section-labels.localizeSectionTitle`,
 *     which does not know the BM-001 section IDs `section-tiep-nhan-nguon-tin`
 *     and `section-noi-dung-nguon-tin`, so those sections rendered with
 *     the placeholder fallback "Thông tin bổ sung".
 *
 * With this profile registered (and imported once from
 * `apps/web/src/lib/runtime-ux/index.ts`):
 *
 *   - `getRuntimeUxProfile("BM-001")` returns a populated profile,
 *     - the renderer uses BM-001's section titles (e.g.
 *       "5. Nội dung tiếp nhận" and "6. Nội dung nguồn tin"),
 *     - field labels are short Vietnamese legal-document wording,
 *     - the demo button uses `BM001_DEMO` values (Nguyễn Thị Mai,
 *       Trần Văn Bình, 1985) instead of the generic heuristic,
 *   - the "Kiểm tra nhanh nội dung chính" summary card surfaces the
 *     eight BM-001 quick-check anchors before the user clicks
 *     "Xem trước bản in".
 *
 * Source of truth
 * ---------------
 * - Locked contract: `docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3
 *   .contract.locked.json` (read-only here, NEVER mutated).
 * - Compiled contract: `docs/audit/docx/compiled-v2/BM-001.compiled.json`
 *   (section IDs below match `source.sections[].id` exactly).
 * - Form Flight profile: `apps/web/src/lib/form-flight/profiles/bm001.ts`
 *   (`BM001_DEMO` and `BM001_SUMMARY_LINES` are mirrored here).
 *
 * What this profile MUST NOT touch
 * --------------------------------
 * - No mutation of locked contract, normalized DOCX, or `CompiledFormContract`.
 * - No DB row creation; no `generatedDocumentId` fabrication.
 * - No call to the generated-document save endpoint.
 * - No promotion of any skeleton form (BM-001 was promoted in a previous
 *   phase; this file extends the visual template-side story).
 *
 * Future BM-NNN parity
 * --------------------
 * Future runtime-ready promotions create an analogous
 * `bmNNN-runtime-ux-profile.ts` in this folder and add ONE line of
 * side-effect import to `apps/web/src/lib/runtime-ux/index.ts`. No
 * changes to `TemplatePreviewWorkspace` are required — the workspace
 * already looks up `getRuntimeUxProfile(templateCode)` per template.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

/**
 * BM-001 section display order + titles. Section IDs MUST match the
 * compiled contract (`source.sections[].id` in
 * `docs/audit/docx/compiled-v2/BM-001.compiled.json`). Verified by
 * direct read of the compiled JSON; this contract defines six sections
 * in this order.
 *
 * Replaces the previous fallback string ("Thông tin bổ sung") for the
 * two Vietnamese-titled sections that `form-section-labels.localizeSectionTitle`
 * does not know about.
 */
const BM001_SECTIONS = [
  {
    sectionId: "section-document",
    title: "1. Thông tin chung biên bản",
    description:
      "Địa danh và ngày lập biên bản tiếp nhận nguồn tin về tội phạm.",
  },
  {
    sectionId: "section-receiver",
    title: "2. Người tiếp nhận",
    description:
      "Kiểm sát viên tiếp nhận nguồn tin — họ tên, chức vụ, đơn vị công tác.",
  },
  {
    sectionId: "section-informant",
    title: "3. Người cung cấp nguồn tin",
    description:
      "Nhân thân và thông tin liên lạc của người cung cấp nguồn tin về tội phạm.",
  },
  {
    sectionId: "section-recipients",
    title: "4. Nơi lưu hồ sơ",
    description: "Dòng lưu hồ sơ theo quy định nghiệp vụ.",
  },
  {
    sectionId: "section-tiep-nhan-nguon-tin",
    title: "5. Diễn biến tiếp nhận",
    description:
      "Thời gian, địa điểm bắt đầu và kết thúc việc tiếp nhận nguồn tin.",
  },
  {
    sectionId: "section-noi-dung-nguon-tin",
    title: "6. Nội dung nguồn tin",
    description:
      "Trình bày diễn biến vụ việc, nguồn tin và các tài liệu, đồ vật kèm theo.",
  },
] as const;

/**
 * BM-001 field-level overrides. The compiled contract already ships
 * sensible Vietnamese labels; this map only narrows labels to short
 * legal-document wording where the compiled label is too long, and
 * upgrades the long `Nội dung nguồn tin, vụ việc` and `Tài liệu, đồ
 * vật kèm theo` fields to `TEXTAREA` explicitly (the compiled contract
 * already declares `x-control: TEXTAREA` for them, but `control`
 * field on `field.key` is the path used by the renderer).
 *
 * Note: the names and addresses mirror `BM001_DEMO` so a demo click on
 * `/templates/BM-001` produces a render that matches the BM-001 golden
 * validation artifact at
 * `docs/audit/unified-bm-workspace/bm001-golden/`.
 */
const BM001_FIELDS = {
  "document.issuePlaceDateLine": {
    label: "Địa danh, ngày lập",
    placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026",
    smart: {
      key: "document.issuePlaceDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Hồ Chí Minh",
      derivedTargets: ["document.issuePlaceDateLine"],
    },
  },
  "receiver.fullName": {
    label: "Họ tên người tiếp nhận",
    placeholder: "Nguyễn Thị Mai",
  },
  "receiver.positionTitle": {
    label: "Chức vụ",
    placeholder: "Kiểm sát viên sơ cấp",
    smart: {
      key: "receiver.positionTitle",
      kind: "select",
      options: [
        "Kiểm sát viên",
        "Kiểm sát viên sơ cấp",
        "Kiểm sát viên trung cấp",
        "Kiểm sát viên cao cấp",
        "Kiểm tra viên",
        "Cán bộ tiếp nhận",
      ],
    },
  },
  "receiver.departmentName": {
    label: "Đơn vị công tác",
    placeholder: "Viện Kiểm sát nhân dân Khu vực 7",
  },
  "receiver.signerName": {
    label: "Người ký (người tiếp nhận)",
    placeholder: "Nguyễn Thị Mai",
  },
  "informant.fullName": {
    label: "Họ tên người cung cấp tin",
    placeholder: "Trần Văn Bình",
  },
  "informant.genderLabel": {
    label: "Giới tính",
    placeholder: "Nam",
    smart: {
      key: "informant.genderLabel",
      kind: "select",
      options: ["Nam", "Nữ", "Khác"],
    },
  },
  "informant.otherName": {
    label: "Tên gọi khác (bí danh)",
    placeholder: "Không có",
  },
  // Year-or-date smart control bound to `informant.birthYear`. The
  // visible key is `informant.birthYear` so the renderer routes the
  // operator's input through the smart branch. The helper derives
  // `informant.birthDay` + `informant.birthMonth` + `informant.birthYear`
  // and writes them via the multi-target envelope. The locked contract
  // still receives the three-part triplet it always did.
  "informant.birthYear": {
    label: "Ngày sinh (chọn năm — có thể bỏ ngày/tháng)",
    placeholder: "1985-09-08",
    smart: {
      key: "informant.birthYear",
      kind: "year-or-date",
      placeholder: "Chọn ngày sinh — bỏ trống ngày/tháng nếu chỉ nhớ năm",
      derivedTargets: [
        "informant.birthDay",
        "informant.birthMonth",
        "informant.birthYear",
      ],
    },
  },
  "informant.birthDay": {
    label: "(ẩn) Ngày sinh — do smart control tạo",
    placeholder: "08",
  },
  "informant.birthMonth": {
    label: "(ẩn) Tháng sinh — do smart control tạo",
    placeholder: "09",
  },
  "informant.placeOfBirth": {
    label: "Nơi sinh",
    placeholder: "Tỉnh Bình Dương",
  },
  "informant.nationality": {
    label: "Quốc tịch",
    placeholder: "Việt Nam",
    smart: {
      key: "informant.nationality",
      kind: "select",
      options: ["Việt Nam", "Lào", "Campuchia", "Trung Quốc", "Khác"],
    },
  },
  "informant.ethnicity": {
    label: "Dân tộc",
    placeholder: "Kinh",
  },
  "informant.religion": {
    label: "Tôn giáo",
    placeholder: "Không",
    smart: {
      key: "informant.religion",
      kind: "select",
      options: ["Không", "Phật giáo", "Thiên Chúa giáo", "Tin Lành", "Hòa Hảo", "Cao Đài", "Khác"],
    },
  },
  "informant.occupation": {
    label: "Nghề nghiệp",
    placeholder: "Lao động tự do",
  },
  "informant.identityNo": {
    label: "Số CCCD/CMND",
    placeholder: "079085001234",
  },
  // Date-parts smart control bound to `informant.identityIssuedDay`.
  // The visible key is `informant.identityIssuedDay` so the renderer
  // routes the operator's input through the smart branch and the
  // helper writes the triplet via the multi-target envelope.
  "informant.identityIssuedDay": {
    label: "Ngày cấp CCCD/CMND",
    placeholder: "14/12/2021",
    smart: {
      key: "informant.identityIssuedDay",
      kind: "date-parts",
      placeholder: "Chọn ngày cấp CCCD/CMND",
      derivedTargets: [
        "informant.identityIssuedDay",
        "informant.identityIssuedMonth",
        "informant.identityIssuedYear",
      ],
    },
  },
  "informant.identityIssuedMonth": {
    label: "(ẩn) Tháng cấp — do smart control tạo",
    placeholder: "12",
  },
  "informant.identityIssuedYear": {
    label: "(ẩn) Năm cấp — do smart control tạo",
    placeholder: "2021",
  },
  "informant.identityIssuedPlace": {
    label: "Nơi cấp",
    placeholder: "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
  },
  "informant.permanentAddress": {
    label: "Nơi thường trú",
    placeholder:
      "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  },
  "informant.temporaryAddress": {
    label: "Nơi tạm trú",
    placeholder: "Không có",
  },
  "informant.currentAddress": {
    label: "Nơi ở hiện tại",
    placeholder:
      "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  },
  "informant.phone": {
    label: "Số điện thoại",
    placeholder: "0901234567",
  },
  "informant.representedOrganization": {
    label: "Người đại diện cơ quan, tổ chức",
    placeholder: "Không",
  },
  "informant.signerName": {
    label: "Người ký (người cung cấp tin)",
    placeholder: "Trần Văn Bình",
  },
  "recipients.archiveLine": {
    label: "Dòng lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  // Time smart controls. The locked contract expects the Vietnamese
  // phrasing "08 giờ 00 phút"; the helper formats HH:mm to that
  // phrasing on write.
  "reception.startedAtTimeText": {
    label: "Giờ bắt đầu tiếp nhận",
    placeholder: "08 giờ 00 phút",
    smart: {
      key: "reception.startedAtTimeText",
      kind: "time",
      placeholder: "08:00",
    },
  },
  // Date-parts smart control bound to `reception.startedAtDay`.
  "reception.startedAtDay": {
    label: "Ngày bắt đầu tiếp nhận",
    placeholder: "04/03/2026",
    smart: {
      key: "reception.startedAtDay",
      kind: "date-parts",
      placeholder: "Chọn ngày bắt đầu tiếp nhận",
      derivedTargets: [
        "reception.startedAtDay",
        "reception.startedAtMonth",
        "reception.startedAtYear",
      ],
    },
  },
  "reception.startedAtMonth": {
    label: "(ẩn) Tháng bắt đầu — do smart control tạo",
    placeholder: "03",
  },
  "reception.startedAtYear": {
    label: "(ẩn) Năm bắt đầu — do smart control tạo",
    placeholder: "2026",
  },
  "reception.locationName": {
    label: "Địa điểm tiếp nhận",
    placeholder:
      "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  },
  "reception.endedAtTimeText": {
    label: "Giờ kết thúc tiếp nhận",
    placeholder: "08 giờ 30 phút",
    smart: {
      key: "reception.endedAtTimeText",
      kind: "time",
      placeholder: "08:30",
    },
  },
  // Date-parts smart control bound to `reception.endedAtDay`.
  "reception.endedAtDay": {
    label: "Ngày kết thúc tiếp nhận",
    placeholder: "04/03/2026",
    smart: {
      key: "reception.endedAtDay",
      kind: "date-parts",
      placeholder: "Chọn ngày kết thúc tiếp nhận",
      derivedTargets: [
        "reception.endedAtDay",
        "reception.endedAtMonth",
        "reception.endedAtYear",
      ],
    },
  },
  "reception.endedAtMonth": {
    label: "(ẩn) Tháng kết thúc — do smart control tạo",
    placeholder: "03",
  },
  "reception.endedAtYear": {
    label: "(ẩn) Năm kết thúc — do smart control tạo",
    placeholder: "2026",
  },
  "crimeReport.content": {
    label: "Nội dung nguồn tin, vụ việc",
    placeholder:
      "Ông Trần Văn Bình trình bày: vào khoảng 21 giờ ngày 01/3/2026, …",
    control: "TEXTAREA",
    smart: {
      key: "crimeReport.content",
      kind: "textarea",
      rows: 5,
      placeholder:
        "Ông Trần Văn Bình trình bày: vào khoảng 21 giờ ngày 01/3/2026, …",
    },
  },
  "crimeReport.attachedItemsDescription": {
    label: "Tài liệu, đồ vật kèm theo",
    placeholder:
      "01 bản tường trình; 01 bản sao CMND; 01 video ngắn (CD kèm theo).",
    control: "TEXTAREA",
    smart: {
      key: "crimeReport.attachedItemsDescription",
      kind: "textarea",
      rows: 4,
      placeholder:
        "01 bản tường trình; 01 bản sao CMND; 01 video ngắn (CD kèm theo).",
    },
  },
} as const;

/**
 * Synthetic Vietnamese demo fixture for BM-001. Mirrors the canonical
 * `BM001_DEMO` from `apps/web/src/lib/form-flight/profiles/bm001.ts`
 * exactly so a runtime demo click + the Form Flight `mode: "demo-reset"`
 * path produce the same render. Recognisably synthetic; no real PII.
 *
 * Bug guards honoured here (same set as `BM001_DEMO`):
 *   - No `Nguyễn Văn A`, `Trần Thị B`, `1980` legacy defaults.
 *   - No `"Ông  cung cấp"` two-space bug in `crimeReport.content`.
 *   - Receiver (`Nguyễn Thị Mai`) and informant (`Trần Văn Bình`)
 *     are deliberately distinct.
 *   - Birth year is `1985` (was `1980` in the legacy heuristic).
 */
const BM001_DEMO_RUNTIME_UX = {
  "document.issuePlaceDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026",
  "receiver.fullName": "Nguyễn Thị Mai",
  "receiver.positionTitle": "Kiểm sát viên sơ cấp",
  "receiver.departmentName": "Viện Kiểm sát nhân dân Khu vực 7",
  "receiver.signerName": "Nguyễn Thị Mai",
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
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "reception.startedAtTimeText": "08 giờ 00 phút",
  "reception.startedAtDay": "04",
  "reception.startedAtMonth": "03",
  "reception.startedAtYear": "2026",
  "reception.locationName":
    "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "crimeReport.content":
    "Ông Trần Văn Bình trình bày: vào khoảng 21 giờ ngày 01/3/2026, tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, Thành phố Hồ Chí Minh có một nhóm đối tượng lạ mặt tụ tập đánh bạc bằng hình thức đánh bài tây. Người cung cấp nguồn tin đề nghị cơ quan chức năng xác minh, xử lý theo quy định pháp luật.",
  "crimeReport.attachedItemsDescription":
    "01 bản tường trình của người cung cấp nguồn tin; 01 bản sao chụp giấy tờ tùy thân; 01 đoạn video ngắn ghi lại hình ảnh nhóm đối tượng (lưu trên đĩa CD kèm theo).",
  "reception.endedAtTimeText": "08 giờ 30 phút",
  "reception.endedAtDay": "04",
  "reception.endedAtMonth": "03",
  "reception.endedAtYear": "2026",
} as const;

/**
 * Read a trimmed string at a dot-path. Returns `undefined` when:
 *   - the path is missing / non-object,
 *   - the value is not a string,
 *   - the trimmed value is empty.
 *
 * Co-located here because the BM-001 summary lines below are the only
 * consumers. Other profiles reuse the same shape (BM-171 has its own
 * internal copy in `bm171-runtime-ux-profile.ts`).
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
  return trimmed.length === 0 ? undefined : trimmed;
}

/**
 * Quick-check summary lines for the "Kiểm tra nhanh nội dung chính"
 * card on `/templates/BM-001`. Mirrors the eight BM-001
 * `BM001_SUMMARY_LINES` from the Form Flight profile at the
 * user-facing level; if a profile is updated later, the summary
 * updates to match.
 */
function formatVietnameseTime(value: string | undefined): string | undefined {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return value;
  const [hours, minutes] = value.split(":");
  return `${hours} giờ ${minutes} phút`;
}

const BM001_SUMMARY_LINES = [
  {
    label: "Thời gian / địa điểm tiếp nhận",
    value: (data: Record<string, unknown>) => {
      const time = readNestedString(data, "reception.startedAtTimeText");
      const day = readNestedString(data, "reception.startedAtDay");
      const month = readNestedString(data, "reception.startedAtMonth");
      const year = readNestedString(data, "reception.startedAtYear");
      const place = readNestedString(data, "reception.locationName");
      const pieces: string[] = [];
      if (time) pieces.push(formatVietnameseTime(time) ?? time);
      if (day && month && year) pieces.push(`ngày ${day}/${month}/${year}`);
      if (place) pieces.push(`tại ${place}`);
      return pieces.length > 0 ? pieces.join(" — ") : "—";
    },
  },
  {
    label: "Người tiếp nhận",
    value: (data: Record<string, unknown>) => {
      const name = readNestedString(data, "receiver.fullName");
      const title = readNestedString(data, "receiver.positionTitle");
      const dept = readNestedString(data, "receiver.departmentName");
      const parts = [title, name, dept].filter(
        (p): p is string => !!p && p.length > 0,
      );
      return parts.length > 0 ? parts.join(" — ") : "—";
    },
  },
  {
    label: "Người cung cấp nguồn tin",
    value: (data: Record<string, unknown>) =>
      readNestedString(data, "informant.fullName") ?? "—",
  },
  {
    label: "Nội dung nguồn tin",
    value: (data: Record<string, unknown>) => {
      const content = readNestedString(data, "crimeReport.content");
      if (!content) return "—";
      return content.length > 120 ? `${content.slice(0, 117)}…` : content;
    },
  },
  {
    label: "Tài liệu, đồ vật giao nộp",
    value: (data: Record<string, unknown>) =>
      readNestedString(data, "crimeReport.attachedItemsDescription") ?? "—",
  },
  {
    label: "Thời gian kết thúc",
    value: (data: Record<string, unknown>) => {
      const time = readNestedString(data, "reception.endedAtTimeText");
      const day = readNestedString(data, "reception.endedAtDay");
      const month = readNestedString(data, "reception.endedAtMonth");
      const year = readNestedString(data, "reception.endedAtYear");
      const parts: string[] = [];
      if (time) parts.push(formatVietnameseTime(time) ?? time);
      if (day && month && year) parts.push(`ngày ${day}/${month}/${year}`);
      return parts.length > 0 ? parts.join(" — ") : "—";
    },
  },
  {
    label: "Chữ ký",
    value: (data: Record<string, unknown>) => {
      const informantSigner =
        readNestedString(data, "informant.signerName") ??
        readNestedString(data, "informant.fullName");
      const receiverSigner =
        readNestedString(data, "receiver.signerName") ??
        readNestedString(data, "receiver.fullName");
      const parts: string[] = [];
      if (informantSigner) parts.push(`Người cung cấp: ${informantSigner}`);
      if (receiverSigner) parts.push(`Người tiếp nhận: ${receiverSigner}`);
      return parts.length === 0 ? "—" : parts.join(" / ");
    },
  },
  {
    label: "Dòng lưu hồ sơ",
    value: (data: Record<string, unknown>) =>
      readNestedString(data, "recipients.archiveLine") ?? "—",
  },
];

const BM001_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-001",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: "BM-001 smart-runtime-ux v2 (smart field contract + generalizable primitives)",
  sections: BM001_SECTIONS,
  fields: BM001_FIELDS,
  demo: {
    ...BM001_DEMO_RUNTIME_UX,
    "reception.startedAtTimeText": "08:00",
    "reception.endedAtTimeText": "08:30",
  },
  summaryLines: BM001_SUMMARY_LINES,
};

registerRuntimeUxProfile(BM001_RUNTIME_UX_PROFILE);
