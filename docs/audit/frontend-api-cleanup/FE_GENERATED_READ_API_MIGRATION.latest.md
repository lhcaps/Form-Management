# PR-F3 — Generated-Document Read API Migration Audit

> Status: PASS (TypeScript clean, lint clean, static guard passing)
> Scope: apps/web only — no backend route paths changed, no save behavior
> changed, no DOCX/source/contract mutation, no DB / Prisma mutation.

## Summary

PR-F3 migrates generated-document read/payload raw fetches from
cookie-only `fetch(..., credentials: "include")` and inline
`API_BASE_URL` template-literal calls to the centralized `readApi`
helper exported by `apps/web/src/lib/api-client.ts`. The migration
preserves the backend route paths, response types, error semantics,
and BM panel UI behavior.

The migration touches:

1. **113 BM flat-form panels** under `apps/web/src/components/documents/`.
2. **5 BM local API helper files** under `apps/web/src/lib/`.
3. **1 new static guard** test file: `apps/web/src/lib/generated-document-read-api.guard.test.ts`.

The supported generated save helpers, the document-form-api seam, and
the binary / blob / download / render-docx / convert-pdf / runtime-preview
helpers are deliberately left untouched.

## Migrated files

### BM flat-form panels (113)

All panels matching `apps/web/src/components/documents/bm-\d{3}-form-inputs.tsx`
whose `useEffect` / `reloadFromBackend` / `loadPayload` / `getRenderPayload`
function performed a `fetch(\`${API_BASE_URL}/documents/generated/${documentId}/render-payload\`, { credentials: "include" })`
now use `readApi<JsonObject>(\`/documents/generated/${documentId}/render-payload\`, { noStore: true })`.

Concrete files (113):

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
apps/web/src/components/documents/bm-023-form-inputs.tsx
apps/web/src/components/documents/bm-029-form-inputs.tsx
apps/web/src/components/documents/bm-030-form-inputs.tsx
apps/web/src/components/documents/bm-031-form-inputs.tsx
apps/web/src/components/documents/bm-033-form-inputs.tsx
apps/web/src/components/documents/bm-037-form-inputs.tsx
apps/web/src/components/documents/bm-038-form-inputs.tsx
apps/web/src/components/documents/bm-039-form-inputs.tsx
apps/web/src/components/documents/bm-040-form-inputs.tsx
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
```

### BM local API helpers (5)

Each helper now imports `readApi` from `./api-client`, has its inline
`readApi` / `ApiClientError` removed, and uses the centralized helper
for the read path. The save helpers (`saveBm001FormInputs`,
`saveBm053FormInputs`, `saveBm090FormInputs`, `saveBm097FormInputs`,
`saveBm156FormInputs`) keep their raw `fetch` POST behavior so the
PR-F save seam contract is preserved.

```
apps/web/src/lib/bm001-form-inputs-api.ts   — getBm001RenderPayload → readApi
apps/web/src/lib/bm053-form-inputs-api.ts   — getBm053RenderPayload → readApi
apps/web/src/lib/bm090-form-inputs-api.ts   — getBm090RenderPayload → readApi
apps/web/src/lib/bm097-form-inputs-api.ts   — getBm097RenderPayload → readApi
apps/web/src/lib/bm156-form-inputs-api.ts   — getBm156RenderPayload → readApi
```

### New static guard (1)

```
apps/web/src/lib/generated-document-read-api.guard.test.ts
```

Six test cases:

1. No raw `fetch(\`${API_BASE_URL}/documents/generated/.../render-payload\`)`
   remains in any BM flat-form component.
2. No `credentials:"include"` cookie-only fetch on
   `/documents/generated/.../render-payload` remains in any BM flat-form
   component.
3. Every migrated BM panel that touches `/documents/generated/.../render-payload`
   imports `readApi` from the centralized `api-client` and uses
   `readApi<JsonObject>(\`/documents/generated/.../render-payload\`)`.
4. All five BM local API helpers import `readApi` from `./api-client`.
5. PR-F unsupported PATCH/PUT generated save routes stay absent.
6. Supported generated save helpers stay exported from
   `document-form-api.ts`; `form-studio-api.ts` stays a compatibility
   re-export.

## Excluded files (with reason)

| File | Reason for exclusion |
| --- | --- |
| `apps/web/src/lib/document-render-api.ts` | Renders DOCX/PDF; binary blob flow uses specialized fetch with `cache: "no-store"` and `Accept: application/octet-stream`. |
| `apps/web/src/lib/templates-api.ts` | Templates use the runtime preview session, not the generated-document flow. |
| `apps/web/src/lib/cases-api.ts`, `case-detail-api.ts` | Case-level business reads, not generated-document reads. |
| `apps/web/src/lib/imports-api.ts` | Has its own cookie-bridge-aware `readApi` for non-generated routes. |
| `apps/web/src/lib/contract-platform-api.ts` | Contract platform reads (retired draft / authoring reads), not generated-document payload reads. |
| `apps/web/src/components/documents/runtime-template-render.controller.ts` | Runtime preview flow — uses specialized fetch. |
| `apps/web/src/components/documents/template-preview-workspace.tsx`, `template-selector-workspace.tsx`, `generated-document-workspace.tsx` | UI shells that already import `readApi` (already centralized). |
| `apps/web/src/lib/document-form-api.ts` | The seam — already centralized in PR-F. |
| `apps/web/src/lib/form-studio-api.ts` | Compatibility re-export shim only. |
| `apps/web/src/lib/api-client.ts` | Source of truth for `readApi`. |

## Remaining raw `fetch` calls (by classification)

### KEEP_RUNTIME_PREVIEW_HELPER

Files that still call `fetch(...)` against the runtime preview routes
(`/forms/runtime/...` and `/documents/runtime-preview/...`). These are
specialized fetch helpers that may opt in or out of the Clerk Bearer
token bridge and must not be migrated in PR-F3:

- `apps/web/src/components/documents/runtime-template-render.controller.ts`
- `apps/web/src/lib/runtime-preview-session.service.ts`

### KEEP_GENERATED_FILE_DOWNLOAD_HELPER

Files that download DOCX/PDF blobs from the generated-document pipeline:

- `apps/web/src/lib/document-render-api.ts` (`renderDocumentDocx`, `convertDocumentPdf`)
- `apps/web/src/components/documents/generated-document-workspace.tsx`

### KEEP_EXPLICIT_TOKEN_BRIDGE

- `apps/web/src/lib/imports-api.ts` — explicit Clerk Bearer token bridge.

### MIGRATE_TO_WRITE_API_LATER (out of scope)

These are generated-document WRITE routes (`POST /documents/generated/:id/form-inputs`,
`POST /documents/generated/:id/contract-form-inputs`, etc.) that are
intentionally NOT touched in PR-F3 and remain on raw `fetch`:

- BM flat-form `handleSave` functions (113 files)
- `saveBm001FormInputs`, `saveBm053FormInputs`, `saveBm090FormInputs`,
  `saveBm097FormInputs`, `saveBm156FormInputs` (5 helpers)
- `document-form-api.ts` (already centralized — seam)
- `contract-platform-api.ts` (publish / draft / form-template lifecycle)

### UNSUPPORTED_ROUTE_REMOVE

`UNSUPPORTED_ROUTE_REMOVE` count: 0. No raw PATCH/PUT generated save
helpers were reintroduced.

### UNKNOWN_NEEDS_MANUAL_REVIEW

`UNKNOWN_NEEDS_MANUAL_REVIEW` count: 0. Every targeted raw fetch was
either migrated (113 panels + 5 helpers) or explicitly classified as
out of scope.

## Risk after migration

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Behavioral drift in render-payload reads | LOW | `readApi` performs identical JSON parsing, status check, and error wrapping as the previous inline fetch (via `unwrapApiData` / `ApiError`). The guard test pins the call shape. |
| Save behavior drift | NONE | PR-F2 audit + this PR both confirmed save helpers untouched. The save seam is in `document-form-api.ts` (already centralized in PR-F). |
| Clerk/token bridge regression | LOW | `readApi` reads the existing Bearer token bridge. No BM panel previously used the token bridge inline — they all relied on cookie-only fetch. |
| Type widening from `JsonObject` | LOW | `readApi<T>` accepts an explicit type parameter. All migrated panels use `JsonObject` (alias for `Record<string, unknown>`), matching the original behavior where the result was cast to a permissive object before being normalized. |
| Cosmetic indentation in migrated blocks | LOW | All migrated blocks pass `tsc --noEmit` and `eslint`. Indentation is uniform. |

## Next recommended cleanup

1. **MIGRATE_TO_WRITE_API_LATER** — the 113 BM `handleSave` functions
   that still use raw `fetch(POST)` against `/documents/generated/:id/form-inputs`
   can be migrated to a centralized `writeApi` / `postApi` once that
   helper exists. This is the same seam problem, but on the write path.
2. **Collapse the 5 BM local API helpers** — once the centralized
   `readApi` / `writeApi` is in place, the `getBmXXXRenderPayload` /
   `saveBmXXXFormInputs` pairs can collapse into a single generic
   generated-document client. (Per PR-F3 rules: not done in this PR.)
3. **Snapshot the migration script** — the Node.js regex-based
   migration script (`scripts/_pr-f3-migrate-render-payload-reads.mjs`
   and the fixup passes) was used to drive the bulk migration. Future
   similar migrations can reuse it as a template.

## Validation

| Command | Exit code | Result |
| --- | --- | --- |
| `pnpm --filter web exec tsc --noEmit` | 0 | PASS — no type errors after migration. |
| `pnpm --filter web lint` | 0 | PASS — no lint errors. |
| `pnpm --filter api exec tsx --test ../web/src/lib/generated-document-read-api.guard.test.ts` | 0 | PASS — 6 / 6 cases. |
| `pnpm --filter api exec tsx --test ../web/src/lib/document-form-api.generated-form-input-guard.test.ts` | 0 | PASS — 6 / 6 cases (PR-F guard still green). |
| `pnpm --filter api exec tsx --test ../web/src/components/documents/pr-f2-generated-save-smoke.test.ts` | 0 | PASS — 13 / 13 cases (PR-F2 smoke still green). |

## Scope guards confirmed

- [x] no commit / push / stage (none of `git commit`, `git push`, `git add` was called).
- [x] no backend route paths changed.
- [x] no DB migration.
- [x] no Prisma schema mutation.
- [x] no DOCX / source / contract mutation.
- [x] no public API route path change.
- [x] no generated save behavior change.
- [x] no generated render behavior change.
- [x] no unsupported PATCH/PUT generated save route reintroduced (PR-F guard green).
- [x] no binary / blob / download / render helper rewritten blindly.
- [x] no runtime preview / export helper rewritten blindly.
- [x] no business write route migrated (writes are explicitly out of scope).
- [x] generated-document JSON reads use `readApi`.
- [x] Clerk / token bridge centralized for migrated reads (via `api-client.ts`).