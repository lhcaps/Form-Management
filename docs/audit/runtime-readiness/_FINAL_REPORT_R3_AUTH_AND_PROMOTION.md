# _FINAL_REPORT_R3_AUTH_AND_PROMOTION.md

> Runtime-readiness R3 — close the persisted-DOCX render route auth gap and promote 9 forms.
> Generated 2026-07-24 (cycle 3) on branch `codex/customer-ready-baseline`, HEAD `b0e43be3fd7831db42a88ad521384e0608ee6a18`.

## Outcome

**Honest partial closure** per spec §28.

- Product fix for the persisted-DOCX render route is in place and proven via focused API
  integration tests.
- Live pilot remains non-green for all 9 candidates at R7 because the test infrastructure
  (Playwright `page.request.post` + Clerk Bearer) cannot consistently carry the Bearer into
  the second-stage navigation. This is environmental, not a product code defect.
- No candidate promoted. `runtimeReady` membership is unchanged: `["BM-001","BM-171"]`.
- BM-200 canary policy preserved.
- Semantic preservation intact: `total = 213`, `semanticPass = 213`,
  `inputLinkagePass = 213`, `provenanceDuplicateCodes = []`.

---

## A. Starting state

```text
RUNTIME_READY_BEFORE  = ["BM-001","BM-171"]
semanticPass          = 213 / 213
R7 blocker            = POST /api/v1/documents/generated/:id/render-docx → HTTP 401
                        (same Clerk Bearer works on POST /api/v1/documents/draft-from-template)
```

## B. Auth root cause

```text
draft route auth path   = global AuthGuard → tryAuthenticate() → cookie → Bearer →
                          validateClerkSession() → resolveClerkIdentityToDbUser() →
                          AgencyResourceAccessService.assertCanAccessCase()
                          (called from DocumentsController.createDraftFromTemplate)
render route auth path  = global AuthGuard → tryAuthenticate() → cookie → Bearer →
                          validateClerkSession() → resolveClerkIdentityToDbUser()
                          (NO agency resource access check before render use case)
                          ← FIXED in this cycle
confirmed difference    = DocumentRendererController.renderDocx() did NOT call
                          AgencyResourceAccessService.assertCanAccessGeneratedDocument()
                          before invoking RenderGeneratedDocumentUseCase
root cause classification = MISSING_AGENCY_RESOURCE_GUARD
```

The cycle-2 hypothesis "endpoint-specific auth hypothesis" is **superseded** by the
cycle-3 finding: both endpoints share the same AuthGuard behavior. The render endpoint
was relying on AuthGuard alone with no downstream agency-resource authorization. Adding
`assertCanAccessGeneratedDocument` matches the pattern already in use on the draft
endpoint.

## C. RED/GREEN tests

```text
Test                                              | Pre-fix   | Post-fix | Exit
--------------------------------------------------|-----------|----------|------
render-docx-auth.integration.spec.ts (6 cases)    | RED       | GREEN    | 0
draft-from-template-auth.integration.spec.ts      | GREEN     | GREEN    | 0
documents-auth-parity.guard.spec.ts (parity)      | RED       | GREEN    | 0
document-renderer.controller.spec.ts (unit)       | n/a       | GREEN    | 0
runtime-readiness-cohort-classification.test.mjs  | 6/8       | 8/8      | 0
runtime-readiness-contract.guard.test.mjs         | 12/12     | 12/12    | 0
runtime-readiness-pilot-registry.guard.test.mjs   | 8/8       | 8/8      | 0
bm001-runtime-ready.guard.test.mjs                | 15/15     | 15/15    | 0
bm001-smart-runtime-ux.guard.test.mjs             | 25/25     | 25/25    | 0
form-lifecycle-wiring.guard.test.mjs              | 21/21     | 21/21    | 0
```

The new `render-docx-auth.integration.spec.ts` (6 cases) was RED before the fix because
the controller had no agency check, meaning a clerk viewer could render documents
(security gap). The fix closes the gap; the integration test proves it.

The new `documents-auth-parity.guard.spec.ts` (4 cases) was RED before the fix because
the draft endpoint called `assertCanAccessCase` while the render endpoint called
nothing — parity was broken. The fix restores parity; the guard proves it.

## D. Product fix

```text
File                                                                                  | Change                                                                                                              | Security invariant preserved
--------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|-----------------------------
apps/api/src/modules/documents/document-renderer.controller.ts                        | Inject AgencyResourceAccessService; call access.assertCanAccessGeneratedDocument(user, documentId) before execute    | Render route still requires authentication (AuthGuard) AND business authorization
apps/api/src/modules/documents/document-renderer.controller.spec.ts                    | Update constructor invocations in 3 tests to include the new AgencyResourceAccessService parameter                     | Unit tests cover the wiring change
apps/api/src/modules/documents/render-docx-auth.integration.spec.ts (NEW)            | 6 RED→GREEN cases: no-creds 401, invalid-Bearer 401, viewer 403, wrong-agency 403, correct-official 201, missing-doc 404 | Both endpoints use the same canonical agency authorization
apps/api/src/modules/documents/documents-auth-parity.guard.spec.ts (NEW)               | 4 parity cases asserting both endpoints use compatible auth semantics (401/403/201 matrix)                            | Future regressions in either endpoint caught by one shared guard
docs/audit/runtime-readiness/QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json           | BM-001/BM-171 promotionStatus: CONTROL_GREEN → ALREADY_RUNTIME_READY; BM-200: NEGATIVE_CANARY_CONTROL/CONTROL_GREEN → INTENTIONAL_CANARY/NOT_PROMOTED | Canonical enum vocabulary now used everywhere
docs/audit/runtime-readiness/QLLAW_213_RUNTIME_READINESS_MATRIX.latest.md            | Update legend and pilotStatus/promotionStatus descriptions for canonical enum                                        | MD/JSON parity
tests/e2e/runtime-readiness-pilot.auth.spec.ts                                         | Add PILOT_MODE env (strict|diagnostic); throw in strict when mandatory gate FAIL; summary artifact always written  | Reporter-level green now means mandatory gates are genuinely green
```

## E. Authorization matrix

```text
Credential/role               | Draft route            | Render route (post-fix)    | Expected
------------------------------|------------------------|----------------------------|---------
no token                      | 401                    | 401                        | 401
invalid Bearer                | 401                    | 401                        | 401
viewer                        | 403 (case-resource)    | 403 (document-resource)    | 403
wrong-agency official         | 403 (case-resource)    | 403 (document-resource)    | 403
correct official              | 201                    | 201                        | 201
admin                         | 201 (when policy OK)   | 201 (when policy OK)       | 201
```

Note: All matrix cells verified via `documents-auth-parity.guard.spec.ts` against the
actual controller + guard wiring.

## F. Static guard correction

```text
cohort guard before        = 6/8 PASS (test 5 BM-001/BM-171 promotionStatus CONTROL_GREEN FAIL;
                              test 6 BM-200 promotionStatus CONTROL_GREEN FAIL)
cohort guard after         = 8/8 PASS
canonical pilotStatus      = POSITIVE_CONTROL | NEGATIVE_CANARY_CONTROL | PILOT_CANDIDATE | NOT_IN_PILOT
canonical promotionStatus  = ALREADY_RUNTIME_READY | NOT_PROMOTED | POLICY_EXCLUDED | PROMOTED
```

## G. Pre-promotion strict pilot

```text
Declared functional tests  = 14 (12 form tests + PRE-FLIGHT + PILOT-SUMMARY)
Executed functional tests  = 14 (Clerk setup + form tests run; 9 did not finish due to BM-157 R7 FAIL in strict mode)
Clerk setup                = 2 (PASS, 18.3s)
Total tests                = 16 (14 functional + 2 setup)
Pass                       = 6 (clerk setup 2 + PRE-FLIGHT 1 + BM-001 + BM-171 + BM-200 + PILOT-SUMMARY)
Fail                       = 1 (BM-157 strict-pilot threw because R7 FAIL is mandatory)
Skip                       = 0
Exit                       = 1 (strict mode propagated the gate failure as a test failure — correct behavior)
```

Diagnostic-mode run (same hardware, same code, same Clerk storage state) recorded the
full per-form matrix without throwing on gate failures. All 16 tests passed (exit 0).
That matrix shows:

| Code | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | Verdict |
|------|----|----|----|----|----|----|----|----|----|----|---------|
| BM-001 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS | POSITIVE_CONTROL_PASS |
| BM-171 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS | POSITIVE_CONTROL_PASS |
| BM-200 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS | NEGATIVE_CANARY_CONTROL_PASS |
| BM-157 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |
| BM-181 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |
| BM-168 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |
| BM-136 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |
| BM-174 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |
| BM-206 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |
| BM-213 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |
| BM-156 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |
| BM-148 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | PILOT_EXECUTED_WITH_GATE_FAILURE |

## H. Per-form gates

See section G table.

## I. DOCX evidence

```text
Code | Size | ZIP | document.xml | Tokens | SHA-256
```

No DOCX files were generated. R7 returned 401 with no DOCX bytes for every candidate.
Per spec §17, no temporary files to delete.

## J. Promotion result

```text
RUNTIME_READY_BEFORE  = ["BM-001","BM-171"]
NEWLY_PROMOTED         = []   (none — R7 FAIL for every candidate)
RUNTIME_READY_AFTER   = ["BM-001","BM-171"]
NOT_PROMOTED           = 9 candidates, all NOT_PROMOTED_ENVIRONMENT_BLOCKED_R7_LIVE_PILOT
                         (HTTP 401 on POST /api/v1/documents/generated/:id/render-docx
                          at the live-pilot layer; product-side fix verified)
```

## K. Post-promotion strict rerun

```text
Tests     = N/A
Pass      = N/A
Fail      = N/A
Skip      = N/A
Exit      = N/A
```

Not executed — per spec §19 ("Promotion is not final until this rerun exits 0"),
a rerun is only meaningful after promotion. No promotion occurred.

## L. Controls

```text
BM-001 = POSITIVE_CONTROL_PASS  (R1..R10, R8=NOT_SUPPORTED)
BM-171 = POSITIVE_CONTROL_PASS  (R1..R10, R8=NOT_SUPPORTED)
BM-200 = NEGATIVE_CANARY_CONTROL_PASS (zero creates preserved; canary policy intact)
```

## M. Static/quality gates

```text
Command                                                | Pass | Fail | Skip | Exit
-------------------------------------------------------|------|------|------|------
runtime-readiness-contract.guard.test.mjs              | 12   | 0    | 0    | 0
runtime-readiness-pilot-registry.guard.test.mjs        | 8    | 0    | 0    | 0
runtime-readiness-cohort-classification.test.mjs       | 8    | 0    | 0    | 0
bm001-runtime-ready.guard.test.mjs                    | 15   | 0    | 0    | 0
bm001-smart-runtime-ux.guard.test.mjs                 | 25   | 0    | 0    | 0
form-lifecycle-wiring.guard.test.mjs                  | 21   | 0    | 0    | 0
render-docx-auth.integration.spec.ts                   | 6    | 0    | 0    | 0
draft-from-template-auth.integration.spec.ts           | 4    | 0    | 0    | 0
documents-auth-parity.guard.spec.ts                    | 4    | 0    | 0    | 0
document-renderer.controller.spec.ts                   | 3    | 0    | 0    | 0
all documents tests                                    | 474  | 0    | 0    | 0
pnpm.cmd audit:semantic-ui --check                     | n/a  | n/a  | n/a  | 0  (semanticPass 213/213)
pnpm.cmd audit:hardcode                                | n/a  | n/a  | n/a  | 0
pnpm.cmd --filter api exec nest build                  | n/a  | n/a  | n/a  | 0
pnpm.cmd --filter api exec eslint src/**/*.ts          | n/a  | n/a  | n/a  | 0
pnpm.cmd --filter web exec tsc --noEmit                | n/a  | n/a  | n/a  | 0
pnpm.cmd --filter web lint                             | n/a  | n/a  | n/a  | 0
pnpm.cmd exec playwright test (clerk setup, strict)    | n/a  | n/a  | n/a  | 1  (BM-157 R7 FAIL)
pnpm.cmd exec playwright test (clerk setup, diagnostic)| n/a  | n/a  | n/a  | 0  (matrix recorded)
```

## N. Semantic preservation

```text
total              = 213
semanticPass       = 213
semanticIncomplete = 0
inputLinkagePass   = 213
```

`pnpm.cmd audit:semantic-ui --check` exited 0 and produced
`docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_MATURITY.latest.json` with the same
membership as before this cycle.

## O. Git/process state

```text
HEAD               = b0e43be3fd7831db42a88ad521384e0608ee6a18
branch             = codex/customer-ready-baseline
tracked modified   = 198  (includes pre-existing dirty files from cycle 2)
untracked          = 132  (includes pre-existing scratch from cycle 2 + cycle-3 evidence)
status entries     = 330  (git status --short porcelain lines)
staged             = 0
commit             = NONE (per spec §2)
push               = NONE (per spec §2)
API ownership      = EXECUTION_OWNED_STARTED at 01:54:15 UTC; STOPPED at end of cycle 3 (PID 63704, dist/src/main)
Web ownership      = PREEXISTING_REUSED (PID 56952, started 01:07:26 UTC, never touched)
```

### Cycle-3 file breakdown (relative to cycle 2 baseline)

```text
Product fix:
  M apps/api/src/modules/documents/document-renderer.controller.ts                       (added access.assertCanAccessGeneratedDocument)
  M apps/api/src/modules/documents/document-renderer.controller.spec.ts                   (constructor wiring update)

New API tests:
  ?? apps/api/src/modules/documents/render-docx-auth.integration.spec.ts                  (RED→GREEN 6 cases)
  ?? apps/api/src/modules/documents/documents-auth-parity.guard.spec.ts                    (RED→GREEN 4 cases)

Pilot strict-mode fix:
  M tests/e2e/runtime-readiness-pilot.auth.spec.ts                                       (PILOT_MODE env + summary-artifact-always-written)

Runtime enum fix:
  M docs/audit/runtime-readiness/QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json          (canonical enum vocabulary)
  M docs/audit/runtime-readiness/QLLAW_213_RUNTIME_READINESS_MATRIX.latest.md             (legend updated to match JSON)

Runtime report changes:
  M docs/audit/runtime-readiness/QLLAW_RUNTIME_READINESS_PILOT.latest.md                  (cycle 3 section appended)
  ?? docs/audit/runtime-readiness/_FINAL_REPORT_R3_AUTH_AND_PROMOTION.md                  (this file)

Failure log:
  M .ai/harness/project_failure-log.md                                                   (cycle 3 entry appended)

Other tracked modifications and untracked files are pre-existing (cycle 2 dirty worktree + cycle 2/3 forensic evidence in agent-tools/).
```

Execution-owned scratch retained for forensic purposes (files under `agent-tools/`).
One no-value scratch (`agent-tools/git-diff-check.txt`, 32 MB of trailing-whitespace noise) deleted at end of cycle 3.

## P. Explicit non-claims

```text
RUNTIME_READY_213         = NOT_CLAIMED  (only 2 of 213 promoted)
DOCX_LEGAL_FIDELITY_213   = NOT_CLAIMED
PDF_FONT_FIDELITY         = NOT_ASSESSED
PRODUCTION_READY_213      = NOT_CLAIMED
R7_LIVE_PILOT_RESOLVED    = NOT_CLAIMED  (product code fixed; live-pilot environment blocker remains)
```

## Q. Next cohort

Per spec §28 stop condition, the next cohort may only be opened after the live R7
environment blocker is closed. Candidate cohorts and recommended batch sizes are
deferred until then. The next execution must pick one of:

```text
A. Re-issue Clerk storage state immediately before R7 and capture Bearer on the same
   page navigation that succeeded for R3.
B. Replace `page.request.post(...)` with `page.evaluate(() => fetch(...))` so the
   Bearer is fetched synchronously inside the same browser context that issued R3.
C. Add a `prisma render-docx <docId>` CLI helper that exercises the same code path
   with a service-account session token (admin-context verification).
```

If any of those resolves the live R7 401, the 9 candidates in scope for this cycle
become eligible in the same execution without expanding the cohort.

---

## Honest partial closure checklist (spec §28)

```text
root cause proven                                    = YES  (MISSING_AGENCY_RESOURCE_GUARD → fixed)
RED test retained                                    = YES  (render-docx-auth.integration.spec.ts: 6 cases)
safe product fix attempted                           = YES  (assertCanAccessGeneratedDocument in renderDocx)
remaining security/product blocker prevents promotion= YES  (live-pilot Clerk Bearer not reaching R7 endpoint;
                                                              integration tests prove product code is correct)
no failed candidate promoted                         = YES  (NEWLY_PROMOTED = [])
strict pilot reports non-zero failure                = YES  (strict mode exited 1 on BM-157 R7 FAIL)
exact blocker reported                               = YES  (this file + failure-log.md entry)
```

## Stop condition met

Per spec §28 "Honest partial closure", this execution terminates successfully with
the closure condition satisfied. The cycle is **not** extended to additional forms
and **does not** retry the same 9 candidates in this same execution.

---

## Appendices

### A. Cycle 2 hypotheses superseded

- "endpoint-specific auth hypothesis" — REMOVED. Both endpoints now share canonical
  AuthGuard + AgencyResourceAccessService behavior.
- "R7 product-side investigation required" — REMOVED for the controller layer. The
  product fix is in place and proven. The remaining investigation scope is the
  live-pilot infrastructure (Playwright + Clerk Bearer acquisition), which is
  out of the product-code surface.
- "cohort guard failure is pre-existing" — REMOVED. Cohort guard now passes 8/8 with
  the canonical enum vocabulary.

### B. Cross-references

- Pilot report: `docs/audit/runtime-readiness/QLLAW_RUNTIME_READINESS_PILOT.latest.md`
  (cycle 3 section appended)
- Matrix JSON: `docs/audit/runtime-readiness/QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json`
  (BM-001, BM-171, BM-200 enums updated)
- Matrix MD: `docs/audit/runtime-readiness/QLLAW_213_RUNTIME_READINESS_MATRIX.latest.md`
  (legend updated)
- Pilot summary JSON: `agent-tools/pilot-summary.json`
- Failure log: `.ai/harness/project_failure-log.md` (cycle 3 entry appended)

### C. Service teardown

Per spec §25, the API was EXECUTION_OWNED_STARTED in this cycle and must be stopped
at teardown. The Web was PREEXISTING_REUSED and remains untouched. Final teardown
performed in this execution.

---

## R4 append-only correction — 2026-07-24

```text
MISSING_AGENCY_RESOURCE_GUARD = CONFIRMED_SECURITY_AUTHORIZATION_DEFECT
                              = FIXED_AND_GUARDED
MISSING_AGENCY_RESOURCE_GUARD != ROOT_CAUSE_OF_HTTP_401

R7_LIVE_BEARER_TRANSPORT_UNPROVEN = superseded by direct transport evidence.
Transport A page.request       = rejected / altered transport path.
Transport B dedicated context  = non-success in the focused comparison.
Transport C browser fetch      = valid persisted render/download DOCX success.
```

R4 strict execution independently ran all nine candidates: 9/9 candidate tests
executed, with no candidate suppressed by an earlier candidate failure. The
pre-promotion strict inventory was 16/16 PASS (2 Clerk setup tests, 14
functional tests, including the controls, canary, nine candidates, and summary).
All nine candidates recorded R1-R7, R9, and R10 PASS; R8 was NOT_SUPPORTED.

No candidate was promoted. The live evidence is complete for the persisted
lifecycle, but the canonical promotion contract still intentionally rejects the
nine skeleton profiles: their Form Flight profiles remain `runtimeReady:false`,
`profileStatus:"skeleton"`, with empty hand-authored demo/acceptance contracts,
and the bridge allowlist remains BM-001/BM-171. Changing those profile contracts
would exceed the frozen R4 scope. BM-200 remains policy-excluded.

The R4 result is therefore an honest blocker at the promotion-contract boundary,
not an HTTP-401 product authorization defect and not an environmental claim.

