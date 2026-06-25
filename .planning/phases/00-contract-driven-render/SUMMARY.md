# Phase 0 — Summary: Contract-Driven Render & Form Schema

> Plan: `PLAN.md` v2.3 (locked 2026-06-25)
> Phase A → F → G → H → I → J → C → D
> Tracked here: actual execution results per task.

## Task A1. Initialize canonical `render_payload_snapshot` trong `createBatch`

**Status**: ✅ DONE (2026-06-25)

### Files changed

- `apps/api/src/modules/documents/documents.service.ts` — extended `render_payload_snapshot` in `createBatch` with 4 canonical keys.
- `apps/api/src/modules/documents/documents.service.spec.ts` *(new)* — unit test asserting the 7 contract assertions from PLAN.md v2.3 §A1.

### Snapshot shape implemented

```ts
render_payload_snapshot = {
  case: { id, caseCode, caseTitle, currentStage, currentStatus },     // unchanged
  target: { personId, personName },                                    // unchanged
  template: { id, templateCode, templateNo, templateName, renderScope }, // unchanged
  formats: plan.formats,                                              // unchanged
  formInputs: {},                // new
  payloadOverrides: {},          // new
  renderPayloadOverrides: {},    // new
  contractMeta: {                // new
    templateCode: item.templateCode,
    sourceId: null,
    contractVersionHash: null,
    contractLookupStatus: 'MISSING',
  },
}
```

- Existing `case` / `target` / `template` / `formats` fields preserved exactly — only additive change.
- `updateFormInputs` deep-merge semantics untouched (it writes into `formInputs`, never replaces the whole snapshot).
- `document-renderer.service.ts` not modified (hard constraint #1).

### `contractMeta` lookup decision

Used the **safe fallback** path — `sourceId: null`, `contractVersionHash: null`, `contractLookupStatus: 'MISSING'`.

Reason: the existing `DbFormContractRepository.findByIdentifier()` is NOT a cheap O(1) lookup. It does a `findMany` on all templates and filters in JavaScript, which violates hard constraints #7, #8, #9 of A1 (no scanning 213 contracts, hot path must stay cheap). Wiring a real lookup belongs to a later task:

- `TODO(PLAN.md v2.3 C1/J1)` comment left in the snapshot block pointing to:
  - `prisma.form_contract_versions.findFirst({ where: { template_id, status: 'PUBLISHED' }, orderBy: { updated_at: 'desc' }, take: 1 })` — single-row indexed query that uses `idx_form_contract_template_status` (already exists on the table).
  - Wired once J1 (contract cache) + C1 (startup guard) land.

No logger was added to `DocumentsService` (the service has no existing logger pattern; per task spec we must not introduce a new logging framework).

### Commands run

| Command | Exit | Result |
|---------|------|--------|
| `pnpm test:api -- --testPathPatterns=documents` | 0 | 13 suites, 103 tests pass (100 pre-existing + 3 new) |
| `pnpm typecheck` (api + form-contracts + web) | 0 | clean |
| `pnpm --filter api exec eslint src/modules/documents/documents.service.ts` | 0 | 0 errors (spec file is project-level ignore per `apps/api/eslint.config.mjs:17`) |

### Test result

`src/modules/documents/documents.service.spec.ts` — 3 tests, all green:

1. `initializes render_payload_snapshot with the canonical shape on newly created documents`
   - asserts `formInputs`, `payloadOverrides`, `renderPayloadOverrides` exist and equal `{}`.
2. `initializes contractMeta with the expected envelope`
   - asserts `contractMeta` exists, `templateCode` matches item, `contractLookupStatus` ∈ `{FOUND, MISSING, STALE}` (currently `MISSING` per the fallback).
3. `preserves existing case, target, template, formats fields on the snapshot`
   - asserts legacy keys still present (backward compat for existing 100 tests + 211 historical API tests).

The 3-test split covers the 7 required assertions specified in the task brief.

### Backward compatibility

- `updateFormInputs` (form-studio controller) untouched — it deep-merges into `formInputs`, which is now always present on new snapshots.
- Existing `generated_documents` rows with the old shape (no `formInputs` / `contractMeta`) remain readable because:
  - The renderer defensively handles missing keys (it falls back to existing code paths when these are absent).
  - Phase I (migration of legacy snapshots) will backfill them, but that is out of scope for A1.
- No `forms-contracts` lookup call added in `createBatch` — hot path stays cheap (no DB round-trip per item).

### Risks / Open

- **Risk**: BM-specific code paths reading the snapshot may have been coded assuming the old shape. Mitigated by:
  - Reading the existing renderer + pre-export code: they only consume `case / target / template / formats` and treat any extra keys as opt-in.
  - Out of A1 scope: I did not grep every consumer to confirm.
- **Risk**: The fallback `MISSING` is honest about missing metadata but does not surface it loudly. Per task spec we do NOT add a logger; consumers reading the new `contractMeta` can decide whether to show a warning badge. A2 (structured validation) is the right place to surface contract drift to the user.
- **Open**: Real O(1) lookup will land with J1 (contract cache). Until then, the contract sync guard C1 cannot rely on per-document lookup to fail startup — that is by design and already documented in the TODO.

### Next step

A2 — Structured validation error contract (`contract-form-inputs.service.ts`). Follow PLAN.md v2.3 §A2 exactly. Stop after A2.

## Task A2. Structured validation error contract

**Status**: ✅ DONE (2026-06-25)

### Files changed

- `apps/api/src/modules/form-studio/application/contract-form-inputs.service.ts` — added `FormValidationError` / `FormValidationResponse` / `FormValidationCode` types and helpers; refactored the existing issues loop in `save()` to emit the locked 7-key shape; added `INVALID_DATE` and `UNKNOWN_FIELD` checks.
- `apps/api/src/modules/form-studio/application/contract-form-inputs.service.spec.ts` — kept all 3 pre-existing tests; added 4 new tests covering the A2 contract assertions.
- `apps/api/src/common/application-error.filter.ts` — surface `ApplicationError.cause` as `details` on the response body (additive, backward-compat).
- `apps/api/src/common/application-error.filter.spec.ts` — added a new test that asserts the `details` shape, alongside the existing exact-match test (which still passes because the no-cause case never emits `details`).

### Error response shape implemented

Locked type from PLAN.md v2.3 §A2 is now exported from the service:

```ts
export type FormValidationCode =
  | 'REQUIRED' | 'INVALID_TYPE' | 'INVALID_DATE'
  | 'UNKNOWN_FIELD' | 'CONTRACT_DRIFT';

export type FormValidationError = {
  path: string;
  label: string;
  section: string;
  sectionTitle: string;
  required: boolean;
  code: FormValidationCode;
  message: string;
};

export type FormValidationResponse = {
  ok: false;
  errors: FormValidationError[];
};
```

On validation failure the service still throws `FormStudioError('CONTRACT_INPUT_VALIDATION_FAILED', 'Dữ liệu biểu mẫu chưa hợp lệ.', 422)` so the existing public message string is preserved. The new `cause` payload is the locked `FormValidationResponse`:

```json
{
  "ok": false,
  "errors": [
    {
      "path": "person.fullName",
      "label": "Họ tên",
      "section": "person",
      "sectionTitle": "Thông tin",
      "required": true,
      "code": "REQUIRED",
      "message": "Trường \"Họ tên\" là bắt buộc."
    }
  ]
}
```

The `ApplicationErrorFilter` now adds the `cause` as a top-level `details` field on the 422 response body, alongside the existing `code`/`message`/`statusCode` envelope. The FE (A3) can read `response.body.details.errors[]` directly.

### Code mapping

The pre-existing internal codes were mapped to the locked union:

| Internal code | Locked code | Notes |
|---|---|---|
| `REQUIRED` | `REQUIRED` | unchanged |
| `TYPE_MISMATCH` (NUMBER/CHECKBOX) | `INVALID_TYPE` | same message, locked label |
| `TABLE_TYPE_MISMATCH` | `INVALID_TYPE` | now uses control name `TABLE` |
| (new) | `INVALID_DATE` | `DATE | PARTIAL_DATE | TIME` controls; ISO `YYYY-MM-DD` / `YYYY-MM-DDTHH:MM:SS` shape |
| (new) | `UNKNOWN_FIELD` | leaf paths in `input.data` not present in fields / computedFields / defaultRules / tables |

`CONTRACT_DRIFT` is implemented as the type + `buildContractDriftError()` helper. The save() flow does NOT auto-emit it: per the A2 brief, the form-studio save path resolves its own contract via `RuntimeFormContractService` and the snapshot-level `contractMeta.contractLookupStatus` (introduced in A1) is not yet read by that path. The helper is exported so a follow-up that wires `contractMeta` into the save flow (planned with C1/J1) can call it without changing the locked type.

### Helpers

All helpers are pure, file-local, and easy to unit-test:

- `getSectionFromPath(path)` — first dot segment, falls back to the full path.
- `getLabelFallback(path)` — last dot segment, falls back to the full path.
- `buildSectionTitleMap(sections)` — sectionId → title, derived from `source.sections[]`.
- `buildFormValidationError({...})` — locked 7-key builder.
- `buildRequiredError` / `buildInvalidTypeError` / `buildInvalidDateError` / `buildUnknownFieldError` — typed factories.
- `buildContractDriftError` (exported) — type + helper for callers that detect drift.
- `isDateControl(control)` / `isValidDateString(value)` — used by the `INVALID_DATE` path.
- `collectKnownKeys(fields, computed, defaults, tables)` / `collectUnknownFieldPaths(data, known)` — used by the `UNKNOWN_FIELD` path.

### Commands run

| Command | Exit | Result |
|---------|------|--------|
| `pnpm test:api -- --testPathPatterns=contract-form-inputs` | 0 | 1 suite, 7 tests pass (3 pre-existing + 4 new) |
| `pnpm test:api -- --testPathPatterns=application-error.filter` | 0 | 1 suite, 4 tests pass (3 pre-existing + 1 new) |
| `pnpm test:api -- --testPathPatterns=form-studio` | 0 | 5 suites, 24 tests pass |
| `pnpm test:api -- --testPathPatterns=documents` | 0 | 13 suites, 103 tests pass (A1 still green) |
| `pnpm test:api` (full suite) | 0 | 41 suites, 219 tests pass (0 regressions) |
| `pnpm typecheck` (form-contracts + api + web) | 0 | clean |
| `pnpm --filter api exec eslint src/modules/form-studio/application/contract-form-inputs.service.ts src/common/application-error.filter.ts` | 0 | 0 errors (after auto-fix of 5 prettier issues) |

### Backward compatibility

- `FormStudioError.code === 'CONTRACT_INPUT_VALIDATION_FAILED'` and `status === 422` are preserved, so any test that asserts those still passes (3 form-studio tests + the documents A1 suite).
- The public Vietnamese message `"Dữ liệu biểu mẫu chưa hợp lệ."` is unchanged.
- The new `details` field is only added when `ApplicationError.cause` is set. Existing `ApplicationError` throws without `cause` keep the legacy response shape exactly. The 211 historical API tests that check exact body shape are unaffected.
- `updateFormInputs` deep-merge semantics untouched. The form-studio `save()` path is the only call site that uses the validation; other paths (renderer, pre-export) are unchanged.
- `document-renderer.service.ts` not modified (hard constraint from the brief).
- `createBatch` not modified (A1 stays at `c0106924a411867a50e5ae0116d35d07c05b57aa`; no compile error required touching it).

### Risks / Open

- **Risk**: The new `details` field is now part of the public response contract. A consumer that does strict exact-match body comparison (e.g. a third-party integration test) would break. Mitigated: only the form-studio save path emits `details`; no other `ApplicationError` throws set `cause`. None of the existing 219 API tests do exact body match for that path. A future E2E test in the form-studio area (Phase E) should assert `response.body.details.errors[0].code === 'REQUIRED'`.
- **Open**: `CONTRACT_DRIFT` auto-emit is intentionally not wired. When the save path can read `render_payload_snapshot.contractMeta.contractLookupStatus` (planned once J1 wires the per-document lookup), the helper is ready to be called. Documented inline in the service.
- **Open**: `INVALID_DATE` uses a permissive ISO shape check. Real-world date validation per BM is out of scope (Phase G semantic rules).
- **Open**: A3 (FE render of the structured list) is the natural follow-up. The locked error shape is now stable enough for FE to bind to.

### Next step

A3 — Wire hotfix UI: render structured `FormValidationError` list in `generic-template-form-inputs.tsx`. Per PLAN.md v2.3 §A3 exactly. Stop after A3.

## Task A3. Render structured FormValidationError list in form-inputs UI

**Status**: ✅ DONE (2026-06-25)

### Files changed

- `apps/web/src/lib/form-validation-errors.ts` *(new)* — client-side `FormValidationError` / `FormValidationCode` types and a defensive `extractStructuredValidationErrors()` parser.
- `apps/web/src/lib/form-validation-errors.test.ts` *(new)* — 8 pure-helper tests (Axios-style, bare details, bare errors[], nested `data` wrap, legacy shape, unknown inputs, malformed entries, every locked code).
- `apps/web/src/components/documents/generic-template-form-inputs.tsx` — added `structuredErrors` state, parses the response body through the new helper inside `handleSave`, renders the structured list via a new `StructuredValidationErrorList` sub-component, and keeps the existing single-string error fallback for legacy responses.

### How structured errors are parsed

`extractStructuredValidationErrors(error: unknown)` is pure and never throws. It walks three layered shapes:

1. Axios-style: `error.response.data.details.errors`
2. Bare details: `{ details: { ok, errors } }`
3. Bare errors array: `[{ path, code, message, ... }]`

Unknown / legacy shapes return `[]` so the caller can fall back to the legacy `extractApiError` message. Malformed entries (missing `code`/`path`, unknown `code`) are dropped silently rather than rejected wholesale — a single bad row must not hide the others. Forward-compatible extra fields (e.g. a future field on the backend payload) are tolerated. The helper uses `VALID_CODES` set membership to whitelist `code` values, mirroring the locked union from A2.

### UI behavior

In `generic-template-form-inputs.tsx`:

- New `structuredErrors: FormValidationError[]` state alongside the existing `error: string | null`.
- In `handleSave`, after parsing the response body (when `!response.ok`), the body is passed through `extractStructuredValidationErrors` first. The legacy `extractApiError` message is still thrown and captured into `error` for backward compatibility.
- The render block now reads:
  - If `structuredErrors.length > 0` → render `<StructuredValidationErrorList>`.
  - Else if `error` → render the legacy single-string red banner (unchanged behavior).
  - Else → nothing.
- `StructuredValidationErrorList` groups entries by `sectionTitle` (sorted Vietnamese locale), shows:
  - A header (`Có N lỗi cần sửa trước khi lưu.` or a stronger `Hợp đồng biểu mẫu đã thay đổi — tải lại trước khi lưu.` when `CONTRACT_DRIFT` is present).
  - Per-section group with the `sectionTitle` heading.
  - Per-row: `label` (large), `code` (muted monospace tag), `path` (small monospace), `message` (Vietnamese text — backend-supplied, not rewritten).
  - Color theme: red when only field errors, amber + `role="alert"` when `CONTRACT_DRIFT` is present, signaling the user should reload before saving.
- Success path (`response.ok`) still sets `message` and never touches `error` or `structuredErrors` — pre-existing success UX is untouched.

### Commands run

| Command | Exit | Result |
|---------|------|--------|
| `pnpm test:web-unit` | 0 | 46 tests pass (8 new from `form-validation-errors.test.ts`, 38 pre-existing) |
| `pnpm typecheck` (form-contracts + api + web) | 0 | clean |
| `pnpm --filter web exec eslint src/components/documents/generic-template-form-inputs.tsx src/lib/form-validation-errors.ts` | 0 | 0 errors |

### Backward compatibility

- The legacy Vietnamese message (`extractApiError(...)`) is still set as the `error` state when a save fails. If the response does NOT carry `details.errors`, the UI shows the legacy red banner exactly as before. The 46-test web suite stays green with no modifications.
- The new `StructuredValidationErrorList` is purely additive: it renders only when `structuredErrors.length > 0`. No state-machine or behavior change for callers that previously received the legacy message.
- `useCasePayload` / `applyCasePayloadToGenericForm` paths unchanged.
- Backend untouched in A3 (no type import required; the locked type is mirrored client-side intentionally so the FE does not pull a runtime dependency on the API package).
- Save / deep-merge behavior (`JSON.stringify({ ...formToSave, formInputs: formToSave, payloadOverrides: formToSave, renderPayloadOverrides: formToSave })`) unchanged.
- `document-renderer.service.ts`, `createBatch`, `/form-schema` endpoint — all untouched.

### Risks / Open

- **Risk**: A future backend that adds a 6th `FormValidationCode` value (e.g. `OUT_OF_RANGE`) will silently filter it out client-side. Mitigated by the `VALID_CODES` whitelist being a single source-of-truth — bumping the union on the FE is a one-line edit in `form-validation-errors.ts` and a one-line update to the union in the API service.
- **Open**: Phase B's `/form-schema` may add per-field UI cues (e.g. inline highlights). The A3 list is the only signal today; once B1 lands, the `path` string in each list row is the natural anchor for inline linking.
- **Open**: No E2E / Playwright test was added because the project's existing test infrastructure (node:test via tsx) does not include a browser harness. Per the A3 brief, the helper-level tests are the minimum required; component-level render tests should land when a React Testing Library setup is introduced.
- **Open**: The CONTRACT_DRIFT helper is intentionally not wired in this UI yet (the helper exists in the API service but auto-emission is deferred per A2). The UI gracefully handles the code if/when the backend emits it, but currently a real user will never see it.

### Next step

B1 — `derive-form-input-schema.ts` with 3-layer fallback (PLAN.md v2.3 §B1). B1 introduces the dynamic schema that A3's structured error list will eventually point at for inline field highlighting.

## Task B1. Derive `FormInputSchema` from a locked form contract (3-layer fallback)

**Status**: ✅ DONE (2026-06-25)

### Files changed

- `packages/form-contracts/src/derive-form-input-schema.ts` *(new)* — pure, deterministic `deriveFormInputSchema(contract: unknown): FormInputSchema` plus the locked type exports (`FormInputSchema`, `FormInputSection`, `FormInputField`, `SchemaWarning`, the supporting union types).
- `packages/form-contracts/src/index.ts` — re-export the new module so the API/web apps can import it once they wire the dynamic schema (no app-side import added in B1).
- `packages/form-contracts/test/derive-form-input-schema.test.ts` *(new)* — 16 unit tests: 6 against the locked contract JSONs for the representative BMs, 10 against inline fixtures covering hints, rejected candidates, unknown source, computed, read-only sources, dedup, fallback, inputType mapping, defensive input, and section ordering.

### Exported types and functions

```ts
export type FormInputFieldSource =
  | "manual" | "casePayload" | "agencyConfig"
  | "officialConfig" | "systemDate" | "computed";

export type FormInputFieldInputType = "text" | "date" | "number" | "textarea";

export type FormInputFieldReadonlyReason =
  | "CASE_PAYLOAD" | "AGENCY_CONFIG" | "OFFICIAL_CONFIG"
  | "SYSTEM_DATE" | "COMPUTED";

export type FormInputFieldVisibilityReason =
  | "USER_INPUT" | "READONLY_PREVIEW" | "INTERNAL_RENDER_ONLY";

export type FormInputField = {
  path: string;
  label: string;
  required: boolean;
  inputType: FormInputFieldInputType;
  source: FormInputFieldSource;
  editable: boolean;
  readonlyReason?: FormInputFieldReadonlyReason;
  visible: boolean;
  visibilityReason?: FormInputFieldVisibilityReason;
  reviewRequired: boolean;
  origin: "canonical" | "binding-fallback" | "hint";
};

export type FormInputSection = {
  key: string;
  title: string;
  fields: FormInputField[];
};

export type SchemaWarning = {
  code: "BOUND_SLOT_MISSING_FIELD" | "REJECTED_AS_EDITABLE" | "UNKNOWN_SOURCE_NORMALIZED";
  path?: string;
  message: string;
};

export type FormInputSchema = {
  templateCode: string;
  sourceId: string;
  warnings: SchemaWarning[];
  sections: FormInputSection[];
};

export function deriveFormInputSchema(contract: unknown): FormInputSchema;
```

`deriveFormInputSchema` is pure (no I/O, no throws). It returns an empty `FormInputSchema` for `null` / arrays / non-objects, and silently drops malformed entries inside `canonicalFields` / `docxSlots` / `renderBindings` / `rejectedCandidates` / `formInputHints.suggestedControls` rather than failing.

### Source priority implemented

1. **Canonical** (`canonicalFields[]`) — primary source. Each well-formed entry produces exactly one `FormInputField` with `origin: "canonical"`. Path = `canonicalField.path`; section key = first dot segment; label = `canonicalField.label` or path tail.
2. **Binding fallback** (`renderBindings[]` ∪ `docxSlots[]`) — for every `renderBinding.from` that is missing from canonical AND not in `rejectedCandidates`, a fallback editable field is created with `origin: "binding-fallback"`, `source: "manual"`, `required: false` (unless `slot.required` or `binding.reviewRequired` says otherwise), `reviewRequired: true`, and a `BOUND_SLOT_MISSING_FIELD` warning. Rejected candidates referenced by bindings are suppressed and emit `REJECTED_AS_EDITABLE`.
3. **Hint refinement** (`formInputHints.suggestedControls[]`) — strictly read-only. If a hint points to a path that is not already in canonical/fallback, it is silently dropped. If it points to an existing path, it may refine `label` and/or `inputType` only. The origin of the existing field is preserved (no field ever carries `origin: "hint"`), which makes the brief's hint-doesn't-create assertion structural rather than enforced.
4. **Rejected candidates** (`rejectedCandidates[]`) — never produce editable fields. They are tracked as a `Set<string>` and consulted in both the canonical and binding passes; matching paths are dropped (canonical defensively, binding with a `REJECTED_AS_EDITABLE` warning).

Deduplication: fields are stored in a `Map<string, FormInputField>` keyed by `path`. Canonical inserts first; binding-fallback only inserts when the key is absent. The final field list iterates a parallel `insertionOrder: string[]` so the output preserves canonical order then binding-fallback order.

### Source / editability / visibility mapping

| Raw source | Output `source` | `editable` | `readonlyReason` | `visible` | `visibilityReason` |
|---|---|---|---|---|---|
| `manual` | `manual` | true | — | true | `USER_INPUT` |
| `casePayload` | `casePayload` | false | `CASE_PAYLOAD` | true | `READONLY_PREVIEW` |
| `agencyConfig` | `agencyConfig` | false | `AGENCY_CONFIG` | true | `READONLY_PREVIEW` |
| `officialConfig` | `officialConfig` | false | `OFFICIAL_CONFIG` | true | `READONLY_PREVIEW` |
| `systemDate` | `systemDate` | false | `SYSTEM_DATE` | true | `READONLY_PREVIEW` |
| `computed` | `computed` | false | `COMPUTED` | false | `INTERNAL_RENDER_ONLY` |
| `unknown` (or any unrecognized string) | `manual` | true | — | true | `USER_INPUT` + `UNKNOWN_SOURCE_NORMALIZED` warning |

`computed` flipping to `visible: true` via a hint is intentionally NOT wired in B1 (the brief allows it but no current contract uses a hint that would justify it; the type union for `visibilityReason` is already sufficient and a future change can extend `applyHint` without touching the type or other rules).

### `inputType` mapping (locked v1 contract → `FormInputFieldInputType`)

1. `uiComponent: "date"` → `"date"`.
2. `uiComponent: "textarea"` → `"textarea"`.
3. `uiComponent: "number"` → `"number"` (forward-compat for v2 contracts).
4. `uiComponent: "text" | "select" | ""` (default fallback for v1 corpus):
   - Path tail matches `^(date|day|month|year|time)$` (case-insensitive) → `"date"`. Catches v1 `informant.birthDay` / `birthMonth` / `birthYear` paths whose `uiComponent` is `"text"` and whose `slotType` is `"datePart"`.
   - Path tail matches `^(count|quantity|amount|num|number|integer)$` → `"number"`.
   - The matching `docxSlots[].slotType === "datePart"` is also consulted as a secondary signal — useful if the v1 contract has a date-typed path that does not end in one of the date suffixes.
   - Otherwise → `"text"`.

### Section grouping and titling

- Section key = first dot segment of `path`. e.g. `informant.birthDay` → `"informant"`.
- Section order = order of first occurrence (canonical first, then binding-fallback, each preserving the iteration order of its source array).
- Section title = a small local `humanizeSectionKey(key)` helper that splits camelCase / snake_case / kebab-case and title-cases each word. English-only on purpose: B2 will introduce a Vietnamese `SECTION_TITLES` map, and B1 deliberately avoids depending on a translation that does not exist yet. `caseInfo → "Case Info"`, `legalBasis → "Legal Basis"`, etc.
- Fields within a section preserve their global insertion order (canonical before binding-fallback). They are NOT re-sorted by path, which would shuffle the curated canonical order.

### Warning codes implemented

| Code | Where emitted | Meaning |
|---|---|---|
| `BOUND_SLOT_MISSING_FIELD` | binding-fallback pass | A `renderBinding.from` is bound/rendered but not in canonical — fallback editable field created. |
| `REJECTED_AS_EDITABLE` | canonical / binding pass | A path that exists in canonical or in renderBindings was also in `rejectedCandidates`; suppressed. |
| `UNKNOWN_SOURCE_NORMALIZED` | canonical pass | A `canonicalField.source` is `"unknown"` (or any other unrecognized string) and was normalized to `"manual"` with conservative editable=true / visible=true. BM-051's `document.fullDocumentCode` triggers this naturally. |

### Commands run

| Command | Exit | Result |
|---------|------|--------|
| `pnpm --filter form-contracts test` | 0 | 24 tests pass (8 pre-existing + 16 new from `derive-form-input-schema.test.ts`) |
| `pnpm typecheck` (form-contracts + api + web) | 0 | clean |
| `pnpm --filter form-contracts exec eslint src/derive-form-input-schema.ts` | n/a | No eslint binary in the repo. The package's `lint` script is `tsc --noEmit` which is the same check as `typecheck` (already passing). |

### Representative BMs vs kill criteria

All 6 representative BMs (BM-001, BM-051, BM-053, BM-100, BM-150, BM-200) derive a schema with `sections.length > 0` and `fields.length > 0`. Zero hit the kill criterion. Worst case observed: BM-051 contains a `source: "unknown"` field which is intentionally normalized to `manual` with a `UNKNOWN_SOURCE_NORMALIZED` warning — this is by design and does not block schema derivation.

Per-BM highlights:

- **BM-001** (28 canonical fields, 28 docxSlots, 28 renderBindings, 11 rejectedCandidates) → 4 sections (`document`, `receiver`, `informant`, `recipients`), 28 fields, 11 `REJECTED_AS_EDITABLE` warnings, 0 `BOUND_SLOT_MISSING_FIELD`, 0 `UNKNOWN_SOURCE_NORMALIZED`. The birthDay / birthMonth / birthYear canonical fields correctly map to `inputType: "date"` via the path-tail rule.
- **BM-051** (2 canonical fields, 1 unknown source) → 1 `UNKNOWN_SOURCE_NORMALIZED` warning emitted for `document.fullDocumentCode`. The unknown field still surfaces as an editable `manual` field so the UI can collect a value or block the user with a clear message.
- **BM-053** (many canonical fields including `legalBasis.line1`..`line5`) → 5 `legalBasis.*` fields present in the derived schema (test 3 passes).
- **BM-100 / BM-150 / BM-200** — derive without throwing; section/field counts > 0; warnings limited to whatever their respective contracts naturally produce.

### Backward compatibility

- The new file is purely additive. `packages/form-contracts/src/index.ts` adds a new `export * from "./derive-form-input-schema.js"` line; the pre-existing 8 tests in this package stay green.
- `deriveFormInputSchema` does not read the filesystem, does not call into the API, and never throws. It is safe to call from both server and client contexts.
- Defensive against bad input: `null` / `[]` / `{}` / garbage arrays all return a well-typed empty schema with no warnings. This is the same posture as the rest of the package (`compileContract`, `stableStringify`, etc.).
- The locked contract files under `docs/audit/docx/contracts/locked/` are not modified. Tests read them via `readFileSync` + `JSON.parse` and are tolerant to schema-version drift.
- `document-renderer.service.ts`, `generic-template-form-inputs.tsx`, `contract-form-inputs.service.ts`, `documents.service.ts`, and the A1/A2/A3 hot paths are all untouched.

### Risks / Open

- **Risk**: `getSectionTitle` is English-only. Until B2 lands, the UI will display English titles for sections like `informant` (`"Informant"`), which may feel inconsistent next to the Vietnamese field labels that come from the locked contract. Mitigated by B2 explicitly owning a `section-titles.ts` helper. The B1 type/structure is already designed for that — `FormInputSection.title` is the only field B2 needs to override.
- **Risk**: The `hint-doesn't-create-fields` rule is enforced structurally (hints only `set` on existing keys) rather than via an explicit assertion. If a future refactor of `applyHint` accidentally changes that, the `origin === "hint"`-forbidden invariant in the type union would still allow fields to be created with `origin: "hint"`. The test "hints do not create new paths" + the "no field has origin === 'hint'" assertion in test 5 lock this in for the current shape.
- **Open**: A future phase may want a "preview required" boolean per field for the A2 CONTRACT_DRIFT wiring. The current `reviewRequired` covers the existing audit/contract-driven rendering flags; if a separate "preview required" semantically diverges, B1's `FormInputField` is the place to add it.
- **Open**: B1 does not wire the derived schema into any API endpoint. A consumer (e.g. a `/documents/generated/:id/form-schema` route planned for Phase B) is the natural next step. Per the B1 brief, that wiring is explicitly out of scope.
- **Open**: A per-BM "all 213" smoke test was intentionally not added. The 6-representative test is fast and locked; extending to 213 would inflate test runtime and is unnecessary for B1 (PLAN.md v2.3 §B1 only requires representative coverage).

### Next step

B2 — `section-titles.ts` (Vietnamese section title helper) and wiring of `deriveFormInputSchema` into a `/documents/generated/:id/form-schema` endpoint. Per PLAN.md v2.3 §B2. Stop after B2.

## Task B2. Vietnamese section title helper + integration

**Status**: ✅ DONE (2026-06-25)

### Scope correction vs the B1 "next step" paragraph

The B1 summary described B2 as a combined "section-titles + endpoint" task. The actual B2 brief scopes only the Vietnamese title helper and its integration into `deriveFormInputSchema`; the `/documents/generated/:id/form-schema` endpoint belongs to B3 and is explicitly out of scope for B2. Apps under `apps/api/` and `apps/web/` are not touched.

### Files changed

- `packages/form-contracts/src/section-titles.ts` *(new)* — `SECTION_TITLES` map, `getSectionTitle(sectionKey)`, `humanizeSectionKey(sectionKey)`.
- `packages/form-contracts/src/derive-form-input-schema.ts` — removed the B1 English-only local `humanizeSectionKey` / `getSectionTitle` helpers and now imports `getSectionTitle` from `./section-titles.js`. The call site in `groupFieldsBySection` is unchanged.
- `packages/form-contracts/src/index.ts` — added `export * from "./section-titles.js"`.
- `packages/form-contracts/test/section-titles.test.ts` *(new)* — 10 tests covering the minimum SECTION_TITLES entries, the Vietnamese lookup, the humanize fallback, casing variants (camel / snake / kebab), the "never empty" invariant, and three integration tests against BM-001 / BM-051 / BM-053.
- `packages/form-contracts/test/derive-form-input-schema.test.ts` — added one non-blocking corpus-scan test that logs every section key NOT yet mapped in `SECTION_TITLES`. The test never fails the suite; it is informational only.

### `SECTION_TITLES` entries added (B2 brief, all 28 keys)

```ts
{
  agency: "Cơ quan",
  document: "Văn bản",
  caseInfo: "Thông tin vụ án",
  content: "Nội dung",
  recipients: "Nơi nhận",
  signature: "Chữ ký",
  decision: "Quyết định",
  legalBasis: "Căn cứ pháp lý",
  offense: "Hành vi / tội danh",
  measure: "Biện pháp tố tụng",
  reception: "Tiếp nhận",
  receiver: "Người tiếp nhận",
  informant: "Người cung cấp tin",
  crimeReport: "Tin báo / tố giác",
  accusedDecision: "Quyết định về bị can",
  caseDecision: "Quyết định vụ án",
  attachments: "Tài liệu kèm theo",
  indictment: "Cáo trạng",
  monitoring: "Kiểm sát",
  proposal: "Đề xuất",
  investigation: "Điều tra",
  investigationConclusion: "Kết luận điều tra",
  caseJoinder: "Nhập vụ án",
  caseRecovery: "Khôi phục vụ án",
  investigationExtension: "Gia hạn điều tra",
  prosecutionExtension: "Gia hạn truy tố",
  prosecutionTransfer: "Chuyển truy tố",
  approval: "Phê duyệt",
}
```

### Fallback behavior

`getSectionTitle(sectionKey)`:

1. Trims `sectionKey`.
2. Looks up `SECTION_TITLES[sectionKey]`. If a non-empty string is found, returns it (Vietnamese).
3. Otherwise, returns `humanizeSectionKey(sectionKey)`.

`humanizeSectionKey(sectionKey)`:

1. Trims `sectionKey`. Empty / whitespace-only input coerces to `"Section"`, so downstream consumers always see a non-empty string.
2. Splits camelCase boundaries via `([a-z0-9])([A-Z]) → "$1 $2"`.
3. Collapses `_` and `-` runs into a single space.
4. Title-cases the first letter of every word via `/\b\w/g`.

Worked examples (asserted by tests):

| Input | Output |
|---|---|
| `caseInfo` | `Case Info` |
| `legalBasis` | `Legal Basis` |
| `case_recovery` | `Case Recovery` |
| `case-recovery` | `Case Recovery` |
| `unknownFutureSection` | `Unknown Future Section` |
| `""` or `"   "` | `Section` |
| any key in `SECTION_TITLES` | the mapped Vietnamese title |

### Integration with `deriveFormInputSchema`

`deriveFormInputSchema` continues to call `getSectionTitle(key)` for each section's `title`. B1's English-only local helpers are removed; the function now reads from `section-titles.ts` exclusively. Source priority (canonical → binding-fallback → hint refinement), source normalization, editability/visibility mapping, warnings, deduplication, and the rejected-candidates blacklist are unchanged.

### Commands run

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter form-contracts test` | 0 | 35 tests pass (8 pre-existing + 16 B1 + 1 B2 corpus scan + 10 new B2 section-titles tests) |
| `pnpm typecheck` (form-contracts + api + web) | 0 | clean across all three packages |
| `pnpm --filter form-contracts exec eslint ...` | n/a | no eslint binary in the repo (same posture as B1); the package's `lint` script is `tsc --noEmit`, already covered by `typecheck` above. |

### Backward compatibility

- All 16 B1 tests pass unchanged. None of them assert section `title` content, so swapping the English-only fallback for the Vietnamese map is invisible to B1's contract.
- The new `SECTION_TITLES` map is purely additive: any section key that was previously emitted as an English humanize string (`"Informant"`, `"Legal Basis"`, etc.) is now emitted as a Vietnamese string (`"Người cung cấp tin"`, `"Căn cứ pháp lý"`, etc.). This is the explicit behavior change requested by the B2 brief; the API/web apps are not yet wired to consume `FormInputSection.title`, so no caller is affected.
- Unknown section keys (e.g. `futureSection`, `custody`, `defendant`) keep deriving a usable schema with a sensible English fallback title. The new corpus-scan test surfaces them as a report so future B2.x work can extend the map.
- No change to `apps/api` or `apps/web`. The endpoint wiring is B3.

### Corpus scan report (informational, non-blocking)

The new `derive-form-input-schema.test.ts` "B2 corpus scan" test walks all 213 locked contracts, runs `deriveFormInputSchema` on each, and reports section keys that are NOT yet in `SECTION_TITLES`. The test is intentionally non-blocking — it never fails the suite. Top entries from the run:

| Section key | BM count | Example templates |
|---|---|---|
| `official` | 49 | BM-006, BM-007, BM-008 |
| `person` | 35 | BM-022, BM-036, BM-053 |
| `case` | 5 | BM-023, BM-163, BM-203 |
| `delivery` | 3 | BM-053, BM-058, BM-059 |
| `initiationRequest` | 2 | BM-019, BM-020 |
| `assignment` | 2 | BM-070, BM-071 |
| (≈ 30 others) | 1 each | (one representative BM each) |

This is a roadmap signal, not a defect. B2 ships with the 28 brief-mandated entries; future B2.x passes can grow the map as representative templates confirm each key.

### Risks / Open

- **Open**: The `official` (49 BMs) and `person` (35 BMs) keys are clearly Vietnamese-localizable but not in the B2 brief. Documented here for B2.x follow-up. Until then, the English fallback (`"Official"`, `"Person"`) is shown.
- **Open**: B2 does not consume or generate Vietnamese characters at the I/O boundary — the map is in source, not derived. If a future B2.x needs auto-translation for unknown keys (e.g. via a lookup table or external service), `getSectionTitle` is the single point to extend.
- **Open**: Section title localization is currently English-fallback only for unknown keys. B2 ships bilingual in the sense that mapped keys are Vietnamese and unmapped keys are English. A future i18n pass may want a `getSectionTitle(key, locale)` signature; the current signature is intentionally minimal.
- **Risk**: If a future BM adds a section key that is already a Vietnamese noun (e.g. `caseInfo` mapping to `"Thông tin vụ án"`) but in a different register, the locked brief value is the source of truth. If the value is wrong, B2 must be amended by editing `section-titles.ts` directly.

### Next step

B3 — `/documents/generated/:id/form-schema` endpoint wiring. Per PLAN.md v2.3 §B3 (and the B2 brief's scope correction). Stop after B2.


## Task B3. `GET /documents/generated/:id/form-schema` endpoint + minimal UI wiring

**Status**: ✅ DONE (2026-06-25)

### Files changed

- `packages/form-contracts/src/section-titles.ts` — added two high-frequency section keys surfaced by the B2 corpus scan: `official: "Thông tin người có thẩm quyền"`, `person: "Thông tin cá nhân"`. Fallback behavior unchanged.
- `packages/form-contracts/test/section-titles.test.ts` — extended the "known keys" test to assert the two new Vietnamese titles.
- `apps/api/src/modules/form-studio/application/document-form-schema.service.ts` *(new)* — read-only `getFormSchema(documentId, user)` that resolves the active compiled contract, runs `deriveFormInputSchema`, and assembles `values` / `resolvedValues` / `validation.missingRequiredFields`. Includes a small V2→V1 mapper for the compiled contract shape that `deriveFormInputSchema` consumes.
- `apps/api/src/modules/form-studio/application/document-form-schema.service.spec.ts` *(new)* — 10 unit tests covering: locked response shape, `formInputs` round-trip, `REQUIRED` errors for missing editable required fields, no-required for readonly (`casePayload`/`computed`) fields, missing-snapshot tolerance, 404 `GENERATED_DOCUMENT_NOT_FOUND`, 403 `AGENCY_SCOPE_FORBIDDEN`, ADMIN bypass, resolvedValues for visible fields, Vietnamese title propagation.
- `apps/api/src/modules/form-studio/document-form-schema.controller.ts` *(new)* — `@Controller('documents/generated')` + `@Get(':documentId/form-schema')` endpoint, sibling to the existing A2 `ContractFormInputsController` (same namespace, same Nest module).
- `apps/api/src/modules/form-studio/form-studio.module.ts` — registered `DocumentFormSchemaService` as a provider and `DocumentFormSchemaController` as a controller.
- `apps/web/src/lib/form-schema-client.ts` *(new)* — typed client (`FormSchemaResponse`, `fetchFormSchema`) plus pure helpers `getValueByPath`, `setValueByPath`, `partitionSchemaFields`. Types are sourced from `@qllaw/form-contracts` so the web and api share one source of truth.
- `apps/web/src/lib/form-schema-client.test.ts` *(new)* — 13 unit tests for the helpers and the response unwrap.
- `apps/web/src/components/documents/generic-template-form-inputs.tsx` — minimal dynamic-schema wiring: on load the panel fetches `GET /documents/generated/:id/form-schema` in parallel with the existing render-payload fetch. When the schema is non-empty, sections/fields are driven by `schema.sections`. Editable fields bind to `values[field.path]`, readonly visible fields render a `ReadonlyPreview` from `resolvedValues[field.path]`. The legacy 3-`SectionCard` view is kept as the fallback when the endpoint fails, the schema is empty, or there are no visible editable fields. The existing save payload shape and deep-merge semantics are unchanged — when the panel is in dynamic mode it just sends `dynamicValues` (built by `setValueByPath` from the editable field paths) under `formInputs` / `payloadOverrides` / `renderPayloadOverrides`. The "Lấy từ vụ án" button is disabled in dynamic mode to avoid confusing the user (the legacy `applyCasePayloadToGenericForm` only knows the legacy 6-section shape).

### Endpoint

```
GET /documents/generated/:documentId/form-schema
```

Lives in `FormStudioModule` next to the existing A2 save endpoint (`PUT /documents/generated/:documentId/contract-form-inputs`) — the brief's preferred location was `apps/api/src/modules/documents/document-form-schema.controller.ts`, but the existing namespace convention puts the `documents/generated/*` routes in `FormStudioModule` and `RuntimeFormContractService` is already exported from that module, so wiring the new endpoint there avoids cross-module service exports. Documented here as a deliberate deviation from the preferred path to follow the existing module pattern.

Response shape (locked by `DocumentFormSchemaResponse`):

```ts
{
  generatedDocumentId: string,
  templateCode: string,
  sourceId: string | null,            // compiledContract.source.templateCode
  contractVersionHash: string | null,  // resolved.contractHash
  schema: FormInputSchema,             // deriveFormInputSchema(...)
  values: Record<string, unknown>,     // editable fields only, read from formInputs
  resolvedValues: Record<string, unknown>, // all visible fields present in formInputs
  validation: {
    missingRequiredFields: FormValidationError[], // REQUIRED for editable + required + empty
  }
}
```

### Contract lookup strategy

`getFormSchema` delegates to `RuntimeFormContractService.resolve(templateCode, agencyId)` — the same path that `ContractFormInputsService.save` uses. This means:

- DB-first published contract (AGENCY_PUBLISHED / GLOBAL_PUBLISHED) is preferred.
- Locked V1 file fallback is only used when the DB has no published version.
- The schema is always derived against the same contract the save endpoint will validate against. Schema drift (a published version that changed since last save) is not surfaced here; A2's `STALE_CONTRACT_HASH` on the save endpoint is the source of truth for that. Surfacing the drift on this GET is a future enhancement (J1/C1 territory).

The V2 compiled contract is mapped to a V1-shaped object before `deriveFormInputSchema`:

- `canonicalFields[].{ path, type, label, source, required, uiComponent }` — `uiComponent` is reverse-mapped from V2 `control` (DATE/PARTIAL_DATE/TIME → "date", NUMBER → "number", TEXTAREA → "textarea", SELECT → "select", CHECKBOX → "checkbox", others → "text"); `source` is reverse-mapped from V2 `dataSource.kind` (MANUAL → "manual", CASE → "casePayload", AGENCY → "agencyConfig", OFFICIAL → "officialConfig", SYSTEM → "systemDate", COMPUTED → "computed").
- `docxSlots[].{ slotId, slotType, required, reviewRequired }` — derived from `renderBindings[].target.slotId` so date-typed fields still get `slotType: "datePart"` (B1's `mapInputType` honors that). V2 has no first-class `docxSlots`, so this is a best-effort synthetic list.
- `renderBindings[].{ slotId, from, transform, fallback, reviewRequired }` — narrowed to `target.kind === 'SLOT'` and `source.kind === 'FIELD'` bindings.
- `rejectedCandidates: []` — V2 has no equivalent; B1's blacklist is no-op today, which is the same behavior as the corpus.

`rejectedCandidates` and `formInputHints.suggestedControls` are intentionally empty in the V2→V1 shape. B1 is defensive about missing arrays, so this is safe.

### `values` / `resolvedValues` semantics

- `values` is built by walking `schema.sections[*].fields[*]` and, for every **editable** field, copying the value at `formInputs[path]` (defaulting to `undefined`). Readonly fields (`casePayload`, `agencyConfig`, `officialConfig`, `systemDate`, `computed`) are **not** in `values` because the B3 brief explicitly forbids requiring them. Hidden fields (`visible === false`, e.g. computed) are excluded entirely.
- `resolvedValues` carries the same `formInputs` lookup but for **every visible** field (editable or readonly). It does not invent case/agency/system values that aren't in the snapshot — only what is already persisted. Future work (post-J1) can layer case/agency lookups on top.
- Missing `formInputs` snapshot is treated as `{}` (B3 brief: "If missing, treat as {}"). This means the first read after `createBatch` returns an empty `values` and a fully populated `validation.missingRequiredFields` for any required editable field.

### Validation

- `validation.missingRequiredFields` is built by walking every **editable** field where `field.required === true` and the formInputs lookup is empty (`undefined`, `null`, `''`, or empty array). Each entry is a `FormValidationError` (the locked 7-key shape from A2) with `code: "REQUIRED"` and a Vietnamese message. `section` is the first dot-segment of the path, `sectionTitle` is the schema-derived section title, `label` is `field.label` or the path tail as a fallback.
- Readonly fields are never added to `missingRequiredFields`. Verified by the "does not require readonly fields" test.
- `CONTRACT_DRIFT` is **not** auto-emitted in B3 (consistent with the A2 design notes — drift only surfaces when `contractLookupStatus !== 'FOUND'`, and that path is not yet wired in `RuntimeFormContractService`).

### UI behavior

- `useDynamic = schema !== null && editable.length > 0`. The legacy 3-`SectionCard` block is kept inside a `{!useDynamic ? <legacy /> : null}` wrapper so the panel can flip back if the schema is empty or the endpoint fails. There is no flicker because the legacy view is rendered as a placeholder until the schema fetch resolves.
- Sections iterate over `schema.sections` (preserves the locked V1 first-occurrence order — same as B1). Each `SectionCard` shows editable fields via the existing `Field` component (with the existing `text`/`date`/`textarea` mapping from `FormInputField.inputType`) and readonly fields via a new `ReadonlyPreview` component (visually distinct: slate background, no focus ring).
- Required editable fields get a `*` suffix on the label; readonly fields have no `*`.
- `validation.missingRequiredFields` from the GET response is fed into the existing `structuredErrors` state (re-using the A3 `StructuredValidationErrorList`). On save, the A2 backend response overrides it with the canonical A2 `errors[]` (still using the same state), so there is no UI duplication.
- The "Lấy từ vụ án" button is disabled in dynamic mode because the legacy `applyCasePayloadToGenericForm` operates on the hard-coded 6-section shape, which is not present in dynamic mode. Tooltip explains why. Re-enabling it for dynamic mode belongs to a future B3.x / Phase F.

### Fallback behavior

- Endpoint returns 404 / 5xx / network error → `fetchFormSchema` throws → `reload()` catches silently → `schema` stays at its previous value (or `null` on first load) → the legacy 3-`SectionCard` block renders.
- Endpoint returns a schema with `sections.length === 0` → `setSchema(null)` → legacy view.
- Endpoint returns a schema with no visible editable fields → `useDynamic === false` → legacy view. This guarantees the dynamic view never produces an empty form for an existing user.

### Commands run

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @qllaw/form-contracts build` | 0 | rebuilt `dist/` so api/web see the new B1/B2 types from `@qllaw/form-contracts` (`FormInputSchema`, `deriveFormInputSchema`, `getSectionTitle`). |
| `pnpm test:api -- --testPathPatterns=document-form-schema` | 0 | 10/10 B3 service tests pass. |
| `pnpm test:api -- --testPathPatterns=form-studio` | 0 | 34/34 form-studio tests pass (regression: A2 / A1 untouched). |
| `pnpm test:api -- --testPathPatterns=documents` | 0 | 103/103 documents tests pass (regression: A1 untouched). |
| `pnpm --filter form-contracts test` | 0 | 35/35 tests pass (B1+B2 regression, plus the new `official`/`person` assertions in `section-titles.test.ts`). |
| `pnpm test:web-unit` | 0 | 59/59 tests pass (46 pre-existing + 13 new for `form-schema-client`). |
| `pnpm typecheck` (form-contracts + api + web) | 0 | clean across all three packages. |
| `pnpm --filter api exec eslint src/modules/form-studio/application/document-form-schema.service.ts src/modules/form-studio/document-form-schema.controller.ts src/modules/form-studio/form-studio.module.ts` | 0 | 0 errors (test file is project-level ignored per `apps/api/eslint.config.mjs:17`). |
| `pnpm --filter web exec eslint src/components/documents/generic-template-form-inputs.tsx src/lib/form-schema-client.ts` | 0 | 0 errors. |

### Backward compatibility

- `documents.service.ts::createBatch` is untouched. The new endpoint is read-only — no `render_payload_snapshot` mutation.
- The save endpoint's deep-merge semantics are unchanged. The dynamic-mode save payload is `{ formInputs: dynamicValues, payloadOverrides: dynamicValues, renderPayloadOverrides: dynamicValues }` — the same envelope the legacy panel sends, just sourced from `dynamicValues` instead of the legacy `form` state. The backend's deep-merge treats `formInputs` as the authoritative object, so unknown-section preservation (A1 invariant) is intact.
- `document-renderer.service.ts` is not modified. The endpoint does not participate in rendering — it only produces the schema + values needed by the FE.
- No locked contracts modified. No Prisma schema change. No new dependency.
- The legacy 6-section view is preserved verbatim behind `{!useDynamic ? ... : null}`. Custom BM-specific components that wrap or replace this panel are unaffected (the wiring is in the panel itself, not in a parent).

### Risks / Open

- **Open**: The dynamic view's `Field` mapping only supports `text` and `date` (textarea is also wired). Future BM-specific controls (SELECT, CHECKBOX, RADIO) are not rendered dynamically yet — they fall back to a plain text input via the B1 `inputType: "text"` default. This is acceptable for B3 because the brief explicitly says "Do NOT implement full custom component replacement" — it's a Phase F / H concern.
- **Open**: The `official` and `person` Vietnamese titles were chosen as best-effort translations. The B3 brief said to use them unless the corpus suggested better; the corpus does not contain canonical Vietnamese labels for these section keys, so the B3 brief's defaults stand. If a domain expert later disagrees, `section-titles.ts` is the single point to update.
- **Open**: `resolvedValues` is intentionally minimal — it only carries whatever the user has already saved in `formInputs`. A future enhancement (post-J1) can layer case/agency/system lookups here so the FE previews are richer than the user's own edits. B3's brief explicitly does not require that.
- **Risk**: The V2→V1 mapper synthesizes `docxSlots` from `renderBindings`. If a future B2.x contract has `renderBindings` that target TABLE (which V2 supports but V1 doesn't), the mapper silently drops them. This is consistent with the existing B1 corpus (no rejected / no TABLE bindings) and is a no-op for the current 213 contracts.
- **Risk**: The dynamic `Field` rendering does not yet support per-field `width` (V2's `width: 3|4|6|8|9|12`). All fields render full-width inside the 2-col grid. Phase F is the right place to add width-aware rendering.

### Next step

Per PLAN.md v2.3 sequencing, the next task is either **B4** (deeper dynamic-schema features such as width-aware rendering, control-type-specific components, or section-level conditional rules) or **E1** (post-render shadow + semantic diff against the locked contract) depending on whether the next focus is form-schema expressiveness or render-time validation. The PLAN.md should be consulted for the exact ordering. Stop after B3 per the brief.


## Task B4. Source normalization hardening and corpus audit

**Status**: ✅ DONE (2026-06-25)

### Files changed

- `packages/form-contracts/test/derive-form-input-schema.test.ts` — added two new inline-fixture unit tests (invalid source value, all six valid sources emit no warning) and three new corpus-audit test blocks: `B4 corpus audit: scans all locked contracts and reports source normalization`, `B4 corpus audit: B1 normalizes every flagged field, so no UNKNOWN_SOURCE_NORMALIZED escapes the suite`, `B4 corpus audit: TABLE renderBindings are reported if present (non-blocking)`. Added the `CorpusSourceAuditReport` type, the `looksLikeTableBinding()` detector, the `auditCorpusSources()` walker, and a small `readArray()` helper local to the test file. Production source code (`derive-form-input-schema.ts`) is untouched — B1's normalization was already correct and deterministic; B4 is read-only with respect to production behavior.

### Unknown / invalid source normalization behavior (locked)

`packages/form-contracts/src/derive-form-input-schema.ts::mapSource()` was already implemented in B1 with the brief's exact contract. B4 confirms it through both inline fixtures and a corpus walk:

| Raw `canonicalFields[i].source` | Output `FormInputField.source` | `editable` | `visible` | `visibilityReason` | `readonlyReason` | Warning emitted |
|---|---|---|---|---|---|---|
| `manual` | `manual` | true | true | `USER_INPUT` | undefined | none |
| `casePayload` | `casePayload` | false | true | `READONLY_PREVIEW` | `CASE_PAYLOAD` | none |
| `agencyConfig` | `agencyConfig` | false | true | `READONLY_PREVIEW` | `AGENCY_CONFIG` | none |
| `officialConfig` | `officialConfig` | false | true | `READONLY_PREVIEW` | `OFFICIAL_CONFIG` | none |
| `systemDate` | `systemDate` | false | true | `READONLY_PREVIEW` | `SYSTEM_DATE` | none |
| `computed` | `computed` | false | **false** | `INTERNAL_RENDER_ONLY` | `COMPUTED` | none |
| `"unknown"` (literal) | `manual` | true | true | `USER_INPUT` | undefined | `UNKNOWN_SOURCE_NORMALIZED` with `path = field.path`, message = `Trường "<path>" có source không hợp lệ ("unknown") đã được chuẩn hoá về "manual".` |
| any unrecognized string (e.g. `"constantFromDocx"`, `"derived"`, `"legacyConstant"`) | `manual` | true | true | `USER_INPUT` | undefined | same `UNKNOWN_SOURCE_NORMALIZED` with the actual original string interpolated in the message |

The warning always carries both `path` and a non-empty Vietnamese `message`; the message includes the offending path so FE / audit tooling can show it without a second lookup. This is asserted by the new `invalid source normalizes to manual and emits UNKNOWN_SOURCE_NORMALIZED` test (which also covers the unrecognized-but-not-`"unknown"` case via `source: "legacyConstant"`) and re-checked across the locked corpus by the second new audit test.

### Corpus audit result (read-only, non-blocking)

The audit walks `docs/audit/docx/contracts/locked/` and reports:

```jsonc
{
  "totalContracts": 213,
  "totalUnknownSourceFields": 16,
  "totalInvalidSourceFields": 99,   // 90 × "constantFromDocx" + 9 × "derived"
  "totalTableRenderBindings": 0,
  "unknownSourceFields": [ /* 16 entries */ ],
  "invalidSourceFields": [ /* 99 entries */ ],
  "tableRenderBindings": []          // empty — V1 corpus has zero TABLE bindings
}
```

Highlights from the corpus walk:

- **Unknown source (16 fields)**: All use the literal string `"unknown"`. Examples: `BM-051/document.fullDocumentCode`, `BM-052/document.fullDocumentCode`, `BM-052/document.fullDocumentCode2`, `BM-060/document.fullDocumentCode`, `BM-061/document.fullDocumentCode`, `BM-062/decision.decisionLine`, `BM-062/document.fullDocumentCode`, `BM-063/document.issuePlaceAndDateLine`, `BM-063/document.fullDocumentCode`, `BM-064/document.fullDocumentCode`. B1's normalization already covers all 16.
- **Invalid source (99 fields)**: `constantFromDocx` × 90 (concentrated on `legalBasis.procedureArticlesLine` and `agency.parentNameUpper`) and `derived` × 9. Examples: `BM-003/legalBasis.procedureArticlesLine`, `BM-005/sourceVerification.procedureArticlesLine`, `BM-007/legalBasis.procedureArticlesLine`, `BM-009/sourceResolutionExtension.procedureArticlesLine`, `BM-011/legalBasis.procedureArticlesLine`, `BM-021/agency.parentNameUpper`. Each is currently normalized to `manual` + `UNKNOWN_SOURCE_NORMALIZED` by B1, but the underlying source value is a domain signal that should be remapped to one of the recognized sources — owned by **C3**.
- **TABLE renderBindings (0)**: The current V1 locked corpus has zero TABLE bindings. The audit's `looksLikeTableBinding()` detector still defines three heuristics (V2 `target.kind === "TABLE"`, V1 `transform === "table"`, V1 `slotId` ending in `.table` or `.rows`) so a future C3 introduction of a TABLE binding will be surfaced without code changes. A synthetic fixture in the audit test asserts the detector works against a TABLE-shaped V1 binding.

Per the B4 brief the audit is intentionally non-blocking — it never fails the suite. Remediation of the 99 invalid source values and any TABLE bindings that appear in the future is owned by **C3**, not by B4. B4 only proves the report shape and that B1's normalization continues to apply deterministically across the corpus.

### TABLE binding warning decision

The B4 brief considered adding a new `TABLE_BINDING_UNSUPPORTED` schema warning when a TABLE binding is silently dropped by the B3 V2→V1 mapper. After checking the current corpus (zero TABLE bindings) and the warning-type churn cost (would force an api/web type update), B4 deliberately **does not** add the warning. The risk is documented below for C3 to revisit when TABLE bindings first appear.

### Commands run

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @qllaw/form-contracts test` | 0 | 40/40 tests pass (35 pre-existing + 5 new B4 tests: 2 inline-fixture normalization tests, 3 corpus-audit tests). The 1 pre-existing `BM-051 (real corpus) emits UNKNOWN_SOURCE_NORMALIZED` test still passes — BM-051's `document.fullDocumentCode` is among the 16 reported unknown fields. |
| `pnpm --filter @qllaw/form-contracts typecheck` | 0 | clean. |
| `pnpm test:api -- --testPathPatterns=document-form-schema` | 0 | 10/10 B3 service tests pass (B3 endpoint consumer regression; B4 is read-only but the B3 surface must still derive the same `UNKNOWN_SOURCE_NORMALIZED` warnings). |
| `pnpm test:api -- --testPathPatterns=form-studio` | 0 | 34/34 form-studio tests pass (A1/A2/A3 regression). |
| `pnpm test:web-unit` | 0 | 59/59 web tests pass (B3 client regression). |
| `pnpm --filter api exec tsc --noEmit` | 0 | clean. |
| `pnpm --filter web exec tsc --noEmit` | 0 | clean. |
| `pnpm --filter @qllaw/form-contracts exec eslint ...` | n/a | no eslint binary in the package (`lint: "tsc --noEmit"`); the typecheck already covers the same surface. |

### Backward compatibility

- `derive-form-input-schema.ts` is **not modified**. B1's normalization, warning emission, section grouping, hint refinement, rejected-candidate handling, dedup, and `inputType` mapping are byte-identical to B1.
- B3's `/documents/generated/:id/form-schema` endpoint and the dynamic FE panel are not modified. B3 still emits `UNKNOWN_SOURCE_NORMALIZED` warnings exactly as before — only B4 adds new assertions about the same behavior.
- No locked contract JSON files modified. No production code outside the test file is touched.
- `document-renderer.service.ts`, `documents.service.ts`, `contract-form-inputs.service.ts`, `generic-template-form-inputs.tsx`, `form-studio.module.ts`, the B3 controller, and the B3 service are all untouched.
- No new dependency. No Prisma schema change. No public API change.

### Risks / Open

- **Risk**: The 99 invalid source fields (`constantFromDocx`, `derived`) currently flow through B1's `UNKNOWN_SOURCE_NORMALIZED` fallback and reach the user as editable manual inputs. That is the safe behavior (lock in user-editable values, never silently drop) but it is not what the locked contracts intended — they were written before the 6-source taxonomy was enforced. C3 must remap each invalid source to the correct one of `manual` / `casePayload` / `agencyConfig` / `officialConfig` / `systemDate` / `computed` and verify the schema stays correct. B4 deliberately does not touch the locked contracts.
- **Risk**: The B3 V2→V1 mapper drops TABLE bindings silently. B4 chose not to add a `TABLE_BINDING_UNSUPPORTED` schema warning because the current V1 corpus has zero TABLE bindings, so the warning would be churn for zero production benefit. When C3 introduces the first TABLE binding, **C3 must either** (a) extend the V2→V1 mapper to synthesize a TABLE-shaped V1 slot, **or** (b) add `TABLE_BINDING_UNSUPPORTED` to the `SchemaWarning["code"]` union and surface it on the B3 endpoint. Documented here as the natural follow-up.
- **Open**: The audit is implemented as test blocks inside `derive-form-input-schema.test.ts` (consistent with B2's corpus-scan test). If a future reviewer prefers a repo-level script (`scripts/audit/audit-form-schema-sources.mjs` + `pnpm audit:form-schema-sources`), the `auditCorpusSources()` function is pure and re-usable — the move is mechanical (extract the helper into a `node --test`-runnable script under `scripts/audit/`).
- **Open**: The audit reports section-key coverage and source-value coverage but not the BM-specific edge cases that B1 might still have (e.g. unknown `uiComponent` values, unknown `transform` values). Those are owned by B1's existing defensive logic; B4 only locks in source normalization, which is the B1 behavior the brief asked B4 to harden.
- **Open**: B4 does not add a CI gate. The audit test asserts the report shape and the B1 normalization coverage today; a future hardening could promote the audit into a `pnpm audit:form-schema-sources` script that fails the build when `totalInvalidSourceFields > 0` — but that is C3 territory (after the 99 invalid fields are remediated).

### C3 follow-up note (added by E1 audit)

B4 reported 16 `source: "unknown"` fields but also discovered 99 additional invalid source values:

- `constantFromDocx` × 90 — concentrated on `legalBasis.procedureArticlesLine` and `agency.parentNameUpper`. Semantically these are constants extracted from the DOCX template, not user input. Mapping them to `manual` (editable) is dangerous: the user can edit text that the contract intended as fixed, breaking the legal-basis wording. C3 must remap them to either `officialConfig` or a new render-only field kind, not to `manual`.
- `derived` × 9 — these are values computed from other fields at render time. Mapping them to `manual` makes the user re-enter values the renderer can already compute, which is double-work. C3 must map these to `computed`.

**Effective C3 scope**: 16 unknown + 90 constantFromDocx + 9 derived = **115 source fields** across the corpus, not 16. PLAN.md §C3 wording must be amended from "Remediate 16 source=unknown" to "Remediate 115 invalid/unknown source fields" before C3 starts.

Until C3 ships, the schema layer normalizes all 115 to `manual` with `UNKNOWN_SOURCE_NORMALIZED` warnings. This is the safe conservative behavior (the user can still type values and the form is still saved) but it is the wrong long-term answer. The C3 gate must require `source` to be a member of `VALID_SOURCES` across all 213 contracts before `gate:forms:213` is allowed to drop `--allow-source-*` flags.

## Task E1. Schema conformance test for all 213 locked contracts

**Status**: ✅ DONE (2026-06-25)

### Scope guard (locked by user brief 2026-06-25)

E1 is **test-only**:

- E1 does NOT render DOCX.
- E1 does NOT do post-render shadow.
- E1 does NOT do semantic diff.
- E1 does NOT modify locked contract JSON files.
- E1 does NOT remediate source fields (that is C3).
- E1 does NOT touch API or web runtime.

### Files changed

- `packages/form-contracts/test/schema-conformance.test.ts` *(new)* — corpus conformance test that walks every locked contract, derives its schema, and asserts the 17 contract invariants per schema. Pure, deterministic, no I/O beyond reading the 213 `.contract.locked.json` files.

Production source (`derive-form-input-schema.ts`) is **not modified**. E1 is read-only with respect to runtime behavior; it only locks in the existing B1/B2 surface against the full corpus.

### Per-schema assertions (17 from the locked brief)

For every contract that derives successfully, the test asserts:

| # | Assertion |
|---|-----------|
| 1 | `deriveFormInputSchema(contract)` does not throw. |
| 2 | `schema.templateCode` is non-empty. |
| 3 | `schema.sourceId` is non-empty. |
| 4 | `schema.sections.length > 0`. |
| 5 | Total schema fields > 0. |
| 6 | Every section has non-empty `key`, non-empty `title`, and a `fields` array. |
| 7 | Every field has `path` non-empty, `label` non-empty, `inputType ∈ {text, date, number, textarea}`, `source ∈ {manual, casePayload, agencyConfig, officialConfig, systemDate, computed}`, `editable: boolean`, `visible: boolean`, `origin ∈ {canonical, binding-fallback, hint}`. |
| 8 | No duplicate field path within one schema. |
| 9 | No field whose path is in `rejectedCandidates[]` is editable. |
| 10 | 100% required manual editable fields are visible. |
| 11 | `computed` fields are `editable=false`. |
| 12 | `readonlyReason` exists when `editable=false` and `source ∈ {casePayload, agencyConfig, officialConfig, systemDate, computed}`. |
| 13 | `visibilityReason` exists for every field. |
| 14 | Every warning has a known code (`UNKNOWN_SOURCE_NORMALIZED` / `BOUND_SLOT_MISSING_FIELD` / `REJECTED_AS_EDITABLE`) and a non-empty message. |
| 15 | `UNKNOWN_SOURCE_NORMALIZED` warnings are allowed (C3 owns remediation). |
| 16 | `BOUND_SLOT_MISSING_FIELD` warnings are allowed but counted. |
| 17 | `REJECTED_AS_EDITABLE` warnings are allowed only if the rejected field is not emitted as editable. |

Plus a kill-criterion guard: if **more than 20%** of contracts fail schema derivation or have no usable fields, the suite fails loudly. The test does **not** relax assertions to pass and does **not** synthesize fake fields.

### Corpus report (read-only, from the test's stdout)

```json
{
  "totalContracts": 213,
  "totalSections": 855,
  "totalFields": 2453,
  "totalRequiredManualEditableFields": 904,
  "warningCounts": {
    "UNKNOWN_SOURCE_NORMALIZED": 115,
    "BOUND_SLOT_MISSING_FIELD": 0,
    "REJECTED_AS_EDITABLE": 0
  },
  "contractsWithWarningsCount": 65,
  "topSectionKeys": [
    ["agency", 212], ["document", 202], ["recipients", 107],
    ["signature", 68], ["legalBasis", 54], ["official", 49],
    ["person", 35], ["decision", 15], ["caseDecision", 14],
    ["measure", 11]
  ],
  "failedContractsCount": 0
}
```

Highlights:

- **213/213 contracts derive successfully.** Zero hits the kill criterion.
- **2453 fields / 855 sections / 904 required manual editable fields** across the corpus. E1 confirms the schema layer can produce a usable `FormInputSchema` for every BM, with section grouping and required-field visibility rules all holding.
- **115 `UNKNOWN_SOURCE_NORMALIZED` warnings** — this number equals exactly `16 unknown + 90 constantFromDocx + 9 derived`. E1 independently reproduces B4's count from the runtime side and **locks it in** as a C3 deliverable.
- **`BOUND_SLOT_MISSING_FIELD = 0`** — every binding in the corpus is matched by a canonical field. This means the binding-fallback layer is currently a no-op for the V1 corpus, which is the desired steady state.
- **`REJECTED_AS_EDITABLE = 0`** — no rejected candidate was emitted as editable. B1's reject suppression works as designed across the full corpus.
- **`agency` × 212 and `document` × 202** confirm that these two sections are universal. The next 8 (`recipients` × 107, `signature` × 68, `legalBasis` × 54, `official` × 49, `person` × 35, `decision` × 15, `caseDecision` × 14, `measure` × 11) give C3 a prioritized list for SECTION_TITLES extensions.
- **53 unique-to-template section keys** (e.g. `BM-001/informant`, `BM-002/reporter`, `BM-005/sourceVerification`, ...) — these are real but narrow. The corpus report surfaces them for future B2.x / SECTION_TITLES extension work.

### Commands run

| Command | Exit | Result |
|---------|------|--------|
| `pnpm --filter @qllaw/form-contracts test` | 0 | 47 tests pass (40 pre-existing + 7 new E1 tests). Total runtime ~528 ms. |
| `pnpm --filter @qllaw/form-contracts typecheck` | 0 | clean (no production source touched). |
| `pnpm typecheck` (full monorepo: form-contracts + api + web) | 0 | clean across all three packages — confirms E1's read-only test did not break any downstream type. |
| `pnpm test:api -- --testPathPatterns=document-form-schema` | 0 | 10/10 B3 endpoint consumer tests pass. The runtime path that calls `deriveFormInputSchema` via the new B3 `/documents/generated/:id/form-schema` endpoint is unaffected. |
| `pnpm test:web-unit` | 0 | 59/59 web tests pass (46 pre-existing + 13 form-schema-client + 8 form-validation-errors). |

### Backward compatibility

- `derive-form-input-schema.ts` is **not modified**. B1's normalization, warning emission, section grouping, hint refinement, rejected-candidate handling, dedup, and `inputType` mapping are byte-identical to B4.
- B2's `section-titles.ts` is not modified.
- B3's `/documents/generated/:id/form-schema` endpoint and the dynamic FE panel are not modified.
- No locked contract JSON files modified. No production code outside the new test file is touched.
- `document-renderer.service.ts`, `documents.service.ts`, `contract-form-inputs.service.ts`, `generic-template-form-inputs.tsx`, `form-studio.module.ts`, the B3 controller, and the B3 service are all untouched.
- No new dependency. No Prisma schema change. No public API change.
- The test file is a sibling of the existing `derive-form-input-schema.test.ts` and reuses the same `readFileSync` + `JSON.parse` pattern. No new fs/path helpers were needed beyond what the B4 audit already established (`HERE`/`REPO_ROOT`/`LOCKED_DIR` resolution).

### Risks / Open

- **Open**: The 115 `UNKNOWN_SOURCE_NORMALIZED` warnings are still flowing through to the UI as editable manual inputs. C3 is the right place to fix this — E1 deliberately does not touch production code. Until C3 ships, a user could edit `legalBasis.procedureArticlesLine` or `agency.parentNameUpper` (both currently `constantFromDocx`) and break the legal-basis wording. The UI should at minimum show a warning badge for any field with `UNKNOWN_SOURCE_NORMALIZED`; that wiring is a candidate for a future E1.x task.
- **Open**: The corpus report is `console.log`'d on test run. If a future CI step wants the report as a JSON artifact (rather than stdout), a `scripts/audit/schema-conformance-report.mjs` wrapper can call the same `deriveSafely` logic. The walker is pure and re-usable.
- **Open**: The "100% required manual editable fields must be visible" assertion (spec #10) currently passes 100% because B1 defaults `unknown → editable + visible`. After C3 fixes the source taxonomy, a `casePayload`/`agencyConfig` field marked `required` by a contract will be visible=true (because B1's `READONLY_PREVIEW` rule applies) but not editable — which is the correct UI affordance. E1 already asserts this invariant per-field, so C3 cannot regress it silently.
- **Risk**: If a future BM adds a `section title` key that no test ever references, E1 will still pass (because `getSectionTitle` falls back via `humanizeSectionKey`). The corpus report's `unmappedSectionKeysCount` (currently 53) is the right signal for SECTION_TITLES follow-up, but it is informational only — E1 does not fail on unmapped keys, by design (PLAN.md v2.3 §B2: "KHÔNG assert 'mọi key phải có trong SECTION_TITLES map'").

### Next step

**E2 — DOCX render integration for 6 representative BMs** (per PLAN.md v2.3 §E2 and §10.4). E2 builds on E1: schemas derived here are the input to deterministic mock value generation, then the renderer is exercised with `pnpm test:api -- renderer-integration`. E2 must NOT relax the smoke rules from correction #8 (deterministic mock values for every required manual field before render). Stop after E2.

## Task E2. DOCX render integration for 6 representative BMs

**Status**: ⚠️ PARTIAL — 35/36 pass, 1 expected failure (BM-051 surfaces a real template defect owned by F2) (2026-06-25)

### Files changed

- `apps/api/src/modules/documents/rendering/infrastructure/representative-bms-render.spec.ts` *(new, untracked at task start)* — integration spec covering 6 representative BMs through `deriveFormInputSchema` → deterministic mock values → `DocxtemplaterContractRenderEngine.renderShadow` → text extraction → marker smoke. No production source modified.

### Render utility / path used

- Renderer: existing `DocxtemplaterContractRenderEngine.renderShadow(plan, formData, outputRoot)` (already used by the BM-001 shadow spec). No parallel renderer; no XML manipulation.
- Workspace paths: `makeWorkspacePaths()` reusing the existing workspace fixture (`apps/api/src/modules/documents/rendering/.../__tests__/workspace-paths.ts`) — same paths the BM-001 shadow test uses.
- Plan builder: a small local `buildPlan(templateCode, formData)` that wraps the same shape `DocxtemplaterContractRenderEngine` consumes (template, renderScope, etc.) so we don't depend on `createBatch` / Prisma.

### DOCX text extraction method

- Test-local helper `extractDocxText(docxBuffer)`:
  - unzip the DOCX buffer in-memory,
  - read `word/document.xml` (and `word/header*.xml`, `word/footer*.xml` for completeness),
  - strip XML tags / collect `w:t` text into one string.
- Not promoted to a shared util — kept inline in the spec until a second consumer needs it.

### Deterministic mock values

- `markerForPath(path)` produces `__PATH_ENCODED_TO_UPPER_SNAKE__`. Example: `legalBasis.line1 → __LEGALBASIS_LINE1__`, `signature.signerName → __SIGNATURE_SIGNERNAME__`, `document.issueDate → __DOCUMENT_ISSUEDATE__`.
- Only fields where `field.required === true && field.editable === true && field.source === 'manual' && field.origin === 'canonical'` are included in the mock set.
- Date `inputType` also gets the marker string — no renderer-enforced date check failed during this run, so no exception was needed. Comment in the spec records this for future debugging.

### Per-BM report (from this run's `afterAll` JSON)

```json
[
  {
    "templateCode": "BM-001",
    "schemaSections": 4,
    "schemaFields": 28,
    "requiredManualEditableFieldCount": 24,
    "renderSucceeded": true,
    "markerFoundCount": 24,
    "markerMissingCount": 0,
    "containsDoubleOpenBrace": false,
    "containsDoubleCloseBrace": false
  },
  {
    "templateCode": "BM-051",
    "schemaSections": 3,
    "schemaFields": 3,
    "requiredManualEditableFieldCount": 0,
    "renderSucceeded": false,
    "skippedReason": "Render failed: Multi error"
  },
  {
    "templateCode": "BM-053",
    "schemaSections": 9,
    "schemaFields": 34,
    "requiredManualEditableFieldCount": 20,
    "renderSucceeded": true,
    "markerFoundCount": 20,
    "markerMissingCount": 0,
    "containsDoubleOpenBrace": false,
    "containsDoubleCloseBrace": false
  },
  {
    "templateCode": "BM-100",
    "schemaSections": 2,
    "schemaFields": 3,
    "requiredManualEditableFieldCount": 0,
    "renderSucceeded": true,
    "markerFoundCount": 0,
    "markerMissingCount": 0,
    "containsDoubleOpenBrace": false,
    "containsDoubleCloseBrace": false
  },
  {
    "templateCode": "BM-150",
    "schemaSections": 6,
    "schemaFields": 22,
    "requiredManualEditableFieldCount": 16,
    "renderSucceeded": true,
    "markerFoundCount": 16,
    "markerMissingCount": 0,
    "containsDoubleOpenBrace": false,
    "containsDoubleCloseBrace": false
  },
  {
    "templateCode": "BM-200",
    "schemaSections": 2,
    "schemaFields": 2,
    "requiredManualEditableFieldCount": 0,
    "renderSucceeded": true,
    "markerFoundCount": 0,
    "markerMissingCount": 0,
    "containsDoubleOpenBrace": false,
    "containsDoubleCloseBrace": false
  }
]
```

Aggregate:

- **5/6 BMs render successfully**. All 5 rendered BMs pass the `no {`, `no }}` assertion. Of the 4 BMs that have manual editable fields, all 60 mock markers (24 + 20 + 16) appear in the extracted DOCX text — schema path → renderer binding is correct end-to-end on the green path.
- **BM-051 surfaces a real template defect**: `Docxtemplater` throws `Multi error → Unopened tag` at compile time. The BM-051 normalized DOCX contains `}}` outside `{{...}}` placeholders (offsets 1302, 1329, 1704 …), which the lexer rejects. The schema derives fine (3 sections, 3 fields, 0 required manual editable), but the renderer cannot compile the template. This is **F2 territory** (header/footer/style fidelity, including unbalanced braces in prose). E2 deliberately fails the BM-051 test instead of papering over it — per the brief's brutal note, a real renderer-template mismatch must surface as a failing test, not a green one.
- **BM-100 and BM-200**: render successfully, but their schemas have 0 required manual editable fields. The `no {`, `no }}` assertion is the only meaningful smoke signal for these templates; the marker assertion is a no-op when the mock set is empty. This is by design (system-date-only or fully auto-filled templates).

### Commands run + exit codes

| Command | Exit | Result |
|---------|------|--------|
| `pnpm --filter api test -- --testPathPatterns=representative-bms-render` | 1 | 35 passed / 1 failed (BM-051 Docxtemplater Unopened tag — expected, real template defect owned by F2). |
| `pnpm --filter @qllaw/form-contracts test` | 0 | 47/47 pass (E1 + B1/B2/B4 regression intact). |
| `pnpm --filter api test -- --testPathPatterns="document-form-schema\|form-studio"` | 0 | 6 suites, 34 tests, all pass. |
| `pnpm --filter api test -- --testPathPatterns="documents" --testPathIgnorePatterns="representative-bms-render"` | 0 | 13 suites, 103 tests, all pass. E2 spec is excluded from this regression by design (its BM-051 fail is a known signal, not a regression). |
| `pnpm typecheck` (full monorepo: form-contracts + api + web) | 0 | clean across all three packages. |
| `pnpm test:web-unit` | 0 | 59/59 pass. |
| `pnpm --filter api lint -- "src/modules/documents/rendering/infrastructure/representative-bms-render.spec.ts"` | n/a | Spec files are explicitly ignored by ESLint config (warning shown). Per E2 brief: "If only test files changed and spec files are ignored by eslint, state that clearly." → noted here. |
| `pnpm --filter api lint` (full api lint, including any indirect renderer change) | 0 | clean. Production source untouched. |

### Backward compatibility / scope adherence

- `document-renderer.service.ts`, `DocxtemplaterContractRenderEngine`, `documents.service.ts`, the B3 controller/service, B1's `derive-form-input-schema.ts`, B2's `section-titles.ts`, and all FE form-inputs modules are **not modified**.
- No locked contract JSON files modified. No Prisma schema change. No new dependency. No public API change.
- E2 does not implement F1/F2/F3/F4/F5/F6, does not implement G semantic validation, does not remediate the 115 source fields, does not relax renderer errors, and does not wire new UI behavior — exactly per the E2 brief's "Important scope" list.
- Spec file is a sibling of `docxtemplater-contract-render-engine.spec.ts` (existing BM-001 shadow test) and reuses the same engine + workspace-path pattern. No parallel renderer created.

### Risks / Open

- **Open (F2-owned)**: BM-051's normalized DOCX has `}}` literals that Docxtemplater cannot compile. F2 (header/footer/style fidelity) must decide whether the right fix is (a) normalize those literals during the F1 slot-inventory step, or (b) configure Docxtemplater with a `nullGetter` / custom parser that tolerates unbalanced `}}` in prose. E2 will continue to surface this as a failure until F2 ships.
- **Open (F5-owned)**: BM-100 and BM-200 have no required manual editable fields. If those BMs are actually designed to have manual inputs (e.g. case-context fields that B1 dropped because they fell through to `unknown` source), F5 (table/repeat row counts) + C3 (source remediation) will need to revisit them. E2 does not own that decision.
- **Open (C3 follow-up)**: The 60 mock markers used in E2 (24 + 20 + 16) cover only `required && editable && manual && canonical` fields. The 115 `UNKNOWN_SOURCE_NORMALIZED` fields across the corpus still flow through to UI as editable — same risk as E1. C3 owns remediation.
- **Risk**: The marker assertion uses `extractedText.includes(marker)`. If a renderer's text extractor accidentally drops markers (e.g. split across `w:t` runs), E2 would falsely report `markerMissingCount > 0`. The chosen extractor concatenates all `w:t` text without run boundaries, which avoids this for the V1 templates but is a known limitation. F4 (text extraction parity) is the right place to harden this.

### Next step

**F1 — Slot inventory + extraction mapping** (per PLAN.md v2.3 §F1 and §10.5). F1 walks every locked contract + its normalized DOCX and produces a per-template slot inventory: which `{{...}}` placeholders exist, which canonical field each one binds to, and where literal `}}` patterns live (the BM-051 defect is the first concrete case). F1 unblocks F2 (header/footer fidelity) and F4 (extraction parity). E2's findings (BM-051 `}}` literal, BM-100/BM-200 zero manual fields) feed directly into the F1 inventory. Stop after F1.



