# Phase 3.5 — Frontend Production Hardening

## Scope

This phase is **runtime correctness, accessibility, CI reliability, and
production safety** for `apps/web`. It is explicitly **not** a UX redesign.

Hard rules followed:

- No page redesigns
- No backend contract changes
- No new visual systems or animation frameworks
- No TanStack Table, Rive, or heavy new dependencies
- Form Studio layout left untouched (per Phase 3 contract)

---

## What was fixed

### 1. P0 — `readApi` double body-read bug

File: `apps/web/src/lib/api-client.ts`

The previous `readApi` called `response.text()` once for the JSON parse
branch, then a second time inside the `!response.ok` branch when building
the `ApiError`. A `Response` body stream can only be consumed once; the
second `text()` call would have thrown `TypeError: Body has already been
consumed` (or returned `""` in some engines), masking the real error.

New flow:

```ts
const text = await response.text();          // single read
let json: unknown = null;
if (text.trim().length > 0) {
  try { json = JSON.parse(text); } catch { json = text; }
}

if (!response.ok) {
  const errorBody = parseErrorBody(text);    // parses the same `text`
  throw new ApiError(response.status, errorBody);
}

return unwrapApiData<T>(json);
```

Why this matters in production:

- Network failures would surface as `TypeError("Body has already been
  consumed")` instead of the actual 4xx/5xx message — confusing for users
  and unhelpful for support (no `requestId` to trace).
- The `ApiError` constructed in the failing branch was effectively
  half-broken (could not carry `requestId`/`code`), so the structured
  error UI in `ErrorBanner` would always render without the trace fields.

### 2. Unit tests for `api-client` error parsing

New file: `apps/web/src/lib/api-client.test.ts`

Picks up by `pnpm test:web-unit` (which uses `tsx --test`). Covers:

- 422 with structured body → `ApiError.status`/`code`/`requestId`/`message`
  all preserved.
- 500 with empty body → `ApiError(500, null)` with HTTP-status fallback.
- 502 with non-JSON body → `ApiError(502, null)` with HTTP-status fallback.
- `readApi` never reads the response body twice on failure (the body
  throws if read twice; the test asserts the throwing read does not
  happen).
- `{ data: ... }`, `{ result: ... }`, and raw JSON success payloads are
  unwrapped correctly.
- Raw string body is returned as-is when not JSON.
- `ApiError.get code` / `requestId` return `null` when body is missing.

Run via:

```bash
pnpm --filter api exec tsx --test "apps/web/src/lib/api-client.test.ts"
# or, in full suite form:
pnpm test:web-unit
```

### 3. Mobile nav trigger semantics

File: `apps/web/src/components/layout/nav-items.tsx`,
`apps/web/src/components/layout/topbar.tsx`

Previous shape (problematic):

- `MobileNav` accepted a `<button>` hamburger as `children` from Topbar.
- It then wrapped that button in a `<div role="button" tabIndex={0}>`
  that forwarded clicks via `onClick` / `onKeyDown`.
- Result: real `<button>` nested inside a `<div role="button">` — invalid
  for screen readers and a11y linters.

New shape (correct):

- `MobileNav` renders its own `<button>` hamburger (Tailwind `lg:hidden`
  so it only appears on mobile/tablet).
- No `children` prop, no `div role="button"`.
- Topbar just calls `<MobileNav />`.
- Click on the button sets the controlled `Sheet.open` state.

### 4. Accessible Sheet title and description

File: `apps/web/src/components/layout/nav-items.tsx`

Inside `SheetContent`, the component now renders:

```tsx
<SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
<SheetDescription className="sr-only">
  Điều hướng chính của hệ thống QUANLYVKS
</SheetDescription>
```

`sr-only` keeps the visual layout identical (the `QUANLYVKS_LOGO` block
already provides visual context) while satisfying Radix Dialog's
mandatory `Title` requirement and giving screen-reader users a
description of the dialog's purpose.

### 5. Structured `ApiError` preserved in templates page

File: `apps/web/src/app/templates/page.tsx`

Before: the page stored errors as a string:

```ts
const [errorMessage, setErrorMessage] = useState("");
// …
} catch (err) {
  if (err instanceof ApiError) setErrorMessage(err.message);
  else setErrorMessage("Không tải được danh sách biểu mẫu cần duyệt.");
}
```

That destroyed `code` and `requestId`, so `ErrorBanner` could only show
the message.

After:

```ts
const [error, setError] = useState<unknown>(null);
// …
} catch (err) {
  setError(
    err instanceof ApiError
      ? err
      : err instanceof Error
        ? err
        : new Error("Không tải được danh sách biểu mẫu cần duyệt."),
  );
}
// …
{error ? <ErrorBanner error={error} /> : null}
```

The same pattern was already applied to the dashboard (`app/page.tsx`),
cases (`app/cases/page.tsx`), and `template-selector-workspace.tsx` in
Phase 3. The templates review page is now consistent with them, so all
four migrated pages display `Mã lỗi:` and `Request ID:` when the backend
includes them.

---

## Rule going forward

**Do not convert `ApiError` to a string before passing to `ErrorBanner`.**

`ErrorBanner` accepts `error: unknown` and handles `ApiError`, plain
`Error`, and `string` itself (this is intentional so legacy call sites
keep working). But:

- If you convert `ApiError` to `string`, you lose `code` and `requestId`.
- The fallback path for non-`Error` throws should be
  `new Error("Không ... được ...")`, not `String(err)` or a Vietnamese
  literal — keep the message localisable and consistent.

Pattern (recommended):

```ts
const [error, setError] = useState<unknown>(null);

try {
  await readApi("/...");
} catch (err) {
  setError(
    err instanceof ApiError
      ? err
      : err instanceof Error
        ? err
        : new Error("Không tải được …"),
  );
}

// later:
{error ? <ErrorBanner error={error} /> : null}
```

---

## Manual smoke checklist

Run this on a real dev server before shipping:

| # | Scenario | Expected |
|---|---|---|
| 1 | Visit `/` while logged out | Redirect to `/login` via AuthProvider. |
| 2 | Submit wrong password at `/login` | `ErrorBanner` with backend message. |
| 3 | Hit any protected API with stale/cleared cookie | Auth event `unauthorized` → redirect to `/login`. |
| 4 | Trigger a 403 (e.g. open an out-of-agency case in dev) | `ErrorBanner` shows `Mã lỗi:` and `Request ID:`. |
| 5 | `/cases` loads | Table populated; `ErrorBanner` hidden. |
| 6 | `/templates` loads | Review queue populated; `ErrorBanner` hidden. |
| 7 | `/documents` loads | Template selector renders; `ErrorBanner` hidden. |
| 8 | Mobile (≤`lg`) — tap hamburger | `Sheet` opens with branding + user block + nav. |
| 9 | Mobile — tap a nav link | Sheet closes; route changes. |
| 10 | Mobile — tap "Đăng xuất" | Logout fires; Sheet closes. |
| 11 | Desktop — sidebar still works | Clicking a sidebar item navigates; active state updates. |
| 12 | Form Studio (`/admin/form-studio`) | Layout still full-width; Phase 3 contract preserved. |

For check #4: the `ErrorBanner` should display **both** `Mã lỗi: …` and
`Request ID: …`. If either is missing, the offending call site is
converting `ApiError` to a string before passing to `<ErrorBanner>` —
search for `setErrorMessage(` and the patterns documented above.

---

## CI commands run

This branch was verified locally with:

```bash
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web exec tsc --noEmit
pnpm typecheck
pnpm --filter api exec tsx --test "../web/src/lib/api-client.test.ts"
pnpm test:web-unit
```

All passed with exit code 0.

---

## CI workflow visibility

Workflow file: `.github/workflows/ci.yml`.

Triggers:

```yaml
on:
  push:
  pull_request:
```

Jobs:

1. `static-verification` — `pnpm install --frozen-lockfile`,
   `pnpm lint`, `pnpm build`, `pnpm --filter api test --runInBand`,
   encoding/audit/template/DOCX gates.
2. `docker-production-build` — builds the production compose stack.

If GitHub Actions did **not** show a run after pushing commit `5316169d`,
check the following in the GitHub UI (Settings → Actions / Settings →
Branches / commit page):

1. **Actions disabled for the repo.** Settings → Actions → General →
   "Allow all actions and reusable workflows" must be enabled.
2. **Branch protection ignoring status checks.** If a rule exists on
   `main`, it may require checks before merge but not block pushes — so
   the run should still appear on the commit page. If it does not, the
   Actions permission scope may be set to "Read repository contents
   only" instead of "Read and write permissions".
3. **Workflow file path changes.** If `.github/workflows/ci.yml` was
   added/modified on a commit *after* the initial repo creation,
   GitHub may not retroactively run on the older commits — only on
   pushes that happen after the workflow file lands. Check the commit
   that introduced the workflow and the commits immediately following
   it.
4. **Push happened to a branch with rules blocking CI.** Branch
   protection can be configured to skip CI for certain actors
   ("Require approval from specific actors" etc.). This is rare.
5. **Failed/pending runs not surfaced in combined status.** Open the
   commit on GitHub → click the status badge next to the commit hash.
   If it says "Pending" indefinitely, the runner never picked it up
   (usually #1 or #2). If it says "Failed", open the job log — the
   most likely culprit is `pnpm install --frozen-lockfile` failing
   because the lockfile drifted from `package.json`.
6. **Org-level policy.** Some orgs restrict which repos may use
   GitHub-hosted runners. Settings → Actions → General → "Workflow
   permissions" should be at least "Read repository contents".

For a quick visual confirmation, after pushing, navigate to:

```
https://github.com/lhcaps/Form-Management/actions
```

and the most recent run should be at the top of the workflow list. If
the list is empty, the trigger conditions are not matching (likely #1
or #6 above).

No workflow files were modified by this phase.

---

## What we did not change

- No new dependencies (the fix only touches code we already own).
- No backend endpoints, contracts, or guards touched.
- No Form Studio layout migration (still uses the Phase 3 special-case
  in `AppShell`).
- No new visual systems / theming / dark mode.
- No new animation or motion systems; the only animation in this phase
  is shadcn's built-in `Sheet` slide, which already existed.
