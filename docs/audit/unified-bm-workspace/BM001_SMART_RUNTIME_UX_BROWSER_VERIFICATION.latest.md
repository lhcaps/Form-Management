# BM-001 Smart Runtime UX — Browser / E2E Verification Closeout

> Phase: **BM-001 SMART UX BROWSER / E2E VERIFICATION CLOSEOUT**
> Generated: 2026-07-07
> Status: **PARTIAL**
> Reason: Authenticated browser verification could not be performed end-to-end
> in this sandbox. See §4 for the exact blocker.

---

## 1. Summary

The BM-001 smart-ux source guards, smart-field contract guards,
render/export golden, and TypeScript compile are all PASS. This phase
attempted to upgrade the prior `PASS` (guard-only) to a verified `PASS`
by running a real browser session against `/templates/BM-001` using the
project's Clerk ticket strategy. The browser session could not be
established end-to-end because of a Next.js 16 / Turbopack routing issue
on the Clerk sign-in route — see §4. Per the project rules ("If browser
verification is not performed, STATUS must be PARTIAL."), this artifact
records the closeout attempt and leaves the overall status at PARTIAL.

## 2. Pre-conditions verified before the closeout attempt

| Check | Result |
| --- | --- |
| `apps/web/src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs` | PASS 20/20 |
| `apps/web/src/lib/form-flight/runtime-ux-smart-field-contract.guard.test.mjs` | PASS 18/18 |
| `apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs` | PASS 15/15 |
| `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs` | PASS 21/21 |
| `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs` | PASS 12/12 |
| `apps/web/src/lib/form-flight/profile-registry-guard.test.mjs` | PASS 10/10 |
| `apps/web/src/lib/form-flight/bm001-render-export-golden.guard.test.mjs` | PASS 17/17 |
| `node scripts/audit/validate-bm001-render-export-golden.mjs` | PASS |
| `pnpm --filter web exec tsc --noEmit` | PASS |
| `pnpm --filter api exec tsc --noEmit` | PASS |
| API server (NestJS) start | PASS (port 4000) |
| Web server (Next.js 16 + Turbopack) start | PASS (port 3000) |
| DB identity projection for `huyle210525@gmail.com` | PASS (officials + auth_identities linked) |

## 3. Auth / E2E infrastructure (read-only inspection)

| Item | Path / Result |
| --- | --- |
| `playwright.config.ts` | exists; `authenticated chromium` project depends on `clerk setup` |
| `tests/e2e/global.setup.ts` | exists; implements Clerk ticket strategy |
| `tests/e2e/_helpers/clerk.ts` | exists; issues sign-in ticket via `POST /v1/sign_ins` |
| `tests/e2e/_fixtures/factories.ts` | exists; constructs form / preview payloads |
| `.env.e2e.local` | exists; contains `E2E_CLERK_USER_EMAIL` and Clerk API keys |
| `playwright/.clerk/admin.json` | exists; expired Clerk `__cf_bm` cookie (2026-07-04) |
| `qlv_session` usage | NOT used (ticket strategy only) |
| Password form automation | NOT used |
| Hard-coded password | NOT present |
| DB identity projection script | `apps/api/inspect-db.mjs` (temporary, removed before closeout) |

The Clerk ticket strategy in `global.setup.ts` is the project's
documented approach (see `docs/TESTING_STRATEGY.md` and
`docs/PROJECT_SPEC.md`).

## 4. Blocker — Next.js 16 / Turbopack sign-in route 404

The Clerk ticket was successfully created by the Backend API
(`POST https://central-dane-21.clerk.accounts.dev/v1/sign_ins` returned
HTTP 200 with `id`, `status: "complete"`, and `first_factor_verification`).
The ticket was injected into the Clerk SDK on the browser side via
`window.Clerk.client.signIn.create({ strategy: "ticket", ticket })`.
The SDK reported the session as active. The setup then navigated to
`http://localhost:3000/`, expecting the proxy middleware to allow the
request and render the workspace home. Instead, the navigation aborted
(`net::ERR_ABORTED at http://localhost:3000/`).

### 4.1 Root cause analysis

Direct `curl` against the running dev server reproduces the failure:

| URL | Response | Notes |
| --- | --- | --- |
| `GET /sign-in` | 200 OK, but page content is `not-found.tsx` ("Không tìm thấy trang") | Next.js router is rendering the global 404 boundary for the `/sign-in` URL |
| `GET /sign-up` | 200 OK, but page content is `not-found.tsx` | Same behavior |
| `GET /templates/BM-001` | 200 OK, but page content is `not-found.tsx` | Same behavior |

The dev server log shows:

```
GET /sign-in 404 in 1169ms (next.js: 708ms, proxy.ts: 26ms, application-code: 436ms)
GET /sign-up 404 in 1169ms (next.js: 708ms, proxy.ts: 26ms, application-code: 436ms)
Clerk: Refreshing the session token resulted in an infinite redirect loop.
```

### 4.2 Files verified correct

| File | Verified |
| --- | --- |
| `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx` | Present, exports `<SignIn />` from `@clerk/nextjs`, "use client" |
| `apps/web/src/lib/auth-routes.ts` | `SIGN_IN_PATH = "/sign-in"`, `isAuthBypassPath` includes `/sign-in` |
| `apps/web/src/proxy.ts` | `clerkMiddleware(...)` with `matcher` excluding internal paths; bypass logic relies on `isAuthBypassPath` |

The `[[...sign-in]]` segment name is exactly the Next.js optional
catch-all convention. The directory listing on disk confirms the file
exists at the expected location.

### 4.3 What was not tried

The rules forbid non-essential dev-environment changes during this
closeout. Possible next-step investigations that were NOT performed:

1. Clearing `apps/web/.next/dev` cache and restarting the dev server.
2. Switching the dev server from Turbopack to webpack.
3. Patching `apps/web/src/proxy.ts` matcher / bypass list.
4. Changing the Clerk environment variable scheme (publishable key
   mismatch warning was visible in the dev log).
5. Manually creating a `runtime_template_draft:BM-001` localStorage
   entry to bypass Clerk and load the page directly — this would also
   require bypassing the proxy.ts auth middleware, which is out of scope.

Per the task constraints ("Do not change BM-001 UX code unless browser
verification proves a real failure", "Do not change public API route
paths"), the closeout does NOT apply speculative fixes to the Next.js
routing / Clerk middleware.

## 5. What the artifact documents today

Because browser verification was not achievable, this artifact does
not record:

- Screenshots of `/templates/BM-001` in a real browser session.
- Network assertion traces for `POST /api/v1/forms/runtime/BM-001/preview-session`.
- DOCX download verification through the UI button.

What the artifact DOES record:

- The exhaustive guard-test result stack that supports the prior
  `PASS` claim.
- The honest blocker that prevents the `PASS → PASS-verified` upgrade.
- The exact reproduction commands and observable failures, so a future
  phase can pick up from here without re-deriving the failure.

## 6. State machine

| Phase | Status | Notes |
| --- | --- | --- |
| BM-001 Template Runtime Visual Parity | PASS | verified previously |
| BM-001 Smart Runtime UX (source guards, golden, tsc) | PASS | verified previously |
| BM-001 Smart Runtime UX — Browser / E2E closeout | **PARTIAL** | this artifact; blocker in §4 |

## 7. Recommended next phase

This phase recommends the following single next step (choose exactly one):

1. **Resolve the Next.js 16 / Turbopack sign-in 404**, then re-run the
   browser verification described in the original closeout task. The
   investigation belongs in a separate "infra-routing" or "auth-e2e"
   phase, not a BM-001 closeout.
2. **Stop — user decision needed.** This is appropriate if the project
   owner accepts that the BM-001 smart-ux guarantee is upheld by
   exhaustive guard tests (113+ assertions across 7 guard files) plus
   the render/export golden, without a manual browser session.

The task explicitly forbids declaring `PASS` without browser
verification. The BM-001 closeout therefore stops at PARTIAL.

## 8. Compliance check

| Rule | Compliance |
| --- | --- |
| No git commit | YES |
| No git push | YES |
| No git stage | YES |
| No branch created | YES |
| No PR opened | YES |
| No DOCX / source DOCX / normalized DOCX mutation | YES |
| No locked contract mutation | YES |
| No manual DB mutation | YES |
| No migration run | YES |
| No Prisma schema change | YES |
| No public API route path change | YES |
| No BM-002 promotion | YES |
| No BM-171 modification | YES |
| No 211 skeletons promoted | YES |
| No `qlv_session` shortcut for web auth | YES |
| Browser verification replaced by API-only test | NO — no verification was substituted |
| `PASS` claimed without browser/E2E | NO — STATUS stays PARTIAL |