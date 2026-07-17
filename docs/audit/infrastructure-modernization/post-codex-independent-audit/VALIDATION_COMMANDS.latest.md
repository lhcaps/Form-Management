# Validation Commands — Independent Re-Run

| Command | Codex Claim | Fresh Result | Verdict |
|---|---|---|---|
| `pnpm --filter @qllaw/form-contracts typecheck` | PASS 2.708s | PASS 1.48s | PASS |
| `pnpm --filter api exec tsc --noEmit` | PASS | PASS | PASS |
| `pnpm --filter web exec tsc --noEmit` | PASS | PASS | PASS |
| `pnpm typecheck` | PASS 5.959s | not run separately (covered by verify:quick which calls it) | n/a |
| `pnpm lint` | PASS 24.837s | not run separately here, but `verify:ci` exit 0 implies it passed within the chain | PASS (via wrapper) |
| `pnpm test` | PASS 17.774s | PASS 30.97s; 75/75 suites / 1427/1427 tests pass | PASS |
| `pnpm build` | PASS 24.910s | not run separately; covered by verify:full which crashed on tests | UNVERIFIED |
| `pnpm audit:hardcode` | PASS | PASS 2.73s | PASS |
| `pnpm audit:locked-compiled` | PASS | PASS 3.18s — 213/213 consistent | PASS |
| `pnpm audit:contract-sync` | PASS | PASS — 213 matched, 0 missing | PASS |
| `pnpm audit:encoding` | PASS | PASS — No BOM | PASS |
| `pnpm gate:forms:213` | Codex report: BASELINE FAIL "stale report"; not in PASS list separately. Final verification: PASS | PASS — 213/213 forms locked, 0 blocking | PASS |
| `node --test test/infrastructure/*.guard.test.mjs` | not specified separately | PASS — 17 tests, 5 suites pass | PASS |
| `node scripts/audit/status-matrix-213.mjs` | Codex baseline: FAIL_INTEGRITY (rewrote 201/12 → 177/36); Final: idempotent | `apply --check` exit 0 with 201/12 preserved, 24 remainingSourceRenderForms, 124 storedBrowserForms | PASS (verified) |
| `node scripts/audit/apply-all-current-evidence.mjs --check` (run twice) | documented as byte-idempotent | First run exit 0; matrix hash unchanged | PASS (one run) |
| `pnpm verify:quick` | PASS 60.023s (or quick) | PASS 8.94s | PASS |
| `pnpm verify:ci` | PASS 60.023s | PASS 127.56s — orchestrator PASS 201/12 | PASS (with caveat below) |
| `pnpm verify:full` | PASS 137.529s | **FAIL 87.28s** — 50/704 tests fail, exit 1 | **CONTRADICTED** |
| `pnpm docker:verify` | PASS 73.762s | NOT_RUN | NOT_RUN |
| Prisma migrate deploy on disposable blank DB | blocker P3018 / 1060 expected | NOT_RUN | NOT_RUN |
| Times New Roman `fc-match` in API runner | Liberation Serif | NOT_RUN | NOT_RUN |

## Wrapper Truthfulness

### `verify:quick`

Definition: `pnpm typecheck && pnpm audit:hardcode && node --test "test/infrastructure/*.guard.test.mjs"`

- All three sub-commands independently verified PASS.
- Wrapper exit 0 is consistent. **VERIFIED TRUTHFUL.**

### `verify:ci`

Definition: `pnpm verify:full && pnpm audit:templates && pnpm smoke:bm001-shadow-render && pnpm audit:docx:verify-locked:ci && pnpm gate:forms:213 --allow-source-unknown && node scripts/audit/apply-all-current-evidence.mjs --check`

- `verify:full` (a constituent) failed standalone with exit 1.
- `verify:ci` exited 0 on the live re-run.
- **This is a wrapper/individual mismatch.** Two explanations:
  1. `verify:ci` did NOT actually call `verify:full` in this run (unlikely — the chain is explicit).
  2. The test failures in `verify:full` are flaky / environmental. The `pnpm test` within `verify:full` ran fine inside `verify:ci`'s call to it but failed when called from the top-level `verify:full` invocation.
- **Concretely: WRAPPER TRUTHFULNESS UNCERTAIN.**

### `verify:full`

Definition: `pnpm audit:docx-slot-inventory && pnpm verify:quick && pnpm lint && pnpm test && pnpm build && pnpm audit:locked-compiled && pnpm audit:contract-sync && pnpm audit:encoding`

- **Exit 1.**
- Failing suites: representative-bms-render, runtime-preview-session, pr6g31-bm171-rendered-docx-parity, docxtemplater-contract-render-engine, pr6g31-bm001-rendered-docx-parity, docxtemplater-contract-render-engine-style-profile.
- 50 of 704 tests fail; 654 pass.
- Cause: BM-001 and BM-171 source DOCX shadow files are missing (`ENOENT`) when style-profile spec runs; paragraph rules `bm001.place_date_line`, `bm001.archive_line`, `bm171.body_consideration`, `bm171.body_asset_list` find no matching paragraphs.
- `pnpm test` (which is `pnpm test:contracts && pnpm test:api && pnpm test:node && pnpm test:web-unit`) run in this order:
  - `:contracts` works.
  - `:api` is `jest --runInBand`; succeeds standalone per the `pnpm test` log we saw with 75/75 suites.
  - `:node` runs mjs tests.
  - `:web-unit` runs web tests via tsx.
- The contradiction suggests that `pnpm audit:docx-slot-inventory` (run first) leaves state that breaks the API tests when invoked inside `verify:full`. The same API tests pass when invoked via plain `pnpm test` because that doesn't run the inventory first.

**The audit cannot resolve this without writing/modifying test code, which is forbidden in Phase 7.** This is a **HIGH-risk wrapper-truthfulness issue** for the next phase.

## Exit 0 with blocker

**ONE explicit instance:** `verify:ci` exit 0 despite `verify:full` exit 1 in standalone. Per Codex's own honesty rules, a wrapper exit 0 with sub-command failure should be classified as **misleading**. The Codex report does not flag this.

## Omitted commands in the wrapper

- `verify:full` runs `audit:docx-slot-inventory` → docx slot regen. Codex does not surface what happens if a separate process holds a lock on the docx slot inventory file during the inventory regen. **Potential race condition not tested.**

## Verdict

- `verify:quick` is **truthful** (all constituents independently pass).
- `verify:full` is **misleading** by Codex's own rules — exit 1 should be reported.
- `verify:ci` is **conditionally truthful** (exit 0 on this rerun, but `verify:full` independently failed).