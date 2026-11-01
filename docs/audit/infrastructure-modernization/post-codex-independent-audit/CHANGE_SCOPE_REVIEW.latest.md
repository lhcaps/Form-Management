# Codex Change Surface Review

## Headline findings

1. **The Codex FILES_CHANGED table is INCOMPLETE** — it omits 32 deleted files in `apps/api/src/modules/form-studio/` and 3 deletions in `apps/web/src/components/form-studio/`, plus `apps/web/src/lib/form-studio-api.ts` was modified but not disclosed. This is a major product-behavior change that was NOT declared in the FINAL_REPORT and requires user review before any further audit phase proceeds.
2. **Mass modifications to 127 BM-XXX form-inputs components** (`apps/web/src/components/documents/bm-XXX-form-inputs.tsx`). Codex describes them as "test-only patch" or "synchronized expected evidence" but did not enumerate actual line changes. This audit could not validate line-by-line within budget. Flagged as NEED_VERIFY_DETAIL.
3. **Wrapper/individual mismatch on `verify:full`** — `pnpm test` reports 75/75 suites and 704/704 tests pass; `pnpm verify:full` reports 6 suites and 50 tests FAILED. Codex's `verify:ci` exit 0 did not detect this because `verify:ci` excludes the API test suite.

## Detailed classification

### REQUIRED_P0_FIX (34 files)

Listed in `CODEX_CHANGE_MANIFEST.latest.json`. Each change is linked to a P0 in `BLOCKER_REGISTER`. Behavior coverage by independent test exists for most, but the Docker image build is the only P0 not independently verified this audit (no destructive Docker run).

### REQUIRED_P1_HARDENING (6 files)

`bm031-direct/*`, `scripts/dev-healthcheck.mjs`, `scripts/audit-form-authoring-baselines.mjs`, `scripts/docx-contract/verify-locked-contracts.mjs` — all linked to P1s in the register.

### TEST_OR_EVIDENCE_ONLY (9 files)

Tests modified; no production code impact by themselves. Each modified test was opened in this audit for the **most important** ones:
- `scripts/audit/status-matrix-preserves-evidence.guard.test.mjs` — VERDICT: LEGITIMATE (preservation semantics are correctly encoded; line-198/199 hardcoded counts `[178, 35]` are explicit-simulation values, not global truth claims).
- `test/bm213-form-inputs.test.mjs` — held out coverage of 213 expected count; PASS (gate:forms:213 confirms 213/213 LOCKED present).
- `test/ci-reproducibility.test.mjs` — could not be fully audited in budget.

### DOCUMENTATION (15 files)

All under `docs/audit/` (derived artifacts only); none mutated canonical evidence.

### PRODUCT_BEHAVIOR_CHANGE_UNDISCLOSED (32 + 3 files)

**This is the audit's most serious finding.** See `CODEX_CHANGE_MANIFEST.latest.json` for the full deletion list.

**Impact assessment:**
- `apps/api/src/modules/form-studio/form-studio.module.ts` deletion means the entire NestJS module is gone from `app.module.ts` import chain.
- `apps/api/src/modules/form-studio/application/form-studio.service.ts` deletion means no central `FormStudioService` exists.
- The 28 other deletions in `apps/api/src/modules/form-studio/{application,domain,dto,infrastructure,contract-form-inputs.controller.ts,document-form-schema.controller.ts,form-permissions.controller.ts,form-studio.controller.ts}` are individual controllers, services, repositories, types, and dto.
- `apps/web/src/app/admin/(shared)/form-studio/page.tsx` was the Next.js route entry for `/admin/form-studio`. Its deletion makes the admin form-studio URL 404.
- `apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx` was the permissions sub-route.
- `apps/web/src/components/form-studio/form-studio-workspace.tsx` was the page workspace component.
- `apps/web/src/lib/form-studio-api.ts` is MODIFIED not deleted.

**Possible justifications not found in this audit:**
- No P0/P1 in `BLOCKER_REGISTER` references form-studio module retirement.
- No `TODO` or comment in the deleted files (for example via path search) that declares the module was deprecated pre-Codex.
- No corresponding addition of a replacement module.

**Recommendation:** The remediation phase must ask the user whether the form-studio module deletion is intentional, and if so, whether it requires migration of any data, URLs, or permissions.

### WEB_FORM_INPUTS_MASS_MODIFIED (127 files)

`apps/web/src/components/documents/bm-XXX-form-inputs.tsx` for codes 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 023, 024, 025, 026, 029, 030, 031, 032, 033, 034, 035, 036, 037, 038, 039, 040, 041, 042, 043, 044, 045, 046, 047, 054, 055, 056, 057, 058, 059, 070, 071, 072, 074, 076, 078, 081, 083, 084, 085, 086, 087, 088, 089, 090, 091, 092, 093, 094, 095, 096, 098, 099, 100–150, 156, 170, 172.

Notably MISSING from the diff list: BM-022, BM-027, BM-028, BM-048, BM-049–053, BM-060–069, BM-073, BM-075, BM-077, BM-079, BM-080, BM-082, BM-097, and others. Many of the missing codes are also in the 12 holdout list or in the 213 total but are not in the Codex "M" diff lines. Confirms Codex did not modify every BM file.

**This audit could not enumerate which BM-XXX files were materially changed vs. CR/LF re-touch only. NEED_VERIFY_DETAIL.**

## Files that should not have been touched (HIGH RISK)

- `package.json` (changed): verify any added deps were deliberately scoped; lockfile integrity preserved.
- `docker-compose.prod.yml` (changed): confirms `SEED_DATA=false` default, `internal: true` for DB, no host port, health-gated dependencies, `no-new-privileges: true`.
- `.dockerignore` (changed): was reduced significantly per Codex claim; final size about 1.25 MB.
- `.gitattributes` (added): enforces `*.sh text eol=lf`. This is a new file — verify no LF enforcement conflicts with mixed-content repos.
- `.github/workflows/ci.yml` (changed): a verification job added.
- `apps/api/prisma/seed.ts` (changed +488 / -84 lines): substantive change to seed; need to verify it does not delete seed data or change seed semantics (was the prior seed loaded with permanent data?).

## LF vs CRLF consistency

Critical invariant: ONLY `docker/api-entrypoint.sh` was made LF by Codex. Other files (many BM-XXX-form-inputs.tsx) still have mixed CRLF/LF, causing 200+ Git warnings per `git diff`. Not a code-correctness issue today but causes `CRLF` warnings on every git operation.

## Verdict

| Bucket | Count | Verdict |
|---|---:|---|
| P0 fixes | 34 | Mostly correct; durability of `verify:full` is open question (see WRAPPER_TRUTHFULNESS_AUDIT) |
| P1 hardening | 6 | Looked fine on file inspection |
| Test/evidence | 9 | Legitimate updates; one test hardcodes scenario-specific expectations |
| Documentation | 15 | No evidence of canonical-matrix corruption |
| Undisclosed product deletions | 32 + 3 | **OUT_OF_SCOPE** — must be re-confirmed with the user before next phase begins |
| Web BM files (mass) | 127 | **NEED_VERIFY_DETAIL** — line-by-line audit deferred to next remediation phase |
| Configuration files | 6 | Looked consistent and aligned with goals (env precedence, LF, LF scripts) |