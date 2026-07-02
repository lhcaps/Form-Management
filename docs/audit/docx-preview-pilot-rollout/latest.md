# DOCX Preview Pilot Rollout Quality Report

Generated: 2026-07-02T16:45:00Z
Branch: `feat/docx-preview-pilot-rollout`
Base HEAD: `741a43680e30fcf3532cd32249eef4e59557dc45`

## Scope

- Reviewed the merged PR chain `#21` through `#30`.
- Fixed current dev runtime/database blockers found during the pilot smoke.
- Validated real generated documents for `BM-001` and `BM-039`.
- Did not modify DOCX templates, locked contracts, or form semantic contracts.
- Did not add product features.

## PR #21-#30 Status

All ten PRs are merged into `main`. GitHub status rollup for each PR showed successful Static verification, Docker production build, and Vercel preview status at merge time.

| PR | Title | Merge commit | Merged at | Checks |
|---|---|---:|---|---|
| #21 | Clerk canonical auth workflow and API token bridge | `403b86e` | 2026-07-01T19:14:26Z | Green |
| #22 | Auth Phase 2A - Agency Resource Authorization for Cases and Generated Files | `1672f43` | 2026-07-01T20:30:23Z | Green |
| #23 | Auth Phase 2B - Clerk DB Identity Projection and Webhook Sync | `a4a4009` | 2026-07-01T21:31:50Z | Green |
| #24 | Auth Phase 2C - Clerk Identity Linking Admin Workflow | `725b745` | 2026-07-01T22:18:32Z | Green |
| #25 | Admin UX - Place Identity Linking in App Shell | `78a13f8` | 2026-07-02T09:20:17Z | Green |
| #26 | Auth Phase 2E - Form Permission Admin Scope Hardening | `eb53c80` | 2026-07-02T11:12:19Z | Green |
| #27 | feat(auth): harden env csrf production config | `e20e2df` | 2026-07-02T11:49:58Z | Green |
| #28 | Generated Documents -- Export History and Audit Trail | `b7c8a7b` | 2026-07-02T12:50:00Z | Green |
| #29 | Generated Documents Audit P2 -- Generation and Denied Access | `3de75f9` | 2026-07-02T14:01:20Z | Green |
| #30 | Advanced DOCX Preview and Style Foundation | `741a436` | 2026-07-02T16:05:46Z | Green |

## Fixes Applied

1. Active contract renders now register their DOCX output in `stored_files` and `generated_document_files`.
   - Before: `BM-001` active render wrote a physical DOCX but returned no file metadata, so preview/file history could not reliably find the active DOCX.
   - After: `renderActive()` returns `DocumentRenderResult`, records the DOCX, marks previous DOCX rows non-final, updates `validation_result`, and writes a case event.

2. Preview sample-data resource lookup now works in source and compiled runtimes.
   - Before: compiled runtime resolved `apps/api/dist/resources/...`, causing `/documents/preview/sample-data` to return an empty set.
   - After: resolver first uses repo-root `apps/api/resources/preview-sample-data/vks-khu-vuc-7.json`, with source and compiled fallbacks.

3. Dev DB audit-log migration was applied.
   - Pending migration: `20260702_generated_document_audit_logs`.
   - Applied to root-env dev DB `127.0.0.1:3307/quanlyvks`.
   - Audit write smoke: create-batch returned `201`; generated document `103` audit history returned `1` entry.

## Runtime Evidence

| Check | Result |
|---|---|
| `pnpm dev` readiness | PASS: API health 200, API ready 200, forms catalog 213 locked, web `/healthz` 200 |
| API login `/auth/login` | PASS: `admin` role `ADMIN` |
| `/auth/me` | PASS |
| `/forms/catalog` | PASS: 213 |
| `/documents/preview/sample-data` | PASS: 64 values across `person`, `agency`, `case`, `offense`, `general` |
| Unauthorized preview audit | PASS: 401 for both pilot docs |
| Response sanitization | PASS: no Windows path, `storage/generated`, cookie, token, or password exposure detected |

### Pilot Documents

| Document | Template | DOCX file | Preview PDF | Audit |
|---|---|---|---|---|
| `101` | `BM-001` | file `10`, `BM-001_active_20260702-232058.docx`, 115377 bytes | PDF file `17` | WARN: 11 pass, 8 warning, 0 fail |
| `102` | `BM-039` | file `9`, `BM-039_Lenh-bat-bi-can-bi-tam-giam_TEST-001_Ho-so_v001_20260702-231504.docx`, 24930 bytes | PDF file `18` | FAIL: 9 pass, 7 warning, 1 fail |

`BM-039` fail is a real style finding, not patched here: `FMT-001` Normal style is not Times New Roman 13pt.

## Frontend Smoke

- Default Clerk-mode route protection redirects `/documents/101` to `/sign-in` without a real Clerk session.
- Default dev logs also showed a Clerk refresh redirect-loop warning, consistent with a Clerk key/session mismatch in the local browser session.
- A local legacy-mode web smoke was run with Clerk env blank, `qlv_session`, and the same API session cookie:
  - `/documents/101` rendered.
  - `Xem trước bản in` tab rendered audit badge and findings.
  - `Tải lại` completed with 0 browser errors.
  - `Lịch sử xử lý` rendered DOCX/PDF events with 0 browser errors.
- Screenshot artifact: `output/playwright/docx-preview-p2/.playwright-cli/page-2026-07-02T16-37-57-995Z.png` (local, not staged).

## Verification

| Command | Result |
|---|---|
| `pnpm --filter api test --runInBand` | PASS: 62 suites, 498 tests |
| Focused API tests | PASS: 3 suites, 30 tests |
| `pnpm --filter api lint` | PASS |
| `pnpm --filter api exec tsc --noEmit` | PASS |
| `pnpm --filter web lint` | PASS |
| `pnpm --filter web exec tsc --noEmit` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm audit:hardcode` | PASS |
| `pnpm prisma:migrate:status` | PASS: DB schema up to date |
| `pnpm --filter api exec prisma validate` | PASS |
| `pnpm audit:locked-compiled` | PASS: 213/213 consistent |
| `pnpm audit:contract-sync` | PASS: DB_COMPARE 213 matched, 0 missing, 0 stale |
| `pnpm build` | PASS |
| `pnpm exec prisma validate` | FAIL: root workspace has no root-level Prisma CLI binary; use API/package script instead |

## Residual Findings

1. `P1` Default Clerk-mode UI smoke is not complete without a real Clerk session/testing token.
   - Impact: internal API `admin` session alone cannot validate protected web routes under Clerk mode.
   - Evidence: `/documents/101` redirected to `/sign-in?return_url=%2Fdocuments%2F101`; dev logs showed Clerk refresh redirect-loop warning.

2. `P2` Local ignored `apps/api/.env` can shadow root DB settings for raw package Prisma CLI commands.
   - Impact: `pnpm --filter api exec prisma migrate status` targeted stale `localhost:3306/qllaw_dev` and failed with `Unknown authentication plugin sha256_password`.
   - Mitigation: project scripts `pnpm prisma:migrate:status` and `pnpm prisma:migrate:deploy` load `../../.env` and work correctly.

3. `P2` Build emits existing duplicate package-script warnings for `audit:source-remediation:proposal` and `audit:source-remediation:apply`.
   - Impact: warning only; build passed.

4. `P2` Environment runs Node `v24.14.0` while package engines request `>=22 <23`.
   - Impact: warning only in this pass; all tests/build passed.

## Recommendation

Do not merge further DOCX preview rollout work until the Clerk-mode browser smoke has a deterministic test user/token path. The backend/runtime foundation is now healthy for the pilot docs, and the remaining `BM-039` style failure should be handled as template/style remediation in a separate approved task.
