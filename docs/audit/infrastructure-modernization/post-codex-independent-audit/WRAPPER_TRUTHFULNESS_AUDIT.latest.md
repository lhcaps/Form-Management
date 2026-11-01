# Wrapper Truthfulness Audit

## Principle

A wrapper command (e.g., `pnpm verify:ci`, `pnpm verify:full`) is truthful iff it accurately reports exit status of its sub-commands. Two failure modes:

1. **Wrapper exit 0 despite failed sub-commands** — the most damaging failure mode.
2. **Wrapper exit 1 with sub-commands that quietly passed** — less damaging but still misleading.

## Findings

### `pnpm verify:quick`

Definition (from package.json line 48):
`pnpm typecheck && pnpm audit:hardcode && node --test "test/infrastructure/*.guard.test.mjs"`

| Sub-command | Independent result | Wrapper status |
|---|---|---|
| `pnpm typecheck` | exit 0 | OK |
| `pnpm audit:hardcode` | exit 0 (Runtime hardcode audit passed) | OK |
| infrastructure guards | exit 0 (17 tests pass) | OK |

**Truthful.**

### `pnpm verify:full`

Definition (from package.json line 49):
`pnpm audit:docx-slot-inventory && pnpm verify:quick && pnpm lint && pnpm test && pnpm build && pnpm audit:locked-compiled && pnpm audit:contract-sync && pnpm audit:encoding`

Standalone run reproduced in this audit: **exit 1**.
- `pnpm test` exited with: `Test Suites: 6 failed, 69 passed, 75 total; Tests: 50 failed, 654 passed, 704 total`.
- The wrapper reported failure correctly. **Truthful on exit code.**
- But the BASELINE_COMMANDS report file says PASS at 137.529 s in Codex's final state — yet my fresh run fails with exit 1. **Either the original Codex run had a different state or Codex's `verify:full` exit code was not preserved in the report.**

**This is the contradiction: pnpm test passes, pnpm verify:full fails.** The `&&` chain is correct, so the only way for the wrapper to fail is if `pnpm test` failed inside the chain. My standalone `pnpm test` succeeded; the audit:docx-slot-inventory first in `verify:full` may be the trigger. **Not resolved.**

### `pnpm verify:ci`

Definition (from package.json line 50):
`pnpm verify:full && pnpm audit:templates && pnpm smoke:bm001-shadow-render && pnpm audit:docx:verify-locked:ci && pnpm gate:forms:213 --allow-source-unknown && node scripts/audit/apply-all-current-evidence.mjs --check`

My fresh run: exit 0. But `verify:full` (which this command depends on) failed standalone. **Two possibilities:**

1. The `&&` chain does not propagate failure on Windows pwsh → cmd → pnpm layering. So `verify:ci`'s exit 0 is **misleading**.
2. My `verify:full` failure was a one-off flake. The next `verify:ci` would fail.

I cannot resolve this from log analysis alone.

**Codex's claim that `verify:ci` exits 0 is technically reproducible, but a wrapper that exits 0 while a sub-command is broken by the wrapper itself is misleading.**

## `pnpm docker:verify`

Definition: `node scripts/docker-verify.mjs`.
Not independently re-run (would force a destructive Docker build). **NOT_RUN.**

## `node scripts/audit/apply-all-current-evidence.mjs --check`

- Default mode is check, returns exit 0 with `mode: "check", status: "PASS"`.
- Exit 0 reports the right status.
- **Truthful on the JSON output.**
- Idempotence: NOT independently verified (no disposable workspace created).

## Recommendations to next phase

1. **Make `verify:full` exit code authoritative** in CI — if it fails, fail the build. Codex's CI workflow uses `verify:ci` and may be hiding this failure.
2. **Audit `pnpm audit:docx-slot-inventory`** for side effects on disk that may interact with downstream tests.
3. **Rewrite `apply-all-current-evidence.mjs`** so its check mode AND apply mode are independently tested for idempotence using a disposable copy of the working tree.
4. **Document the wrapper-vs-individual rule** in the running agreement.
5. **Audit the WHO has the right to declare** a wrapper "PASS" if any sub-command's exit code differs from the wrapper's.

## Verdict

- `verify:quick`: truthful.
- `verify:full`: truthful on wrapper exit, but the underlying situation is **reported by the wrapper correctly**; the discrepancy is with Codex's own claim that "all tests pass".
- `verify:ci`: **conditionally truthful**; the contradiction between verify:ci 0 and verify:full 1 must be resolved before this audit can sign off.
- `apply-all-current-evidence --check`: truthful.
- `docker-verify`: not re-run; assumed truthful but unverified.

**Most serious finding: `verify:ci` exit 0 with `verify:full` exit 1 is a wrapper-truthfulness violation per Codex's own honesty rules.**

## Appendix A — Captured `verify:ci` run (terminal id 898232)

A backgrounded re-invocation of `pnpm verify:ci` (command: `cd "d:\Study\Project\QLLaw-main"; pnpm verify:ci 2>&1 | Select-String -Pattern "PASS|FAIL|matrixPass|...|EXIT" | Select-Object -First 30`) terminated with exit code `4294967295` (Windows abort / signal), elapsed 87.73 s.

Captured output (selected lines, in order):

- `passCount: 213, failCount: 0` (one suite passes cleanly)
- `Runtime hardcode audit passed.`
- `# pass 17 / # fail 0` (infrastructure guard suite)
- `# pass 103 / # fail 0` (contract-sync guard suite)
- `FAIL src/modules/documents/rendering/infrastructure/representative-bms-render.spec.ts` — `ENOENT: no such file or directory ... qllaw-e2-render-six-bms\BM-053\...\format-audit.json`
- `FAIL src/modules/documents/runtime-preview-session.service.spec.ts` — `keeps DOCX session downloadable when PDF generation fails`
- `FAIL src/modules/documents/rendering/infrastructure/docx-inspection/docx-inspection-rendered-preservation.spec.ts`
- `[ContractSyncGuard] File-only mode fails closed when any compiled artifact is missing.` (warning repeated)
- `[ContractSyncGuard] ✅ Contract sync guard passed` (log line)

Interpretation:

1. **`verify:ci` is not a clean green gate.** Multiple FAIL lines were emitted during the run before the process was aborted.
2. The `ENOENT` for `BM-053/format-audit.json` is the same shadow-state / transient-artifact failure pattern surfaced under CRIT-03 (BM-001, BM-171 shadow DOCX). The pattern is not confined to `verify:full` — it also appears under `verify:ci`.
3. `[ContractSyncGuard] File-only mode fails closed when any compiled artifact is missing` is a structural warning that **the guard is doing its job** but the inputs are not always present, which is a regression risk for the canonical matrix.
4. Exit code `4294967295` (`-1` / Windows abort) is **not a normal exit code** — it indicates the process was killed externally (likely by the wrapper grep pipe terminating prematurely or by an `elapsed_ms` budget overrun). The wrapper did NOT report a clean 0 or 1.

**This run materially strengthens CRIT-02 (wrapper truthfulness) and CRIT-03 (shadow-DOCX state race).**