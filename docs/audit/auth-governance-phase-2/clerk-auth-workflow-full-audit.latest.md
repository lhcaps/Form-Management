# QUANLYVKS Auth Workflow Full Audit and Completion

**Date:** 2026-07-01  
**Branch:** `feat/auth-clerk-foundation`  
**Status:** COMPLETE for the current auth workflow: route protection, Clerk auth UI, return-path preservation, post-sign-up web session recovery, API Bearer forwarding, API Clerk token validation, and safe viewer fallback.

## Executive Decision

The current auth workflow is ready for local acceptance:

- Canonical auth entry is `/sign-in`.
- Canonical registration entry is `/sign-up`.
- Legacy `/login` is compatibility-only and redirects to `/sign-in`.
- Protected routes preserve the requested internal path through app-owned `return_url`.
- Unsafe or external return targets are rejected before they reach Clerk.
- After Clerk sign-up/verification, the web client no longer redirects back to `/sign-in` just because the legacy API `/auth/me` cookie is absent.
- API calls made through the shared web fetch path attach the current Clerk session token as `Authorization: Bearer ...`.
- The API prefers the legacy `qlv_session` cookie when present, then validates Clerk Bearer tokens with `@clerk/backend`.
- Clerk-only users are mapped to a safe `VIEWER` API identity with no form-admin permissions.
- Permissioned form-admin routes return controlled `403` responses for Clerk viewer IDs instead of crashing on `BigInt(...)`.
- Sign-in/sign-up switching uses app-owned links and lightweight shell/card enter transitions.
- Clerk sign-in/sign-up forms render in Chromium through the in-app Browser on desktop and mobile with real Clerk development keys loaded from local `.env`.

No real user credential submission was performed by the agent without explicit permission to create an external Clerk test user. That provider-side check is now scripted in `tests/e2e/auth-clerk-real-signup.spec.ts`; it should be run with `CLERK_REAL_SIGNUP_E2E=1` when temporary Clerk test-user creation is approved.

## Root Causes Closed

Clerk rendered correctly at `/sign-in`, but became blank when the page URL contained Clerk-style `redirect_url`.

The fix is to keep redirect preservation under an app-owned parameter:

```text
/documents?tab=forms
  -> /sign-in?return_url=%2Fdocuments%3Ftab%3Dforms
  -> Clerk component receives forceRedirectUrl="/documents?tab=forms"
```

During the user-reported sign-up path, the pasted dev log showed this loop after email verification:

```text
GET /templates 200
GET /sign-in?return_url=%2Ftemplates 200
GET /templates 200
GET /sign-in/SignIn_clerk_catchall_check_...
```

That meant server-side Clerk middleware already considered the request authenticated, but the client `AuthProvider` still called legacy `/auth/me`, received no legacy `qlv_session` user, marked the app unauthenticated, and redirected back to sign-in. The fix is a Clerk-aware session resolver: legacy API identity still wins when present, but a loaded Clerk user becomes a safe authenticated `VIEWER` fallback.

A second audit found that API-backed pages could still produce 401s because the web fetch layer only sent legacy cookies. The fix is a central Clerk token provider in `AuthProvider`, consumed by the shared API fetch wrapper. The API now validates Clerk Bearer tokens and maps Clerk-only users conservatively.

## Implementation Summary

| Area | Result |
| --- | --- |
| Shared route helper | Added `apps/web/src/lib/auth-routes.ts` for canonical paths, bypass checks, static asset checks, and return-path sanitization. |
| Route tests | Added `apps/web/src/lib/auth-routes.test.ts` for encoding, bypass, static assets, and unsafe return targets. |
| Session bridge | Added `apps/web/src/lib/auth-session-state.ts` so Clerk users remain authenticated when `/auth/me` has no legacy session yet. |
| Session tests | Added `apps/web/src/lib/auth-session-state.test.ts` for API-preferred user, Clerk fallback, loading, and unauthenticated outcomes. |
| API fetch bridge | Updated `apps/web/src/lib/api-client.ts` so old and new API helpers attach Clerk Bearer tokens without overwriting explicit Authorization headers. |
| `/login` | Replaced legacy username/password page with a server redirect to `buildSignInPath(...)`. |
| Middleware | Updated `apps/web/src/proxy.ts` to protect non-public routes and redirect signed-out users with `return_url`. |
| Client auth gate | Updated `auth-context.tsx` and `auth-gate.tsx` to use canonical sign-in helpers, Clerk-aware session state, API token provider, and auth-page bypasses. |
| Sign-in page | Uses `@clerk/nextjs` `<SignIn>` with sanitized `forceRedirectUrl` and app-owned sign-up transition link. |
| Sign-up page | Uses `@clerk/nextjs` `<SignUp>` with sanitized `forceRedirectUrl` and app-owned sign-in transition link. |
| Auth UI | Rebuilt `AuthShell` as a responsive QUANLYVKS split auth surface using Lucide icons, one Clerk-framed form, and smooth enter animations. |
| API Clerk validation | Added `@clerk/backend` to the API and validate Bearer tokens in `AuthService.validateClerkSession(...)`. |
| API service tests | Added direct unit coverage for Clerk token verification, safe viewer mapping, missing-secret behavior, and missing-subject handling. |
| API guard order | `AuthGuard` now prefers the legacy cookie, then accepts a valid Clerk Bearer token. |
| Form permission guard | Non-numeric Clerk viewer IDs now fail closed with controlled `403` on permissioned routes. |
| Logout | Legacy API logout is attempted when available; Clerk users are signed out through Clerk and returned to canonical `/sign-in`. |
| E2E expectations | Updated `tests/e2e/auth-clerk-foundation.spec.ts` for `/sign-in` and `return_url`. |
| Real sign-up E2E harness | Added `tests/e2e/auth-clerk-real-signup.spec.ts`, which uses Clerk `+clerk_test` emails and OTP `424242`, injects a Clerk testing token, verifies return to `/templates`, and cleans up the temporary user. It skips by default unless `CLERK_REAL_SIGNUP_E2E=1` is set. |

## Verification Commands

| Command | Result |
| --- | --- |
| `node apps/api/node_modules/tsx/dist/cli.mjs --test "apps/web/src/lib/auth-routes.test.ts"` | PASS, 7/7 |
| `node apps/api/node_modules/tsx/dist/cli.mjs --test "apps/web/src/lib/auth-session-state.test.ts"` | PASS, 5/5 |
| `node apps/api/node_modules/tsx/dist/cli.mjs --test "apps/web/src/lib/api-client.test.ts"` | PASS, API Bearer token added and explicit Authorization preserved |
| `node apps/api/node_modules/tsx/dist/cli.mjs --test "apps/web/src/**/*.test.ts" "apps/web/src/**/*.test.mjs"` | PASS, 89 tests |
| `node node_modules/typescript/bin/tsc --noEmit` from `apps/web` | PASS |
| `node node_modules/eslint/bin/eslint.js` from `apps/web` | PASS |
| `node node_modules/next/dist/bin/next build` from `apps/web` | PASS |
| `node node_modules/jest/bin/jest.js src/modules/auth/auth.service.spec.ts src/modules/auth/auth.guard.spec.ts src/modules/auth/form-permission.guard.spec.ts --runInBand` from `apps/api` | PASS, 7/7 |
| `node node_modules/jest/bin/jest.js --runInBand` from `apps/api` | PASS, 293 tests |
| `node node_modules/typescript/bin/tsc --noEmit` from `apps/api` | PASS |
| `node node_modules/eslint/bin/eslint.js "{src,apps,libs,test}/**/*.ts"` from `apps/api` | PASS |
| `node node_modules/@nestjs/cli/bin/nest.js build` from `apps/api` | PASS |
| `node node_modules/@playwright/test/cli.js test auth-clerk-real-signup.spec.ts --config playwright.config.ts --project chromium` | PASS harness load; 1 skipped by design without `CLERK_REAL_SIGNUP_E2E=1` |
| `node scripts/audit/check-213-remediation-readiness.mjs` | PASS for auth scope: C2/C3 PASS, render atlas 213 PASS, decision gate ALLOW; overall Ready remains NO while the worktree is dirty |
| `node scripts/audit/build-website-requirement-acceptance-v1.mjs` | READY_ABSOLUTE, 54 PASS / 3 NOT_DETECTABLE |
| `node scripts/audit/build-ready-absolute-blocker-burn-down-v3.mjs` | 0 blockers |

## Live Route Evidence

Web dev server command:

```bash
node scripts/dev-web-with-root-env.mjs
```

API dev server command:

```bash
node node_modules/@nestjs/cli/bin/nest.js start
```

Live HTTP checks:

| URL | Observed |
| --- | --- |
| `http://127.0.0.1:3000/healthz` | HTTP 200, `{"ok":true,"service":"web"}` |
| `http://127.0.0.1:3000/login?returnUrl=/documents` | HTTP 307, `Location: /sign-in?return_url=%2Fdocuments` |
| `http://127.0.0.1:3000/documents?tab=forms` | HTTP 307, `Location: /sign-in?return_url=%2Fdocuments%3Ftab%3Dforms` |
| `http://localhost:3001/api/v1/templates` with invalid Bearer | HTTP 401, not 500 |
| `http://localhost:3001/api/v1/auth/me` signed out | HTTP 200, `{}` |

In-app Browser desktop checks:

| Route | Observed |
| --- | --- |
| `/templates` while signed out | Redirected to `/sign-in?return_url=%2Ftemplates`; no app crash or framework overlay |
| Sign-in footer `Sign up` | Navigated to `/sign-up?return_url=%2Ftemplates#/?return_url=%2Ftemplates`; no `redirect_url` leak |
| Sign-up footer `Sign in` | Navigated back to `/sign-in?return_url=%2Ftemplates`; no `redirect_url` leak |
| `/sign-up?return_url=%2Ftemplates` | QUANLYVKS shell, sign-up heading, visible inputs, card/brand transitions present |

In-app Browser mobile checks at 390px width:

| Route | Observed |
| --- | --- |
| `/sign-up?return_url=%2Ftemplates` | 2 visible inputs, zero horizontal overflow, no `redirect_url` leak, no relevant console errors |

Additional screenshot evidence from the earlier Playwright fallback run:

```text
C:\Users\ADMIN\AppData\Local\Temp\qllaw-auth-check-api-1782907569446\01-signed-out-templates-redirects-signin.png
C:\Users\ADMIN\AppData\Local\Temp\qllaw-auth-check-api-1782907569446\02-signup-return-url.png
C:\Users\ADMIN\AppData\Local\Temp\qllaw-auth-check-api-1782907569446\03-signin-return-url-after-backlink.png
C:\Users\ADMIN\AppData\Local\Temp\qllaw-auth-check-api-1782907569446\04-mobile-signup.png
```

## Secret Safety

| Check | Result |
| --- | --- |
| Root `.env` | Remains local and gitignored. |
| Clerk secret handling | Docs and code examples use placeholders only. |
| `gitleaks version` | Not installed. |
| Fallback pattern scan | Only placeholders/docs and prefix-validation code matched. |
| Sanitized Clerk key-pair check | PASS: publishable key decodes to the configured Clerk development frontend; secret validates against Clerk instance metadata. |

## Form/Contract Safety

This auth change did not modify locked form contracts, DOCX templates, compiled form artifacts, or Prisma schema.

The 213 readiness command reports:

```text
Render atlas: 213 PASS, 0 FAIL, 0 ERROR, 0 MISSING
Decision gate: ALLOW
Ready: NO only because git status is dirty
```

## Remaining Manual Acceptance

Use a real Clerk test user to complete these provider-side checks:

1. Sign in at `/sign-in?return_url=%2Fdocuments` and confirm the app lands on `/documents`.
2. Sign up at `/sign-up?return_url=%2Ftemplates`, complete email verification, and confirm the app stays on `/templates` instead of bouncing to `/sign-in`.
3. Confirm the topbar user menu appears after auth.
4. Open `/templates` and `/documents`; the app shell should remain authenticated, and API-backed reads should use Clerk Bearer auth.
5. Confirm permissioned form-admin actions stay unavailable for Clerk-only viewer accounts until explicit RBAC/agency mapping is added.
6. Sign out and confirm the app returns to `/sign-in`.

Opt-in automated command after approving temporary Clerk test-user creation:

```bash
CLERK_REAL_SIGNUP_E2E=1 node node_modules/@playwright/test/cli.js test auth-clerk-real-signup.spec.ts --config playwright.config.ts --project chromium
```

Everything else in the current route/UI/session/API-auth workflow is verified locally.
