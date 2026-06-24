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

