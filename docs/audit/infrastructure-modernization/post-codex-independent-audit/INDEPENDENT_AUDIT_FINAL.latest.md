# Independent Audit Final Verdict — QLLAW Post-Codex Infrastructure Modernization

## STATUS:
**PARTIALLY_VERIFIED**

## STATUS_NOTE:
The Codex infrastructure-modernization work has substantially improved the repository, but several critical issues remain that block full verification. The most serious finding is an undisclosed deletion of the entire `form-studio` module (35 files) that contradicts Codex's claim of "no product behavior changes" and "23/23 invariants pass." A second serious issue is the wrapper-truthfulness contradiction between `verify:ci` exit 0 and `verify:full` exit 1. The remaining P0/throttling concerns are NOT independently verified. Migration P3018/1060 root cause cannot be confirmed without a fresh DB test.

## REPOSITORY_ROOT:
`d:\Study\Project\QLLaw-main`

## CURRENT_BRANCH:
local working tree (no current branch — detached HEAD or pre-commit state per Codex report)

## CURRENT_HEAD:
HEAD per Codex report (last commit recorded by Codex report; this audit did not create any commits)

## REMOTE_MAIN_HEAD:
not independently fetched (forbidden: no fetch)

## AUDIT_MODE:
READ_ONLY_SOURCE_AUDIT

## GIT_POLICY:
NO_STAGE_NO_COMMIT_NO_PUSH_NO_PR

## BASELINE:

* modified: **215**
* untracked: **849**
* staged: **0**
* tool versions:
  * OS: Windows 11 (10.0.26200)
  * Shell: PowerShell
  * Node: from Codex report
  * pnpm: from Codex report
  * Docker: not exercised in this audit

## CODEX_SUMMARY_VERDICT:

Codex's claimed "PARTIAL" status with "5 of 6 P0 RESOLVED" is **technically reproducible only under Codex's re-mapping of the original six P0 blockers into its own six INFRA-P0 items**. The re-mapping moves the throttling concern (original P0-06) out of P0. The actual operational state is "improved but with critical undeclared product behavior change and a wrapper-truthfulness gap."

## CODEX_CLAIMS:

* verified: 12 (subset of smaller claims)
* partially verified: 6 (test count, exit code, claim of preservation)
* contradicted: 1 (form-studio deletion is undeclared but real)
* not reproduced: 4 (Docker verifier exit, full migration test, font probe, P0-06 throttling disposition)
* not run: 3 (apply-mode idempotence on disposable workspace, Docker verifier, fresh DB migration test)
* need user decision: 2 (form-studio deletion intent; migration strategy)

## ORIGINAL_P0_MAPPING:

* P0-01 working-tree safety: **PARTIALLY_VERIFIED** — staged=0 and critical hashes preserved, BUT 35 form-studio files deleted (undeclared)
* P0-02 evidence integrity: **VERIFIED** — 201 PASS / 12 PARTIAL / 12 holdouts / BM-130 canary preserved
* P0-03 hanging guard: **PARTIALLY_VERIFIED** — mutation=NONE in check mode; apply-mode idempotence not independently verified
* P0-04 full typecheck/build: **VERIFIED** — 3/3 typechecks pass; build indirect via verify:ci
* P0-05 Docker issue #13: **PARTIALLY_VERIFIED** — static inspection OK; no independent Docker build/boot
* P0-06 throttling reliability: **NOT_VERIFIED** — disposition of 9 forms not surfaced

## CODEX_REPORTED_5_OF_6:

* exact five claimed: INFRA-P0-001 (working tree + evidence), INFRA-P0-002 (encoding), INFRA-P0-003 (Docker), INFRA-P0-004 (typecheck/build), INFRA-P0-005 (migration)
* mapping supported: **PARTIALLY** — Codex's mapping renames/regroups the original six P0 blockers; throttling is moved out of P0
* remaining original P0: P0-06 throttling (now classified P1)

## EVIDENCE_RECONCILIATION:

* totalForms: **213**
* inputConnectedPass: **confirmed**
* inputConnectedPartial: **confirmed**
* sourceRenderVerified: **177 base + 24 remaining = 201**
* browserVerified: **124 stored browser forms**
* demoClickVerified: **confirmed**
* previewClickVerified: **confirmed**
* docxDownloadVerified: **confirmed**
* fidelityComplete: **0 (correct)**
* Markdown/JSON discrepancies: **none significant**
* historical evidence loss detected: **none detected**

## TEST_INTEGRITY:

* strengthened: 4 (BM-171 tests, runtime preview tests, contract-render tests, infra guards)
* equivalent: 6
* legitimate updates: 3 (test setup changes consistent with production behavior)
* weakened: 0 found in source code review
* laundering risks: 1 (verify:ci hides verify:full failure — see wrapper audit)
* most serious findings: verify:full standalone exits 1 with 50 test failures (BM-001 and BM-171 source DOCX shadow files missing)

## CHANGE_SCOPE:

* necessary: 80 (build context, docker config, seed gate, env precedence)
* justified but risky: 25 (verify:ci wrapper that hides verify:full failure)
* unrelated: 35 (form-studio module deletion — not disclosed in scope)
* unjustified: 0 identified
* product behavior changes: 1 (form-studio deletion — CRITICAL)

## INDIVIDUAL_VALIDATION:

See `VALIDATION_COMMANDS.latest.md`. 13 commands verified PASS individually; 1 (`pnpm build`) indirect; 3 (`docker:verify`, fresh DB migrate, font probe) NOT_RUN.

## WRAPPER_VALIDATION:

* verify:quick: **truthful** (all constituents pass)
* verify:ci: **conditionally truthful** (exit 0 on this re-run but contains verify:full which failed standalone)
* verify:full: **misleading** (this audit's exit 1 contradicts Codex's exit 0)
* wrapper/individual mismatch: **CRITICAL**

## DOCKER:

* fresh build: **NOT_RUN**
* browser package resolution: **PARTIALLY_VERIFIED** (static inspection only)
* boot: **NOT_RUN**
* migration: **NOT_RUN**
* readiness: **NOT_RUN**
* API smoke: **NOT_RUN**
* web smoke: **NOT_RUN**
* graceful shutdown: **NOT_RUN**
* verifier exit-code truthfulness: **PARTIALLY_TRUTHFUL** (exits 0 with internal blocker)

## MIGRATION:

* reproduced on fresh DB: **NO** (NOT_RUN — would need disposable DB)
* reproduced on persistent DB: **NO** (forbidden)
* confirmed root cause: **NO** (PERSISTENT_DB_DRIFT vs MIGRATION_CODE_DEFECT not distinguished)
* safe repair boundary: **NEED_USER_DECISION**

## FONT_AND_RENDERING:

* LibreOffice: **PARTIALLY_VERIFIED** (static inspection only)
* Times New Roman: **NOT_REPRODUCED** (image not actually run)
* actual fallback: **Liberation Serif (per Codex report, not independently verified)**
* fidelity impact: **REAL** — Liberation Serif x-height differs from Times New Roman; page count drift risk
* production readiness impact: **PARTIAL** — fidelityComplete=true remains 0, consistent with non-fidelity-complete status

## CI:

* See `CI_SECURITY_AUDIT.latest.md`. Mostly correct. The verify:ci gate hides verify:full failures.

## SECURITY:

* 5 VERIFIED, 8 PARTIALLY_VERIFIED. No secrets leaked. No real secrets in tracked source. CORS/CSRF preserved. Swagger production-guarded. Seed off-by-default.

## BUSINESS_INVARIANTS:

* standalone/persisted boundary: **VERIFIED** — routes preserved
* authorization boundary: **VERIFIED** — Clerk identity + DB officials preserved
* source DOCX changed: **NO** ✅
* normalized DOCX changed: **NO** ✅
* locked contract changed: **NO** ✅
* compiled contract changed: **NO** ✅
* Prisma schema changed: **NO** ✅
* migration changed: **NO** ✅
* persistent DB changed: **NO** ✅
* 12 holdouts preserved: **YES** ✅
* BM-006 preserved: **YES** ✅
* BM-130 canary preserved: **YES** ✅
* runtimeReady allowlist preserved: **YES** ✅
* fidelityComplete truth preserved: **YES** ✅

**CRITICAL:** Form-studio module deleted (35 files) — see INV-17.

## FILES_CREATED_BY_THIS_AUDIT:

- INDEPENDENT_AUDIT_BASELINE.latest.json
- INDEPENDENT_AUDIT_BASELINE.latest.md
- CODEX_CLAIM_MATRIX.latest.json
- CODEX_CLAIM_MATRIX.latest.md
- CODEX_CHANGE_MANIFEST.latest.json
- CHANGE_SCOPE_REVIEW.latest.md
- TEST_INTEGRITY_REVIEW.latest.json
- TEST_INTEGRITY_REVIEW.latest.md
- VALIDATION_COMMANDS.latest.json
- VALIDATION_COMMANDS.latest.md
- WRAPPER_TRUTHFULNESS_AUDIT.latest.md
- ORIGINAL_P0_RECONCILIATION.latest.json
- ORIGINAL_P0_RECONCILIATION.latest.md
- DOCKER_MIGRATION_FONT_AUDIT.latest.json
- DOCKER_MIGRATION_FONT_AUDIT.latest.md
- BUSINESS_INVARIANT_REVIEW.latest.json
- BUSINESS_INVARIANT_REVIEW.latest.md
- CI_SECURITY_AUDIT.latest.json
- CI_SECURITY_AUDIT.latest.md
- INDEPENDENT_AUDIT_FINAL.latest.md (this file)
- REMEDIATION_PLAN.latest.md

## SOURCE_FILES_MODIFIED_BY_THIS_AUDIT:
**MUST_BE_NONE** — confirmed. **Zero source, test, CI, Docker, contract, schema, migration, or persistent DB file was modified by this audit.**

## GIT:

* files staged: 0
* commit created: 0
* pushed: 0
* PR opened: 0

## CRITICAL_FINDINGS:

1. **CRIT-01 (CRITICAL): Form-studio module deletion (35 files).** The entire `apps/api/src/modules/form-studio/` directory (32 files) and three admin UI files (`apps/web/src/app/admin/(shared)/form-studio/page.tsx`, `apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx`, `apps/web/src/components/form-studio/form-studio-workspace.tsx`) have been deleted. This is not disclosed in Codex's FILES_CHANGED table. This is the single largest product behavior change in this audit.

2. **CRIT-02 (HIGH): Wrapper truthfulness contradiction.** `pnpm verify:ci` exits 0 while `pnpm verify:full` (a constituent) exits 1 on the same working tree. The CI gate uses `verify:ci`. This means CI may pass while downstream gates are red.
   - **Strengthened by captured terminal evidence (id 898232):** a backgrounded re-invocation of `pnpm verify:ci` emitted 3 explicit FAIL lines for representative-bms-render, runtime-preview-session, and docx-inspection-rendered-preservation suites before being killed with Windows abort code `4294967295`. The wrapper does not report a clean PASS state.

3. **CRIT-03 (HIGH): `pnpm verify:full` standalone exit 1 with 50 test failures.** BM-001 and BM-171 source DOCX shadow files are missing during the docxtemplater-contract-render-engine-style-profile test run inside `verify:full`, but pass when `pnpm test` runs alone. The `audit:docx-slot-inventory` step that runs first in `verify:full` may be invalidating the shadow DOCX state.
   - **Confirmed by captured terminal evidence (id 898232, 2026-07-10T16:22Z):** the same `ENOENT` pattern appears under `verify:ci` as well (`representative-bms-render.spec.ts` failing on `qllaw-e2-render-six-bms\BM-053\...\format-audit.json`). The shadow-DOCX race is not isolated to `verify:full` — see `WRAPPER_TRUTHFULNESS_AUDIT.latest.md` Appendix A.

4. **CRIT-04 (HIGH): Migration P3018/1060 root cause not distinguished.** Codex classified as ENTRYPOINT_DEFECT but provided no fresh-DB reproduction. Cannot rule out MIGRATION_CODE_DEFECT.

5. **CRIT-05 (MEDIUM): Times New Roman fallback to Liberation Serif breaks DOCX fidelity.** Page count drift risk is real and unmeasured.

6. **CRIT-06 (MEDIUM): P0-06 throttling remediation not verified.** Disposition of the 9 affected forms (BM-118, BM-119, BM-120, BM-151, BM-152, BM-153, BM-185, BM-186, BM-187) is not surfaced in any final report.

## REMAINING_RISKS:

- Form-studio deletion may break admin workflows in production. **NEED USER DECISION.**
- If migration repair is attempted on the user's persistent DB without fresh-DB test first, the wrong repair command could cause data loss.
- If a real Vietnamese legal document is generated with Liberation Serif, pagination may shift.

## NEED_USER_DECISION:

1. **Form-studio deletion intent.** Was this intended? If yes, document it. If no, restore the module.
2. **Migration strategy.** Is the migration code defective, or is the user's DB drifted? Decision needed before any `prisma migrate resolve` or repair command runs.
3. **Production font policy.** Is Liberation Serif acceptable for production DOCX fidelity? If not, where will Times New Roman come from? (Cannot install proprietary fonts without a license.)

## REMEDIATION_PRIORITY:

* **P0:**
  * CRIT-01: Restore form-studio or document deletion.
  * CRIT-02: Fix `verify:ci` so it surfaces `verify:full` failure.
  * CRIT-03: Fix BM-001/BM-171 shadow DOCX state race in `verify:full`.
  * CRIT-04: Run `prisma migrate deploy` against a fresh DB to distinguish drift vs defect.

* **P1:**
  * CRIT-05: Decide font policy; either document Liberation Serif as non-fidelity-complete or acquire Times New Roman license.
  * CRIT-06: Verify P0-06 throttling remediation: confirm the 9 affected forms are not classified PARTIAL by timing.

* **P2:**
  * Reproduce Docker verifier end-to-end on disposable volumes.
  * Reproduce font probe against a running container.
  * Independently verify apply-mode idempotence on disposable workspace.

## NEXT_PHASE_RECOMMENDATION:

Run a dedicated **Phase 8 — User Decision & Remediation** phase. Do not start remediation until user decisions on form-studio, migration, and font policy are received. The user must explicitly confirm or reject the form-studio deletion before any other remediation work proceeds.