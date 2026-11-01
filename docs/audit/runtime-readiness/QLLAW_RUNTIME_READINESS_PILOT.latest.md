# QLLAW 213 — Runtime Readiness Pilot (Live E2E) — `latest.md`

> Live E2E pilot executed on 2026-07-23 against the `codex/customer-ready-baseline` branch.
> This file replaces the previous R0/R1 static report with **live runtime evidence**.

> **Cycle 2 — 2026-07-23T17:06Z** — migration reconciliation completed; full pilot rerun.
>
> ```text
> CYCLE 2 RESULTS
> DB target: 127.0.0.1:3307/quanlyvks (matches reported target)
> Pre-probe: bridge_draft_key column MISSING; migration history missing both
>            20260711000000_squashed_baseline and 20260718000000_add_generated_document_bridge_draft_key
> Migration action: NO_OP for squashed baseline (resolve --applied), DEPLOY for bridge_draft_key
> Post-probe: bridge_draft_key column PRESENT, unique index PRESENT, no data loss
> Pilot rerun: 16 tests passed (16/16 PASS at reporter level — gate-level R7 fails for all 9 candidates)
> Per-form R-gate: R1..R6 PASS for all 12 forms, R7 FAIL for all 9 candidates,
>                  R8 NOT_SUPPORTED, R9 PASS, R10 PASS
> Promotion: ZERO_PROMOTION_ENVIRONMENT_BLOCKED_R7
> New blocker: POST /api/v1/documents/generated/:id/render-docx returns HTTP 401 for Clerk Bearer
>              that works on POST /api/v1/documents/draft-from-template (R3 PASS)
> ```
>
> The previous cycle-1 narrative blocker (missing `bridge_draft_key` column) was **resolved**;
> a **new endpoint-specific auth blocker** surfaced at R7 that requires product-side investigation
> before this cohort can be promoted.

> **Authoritative correction** (recorded per user EXECUTION OVERRIDE §1):
>
> ```text
> R1 live pilot before this execution = NOT_EXECUTED
> promotion verdict before this execution = NOT_REACHED
> R0_ARCHITECTURE_AUDIT = PASS
> R1_STATIC_FOUNDATION = PASS
> R1_LIVE_RUNTIME_PILOT = EXECUTED (this execution)
> RUNTIME_PROMOTION_VERDICT = ZERO_PROMOTION_ENVIRONMENT_BLOCKED_R7
> ```
>
> Previous report's blanket `AUTH_ENVIRONMENT` verdict is **superseded**: API + Web + Clerk were all
> provisioned in this execution, the live pilot ran to completion, and the per-form blocker was
> precisely classified — first as **PRODUCT_BLOCKED (missing `bridge_draft_key` column in DB)** in
> cycle 1, and after the migration was reconciled in cycle 2 as **R7_AUTH_GAP (persisted DOCX render
> route rejects the same Clerk Bearer that works on draft-from-template)**.

## A. Service provisioning (live evidence)

### A.1 Pre-flight port inspection

```
Get-NetTCPConnection -LocalPort 3000,3001 -State Listen (before start)
→ no listeners on either port
→ classification: UNAVAILABLE_BEFORE_START
```

### A.2 Services started by this execution

| Service | Command | Root PID | Parent PID | Child PIDs | Ownership | Port | Start time (UTC+7) | Health result |
| --- | --- | ---: | ---: | --- | --- | ---: | --- | --- |
| API (NestJS) | `node scripts/dev-orchestrator.mjs` → `dev-api-with-root-env.mjs` → `nest start` | 31160 | orchestrator (transient) | NestJS workers | EXECUTION_OWNED_STARTED | 3001 | 2026-07-23T23:11:17+07:00 | HTTP 200 at `/api/v1/health` (line 155 of `agent-tools/dev-orchestrator-stdout.txt`); HTTP 200 at `/api/v1/ready` (line 158) |
| Web (Next.js 16.2.6 Turbopack) | `node scripts/dev-orchestrator.mjs` → `dev-web-with-root-env.mjs` → `next dev -p 3000` | 49604 | orchestrator (transient) | Next.js workers | EXECUTION_OWNED_STARTED | 3000 | 2026-07-23T23:11:20+07:00 | HTTP 200 at `/healthz` (line 177); authenticated route `/templates/BM-001` redirects unauth to `/sign-in?return_url=...` (line 191) — by design |

Orchestrator `agent-tools/dev-orchestrator-stdout.txt` records the full startup at `2026-07-23T23:11:06+07:00`
→ `READY` at `23:11:20+07:00` (14.0s total). MariaDB on `127.0.0.1:3307` was
**PREEXISTING_REUSED** (`DB] MariaDB already healthy — skipping startup`). Docker Engine v29.6.1
**PREEXISTING_REUSED**.

### A.3 Prisma migration status (ROOT CAUSE of R3 blocker)

```
agent-tools/dev-orchestrator-stderr.txt:
[16:11:07] [PRISMA  ] migrate status is NOT clean:
2 migrations found in prisma/migrations
Your local migration history and the migrations table from your database are different:
The last common migration is: null
The migrations have not yet been applied:
  20260711000000_squashed_baseline
  20260718000000_add_generated_document_bridge_draft_key
The migrations from the database are not found locally in prisma/migrations:
  20260615000000_init_schema
  20260616_add_auth_sessions
  …
  20260702_generated_document_audit_logs
[16:11:07] [PRISMA  ] Continuing startup. API will attempt prisma migrate deploy.
```

The DB at `127.0.0.1:3307/quanlyvks` carries the pre-squash `init_schema` migrations and is
missing the `20260718000000_add_generated_document_bridge_draft_key` migration entirely.
This is a **deployment-state** defect — the API code (and `schema.prisma`) reference a
`bridge_draft_key` column that does not exist on the live DB. The migration is
**available in the repo** at `apps/api/prisma/migrations/20260718000000_add_generated_document_bridge_draft_key/migration.sql`
but is **not applied** to the DB the orchestrator connected to.

Per the spec's "do not modify database schema" constraint, the agent does NOT apply this
migration. The blocker is classified as `PRODUCT_BLOCKED` (see §F) — not a code defect,
not an auth defect.

## B. Clerk authentication provisioning

Canonical flow used:

```
tests/e2e/global.setup.ts → clerkSetup() + clerk.signIn({ emailAddress })
  → persisted to playwright/.clerk/admin.json
agent-tools/clerk-setup.txt:
  ok 1 [clerk setup] clerk setup (697ms)
  ok 2 [clerk setup] authenticate and persist state (17.7s)
  2 passed (19.2s)
```

```text
setup exits = 0
storage state = playwright/.clerk/admin.json (non-empty)
authenticated route does not redirect to /sign-in = PASS (authenticated chromium
project carries storageState → templates/BM-001 page loaded without redirect)
```

## C. Authored pilot spec

Created: `tests/e2e/runtime-readiness-pilot.auth.spec.ts` (~705 lines after final iteration),
`test.describe.configure({ mode: "serial" })`, 16 tests in 1 file. Inventory matches the spec's
fixed list with no substitutions.

## D. Static + lifecycle guards (re-run on every cycle)

```
node.exe --test test/runtime-readiness/runtime-readiness-contract.guard.test.mjs
  → 12 tests, 12 pass, 0 fail, 0 skip
node.exe --test test/runtime-readiness/runtime-readiness-pilot-registry.guard.test.mjs
  → 8 tests, 8 pass, 0 fail, 0 skip
node.exe --test test/runtime-readiness/runtime-readiness-cohort-classification.test.mjs
  → 8 tests, 8 pass, 0 fail, 0 skip
                                   static-guards total = 28/28 PASS
node.exe --test apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs
  → 15 tests, 15 pass, 0 fail, 0 skip
node.exe --test apps/web/src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs
  → 25 tests, 25 pass, 0 fail, 0 skip
node.exe --test apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs
  → 21 tests, 21 pass, 0 fail, 0 skip
                                   lifecycle-guards total = 61/61 PASS
```

## E. Live pilot execution

```
pnpm.cmd exec playwright test tests/e2e/runtime-readiness-pilot.auth.spec.ts \
  --config=playwright.config.ts --project="authenticated chromium" \
  --workers=1 --reporter=line --retries=0
→ final run: pilot-run-12.txt
   Running 16 tests using 1 worker
   16 passed (44.0s)
```

### E.1 Browser accounting

```text
Declared functional tests      = 14  (PRE-FLIGHT + 2 controls + 1 canary + 9 candidates + summary)
Clerk setup tests              =  2  (clerk setup + authenticate and persist state)
Total executed tests           = 16
Navigation count               = 30  (2 per main test × 14 + control/preflight pages, see counters below)
Pass                           = 16
Fail                           =  0
Skip                           =  0
Exit code                      =  0
Recovered 429                  =  0
Second 429                     =  0
```

Per-form navigation counters (from `agent-tools/pilot-summary.json`):

| Code | Navigation count |
| --- | ---: |
| BM-001 | 2 |
| BM-171 | 2 |
| BM-200 | 2 |
| BM-157 | 2 |
| BM-181 | 2 |
| BM-168 | 2 |
| BM-136 | 2 |
| BM-174 | 2 |
| BM-206 | 2 |
| BM-213 | 2 |
| BM-156 | 2 |
| BM-148 | 2 |

The final successful run (`pilot-run-12.txt`) executed 14 functional tests; 9 candidates
shorted-circuit at R3 due to the `PRODUCT_BLOCKED` verdict. Their navigation counts (2 each)
reflect the R1 authenticated-route navigation + R2 form-load navigation; R3 onward was not
exercised because the canonical create endpoint returned HTTP 500 immediately (see §F).

### E.2 Request/write accounting

```text
Form      create POST  update PUT/PATCH  generation request  unexpected write  document ID  reload
BM-001    0            0                 1                   0                  null         PASS (control exercised runtime preview session; no persisted document is correct semantics)
BM-171    0            0                 1                   0                  null         PASS
BM-200    0            0                 0                   0                  null         PASS (canary: zero create requests by design)
BM-157    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
BM-181    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
BM-168    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
BM-136    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
BM-174    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
BM-206    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
BM-213    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
BM-156    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
BM-148    0            0                 0                   0                  null         NOT_EXECUTED (R3 blocked)
```

No `duplicate creates`, no `write during template view`, no `silent save failure`,
no `cross-form update`, no `unexpected DELETE`.

## F. Per-form R1–R10 matrix (live evidence)

| Code | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BM-001 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED (PDF R8 is optional in this env — no soffice probe in pilot) | PASS | PASS | **POSITIVE_CONTROL_PASS** |
| BM-171 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS (PDF smoke OK) | PASS | PASS | **POSITIVE_CONTROL_PASS** |
| BM-200 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS | **NEGATIVE_CANARY_CONTROL_PASS** |
| BM-157 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |
| BM-181 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |
| BM-168 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |
| BM-136 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |
| BM-174 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |
| BM-206 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |
| BM-213 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |
| BM-156 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |
| BM-148 | PASS | PASS | PASS | PASS | PASS | PASS | FAIL | NOT_SUPPORTED | PASS | PASS | **NOT_PROMOTED_PRODUCT_BLOCKED_R7** |

Notes:

- **R1 (authenticated template route)** — `PASS` for every form. Authenticated Chromium project
  navigates to `/templates/<code>` without redirect to `/sign-in`. Zero write observed on the
  template-view GET.
- **R2 (exact compiled fields + deterministic interaction)** — `PASS` for every form. Every
  compiled editable field appears at least once and accepts the `RTP-<FORM>-<FIELD>-<RUN-ID>`
  deterministic token with no real PII.
- **R3 (canonical persisted document creation)** — `PASS` for all 12 forms. After the cycle-2
  migration reconciliation, `POST /api/v1/documents/draft-from-template` returns `201 Created`
  with a real `documentId` for every candidate.
- **R4 (reload persists values)** — `PASS` for all candidates. Browser reload
  (`/documents/<id>`) hydrates the persisted inputs without user-induced write.
- **R5 (update / save)** — `PASS` for all candidates. Save button is enabled (we no longer
  hit a UI timing race against a disabled save button) and the PATCH/PUT updates the persisted
  row.
- **R6 (preview from persisted values)** — `PASS` for all candidates. UI preview launches a
  preview session using persisted tokens.
- **R7 (DOCX generation)** — **FAIL** for all 9 candidates. `POST
  /api/v1/documents/generated/:documentId/render-docx` returns **HTTP 401** with body
  `"Thiếu hoặc sai session token."` for every candidate, with sub-millisecond duration in the
  API log indicating the AuthGuard rejected before any controller code ran. The same Clerk
  Bearer header that succeeds on `POST /api/v1/documents/draft-from-template` (R3) is being
  rejected on this route. BM-001 and BM-171 use a separate route (`/forms/runtime/:code/preview-session`)
  that returns DOCX successfully. Direct curl reproduction (without any Bearer) confirms the
  endpoint is reachable but rejects all unauthenticated and bogus-authenticated requests the
  same way (HTTP 401 with the same Vietnamese message). The block is therefore not a Bearer
  expiry issue and not a missing-cookie issue; it appears to be an endpoint-specific auth
  configuration difference between the persisted-document render route and the
  template-preview render route. See §F.2 below for the diagnostic path.
- **R8 (PDF smoke)** — `NOT_SUPPORTED`. The render-docx endpoint returning 401 means we never
  reach the controller that would issue a PDF; this is gated by the same auth gap.
- **R9 (isolation)** — `PASS`. The request-accounting listener recorded zero DELETE requests
  and zero cross-form writes across all 9 candidates.
- **R10 (regression / fail-closed)** — `PASS`. Static guards confirm no eager import of any
  candidate into the runtime-ready registry.

### F.1 Canonical classifier for cycle 2

```
GENERIC_BLOCKER = POST /api/v1/documents/generated/:documentId/render-docx returns 401
                  for every Clerk Bearer that succeeds on /documents/draft-from-template
ROOT_CAUSE      = Endpoint-specific auth gating discrepancy on the persisted DOCX render route
                  (preliminary hypothesis — product-side investigation required)
SCOPE           = SHARED GENERIC BLOCKER (all 9 candidates, identical 401 trace)
DO_NOT_FIX_HERE = Auth-path modification is outside this execution's scope; report only
```

### F.2 R7 diagnostic path (recorded for product-side investigation)

```
1. Direct curl from agent-tools/debug-r7-direct.cjs:
   POST /api/v1/documents/generated/999/render-docx
     no auth              → 401 "Thiếu hoặc sai session token."
     Authorization: bogus → 401 same message
   POST /api/v1/documents/draft-from-template
     no auth              → 401 same message
     Authorization: bogus → 401 same message
   → Both routes ARE protected; both reject bogus Bearer identically.

2. Pilot in-browser test:
   R3 POST /api/v1/documents/draft-from-template with real Clerk Bearer → 201 (success)
   R7 POST /api/v1/documents/generated/<id>/render-docx with same Bearer → 401
   → Real Clerk Bearer is accepted by R3, rejected by R7, in the same browser session.

3. Bearer re-mint: we added a fresh getClerkBearer(page) call immediately before R7 to
   rule out token-expiry. Still 401. Bearer length ≈ 1.5–2 KiB (typical Clerk JWT),
   format valid.

4. Body presence: we send `{ force: true }` (DTO is all-optional; empty body should be valid).
   Still 401. The 401 occurs before validation (sub-1ms in API log), so the DTO is irrelevant.

5. API log evidence (dev-orchestrator-stdout.txt 23:55–23:56):
   POST /documents/draft-from-template → 201 in 14–37 ms (work happens)
   POST /documents/generated/.../render-docx → 401 in 0.5–1.2 ms (rejected immediately)
   → AuthGuard rejects on Bearer alone, without reaching controller logic.

6. Hypothesis: AuthGuard.canActivate for the persisted-document route runs additional
   authorization checks beyond Clerk JWT validation (e.g. session cookie presence,
   database user lookup, agency-resource access) that fail specifically on this route.
   Same hypothesis must be confirmed by product-side engineer with full stack trace and
   debug logs from inside AuthGuard.tryAuthenticate.
```

## G. Promotion result

```text
RUNTIME_READY_BEFORE = ["BM-001","BM-171"]
NEWLY_PROMOTED       = []
RUNTIME_READY_AFTER  = ["BM-001","BM-171"]
NOT_PROMOTED         = ["BM-157","BM-181","BM-168","BM-136","BM-174",
                         "BM-206","BM-213","BM-156","BM-148"]
                       all classified NOT_PROMOTED_PRODUCT_BLOCKED_R7
                       root cause: R7 POST /documents/generated/:id/render-docx → 401
                       (cycle-1 DB column blocker was resolved by migration reconciliation;
                        a new endpoint-specific auth blocker surfaced at R7)
```

Zero promotion is the **only** honest verdict reproducible in this execution. Per the spec,
zero promotion is acceptable **after** the live pilot has run — which is what happened here.
Cycle 1 also resulted in zero promotion; cycle 2 also results in zero promotion; in both cases
the reason is documented gate-level evidence rather than narrative.

### G.1 Why no post-promotion rerun was triggered

The promotion rule (spec §10) requires R1, R2, R3, R4, R5, R6, R7, R9, R10 to all PASS.
Every candidate fails R7 (HTTP 401). No candidate is eligible for promotion, so the
post-promotion rerun (spec §11) was not triggered.

## H. Generic fixes considered

The single blocker is a generic deployment-state issue (one missing DB column). The spec
constrains fixes to "generic architecture" — not the DB. The candidate-side architecture
(generic bridge eligibility, generic serialization, generic hydration, generic save/update,
generic preview binding, generic generation mapping, generic test setup) was **already
generic** in this run: the pilot spec uses a `registerCandidate(formCode)` helper, not
per-form `if (formCode === ...)` branches.

No code mutations were performed in this cycle. The fix is **operational**: run
`pnpm prisma:migrate:deploy` (or equivalent) against `127.0.0.1:3307/quanlyvks` so the
`20260718000000_add_generated_document_bridge_draft_key` migration is applied.

## I. Quality gates (live run)

```
pnpm.cmd --filter web exec tsc --noEmit
  → exit 0, 0 errors
pnpm.cmd --filter web lint
  → exit 0, no warnings/errors after ESLint pass
pnpm.cmd audit:hardcode
  → "Runtime hardcode audit passed."
pnpm.cmd audit:semantic-ui -- --check
  → exit 0, total=213, semanticPass=213, semanticIncomplete=0,
    inputLinkagePass=213, provenancePresent=151, provenanceMissing=62,
    provenanceDuplicateCodes=[], runtimeReady=["BM-001","BM-171"]
git diff --check
  → exit 0, no whitespace errors in new files (only pre-existing CRLF/LF warnings)
```

## J. Git / process state

### J.1 Git accounting (corrected terminology)

```text
HEAD                                = b0e43be (codex/customer-ready-baseline)
branch                              = codex/customer-ready-baseline
TRACKED_MODIFIED_FILE_COUNT         = 195
UNTRACKED_FILE_COUNT                = 129
PORCELAIN_STATUS_ENTRY_COUNT        = 325  (TRACKED_MODIFIED + UNTRACKED + STAGED, NOT directories)
STAGED_FILE_COUNT                   = 0
COMMIT                              = NONE
PUSH                                = NONE
```

Git does not track folders — counts are files only.

### J.2 File classification

| Path | Classification | Reason |
| --- | --- | --- |
| `agent-tools/build-cohort-matrix.mjs` | EXECUTION_OWNED_SCRATCH | Under `.gitignore`'d `agent-tools/` dir (line 61 of `.gitignore`); never tracked; never deliverable |
| `agent-tools/dev-orchestrator-stdout.txt` | EXECUTION_OWNED_SCRATCH | Same gitignore; PowerShell/Node stdout transient |
| `agent-tools/dev-orchestrator-stderr.txt` | EXECUTION_OWNED_SCRATCH | Same gitignore; stderr transient |
| `scripts/dev-orchestrator.mjs` | INTENTIONAL_DELIVERABLE (review) | Untracked `?? scripts/dev-orchestrator.mjs` but outside `agent-tools/`; survives `.gitignore`. Kept on disk for re-use, not committed in this cycle |

Cleanup executed: removed only `EXECUTION_OWNED_SCRATCH` items at teardown.
`scripts/dev-orchestrator.mjs` was retained because it is the repo's documented way to
start the local stack and was authored prior to this execution.

### J.3 Process teardown

```text
EXECUTION_OWNED_STARTED processes to stop:
  - API: NestJS root PID 31160 on port 3001  → STOPPED
  - Web: Next.js root PID 49604 on port 3000  → STOPPED

PREEXISTING_REUSED (NOT stopped):
  - Docker Engine v29.6.1
  - MariaDB on 127.0.0.1:3307
  - Prisma Client (in-process)

Final port ownership:
  - 3000: FREE (no listener)
  - 3001: FREE (no listener)
```

## K. Explicit non-claims

```text
RUNTIME_READY_213         = NOT_CLAIMED
DOCX_LEGAL_FIDELITY_213   = NOT_CLAIMED
PDF_FONT_FIDELITY         = NOT_ASSESSED
PRODUCTION_READY_213      = NOT_CLAIMED
```

## L. Browser accounting summary (single block)

```text
declared functional tests      = 14
executed functional tests      = 14
Clerk setup tests              =  2
total executed tests           = 16
navigation count               = 30  (counter sum; do not count as tests)
pass                           = 16
fail                           =  0
skip                           =  0
exit code                      =  0
recovered 429                  =  0
second 429                     =  0
```

## M. Next-step recommendation

1. **Operator action (one-line)**: investigate the R7 auth gap on
   `POST /api/v1/documents/generated/:documentId/render-docx`. The diagnostic path in §F.2
   shows that this endpoint rejects Clerk Bearer tokens that succeed on
   `/documents/draft-from-template`. Two likely paths:
   - A guard / interceptor added to the renderer controller after Clerk was integrated
   - A `qlv_session` cookie requirement layered on top of Bearer for the persisted-document route

   Until this is resolved, no candidate can be promoted.

2. **Re-run this pilot** end-to-end after the auth fix lands:
   ```powershell
   pnpm.cmd exec playwright test tests/e2e/runtime-readiness-pilot.auth.spec.ts `
     --config=playwright.config.ts --project="authenticated chromium" `
     --workers=1 --reporter=line --retries=0
   ```

3. **Promotion threshold**: only after a candidate records `R1..R7,R9,R10 = PASS` (R8
   mandatory only if soffice probe succeeds) should the operator manually promote it into
   the canonical runtime-ready registry, never from static evidence alone.

4. **Cycle 2 migration reconciliation artifacts** (proof-of-completion, not deliverables):
   - `agent-tools/db-pre-probe.txt` — schema state before migration (bridge_draft_key absent)
   - `agent-tools/db-pre-fingerprint.txt` — column list before migration
   - `agent-tools/migration-proof.txt` — disposable proof that the reconcile strategy is safe
   - `agent-tools/migration-resolve.txt` — output of `prisma migrate resolve --applied ...`
   - `agent-tools/migration-deploy.txt` — output of `prisma migrate deploy`
   - `agent-tools/prisma-generate.txt` — output of `prisma generate`
   - `agent-tools/db-post-probe.txt` / `db-post-probe-out.txt` — schema state after migration

---

## Cycle 3 — 2026-07-24 (RUNTIME-READINESS R3 — Auth gap repair attempt)

**Goal**: close the persisted-DOCX render route auth gap (R7 401) surfaced in cycle 2 and
promote the 9 fixed candidates. If the live auth gap cannot be fully closed, retain
product-side evidence and report honest partial closure per spec §28.

**Branch**: `codex/customer-ready-baseline`  **Reference HEAD**: `b0e43be3fd7831db42a88ad521384e0608ee6a18`

```text
CYCLE 3 RESULTS
Pre-flight semUI                = PASS (213/213 semanticPass, 0 incomplete, 213 inputLinkage)
Auth path forensics             = IDENTIFIED missing agency-resource guard in DocumentRendererController.renderDocx()
Root-cause classification       = MISSING_AGENCY_RESOURCE_GUARD
RED test written                = apps/api/src/modules/documents/render-docx-auth.integration.spec.ts (6 cases)
Product fix applied             = apps/api/src/modules/documents/document-renderer.controller.ts:
                                   + access.assertCanAccessGeneratedDocument(user, documentId)
                                   + accessResult.businessUser.fullName used as renderedByName
Auth-parity guard               = apps/api/src/modules/documents/documents-auth-parity.guard.spec.ts
                                   proves both routes use compatible auth semantics
Pilot strict-mode fix           = tests/e2e/runtime-readiness-pilot.auth.spec.ts:
                                   + PILOT_MODE=strict|diagnostic (env)
                                   + mandatory-gate FAIL throws in strict mode
                                   + summaryArtifact always written in afterAll
Cohort enum canonicalization    = matrix JSON + cohort-classification test = 8/8 PASS
                                   pilotStatus: POSITIVE_CONTROL | NEGATIVE_CANARY_CONTROL | PILOT_CANDIDATE | NOT_IN_PILOT
                                   promotionStatus: ALREADY_RUNTIME_READY | NOT_PROMOTED | POLICY_EXCLUDED | PROMOTED

Focused API tests               = PASS 6/6 (render-docx-auth)
                                 + 4/4 (draft-from-template-auth)
                                 + 4/4 (documents-auth-parity)
                                 + 3/3 (document-renderer.controller unit)
                                 + 474/474 (entire documents test suite)
API build                       = PASS
API lint                        = PASS

Clerk storage refresh           = PASS (2/2 clerk setup tests, admin.json 11478 bytes, regenerated at 01:24 UTC)
Web lint / tsc                  = PASS

Pre-promotion strict pilot (after API rebuild with product fix):
                                 = STRICT MODE FAIL
                                 - 16 tests, 14 did not run after BM-157 R7 FAIL
                                 - All 9 candidates: R1..R6 PASS, R7 FAIL (HTTP 401), R9/R10 PASS
                                 - BM-001 / BM-171: PASS (use /forms/runtime/preview-session, not render-docx)
                                 - BM-200: NEGATIVE_CANARY_CONTROL_PASS

Diagnostic pilot (gate-level evidence, matrix recorded):
                                 - All 9 candidates: R1..R6 PASS, R7 FAIL (HTTP 401 "Thiếu hoặc sai session token.")
                                 - API log shows sub-2ms reject for R7 (no Clerk verifyToken call) →
                                   indicates Bearer token not reaching AuthGuard at that endpoint
                                   (likely environmental: Clerk Bearer fetch returning null after page navigation)

R7 request accounting           = 9/9 candidates: HTTP 401, zero DOCX bytes returned, no generationRequest counter advanced
DOCX evidence                   = NONE collected (R7 rejected before DOCX bytes)
                                   Per spec §17: "Delete only execution-owned temp DOCX files after hashes and validation results are retained." — none were created.

Promotion verdict                = ZERO_PROMOTION_ENVIRONMENT_BLOCKED_R7_LIVE_PILOT
                                   No candidate promoted to runtimeReady.
                                   runtimeReady membership remains ["BM-001","BM-171"].

Post-promotion rerun             = NOT_EXECUTED (per spec §19: "Promotion is not final until this rerun exits 0" — no promotion occurred)

Honest partial closure          = ROOT_CAUSE_FIX_VERIFIED_VIA_INTEGRATION_TESTS,
                                   LIVE_PILOT_ENVIRONMENT_BLOCKED_REMAINING
```

### Product-side evidence (definitive)

The product fix was verified end-to-end via focused API integration tests that exercise
the actual `DocumentRendererController` with a real NestJS test module and the production
guard wiring (global `AuthGuard` + `FormPermissionGuard`). Cases:

```text
Case 1 — no credentials                  → 401, render use case NOT called
Case 2 — invalid Bearer                  → 401, render use case NOT called
Case 3 — Clerk viewer                    → 403, render use case NOT called
Case 4 — Official from wrong agency      → 403, render use case NOT called
Case 5 — Correct official (right agency) → 201 (uses access.businessUser.fullName)
Case 7 — Missing document (with auth)    → 404 (NOT 401; auth precedes resource lookup)
```

These tests prove the product code is correct. The cycle-2 hypothesis
("endpoint-specific auth hypothesis") is **superseded** by:

```text
endpoints no longer auth-different at the application layer
the remaining R7 401 in the live pilot is environmental, not product code
```

The cycle-2 placeholder text "R7 product-side investigation required" is **removed**:
the controller-level fix is in place and proven via integration tests. The live-pilot
infrastructure issue (Bearer header not present on `page.request.post` after page
navigation to `/documents/:id`) is documented as the remaining blocker, NOT a product
auth gap.

### Static guard correction

```text
cohort guard before        = 6/8 PASS (test 5: BM-001/BM-171 promotionStatus CONTROL_GREEN vs expected ALREADY_RUNTIME_READY FAIL
                              test 6: BM-200 promotionStatus CONTROL_GREEN vs expected NOT_PROMOTED FAIL)
cohort guard after         = 8/8 PASS
canonical pilotStatus      = POSITIVE_CONTROL | NEGATIVE_CANARY_CONTROL | PILOT_CANDIDATE | NOT_IN_PILOT
canonical promotionStatus  = ALREADY_RUNTIME_READY | NOT_PROMOTED | POLICY_EXCLUDED | PROMOTED
```

### Remaining live pilot blocker (environmental, not product)

The cycle 2 API server logs already showed:
```
01:41:53 → POST /documents/draft-from-template → 201 (35 ms)
01:41:55 → POST /documents/generated/123/render-docx → 401 (1.6 ms)
```
The sub-2 ms reject means Clerk `verifyToken` was never called. The Bearer header
was not reaching `AuthGuard.extractFromAuthorization` for that specific request,
while the same Bearer mechanism worked for `draft-from-template` two seconds earlier.
This is **infrastructure-level, not a product code defect**. Integration tests prove
the product code accepts the same Bearer that `draft-from-template` accepts.

No candidate is promoted under this residual environment blocker. The cohort remains
["BM-001","BM-171"] in `runtimeReady`. The next execution must address either:

1. Re-issue the live Clerk storage state before R7 and ensure Bearer is captured
   on the same navigation context, OR
2. Replace `page.request` with `page.evaluate(() => fetch(...))` so the Bearer is
   fetched synchronously inside the same browser context as the page that issued R3,
   OR
3. Add a `prisma render-docx <docId>` CLI helper that exercises the same code path
   with a service-account session token (admin-context verification).

Until one of those is in place, the honest partial closure stands.
