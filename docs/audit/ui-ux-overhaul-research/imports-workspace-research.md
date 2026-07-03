# `/imports` Workspace Research — shadcn/ui Migration Map

> PR #12 of the shadcn convergence stack. Research-only.
> No `/imports` implementation code changed.
> The companion source guard `apps/web/src/app/imports/imports-workspace-contract.test.ts`
> was added to freeze behavior; it is read-only and exercises no runtime, file
> upload, or destructive import path.

This document maps the `/imports` route enough that a future implementation
PR can replace raw controls with shadcn primitives without breaking file
upload, CSV parsing, import preview, confirmation payload, status/history
flows, or any existing API behavior.

---

## 1. Stacking note

This PR was authored on top of PR #1 — PR #11 plus the light-surface hotfix
and QA, with **no checkout, no reset, no stash**. The current dirty tree
is preserved.

---

## 2. Scope and hard constraints

Research-only. Implementation changes are out of scope by mandate. The
non-goals repeat here verbatim:

- No edits to `/imports` behavior
- No control migration in this PR
- No API call surface changes
- No request payload changes
- No import confirmation logic changes
- No file parsing/upload logic changes
- No drag/drop behavior changes
- No history loading changes
- No auth/RBAC changes
- No DB/schema changes
- No DOCX/biểu-mẫu touching
- No dependency additions
- Form Studio remains explicitly deferred

The behavior preservation rule is the dominant constraint: future shadcn
replacement must be pixel-equivalent and state-equivalent for every
flow below.

---

## 3. Phase 1 — Static architecture map

### 3.1 Route file map

| Path | Role |
| ---- | ---- |
| `apps/web/src/app/imports/page.tsx` | Thin server-component entry that delegates to `ImportWorkspace`. 5 lines. |
| `apps/web/src/components/imports/import-workspace.tsx` | The single, 1068-line `"use client"` component that owns every stateful surface: dropzone, upload, parse preview, target chooser, confirm, history. |

There are **no co-located tests** for the imports workspace today (the
guard added by this PR is the first).

### 3.2 Component map (inside `import-workspace.tsx`)

| Symbol | Purpose |
| ------ | ------- |
| `ImportWorkspace` | Root component, owns 22 `useState` slots + 3 `useEffect` + 1 `useTransition`. |
| `SectionCard` | Local, presentational card used three times (import / preview / place-to-save / history). 28-line wrapper, *not* the shadcn `Card`. |
| `StatusPill` | Local pill that maps `statusTone(status)` to raw `bg-*-100 text-*-700` classes. Used for batch status and per-file `parseStatus`. |
| `PreviewTable` | Local raw `<table>` renderer for `parsedJson.tables[]`. Each sheet becomes one inline table. |

### 3.3 Helper / API map (`apps/web/src/lib/imports-api.ts`)

| Function | Endpoint / behavior | Notes |
| -------- | ------------------- | ----- |
| `uploadImportFiles(files, { onProgress })` | `POST {API_BASE_URL}/import/upload`, FormData `files`, **uses raw `XMLHttpRequest`** to expose `xhr.upload.onprogress`. Returns `ImportBatchDetail`. | This is the **only** API helper that hand-rolls `XHR` because of progress reporting. Do not switch to `fetch` during migration. |
| `getImportBatch(batchId)` | `GET /import/batches/{batchId}` | Re-hydrates a batch from history. |
| `getImportHistory(page=1, pageSize=12)` | `GET /import/history?page=&pageSize=` | Pagination exists; UI only requests page 1, size 12. |
| `confirmImportBatch(batchId, payload)` | `POST /import/batches/{batchId}/confirm` body=JSON. | Constructs persisted case / template-source. |
| `searchCases(query)` | `GET /cases?q=&page=1&pageSize=8` | Debounced in component (300 ms). |
| `getImportFileDownloadUrl(fileId)` | Returns `${API_BASE_URL}/import/files/{fileId}/download`. | Used as an `<a href>` for original-file download; supports cookie credentials. |

Re-exported from `imports-api.ts`: `extractApiError`, `isJsonObject`,
`unwrapApiData`, `buildUrl`, `normalizeDate`, and `readApi` (which
forces `noStore: true` to bypass the Next fetch cache for import flows).

### 3.4 State ownership map

Local component state only — there is no Redux, Zustand, or React Query
involvement.

| State | Type | Used by |
| ----- | ---- | ------- |
| `selectedFiles` | `File[]` | dropzone, upload button |
| `dragging` | `boolean` | dropzone visual |
| `uploading` / `uploadProgress` / `uploadError` | upload lifecycle | dropzone side card |
| `currentBatch` | `ImportBatchDetail \| null` | preview + confirm panel |
| `selectedFileId` | derived per-file preview selection | preview pane |
| `targetType` | `ImportTargetType` | place-to-save radio group |
| `selectedExistingCaseId`, `existingCaseQuery`, `caseOptions`, `caseSearchError`, `caseSearchLoading` | `EXISTING_CASE` target sub-flow |
| `newCaseForm` (`caseCode`, `caseTitle`, `relatedPersonName`, `offenseName`, `createdDate`) | `NEW_CASE` target sub-flow |
| `note` | free text | confirm payload |
| `confirmError`, `confirming` | confirm lifecycle |
| `history`, `historyError`, `historyLoading` | history grid |
| `loadingBatchId` | per-batch click loading |

`useTransition` wraps the history load to keep state updates non-blocking.

### 3.5 Data flow map

```
[User drop / file picker]
   → handleChosenFiles (state) (slice ≤ 20)
   → handleUpload → uploadImportFiles (XHR + onProgress)
       → setCurrentBatch(batch)  setSelectedFiles([])
       → reloadHistory()
   → preview side renders PreviewTable(parsedJson)
   → targetOptions radio or NEW_CASE form or EXISTING_CASE search
   → handleConfirmImport → confirmImportBatch(payload)
       → setCurrentBatch(updated)   reloadHistory()
[History card click] → handleOpenHistoryBatch → getImportBatch
[Download file] → <a href={getImportFileDownloadUrl(fileId)}>
```

---

## 4. Phase 2 — Behavior map

### 4.1 File selection / dropzone

| Concern | Current behavior |
| ------- | ---------------- |
| Accepted types | `.pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.tif,.tiff` (set on the hidden `<input type="file" multiple>`). |
| Drag enter/leave | `onDragOver` calls `preventDefault()` and sets `dragging=true`. `onDragLeave` sets `dragging=false`. |
| Drop | `onDrop` calls `preventDefault()`, resets drag state, then `handleChosenFiles(event.dataTransfer.files)`. |
| File input | Inside a `<label>` wrapping a hidden `<input type="file" multiple>`. Selecting via the picker calls the same `handleChosenFiles`. |
| Validation | No client-side validation besides the native `accept` filter. If `fileList` is empty, the handler early-returns; if upload is triggered with no files, `setUploadError(...)` shows a Vietnamese error. |
| Selected file state | `selectedFiles: File[]`. Sliced to first 20 by `Array.from(fileList).slice(0, 20)`. |
| Reset/clear | After successful upload, `setSelectedFiles([])` clears local state. The `accept` attribute must be preserved verbatim. |
| Visual hint | `bg-primary` upload CTA is the only `bg-primary` in this route and **is a valid primary CTA use** (not a surface). Drag-active styling is `border-blue-500 bg-blue-50`. |

The label-as-button + hidden-input pattern is the only "fake button" in
the workspace and must remain accessible during migration. A future PR
should swap it to `Button asChild` via shadcn's `Slot`, not to a raw
click handler.

### 4.2 Parse / preview flow

| Concern | Current behavior |
| ------- | ---------------- |
| Trigger | Parsing is server-side: the upload response already carries `files[].parsedJson` and `files[].previewText`. There is no client-side CSV parser call. |
| Row state | Lives in `ImportBatchDetail.files[].parsedJson` (union: `text | json | table | image | binary`). |
| Column mapping | `parsedJson.tables[].candidateColumns[]` carries `{ id, columnName, mappedField, confidence }`. Rendered as small confidence pills with `confidenceTone("cao"|"vừa"|"thấp")`. |
| Validation warnings | `file.warnings: string[]`, `file.errorMessage?: string`. Rendered inside an amber card or as a fallback when `previewText` is empty. |
| Preview table | `PreviewTable` renders raw `<table>` per sheet; first row is headers, rows iterate `row[header]`. Empty cells show "Trống". |
| Row counts | `table.totalRows` is shown as "N dòng" in the sheet sub-header. |
| Error states | If `parsedJson.kind !== "table"` the renderer `return null` (only tables are previewed). Non-table JSON is rendered as `<pre>` of `parsedJson.preview`. |

### 4.3 Confirm / import flow

| Concern | Current behavior |
| ------- | ---------------- |
| Confirm button | Native `<button>` styled with `bg-emerald-600`. Disabled when `!canConfirm \|\| confirming`. Text toggles to "Đang lưu...". |
| Payload shape | `ConfirmImportPayload = { targetType, note?, existingCaseId?, newCase?, createdByName? }`. `newCase` only present for `NEW_CASE` and only sends trimmed non-empty optional fields. |
| Endpoint | `confirmImportBatch(batchId, payload)` → `POST /import/batches/{batchId}/confirm`. |
| Loading/disabled | `confirming` flag drives both the button label swap and disables the button (and the `Link` to cases stays clickable). |
| Success | Response replaces `currentBatch` and re-runs `loadHistory`. `batch.target` then renders the green "Import thành công" callout. |
| Failure | `setConfirmError(message)` renders a rose `bg-rose-50` callout. |
| Retry | The handler is idempotent in UI: re-click submits again if `canConfirm` is still true and `currentBatch.status !== "CONFIRMED"`. |

### 4.4 Import history

| Concern | Current behavior |
| ------- | ---------------- |
| Endpoint | `getImportHistory(1, 12)`. |
| Loading | `historyLoading` toggled. Page 1 / size 12 only; no pagination controls in UI today. |
| Empty state | Inline card with dashed border + "Chưa có lịch sử import nào." |
| Status mapping | Local `StatusPill` uses `statusTone(status)`. |
| Structure | Responsive card grid (`md:grid-cols-2 xl:grid-cols-3`). Each card is a `<button>` that calls `handleOpenHistoryBatch(batchId)` and uses a separate `loadingBatchId` to gray it out. |
| Pagination UI | None rendered. `total / totalPages` come back from the API but are unused. |

### 4.5 Status / warnings

Status enum currently covered by `statusLabelMap`:

```
UPLOADED, PARSED, PARTIAL, FAILED, CONFIRMED, STORED_ONLY,
PARSED_WITH_WARNINGS, REJECTED
```

Local `statusTone` maps to raw `bg-{rose|amber|emerald|blue}-100 text-{...}-700`.
Confidence tones use `bg-emerald-100 / bg-amber-100 / bg-slate-100`.

The existing `components/common/status-badge.tsx` does **not** include an
import-specific set. A future PR must extend `StatusBadge` with a new
`type: "import"` config (or a parallel `importStatusConfig`) before
swapping the pill, to keep the variant palette centralized.

### 4.6 Auth / routing

- No Clerk `auth()` guard is present in the route file itself. The route
  inherits whatever auth contract `app/(...)/imports` already enforces.
- All helpers go through `readApi`/`XHR` with `withCredentials = true`
  on upload (cookie-based session, no token in payload).
- No redirect, no `unauthorized.tsx`, no denial state. Errors propagate
  into `uploadError` / `confirmError` / `historyError` strings.
- No `qlv_session` references inside the imports workspace.
- Web E2E must use Clerk ticket strategy (consistent with the rest of
  the codebase). The smoke script already authenticates as admin via
  `playwright/.clerk/admin.json`; adding `/imports` to it requires a
  seeded import history row or the empty-state branch.

---

## 5. Phase 3 — UI debt inventory

Captured from ripgrep on `apps/web/src/app/imports` and
`apps/web/src/components/imports`:

| Pattern | Count / Location | Risk | Future primitive |
| ------- | ---------------- | ---- | ---------------- |
| Raw `<input>` (text/date) | 7 inputs: dropzone file input (hidden), `existingCaseQuery` search, `caseCode`, `createdDate`, `caseTitle`, `relatedPersonName`, `offenseName` (workspace.tsx L507–924) | LOW — visual only | `Input` from `components/ui/input.tsx` |
| Raw `<textarea>` | 1: notes field (L924) | LOW | `Textarea` from `components/ui/textarea` |
| Raw `<button>` | 6: dropzone "Chọn file" trigger (label), "Tải lên", per-file row (preview list), "Xác nhận import", history reload, history grid card (workspace.tsx L600–1019) | LOW → MEDIUM (dropzone wrapper file input) | `Button` with `asChild={Slot}` for the dropzone label, otherwise `Button` direct |
| Raw `<table>` in `PreviewTable` | 1 table renderer for parsed CSV/XLSX (workspace.tsx L202) | MEDIUM — column mapping + confidence pills are tied to rendered structure | `Table` primitive, but only after a contract test asserts the `{ sheetName, totalRows, headers, rows }` shape |
| Raw `<svg>` | 1: upload-cloud icon in dropzone (workspace.tsx L484) | LOW | Lucide `UploadCloud` (or analogous) — purely visual |
| Raw radio inputs | 1 radio group for target chooser (workspace.tsx L785) | MEDIUM — controlled by `targetType` state, has 4 options | `RadioGroup` from `components/ui/radio-group` |
| Custom `StatusPill` | 1 + multiple call sites (workspace.tsx L151, L579, L620, L1034) | MEDIUM | `StatusBadge` with new `import` type |
| Custom `SectionCard` | 4 occurrences wrapping dropzone / preview / place-to-save / history | LOW | `PageSection` (low risk as long as `card` flag matches) wrapped in `PageShell` |
| Hardcoded tone classes | 6 sites in `confidenceTone` and `statusTone` (workspace.tsx L96–117) | LOW (logic only) | Move the maps to `status-badge.tsx` |
| `bg-primary` | 1: dropzone "Chọn file" CTA (workspace.tsx L505) | NONE — correct primary CTA usage | Keep; ensure `Button default` variant keeps semantic when migrated |
| `bg-black`, `bg-zinc-950`, `bg-slate-950/900` | None on import surface | NONE | — |
| Dark-mode primary-as-surface | None present | NONE | — |
| Missing PageShell / PageHeader / PageSection | Yes — workspace does not use them | LOW | Introduce in PR A |
| Custom loading state | 1 inline "Đang tải lịch sử import..." card | LOW | `LoadingState variant="list"` |
| Custom error banners | 3 inline rose cards (upload, confirm, history) | LOW | `ErrorBanner` once helpers are mapped |
| Custom empty states | 2 inline dashed-card placeholders (preview + history) | LOW | `EmptyState` |

The existing `globals.css` already enforces
`html { color-scheme: light; }`, so the route is already protected from
`prefers-color-scheme: dark`. No dark-surface risk in the route.

### 5.1 Visual smoke readiness

`scripts/audit/ui-light-surface-smoke.mjs` does **not** include
`/imports`. Empty-state visits would be safe; full-flow visits would
require seeded history rows. Recommended to defer route inclusion until
PR D or PR E once the empty/loading/error branches are confirmed safe.

---

## 6. Phase 4 — Risk classification

| Target | Risk | Why | Recommended phase |
| ------ | ---- | --- | ----------------- |
| `PageShell` + `PageHeader` wrapper at `/imports` | LOW | Pure layout shell; no state change. | PR A |
| Replace 3 inline rose error cards with `ErrorBanner` | LOW | `ErrorBanner` accepts `error: unknown`. The strings we pass are plain `string`. | PR A |
| Replace inline loading card with `LoadingState variant="list"` | LOW | Visual only. | PR A |
| Replace inline empty cards with `EmptyState` | LOW | Visual only. | PR A |
| Replace `bg-*-100 text-*-700` confidence pills | LOW | Cosmetic. | PR B |
| Replace custom `StatusPill` with `StatusBadge` (after adding `"import"` type) | MEDIUM | Status enum must be added to `status-badge.tsx` first to avoid drift; touches 4 call sites. | PR B |
| Replace `<table>` history grid with `Table` | MEDIUM | The history surface is actually a card grid today, not a table. Re-shaping requires UX choice between grid and table; should not be auto-changed. | PR B (defer if UX unclear) |
| Migrate dropzone visual shell (label-as-button + hidden input + drag/drop card) | MEDIUM | The label wraps the input. Future PR must use `Button asChild` with the input as a Sibling child via `<label>` merge or move the input outside and use `htmlFor`. Must preserve `accept` attribute and `multiple`. | PR D |
| Migrate upload `Button` | MEDIUM | Button uses raw `bg-blue-600`; shadcn `Button` defaults to `bg-primary`. Keeping semantic=primary for upload is correct, but the `min-h-11` style should be preserved via `size="lg"` or className override. | PR D |
| Migrate confirm `Button` (currently `bg-emerald-600`) | MEDIUM | This is destructive-success only for UX; should map to a confirm variant or stay primary `default`. No semantic data loss. | PR D |
| Migrate target-chooser radio group | MEDIUM | Controlled via `targetType`; options carry nested `description`. `<RadioGroup>` with `<Label>` + children preserves behavior, but layout of the option cards must be preserved. | PR D |
| Convert `ParsedJson.preview <pre>` blocks | LOW | Visual only. | PR C |
| Convert `<svg>` upload icon | LOW | Trivial swap. | PR D |
| Convert `PreviewTable` raw `<table>` to shadcn `Table` | MEDIUM | Data shape is `parsedJson.tables[]`; user-visible columns count and zebra striping must survive. | PR C |
| Migrate 6 `<input>` (search / new-case form) to shadcn `Input` | LOW | Most styling survives `cn()` injection. Date input stays as `<Input type="date">`. | PR D |
| Migrate notes `<textarea>` to shadcn `Textarea` | LOW | Visual only. | PR D |
| Migrate per-file selection `<button>` (preview file list) | LOW | Visual only. | PR D |
| Migrate history grid card `<button>` | LOW | Visual only. | PR D |
| Migrate any payload-producing behavior (upload XHR, confirm POST, history GET) | HIGH — DO NOT migrate | Must remain untouched. Out of all future PRs, only the visual shells change; helpers stay frozen via source guard. | Not in scope |
| Migrate `useState` flow / `useTransition` / `useMemo` derivations | HIGH — DO NOT migrate | Behavior must stay identical. Source guard will freeze key state names and helper signatures. | Not in scope |
| Drag/drop handlers | HIGH — DO NOT migrate | Must remain `onDragOver / onDragLeave / onDrop` exactly. Visual wrapper may move but handler bodies freeze. | Source guard pins only the **string** `setDragging(false)` and `handleChosenFiles(event.dataTransfer.files)` patterns — no, even that is not asserted; the contract test guards the helpers, not the handlers. |
| File `accept` attribute | HIGH — DO NOT change | Source guard pins the literal `accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.tif,.tiff"`. | Source guard |
| `ConfirmImportPayload` key names (`targetType`, `existingCaseId`, `newCase.caseCode` etc.) | HIGH — DO NOT change | Source guard pins the literal keys via `ConfirmImportPayload` type usage. | Source guard |
| `getImportHistory(1, 12)` argument pattern | HIGH — DO NOT change | Source guard asserts the page/pageSize pattern is in the workspace. | Source guard |

---

## 7. Phase 5 — Recommended migration decomposition

Phasing respects behavior preservation and avoids mixing visual and
payload changes. Total scope is five small, reversible PRs.

### PR A — Imports shell + read-only state surfaces

**Scope**
- Wrap the page in `PageShell` + `PageHeader`.
- Promote the four local `SectionCard` instances to `PageSection card`.
- Replace the three inline rose error cards with `ErrorBanner`.
- Replace the inline "Đang tải lịch sử..." loading card with `LoadingState variant="list"`.
- Replace the two dashed empty cards with `EmptyState`.

**Out of scope**
- `SectionCard` removal is **not** required — leave the local helper in place but deprecate after PR D; other routes still use it.
- No drag/drop, no upload, no confirm changes.

**Files touched**
- `apps/web/src/app/imports/page.tsx` (PageShell composition).
- `apps/web/src/components/imports/import-workspace.tsx` (PageHeader/PageSection swap, banners, empty + loading).

### PR B — Imports history + status pills

**Scope**
- Add `import` status type to `components/common/status-badge.tsx` with full enum `{ UPLOADED, PARSED, PARTIAL, FAILED, CONFIRMED, STORED_ONLY, PARSED_WITH_WARNINGS, REJECTED }` and matching `variant` mapping.
- Move `statusLabelMap` and `statusTone` from the workspace into the badge or a sibling import-status config module.
- Swap the local `StatusPill` for `StatusBadge type="import"`.
- Decide: keep the history surface as the responsive card grid or migrate to `Table` after UX call.

**Out of scope**
- No drag/drop, no upload, no confirm changes.

**Files touched**
- `apps/web/src/components/common/status-badge.tsx`.
- `apps/web/src/components/imports/import-workspace.tsx`.

### PR C — Parsed preview table

**Scope**
- Migrate `PreviewTable`'s `<table>` to shadcn `Table` while preserving `{ sheetName, totalRows, headers, rows }` rendering, including the "Trống" empty-cell placeholder.
- Migrate the confidence pills (column mapping + candidate cards) to `Badge variant` mappings.
- Migrate the `parsedJson.preview` `<pre>` block to `Textarea readOnly` or keep raw `<pre>` depending on UX (acceptable either way).

**Out of scope**
- No change to `parsedJson` type or to the upload response contract.
- No change to `files[].parsedJson` access patterns.

**Files touched**
- `apps/web/src/components/imports/import-workspace.tsx`.

### PR D — Dropzone / button / input / radio visual cleanup

**Scope**
- Migrate the 6 native `<button>` call sites to `Button`, choosing `default` (upload, confirm), `outline` (history reload, file rows, history card), `success` (confirm) or as appropriate.
- Migrate the dropzone "Chọn file" label to `Button asChild` while keeping the hidden `<input>` and the `accept` attribute exactly. If moving to `htmlFor`, the input must keep the same id, type, multiple, accept, and `onChange={event => handleChosenFiles(event.target.files)}`.
- Migrate 6 text/date `<input>` to `Input` and the single `<textarea>` to `Textarea`.
- Migrate the target-chooser radio set to `RadioGroup` + `Label`.
- Replace the raw `<svg>` upload icon with a Lucide icon.

**Out of scope**
- Drag/drop handlers must remain unchanged.
- `handleChosenFiles` / `handleUpload` bodies remain unchanged.
- Payload fields remain unchanged.

**Files touched**
- `apps/web/src/components/imports/import-workspace.tsx` only.

### PR E — Source guards + visual smoke route expansion

**Scope**
- Promote `imports-workspace-contract.test.ts` from a small unit to a fully pinned contract.
- Add `/imports` to `scripts/audit/ui-light-surface-smoke.mjs` only after dev data / auth support is confirmed safe (empty branch or seeded fixture).

**Out of scope**
- No product code changes.
- No new dependencies.

**Files touched**
- `apps/web/src/app/imports/imports-workspace-contract.test.ts` (extension).
- `scripts/audit/ui-light-surface-smoke.mjs` (route list only, behind a seeded fixture).

### Form Studio deferral (explicit)

Form Studio is still governed by DOCX contract templates and locked
biểu-mẫu. Any import-side change that touches compiled form output is
explicitly **out of scope** for this PR and the recommended follow-ups.
PR #12 and the future PR A–E above must remain zero-touch on
`apps/web/src/components/form-studio/**` and on every
`apps/web/src/components/documents/bm-*.tsx` file.

---

## 8. Phase 6 — Source guard decision

**Decision: ADD a small read-only source guard.**

Location: `apps/web/src/app/imports/imports-workspace-contract.test.ts`.

The guard is read-only. It does not exercise the renderer; it only
inspects import API helper source, the workspace source, and verifies
that frozen strings (helper names, payload key names, accept attribute,
endpoint substrings, status enum) still exist. If a future implementation
PR accidentally removes `accept`, renames `existingCaseId`, or drops
`getImportHistory(1, 12)`, this guard catches it before runtime.

### 8.1 Allowed assertions (implemented)

- `uploadImportFiles`, `confirmImportBatch`, `getImportBatch`,
  `getImportHistory`, `searchCases`, `getImportFileDownloadUrl` are
  exported from `apps/web/src/lib/imports-api.ts`.
- Endpoint substrings:
  - `/import/upload`
  - `/import/batches/`
  - `/import/batches/.../confirm`
  - `/import/history?page=...&pageSize=...`
  - `/cases?q=`
  - `/import/files/.../download`
- `accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.tif,.tiff"` appears in `import-workspace.tsx`.
- Status enum values appear in `statusLabelMap`:
  `UPLOADED`, `PARSED`, `PARTIAL`, `FAILED`, `CONFIRMED`, `STORED_ONLY`,
  `PARSED_WITH_WARNINGS`, `REJECTED`.
- `ImportTargetType` literal strings appear:
  `RAW_REFERENCE`, `EXISTING_CASE`, `NEW_CASE`, `TEMPLATE_SOURCE`.
- `ConfirmImportPayload` field names appear in the workspace:
  `targetType`, `existingCaseId`, `newCase`, `caseCode`, `caseTitle`,
  `relatedPersonName`, `offenseName`, `createdDate`, `note`.
- Drag/drop handlers exist with the right names
  (`onDragOver`, `onDragLeave`, `onDrop`) on the dropzone wrapper.
- `radio` controls with `name="targetType"` are present.
- `XMLHttpRequest` is still used by `uploadImportFiles` (progress).
- `readApi` is invoked through `imports-api.ts` with `noStore: true`.

### 8.2 Disallowed assertions (explicitly avoided)

- No `toMatchSnapshot`.
- No renderer snapshot of the workspace tree.
- No real upload or destructive import.
- No DOM rendering (no `@testing-library/react`) — the test never
  exercises the React tree. This avoids accidentally forcing
  UI-shape assertions.
- No assertions against the visual primitives (`SectionCard`,
  `StatusPill`) — those will be migrated.

If a future PR concludes this guard is too low-value, the recommended
delete path is a single PR removing only the `.test.ts` file. Nothing
else loses coverage.

---

## 9. Phase 7 — Convergence plan update

See `docs/audit/ui-ux-overhaul-research/shadcn-convergence-plan.md`,
section **PR #12 Imports workspace research result** appended at the
end of the existing PR-result entries.

Highlights merged into the live plan:

- `/imports` is added to the route inventory as
  "researched, ready for phased migration".
- The proposed PR A–E ladder is recorded verbatim.
- Form Studio deferral is restated.
- The new source guard is named and pinned as a behavior-freeze layer.
- The light-surface smoke script gate is reaffirmed; route inclusion is
  deferred to PR E.

---

## 10. Phase 8 — Validation plan

The research-only validation gates are:

```bash
pnpm --filter web lint
pnpm --filter web exec tsc --noEmit
pnpm test:web-unit
pnpm test:e2e:auth
node scripts/audit/ui-light-surface-smoke.mjs
pnpm --filter web test -- --testPathPattern="imports-workspace-contract"
```

plus the source guard test itself.

No destructive import actions, no real production uploads, and no
test-results committed.

---

## 11. Open questions for ChatGPT (planner)

None blocking. Future PRs can pick any of these for further
investigation, but they are not required to start PR A:

1. Should the history surface remain a card grid or migrate to a
   compact `Table` after PR B?
2. Should the local `SectionCard` continue to exist after PR A, or be
   removed once all known importers migrate to `PageSection card`?
3. Should `getImportHistory(1, 12)` switch to `useTransition`-friendly
   pagination cursor, or keep the current fixed-window contract?
