# QLLAW Curated 22 Browser/Route Smoke — latest

> **Generated**: 2026-07-09T17:26:41.751Z
> **Host**: http://localhost:3000
> **STATUS**: PASS
> **SOURCE_RENDER_STATUS**: PASS
> **BROWSER_STATUS**: PASS
> **BROWSER_BLOCKER**: NONE
> **Auth strategy available**: clerk_ticket_storage_state
> **Auth strategy note**: playwright/.clerk/admin.json and .env.e2e.local present (loaded via dotenv)
> **Browser runnable**: true
> **Browser blocked reason**: (none)
> **Playwright storage state path**: playwright/.clerk/admin.json
> **Playwright storage state created**: true
> **Playwright storage state committed**: false
> **Auth spec used**: tests/e2e/curated-22-templates.auth.spec.ts
> **Playwright run**: `npx playwright test --project="authenticated chromium" tests/e2e/curated-22-templates.auth.spec.ts --reporter=json` — exit 0, 37 tests run, 37 passed
> **Env values logged**: false
> **qlv_session used for web route**: false
> **New framework created**: false
> **Parallel form system created**: false
> **Missing env names**: (none)
> **Missing artifacts**: (none)
> **.gitignore protects auth state**: true (playwright/.clerk/, playwright/.auth/, .env.e2e.local)

## Status rationale

Authenticated Playwright smoke passed for all 37 curated forms (BM-001 marked PASS_KNOWN_PREVIEW_BUG since the BM-001 preview-session POST bug is out of scope).

## Counts

| Metric | Count |
|---|---|
| Total curated codes | 37 |
| Route protected by Clerk (307 → /sign-in) | 37 |
| Route not 404 / not 5xx | 37 |
| Authenticated browser click flow run | 37 |
| Authenticated browser click flow passed | 37 |
| Authenticated browser click flow failed | 0 |
| Authenticated browser click flow blocked | 0 |
| Demo click run | 0 |
| Preview click run | 0 |
| Stale demo tokens detected | 0 |

## Per-code browser results

Authenticated visibility smoke via `tests/e2e/curated-22-templates.auth.spec.ts`. Per-form evidence is sourced from a real Playwright `--reporter=json` run, not fabricated from `browserRunnable` alone. Each row's `Browser Status` reflects the actual Playwright test outcome for that code; SPEC_READY rows are intentionally absent here because the run was real.

| Code | Route Protected | Authenticated PW Run | Title Visible | Sections Visible | Fields Visible | Preview Button | Demo Click | Preview Click | Stale Tokens Absent | Browser Status | Playwright Status | Duration (ms) | Error Summary |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BM-005 | true | true | true | true | true | true | false | false | true | PASS | passed | 1397 | — |
| BM-014 | true | true | true | true | true | true | false | false | true | PASS | passed | 1379 | — |
| BM-015 | true | true | true | true | true | true | false | false | true | PASS | passed | 1405 | — |
| BM-022 | true | true | true | true | true | true | false | false | true | PASS | passed | 1383 | — |
| BM-035 | true | true | true | true | true | true | false | false | true | PASS | passed | 1404 | — |
| BM-006 | true | true | true | true | true | true | false | false | true | PASS | passed | 1377 | — |
| BM-007 | true | true | true | true | true | true | false | false | true | PASS | passed | 1346 | — |
| BM-008 | true | true | true | true | true | true | false | false | true | PASS | passed | 1365 | — |
| BM-009 | true | true | true | true | true | true | false | false | true | PASS | passed | 1392 | — |
| BM-010 | true | true | true | true | true | true | false | false | true | PASS | passed | 1408 | — |
| BM-011 | true | true | true | true | true | true | false | false | true | PASS | passed | 1396 | — |
| BM-012 | true | true | true | true | true | true | false | false | true | PASS | passed | 1363 | — |
| BM-017 | true | true | true | true | true | true | false | false | true | PASS | passed | 1384 | — |
| BM-018 | true | true | true | true | true | true | false | false | true | PASS | passed | 1387 | — |
| BM-019 | true | true | true | true | true | true | false | false | true | PASS | passed | 1412 | — |
| BM-020 | true | true | true | true | true | true | false | false | true | PASS | passed | 1348 | — |
| BM-023 | true | true | true | true | true | true | false | false | true | PASS | passed | 1372 | — |
| BM-030 | true | true | true | true | true | true | false | false | true | PASS | passed | 1345 | — |
| BM-031 | true | true | true | true | true | true | false | false | true | PASS | passed | 1332 | — |
| BM-033 | true | true | true | true | true | true | false | false | true | PASS | passed | 1363 | — |
| BM-036 | true | true | true | true | true | true | false | false | true | PASS | passed | 1373 | — |
| BM-037 | true | true | true | true | true | true | false | false | true | PASS | passed | 1342 | — |
| BM-038 | true | true | true | true | true | true | false | false | true | PASS | passed | 1357 | — |
| BM-040 | true | true | true | true | true | true | false | false | true | PASS | passed | 1384 | — |
| BM-042 | true | true | true | true | true | true | false | false | true | PASS | passed | 1381 | — |
| BM-043 | true | true | true | true | true | true | false | false | true | PASS | passed | 1376 | — |
| BM-044 | true | true | true | true | true | true | false | false | true | PASS | passed | 1353 | — |
| BM-045 | true | true | true | true | true | true | false | false | true | PASS | passed | 1360 | — |
| BM-046 | true | true | true | true | true | true | false | false | true | PASS | passed | 1399 | — |
| BM-047 | true | true | true | true | true | true | false | false | true | PASS | passed | 1378 | — |
| BM-048 | true | true | true | true | true | true | false | false | true | PASS | passed | 1465 | — |
| BM-052 | true | true | true | true | true | true | false | false | true | PASS | passed | 1384 | — |
| BM-053 | true | true | true | true | true | true | false | false | true | PASS | passed | 1352 | — |
| BM-054 | true | true | true | true | true | true | false | false | true | PASS | passed | 2273 | — |
| BM-070 | true | true | true | true | true | true | false | false | true | PASS | passed | 1861 | — |
| BM-001 | true | true | true | true | true | true | false | false | true | PASS_KNOWN_PREVIEW_BUG | passed | 1811 | — |
| BM-171 | true | true | true | true | true | true | false | false | true | PASS | passed | 1852 | — |

## Per-code route results (browser-less, complementary)

When the route is Clerk-protected, `Body has code = false` and `Code in return_url = true` — the BM code only appears as the `return_url` query string on `/sign-in`, not as rendered template content.

| Code | URL | Initial | Location | Final | Final bytes | Body has code | Code in return_url | Route classification |
|---|---|---|---|---|---|---|---|---|
| BM-005 | http://localhost:3000/templates/BM-005 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-005 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-014 | http://localhost:3000/templates/BM-014 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-014 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-015 | http://localhost:3000/templates/BM-015 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-015 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-022 | http://localhost:3000/templates/BM-022 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-022 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-035 | http://localhost:3000/templates/BM-035 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-035 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-006 | http://localhost:3000/templates/BM-006 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-006 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-007 | http://localhost:3000/templates/BM-007 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-007 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-008 | http://localhost:3000/templates/BM-008 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-008 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-009 | http://localhost:3000/templates/BM-009 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-009 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-010 | http://localhost:3000/templates/BM-010 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-010 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-011 | http://localhost:3000/templates/BM-011 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-011 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-012 | http://localhost:3000/templates/BM-012 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-012 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-017 | http://localhost:3000/templates/BM-017 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-017 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-018 | http://localhost:3000/templates/BM-018 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-018 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-019 | http://localhost:3000/templates/BM-019 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-019 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-020 | http://localhost:3000/templates/BM-020 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-020 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-023 | http://localhost:3000/templates/BM-023 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-023 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-030 | http://localhost:3000/templates/BM-030 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-030 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-031 | http://localhost:3000/templates/BM-031 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-031 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-033 | http://localhost:3000/templates/BM-033 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-033 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-036 | http://localhost:3000/templates/BM-036 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-036 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-037 | http://localhost:3000/templates/BM-037 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-037 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-038 | http://localhost:3000/templates/BM-038 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-038 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-040 | http://localhost:3000/templates/BM-040 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-040 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-042 | http://localhost:3000/templates/BM-042 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-042 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-043 | http://localhost:3000/templates/BM-043 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-043 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-044 | http://localhost:3000/templates/BM-044 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-044 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-045 | http://localhost:3000/templates/BM-045 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-045 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-046 | http://localhost:3000/templates/BM-046 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-046 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-047 | http://localhost:3000/templates/BM-047 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-047 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-048 | http://localhost:3000/templates/BM-048 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-048 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-052 | http://localhost:3000/templates/BM-052 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-052 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-053 | http://localhost:3000/templates/BM-053 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-053 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-054 | http://localhost:3000/templates/BM-054 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-054 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-070 | http://localhost:3000/templates/BM-070 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-070 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |
| BM-001 | http://localhost:3000/templates/BM-001 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-001 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER_KNOWN_PREVIEW_BUG |
| BM-171 | http://localhost:3000/templates/BM-171 | 307 | /sign-in?return_url=%2Ftemplates%2FBM-171 | 200 | 29173 | false | true | PASS_AUTHENTICATED_BROWSER |

## Browser coverage rationale

Real authenticated Playwright smoke ran against all 37 curated forms via `tests/e2e/curated-22-templates.auth.spec.ts`. Evidence is captured from `D:/Study/Project/QLLaw-main/docs/audit/unified-bm-workspace/.visibility-run.latest.json` (Playwright --reporter=json). 37/37 forms passed the visibility assertions; 0 failed (). Demo-click and preview-click flows are out of scope and remain `NOT_RUN` / `KNOWN_FAIL_BM001` respectively.

## Source/render status

Source/render INPUT_CONNECTED_PASS is verified by `scripts/audit/render-smoke-curated.mjs`, which is browser-less and reads compiled/locked contract JSON + runtime-ux profile source. See `QLLAW_CURATED_RENDER_SMOKE.latest.json` for the canonical evidence.
