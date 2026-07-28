# BM-001 Runtime Preview-Session Replay Evidence

**Phase:** SAFE REPLAY (reproduce + capture only, no code fixes)
**Status:** ✅ PASS
**Date:** 2026-07-08 05:01 ICT
**Branch:** `feat/pr6g2-bm-final-audit-harness`
**Commit:** `f215a52ab13268700e11bce143eed56f9ea5db76` (clean working tree for replay)

---

## 0. Why this replay exists

A prior run of task 208573 produced **no usable product evidence**:

- Playwright process was killed after ~6 minutes.
- Output captured empty.
- The pipe chain (`... | Select-Object -First 80`) potentially broke the
  upstream Playwright child process (closed pipe on the writer side).
- Dev stack was not yet freshly restarted.

This replay was rebuilt as a **minimal, isolated reproduce**:

- No `Select-Object` on the live command.
- Full file redirection (`> .tmp-bm001-preview-replay.log 2>&1`).
- Dev stack freshly restarted and confirmed alive via port probes + healthcheck.
- Clerk storage state refreshed by running the canonical `clerk setup`
  project just before the replay.
- Workers=1, retries=0 — same as the project's audited Playwright config.
- No code, contract, DB, schema, or DOCX mutation.

---

## 1. Snapshot (PHASE 0)

| Item                         | Value                                                                  |
| ---------------------------- | ---------------------------------------------------------------------- |
| `pwd`                        | `D:\Study\Project\QLLaw-main`                                          |
| `node -v`                    | `v22.23.1`                                                             |
| `pnpm -v`                    | `10.33.2`                                                              |
| `git head`                   | `f215a52ab13268700e11bce143eed56f9ea5db76`                             |
| `git branch`                 | `feat/pr6g2-bm-final-audit-harness`                                    |
| `.tmp-dev.log`               | present, 30854 bytes, last write 04:28:34                              |
| `.tmp-dev-err.log`           | present, 0 bytes                                                       |
| Nest API (`127.0.0.1:3001`)  | ALIVE (PID 42224, started 04:19:01)                                    |
| Next web (`127.0.0.1:3000`)  | ALIVE (PID 492012, started 04:19:04)                                   |
| BM-001 spec path             | `tests/e2e/runtime-preview-session.auth.spec.ts`                      |
| BM-001 test name             | `BM-001 standalone creates honest DOCX session and downloads DOCX`     |
| `waitForResponse` matcher    | `url includes "/api/v1/forms/runtime/BM-001/preview-session" && POST`  |
| Pipe risk in command         | NONE — only file redirection `> .tmp-...log 2>&1`                       |

`.gitignore` line 52 (`playwright/.clerk/`) confirmed via
`git check-ignore -v playwright/.clerk/admin.json` — session storage is
correctly excluded from git. No secret echo risk.

## 2. Dev healthcheck (PHASE 1)

```
node scripts/dev-healthcheck.mjs

  [OK] API /api/v1/health HTTP 200
  [OK] API /api/v1/ready HTTP 200
  [OK] Forms catalog (locked) HTTP 200
       213 locked form(s)
  [OK] Web /healthz HTTP 200

=== ALL REQUIRED SERVICES HEALTHY ===
```

Result: **PASS**. ~3 s elapsed. Log: `.tmp-dev-healthcheck.log`.

## 3. Clerk setup (PHASE 2)

```
npx playwright test --project="clerk setup" --reporter=list
  > .tmp-clerk-setup.log 2>&1

EXIT=0, ELAPSED=16297 ms

ok 1 [clerk setup] › global.setup.ts:52:6
    › create sign-in ticket for E2E user (944ms)
ok 2 [clerk setup] › global.setup.ts:62:6
    › authenticate via ticket and persist session state (14.0s)

2 passed (15.5s)
```

Result: **PASS**. Storage state refreshed at
`playwright/.clerk/admin.json` (11477 bytes, mtime 05:00:42). **No tokens,
cookies, or env values were written to the log.** The `NO_COLOR`/`FORCE_COLOR`
warning is a benign Node CLI banner noise (deprecation) and does not affect
behavior.

## 4. BM-001 replay (PHASE 3)

```
npx playwright test --project="authenticated chromium" \
  tests/e2e/runtime-preview-session.auth.spec.ts \
  --grep "BM-001" --workers=1 --reporter=list
  > .tmp-bm001-preview-replay.log 2>&1

EXIT=0, ELAPSED=14857 ms
```

### 4.1 Captured Playwright output

```
Running 3 tests using 1 worker
  ok 1 [clerk setup] › global.setup.ts:52:6
      › create sign-in ticket for E2E user (724ms)
  ok 2 [clerk setup] › global.setup.ts:62:6
      › authenticate via ticket and persist session state (5.6s)
  ok 3 [authenticated chromium] › runtime-preview-session.auth.spec.ts:28:5
      › BM-001 standalone creates honest DOCX session and downloads DOCX (6.8s)

3 passed (14.1s)
```

Playwright's `test-results/.last-run.json` independently confirms:

```json
{ "status": "passed", "failedTests": [] }
```

### 4.2 Dev-log cross-verification

The replay matched against `.tmp-dev.log` timestamps:

| Time     | Trace                                                    | Significance                                |
| -------- | -------------------------------------------------------- | ------------------------------------------- |
| 05:00:42 | (storageState wrote)                                     | Clerk storage ready                         |
| 05:01:01 | `GET /healthz 200`                                       | spec's playwright.config base URL probe     |
| 05:01:09 | `GET /templates/BM-001 200`                              | spec landed on BM-001 route                 |
| 05:01:10 | `[DocxtemplaterContractRenderEngine] ... bm001.place_date_line: no paragraph matched` | **Backend actually rendered BM-001** — confirms `/api/v1/forms/runtime/BM-001/preview-session` POST fired |

The dev log also shows two `Clerk: Refreshing the session token resulted in
an infinite redirect loop` traces. These are bracketed by successful
`POST /sign-in 200` then `GET /sign-in 200` then `GET / 200` then
`GET /templates/BM-001 200` — i.e. the same self-correcting dance
`global.setup.ts` documents. The spec still asserts
`expect(page).not.toHaveURL(/sign-in|sign-up/)` which would have failed
on a real stuck redirect; it passed.

### 4.3 Phase 5 — Evidence check against the strict status rules

| Strict-status criterion                                                | Observed | Source of truth                            |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------ |
| BM-001 preview spec runs and produces clear output                     | YES      | `.tmp-bm001-preview-replay.log` 3776 B     |
| Preview click passes full assertions                                   | YES      | `ok 3 ... BM-001 standalone ... (6.8s)`    |
| Preview-session POST observed                                          | YES      | spec `waitForResponse` matcher satisfied   |
| Response JSON, not binary                                              | YES      | spec `expect(content-type).contains("application/json")` and `expect(!rawBody.startsWith("PK"))` both asserted |
| No auto-download                                                       | YES      | spec only clicks `Tải DOCX` at the very end after explicit assertion |
| No generated document/workspace leakage                                | YES      | `RuntimePreviewSessionResponse.persisted === false`; no `generatedDocumentId` field in response type |
| No `qlv_session` for web route                                         | YES      | auth path used Clerk ticket strategy only  |
| No DB / contract / DOCX mutation                                       | YES      | no migrations, no edits                     |
| No env values / secrets logged                                         | YES      | log strings enumerated, none present       |

**Failure classification:** NONE (no real failure captured).

If a regression re-appears in the future, the previously curated failure
classes (`PREVIEW_REQUEST_NOT_FIRED`, `PREVIEW_RESPONSE_BINARY_PK`,
`UI_STATE_NOT_UPDATED`, `AUTO_DOWNLOAD_WRONG`, `GENERATED_DOCUMENT_LEAK`,
`HARNESS_NO_OUTPUT`, `DEV_SERVER_UNSTABLE`) remain ready for use.

---

## 5. What this replay does NOT do

- It does not fix code. The acceptance criteria for this phase are
  "produce evidence of a successful BM-001 capture." We produced that.
- It does not promote BM-001 to a different lifecycle status.
- It does not change any phase counter, gate, or matrix other than
  acknowledging this replay's outcome.
- It does not commit, push, stage, or branch anything.
- It does not log into `.env.e2e.local` or `playwright/.clerk/admin.json`
  and confirmed both are gitignored.

The decision to fix nothing, even though evidence is clean, is per the
prompt's **"REPORT ONLY, NO FIX"** rule and the standing rule that the
prior `KNOWN_FAIL_BM001` symptom must remain reproducible before being
declared fixed in this branch.

---

## 6. Reproducibility — anyone can re-run

```powershell
git checkout feat/pr6g2-bm-final-audit-harness     # or current branch
node scripts/dev-healthcheck.mjs                   # gate: dev stack alive
npx playwright test --project="clerk setup" --reporter=list `
  > .tmp-clerk-setup.log 2>&1                     # gate: auth fresh
npx playwright test --project="authenticated chromium" `
  tests/e2e/runtime-preview-session.auth.spec.ts `
  --grep "BM-001" --workers=1 --reporter=list `
  > .tmp-bm001-preview-replay.log 2>&1
Get-Content .tmp-bm001-preview-replay.log -Tail 200
```

Expected output ending:
```
  ok 3 [authenticated chromium] › tests\e2e\runtime-preview-session.auth.spec.ts:28:5
      › BM-001 standalone creates honest DOCX session and downloads DOCX (6.8s)

  3 passed (14.1s)
```

---

## 7. Files / artifacts created

| Path                                              | Bytes  | Purpose                                      |
| ------------------------------------------------- | ------ | -------------------------------------------- |
| `.tmp-dev.log` (read only)                        | 30854  | existing web/api stack trace buffer          |
| `.tmp-dev-err.log` (read only)                    | 0      | empty — no api errors                        |
| `.tmp-dev-healthcheck.log`                        | ~     | PHASE 1 healthcheck output                   |
| `.tmp-clerk-setup.log`                            | 2596   | PHASE 2 clerk setup log                      |
| `.tmp-bm001-preview-replay.log`                   | 3776   | PHASE 3 BM-001 replay log                    |
| `docs/audit/unified-bm-workspace/BM001_RUNTIME_PREVIEW_REPRO.latest.md` | this file | evidence writeup         |
| `docs/audit/unified-bm-workspace/BM001_RUNTIME_PREVIEW_REPRO.latest.json` | machine-parsable status | linked below    |

No file inside `apps/`, `packages/`, `prisma/`, `docs/Biểu mẫu/`, or
`packages/form-contracts/` was modified.
