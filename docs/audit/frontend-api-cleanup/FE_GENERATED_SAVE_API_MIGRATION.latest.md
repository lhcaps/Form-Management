# PR-F4 — Generated-Document Save API Migration Audit

> Status: PASS (TypeScript clean for migrated files, lint skipped, static
> guard passing for the PR-F4 invariants; pre-existing PR-F violations and
> pre-existing `profile-status` typings remain unchanged and belong to
> their own PRs)
> Scope: `apps/web` only — no backend route paths changed, no save
> behavior changed for unsupported flows, no DOCX/source/contract
> mutation, no DB / Prisma mutation.

## Summary

PR-F4 migrates generated-document save raw `fetch` POST calls from
per-component files and 5 local BM API helpers to the centralized
`saveDocumentFormInputs` helper exported by
`apps/web/src/lib/document-form-api.ts`. The migration preserves:

- Request payload shape (`JSON.stringify({...body...})` payload objects).
- DocumentId source (`documentId` already in component scope).
- Save semantics (PR-F removed PATCH/PUT already; only POST is sent).
- Error behavior (`saveDocumentFormInputs` throws `ApiError`; the
  outer `try/catch` propagates the backend message verbatim, falling
  back to the in-component Vietnamese message via
  `error instanceof Error ? error.message : "Không lưu được BM-XXX."`).
- Success messages, dirty/saved flags, loading state, return-type
  assumptions on consumer sites.
- BM-specific field cleanup before save (e.g. normalized payload
  wrappers `formInputs` / `payloadOverrides` / `renderPayloadOverrides`).
- User-visible Vietnamese text.

PR-F4 deliberately does NOT touch:

- `savePublishedContractFormInputs` (the contract-form-inputs PUT seam).
- `saveBm031DirectFormInputs` (the BM-031 direct-form-inputs POST seam).
- Render-DOCX / convert-PDF helpers.
- File download / blob helpers.
- Runtime preview / export helpers.
- Business writes outside generated-document form inputs.

## Migration script

Files were transformed by a Node.js script:
`scripts/_pr-f4-migrate-save-posts.mjs` (transient automation artifact,
not a runtime dependency). The script uses a line-aware walk with
paren + brace counting to safely identify each `fetch(...); if (!<var>.ok) {...}`
block, extracts the `body: JSON.stringify(...)` argument, replaces it
with `await saveDocumentFormInputs(documentId, <body>);`, and cleans
up `API_BASE_URL` / `getApiBaseUrl` declarations whose references have
been removed.

Three BM-side patterns were handled:

1. **Pattern A — single fetch + `if (!response.ok) { ... }`**:
   the dominant multi-line form across the BM flat-form panels and
   BM local helpers.
2. **Pattern B — `requestSave(method: "POST" | "PATCH", body)` helper**
   (file-local helpers in `bm-011-form-inputs.tsx` and analogues):
   PATCH route removed; PATCH-fallback `if (!result.ok && (404||405)) { ... }`
   and `if (!result.ok) { throw new Error(result.text || ...) }`
   blocks removed; helper body collapsed to a single
   `await saveDocumentFormInputs(documentId, body as Record<string, unknown>);`
   followed by `return { ok: true, status: 200, text: "" };`.
3. **Pattern C — `postJson(url, body)` thin wrapper**
   (`bm-156-form-inputs.tsx` and analogues): inline call sites
   `await postJson(...)` collapsed to
   `await saveDocumentFormInputs(documentId, body)`; `postJson` function
   definition removed.

A small number of edge-case files were migrated by surgical
`StrReplace` because their structure differed from the dominant
patterns:

- `bm-005`, `bm-088`, `bm-089`: the legacy save response body was
  consumed via `const savedPayload = (await response.json()) as RenderPayload`;
  these now use
  `const savedPayload = (await saveDocumentFormInputs(documentId, buildSaveBody(form))) as unknown as RenderPayload;`.
- `bm-033`, `bm-037`: `await response.json().catch(() => null)` was a
  drain pattern; it is removed entirely (the seam either throws or
  returns the response).
- `bm-023`: a file-local `requestSave(documentId, method, body)` helper
  that did not match the PR-F3-era helper signature; its body was
  rewritten to delegate to `saveDocumentFormInputs`.

## Migrated files

### BM flat-form panels (113)

All panels matching
`apps/web/src/components/documents/bm-\d{3}-form-inputs.tsx` whose save
handler performed a raw
`fetch(\`${API_BASE_URL}/documents/generated/${documentId}/form-inputs\`, { method: "POST", ... })`
now route through `saveDocumentFormInputs(documentId, body)`. The
payload object passed to `saveDocumentFormInputs` is the exact
`JSON.stringify(...)` payload that was previously stringified inline.

Concrete migrated panel files (113):

```
apps/web/src/components/documents/bm-002-form-inputs.tsx
apps/web/src/components/documents/bm-003-form-inputs.tsx
apps/web/src/components/documents/bm-004-form-inputs.tsx
apps/web/src/components/documents/bm-005-form-inputs.tsx
apps/web/src/components/documents/bm-006-form-inputs.tsx
apps/web/src/components/documents/bm-007-form-inputs.tsx
apps/web/src/components/documents/bm-008-form-inputs.tsx
apps/web/src/components/documents/bm-009-form-inputs.tsx
apps/web/src/components/documents/bm-010-form-inputs.tsx
apps/web/src/components/documents/bm-011-form-inputs.tsx
apps/web/src/components/documents/bm-012-form-inputs.tsx
apps/web/src/components/documents/bm-013-form-inputs.tsx
apps/web/src/components/documents/bm-014-form-inputs.tsx
apps/web/src/components/documents/bm-015-form-inputs.tsx
apps/web/src/components/documents/bm-016-form-inputs.tsx
apps/web/src/components/documents/bm-017-form-inputs.tsx
apps/web/src/components/documents/bm-018-form-inputs.tsx
apps/web/src/components/documents/bm-019-form-inputs.tsx
apps/web/src/components/documents/bm-020-form-inputs.tsx
apps/web/src/components/documents/bm-021-form-inputs.tsx
apps/web/src/components/documents/bm-023-form-inputs.tsx
apps/web/src/components/documents/bm-024-form-inputs.tsx
apps/web/src/components/documents/bm-025-form-inputs.tsx
apps/web/src/components/documents/bm-026-form-inputs.tsx
apps/web/src/components/documents/bm-029-form-inputs.tsx
apps/web/src/components/documents/bm-030-form-inputs.tsx
apps/web/src/components/documents/bm-032-form-inputs.tsx
apps/web/src/components/documents/bm-033-form-inputs.tsx
apps/web/src/components/documents/bm-034-form-inputs.tsx
apps/web/src/components/documents/bm-035-form-inputs.tsx
apps/web/src/components/documents/bm-036-form-inputs.tsx
apps/web/src/components/documents/bm-037-form-inputs.tsx
apps/web/src/components/documents/bm-038-form-inputs.tsx
apps/web/src/components/documents/bm-039-form-inputs.tsx
apps/web/src/components/documents/bm-040-form-inputs.tsx
apps/web/src/components/documents/bm-041-form-inputs.tsx
apps/web/src/components/documents/bm-042-form-inputs.tsx
apps/web/src/components/documents/bm-043-form-inputs.tsx
apps/web/src/components/documents/bm-044-form-inputs.tsx
apps/web/src/components/documents/bm-045-form-inputs.tsx
apps/web/src/components/documents/bm-046-form-inputs.tsx
apps/web/src/components/documents/bm-047-form-inputs.tsx
apps/web/src/components/documents/bm-054-form-inputs.tsx
apps/web/src/components/documents/bm-055-form-inputs.tsx
apps/web/src/components/documents/bm-056-form-inputs.tsx
apps/web/src/components/documents/bm-057-form-inputs.tsx
apps/web/src/components/documents/bm-058-form-inputs.tsx
apps/web/src/components/documents/bm-059-form-inputs.tsx
apps/web/src/components/documents/bm-070-form-inputs.tsx
apps/web/src/components/documents/bm-071-form-inputs.tsx
apps/web/src/components/documents/bm-072-form-inputs.tsx
apps/web/src/components/documents/bm-074-form-inputs.tsx
apps/web/src/components/documents/bm-076-form-inputs.tsx
apps/web/src/components/documents/bm-078-form-inputs.tsx
apps/web/src/components/documents/bm-081-form-inputs.tsx
apps/web/src/components/documents/bm-083-form-inputs.tsx
apps/web/src/components/documents/bm-084-form-inputs.tsx
apps/web/src/components/documents/bm-085-form-inputs.tsx
apps/web/src/components/documents/bm-086-form-inputs.tsx
apps/web/src/components/documents/bm-087-form-inputs.tsx
apps/web/src/components/documents/bm-088-form-inputs.tsx
apps/web/src/components/documents/bm-089-form-inputs.tsx
apps/web/src/components/documents/bm-090-form-inputs.tsx
apps/web/src/components/documents/bm-091-form-inputs.tsx
apps/web/src/components/documents/bm-092-form-inputs.tsx
apps/web/src/components/documents/bm-093-form-inputs.tsx
apps/web/src/components/documents/bm-094-form-inputs.tsx
apps/web/src/components/documents/bm-095-form-inputs.tsx
apps/web/src/components/documents/bm-096-form-inputs.tsx
apps/web/src/components/documents/bm-098-form-inputs.tsx
apps/web/src/components/documents/bm-099-form-inputs.tsx
apps/web/src/components/documents/bm-100-form-inputs.tsx
apps/web/src/components/documents/bm-101-form-inputs.tsx
apps/web/src/components/documents/bm-102-form-inputs.tsx
apps/web/src/components/documents/bm-103-form-inputs.tsx
apps/web/src/components/documents/bm-104-form-inputs.tsx
apps/web/src/components/documents/bm-105-form-inputs.tsx
apps/web/src/components/documents/bm-106-form-inputs.tsx
apps/web/src/components/documents/bm-107-form-inputs.tsx
apps/web/src/components/documents/bm-108-form-inputs.tsx
apps/web/src/components/documents/bm-109-form-inputs.tsx
apps/web/src/components/documents/bm-110-form-inputs.tsx
apps/web/src/components/documents/bm-111-form-inputs.tsx
apps/web/src/components/documents/bm-112-form-inputs.tsx
apps/web/src/components/documents/bm-113-form-inputs.tsx
apps/web/src/components/documents/bm-114-form-inputs.tsx
apps/web/src/components/documents/bm-115-form-inputs.tsx
apps/web/src/components/documents/bm-116-form-inputs.tsx
apps/web/src/components/documents/bm-117-form-inputs.tsx
apps/web/src/components/documents/bm-118-form-inputs.tsx
apps/web/src/components/documents/bm-119-form-inputs.tsx
apps/web/src/components/documents/bm-120-form-inputs.tsx
apps/web/src/components/documents/bm-121-form-inputs.tsx
apps/web/src/components/documents/bm-122-form-inputs.tsx
apps/web/src/components/documents/bm-123-form-inputs.tsx
apps/web/src/components/documents/bm-124-form-inputs.tsx
apps/web/src/components/documents/bm-125-form-inputs.tsx
apps/web/src/components/documents/bm-126-form-inputs.tsx
apps/web/src/components/documents/bm-127-form-inputs.tsx
apps/web/src/components/documents/bm-128-form-inputs.tsx
apps/web/src/components/documents/bm-129-form-inputs.tsx
apps/web/src/components/documents/bm-130-form-inputs.tsx
apps/web/src/components/documents/bm-131-form-inputs.tsx
apps/web/src/components/documents/bm-132-form-inputs.tsx
apps/web/src/components/documents/bm-133-form-inputs.tsx
apps/web/src/components/documents/bm-134-form-inputs.tsx
apps/web/src/components/documents/bm-135-form-inputs.tsx
apps/web/src/components/documents/bm-136-form-inputs.tsx
apps/web/src/components/documents/bm-137-form-inputs.tsx
apps/web/src/components/documents/bm-138-form-inputs.tsx
apps/web/src/components/documents/bm-139-form-inputs.tsx
apps/web/src/components/documents/bm-140-form-inputs.tsx
apps/web/src/components/documents/bm-141-form-inputs.tsx
apps/web/src/components/documents/bm-142-form-inputs.tsx
apps/web/src/components/documents/bm-143-form-inputs.tsx
apps/web/src/components/documents/bm-144-form-inputs.tsx
apps/web/src/components/documents/bm-145-form-inputs.tsx
apps/web/src/components/documents/bm-146-form-inputs.tsx
apps/web/src/components/documents/bm-147-form-inputs.tsx
apps/web/src/components/documents/bm-148-form-inputs.tsx
apps/web/src/components/documents/bm-149-form-inputs.tsx
apps/web/src/components/documents/bm-150-form-inputs.tsx
apps/web/src/components/documents/bm-156-form-inputs.tsx
```

### BM local save helpers (5)

All five save helpers now expose
`saveBmXXXFormInputs(...) -> Promise<...>` that internally delegates to
`saveDocumentFormInputs(documentId, payload)`. The legacy
`return readApi<...>(\`/documents/generated/${documentId}/form-inputs\`, { method: "POST", body: JSON.stringify({...}) })`
pattern was removed.

| File | Exported helper | Return type | Migration |
| --- | --- | --- | --- |
| `apps/web/src/lib/bm001-form-inputs-api.ts` | `saveBm001FormInputs(documentId, formInputs)` | `Promise<Bm001RenderPayload>` | Delegates to `saveDocumentFormInputs(documentId, normalizedInputs)` with `formInputs`/`payloadOverrides`/`renderPayloadOverrides`/`metadata` payload. Keeps the BM-specific `syncBm001PersonAliasesBeforeSave` normalization. |
| `apps/web/src/lib/bm053-form-inputs-api.ts` | `saveBm053FormInputs(documentId, formInputs)` | `Promise<Bm053RenderPayload>` | Delegates to `saveDocumentFormInputs(documentId, { ...formInputs })`. |
| `apps/web/src/lib/bm090-form-inputs-api.ts` | `saveBm090FormInputs(documentId, formInputs)` | `Promise<void>` | Delegates to `saveDocumentFormInputs(documentId, { ...normalizedInputs, formInputs: normalizedInputs })`. |
| `apps/web/src/lib/bm097-form-inputs-api.ts` | `saveBm097FormInputs(documentId, formInputs)` | `Promise<Bm097FormInputs>` | Delegates to `saveDocumentFormInputs(documentId, { ...normalizedInputs, formInputs, payloadOverrides, renderPayloadOverrides })`. Returns the local normalized inputs (documented as "source of truth after save"). |
| `apps/web/src/lib/bm156-form-inputs-api.ts` | `saveBm156FormInputs(documentId, formInputs)` | `Promise<Bm156RenderPayload>` | Delegates to `saveDocumentFormInputs(documentId, { ...formInputs })`. |

The legacy helpers retained their
`const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ...`
top-level constant only where they still expose a local `readApi`
helper (used for non-save operations):

- `bm001-form-inputs-api.ts`: kept for the local `readApi` used by
  `getBm001RenderPayload`.
- `bm053`, `bm156`: kept for the local `readApi` used by
  `getBmXXXRenderPayload`.
- `bm090`, `bm097`: `API_BASE_URL` was deleted inside the
  `saveBmXXXFormInputs` body (no longer referenced) but kept at the
  module top level for the file-local `readApi` used by the
  read-side helpers.

### New static guard test

`apps/web/src/lib/generated-document-save-api.guard.test.ts` covers:

1. Every BM flat-form panel does NOT raw-fetch the generated save
   route after migration.
2. Every BM flat-form panel does NOT reference `API_BASE_URL` for the
   generated save URL.
3. When a BM flat-form panel uses
   `saveDocumentFormInputs`, it imports the symbol from
   `document-form-api` (no `writeApi` shim, no local copy).
4. Each BM local save helper no longer raw-fetches
   `POST /documents/generated/:id/form-inputs` and no longer routes
   through a local `readApi` for that route.
5. Each BM local save helper that still exports `saveBmXXXFormInputs`
   delegates internally to `saveDocumentFormInputs`.
6. `document-form-api.ts` still exports the 3 supported generated
   save helpers
   (`saveDocumentFormInputs`, `savePublishedContractFormInputs`,
   `saveBm031DirectFormInputs`).
7. `savePublishedContractFormInputs` remains on
   `PUT /documents/generated/:id/contract-form-inputs` (i.e. the
   contract-form-inputs PUT seam is NOT in the BM-031-direct or
   form-inputs POST seam).
8. PR-F4 did not introduce a new raw `fetch(...)` with
   `method: "PATCH"` or `method: "PUT"` against
   `/documents/generated/:id/form-inputs` in any BM flat-form panel
   it touched.

The pre-existing
`document-form-api.generated-form-input-guard.test.ts`,
`generated-document-read-api.guard.test.ts`,
`form-studio-retirement-guard.test.ts`, and
`pr-f2-generated-save-smoke.test.ts` tests were left untouched and
remain the responsibility of their owning PRs (PR-F and PR-F3).

### Migration script (transient)

`scripts/_pr-f4-migrate-save-posts.mjs` is the Node.js script that
performed the migration. It is preserved as an audit artifact, not a
runtime dependency.

## Exclusions

Explicitly NOT migrated, with reason:

- `savePublishedContractFormInputs` (still on contract-form-inputs PUT
  via the `document-form-api` seam). Out of PR-F4 scope.
- `saveBm031DirectFormInputs` (still on bm031-direct-form-inputs POST).
  Out of PR-F4 scope.
- `getBmXXXRenderPayload` helpers in the 5 BM local API helper files
  (these are READS, not saves; they continue to use the file-local
  `readApi` from PR-F3).
- `BmFormCasePayloadButton` and the surrounding `bm-form/*` package
  (business write routes outside generated document form inputs).
- All rendering / preview / download / blob / runtime-preview / export
  helpers.
- BM-031 direct save path (`saveBm031DirectFormInputs`) and its
  consumers.

Files where PR-F4 deliberately preserved read-only `fetch` to
`/documents/generated/:id/render-payload` because that route is part
of the PR-F3 read seam, not the PR-F4 write seam:

- Every migrated BM flat-form panel that loaded the render-payload
  before populating the form.
- `bm-023-form-inputs.tsx` (untouched read fetch at lines 455-463).
- `bm-040-form-inputs.tsx` (untouched read fetch at line 653).

## Remaining raw generated-document save fetches after PR-F4

None. The PR-F4 static guard
(`generated-document-save-api.guard.test.ts`) confirms that no file
matching `apps/web/src/components/documents/bm-\d{3}-form-inputs.tsx`
raw-fetches `POST /documents/generated/:id/form-inputs` and no BM local
save helper raw-fetches the same route.

## Risk after migration

- **Low.** `saveDocumentFormInputs` delegates to `readApi` with
  `method: "POST"` and `body: JSON.stringify(payload)`. The shape of
  the JSON payload is the exact object that was previously
  `JSON.stringify(...)`-ed inline. The route path
  `/documents/generated/:id/form-inputs` is unchanged.
- The user-facing Vietnamese error fallback
  (`"Không lưu được BM-XXX."`) and the
  `Đã lưu BM-XXX.` success messages remain in every component, so the
  panel UX is byte-identical from a user's perspective.
- Where the legacy code consumed the response body to seed the form
  (`bm-005`, `bm-088`, `bm-089`), the new code consumes the seam's
  `Promise<Record<string, unknown>>` return value as the payload.
  This is the same data, just no longer routed through the
  intermediate `Response.json()` parse.
- The helper wrappers (`bm001`, `bm053`, `bm090`, `bm097`, `bm156`)
  preserve their exported signatures and return types, so no upstream
  component has to change imports.

## Pre-existing issues (OUT OF SCOPE for PR-F4)

The following pre-existing TypeScript and guard failures exist on the
branch and are NOT introduced by PR-F4. They belong to their owning
PRs and are listed here only for completeness of the validation report:

- `apps/web/src/lib/form-flight/profile-status.test.ts` and
  `apps/web/src/lib/form-flight/profile-status.ts` reference types
  (`FormFlightProfileStatus`, `runtimeReady`, `profileStatus`) that
  do not exist on the current `FormFlightProfile` type. These are
  shape churn in the form-flight package, not PR-F4 concerns.
- `bm-031-form-inputs.tsx` and `bm-170-form-inputs.tsx` still import
  and call `patchBm031DirectFormInputs` /
  `patchDocumentFormInputs`. These are PR-F violations (the same
  pattern is flagged by `document-form-api.generated-form-input-guard.test.ts`
  which is already failing on `main`).
- `bm-172-form-inputs.tsx` still calls
  `patchDocumentFormInputs` and `replaceDocumentFormInputs` inside a
  `for` loop that probes each method before falling back. PR-F4 left
  this loop intact because the explicit task instructions said to not
  rewrite business logic beyond the save seam migration.
- `apps/web/src/lib/generated-document-read-api.guard.test.ts`,
  `apps/web/src/lib/document-form-api.generated-form-input-guard.test.ts`,
  `apps/web/src/lib/form-studio-retirement-guard.test.ts`, and
  `apps/web/src/components/documents/pr-f2-generated-save-smoke.test.ts`
  have pre-existing failures on `main` that pre-date PR-F4.

## Next recommended cleanup

After PR-F4 lands, the recommended follow-ups (each in its own PR) are:

1. **PR-F5 (or new PR-PR-FIX-1)**: Remove the remaining
   `patchDocumentFormInputs`, `replaceDocumentFormInputs`, and
   `patchBm031DirectFormInputs` symbols from `document-form-api.ts`
   (per PR-F plan) and update `bm-031`, `bm-170`, `bm-172` callers to
   funnel through `saveDocumentFormInputs`.
2. **PR-FLIGHT**: Reconcile the `form-flight` profile types
   (`FormFlightProfileStatus`, `runtimeReady`, `profileStatus`) with
   the current `FormFlightProfile` shape so the
   `profile-status.test.ts` and `profile-status.ts` stop failing
   `tsc`.
3. **PR-F2SMOKE**: Update `pr-f2-generated-save-smoke.test.ts`
   expectations (or fix `bm-170`/`bm-172`) so the smoke tests for
   BM-170 / BM-172 / BM-031 go green.
4. **PR-CLEAN-1**: Now that `bm001`, `bm053`, `bm090`, `bm097`,
   `bm156` no longer raw-write to generated save, the file-local
   `readApi` definitions and `const API_BASE_URL = ...` declarations
   can be collapsed to import the canonical
   `readApi` from `./api-client` (Phase 2 of the FE read cleanup).
5. **PR-CODE-IMPORT**: After the above, consider folding the 5 BM
   local save helpers into the central `document-form-api.ts` once
   the BM-specific normalizers (`syncBm001PersonAliasesBeforeSave`,
   etc.) are extracted into a shared input-mapping module.
