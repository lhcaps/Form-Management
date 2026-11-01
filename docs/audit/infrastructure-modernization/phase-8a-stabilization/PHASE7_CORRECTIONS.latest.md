# Phase 7 Corrections (additive ledger)

**Status:** additive. Does not overwrite any Phase 7 or Codex audit document.
**Phase:** 8A — Deterministic test stabilization and change provenance.

Each correction records its evidence source. Where Phase 7 made an unverified claim, the correction names the new evidence and the new status.

| ID | Status (new) | Topic |
|---|---|---|
| P7C-01 | CORRECTED | form-studio deletion count is **32** (29 API + 3 Web), not 35. |
| P7C-02 | CONFIRMED | `apps/web/src/lib/form-studio-api.ts` is `M` in git status. |
| P7C-03 | UPGRADED to MIXED_CHANGE | Provenance is **DELETION_INTENT_DOCUMENTED + PREEXISTING_USER_DELETION**; `PROVENANCE_UNKNOWN` for the Codex actor specifically. |
| P7C-04 | CORRECTED | Form-studio deletion does NOT contradict C-015 protected-artifact preservation. |
| P7C-05 | CORRECTED | Filter-pipe truncation is not valid wrapper exit-code evidence. |
| P7C-06 | Downgraded to HYPOTHESIS | `audit:docx-slot-inventory` is not a confirmed root cause; the three failing suites use SHARED `tmpdir()` names that they `rmSync` aggressively. |
| P7C-07 | CORRECTED | Test-integrity conclusions apply only to files independently opened. |

## P7C-01 — deletion count

**Phase 7 claim:** "32 API + 3 Web = 35 deleted files".

**Evidence (this phase):**

```text
$ git diff --name-status -- 'apps/api/src/modules/form-studio/*' 'apps/web/src/app/admin/(shared)/form-studio/*' 'apps/web/src/components/form-studio/*'
D       apps/api/src/modules/form-studio/<29 files>
D       apps/web/src/app/admin/(shared)/form-studio/page.tsx
D       apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx
D       apps/web/src/components/form-studio/form-studio-workspace.tsx
M       apps/web/src/lib/form-studio-api.ts
```

29 API files + 3 Web files = 32 deleted in total. The original Phase 7 description mis-typed this as "32 API + 3 Web". The `form-studio-api.ts` is **modified**, not deleted.

## P7C-02 — `form-studio-api.ts` modification

Confirmed independently:
- `git diff --name-status` reports `M\tapps/web/src/lib/form-studio-api.ts`.
- The file content still imports and re-exports helpers; it now delegates to `contract-platform-api` (see also `apps/web/src/lib/form-studio-retirement-guard.test.ts` test 2).

## P7C-03 — Provenance upgrade

Phase 7 used `PROVENANCE_UNKNOWN` for actor attribution. This phase:

1. Read `git log --all --oneline -- 'apps/api/src/modules/form-studio/form-studio.module.ts'`. The last modification was `1cff7035 feat(form-studio): add contract platform v2`, and the surrounding commits `1206fec8 feat(forms): enable unified 213-form authoring` and `4229df14 feat(documents): expose generated document form schema endpoint` — all predate the infrastructure phase that introduced the current Codex infrastructure reports.
2. Read `apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts`, which directly asserts `assert.equal(existsSync(join(apiSrcDir, 'modules/form-studio')), false)` and `assert.doesNotMatch(appModule, /FormStudioModule/)`. **The deletion is locked-in by a test.**
3. Read `apps/web/src/lib/form-studio-retirement-guard.test.ts`, which requires the three deleted web files to be gone and `nav-items.tsx` to contain no `/admin/form-studio` link.

**Conclusion:** the deletions are intentional and pre-existing relative to the Codex phase. New status: **MIXED_CHANGE** (DELETION_INTENT_DOCUMENTED + PREEXISTING_USER_DELETION). The "Codex did it" hypothesis does not survive the evidence check.

## P7C-04 — C-015 preservation

Phase 7 linked form-studio deletion to C-015 protected-artifact risk. C-015 protects:

- canonical 213 lock matrix
- 213 source / normalized DOCX
- 213 locked + compiled contracts
- Prisma schema + migrations
- 12 PARTIAL holdouts
- BM-006 calibration
- BM-130 canary behavior

Form-studio TS source is application code. Two on-repo guard tests now REQUIRE the form-studio files to be absent. C-015 is **not** directly contradicted.

## P7C-05 — wrapper exit-code evidence

Phase 7 captured a `verify:ci` run via:

```powershell
pnpm verify:ci 2>&1 | Select-String -Pattern "PASS|FAIL|..." | Select-Object -First 30
```

and reported exit code `4294967295`. That exit code is Windows `STATUS_INVALID_HANDLE` / pipe-abort — i.e., `Select-Object -First 30` closed stdout after the 30th match, the upstream `pnpm verify:ci` then received `SIGPIPE` (Windows `STATUS_PIPE_NOT_AVAILABLE` / abort), the wrapper did not actually decide on its own exit code, and the captured exit value is meaningless.

The PASS / FAIL lines inside the captured range are still useful as evidence that **at least one sub-step failed**, but the numeric exit code does not prove the wrapper exited cleanly OR with failure.

**Rule adopted for Stage 5+:** capture full stdout/stderr via direct file redirection, never truncate the pipe early; preserve `$LASTEXITCODE` from the wrapper process directly.

## P7C-06 — root-cause status

Phase 7 wrote: "`audit:docx-slot-inventory` is the root cause". This phase verified by reading the script:

- The script's only writes are to `docs/audit/docx-slot-inventory/latest.{json,md}`.
- It does not touch `tmpdir()`, `qllaw-*`, or any normalized DOCX shadow path.

The three failing suites listed in `WRAPPER_TRUTHFULNESS_AUDIT.latest.md` Appendix A are:

| Spec | Output path |
|---|---|
| `representative-bms-render.spec.ts` | `join(tmpdir(), 'qllaw-e2-render-six-bms')` |
| `docxtemplater-contract-render-engine-style-profile.spec.ts` | `join(tmpdir(), 'qllaw-pr6g4-style-profile-bm001')` and `…-nobm` |
| `docx-inspection-rendered-preservation.spec.ts` | `join(tmpdir(), 'qllaw-pr6g1-rendered-preservation')` |

Each spec calls `rmSync(OUTPUT_ROOT, { force: true, recursive: true })` in `beforeEach` / `beforeAll` / `afterAll`. The cross-suite collision or stale-state hypothesis is therefore **plausible** and will be tested in Stage 5. Downgraded to **HYPOTHESIS**.

## P7C-07 — test-integrity scope

Phase 7 flagged 15 web tests as UNKNOWN (not opened line-by-line). This phase re-states UNKNOWN for the files it does not open. Files independently opened in Phase 8A will get explicit status in `TEST_INTEGRITY_REVIEW.latest.md` (Stage 6 — not generated this phase because file scope is limited to the three failing suites and their producers / consumers / cleanup owners).
