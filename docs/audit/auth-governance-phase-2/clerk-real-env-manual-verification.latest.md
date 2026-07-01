# AUTH GOVERNANCE PHASE 2 - Clerk Real Env Manual Verification

**Date:** 2026-07-01  
**Branch:** `feat/auth-clerk-foundation`  
**Status:** CURRENT

Full implementation and command evidence is in:

- `docs/audit/auth-governance-phase-2/clerk-auth-workflow-full-audit.latest.md`

## Secret Handling

- Root `.env` is local and gitignored.
- The Clerk secret key must never be printed, copied into docs, or committed.
- If a Clerk secret was ever pasted outside secure storage, rotate it in Clerk Dashboard and replace the local `.env` value.
- `gitleaks` is not installed on this machine. A fallback pattern scan was run while excluding `.env`, `.git`, `node_modules`, and build output. Matches were placeholders/docs or prefix-validation code only.
- Sanitized key-pair check passed: the publishable key decodes to the configured Clerk development frontend, the secret key validates against Clerk instance metadata, and Clerk domain metadata matches the same frontend.

## Required Env Values

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/templates
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/templates
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/templates
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/templates
# Optional API-side audience restriction:
CLERK_AUTHORIZED_PARTIES=http://localhost:3000
```

## Current Implementation Map

| File | Clerk usage |
| --- | --- |
| `apps/web/src/app/layout.tsx` | `ClerkProvider` wraps the web app. |
| `apps/web/src/proxy.ts` | `clerkMiddleware` protects non-public routes and redirects with app-owned `return_url`. |
| `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx` | `<SignIn>` from `@clerk/nextjs`. |
| `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx` | `<SignUp>` from `@clerk/nextjs`. |
| `apps/web/src/lib/auth-routes.ts` | Safe internal return-path normalization. |
| `apps/web/src/lib/auth-session-state.ts` | Safe Clerk viewer fallback when a Clerk session exists before a legacy API session exists. |
| `apps/web/src/lib/api-client.ts` | Shared API fetch wrapper attaches Clerk Bearer tokens without overwriting explicit Authorization headers. |
| `apps/web/src/lib/auth-context.tsx` | Resolves API + Clerk auth state, installs the API token provider, guards API 401 events, and signs out both legacy API and Clerk sessions. |
| `apps/api/src/modules/auth/auth.service.ts` | Validates Clerk session tokens through `@clerk/backend` and maps Clerk-only users to safe API viewers. |
| `apps/api/src/modules/auth/auth.guard.ts` | Prefers legacy session cookie, then authenticates valid Clerk Bearer tokens. |
| `apps/api/src/modules/auth/form-permission.guard.ts` | Fails closed with controlled `403` for Clerk viewer IDs on permissioned routes. |
| `apps/web/src/components/layout/topbar.tsx` | Clerk user/session UI remains in the authenticated app shell. |
| `tests/e2e/auth-clerk-real-signup.spec.ts` | Opt-in real sign-up E2E using Clerk `+clerk_test` email, OTP `424242`, testing-token injection, `/templates` return assertion, and cleanup. |

## Manual Browser Checklist

Signed out:

- Visit `/healthz`: returns JSON health.
- Visit `/login?returnUrl=/documents`: redirects to `/sign-in?return_url=%2Fdocuments`.
- Visit `/documents?tab=forms`: redirects to `/sign-in?return_url=%2Fdocuments%3Ftab%3Dforms`.
- Visit `/sign-in?return_url=%2Fdocuments`: QUANLYVKS shell and Clerk sign-in form render.
- Visit `/sign-up?return_url=%2Fdocuments`: QUANLYVKS shell and Clerk sign-up form render.
- Use the sign-in/sign-up footer links: both preserve `return_url` and do not emit Clerk `redirect_url`.

With a real Clerk test user:

- Sign in from `/sign-in?return_url=%2Fdocuments`.
- Confirm successful auth returns to `/documents`.
- Sign up from `/sign-up?return_url=%2Ftemplates`, complete email verification, and confirm successful auth returns to `/templates`.
- Confirm the app does not bounce back to `/sign-in?return_url=%2Ftemplates` after successful verification.
- Open `/templates` and `/documents`; the app shell should remain authenticated and API reads should carry a Clerk Bearer token.
- Confirm permissioned form-admin actions are unavailable for Clerk-only viewer accounts until explicit RBAC/agency mapping is added.
- Confirm topbar user menu appears.
- Sign out; confirm the app returns to `/sign-in`.

Opt-in automated version:

```bash
CLERK_REAL_SIGNUP_E2E=1 node node_modules/@playwright/test/cli.js test auth-clerk-real-signup.spec.ts --config playwright.config.ts --project chromium
```

This command creates a temporary Clerk test user and deletes it in `finally`. It is intentionally skipped by default so ordinary test runs do not create external users.

Latest local browser evidence:

```text
In-app Browser desktop: /templates -> /sign-in?return_url=%2Ftemplates -> /sign-up?return_url=%2Ftemplates#/?return_url=%2Ftemplates -> /sign-in?return_url=%2Ftemplates
In-app Browser mobile: 390px viewport, sign-up form rendered, zero horizontal overflow, no relevant console errors
```

Earlier Playwright fallback screenshots:

```text
C:\Users\ADMIN\AppData\Local\Temp\qllaw-auth-check-api-1782907569446\01-signed-out-templates-redirects-signin.png
C:\Users\ADMIN\AppData\Local\Temp\qllaw-auth-check-api-1782907569446\02-signup-return-url.png
C:\Users\ADMIN\AppData\Local\Temp\qllaw-auth-check-api-1782907569446\03-signin-return-url-after-backlink.png
C:\Users\ADMIN\AppData\Local\Temp\qllaw-auth-check-api-1782907569446\04-mobile-signup.png
```

## Deferred By Design

| Item | Reason |
| --- | --- |
| Official/RBAC/agency projection for Clerk users | Requires an explicit product policy for mapping Clerk identities to prosecutor-office roles and agencies. Current implementation fails closed as `VIEWER`. |
| Webhook synchronization | Later auth governance PRs. |
| Full removal of legacy session code | Requires post-Clerk cutover validation. |
