# Runtime UX Smart Field Contract

> Status: ACTIVE — extends the runtime-ux profile layer introduced for
> BM-171 / BM-001. Authored 2026-07-07 by the BM-001 Smart Runtime UX
> Redesign phase. Cross-references:
> - Runtime UX profile type: `apps/web/src/lib/runtime-ux/runtime-ux-profile.ts`
> - Renderer: `apps/web/src/features/forms-contracts/ContractV2Renderer.tsx`
> - Smart helpers (new): `apps/web/src/lib/runtime-ux/smart-field-helpers.ts`
> - BM-001 profile: `apps/web/src/lib/runtime-ux/bm001-runtime-ux-profile.ts`
> - BM-171 profile: `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts`
> - Guard test: `apps/web/src/lib/form-flight/runtime-ux-smart-field-contract.guard.test.mjs`

## 1. Why this contract exists

The locked BM-001 / BM-171 DOCX contracts split legal dates into
`birthDay / birthMonth / birthYear` and place/date lines into a single
`document.issuePlaceDateLine`. The runtime template workspace
(`/templates/BM-001`) needs to render a **legal-document-grade entry
surface** that:

1. Asks the operator for ONE meaningful fact at a time (a date, a
   time, a place), not for raw DOCX slot fragments.
2. Derives the multiple locked-contract targets from that single fact.
3. Falls back to the legacy `<input type="text">` path for every
   profile that does not opt in — no behaviour change for skeletons.

The `RuntimeUxProfile.fields[key]` override type today only supports
`label / placeholder / helpText / control: "TEXT" | "TEXTAREA" | "DATE_TEXT"`.
That is enough for BM-171 (which uses `DATE_TEXT` for two birth / issue
fields and `TEXTAREA` for long legal-basis lines) but it does NOT cover
the BM-001 case where:

- The locked contract splits ONE date into three slots
  (`birthDay / birthMonth / birthYear` and the same for identity
  issue date, reception start, reception end).
- The locked contract carries a single `document.issuePlaceDateLine`
  string but the operator should not have to type
  `"Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026"` by hand.
- The operator needs `reception.startedAtTimeText` ("08 giờ 00 phút")
  to come from a `<input type="time">`, not free text.
- The operator needs `informant.genderLabel` to be a `<select>` of
  `Nam / Nữ / Khác` instead of a free-text input.

This contract defines a tiny, opt-in `smart` extension to the existing
field override. It is additive: every existing field without
`smart` metadata renders exactly the same as before.

## 2. Conceptual shape

```ts
type RuntimeUxSmartFieldKind =
  | "text"          // explicit fallback to plain text input (default)
  | "textarea"      // multi-line text
  | "date"          // native <input type="date">, ISO value in storage
  | "time"          // native <input type="time">, HH:mm value in storage
  | "select"        // <select> with the override's `options`
  | "date-parts"    // one <input type="date"> mapped to day/month/year
  | "year-or-date"  // one <input type="date">; year-only accepted
  | "issue-place-date-line";

type RuntimeUxSmartField = {
  /** Field key the smart control binds to. */
  key: string;
  /** Field label shown to the operator (overrides contract label). */
  label?: string;
  /** Input control kind. Default: "text". */
  kind?: RuntimeUxSmartFieldKind;
  /** In-form hint text. */
  placeholder?: string;
  /** Allowed values for `kind: "select"`. */
  options?: readonly string[];
  /** Number of rows for `kind: "textarea"`. Default: 3. */
  rows?: number;
  /**
   * Hidden target paths that this control ALSO writes. Required for
   * `date-parts`, `year-or-date`, and `issue-place-date-line`. Each
   * target path receives the derived string value (DD, MM, YYYY, or a
   * full Vietnamese line) the helper computes from the visible input.
   */
  derivedTargets?: readonly string[];
};
```

### 2.1 Concrete extension on `RuntimeUxProfile.fields[key]`

```ts
type RuntimeUxFieldOverride = {
  readonly label?: string;
  readonly placeholder?: string;
  readonly helpText?: string;
  readonly control?: "TEXT" | "TEXTAREA" | "DATE_TEXT";
  readonly smart?: RuntimeUxSmartField;
};
```

The `control` field is unchanged. `smart` is the new opt-in. When
`smart.kind` is present, the renderer uses the smart branch and
ignores the legacy `control` for that field (so authors do not have
to set both).

## 3. Smart-kind semantics

| kind                    | Visible input            | Storage value                          | Derivation (helper)                                                                                          |
| ----------------------- | ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `text`                  | `<input type="text">`    | raw string                             | none                                                                                                         |
| `textarea`              | `<textarea>`             | raw string                             | none                                                                                                         |
| `date`                  | `<input type="date">`    | `"YYYY-MM-DD"` ISO                     | none                                                                                                         |
| `time`                  | `<input type="time">`    | `"HH:mm"`                              | none                                                                                                         |
| `select`                | `<select>`               | raw string                             | none — value chosen from `options`                                                                          |
| `date-parts`            | `<input type="date">`    | `derivedTargets[0..2]`                 | `deriveDateToDayMonthYear(iso)` → `Day="DD"`, `Month="MM"`, `Year="YYYY"` written to `derivedTargets`        |
| `year-or-date`          | `<input type="date">`    | `derivedTargets[0..2]`                 | `deriveYearOrDateToBirthParts(iso)` → if full date: all three; if year-only: only `Year`                       |
| `issue-place-date-line` | place `<input type="text">` + `<input type="date">` | `derivedTargets[0]` | `formatVietnameseIssueLine(place, iso)` → `"<place>, ngày DD tháng MM năm YYYY"` (place trimmed, default `""`) |

### 3.1 Field key conventions

- The renderer always renders the smart control at the field key from
  `runtime-ux-profile.fields[key]`. The "visible key" is the same key
  the operator sees; the "derived keys" are the locked-contract
  targets the helper writes to.
- For `date-parts` and `year-or-date` the **visible key is intentionally
  missing from `BM001_FIELD_PATHS`** (BM-001's canonical Form Flight
  profile in `apps/web/src/lib/form-flight/profiles/bm001.ts` only
  carries the three derived parts). The smart control writes to the
  derived keys; the locked contract never sees the ISO value. The
  ContractV2Renderer hides the bare `birthDay / birthMonth / birthYear`
  fields from the visible UX when their sibling smart control
  declares them as `derivedTargets` — see §4.

### 3.2 Derived-target write semantics

The renderer uses the existing `setPath(data, path, value)` helper
(already in `ContractV2Renderer.tsx`) for every write. For multi-target
fields (date-parts / year-or-date / issue-place-date-line) the renderer
fires one `onChange(nextData)` per write; React batches the result. The
renderer NEVER writes to the visible key for a derived field — only to
`derivedTargets`. The legacy contract field keys remain in the data
payload (because the renderer still iterates `contract.fields`); the
smart control simply wins the user input for them.

## 4. Renderer behaviour for derived targets

`ContractV2Renderer` iterates `contract.fields`. When a smart control
declares `derivedTargets` that intersect with `contract.fields[*].key`,
the renderer hides that contract field from the visible grid. Concretely:

```
isFieldHiddenBySmartOverride(field.key) =
  uxProfile && Object.values(uxProfile.fields).some(
    (f) => f.smart && f.smart.derivedTargets?.includes(field.key)
  )
```

If `isFieldHiddenBySmartOverride` is true the field is filtered out of
`fields.map((field) => <FieldControl ... />)`. The field's slot is
still present in `data` (the smart control wrote to it); the locked
contract render still sees the value; the operator never sees the raw
`DD / MM / YYYY` triplet.

This is the surgical change that makes the screenshot disappear. No
other renderer behaviour changes.

## 5. Helper functions

`apps/web/src/lib/runtime-ux/smart-field-helpers.ts` exports pure
helpers consumed by the renderer AND the guard tests:

- `parseIsoDate(value: string): { y: number; m: number; d: number } | null`
- `toDayMonthYear(value: string): { day: string; month: string; year: string } | null`
- `deriveDateToDayMonthYear(value: string): Record<"day" | "month" | "year", string>` — zero-padded DD / MM, YYYY as-is
- `deriveYearOrDateToBirthParts(value: string): { day: ""; month: ""; year: string } | { day: string; month: string; year: string }` — year-only accepted; full date fills all three
- `formatVietnameseIssueLine(place: string, iso: string): string` — `"Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026"`; default place `""` collapses to `"ngày DD tháng MM năm YYYY"`
- `isHiddenBySmartOverride(uxProfile, fieldKey): boolean` — renderer-side filter
- `applySmartFieldWrites(data, smart, rawValue): Record<string, unknown>` — pure: takes data + smart metadata + raw input, returns next data with derived keys written

All helpers are pure. No DOM, no fetch, no console. Safe to import
from `node:test` guard files.

## 6. Localstorage / draft behaviour

The smart controls do NOT change the localStorage draft key. The key
is still `qllaw:runtime-template-draft:<templateCode>:<contractHash>`
(built by `buildRuntimeTemplateDraftKey` in
`apps/web/src/lib/runtime-template-draft.ts`). The renderer writes the
derived keys (e.g. `informant.birthDay / birthMonth / birthYear`) into
the same draft payload, so reopening the page restores the operator's
choices exactly as before.

For BM-001 the stale-value workflow becomes:

1. **First visit after the smart-UX promotion**: the draft key may
   still hold a legacy draft that wrote `informant.fullName =
   "Nguyễn Văn A"` and `informant.birthYear = "1980"` etc. The page
   renders the smart controls AND the legacy draft values, so the
   user sees `Nguyễn Văn A` in the smart name input and `1980` in the
   smart year field. The page surfaces a non-blocking warning
   (`"Đang dùng bản nháp cũ. Bấm Xóa bản nháp hoặc Dữ liệu demo để
   cập nhật dữ liệu mẫu mới."`) so the operator knows what to do.
2. **`Xóa bản nháp` button**: clears `data` to `{}` AND removes the
   localStorage key (the workspace already exposes `resetDraft()`
   which sets `data = {}`; the new behaviour also removes the
   storage entry).
3. **`Dữ liệu demo` button**: keeps the existing `demo-reset` payload
   path; `BM001_DEMO_RUNTIME_UX` now contains the BM001_DEMO-aligned
   values (`Nguyễn Thị Mai`, `Trần Văn Bình`, `1985`), so the smart
   year control shows `1985` after the demo button is pressed.

The legacy demo registry at `apps/web/src/features/forms-contracts/sample-data.ts`
(`SAMPLE_REGISTRY["BM-001"]` → `"Nguyễn Văn A / Trần Thị B / 1980"`)
is NOT used for BM-001 anymore (the workspace's `applySampleData`
already prefers `uxProfile?.demo` and falls back to the registry only
when the profile is missing). The guard test in §7 proves the
fallback registry does NOT contain those values for runtime-ready
profiles.

## 7. Guard test (Phase 7)

`apps/web/src/lib/form-flight/runtime-ux-smart-field-contract.guard.test.mjs`
asserts:

1. The smart-field contract doc + JSON exist.
2. The `smart-field-helpers.ts` module exports every helper listed in §5.
3. `deriveDateToDayMonthYear("2026-03-04")` returns `{ day: "04", month: "03", year: "2026" }`.
4. `deriveYearOrDateToBirthParts("1985-01-01")` returns all three; with year-only `1985-01-01` not given it falls back to year-only mode (covered by passing `""` for month / day).
5. `formatVietnameseIssueLine("Thành phố Hồ Chí Minh", "2026-03-04")` returns
   `"Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026"`.
6. `isHiddenBySmartOverride(...)` returns true for fields listed in
   `derivedTargets` and false otherwise.
7. `bm001-runtime-ux-profile.ts` declares smart metadata for at least:
   - `informant.birthDay/Month/Year` (year-or-date)
   - `informant.identityIssuedDay/Month/Year` (date-parts)
   - `reception.startedAtDay/Month/Year` (date-parts)
   - `reception.endedAtDay/Month/Year` (date-parts)
   - `document.issuePlaceDateLine` (issue-place-date-line)
   - `reception.startedAtTimeText` (time)
   - `reception.endedAtTimeText` (time)
   - `informant.genderLabel` (select)
8. `bm171-runtime-ux-profile.ts` is UNCHANGED.
9. No auto-generated skeleton (`bm002.ts` … `bm213.ts`) declares
   `smart:` — skeleton's `fields` is empty.
10. The BM-001 smart profile's demo values do NOT contain
    `Nguyễn Văn A`, `Trần Thị B`, `1980` (stale demo guard), and
    DO contain `Nguyễn Thị Mai`, `Trần Văn Bình`, `1985`.

## 8. Future BM-NNN promotion recipe

A future BM-NNN that wants smart UX does the following (additive only):

1. Append the code to `RUNTIME_READY_FORM_FLIGHT_PROFILES` in
   `apps/web/src/lib/form-flight/form-lifecycle.ts`.
2. Add `import * as _runtimeReadyImportsBmNNN from "./profiles/bmNNN"`
   in the same file.
3. Author `apps/web/src/lib/form-flight/profiles/bmNNN.ts` (mirror
   BM-001's `FormFlightProfile` shape).
4. Author `apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts`
   with `fields` that opt into `smart` for date / time / select
   fields as appropriate.
5. Register the profile via the existing
   `registerRuntimeUxProfile(BMNNN_PROFILE)` side-effect call.
6. Add `import "./bmNNN-runtime-ux-profile"` to
   `apps/web/src/lib/runtime-ux/index.ts`.
7. Run the existing guard tests — they will catch any drift from the
   skeleton-fail-closed invariant.

No code in `ContractV2Renderer` needs to change for a new form. The
renderer branches on `fieldOverride?.smart?.kind` once and supports
every kind the helper module covers.

## 9. Out of scope

- No new dependency (no date library, no validator, no UI kit).
- No rewrite of `ContractV2Renderer`. The renderer gains ONE
  pre-render filter (`isHiddenBySmartOverride`) and ONE extra branch
  inside `FieldControl`. Total diff in `ContractV2Renderer.tsx` ≤ 80
  lines.
- No mutation of locked contract, normalized DOCX, or
  `CompiledFormContract`.
- No new endpoint, no DB row, no `generatedDocumentId`.
- No promotion of any other skeleton form.
- No smart-UX for BM-171 in this phase (BM-171's current DATE_TEXT
  controls are good enough; touching it risks regression).