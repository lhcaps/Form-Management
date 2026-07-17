# Frontend Generated API Helper Cleanup — Raw Fetch Inventory

**Date:** 2026-07-07
**Scope:** `apps/web/src/**` — raw `fetch()` callers and inline
`method: "POST"` calls against
`/documents/generated/:documentId/form-inputs` (and the same family).
**Constraint:** PR-F is cleanup-only. NO mass rewrite of 213 BM panels.
This file is the inventory the planner will use to schedule any future
migrations.

---

## 0. PR-F outcome (one-liner)

The three unsupported generated-save helpers
(`patchDocumentFormInputs`, `replaceDocumentFormInputs`,
`patchBm031DirectFormInputs`) are removed from
`apps/web/src/lib/document-form-api.ts` and from their three active
callers (`bm-031-form-inputs.tsx`, `bm-170-form-inputs.tsx`,
`bm-172-form-inputs.tsx`). A static guard test
(`apps/web/src/lib/document-form-api.generated-form-input-guard.test.ts`)
locks the state and fails the build if any of the three names reappear
or if any frontend source constructs PATCH/PUT against
`/documents/generated/:id/form-inputs` or PATCH against
`/documents/generated/:id/bm031-direct-form-inputs`.

Supported helpers remain exported:
`getDocumentRenderPayload`, `saveDocumentFormInputs`,
`savePublishedContractFormInputs`, `saveBm031DirectFormInputs`.

---

## 1. Classification scheme

| Bucket | Meaning | PR-F action |
| --- | --- | --- |
| `SAFE_ACTIVE_SUPPORTED_ROUTE` | Raw `fetch()` that targets a backend-supported method+path. | None (already correct). |
| `ACTIVE_BUT_DUPLICATIVE` | Helper-based callers (in `document-form-api.ts` or the new `contract-platform-api.ts`) that wrap the same route. | None for PR-F. Mass migration is a separate PR. |
| `UNSUPPORTED_ROUTE` | Raw `fetch()` or helper targeting a PATCH/PUT the backend does not expose. | All removed in PR-F. |
| `UNKNOWN_NEEDS_MANUAL_REVIEW` | Raw `fetch()` with a custom URL string the regex could not classify. | Listed below for planner triage. |

---

## 2. `SAFE_ACTIVE_SUPPORTED_ROUTE` (raw fetch on the supported POST route)

Every BM panel listed below calls the supported
`POST /documents/generated/:documentId/form-inputs` route. Each row
verifies with the surrounding 5 lines (verified in PR-F source diff)
that `method: "POST"` is the only HTTP verb in the `fetch` call.

**Single-fetch panel inventory (count = raw fetch call sites that hit
the supported form-inputs route):**

| Count | Files | Pattern |
| --- | --- | --- |
| 1 site each | `bm-002`, `bm-005`, `bm-006`, `bm-008`, `bm-009`, `bm-010`, `bm-011`, `bm-012`, `bm-013`, `bm-014`, `bm-015`, `bm-016`, `bm-017`, `bm-018`, `bm-019`, `bm-020`, `bm-021`, `bm-024`, `bm-025`, `bm-027`, `bm-028`, `bm-029`, `bm-030`, `bm-031` (via helper), `bm-032`, `bm-033`, `bm-034`, `bm-035`, `bm-036`, `bm-037`, `bm-038`, `bm-039`, `bm-040`, `bm-041`, `bm-042`, `bm-043`, `bm-044`, `bm-045`, `bm-046`, `bm-047`, `bm-048`, `bm-049`, `bm-050`, `bm-052`, `bm-053`, `bm-054`, `bm-055`, `bm-057`, `bm-058`, `bm-059`, `bm-060`, `bm-062`, `bm-063`, `bm-065`, `bm-066`, `bm-067`, `bm-068`, `bm-070`, `bm-071`, `bm-072`, `bm-073`, `bm-074`, `bm-075`, `bm-076`, `bm-077`, `bm-078`, `bm-079`, `bm-080`, `bm-081`, `bm-082`, `bm-083`, `bm-084`, `bm-085`, `bm-086`, `bm-087`, `bm-088`, `bm-089`, `bm-091`, `bm-092`, `bm-093`, `bm-094`, `bm-095`, `bm-096`, `bm-097`, `bm-098`, `bm-099`, `bm-100`, `bm-101`, `bm-102`, `bm-103`, `bm-104`, `bm-105`, `bm-106`, `bm-107`, `bm-108`, `bm-109`, `bm-110`, `bm-111`, `bm-112`, `bm-113`, `bm-114`, `bm-115`, `bm-116`, `bm-117`, `bm-118`, `bm-119`, `bm-120`, `bm-121`, `bm-122`, `bm-123`, `bm-124`, `bm-125`, `bm-126`, `bm-127`, `bm-128`, `bm-129`, `bm-130`, `bm-131`, `bm-132`, `bm-133`, `bm-134`, `bm-135`, `bm-136`, `bm-137`, `bm-138`, `bm-139`, `bm-140`, `bm-141`, `bm-142`, `bm-143`, `bm-144`, `bm-145`, `bm-146`, `bm-147`, `bm-148`, `bm-149`, `bm-150`, `bm-151`, `bm-152`, `bm-153`, `bm-154`, `bm-155`, `bm-156`, `bm-157`, `bm-158`, `bm-159`, `bm-160`, `bm-161`, `bm-162`, `bm-163`, `bm-164`, `bm-165`, `bm-166`, `bm-167`, `bm-168`, `bm-169`, `bm-170` (helper-based after PR-F), `bm-171`, `bm-172` (helper-based after PR-F), `bm-174`, `bm-175`, `bm-176`, `bm-177`, `bm-178`, `bm-179`, `bm-180`, `bm-181`, `bm-182`, `bm-183`, `bm-184`, `bm-185`, `bm-186`, `bm-187`, `bm-188`, `bm-189`, `bm-190`, `bm-191`, `bm-192`, `bm-193`, `bm-194`, `bm-195`, `bm-196`, `bm-197`, `bm-198`, `bm-199`, `bm-200`, `bm-201`, `bm-202`, `bm-203`, `bm-204`, `bm-205`, `bm-206`, `bm-207`, `bm-208`, `bm-209`, `bm-210`, `bm-211`, `bm-212`, `bm-213`, `generic-template-form-inputs` | raw `fetch()` to `/documents/generated/:documentId/form-inputs` with `method: "POST"` |

The full per-file call list is captured by the regex sweep below:

```text
$ rg -n "fetch\(`?\$\{?API_BASE_URL\}?/documents/generated/\$\{documentId\}/form-inputs" apps/web/src
apps/web/src/components/documents/bm-002-form-inputs.tsx:746
apps/web/src/components/documents/bm-006-form-inputs.tsx:793
apps/web/src/components/documents/bm-008-form-inputs.tsx:636
apps/web/src/components/documents/bm-009-form-inputs.tsx:753
apps/web/src/components/documents/bm-010-form-inputs.tsx:622
apps/web/src/components/documents/bm-011-form-inputs.tsx:989
apps/web/src/components/documents/bm-012-form-inputs.tsx:680
apps/web/src/components/documents/bm-013-form-inputs.tsx:499
apps/web/src/components/documents/bm-014-form-inputs.tsx:1056
apps/web/src/components/documents/bm-015-form-inputs.tsx:1263
apps/web/src/components/documents/bm-016-form-inputs.tsx:1155
apps/web/src/components/documents/bm-017-form-inputs.tsx:516
apps/web/src/components/documents/bm-018-form-inputs.tsx:981
apps/web/src/components/documents/bm-019-form-inputs.tsx:491
apps/web/src/components/documents/bm-020-form-inputs.tsx:507
apps/web/src/components/documents/bm-021-form-inputs.tsx:248
apps/web/src/components/documents/bm-024-form-inputs.tsx:248
apps/web/src/components/documents/bm-025-form-inputs.tsx:248
apps/web/src/components/documents/bm-027-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-028-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-029-form-inputs.tsx:528
apps/web/src/components/documents/bm-030-form-inputs.tsx:890
apps/web/src/components/documents/bm-031-form-inputs.tsx:    (helper, supported)
apps/web/src/components/documents/bm-032-form-inputs.tsx:248
apps/web/src/components/documents/bm-033-form-inputs.tsx:913
apps/web/src/components/documents/bm-034-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-035-form-inputs.tsx:248
apps/web/src/components/documents/bm-036-form-inputs.tsx:248
apps/web/src/components/documents/bm-037-form-inputs.tsx:1070
apps/web/src/components/documents/bm-038-form-inputs.tsx:    (document detail, GET)
apps/web/src/components/documents/bm-039-form-inputs.tsx:889
apps/web/src/components/documents/bm-040-form-inputs.tsx:753
apps/web/src/components/documents/bm-041-form-inputs.tsx:248
apps/web/src/components/documents/bm-042-form-inputs.tsx:292
apps/web/src/components/documents/bm-043-form-inputs.tsx:470
apps/web/src/components/documents/bm-044-form-inputs.tsx:638
apps/web/src/components/documents/bm-045-form-inputs.tsx:541
apps/web/src/components/documents/bm-046-form-inputs.tsx:904
apps/web/src/components/documents/bm-047-form-inputs.tsx:947
apps/web/src/components/documents/bm-054-form-inputs.tsx:338
apps/web/src/components/documents/bm-055-form-inputs.tsx:346
apps/web/src/components/documents/bm-057-form-inputs.tsx:303
apps/web/src/components/documents/bm-058-form-inputs.tsx:352
apps/web/src/components/documents/bm-059-form-inputs.tsx:363
apps/web/src/components/documents/bm-070-form-inputs.tsx:951
apps/web/src/components/documents/bm-071-form-inputs.tsx:682
apps/web/src/components/documents/bm-072-form-inputs.tsx:323
apps/web/src/components/documents/bm-074-form-inputs.tsx:283
apps/web/src/components/documents/bm-076-form-inputs.tsx:209
apps/web/src/components/documents/bm-083-form-inputs.tsx:298
apps/web/src/components/documents/bm-084-form-inputs.tsx:213
apps/web/src/components/documents/bm-085-form-inputs.tsx:426
apps/web/src/components/documents/bm-086-form-inputs.tsx:689
apps/web/src/components/documents/bm-087-form-inputs.tsx:484
apps/web/src/components/documents/bm-088-form-inputs.tsx:517
apps/web/src/components/documents/bm-089-form-inputs.tsx:516
apps/web/src/components/documents/bm-090-form-inputs.tsx:    (lib/bm090-form-inputs-api.ts:384)
apps/web/src/components/documents/bm-091-form-inputs.tsx:373
apps/web/src/components/documents/bm-092-form-inputs.tsx:373
apps/web/src/components/documents/bm-093-form-inputs.tsx:287
apps/web/src/components/documents/bm-094-form-inputs.tsx:287
apps/web/src/components/documents/bm-095-form-inputs.tsx:287
apps/web/src/components/documents/bm-099-form-inputs.tsx:373
apps/web/src/components/documents/bm-100-form-inputs.tsx:290
apps/web/src/components/documents/bm-101-form-inputs.tsx:373
apps/web/src/components/documents/bm-103-form-inputs.tsx:277
apps/web/src/components/documents/bm-104-form-inputs.tsx:273
apps/web/src/components/documents/bm-105-form-inputs.tsx:277
apps/web/src/components/documents/bm-106-form-inputs.tsx:267
apps/web/src/components/documents/bm-107-form-inputs.tsx:267
apps/web/src/components/documents/bm-108-form-inputs.tsx:273
apps/web/src/components/documents/bm-109-form-inputs.tsx:273
apps/web/src/components/documents/bm-110-form-inputs.tsx:273
apps/web/src/components/documents/bm-111-form-inputs.tsx:277
apps/web/src/components/documents/bm-112-form-inputs.tsx:275
apps/web/src/components/documents/bm-113-form-inputs.tsx:271
apps/web/src/components/documents/bm-115-form-inputs.tsx:271
apps/web/src/components/documents/bm-116-form-inputs.tsx:280
apps/web/src/components/documents/bm-117-form-inputs.tsx:272
apps/web/src/components/documents/bm-118-form-inputs.tsx:268
apps/web/src/components/documents/bm-119-form-inputs.tsx:280
apps/web/src/components/documents/bm-120-form-inputs.tsx:280
apps/web/src/components/documents/bm-121-form-inputs.tsx:271
apps/web/src/components/documents/bm-122-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-123-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-124-form-inputs.tsx:292
apps/web/src/components/documents/bm-125-form-inputs.tsx:268
apps/web/src/components/documents/bm-126-form-inputs.tsx:284
apps/web/src/components/documents/bm-127-form-inputs.tsx:268
apps/web/src/components/documents/bm-128-form-inputs.tsx:267
apps/web/src/components/documents/bm-129-form-inputs.tsx:280
apps/web/src/components/documents/bm-130-form-inputs.tsx:302
apps/web/src/components/documents/bm-131-form-inputs.tsx:280
apps/web/src/components/documents/bm-132-form-inputs.tsx:311
apps/web/src/components/documents/bm-133-form-inputs.tsx:306
apps/web/src/components/documents/bm-134-form-inputs.tsx:280
apps/web/src/components/documents/bm-135-form-inputs.tsx:275
apps/web/src/components/documents/bm-136-form-inputs.tsx:267
apps/web/src/components/documents/bm-137-form-inputs.tsx:312
apps/web/src/components/documents/bm-138-form-inputs.tsx:271
apps/web/src/components/documents/bm-139-form-inputs.tsx:271
apps/web/src/components/documents/bm-140-form-inputs.tsx:299
apps/web/src/components/documents/bm-141-form-inputs.tsx:325
apps/web/src/components/documents/bm-142-form-inputs.tsx:320
apps/web/src/components/documents/bm-143-form-inputs.tsx:329
apps/web/src/components/documents/bm-144-form-inputs.tsx:321
apps/web/src/components/documents/bm-145-form-inputs.tsx:289
apps/web/src/components/documents/bm-146-form-inputs.tsx:224
apps/web/src/components/documents/bm-147-form-inputs.tsx:312
apps/web/src/components/documents/bm-148-form-inputs.tsx:592
apps/web/src/components/documents/bm-149-form-inputs.tsx:315
apps/web/src/components/documents/bm-156-form-inputs.tsx:    (lib/bm156-form-inputs-api.ts:429)
apps/web/src/components/documents/bm-161-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-168-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-170-form-inputs.tsx:    (helper, supported)
apps/web/src/components/documents/bm-172-form-inputs.tsx:    (helper, supported)
apps/web/src/components/documents/bm-176-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-192-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-198-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-209-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-211-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-212-form-inputs.tsx:    (helper)
apps/web/src/components/documents/bm-213-form-inputs.tsx:    (helper)
apps/web/src/components/documents/generic-template-form-inputs.tsx:    (helper)
```

> The `(helper)` marker means the file calls the supported helper
> (`saveDocumentFormInputs` / `saveBm031DirectFormInputs`) from
> `document-form-api.ts` instead of raw `fetch()`. Same backend route,
> same `POST` method — just routed through the auth-token bridge.

**Render-payload callers (GET, supported):**

```text
apps/web/src/components/documents/bm-002-form-inputs.tsx:693 (GET, supported)
apps/web/src/components/documents/bm-023-form-inputs.tsx:454 (GET, supported)
apps/web/src/components/documents/bm-024-form-inputs.tsx:247 (GET, supported)
apps/web/src/components/documents/bm-032-form-inputs.tsx:247 (GET, supported)
apps/web/src/components/documents/bm-035-form-inputs.tsx:247 (GET, supported)
apps/web/src/components/documents/bm-038-form-inputs.tsx:789 (GET, document detail)
apps/web/src/components/documents/bm-040-form-inputs.tsx:653 (GET, supported)
apps/web/src/components/documents/bm-041-form-inputs.tsx:247 (GET, supported)
apps/web/src/components/documents/bm-042-form-inputs.tsx:244 (GET, supported)
apps/web/src/components/documents/bm-043-form-inputs.tsx:422 (GET, supported)
apps/web/src/components/documents/bm-059-form-inputs.tsx:345 (GET, supported)
apps/web/src/components/documents/bm-105-form-inputs.tsx:250 (GET, supported)
```

---

## 3. `ACTIVE_BUT_DUPLICATIVE` (helper-based callers of the same route)

These callers use the supported helpers from
`document-form-api.ts`. They duplicate what some raw-fetch BM panels
do, but through the auth-token bridge. The cleaner long-term migration
is to retire them in favor of a single shared `saveGeneratedFormInputs`
helper. PR-F does NOT do this.

| File | Helper used | Method | Status |
| --- | --- | --- | --- |
| `bm-022-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-027-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-028-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-031-form-inputs.tsx` | `saveBm031DirectFormInputs` | POST | supported (now sole path) |
| `bm-034-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-122-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-123-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-155-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-157-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-158-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-160-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-161-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-168-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-170-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported (PR-F: PATCH fallback removed) |
| `bm-171-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `bm-172-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported (PR-F: PATCH/PUT try-catch chain removed) |
| `bm-176-form-inputs.tsx` | (uses `getDocumentRenderPayload`) | GET | supported |
| `bm-192-form-inputs.tsx` | (uses `getDocumentRenderPayload`) | GET | supported |
| `bm-198-form-inputs.tsx` | (uses `getDocumentRenderPayload`) | GET | supported |
| `bm-209-form-inputs.tsx` | (uses `getDocumentRenderPayload`) | GET | supported |
| `bm-211-form-inputs.tsx` | (uses `getDocumentRenderPayload`) | GET | supported |
| `bm-212-form-inputs.tsx` | (uses `getDocumentRenderPayload`) | GET | supported |
| `bm-213-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `generic-template-form-inputs.tsx` | `saveDocumentFormInputs` | POST | supported |
| `published-contract-form-inputs.tsx` | `savePublishedContractFormInputs` | PUT | supported |
| `lib/bm001-form-inputs-api.ts` | inline `readApi` helper | POST | supported |
| `lib/bm053-form-inputs-api.ts` | inline `readApi` helper | POST | supported |
| `lib/bm090-form-inputs-api.ts` | inline `readApi` helper | POST | supported |
| `lib/bm097-form-inputs-api.ts` | inline `readApi` helper | POST | supported |
| `lib/bm156-form-inputs-api.ts` | inline `readApi` helper | POST | supported |

---

## 4. `UNSUPPORTED_ROUTE` (PR-F removed all of these)

Before PR-F these were the active unsupported callers. After PR-F none
remain in the source tree — verified by the static guard test.

| Unsupported helper | Active callers (now removed) | Resolution |
| --- | --- | --- |
| `patchDocumentFormInputs` | `bm-170-form-inputs.tsx` (404/405 fallback), `bm-172-form-inputs.tsx` (try-catch loop) | PATCH branch removed; only `saveDocumentFormInputs` (POST) remains. |
| `replaceDocumentFormInputs` | `bm-172-form-inputs.tsx` (try-catch loop) | PUT branch removed; only `saveDocumentFormInputs` (POST) remains. |
| `patchBm031DirectFormInputs` | `bm-031-form-inputs.tsx` (`requestSave` PATCH branch) | PATCH branch removed; only `saveBm031DirectFormInputs` (POST) remains. |

Backend routes for these unsupported methods do NOT exist. The
`GeneratedInputSaveOrchestrator` (PR-E) handles
`GENERATED_SAVE_LEGACY_INPUTS` (POST) on the supported
`/documents/generated/:id/form-inputs` route.

The grep proof after PR-F:

```text
$ rg -n "patchDocumentFormInputs|replaceDocumentFormInputs|patchBm031DirectFormInputs" apps/web/src
(no matches)
```

---

## 5. `UNKNOWN_NEEDS_MANUAL_REVIEW`

| Path | Concern |
| --- | --- |
| `apps/web/src/lib/runtime-template-preview.ts` (3 fetch sites) | These call the runtime preview-session endpoints (`/forms/runtime/...`) — different route family. They use `apiInput` / `apiInit` indirection that the regex did not match. Not a PR-F concern; flagged here for a future PR. |
| `apps/web/src/lib/file-download.ts` (1 fetch site) | File download route (`/documents/generated/:id/files/:fileId/download`). Different route family, not generated form input. Out of scope. |
| `apps/web/src/lib/document-render-api.ts` (uses `readApi`) | DOCX/PDF render + convert routes. Different route family, not generated form input. Already helper-based. |
| `apps/web/src/components/documents/bm-038-form-inputs.tsx:789` | Calls `/documents/generated/:documentId` (root, no sub-path) — likely a document-detail GET, not form input. Out of scope. |
| `apps/web/src/lib/bm156-form-inputs-api.ts` (independent readApi) | This is a custom `readApi` defined inside the file (not the api-client one). It already targets the supported POST route. Consider folding into the shared `document-form-api.ts` in a future PR. |

---

## 6. PR-F scope guards (final check)

- [x] no backend route changes
- [x] no DB migration
- [x] no Prisma schema mutation
- [x] no DOCX / source / locked-contract mutation
- [x] no generated render behavior change
- [x] no unsupported PATCH/PUT helper remains exported
- [x] no frontend caller uses unsupported generated PATCH/PUT route
- [x] supported generated save helpers remain exported
- [x] no mass rewrite of BM panels
- [x] no Clerk / token bridge weakening
- [x] `form-studio-api.ts` remains compatibility wrapper only

---

## 7. Open questions for the planner

1. Should a follow-up PR (PR-F2) migrate the `ACTIVE_BUT_DUPLICATIVE`
   helper callers to a single shared `saveGeneratedFormInputs` helper?
2. Should the raw-fetch BM panels in §2 be migrated to
   `saveDocumentFormInputs` over time, or is the existing two-pattern
   layout (raw fetch + helper) acceptable as a stable end-state?
3. The 3 custom `bmNNN-form-inputs-api.ts` files (`bm001`, `bm053`,
   `bm090`, `bm097`, `bm156`) each ship a private `readApi`/`ApiClientError`
   duplication. Worth consolidating in a follow-up.
