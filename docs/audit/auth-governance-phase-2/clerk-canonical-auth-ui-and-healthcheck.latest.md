# AUTH GOVERNANCE PHASE 2 - Canonical Clerk Auth UI and Healthcheck

**Date:** 2026-07-01  
**Branch:** `feat/auth-clerk-foundation`  
**Status:** COMPLETE for current Clerk auth workflow: route/UI foundation, post-sign-up client session bridge, API Bearer forwarding, and safe API viewer fallback

This note is the current canonical summary. Full evidence is in:

- `docs/audit/auth-governance-phase-2/clerk-auth-workflow-full-audit.latest.md`

## Current Contract

| Area | Current behavior |
| --- | --- |
| Public web health | `/healthz` returns JSON `{ "ok": true, "service": "web" }` without auth. |
| Canonical sign-in | `/sign-in` renders Clerk `<SignIn>` from `@clerk/nextjs` inside the QUANLYVKS auth shell. |
| Canonical sign-up | `/sign-up` renders Clerk `<SignUp>` from `@clerk/nextjs` inside the same shell. |
| Legacy login | `/login` no longer renders a custom form. It server-redirects to `/sign-in`. |
| Return target | App-owned `return_url` is used for internal return paths. Legacy `returnUrl` is accepted by `/login`. |
| Protected signed-out routes | Redirect to `/sign-in?return_url=<internal path>`. |
| Unsafe return targets | External, protocol-relative, static-asset, and auth-page return targets are dropped. |
| Post-sign-up session | If Clerk is signed in but legacy `/auth/me` has no cookie yet, the web app stays authenticated with a safe `VIEWER` fallback user instead of bouncing back to `/sign-in`. |
| API 401 while Clerk-authenticated | API `unauthorized` events re-resolve the combined session and no longer force a sign-in redirect when a Clerk user exists. |
| Clerk token to API | `AuthProvider` installs a Clerk token provider; the shared fetch wrapper attaches `Authorization: Bearer <Clerk session token>` to API requests without overwriting explicit Authorization headers. |
| API Clerk bearer auth | `AuthGuard` prefers the legacy `qlv_session` cookie, then validates Clerk Bearer tokens via `@clerk/backend`. Clerk-only users become safe `VIEWER` users with no form-admin permissions. |
| Admin permission failure | Clerk viewer IDs such as `clerk:user_...` return controlled `403` on form-admin routes instead of crashing in `BigInt(...)`. |
| Auth-page transition | Sign-in and sign-up links preserve `return_url`; the auth shell/card enter with lightweight opacity/transform transitions and respect `prefers-reduced-motion`. |

## Root Causes Closed

1. The old `/login` form was still the default unauthenticated entry in some code paths.
2. Clerk pages rendered, but were too bare and did not match the product surface.
3. Clerk became blank when handed a `redirect_url` query on this tenant; the app now owns `return_url` and passes the sanitized value to `forceRedirectUrl`.
4. Public health checks were mixed with protected routes; `/healthz` is now the stable web health endpoint.
5. After real Clerk sign-up/verification, the middleware accepted `/templates`, but client `AuthProvider` still treated missing legacy `/auth/me` data as unauthenticated and redirected back to `/sign-in`.
6. Sign-in/sign-up page switching used Clerk defaults in places and could leak Clerk-style `redirect_url`; the app now uses the same `return_url` contract in both directions.
7. API calls still only sent legacy cookies, so a Clerk-authenticated user could stay in the web shell but hit API 401s on data-backed pages.
8. Form-admin permission routes assumed numeric legacy official IDs; Clerk viewer IDs needed to fail as authorization errors, not runtime conversion errors.

## Changed Auth Files

| File | Purpose |
| --- | --- |
| `apps/web/src/lib/auth-routes.ts` | Shared auth route normalization, public-path checks, and safe `return_url` builder. |
| `apps/web/src/lib/auth-routes.test.ts` | Unit coverage for the redirect and sanitization contract. |
| `apps/web/src/lib/auth-session-state.ts` | Clerk-aware session resolver that prefers legacy API identity but falls back to a safe Clerk viewer session. |
| `apps/web/src/lib/auth-session-state.test.ts` | Unit coverage for API-preferred identity, Clerk fallback, loading state, and final unauthenticated state. |
| `apps/web/src/lib/api-client.ts` | API fetch defaults plus Clerk Bearer token forwarding for old and new API helpers. |
| `apps/web/src/app/login/page.tsx` | Legacy route redirects to canonical `/sign-in`. |
| `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk sign-in with sanitized `forceRedirectUrl` and app-owned sign-up link. |
| `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx` | Clerk sign-up with sanitized `forceRedirectUrl` and app-owned sign-in link. |
| `apps/web/src/components/auth/auth-shell.tsx` | Responsive QUANLYVKS split auth shell using Lucide icons and enter-transition hooks. |
| `apps/web/src/components/auth/auth-gate.tsx` | Client gate uses canonical sign-in route and auth bypass helper. |
| `apps/web/src/lib/auth-context.tsx` | Combines legacy API and Clerk session state; logout clears legacy API if present and signs out Clerk. |
| `apps/web/src/app/globals.css` | Auth shell/card enter animations and reduced-motion fallback. |
| `apps/web/src/proxy.ts` | Middleware protects non-public routes and preserves return paths with `return_url`. |
| `apps/api/src/modules/auth/auth.service.ts` | Validates Clerk session tokens with `@clerk/backend` and maps Clerk-only users to safe API viewers. |
| `apps/api/src/modules/auth/auth.guard.ts` | Authenticates first by legacy cookie, then by Clerk Bearer token. |
| `apps/api/src/modules/auth/form-permission.guard.ts` | Rejects non-legacy viewer IDs with controlled `403` on permissioned routes. |
| `apps/api/src/modules/auth/auth.service.spec.ts` | Direct unit coverage for Clerk token verification, safe viewer mapping, and missing-secret behavior. |
| `apps/api/src/infrastructure/config/app-config.service.ts` | Reads `CLERK_SECRET_KEY` and optional `CLERK_AUTHORIZED_PARTIES`. |
| `tests/e2e/auth-clerk-foundation.spec.ts` | E2E expectations updated for canonical `/sign-in`. |
| `tests/e2e/auth-clerk-real-signup.spec.ts` | Armed real-provider E2E for `/sign-up` using Clerk `+clerk_test` email and OTP `424242`; skips by default to avoid creating external users accidentally. |

## Verification Snapshot

| Check | Result |
| --- | --- |
| Focused auth route unit test | PASS, 7/7 |
| Focused auth session-state unit test | PASS, 5/5 |
| Focused API client token-forwarding unit test | PASS, API Bearer token added and explicit Authorization preserved |
| Focused API service Clerk token test | PASS, verified token maps to safe viewer and missing secret avoids Clerk calls |
| Focused API guard tests | PASS, Clerk Bearer fallback accepted, legacy cookie preferred, invalid bearer rejected |
| Focused form-permission guard test | PASS, Clerk viewer gets controlled 403 |
| Armed real sign-up E2E harness default run | PASS harness load; 1 skipped by design until `CLERK_REAL_SIGNUP_E2E=1` is explicitly enabled |
| Web unit suite | PASS, 89 tests |
| API Jest suite | PASS, 293 tests |
| Web TypeScript | PASS |
| Web ESLint | PASS |
| Web production build | PASS |
| API TypeScript | PASS |
| API ESLint | PASS |
| API Nest build | PASS |
| API Prisma generate | PASS |
| `/healthz` live check | PASS, HTTP 200 JSON |
| `/login?returnUrl=/documents` | PASS, 307 to `/sign-in?return_url=%2Fdocuments` |
| `/documents?tab=forms` signed out | PASS, 307 to `/sign-in?return_url=%2Fdocuments%3Ftab%3Dforms` |
| Chromium desktop visual check | PASS, sign-in and sign-up rendered visible inputs |
| In-app Browser auth transition check | PASS, `/templates` -> `/sign-in?return_url=%2Ftemplates` -> `/sign-up?return_url=%2Ftemplates#/?return_url=%2Ftemplates` -> `/sign-in?return_url=%2Ftemplates`; no `redirect_url` leak |
| In-app Browser mobile visual check | PASS, 390px viewport, zero horizontal overflow |
| API invalid Clerk bearer smoke | PASS, protected `/api/v1/templates` returns HTTP 401, not 500 |
| API public `/auth/me` signed-out smoke | PASS, HTTP 200 `{}` |
| 213 readiness safety | PASS for auth scope: render atlas 213 PASS, decision gate ALLOW; dirty worktree keeps overall Ready as NO |
| Website acceptance | READY_ABSOLUTE, 54 PASS / 3 NOT_DETECTABLE |
| Blocker burn-down | 0 blockers |

## Remaining Manual Item

No live Clerk credential submission was performed by the agent without explicit permission to create an external Clerk user. The route, UI, redirect, post-Clerk-session bridge, API Bearer bridge, and Clerk form render workflows are covered locally. A ready-to-run provider-side E2E now exists at `tests/e2e/auth-clerk-real-signup.spec.ts`; run it with `CLERK_REAL_SIGNUP_E2E=1` after approving temporary Clerk test-user creation.
