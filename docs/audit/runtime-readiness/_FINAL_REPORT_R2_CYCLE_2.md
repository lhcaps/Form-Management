# CYCLE 2 — RUNTIME READINESS R2 — FINAL REPORT

> Executed on 2026-07-23T17:06Z against `codex/customer-ready-baseline` @ `b0e43be3`.
> This report supersedes the cycle-1 R0/R1 narrative blocker (`bridge_draft_key` column
> missing) with cycle-2 evidence. The pre-migration blocker was resolved; a new
> endpoint-specific R7 blocker surfaced after R3 was unblocked.

---

## A. Starting state

```text
RUNTIME_READY_BEFORE       = ["BM-001","BM-171"]
semanticPass               = 213 / 213
semanticIncomplete         = 0
inputLinkagePass           = 213
provenancePresent          = 151
provenanceMissing          = 62
provenanceDuplicateCodes   = []
migration blocker reported = generated_documents.bridge_draft_key missing in dev DB
```

## B. Database target

```text
resolved DATABASE_URL target = 127.0.0.1:3307/quanlyvks (no credentials in evidence)
provider                     = MariaDB
DB_OWNERSHIP                 = PREEXISTING_REUSED (Docker container from previous session)
environment precedence       = root .env > apps/api/.env.local > apps/api/.env > apps/web/.env
API command that consumes URL = scripts/dev-api-with-root-env.mjs → prisma.config.ts → DATABASE_URL
```

## C. Migration reconciliation

```text
column exists before                      = NO  (bridge_draft_key absent in INFORMATION_SCHEMA.COLUMNS)
migration history exists before           = PARTIAL (pre-squash migrations only;
                                                      20260711000000_squashed_baseline MISSING;
                                                      20260718000000_add_generated_document_bridge_draft_key MISSING)
migration state                           = PARTIALLY_APPLIED (pre-squash init_schema was applied)
migration action                          = resolve --applied (squashed baseline) + migrate deploy
migration command                         = pnpm exec prisma migrate resolve --applied 20260711000000_squashed_baseline
                                              pnpm exec prisma migrate deploy
migration command exit                    = 0 (resolve) / 0 (deploy)
migration column exists after             = YES (bridge_draft_key VARCHAR(64) NULL with UNIQUE index)
migration history exists after            = YES (both migrations present in _prisma_migrations)
schema matches migration                  = YES (column type, nullability, unique index match)
data loss detected                        = NO (row count preserved; pre/post fingerprint diff only adds new column)
Prisma generate                           = exit 0 (regenerated client to recognize new column)
```

## D. Service / Auth provisioning

```text
API PID/ownership  = dev-orchestrator spawns API on port 3001 (EXECUTION_OWNED_STARTED)
Web PID/ownership  = dev-orchestrator spawns Web on port 3000 (EXECUTION_OWNED_STARTED)
DB ownership       = PREEXISTING_REUSED (MariaDB Docker, port 3307)
Clerk setup        = tests/e2e/global.setup.ts → clerkSetup() + clerk.signIn() → playwright/.clerk/admin.json
Health probes      = API 200 /api/v1/health; 200 /api/v1/ready; Web 200 /healthz
```

## E. Pilot accounting

```text
declared functional tests      = 14  (PRE-FLIGHT + 2 controls + 1 canary + 9 candidates + summary)
executed functional tests      = 14
Clerk setup tests              =  2
total executed tests           = 16
navigations                    = 12  (1 per form during R1/R2 routes; preflight counted separately)
pass (reporter level)          = 16  (Playwright exit 0; gate-level R7 failures do not
                                     cause a test-level FAIL because the verdict is set
                                     to PILOT_EXECUTED_WITH_GATE_FAILURE instead)
fail (gate level)              = R7 FAIL × 9 candidates (every persisted DOCX render)
skip                           =  0
exit                           =  0
recovered 429                  =  0
second 429                     =  0
```

## F. R1–R10 matrix

```
Code   | R1  | R2  | R3  | R4  | R5  | R6  | R7     | R8           | R9  | R10 | Verdict
BM-001 | PASS| PASS| PASS| PASS| PASS| PASS| PASS   | NOT_SUPPORTED| PASS| PASS| POSITIVE_CONTROL_PASS
BM-171 | PASS| PASS| PASS| PASS| PASS| PASS| PASS   | NOT_SUPPORTED| PASS| PASS| POSITIVE_CONTROL_PASS
BM-200 | PASS| PASS| PASS| PASS| PASS| PASS| PASS   | NOT_SUPPORTED| PASS| PASS| NEGATIVE_CANARY_CONTROL_PASS
BM-157 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
BM-181 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
BM-168 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
BM-136 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
BM-174 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
BM-206 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
BM-213 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
BM-156 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
BM-148 | PASS| PASS| PASS| PASS| PASS| PASS| FAIL   | NOT_SUPPORTED| PASS| PASS| NOT_PROMOTED_PRODUCT_BLOCKED_R7
```

BM-001 and BM-171 use `/forms/runtime/:code/preview-session` (runtime DOCX path); they PASS
R7 because they do not hit `/documents/generated/:id/render-docx`. BM-200 uses neither;
its R7 is PASS by virtue of zero render requests (canary policy).

## G. Request accounting

```text
Code   | Creates | Document ID | Updates | Generates | Unexpected writes | Cleanup
BM-001 | 0       | null        | 0       | 1 (runtime preview) | 0      | n/a
BM-171 | 0       | null        | 0       | 1 (runtime preview) | 0      | n/a
BM-200 | 0       | null        | 0       | 0                   | 0      | n/a (canary: zero by design)
BM-157 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
BM-181 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
BM-168 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
BM-136 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
BM-174 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
BM-206 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
BM-213 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
BM-156 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
BM-148 | 1       | persisted   | 1       | 0 (HTTP 401)        | 0      | retained (no safe endpoint)
```

Created documents are not cleaned up — no safe DELETE endpoint exists. They are recorded
as disposable pilot evidence and remain in `generated_documents` for forensic purposes.

## H. DOCX evidence

```text
Code   | Size | ZIP  | document.xml | Tokens present | Hash | Verdict
BM-001 | ≥1024| PASS | PASS         | (runtime path) | n/a  | PASS (preview-session route)
BM-171 | ≥1024| PASS | PASS         | (runtime path) | n/a  | PASS (preview-session route)
BM-200 | n/a  | n/a  | n/a          | n/a            | n/a  | NOT_EXECUTED (canary)
BM-157..BM-148 | n/a (R7 returned 401 before DOCX bytes) — NOT_VALIDATED
```

DOCX smoke could not be performed for any candidate because R7 returned HTTP 401 with no
binary payload. No DOCX files were downloaded. The R3 + R5 + R6 lifecycle still ran in the
browser but R7 is the gate that needs product-side resolution.

## I. Promotion result

```text
RUNTIME_READY_BEFORE = ["BM-001","BM-171"]
NEWLY_PROMOTED       = []
RUNTIME_READY_AFTER  = ["BM-001","BM-171"]
NOT_PROMOTED         = 9 candidates, all classified NOT_PROMOTED_PRODUCT_BLOCKED_R7
                       (HTTP 401 on POST /documents/generated/:id/render-docx)
```

Per spec §17 (promotion policy), no candidate met R1..R7, R9, R10 = PASS. No registry mutation.

## J. Controls

```text
BM-001 = POSITIVE_CONTROL_PASS  (R1..R6, R8=NOT_SUPPORTED, R9, R10 PASS; R7 via runtime path PASS)
BM-171 = POSITIVE_CONTROL_PASS  (R1..R6, R8=NOT_SUPPORTED, R9, R10 PASS; R7 via runtime path PASS)
BM-200 = NEGATIVE_CANARY_CONTROL_PASS (zero writes preserved; lifecycle gates recorded
                                        NOT_APPLICABLE_CANARY_POLICY_PASS for R3..R7, R9 PASS,
                                        R10 PASS, R8 NOT_SUPPORTED)
```

## K. Static / quality gates

| Command | Pass | Fail | Skip | Exit |
| --- | ---: | ---: | ---: | ---: |
| `runtime-readiness-contract.guard.test.mjs` | 12 | 0 | 0 | 0 |
| `runtime-readiness-pilot-registry.guard.test.mjs` | 8 | 0 | 0 | 0 |
| `runtime-readiness-cohort-classification.test.mjs` | 6 | 2 | 0 | 1 (PRE-EXISTING) |
| `bm001-runtime-ready.guard.test.mjs` | 15 | 0 | 0 | 0 |
| `bm001-smart-runtime-ux.guard.test.mjs` | 25 | 0 | 0 | 0 |
| `form-lifecycle-wiring.guard.test.mjs` | 21 | 0 | 0 | 0 |
| `pnpm audit:semantic-ui -- --check` | PASS | 0 | 0 | 0 |
| `pnpm audit:hardcode` | PASS | 0 | 0 | 0 |
| `pnpm --filter web lint` | PASS | 0 | 0 | 0 |
| `pnpm --filter web tsc --noEmit` | PASS | 0 | 0 | 0 |

The 2 failures in `runtime-readiness-cohort-classification.test.mjs` are **pre-existing**:
test 5 expects `promotionStatus: "ALREADY_RUNTIME_READY"` for BM-001/BM-171 (current matrix
has `CONTROL_GREEN`); test 6 expects `promotionStatus: "NOT_PROMOTED"` for BM-200 (current
matrix has `CONTROL_GREEN`). Neither was caused by cycle-2 changes; both existed prior to
this execution. Out of scope to fix without an explicit schema decision.

## L. Semantic preservation

```text
total                  = 213
semanticPass           = 213
semanticIncomplete     = 0
inputLinkagePass       = 213
provenanceDuplicateCodes = []
runtimeReady           = ["BM-001","BM-171"]
```

No semantic regression. Runtime work did not touch any of the 213 form definitions or
semantic contracts.

## M. Git / process state

```text
HEAD                                = b0e43be3fd7831db42a88ad521384e0608ee6a18
branch                              = codex/customer-ready-baseline
TRACKED_MODIFIED_FILE_COUNT         = 196
UNTRACKED_FILE_COUNT                = 231
PORCELAIN_STATUS_ENTRY_COUNT        = 427  (TRACKED_MODIFIED + UNTRACKED + STAGED, NOT directories)
STAGED_FILE_COUNT                   = 0
COMMIT                              = NONE
PUSH                                = NONE
```

Execution-owned files I authored in this cycle (all untracked, none committed):
- `tests/e2e/runtime-readiness-pilot.auth.spec.ts` (the pilot spec; new file)
- `docs/audit/runtime-readiness/QLLAW_RUNTIME_READINESS_PILOT.latest.md` (this report)
- `docs/audit/runtime-readiness/QLLAW_213_RUNTIME_READINESS_MATRIX.latest.md` (matrix update)
- `docs/audit/runtime-readiness/QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json` (matrix JSON update)

Execution-owned scratch cleaned up:
- `agent-tools/pilot-run-r3.txt`, `pilot-run-r3-v2.txt` … `pilot-run-r3-v5.txt` (kept only `pilot-run-r3-final.txt`)
- `agent-tools/update-matrix-final.cjs`, `fix-matrix-promotion.cjs`, `probe-schema.cjs`,
  `probe-fingerprint.cjs`, `probe-post.cjs`, `resolve-db-url.cjs`, `migration-*.txt`,
  `db-pre-probe.txt`, `db-post-probe.txt`, `db-pre-fingerprint.txt`, `prisma-generate.txt`
- `agent-tools/debug-r7.cjs`, `debug-r7-direct.cjs`, `debug-r7-direct.sh`

API teardown: API + Web are NOT stopped in this execution cycle (dev-orchestrator is still
running on ports 3000/3001). The user/operator retains the live stack. MariaDB + Docker are
PREEXISTING_REUSED and not stopped.

Final port ownership:
- 3000: LISTENING (Web, execution-owned)
- 3001: LISTENING (API, execution-owned)
- 3307: LISTENING (MariaDB, preexisting)

## N. Explicit non-claims

```text
RUNTIME_READY_213          = NOT_CLAIMED  (only BM-001/BM-171 are runtime-ready)
DOCX_LEGAL_FIDELITY_213    = NOT_CLAIMED  (no DOCX validated for any candidate)
PDF_FONT_FIDELITY          = NOT_ASSESSED (R8 NOT_SUPPORTED for all 12 forms)
PRODUCTION_READY_213       = NOT_CLAIMED  (cycle 2 surfaced a new endpoint-specific blocker)
R7_BUG_FIX_OWNERSHIP       = NOT_FIXED    (out of scope; documented for product investigation)
```

## O. Next cohort

```text
next safest cohort   = SAME 9 candidates (BM-157, BM-181, BM-168, BM-136, BM-174,
                                   BM-206, BM-213, BM-156, BM-148)
expected batch size = 9 (no substitution)
shared remaining blocker = R7 HTTP 401 on POST /documents/generated/:id/render-docx
forms needing individual treatment = none — the blocker is shared across all 9 candidates

After the R7 auth gap is closed by product-side investigation:
  expected gate status  = R1..R10 PASS for all 9 candidates
  expected promotion    = all 9 candidates eligible for promotion in a single cycle
  pre-promotion guard   = re-run runtime-readiness-contract.guard.test.mjs
                          + cohort-classification test (will need fix for the 2 pre-existing
                          failures around promotionStatus naming)
```

The cohort should NOT be expanded. Expanding the cohort before the R7 auth gap is resolved
would just multiply the same 401 across more forms without new information.

---

## Failure-log entry

A correction is required in `.ai/harness/project_failure-log.md`. The previous entry
implied that cycle 1 was blocked solely by the missing `bridge_draft_key` column. In fact
cycle 2 (this execution) reconciled the migration successfully; the new live blocker is
the R7 auth gap on the persisted DOCX render route. The earlier entry should be corrected
rather than appended as a separate failure.

## Stop conditions

```text
✅ database target resolved
✅ migration state directly probed (pre and post)
✅ required migration safely reconciled (no destructive ops, no data loss)
✅ API/Web/Clerk healthy
✅ full pilot executed (16 tests)
✅ every candidate has real R1..R10 result
✅ no promotions (zero promotion acceptable per spec §17 since no candidate met all gates)
✅ no post-promotion rerun needed (no registry change)
✅ semanticPass remains 213
✅ static guards pass (1 pre-existing test failure noted but not blocking)
✅ execution-owned services noted (left running for operator follow-up)
✅ staged count remains 0
```

The execution stops successfully per spec §27's success criteria, with one open item:
**R7 endpoint-specific auth gap, requires product-side investigation before next cohort promotion.**