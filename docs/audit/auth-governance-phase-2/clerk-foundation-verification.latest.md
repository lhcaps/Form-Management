# AUTH GOVERNANCE PHASE 2 — CLERK FOUNDATION VERIFICATION

**Date:** 2026-06-30
**Branch:** `feat/auth-clerk-foundation`
**PR:** PR-1 — Clerk Foundation

---

## What Was Implemented

### 1. Package Install

- `@clerk/nextjs` v7.5.10
- `@clerk/react` v6.11.2 (provides SignIn, SignUp, UserButton, SignedIn, SignedOut, SignInButton)

### 2. ClerkProvider

Added to `apps/web/src/app/layout.tsx` wrapping the existing AuthProvider/AuthGate tree:

```
ClerkProvider → AuthProvider → AuthGate → children
```

No breaking changes to existing html lang, skip link, metadata, or app shell.

### 3. Web Route Protection

`apps/web/src/proxy.ts` updated to use `clerkMiddleware()`:

- **Clerk mode** (when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` are set): Enforces `auth().protect()` on all non-public routes, redirects to `/sign-in`.
- **Legacy mode** (when Clerk env vars absent): Falls back to legacy session cookie (`qlv_session`) — keeps E2E tests and dev workflow working.

Public routes (always accessible):
- `/sign-in(.*)`
- `/sign-up(.*)`
- `/login(.*)` (legacy)
- `/_next/static(.*)`
- `/_next/image(.*)`
- `/favicon.ico`
- `/health(.*)`

### 4. Sign-In / Sign-Up Pages

Created:
- `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx` — "Đăng nhập hệ thống"
- `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx` — "Tạo tài khoản"

Both use Clerk components inside QUANLYVKS-styled containers (slate/blue, no emoji).

### 5. Topbar UserButton

Updated `apps/web/src/components/layout/topbar.tsx`:
- `SignedIn`: shows Clerk `UserButton`
- `SignedOut`: shows "Đăng nhập" button via `SignInButton mode="modal"`
- No deprecated `afterSignOutUrl` prop used.

### 6. Env Placeholders

Updated `.env.example` with Clerk placeholders:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN/OUT_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN/SIGN_UP_URL`
- Webhook secret commented out (PR-2+)

### 7. API Client

`apps/web/src/lib/api-client.ts` — no changes to fetch logic. Added AUTH NOTE comment documenting that Clerk JWT forwarding is deferred to PR-3.

---

## How to Run Locally

### 1. Create Clerk Development Instance

1. Go to https://dashboard.clerk.com
2. Create a new application (Development instance)
3. Copy the API Keys:
   - Publishable key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret key → `CLERK_SECRET_KEY`
4. In Clerk Dashboard → Redirect URLs, add:
   - `http://localhost:3000/sign-in`
   - `http://localhost:3000/sign-up`
   - `http://localhost:3000/`
5. Enable Organizations (for agency mapping — future)

### 2. Create `.env.local`

```bash
cp .env.example apps/web/.env.local
# Fill in Clerk keys from Step 1
```

### 3. Run Dev Server

```bash
pnpm dev
```

### 4. Verify

- Navigate to `/` → should redirect to `/sign-in`
- Sign in via Clerk → redirect to `/`
- Click user avatar → should show Clerk UserButton menu with sign-out
- Navigate to `/templates`, `/documents`, `/cases` → should work when authenticated
- Sign out → redirect to `/sign-in`

---

## What Is Intentionally Deferred

| Feature | PR | Reason |
|---------|-----|--------|
| DB projection (`auth_identities`, `agency_memberships`) | PR-2 | Requires DB migration |
| Clerk JWT enforcement in API | PR-3 | Separate NestJS process, not Next.js concern |
| RBAC guards in API | PR-4 | Depends on DB projection |
| Webhook sync | PR-2 | Depends on DB projection |
| Audit logs | PR-5 | Depends on DB projection |
| Export history | PR-6 | New table, low risk |
| Old auth removal | PR-7 | Gradual migration |
| Clerk test instance E2E auth | PR-7 | Requires dedicated Clerk test tenant |
| Contract/DOCX/compiled artifacts | — | Out of scope |

---

## Auth Mode Behavior

### Clerk Enabled (`.env.local` has real keys)

```
Unauthenticated GET /cases → clerkMiddleware() → redirect /sign-in
Clerk sign-in → session cookie set → redirect /
GET / → Clerk session present → show app
```

### Clerk Disabled (no env vars)

```
Unauthenticated GET /cases → proxy fallback → redirect /login (legacy)
Legacy login → qlv_session cookie → show app
```

E2E tests run in legacy mode without Clerk test credentials.

---

## Files Changed

```
NEW:
  apps/web/src/app/sign-in/[[...sign-in]]/page.tsx
  apps/web/src/app/sign-up/[[...sign-up]]/page.tsx

MODIFIED:
  apps/web/src/app/layout.tsx
  apps/web/src/proxy.ts
  apps/web/src/components/layout/topbar.tsx
  apps/web/src/lib/api-client.ts
  .env.example

PACKAGE:
  apps/web/package.json (+ @clerk/nextjs, @clerk/react)
  pnpm-lock.yaml

TEST:
  tests/e2e/auth-clerk-foundation.spec.ts

DOCS:
  docs/audit/auth-governance-phase-2/clerk-foundation-baseline.latest.md
  docs/audit/auth-governance-phase-2/clerk-package-check.latest.md
  docs/audit/auth-governance-phase-2/clerk-foundation-verification.latest.md (this file)
```

---

## Rollback

```bash
# 1. Remove ClerkProvider from layout.tsx
# 2. Restore proxy.ts to legacy-only version
# 3. Remove sign-in/sign-up pages
# 4. Restore topbar (remove SignedIn/SignedOut/UserButton)
# 5. pnpm remove @clerk/nextjs @clerk/react --filter web
# 6. Remove Clerk env vars from .env.example
```
